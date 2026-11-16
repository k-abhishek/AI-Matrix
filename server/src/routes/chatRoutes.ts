import { FastifyPluginAsync } from "fastify";
import chatService from "../modules/chat/chat.service";
import logger from "../lib/logger";

interface ChatRequestBody {
  prompt: string;
  chatId?: string;
}

interface ChatIdParams {
  chatId: string;
}

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/chat
   * Sends a user prompt to the LangChain Groq agent.
   * Leverages ChatService and ChatRepository for MongoDB conversation persistence.
   */
  fastify.post<{ Body: ChatRequestBody }>(
    "/",
    {
      schema: {
        description:
          "Send a prompt to the LangChain agent with conversation persistence in MongoDB and knowledge base retrieval",
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
            description: "Agent response with chatId, tool calls, and citations",
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
              citations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    pageId: { type: "string" },
                    crawlerId: { type: "string" },
                    url: { type: "string" },
                    title: { type: "string" },
                    score: { type: "number" },
                    snippet: { type: "string" },
                  },
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
      const { prompt, chatId } = req.body;

      if (!prompt || prompt.trim() === "") {
        return reply.status(400).send({ error: "Prompt cannot be empty" });
      }

      try {
        const response = await chatService.sendMessage({ prompt, chatId });
        return reply.status(200).send(response);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        logger.error(`Error in POST /api/chat:`, err);
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
                    role: { type: "string", enum: ["user", "assistant", "tool", "system"] },
                    content: { type: "string" },
                    toolCalls: {
                      type: "array",
                      items: { type: "object", additionalProperties: true },
                    },
                    citations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          pageId: { type: "string" },
                          crawlerId: { type: "string" },
                          url: { type: "string" },
                          title: { type: "string" },
                          score: { type: "number" },
                          snippet: { type: "string" },
                        },
                      },
                    },
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

      try {
        const thread = await chatService.getThread(chatId);

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
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to retrieve chat thread";
        logger.error(`Error in GET /api/chat/${chatId}:`, err);
        return reply.status(500).send({ error: errorMessage });
      }
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
        description: "Fetch all conversations with chatId, title, and timestamp",
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
                updatedAt: { type: "string", format: "date-time" },
                createdAt: { type: "string", format: "date-time" },
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
        const threads = await chatService.listThreads();
        return reply.status(200).send(threads);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch conversations";
        logger.error("Error in GET /api/chat:", err);
        return reply.status(500).send({ error: errorMessage });
      }
    },
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
        const deleted = await chatService.deleteThread(chatId);

        if (!deleted) {
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
    },
  );
};

export default chatRoutes;
