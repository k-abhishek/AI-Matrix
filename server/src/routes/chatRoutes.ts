import { FastifyPluginAsync } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { ChatGroq } from "@langchain/groq";
import { createAgent } from "langchain";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { websiteScraperTool } from "../tools/agentTools";
import { ChatThread } from "../models/ChatThread";
import logger from "../lib/logger";

interface ChatRequestBody {
  prompt: string;
  chatId?: string;
}

interface ChatIdParams {
  chatId: string;
}

interface GetMessagesBody {
  chatId: string;
}

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/chat
   * Sends a user prompt to the LangChain Groq agent.
   * If chatId is omitted, a new UUID is generated as threadId.
   * Prior context from MongoDB is reconstructed and fed to LangChain.
   * Messages, tool calls, and assistant replies are saved to MongoDB.
   */
  fastify.post<{ Body: ChatRequestBody }>(
    "/",
    {
      schema: {
        description:
          "Send a prompt to the LangChain agent with conversation persistence in MongoDB",
        tags: ["Chat"],
        summary: "Send chat message",
        body: {
          type: "object",
          required: ["prompt"],
          properties: {
            prompt: {
              type: "string",
              description: "The user message or research prompt",
            },
            chatId: {
              type: "string",
              description:
                "Optional threadId/chatId UUID to continue an existing conversation",
            },
          },
        },
        response: {
          200: {
            description: "Agent response with chatId and tool call information",
            type: "object",
            properties: {
              chatId: { type: "string" },
              message: { type: "string" },
              toolCalls: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: true,
                },
              },
            },
          },
          400: {
            description: "Missing or invalid prompt",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          500: {
            description: "Error response",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { prompt } = req.body;
      const chatId =
        req.body.chatId && req.body.chatId.trim() !== ""
          ? req.body.chatId.trim()
          : uuidv4();

      try {
        // Retrieve or initialize conversation in MongoDB
        let thread = await ChatThread.findOne({ chatId });
        const smallTitle = prompt.trim().replace(/\s+/g, " ").slice(0, 50);

        if (!thread) {
          thread = new ChatThread({
            chatId,
            title: smallTitle,
            messages: [],
          });
        } else if (!thread.title || thread.title.trim() === "") {
          thread.title = smallTitle;
        }

        // Reconstruct conversation history context for LangChain
        const historyMessages: (HumanMessage | AIMessage | SystemMessage)[] =
          [];
        for (const msg of thread.messages) {
          if (msg.role === "user") {
            historyMessages.push(new HumanMessage(msg.content));
          } else if (msg.role === "assistant") {
            historyMessages.push(new AIMessage(msg.content));
          } else if (msg.role === "system") {
            historyMessages.push(new SystemMessage(msg.content));
          }
        }

        // Append current user prompt
        historyMessages.push(new HumanMessage(prompt));

        // Initialize Groq Model
        const model = new ChatGroq({
          apiKey:
            process.env.GROQ_API_KEY ||
            process.env.LANGCHAIN_GROQ_API_KEY ||
            "",
          model: "openai/gpt-oss-20b",
          temperature: 0.7,
        });

        // Initialize LangChain agent with tools
        const agent = createAgent({
          model,
          tools: [websiteScraperTool],
          systemPrompt: `
            You are a helpful and intelligent AI research assistant mota.
            You have access to a website scraper tool to retrieve real-time website contents when needed.
            Always provide polite, comprehensive, and well-structured answers.
            When generating Mermaid diagrams, always wrap node labels in double quotes if they contain parentheses, brackets, commas, or special characters (e.g. Node["Label (Details)"]).
          `,
        });

        // Invoke agent with full conversation history
        const result = await agent.invoke({
          messages: historyMessages,
        });

        // Extract tool calls from agent execution messages
        // const extractedToolCalls: IToolCall[] = [];
        // if (Array.isArray(result.messages)) {
        //   for (const msg of result.messages) {
        //     // Check for tool calls made by assistant
        //     if ('tool_calls' in msg && Array.isArray((msg as any).tool_calls)) {
        //       for (const tc of (msg as any).tool_calls) {
        //         extractedToolCalls.push({
        //           name: tc.name || 'tool',
        //           args: tc.args,
        //           toolCallId: tc.id,
        //         });
        //       }
        //     }
        //     // Check for tool execution result messages
        //     if (
        //       (typeof (msg as any)._getType === 'function' && (msg as any)._getType() === 'tool') ||
        //       (msg as any).role === 'tool'
        //     ) {
        //       const toolCallId = (msg as any).tool_call_id;
        //       const matching = extractedToolCalls.find((tc) => tc.toolCallId === toolCallId);
        //       if (matching) {
        //         matching.output = msg.content;
        //       } else {
        //         extractedToolCalls.push({
        //           name: (msg as any).name || 'tool',
        //           toolCallId,
        //           output: msg.content,
        //         });
        //       }
        //     }
        //   }
        // }

        // Extract last assistant response
        const lastMessage = result.messages.at(-1);
        const assistantContent =
          typeof lastMessage?.content === "string"
            ? lastMessage.content
            : JSON.stringify(lastMessage?.content ?? "");

        // Persist user prompt to MongoDB
        thread.messages.push({
          role: "user",
          content: prompt,
          createdAt: new Date(),
        });

        // Persist assistant reply with any tool calls to MongoDB
        thread.messages.push({
          role: "assistant",
          content: assistantContent,
          //toolCalls: extractedToolCalls.length > 0 ? extractedToolCalls : undefined,
          createdAt: new Date(),
        });

        await thread.save();

        return reply.status(200).send({
          chatId,
          message: assistantContent,
          //toolCalls: extractedToolCalls,
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        logger.error(`Error in /api/chat for chatId=${chatId}:`, err);
        return reply.status(500).send({ error: errorMessage });
      }
    },
  );

  /**
   * GET /api/chat/:chatId
   * Retrieve chat thread history by chatId
   */
  fastify.get<{ Params: ChatIdParams }>(
    "/:chatId",
    {
      schema: {
        description: "Fetch chat thread messages by chatId",
        tags: ["Chat"],
        summary: "Get chat messages by chatId",
        params: {
          type: "object",
          properties: {
            chatId: { type: "string" },
          },
          required: ["chatId"],
        },
        response: {
          200: {
            description: "Chat thread history",
            type: "object",
            properties: {
              chatId: { type: "string" },
              title: { type: "string" },
              messages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    role: { type: "string", enum: ["user", "assistant", "system"] },
                    content: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                  required: ["role", "content"],
                },
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          404: {
            description: "Chat thread not found",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          500: {
            description: "Error response",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { chatId } = req.params;
      const thread = await ChatThread.findOne({ chatId });

      if (!thread) {
        return reply.status(404).send({ error: "Chat thread not found" });
      }

      return reply.status(200).send({
        chatId: thread.chatId,
        title: thread.title,
        messages: thread.messages,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      });
    },
  );

  /**
   * GET /api/chat
   * Retrieve list of all conversations (chatId and title)
   */
  fastify.get(
    "/",
    {
      schema: {
        description: "Fetch all conversations with chatId and title",
        tags: ["Chat"],
        summary: "Get all chat conversations",
        response: {
          200: {
            description: "List of conversations",
            type: "array",
            items: {
              type: "object",
              properties: {
                chatId: { type: "string" },
                title: { type: "string" },
              },
              required: ["chatId", "title"],
            },
          },
          500: {
            description: "Error response",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (_req, reply) => {
      try {
        const threads = await ChatThread.find(
          {},
          { chatId: 1, title: 1, messages: 1 }
        )
          .slice("messages", 1)
          .sort({ updatedAt: -1 })
          .lean();

        const result = threads.map((thread: any) => {
          let title = thread.title;
          if (!title || title.trim() === "") {
            title =
              thread.messages?.[0]?.content?.trim().replace(/\s+/g, " ").slice(0, 50) ||
              "New Chat";
          }
          return {
            chatId: thread.chatId,
            title,
          };
        });

        return reply.status(200).send(result);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch conversations";
        logger.error("Error in GET /api/chat:", err);
        return reply.status(500).send({ error: errorMessage });
      }
    }
  );

  /**
   * DELETE /api/chat/:chatId
   * Delete a chat conversation thread by chatId
   */
  fastify.delete<{ Params: ChatIdParams }>(
    "/:chatId",
    {
      schema: {
        description: "Delete a chat conversation thread by chatId",
        tags: ["Chat"],
        summary: "Delete chat thread",
        params: {
          type: "object",
          properties: {
            chatId: { type: "string" },
          },
          required: ["chatId"],
        },
        response: {
          200: {
            description: "Chat thread deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              chatId: { type: "string" },
            },
          },
          404: {
            description: "Chat thread not found",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          500: {
            description: "Error response",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { chatId } = req.params;

      try {
        const deletedThread = await ChatThread.findOneAndDelete({ chatId });

        if (!deletedThread) {
          return reply.status(404).send({ error: "Chat thread not found" });
        }

        return reply.status(200).send({
          success: true,
          message: "Chat thread deleted successfully",
          chatId,
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete chat thread";
        logger.error(`Error deleting chat thread chatId=${chatId}:`, err);
        return reply.status(500).send({ error: errorMessage });
      }
    }
  );
};

export default chatRoutes;
