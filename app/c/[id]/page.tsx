"use client";

import type React from "react";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { gsap } from "gsap";
import { useTheme } from "@/util/theme-provider";
import { useLayout } from "@/util/layout-provider";
import PageTransition from "@/components/page-transition";
import AutoResizeTextarea from "@/components/auto-resize-textarea";
import Tooltip from "@/components/tooltip";
import AddMenu from "@/components/add-menu";
import ToolsMenu from "@/components/tools-menu";
import ModelSelector from "@/components/model-selector";
import {
  Send,
  ArrowLeft,
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Settings2,
  X,
  FileText,
  AlertCircle,
  Share,
} from "lucide-react";
import { MessageContent } from "@/components/message-content";
import SavedCard from "@/components/cards/saved-card";
import { WeatherCard } from "@/components/cards/weather-card";
import StockCard from "@/components/cards/stock-card";
import ImageLoadingCard from "@/components/cards/image-loading-card";
import MediaRecommendationCard from "@/components/cards/media-recommendation-card";
import { useChat } from "ai/react";
import ThinkingDisplay from "@/components/thinking-display";
import FileAttachment from "@/components/file-attachment";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = params.id as string;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const [isValidId, setIsValidId] = useState(() => {
    // Just check if ID is valid - don't call setState here
    return chatId.startsWith("temp-") || uuidRegex.test(chatId);
  });

  if (!isValidId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Creating conversation...</p>
        </div>
      </div>
    );
  }

  return <ChatPageContent chatId={chatId} />;
}

