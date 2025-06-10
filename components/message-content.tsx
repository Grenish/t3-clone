"use client"

import { CodeBlock } from "./code-block"

interface MessageContentProps {
  content: string
  isUser: boolean
}

export function MessageContent({ content, isUser }: MessageContentProps) {
  // Parse the content to extract code blocks and regular text
  const parseContent = (text: string) => {
    const parts = []
    let currentIndex = 0

    // Regex to match code blocks with optional language and filename
    const codeBlockRegex = /```(\w+)?\s*(?:file="([^"]+)")?\s*\n([\s\S]*?)```/gm
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before the code block
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index)
        if (beforeText.trim()) {
          parts.push({
            type: "text",
            content: beforeText,
          })
        }
      }

      // Add the code block
      const language = match[1] || "text"
      const filename = match[2]
      const code = match[3].trim()

      parts.push({
        type: "code",
        language,
        filename,
        content: code,
      })

      currentIndex = match.index + match[0].length
    }

    // Add remaining text after the last code block
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex)
      if (remainingText.trim()) {
        parts.push({
          type: "text",
          content: remainingText,
        })
      }
    }

    // If no code blocks found, return the entire text as a single text part
    if (parts.length === 0) {
      parts.push({
        type: "text",
        content: text,
      })
    }

    return parts
  }

  // Parse inline code (single backticks)
  const parseInlineCode = (text: string) => {
    const parts = []
    const inlineCodeRegex = /`([^`]+)`/g
    let lastIndex = 0
    let match

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        })
      }

      // Add inline code
      parts.push({
        type: "inline-code",
        content: match[1],
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex),
      })
    }

    return parts.length > 0 ? parts : [{ type: "text", content: text }]
  }

  const contentParts = parseContent(content)

  return (
    <div className="space-y-3">
      {contentParts.map((part, index) => {
        if (part.type === "code") {
          return <CodeBlock key={index} language={part.language || "text"} code={part.content} filename={part.filename} />
        } else {
          // Handle text with inline code
          const inlineParts = parseInlineCode(part.content)
          return (
            <div key={index} className="whitespace-pre-wrap">
              {inlineParts.map((inlinePart, inlineIndex) => {
                if (inlinePart.type === "inline-code") {
                  return (
                    <code
                      key={inlineIndex}
                      className={`px-1.5 py-0.5 rounded text-sm font-mono ${
                        isUser ? "bg-blue-400 bg-opacity-30 text-blue-100" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {inlinePart.content}
                    </code>
                  )
                } else {
                  return <span key={inlineIndex}>{inlinePart.content}</span>
                }
              })}
            </div>
          )
        }
      })}
    </div>
  )
}
