import crypto from "crypto";
import { ChatGroq } from "@langchain/groq";
import { createAgent } from "langchain";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { vectorKnowledgeBaseTool } from "../../tools";
import chatRepository, {
  ChatRepository,
  ChatThreadSummary,
} from "./chat.repository";
import {
  IChatMessage,
  IToolCall,
  IChatCitation,
  IChatThread,
} from "../../models/ChatThread";
import env from "../../config/env";
import logger from "../../lib/logger";

export interface SendMessageInput {
  prompt: string;
  chatId?: string;
}

export interface SendMessageResponse {
  chatId: string;
  message: string;
  toolCalls: IToolCall[];
  citations: IChatCitation[];
}

export class ChatService {
  constructor(private repo: ChatRepository = chatRepository) {}

  /**
   * Executes a conversational agent turn:
   * 1. Re-hydrates message history from MongoDB.
   * 2. Instantiates LangChain agent with ChatGroq and tools (scraper + vector knowledge base).
   * 3. Invokes the agent with conversation history.
   * 4. Extracts message content, tool call metadata, and citations.
   * 5. Atomically appends user and assistant messages into MongoDB.
   */
  async sendMessage(input: SendMessageInput): Promise<SendMessageResponse> {
    const prompt = input.prompt.trim();
    const chatId =
      input.chatId && input.chatId.trim() !== ""
        ? input.chatId.trim()
        : crypto.randomUUID();

    const titleSnippet = prompt.replace(/\s+/g, " ").slice(0, 50);

    // 1. Ensure conversation thread exists in MongoDB
    const thread = await this.repo.findOrCreate(chatId, titleSnippet);

    // 2. Reconstruct conversation history context for LangChain
    const historyMessages: (HumanMessage | AIMessage | SystemMessage)[] = [];
    for (const msg of thread.messages) {
      if (msg.role === "user") {
        historyMessages.push(new HumanMessage(msg.content));
      } else if (msg.role === "assistant") {
        historyMessages.push(new AIMessage(msg.content));
      } else if (msg.role === "system") {
        historyMessages.push(new SystemMessage(msg.content));
      }
    }

    // Append the new user prompt
    historyMessages.push(new HumanMessage(prompt));

    // 3. Initialize Groq model & LangChain agent
    const apiKey = env.GROQ_API_KEY || process.env.LANGCHAIN_GROQ_API_KEY || "";
    const model = new ChatGroq({
      apiKey,
      model: env.AGENT_MODEL,
      temperature: 0.7,
    });

    const agent = createAgent({
      model,
      tools: [vectorKnowledgeBaseTool],
      systemPrompt: `
        You are a helpful and intelligent AI research assistant Matrix.
        You have access to the search_knowledge_base tool to search the indexed documentation and crawled website database. Always check this first when answering questions about indexed websites or documentation.

        Always provide polite, comprehensive, and well-structured answers.
        When citing information from the knowledge base, reference the source URLs.
        When generating Mermaid diagrams, always wrap node labels in double quotes if they contain parentheses, brackets, commas, or special characters (e.g. Node["Label (Details)"]).
      `,
    });

    // 4. Invoke agent
    const result = await agent.invoke({
      messages: historyMessages,
    });

    // 5. Extract tool calls and citations from message chain
    const extractedToolCalls: IToolCall[] = [];
    const extractedCitations: IChatCitation[] = [];

    if (Array.isArray(result.messages)) {
      for (const msg of result.messages) {
        const rawMsg = msg as any;

        // Collect tool calls requested by assistant
        if (rawMsg.tool_calls && Array.isArray(rawMsg.tool_calls)) {
          for (const tc of rawMsg.tool_calls) {
            extractedToolCalls.push({
              name: tc.name || "tool",
              args: tc.args,
              toolCallId: tc.id,
            });
          }
        }

        // Collect tool outputs
        if (
          (typeof rawMsg._getType === "function" &&
            rawMsg._getType() === "tool") ||
          rawMsg.role === "tool"
        ) {
          const toolCallId = rawMsg.tool_call_id;
          const matching = extractedToolCalls.find(
            (tc) => tc.toolCallId === toolCallId,
          );
          if (matching) {
            matching.output = rawMsg.content;
          }

          // Extract citations if this tool output was from search_knowledge_base
          try {
            const parsed =
              typeof rawMsg.content === "string"
                ? JSON.parse(rawMsg.content)
                : rawMsg.content;
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (item && item.url) {
                  extractedCitations.push({
                    pageId: item.pageId,
                    crawlerId: item.crawlerId,
                    url: item.url,
                    title: item.title,
                    score:
                      typeof item.score === "number" ? item.score : undefined,
                    snippet:
                      typeof item.content === "string"
                        ? item.content.slice(0, 300)
                        : undefined,
                  });
                }
              }
            }
          } catch {
            // Not a JSON citation list
          }
        }
      }
    }

    // Deduplicate citations by URL
    const seenUrls = new Set<string>();
    const uniqueCitations = extractedCitations.filter((c) => {
      if (seenUrls.has(c.url)) return false;
      seenUrls.add(c.url);
      return true;
    });

    // Extract the final assistant reply
    const lastMessage = result.messages.at(-1);
    const assistantContent =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage?.content ?? "");

    // 6. Persist user and assistant messages in MongoDB
    const now = new Date();
    const newMessages: IChatMessage[] = [
      {
        role: "user",
        content: prompt,
        createdAt: now,
      },
      {
        role: "assistant",
        content: assistantContent,
        toolCalls:
          extractedToolCalls.length > 0 ? extractedToolCalls : undefined,
        citations: uniqueCitations.length > 0 ? uniqueCitations : undefined,
        createdAt: new Date(),
      },
    ];

    await this.repo.appendMessages(chatId, newMessages, titleSnippet);

    return {
      chatId,
      message: assistantContent,
      toolCalls: extractedToolCalls,
      citations: uniqueCitations,
    };
  }

  /**
   * Retrieves a chat thread with all its messages.
   */
  async getThread(chatId: string): Promise<IChatThread | null> {
    return this.repo.findByChatId(chatId);
  }

  /**
   * Lists chat threads.
   */
  async listThreads(limit = 50): Promise<ChatThreadSummary[]> {
    return this.repo.listThreads(limit);
  }

  /**
   * Deletes a chat thread.
   */
  async deleteThread(chatId: string): Promise<boolean> {
    return this.repo.deleteThread(chatId);
  }
}

export const chatService = new ChatService();
export default chatService;