function ChatPageContent({ chatId }: { chatId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageProcessedRef = useRef(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [selectedTool, setSelectedTool] = useState<{
    tool: string;
    persona?: string;
  } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [isTransitioningBack, setIsTransitioningBack] = useState(false);
  const [isFromTransition, setIsFromTransition] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState("New Chat");
  const [messageDocuments, setMessageDocuments] = useState<Record<string, any[]>>({});
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [selectedModel, setSelectedModel] =
    useState<string>("gemini-2.0-flash");
  const [userApiKeys, setUserApiKeys] = useState<Record<string, string>>({});
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null!);
  const toolsButtonRef = useRef<HTMLButtonElement>(null!);
  const { isDarkMode } = useTheme();
  const { currentLayout } = useLayout();
  const [streamingThinking, setStreamingThinking] = useState<string>("");

  const chatConfig = useMemo(
    () => ({
      api: "/api/chat",
      id: chatId,
      onError: (error: Error) => {
        console.error("Chat processing error:", error);
      },
      onFinish: (message: any) => {
        console.log("Chat finished:", message);
        setIsUploadingFiles(false);
      },
    }),
    [chatId]
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: chatHandleSubmit,
    isLoading,
    setMessages,
    append,
    data,
  } = useChat(chatConfig);

  // Load conversation and message documents on mount
  useEffect(() => {
    let isMounted = true;

    const loadConversation = async () => {
      if (!chatId) return;

      try {
        const response = await fetch(`/api/conversations/${chatId}`);

        if (response.ok && isMounted) {
          const data = await response.json();
          console.log("🔥 Successfully loaded existing conversation:", chatId);

          setConversationTitle(data.conversation.title);

          const chatMessages = data.messages.map((msg: any) => {
            const baseMessage: any = {
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: new Date(msg.created_at),
            };

            if (msg.role === "assistant" && msg.metadata?.toolResults) {
              baseMessage.toolInvocations = msg.metadata.toolResults.map(
                (tool: any) => ({
                  toolCallId:
                    tool.toolCallId || `tool-${Date.now()}-${Math.random()}`,
                  toolName: tool.toolName,
                  args: tool.args,
                  result: tool.result,
                  state: "result",
                })
              );
            }

            if (msg.role === "assistant" && msg.metadata) {
              let thinkingContent = null;

              const possibleProps = [
                "thinking",
                "experimental_thinking",
                "reasoning",
                "steps",
              ];

              for (const prop of possibleProps) {
                const thinking = msg.metadata[prop];
                if (thinking) {
                  if (typeof thinking === "string" && thinking.trim()) {
                    thinkingContent = thinking;
                    break;
                  } else if (
                    typeof thinking === "object" &&
                    thinking !== null
                  ) {
                    if (thinking.text && typeof thinking.text === "string") {
                      thinkingContent = thinking.text;
                    } else if (
                      thinking.content &&
                      typeof thinking.content === "string"
                    ) {
                      thinkingContent = thinking.content;
                    } else if (Array.isArray(thinking)) {
                      thinkingContent = thinking
                        .map((step) => {
                          if (typeof step === "string") return step;
                          if (step && typeof step === "object") {
                            return (
                              step.text ||
                              step.content ||
                              JSON.stringify(step, null, 2)
                            );
                          }
                          return String(step);
                        })
                        .join("\n\n");
                    } else {
                      try {
                        if (thinking.stepType && thinking.text) {
                          thinkingContent = thinking.text;
                        } else {
                          thinkingContent = JSON.stringify(thinking, null, 2);
                        }
                      } catch (e) {
                        thinkingContent = String(thinking);
                      }
                    }
                    break;
                  }
                }
              }

              if (
                thinkingContent &&
                typeof thinkingContent === "string" &&
                thinkingContent.trim()
              ) {
                baseMessage.experimental_thinking = thinkingContent;
                console.log(
                  "📝 Loaded thinking content for message:",
                  msg.id,
                  thinkingContent.substring(0, 100) + "..."
                );
              }
            }

            return baseMessage;
          });

          setMessages(chatMessages);

          // Load message documents for each message
          const docsMap: Record<string, any[]> = {};
          for (const msg of data.messages) {
            if (msg.metadata?.attachments) {
              // For now, we'll track that there were attachments
              // In a full implementation, you'd fetch the actual document records
              docsMap[msg.id] = msg.metadata.attachments;
            }
          }
          setMessageDocuments(docsMap);
        } else if (response.status === 404 && isMounted) {
          setConversationTitle("New Chat");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error loading conversation");
          setConversationTitle("New Chat");
        }
      }
    };

    loadConversation();

    return () => {
      isMounted = false;
    };
  }, [chatId, router, setMessages]);

  useEffect(() => {
    if (data && data.length > 0) {
      console.log(
        "📝 Checking streaming data for thinking content...",
        data.length,
        "chunks"
      );

      for (let i = data.length - 1; i >= 0; i--) {
        const chunk = data[i];

        if (
          typeof chunk === "object" &&
          chunk !== null &&
          !Array.isArray(chunk)
        ) {
          console.log("📝 Examining chunk:", Object.keys(chunk));

          const possibleProps = [
            "experimental_thinking",
            "thinking",
            "reasoning",
            "steps",
            "thought",
            "cogitation",
          ];

          for (const prop of possibleProps) {
            const thinkingData = (chunk as any)[prop];
            if (thinkingData) {
              console.log(`📝 Found ${prop} in chunk:`, typeof thinkingData);

              let extractedThinking = null;

              if (typeof thinkingData === "string" && thinkingData.trim()) {
                extractedThinking = thinkingData;
              } else if (
                typeof thinkingData === "object" &&
                thinkingData !== null
              ) {
                if (thinkingData.text) {
                  extractedThinking = thinkingData.text;
                } else if (thinkingData.content) {
                  extractedThinking = thinkingData.content;
                } else {
                  try {
                    extractedThinking = JSON.stringify(thinkingData, null, 2);
                  } catch (e) {
                    extractedThinking = String(thinkingData);
                  }
                }
              }

              if (
                extractedThinking &&
                extractedThinking !== streamingThinking
              ) {
                setStreamingThinking(extractedThinking);
                return;
              }
            }
          }
        }
      }
    }
  }, [data]);

  useEffect(() => {
    if (isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        const possibleProps = [
          "experimental_thinking",
          "reasoning",
          "thinking",
          "steps",
          "thought",
          "cogitation",
        ];

        for (const prop of possibleProps) {
          const thinkingData = (lastMessage as any)[prop];
          if (thinkingData) {
            let extractedThinking = null;

            if (typeof thinkingData === "string" && thinkingData.trim()) {
              extractedThinking = thinkingData;
            } else if (
              typeof thinkingData === "object" &&
              thinkingData !== null
            ) {
              if (thinkingData.text) {
                extractedThinking = thinkingData.text;
              } else if (thinkingData.content) {
                extractedThinking = thinkingData.content;
              } else {
                try {
                  extractedThinking = JSON.stringify(thinkingData, null, 2);
                } catch (e) {
                  extractedThinking = String(thinkingData);
                }
              }
            }

            if (extractedThinking && extractedThinking !== streamingThinking) {
              setStreamingThinking(extractedThinking);
              return;
            }
          }
        }
      }
    }
  }, [messages, isLoading, streamingThinking]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!input.trim() || isLoading) return;

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(chatId)) {
        console.error("🔥 Invalid conversation ID format:", chatId);
        return;
      }

      console.log("🔥 Sending message with conversation ID:", chatId);

      if ((window as any).incrementApiUsage) {
        (window as any).incrementApiUsage();
      }

      // Set uploading state if there are files
      if (uploadedFiles.length > 0) {
        setIsUploadingFiles(true);
      }

      // Convert uploaded files to the format expected by the API
      const filesForAPI = await Promise.all(
        uploadedFiles.map(async (file) => {
          return new Promise<any>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result as string, // This will be a data URL (base64)
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      // Check if Web Search tool is selected
      console.log('🔧 Current selectedTool state:', selectedTool);
      const webSearchEnabled = selectedTool?.tool === "Web Search";
      console.log('🌐 Web Search enabled:', webSearchEnabled);

      chatHandleSubmit(e, {
        body: {
          conversationId: chatId,
          persona: selectedPersona,
          modelId: selectedModel,
          userApiKeys: userApiKeys,
          files: filesForAPI, // Include files in the request
          webSearchEnabled: webSearchEnabled, // Enable web search grounding when tool is selected
        },
      });

      // Clear uploaded files after sending
      setUploadedFiles([]);
    },
    [
      input,
      isLoading,
      chatId,
      selectedPersona,
      selectedModel,
      userApiKeys,
      uploadedFiles,
      selectedTool, // Add selectedTool to dependencies
      chatHandleSubmit,
    ]
  );

  useEffect(() => {
    const transition = searchParams.get("transition");
    const persona = searchParams.get("persona");

    if (persona) {
      setSelectedPersona(persona);
      setSelectedTool({ tool: "persona", persona: persona });
    }

    if (transition === "true") {
      setIsFromTransition(true);

      if (headerRef.current) {
        gsap.set(headerRef.current, { y: -80, opacity: 0 });
      }
      if (messagesContainerRef.current) {
        gsap.set(messagesContainerRef.current, { opacity: 0, y: 20 });
      }

      if (inputContainerRef.current) {
        gsap.set(inputContainerRef.current, {
          clearProps: "all",
          position: "relative",
          bottom: "auto",
          left: "auto",
          right: "auto",
        });
      }

      const timeoutId = setTimeout(() => {
        if (headerRef.current) {
          gsap.to(headerRef.current, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
          });
        }

        if (messagesContainerRef.current) {
          gsap.to(messagesContainerRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out",
            delay: 0.2,
          });
        }
      }, 50);

      const url = new URL(window.location.href);
      url.searchParams.delete("transition");
      url.searchParams.delete("persona");
      window.history.replaceState({}, "", url.toString());

      return () => clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadConversation = async () => {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (chatId.startsWith("temp-") || !uuidRegex.test(chatId)) {
        console.log(
          "🔥 Invalid conversation ID format:",
          chatId,
          "- creating new conversation"
        );

        try {
          const response = await fetch("/api/conversations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: "New Chat",
            }),
          });

          if (response.ok && isMounted) {
            const data = await response.json();
            const newConversationId = data.conversation.id;
            console.log("🔥 Created new conversation:", newConversationId);

            const currentUrl = new URL(window.location.href);
            const searchParams = currentUrl.searchParams;

            router.replace(
              `/c/${newConversationId}?${searchParams.toString()}`
            );
            return;
          } else if (isMounted) {
            console.error("Failed to create new conversation");
            setConversationTitle("New Chat");
            return;
          }
        } catch (error) {
          if (isMounted) {
            console.error("Error creating new conversation:", error);
            setConversationTitle("New Chat");
            return;
          }
        }
      }

      try {
        console.log("🔥 Loading conversation:", chatId);
        const response = await fetch(`/api/conversations/${chatId}`);

        if (response.ok && isMounted) {
          const data = await response.json();
          console.log("🔥 Successfully loaded existing conversation:", chatId);

          setConversationTitle(data.conversation.title);

          const chatMessages = data.messages.map((msg: any) => {
            const baseMessage: any = {
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: new Date(msg.created_at),
            };

            if (msg.role === "assistant" && msg.metadata?.toolResults) {
              baseMessage.toolInvocations = msg.metadata.toolResults.map(
                (tool: any) => ({
                  toolCallId:
                    tool.toolCallId || `tool-${Date.now()}-${Math.random()}`,
                  toolName: tool.toolName,
                  args: tool.args,
                  result: tool.result,
                  state: "result",
                })
              );
            }

            if (msg.role === "assistant" && msg.metadata) {
              let thinkingContent = null;

              const possibleProps = [
                "thinking",
                "experimental_thinking",
                "reasoning",
                "steps",
              ];

              for (const prop of possibleProps) {
                const thinking = msg.metadata[prop];
                if (thinking) {
                  if (typeof thinking === "string" && thinking.trim()) {
                    thinkingContent = thinking;
                    break;
                  } else if (
                    typeof thinking === "object" &&
                    thinking !== null
                  ) {
                    if (thinking.text && typeof thinking.text === "string") {
                      thinkingContent = thinking.text;
                    } else if (
                      thinking.content &&
                      typeof thinking.content === "string"
                    ) {
                      thinkingContent = thinking.content;
                    } else if (Array.isArray(thinking)) {
                      thinkingContent = thinking
                        .map((step) => {
                          if (typeof step === "string") return step;
                          if (step && typeof step === "object") {
                            return (
                              step.text ||
                              step.content ||
                              JSON.stringify(step, null, 2)
                            );
                          }
                          return String(step);
                        })
                        .join("\n\n");
                    } else {
                      try {
                        if (thinking.stepType && thinking.text) {
                          thinkingContent = thinking.text;
                        } else {
                          thinkingContent = JSON.stringify(thinking, null, 2);
                        }
                      } catch (e) {
                        thinkingContent = String(thinking);
                      }
                    }
                    break;
                  }
                }
              }

              if (
                thinkingContent &&
                typeof thinkingContent === "string" &&
                thinkingContent.trim()
              ) {
                baseMessage.experimental_thinking = thinkingContent;
                console.log(
                  "📝 Loaded thinking content for message:",
                  msg.id,
                  thinkingContent.substring(0, 100) + "..."
                );
              }
            }

            return baseMessage;
          });

          setMessages(chatMessages);
        } else if (response.status === 404 && isMounted) {
          setConversationTitle("New Chat");
        }
      } catch (error) {
        if (isMounted) {
          console.error("FUCK");
          setConversationTitle("New Chat");
        }
      }
    };

    loadConversation();

    return () => {
      isMounted = false;
    };
  }, [chatId, router, setMessages]);

  useEffect(() => {
    const initialMessage = searchParams.get("message");
    const modelFromUrl = searchParams.get("modelId");
    const webSearchFromUrl = searchParams.get("webSearchEnabled");

    if (modelFromUrl && modelFromUrl !== selectedModel) {
      setSelectedModel(modelFromUrl);
    }

    // Set web search tool if enabled from URL
    if (webSearchFromUrl === "true") {
      setSelectedTool({ tool: "Web Search" });
    }

    if (initialMessage && !initialMessageProcessedRef.current) {
      console.log("🔥 Processing initial message:", initialMessage);
      initialMessageProcessedRef.current = true;

      const sendInitialMessage = async () => {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (uuidRegex.test(chatId)) {
          if ((window as any).incrementApiUsage) {
            (window as any).incrementApiUsage();
          }

          // Check files from sessionStorage
          let filesForAPI: any[] = [];
          const hasFiles = searchParams.get("hasFiles");
          if (hasFiles === "true") {
            const storedFiles = sessionStorage.getItem(`files_${chatId}`);
            if (storedFiles) {
              try {
                filesForAPI = JSON.parse(storedFiles);
                sessionStorage.removeItem(`files_${chatId}`);
              } catch (error) {
                console.error("Error parsing stored files:", error);
              }
            }
          }

          await append(
            {
              role: "user",
              content: initialMessage,
            },
            {
              body: {
                conversationId: chatId,
                persona: selectedPersona,
                modelId: modelFromUrl || selectedModel,
                userApiKeys: userApiKeys,
                files: filesForAPI,
                webSearchEnabled: webSearchFromUrl === "true", // Include web search from URL
              },
            }
          );
        } else {
          console.log(
            "🔥 Invalid conversation ID format, should not happen with new flow"
          );
        }

        const url = new URL(window.location.href);
        url.searchParams.delete("message");
        url.searchParams.delete("modelId");
        url.searchParams.delete("webSearchEnabled");
        url.searchParams.delete("hasFiles");
        window.history.replaceState({}, "", url.toString());
      };

      sendInitialMessage();
    }
  }, [searchParams]);

  useEffect(() => {
    if (messages.length > 0 && conversationTitle === "New Chat") {
      const firstUserMessage = messages.find((m) => m.role === "user");
      if (firstUserMessage) {
        const title = generateFallbackTitle(firstUserMessage.content);
        setConversationTitle(title);

        setTimeout(() => {
          generateAndUpdateTitle(chatId, firstUserMessage.content).catch(
            console.error
          );
        }, 1000);
      }
    }
  }, [messages.length]);

  const generateFallbackTitle = (content: string) => {
    const words = content.split(" ").slice(0, 6).join(" ");
    let title = words.length > 40 ? words.substring(0, 37) + "..." : words;
    title = title.replace(/\b\w/g, (char) => char.toUpperCase());
    return title || "New Chat";
  };

  // Had to sacrifice this for now

  const generateAndUpdateTitle = async (
    conversationId: string,
    userPrompt: string
  ) => {
    try {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!conversationId || !uuidRegex.test(conversationId)) {
        return;
      }

      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: generateFallbackTitle(userPrompt),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationTitle(data.conversation.title);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("conversationUpdated", {
              detail: { id: conversationId, title: data.conversation.title },
            })
          );
        }
      } else {
        console.error(
          "Failed to update conversation title. Status:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error generating conversation title:", error);
    }
  };

  const handleBackToHome = () => {
    if (!isTransitioningBack) {
      setIsTransitioningBack(true);
      const tl = gsap.timeline({
        onComplete: () => {
          router.push("/");
        },
      });

      tl.to(
        headerRef.current,
        {
          y: -80,
          opacity: 0,
          duration: 0.3,
          ease: "power2.inOut",
        },
        0
      );

      tl.to(
        messagesContainerRef.current,
        {
          opacity: 0,
          y: -20,
          duration: 0.3,
          ease: "power2.inOut",
        },
        0.1
      );
    }
  };
  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };
  const handleRetryMessage = (messageIndex: number) => {
    const messagesToKeep = messages.slice(0, messageIndex);
    setMessages(messagesToKeep);
    const lastUserMessage = messagesToKeep
      .reverse()
      .find((m) => m.role === "user");
    if (lastUserMessage) {
      append({
        role: "user",
        content: lastUserMessage.content,
      });
    }
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    console.log(
      `Feedback for message ${messageId}: ${
        isPositive ? "positive irdc" : "FUCK idc"
      }`
    );
  };

  const handleFileSelect = (file: File) => {
    setUploadedFiles((prev) => [...prev, file]);
  };
  
  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToolSelect = (tool: { tool?: string; persona?: string }) => {
    console.log('🔧 Tool selected:', tool);
    if (tool.tool) {
      setSelectedTool({ tool: tool.tool, persona: undefined });
      console.log('🔧 Set selectedTool to:', { tool: tool.tool, persona: undefined });
    } else if (tool.persona) {
      setSelectedTool({ tool: "persona", persona: tool.persona });
      setSelectedPersona(tool.persona);
      console.log('🔧 Set selectedTool to persona:', { tool: "persona", persona: tool.persona });
    }
  };
  const handleRemoveTool = () => {
    setSelectedTool(null);
    setSelectedPersona(null);
  };

  const getDisplayFileName = (fileName: string) => {
    const words = fileName.split(".");
    const extension = words.pop();
    const nameWithoutExtension = words.join(".");
    const truncatedName =
      nameWithoutExtension.length > 10
        ? nameWithoutExtension.substring(0, 10) + "..."
        : nameWithoutExtension;
    return `${truncatedName}.${extension}`;
  };
  const renderToolResult = (toolInvocation: any) => {
    const { toolName, result } = toolInvocation;
    switch (toolName) {
      case "saveMemory":
        if (!result) return null;
        return (
          <SavedCard
            memoryKey={result.key}
            memoryValue={result.value}
            memoryType={result.type}
            message={result.message}
          />
        );
      case "generateWeatherCard":
        if (!result) return null;
        return (
          <WeatherCard
            data={{
              location: result.location,
              temperature: result.temperature,
              condition: result.condition,
              humidity: result.humidity,
              windSpeed: result.windSpeed,
              description: result.description,
            }}
          />
        );
      case "generateStockCard":
        if (!result) return null;
        return (
          <StockCard
            stock={{
              name: result.name,
              ticker: result.ticker,
              price: result.price,
              change: result.change,
              changePercent: result.changePercent,
              exchange: result.exchange,
              currency: result.currency,
              volume: result.volume,
              marketCap: result.marketCap,
              dayRange: result.dayRange,
              peRatio: result.peRatio,
              dividendYield: result.dividendYield,
              sector: result.sector,
              industry: result.industry,
              description: result.description,
              chartData: result.chartData,
              previousClose: result.previousClose,
              weekHigh52: result.weekHigh52,
              weekLow52: result.weekLow52,
              beta: result.beta,
              eps: result.eps,
              bookValue: result.bookValue,
              priceToBook: result.priceToBook,
              lastUpdated: result.lastUpdated,
              error: result.error,
            }}
          />
        );
      case "generateImage":
        return (
          <ImageLoadingCard
            prompt={
              result?.prompt ||
              toolInvocation.args?.prompt ||
              "Generating image..."
            }
            imageUrl={result?.imageUrl}
            isGenerating={toolInvocation.state === "call"}
            error={result?.error}
            success={result?.success}
            width="100%"
            height="400px"
          />
        );
      case "generateMediaRecommendations":
        if (!result) return null;
        if (Array.isArray(result)) {
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.map((recommendation, index) => (
                <MediaRecommendationCard
                  key={index}
                  title={recommendation.title}
                  genre={recommendation.genre}
                  platform={recommendation.platform}
                  rating={recommendation.rating}
                  duration={recommendation.duration}
                  imageUrl={recommendation.imageUrl}
                  type={recommendation.type}
                />
              ))}
            </div>
          );
        }

        return (
          <MediaRecommendationCard
            title={result.title}
            genre={result.genre}
            platform={result.platform}
            rating={result.rating}
            duration={result.duration}
            imageUrl={result.imageUrl}
            type={result.type}
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages.length, isLoading]);

  useEffect(() => {
    if (!isLoading && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);
    }
  }, [isLoading]);

  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const response = await fetch("/api/user/preferences");
        if (response.ok) {
          const { preferences } = await response.json();
          if (preferences?.preferred_model) {
            setSelectedModel(preferences.preferred_model);
          }
        }
      } catch (error) {
        console.error("Failed to load user preferences:", error);
      }
    };

    loadUserPreferences();
  }, []);

  useEffect(() => {
    const modelId = searchParams.get("modelId");
    if (modelId) {
      setSelectedModel(modelId);
    }
  }, [searchParams]);

  return (
    <PageTransition skipAnimation={isFromTransition}>
      <div
        className={`flex flex-col h-screen ${
          isDarkMode
            ? "bg-gradient-to-b from-[#1B1B1B] to-[#003153]"
            : "bg-gradient-to-b from-[#fdfbfb] to-[#ebedee]"
        }`}
      >
        {/* Header */}
        <div
          ref={headerRef}
          className={`border-b px-4 sm:px-6 py-3 sm:py-4 ${
            isDarkMode
              ? "bg-gray-800/95 backdrop-blur-sm border-gray-700"
              : "bg-white/95 backdrop-blur-sm border-gray-200"
          }`}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button
              onClick={handleBackToHome}
              disabled={isTransitioningBack}
              className={`p-2 rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95 ${
                isDarkMode
                  ? "hover:bg-gray-700 text-gray-300 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 mx-4">
              {/* Mobile: Model Selector */}
              <div className="block sm:hidden">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  size="sm"
                  className="w-full max-w-[220px] mx-auto"
                />
              </div>

              {/* Desktop: Conversation Title */}
              <div className="hidden sm:block text-center">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full animate-pulse ${
                        isDarkMode ? "bg-blue-400" : "bg-blue-600"
                      }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      AI is thinking...
                    </span>
                  </div>
                ) : (
                  <h1
                    className={`text-lg font-semibold truncate max-w-md mx-auto ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                    title={conversationTitle}
                  >
                    {conversationTitle}
                  </h1>
                )}
              </div>
            </div>
            <button
              className={`p-2 rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95 ${
                isDarkMode
                  ? "hover:bg-gray-700 text-gray-300 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
            >
              <Share className="w-5 h-5" />
            </button>
            <div className="w-10" /> {/* Spacer for symmetry */}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div
            ref={messagesContainerRef}
            className="max-w-4xl mx-auto space-y-6"
          >
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "user" ? (
                  <div className="max-w-[90%] sm:max-w-2xl">
                    <div
                      className={`px-4 py-3 rounded-3xl shadow-sm ${
                        isDarkMode
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white"
                          : "bg-gradient-to-r from-gray-900 to-gray-800 text-white"
                      }`}
                    >
                      <MessageContent content={message.content} isUser={true} />
                    </div>
                    
                    {/* Show uploaded files for this message */}
                    {messageDocuments[message.id || `${index}`] && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {messageDocuments[message.id || `${index}`].map((attachment: any, attachIndex: number) => (
                          <FileAttachment
                            key={attachIndex}
                            filename={attachment.filename || 'Unknown file'}
                            fileType={attachment.mimeType || attachment.type || 'application/octet-stream'}
                            size={attachment.size}
                            documentUrl={attachment.documentUrl}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full group">
                    {/* Thinking Display */}
                    {(function () {
                      const possibleProps = [
                        "experimental_thinking",
                        "reasoning",
                        "thinking",
                        "steps",
                        "thought",
                        "cogitation",
                      ];

                      let messageThinking = null;
                      for (const prop of possibleProps) {
                        const thinking = (message as any)[prop];
                        if (
                          thinking &&
                          typeof thinking === "string" &&
                          thinking.trim()
                        ) {
                          messageThinking = thinking;
                          break;
                        }
                      }

                      const currentStreaming =
                        index === messages.length - 1 &&
                        isLoading &&
                        streamingThinking;
                      const thinkingToShow =
                        messageThinking ||
                        (currentStreaming ? streamingThinking : null);

                      if (thinkingToShow && thinkingToShow.trim()) {
                        return (
                          <div className="mb-4">
                            <ThinkingDisplay
                              thinking={thinkingToShow}
                              isStreaming={!!currentStreaming}
                            />
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Assistant Message */}
                    <div
                      className={` ${
                        isDarkMode ? " text-gray-100" : " text-gray-900"
                      }`}
                    >
                      <MessageContent
                        content={message.content}
                        isUser={false}
                      />
                    </div>

                    {message.toolInvocations?.map(
                      (toolInvocation, toolIndex) => (
                        <div key={toolIndex} className="mt-4">
                          {renderToolResult(toolInvocation)}
                        </div>
                      )
                    )}

                    {/* Hover Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 mt-3">
                      {/* Metrics */}
                      <div
                        className={`flex flex-wrap items-center gap-3 mb-3 text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {(message as any).model_used && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium hidden sm:inline">
                              Model:
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isDarkMode
                                  ? "bg-blue-900/40 text-blue-300 border border-blue-800/40"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {(message as any).model_used}
                            </span>
                          </div>
                        )}

                        {(message as any).token_usage && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium hidden sm:inline">
                              Tokens:
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isDarkMode
                                  ? "bg-green-900/40 text-green-300 border border-green-800/40"
                                  : "bg-green-50 text-green-700 border border-green-200"
                              }`}
                            >
                              {(message as any).token_usage.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {(message as any).response_time_ms && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium hidden sm:inline">
                              Time:
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isDarkMode
                                  ? "bg-purple-900/40 text-purple-300 border border-purple-800/40"
                                  : "bg-purple-50 text-purple-700 border border-purple-200"
                              }`}
                            >
                              {(message as any).response_time_ms}ms
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {[
                          {
                            icon: Copy,
                            title:
                              copiedMessageId === (message.id || `${index}`)
                                ? "Copied!"
                                : "Copy",
                            onClick: () =>
                              handleCopyMessage(
                                message.content,
                                message.id || `${index}`
                              ),
                            isActive:
                              copiedMessageId === (message.id || `${index}`),
                          },
                          {
                            icon: RotateCcw,
                            title: "Retry",
                            onClick: () => handleRetryMessage(index),
                            className: "hover:rotate-180",
                          },
                          {
                            icon: ThumbsUp,
                            title: "Good response",
                            onClick: () =>
                              handleFeedback(message.id || `${index}`, true),
                          },
                          {
                            icon: ThumbsDown,
                            title: "Bad response",
                            onClick: () =>
                              handleFeedback(message.id || `${index}`, false),
                          },
                        ].map((action, idx) => (
                          <button
                            key={idx}
                            onClick={action.onClick}
                            className={`p-2 rounded-xl transition-all duration-200 transform hover:scale-110 active:scale-95 ${
                              action.isActive
                                ? isDarkMode
                                  ? "bg-green-900/30 text-green-400"
                                  : "bg-green-100 text-green-600"
                                : isDarkMode
                                ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                                : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                            } ${action.className || ""}`}
                            title={action.title}
                          >
                            <action.icon className="w-4 h-4 transition-transform duration-300" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="w-full">
                  {streamingThinking && (
                    <div className="mb-4">
                      <ThinkingDisplay
                        thinking={streamingThinking}
                        isStreaming={true}
                      />
                    </div>
                  )}

                  <div
                    className={`flex space-x-2 p-4 rounded-3xl w-fit ${
                      isDarkMode
                        ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700/50"
                        : "bg-white/80 backdrop-blur-sm border border-gray-200/50"
                    }`}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full animate-bounce ${
                          isDarkMode ? "bg-gray-400" : "bg-gray-500"
                        }`}
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Container */}
        <div ref={inputContainerRef} className="p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div
                className={`rounded-3xl border shadow-lg p-4 sm:p-5 backdrop-blur-sm ${
                  isDarkMode
                    ? "bg-gray-800/90 border-gray-700/50"
                    : "bg-white/90 border-gray-200/50"
                }`}
              >
                {/* File Uploads */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-3">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all hover:scale-105 ${
                          isDarkMode
                            ? "bg-gray-700/60 border-gray-600 hover:bg-gray-700"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {file.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-6 h-6 object-cover rounded-lg border"
                          />
                        ) : (
                          <FileText
                            className={`w-5 h-5 ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {getDisplayFileName(file.name)}
                        </span>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className={`transition-colors hover:scale-110 ${
                            isDarkMode
                              ? "text-gray-500 hover:text-red-400"
                              : "text-gray-400 hover:text-red-500"
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Text Input */}
                <AutoResizeTextarea
                  placeholder="Type your message..."
                  value={input}
                  onChange={(value) =>
                    handleInputChange({
                      target: { value },
                    } as React.ChangeEvent<HTMLTextAreaElement>)
                  }
                  onSubmit={() => {
                    if (input.trim() && !isLoading) {
                      const event = new Event("submit", {
                        bubbles: true,
                        cancelable: true,
                      });
                      const form = document.querySelector("form");
                      if (form) form.dispatchEvent(event);
                    }
                  }}
                  className="py-4 text-base leading-relaxed resize-none w-full"
                />

                {/* Controls */}
                <div className="flex items-center justify-between gap-3 mt-4">
                  {/* Left Controls */}
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    {/* Action Buttons */}
                    {[
                      {
                        ref: addButtonRef,
                        icon: Plus,
                        label: "Add",
                        onClick: () => setShowAddMenu(!showAddMenu),
                        menu: (
                          <AddMenu
                            isOpen={showAddMenu}
                            onClose={() => setShowAddMenu(false)}
                            onFileSelect={handleFileSelect}
                            buttonRef={addButtonRef}
                            isUploading={isUploadingFiles}
                          />
                        ),
                      },
                      {
                        ref: toolsButtonRef,
                        icon: Settings2,
                        label: "Tools",
                        onClick: () => setShowToolsMenu(!showToolsMenu),
                        menu: (
                          <ToolsMenu
                            isOpen={showToolsMenu}
                            onClose={() => setShowToolsMenu(false)}
                            onToolSelect={handleToolSelect}
                            buttonRef={toolsButtonRef}
                          />
                        ),
                      },
                    ].map((button, idx) => (
                      <div key={idx} className="relative">
                        <Tooltip message={`${button.label} options`}>
                          <button
                            ref={button.ref}
                            onClick={button.onClick}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                              isDarkMode
                                ? "bg-gray-700/50 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600"
                                : "bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 border-gray-200"
                            }`}
                          >
                            <button.icon className="w-4 h-4" />
                            <span className="font-medium hidden sm:inline">
                              {button.label}
                            </span>
                          </button>
                        </Tooltip>
                        {button.menu}
                      </div>
                    ))}

                    {/* Tool Chips - Next to Tools button */}
                    {selectedTool && (
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${
                          isDarkMode
                            ? "bg-blue-900/30 border-blue-700/50 text-blue-300"
                            : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}
                      >
                        <span className="text-sm font-medium truncate max-w-32 sm:max-w-none">
                          {selectedTool.persona || selectedTool.tool}
                        </span>
                        <button
                          onClick={handleRemoveTool}
                          className="transition-all hover:scale-110"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Desktop Model Selector */}
                    <div className="hidden sm:block">
                      <ModelSelector
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        size="sm"
                      />
                    </div>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className={`px-4 sm:px-6 py-3 rounded-2xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg ${
                        isDarkMode
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white disabled:from-gray-600 disabled:to-gray-600"
                          : "bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white disabled:from-gray-400 disabled:to-gray-400"
                      }`}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
