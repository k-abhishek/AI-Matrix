
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as cheerio from "cheerio";

export const websiteScraperTool = tool(
  async ({ url }) => {
    try {
      // Validate URL
      const parsedUrl = new URL(url);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are allowed");
      }

      // Fetch website HTML
      const response = await fetch(parsedUrl.href, {
        headers: {
          "User-Agent": "Mozilla/5.0 WebsiteResearchBot/1.0"
        },
        signal: AbortSignal.timeout(15000),
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`Website returned ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("text/html")) {
        throw new Error("URL does not contain an HTML page");
      }

      const html = await response.text();

      // Parse HTML
      const $ = cheerio.load(html);

      // Remove unnecessary elements
      $("script, style, noscript, iframe, svg, nav, footer, header").remove();

      const title = $("title").text().trim();

      const description =
        $('meta[name="description"]').attr("content") || "";

      const headings = $("h1, h2, h3")
        .map((_, el) => $(el).text().trim())
        .get();

      const content = $("body").text()
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 25000);

      if (!content) {
        throw new Error("No readable content found");
      }

      return JSON.stringify({
        url: parsedUrl.href,
        title,
        description,
        headings,
        content
      });

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return JSON.stringify({
        error: errorMessage
      });
    }
  },
  {
    name: "website_scraper",
    description: `
      Fetch and extract content from a public website URL.

      Use this tool when users want to:
      - Understand what a website contains
      - Summarize a website
      - Research a website
      - Extract headings and textual content

      Returns website title, description, headings and
      extracted text. The content can then be analyzed
      and summarized by the LLM.

      This tool does not execute JavaScript.
    `,
    schema: z.object({
      url: z.string().url().describe("The website URL to scrape")
    })
  }
);
