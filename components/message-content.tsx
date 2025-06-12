"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { CodeBlock } from "./code-block"
import { useTheme } from "../util/theme-provider"

interface MessageContentProps {
  content: string
  isUser: boolean
}

export function MessageContent({ content, isUser }: MessageContentProps) {
  const { isDarkMode } = useTheme()

  return (
    <div className="space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "")
            const language = match ? match[1] : "text"

            // Check if it's truly inline code (single backticks)
            if (inline || !className) {
              return (
                <code
                  className={`px-1.5 py-0.5 rounded text-sm font-mono ${
                    isUser
                      ? "bg-blue-400 bg-opacity-30 text-blue-100"
                      : isDarkMode
                      ? "bg-gray-700 text-gray-200"
                      : "bg-gray-200 text-gray-900 border border-gray-300"
                  }`}
                  {...props}
                >
                  {children}
                </code>
              )
            }

            // Handle code blocks (triple backticks)
            const codeString = String(children).replace(/\n$/, "")
            const lines = codeString.split("\n")
            const firstLine = lines[0]

            // Check if first line is a filepath comment
            const filepathMatch = firstLine.match(/^\/\/\s*filepath:\s*(.+)$/)
            let filename: string | undefined
            let code = codeString

            if (filepathMatch) {
              filename = filepathMatch[1].trim()
              code = lines.slice(1).join("\n")
            }

            return <CodeBlock language={language} code={code} filename={filename} />
          },
          p({ children }) {
            return <div className="whitespace-pre-wrap">{children}</div>
          },
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1 ml-4">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1 ml-4">{children}</ol>
          },
          li({ children }) {
            return <li className="ml-2">{children}</li>
          },
          h1({ children }) {
            return <h1 className="text-2xl font-bold mb-2">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="text-xl font-semibold mb-2">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="text-lg font-medium mb-1">{children}</h3>
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic">
                {children}
              </blockquote>
            )
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                className={`underline ${isUser ? "text-blue-200" : "text-blue-600"}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            )
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table
                  className={`min-w-full border-collapse ${
                    isDarkMode ? "border border-gray-600" : "border border-gray-300"
                  }`}
                >
                  {children}
                </table>
              </div>
            )
          },
          thead({ children }) {
            return <thead className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>{children}</thead>
          },
          tbody({ children }) {
            return <tbody>{children}</tbody>
          },
          tr({ children }) {
            return (
              <tr
                className={`${
                  isDarkMode
                    ? "border-b border-gray-600 hover:bg-gray-800"
                    : "border-b border-gray-300 hover:bg-gray-50"
                }`}
              >
                {children}
              </tr>
            )
          },
          th({ children }) {
            return (
              <th
                className={`px-4 py-2 text-left font-semibold ${
                  isDarkMode
                    ? "text-gray-200 border-r border-gray-600"
                    : "text-gray-900 border-r border-gray-300"
                }`}
              >
                {children}
              </th>
            )
          },
          td({ children }) {
            return (
              <td
                className={`px-4 py-2 ${
                  isDarkMode
                    ? "text-gray-300 border-r border-gray-600"
                    : "text-gray-700 border-r border-gray-300"
                }`}
              >
                {children}
              </td>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
