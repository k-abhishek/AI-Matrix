import React, { useMemo } from "react";
import "katex/dist/katex.min.css";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { cn } from "../../utils";

export interface MarkdownRendererProps {
  content: string;
  className?: string;
  useReactMarkdown?: boolean;
}

/**
 * Sanitizes Mermaid diagram definitions inside markdown content.
 * Fixes syntax errors where node labels contain unquoted parentheses,
 * brackets, or special characters (e.g. `H[LLM Provider (OpenAI, Anthropic)]` -> `H["LLM Provider (OpenAI, Anthropic)"]`).
 */
function sanitizeMermaid(content: string): string {
  if (!content || !content.includes("```mermaid")) return content;

  const sanitizeMermaidCode = (code: string): string => {
    return (
      code
        // Stadium: id([ ... ])
        .replace(
          /\b([A-Za-z0-9_-]+)\(\[\s*([^"\r\n]+?)\s*\]\)/g,
          (m, id, text) => {
            return text.includes("(") || text.includes(")")
              ? `${id}(["${text.replace(/"/g, "'")}"])`
              : m;
          },
        )
        // Cylinder: id[( ... )]
        .replace(
          /\b([A-Za-z0-9_-]+)\[\(\s*([^"\r\n]+?)\s*\)\]/g,
          (m, id, text) => {
            return text.includes("(") || text.includes(")")
              ? `${id}[("${text.replace(/"/g, "'")}")]`
              : m;
          },
        )
        // Hexagon: id{{ ... }}
        .replace(
          /\b([A-Za-z0-9_-]+)\{\{\s*([^"\r\n]+?)\s*\}\}/g,
          (m, id, text) => {
            return text.includes("(") || text.includes(")")
              ? `${id}{{"${text.replace(/"/g, "'")}"}}`
              : m;
          },
        )
        // Rhombus / Decision: id{ ... }
        .replace(
          /\b([A-Za-z0-9_-]+)\{\s*([^"\{\}\r\n]+?)\s*\}/g,
          (m, id, text) => {
            return text.includes("(") || text.includes(")")
              ? `${id}{"${text.replace(/"/g, "'")}"}`
              : m;
          },
        )
        // Rectangle: id[ ... ]
        .replace(
          /\b([A-Za-z0-9_-]+)\[\s*([^"\[\]\r\n]+?)\s*\]/g,
          (m, id, text) => {
            return text.includes("(") || text.includes(")")
              ? `${id}["${text.replace(/"/g, "'")}"]`
              : m;
          },
        )
        // Rounded: id( ... ) (only if not preceded by [ or followed by ])
        .replace(
          /(?<![\[\(])\b([A-Za-z0-9_-]+)\(\s*([^"\(\)\r\n]+?)\s*\)(?![\]\)])/g,
          (m, id, text) => {
            return text.includes("(") || text.includes(")")
              ? `${id}("${text.replace(/"/g, "'")}")`
              : m;
          },
        )
    );
  };

  return content.replace(/```mermaid([\s\S]*?)(?:```|$)/g, (match, code) => {
    const isClosed = match.endsWith("```");
    return "```mermaid" + sanitizeMermaidCode(code) + (isClosed ? "```" : "");
  });
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  useReactMarkdown = false,
}) => {
  const sanitizedContent = useMemo(() => sanitizeMermaid(content), [content]);

  const plugins = useMemo(() => {
    const activePlugins: Record<string, any> = { code, math };
    if (content && content.includes("```mermaid")) {
      activePlugins.mermaid = mermaid;
    }
    return activePlugins;
  }, [content]);

  const remarkPlugins = useMemo(() => [remarkGfm], []);

  if (useReactMarkdown) {
    return (
      <div
        className={cn(
          "markdown-body space-y-2 text-sm leading-relaxed break-words",
          className,
        )}
      >
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            h1: ({ children }) => (
              <h1 className="text-xl font-bold my-3">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-bold my-2.5">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold my-2">{children}</h3>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="leading-normal">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary/50 pl-3 my-2 italic text-muted-foreground">
                {children}
              </blockquote>
            ),
            code: ({ className: codeClassName, children, ...props }) => {
              const isInline = !codeClassName;
              return isInline ? (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 my-2 font-mono text-xs text-zinc-100 dark:bg-zinc-900">
                  <code className={codeClassName} {...props}>
                    {children}
                  </code>
                </pre>
              );
            },
            table: ({ children }) => (
              <div className="overflow-x-auto my-3">
                <table className="min-w-full border-collapse border border-border text-left text-xs">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border bg-muted/60 px-3 py-2 font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-border px-3 py-1.5">{children}</td>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80"
              >
                {children}
              </a>
            ),
          }}
        >
          {sanitizedContent}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "streamdown-container text-sm leading-relaxed break-words",
        className,
      )}
    >
      <Streamdown
        plugins={plugins}
        remarkPlugins={remarkPlugins}
        // mermaid={{ config: { theme: 'neutral' } }}
        className="w-full space-y-2 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:leading-normal [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:my-2.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:my-2 [&_table]:my-3 [&_table]:min-w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_a]:text-primary [&_a]:underline"
      >
        {sanitizedContent}
      </Streamdown>
    </div>
  );
};

export default MarkdownRenderer;
