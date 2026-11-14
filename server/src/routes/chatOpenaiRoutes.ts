import { FastifyPluginAsync } from "fastify";
import OpenAI from "openai";

interface ChatRequestBody {
  prompt: string;
}

const chatOpenaiRoutes: FastifyPluginAsync = async (fastify) => {
  const client = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY || "",
  });

  fastify.post<{ Body: ChatRequestBody }>(
    "/",
    {
      schema: {
        description: "Test chat endpoint using OpenRouter / OpenAI",
        tags: ["Chat"],
        summary: "Query AI chat endpoint",
        body: {
          type: "object",
          required: ["prompt"],
          properties: {
            prompt: {
              type: "string",
              description: "The prompt to send to the AI",
            },
          },
        },
        response: {
          200: {
            description: "AI model response",
            type: "object",
            additionalProperties: true,
          },
          500: {
            description: "Error response",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { prompt } = req.body;
      try {
        const apiResponse = await client.responses.create({
          model: "openai/gpt-oss-20b",
          //stream: true,
          input: [
            {
              role: "system",
              content:
                "you are a helpful assistant hadudu. Anwer politely to the user",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        return reply.status(200).send({ content: apiResponse.output_text });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return reply.status(500).send({ success: false, error: message });
      }
    },
  );
};

export default chatOpenaiRoutes;
