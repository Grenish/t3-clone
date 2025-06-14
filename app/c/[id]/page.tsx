"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useChat } from "ai/react";
import { gsap } from "gsap";
import { useTheme } from "@/util/theme-provider";
import { useLayout } from "@/util/layout-provider";
import PageTransition from "@/components/page-transition";
import AutoResizeTextarea from "@/components/auto-resize-textarea";
import Tooltip from "@/components/tooltip";
import AddMenu from "@/components/add-menu";
import ToolsMenu from "@/components/tools-menu";
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
} from "lucide-react";
import { MessageContent } from "@/components/message-content";
import ProductCard from "@/components/cards/product-card";
import { WeatherCard } from "@/components/cards/weather-card";
import StockCard from "@/components/cards/stock-card";
import ImageLoadingCard from "@/components/cards/image-loading-card";
import MediaRecommendationCard from "@/components/cards/media-recommendation-card";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageProcessedRef = useRef(false); // Changed from hasInitialized state
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedTool, setSelectedTool] = useState<{
    tool: string;
    persona?: string;
  } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [isTransitioningBack, setIsTransitioningBack] = useState(false);
  const [isFromTransition, setIsFromTransition] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string>("New Chat");
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [conversationExists, setConversationExists] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>(chatId); // Track the actual conversation ID
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null!);
  const toolsButtonRef = useRef<HTMLButtonElement>(null!);
  const { isDarkMode } = useTheme();
  const { currentLayout } = useLayout();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    setMessages,
    append,
  } = useChat({
    api: "/api/chat",
    body: {
      persona: selectedPersona,
      conversationId: currentConversationId, // Use the current conversation ID state
    },
    onError: (error) => {
      console.error("Chat processing error:", error);
    },
    onFinish: async (message) => {
      // The API now handles saving messages, so we don't need to duplicate it here
      console.log("Message finished:", message.id);
    },
  });

  // Check if coming from transition
  useEffect(() => {
    const transition = searchParams.get("transition");
    const persona = searchParams.get("persona");

    if (persona) {
      setSelectedPersona(persona);
      // Set the selected tool to maintain consistency with home page
      setSelectedTool({ tool: "persona", persona: persona });
    }

    if (transition === "true") {
      setIsFromTransition(true);

      // Set initial positions without animation
      if (headerRef.current) {
        gsap.set(headerRef.current, { y: -80, opacity: 0 });
      }
      if (messagesContainerRef.current) {
        gsap.set(messagesContainerRef.current, { opacity: 0, y: 20 });
      }

      // Ensure input container starts at its natural position
      if (inputContainerRef.current) {
        gsap.set(inputContainerRef.current, {
          clearProps: "all",
          position: "relative",
          bottom: "auto",
          left: "auto",
          right: "auto",
        });
      }

      // Small delay to ensure DOM is ready, then animate in
      setTimeout(() => {
        // Animate header in from top
        if (headerRef.current) {
          gsap.to(headerRef.current, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
          });
        }

        // Animate messages container in
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

      // Clean up URL - remove all search params, keep only the chat ID
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Log messages for debugging purposes
  useEffect(() => {
    console.log("Chat messages updated:", messages);
  }, [messages]);

  // Get initial message from URL params
  useEffect(() => {
    const initialMessage = searchParams.get("message");

    if (
      initialMessage &&
      messages.length === 0 &&
      !initialMessageProcessedRef.current
    ) {
      initialMessageProcessedRef.current = true; // Set ref to true once processed

      // Create conversation first if it doesn't exist
      const handleInitialMessage = async () => {
        if (!conversationExists) {
          console.log('Creating conversation for initial message');
          const newConversation = await createConversationInSupabase(initialMessage);
          if (!newConversation) {
            console.error('Failed to create conversation for initial message');
            return;
          }
        }

        // Increment API usage here since we're making the actual API call
        if ((window as any).incrementApiUsage) {
          (window as any).incrementApiUsage();
        }

        // Use the append function to properly handle the conversation
        append({
          role: "user",
          content: initialMessage,
        });
      };

      handleInitialMessage();

      // Clean up URL after processing initial message
      const url = new URL(window.location.href);
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, messages, append, conversationExists]); // Added conversationExists dependency

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Animate messages in when they appear (only if not from transition)
  useEffect(() => {
    if (
      messagesContainerRef.current &&
      messages.length > 0 &&
      !isFromTransition
    ) {
      const lastMessage = messagesContainerRef.current.lastElementChild;
      if (lastMessage) {
        gsap.fromTo(
          lastMessage,
          { opacity: 0, y: 20, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.4,
            ease: "power2.out",
          }
        );
      }
    }
  }, [messages.length, isFromTransition]);

  // Load existing conversation on mount
  useEffect(() => {
    const loadConversation = async () => {
      try {
        setIsLoadingConversation(true);
        const response = await fetch(`/api/conversations/${chatId}`);
        
        if (response.ok) {
          const data = await response.json();
          setConversationTitle(data.conversation.title);
          setConversationExists(true);
          
          // CRITICAL: Set the current conversation ID to ensure useChat uses the correct ID
          setCurrentConversationId(data.conversation.id);
          
          // Convert database messages to chat format
          const chatMessages = data.messages.map((msg: any) => {
            // For assistant messages with tool results, convert properly
            if (msg.role === 'assistant' && msg.metadata && msg.metadata.toolResults) {
              return {
                id: msg.id,
                role: msg.role,
                content: msg.content,
                toolInvocations: msg.metadata.toolResults.map((tool: any) => ({
                  toolCallId: tool.toolCallId || `tool-${Date.now()}-${Math.random()}`,
                  toolName: tool.toolName,
                  args: tool.args,
                  result: tool.result,
                  state: 'result' // Mark as completed
                })),
                createdAt: new Date(msg.created_at),
              };
            }
            
            // For regular messages (user, assistant without tools, system)
            return {
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: new Date(msg.created_at),
            };
          });
          
          setMessages(chatMessages);
        } else if (response.status === 404) {
          setConversationExists(false);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        setIsLoadingConversation(false);
      }
    };

    loadConversation();
  }, [chatId, setMessages]);

  // Function to create conversation in Supabase
  const createConversationInSupabase = async (userMessage?: string) => {
    try {
      // Create conversation with temporary title first
      const tempTitle = "New Chat";
      
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: tempTitle }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationExists(true);
        
        // Update the chat ID to match the created conversation
        const newChatId = data.conversation.id;
        
        // CRITICAL: Update the current conversation ID state for useChat
        setCurrentConversationId(newChatId);
        
        // Update the URL to match the created conversation ID
        if (newChatId !== chatId) {
          window.history.replaceState({}, "", `/c/${newChatId}`);
        }
        
        // If we have a user message, generate AI title
        if (userMessage && userMessage.trim()) {
          generateAndUpdateTitle(newChatId, userMessage);
        }
        
        return data.conversation;
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  // Function to generate and update conversation title using AI
  const generateAndUpdateTitle = async (conversationId: string, userPrompt: string) => {
    try {
      console.log('Generating AI title for conversation:', conversationId);
      
      const response = await fetch("/api/conversations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          conversationId: conversationId,
          prompt: userPrompt 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AI-generated title:', data.title);
        setConversationTitle(data.title);
      } else {
        console.error('Failed to generate title:', await response.text());
      }
    } catch (error) {
      console.error("Error generating conversation title:", error);
    }
  };

  // Generate title from message (fallback method)
  const generateTitleFromMessage = (content: string) => {
    const words = content.split(" ").slice(0, 6).join(" ");
    return words.length > 40 ? words.substring(0, 37) + "..." : words;
  };

  // Custom submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    
    // Create conversation if it doesn't exist before sending message
    if (!conversationExists) {
      console.log('Creating new conversation before sending message');
      const newConversation = await createConversationInSupabase(userMessage);
      if (!newConversation) {
        console.error('Failed to create conversation');
        return; // Don't proceed if conversation creation failed
      }
    }
    
    // Call original submit handler
    originalHandleSubmit(e);
  };

  // Back to home with animation
  const handleBackToHome = () => {
    if (!isTransitioningBack) {
      setIsTransitioningBack(true);
      const tl = gsap.timeline({
        onComplete: () => {
          // Navigate back to home page - layout context will handle which layout to show
          router.push("/");
        }, // Navigate back to home page - layout context will handle which layout to show
      });

      // Animate header out
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

      // Animate messages out
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
    // Remove messages after the retry point and regenerate
    const messagesToKeep = messages.slice(0, messageIndex);
    setMessages(messagesToKeep);
    // Find the last user message to retry from
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
    // Handle feedback logic here
    console.log(
      `Feedback for message ${messageId}: ${
        isPositive ? "positive" : "negative"
      }`
    );
  };

  const handleFileSelect = (file: File) => {
    setUploadedFiles((prev) => [...prev, file]);
  };
  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const handleToolSelect = (tool: string, persona?: string) => {
    setSelectedTool({ tool, persona });
    if (persona) {
      setSelectedPersona(persona);
    }
  };
  const handleRemoveTool = () => {
    setSelectedTool(null);
    // Clear persona when removing tool
    setSelectedPersona(null);
  }; // removing tool

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
      case "generateProductCard":
        if (!result) return null;
        if (Array.isArray(result)) {
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.map((product, index) => (
                <ProductCard
                  key={index}
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  rating={product.rating}
                  discount={product.discount}
                  reviewCount={product.reviewCount}
                  currency={product.currency}
                  imageUrl={product.imageUrl}
                  imageAlt={product.imageAlt}
                  platform={product.platform}
                />
              ))}
            </div>
          );
        }

        return (
          <ProductCard
            id={result.id}
            title={result.title}
            price={result.price}
            originalPrice={result.originalPrice}
            rating={result.rating}
            discount={result.discount}
            reviewCount={result.reviewCount}
            currency={result.currency}
            imageUrl={result.imageUrl}
            imageAlt={result.imageAlt}
            platform={result.platform}
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
          className={`border-b px-4 py-3 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <button
              onClick={handleBackToHome}
              disabled={isTransitioningBack}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                isDarkMode
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center">
              {isLoadingConversation ? (
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full animate-pulse ${
                      isDarkMode ? "bg-gray-500" : "bg-gray-400"
                    }`}
                  ></div>
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Loading...
                  </span>
                </div>
              ) : (
                <h1
                  className={`text-lg font-semibold truncate ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                  title={conversationTitle}
                >
                  {conversationTitle}
                </h1>
              )}
            </div>
            <div className="w-9" /> {/* Spacer to balance the back button */}
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
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
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-2xl ${
                      isDarkMode
                        ? "bg-blue-600 text-white"
                        : "bg-gray-900 text-white"
                    }`}
                  >
                    <MessageContent content={message.content} isUser={true} />
                  </div>
                ) : (
                  <div className="w-full group">
                    <div
                      className={`${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      <MessageContent
                        content={message.content}
                        isUser={false}
                      />
                    </div>

                    {/* Render tool invocations */}
                    {message.toolInvocations?.map(
                      (toolInvocation, toolIndex) => (
                        <div key={toolIndex} className="mt-4">
                          {renderToolResult(toolInvocation)}
                        </div>
                      )
                    )}

                    {/* Hover Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 mt-2">
                      <button
                        onClick={() =>
                          handleCopyMessage(
                            message.content,
                            message.id || `${index}`
                          )
                        }
                        className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer transform hover:scale-110 active:scale-95 ${
                          copiedMessageId === (message.id || `${index}`)
                            ? isDarkMode
                              ? "bg-green-900/30 text-green-400"
                              : "bg-green-100 text-green-600"
                            : isDarkMode
                            ? "hover:bg-gray-700 text-gray-400"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                        title={
                          copiedMessageId === (message.id || `${index}`)
                            ? "Copied!"
                            : "Copy"
                        }
                      >
                        <Copy className="w-4 h-4 transition-all duration-200" />
                      </button>
                      <button
                        onClick={() => handleRetryMessage(index)}
                        className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer transform hover:scale-110 active:scale-95 hover:rotate-180 ${
                          isDarkMode
                            ? "hover:bg-gray-700 text-gray-400"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                        title="Retry"
                      >
                        <RotateCcw className="w-4 h-4 transition-transform duration-300" />
                      </button>
                      <button
                        onClick={() =>
                          handleFeedback(message.id || `${index}`, true)
                        }
                        className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer transform hover:scale-110 active:scale-95 ${
                          isDarkMode
                            ? "hover:bg-green-900/30 hover:text-green-400 text-gray-400"
                            : "hover:bg-green-50 hover:text-green-600 text-gray-600"
                        }`}
                        title="Good response"
                      >
                        <ThumbsUp className="w-4 h-4 transition-all duration-200" />
                      </button>
                      <button
                        onClick={() =>
                          handleFeedback(message.id || `${index}`, false)
                        }
                        className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer transform hover:scale-110 active:scale-95 ${
                          isDarkMode
                            ? "hover:bg-red-900/30 hover:text-red-400 text-gray-400"
                            : "hover:bg-red-50 hover:text-red-600 text-gray-600"
                        }`}
                        title="Bad response"
                      >
                        <ThumbsDown className="w-4 h-4 transition-all duration-200" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="w-full">
                  <div className="flex space-x-1">
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        isDarkMode ? "bg-gray-500" : "bg-gray-400"
                      }`}
                    ></div>
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        isDarkMode ? "bg-gray-500" : "bg-gray-400"
                      }`}
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        isDarkMode ? "bg-gray-500" : "bg-gray-400"
                      }`}
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div ref={inputContainerRef} className="px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div
                className={`rounded-2xl border shadow-sm p-4 ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                {uploadedFiles.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border max-w-fit ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600"
                            : "bg-gray-50 border-gray-100"
                        }`}
                      >
                        {file.type.startsWith("image/") ? (
                          <img
                            src={
                              URL.createObjectURL(file) || "/placeholder.svg"
                            }
                            alt="Preview"
                            className="w-6 h-6 object-cover rounded border"
                          />
                        ) : (
                          <FileText
                            className={`w-4 h-4 flex-shrink-0 ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {getDisplayFileName(file.name)}
                        </span>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className={`flex-shrink-0 transition-colors ${
                            isDarkMode
                              ? "text-gray-500 hover:text-gray-300"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

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
                      if (form) {
                        form.dispatchEvent(event);
                      }
                    }
                  }}
                  className="py-3 text-base"
                />

                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2">
                    <div className="relative">
                      <Tooltip message="Add images or documents">
                        <button
                          ref={addButtonRef}
                          onClick={() => setShowAddMenu(!showAddMenu)}
                          className={`text-sm flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                            isDarkMode
                              ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-gray-100 border-gray-600 hover:border-gray-500"
                              : "bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span className="font-medium">Add</span>
                        </button>
                      </Tooltip>
                      <AddMenu
                        isOpen={showAddMenu}
                        onClose={() => setShowAddMenu(false)}
                        onFileSelect={handleFileSelect}
                        buttonRef={addButtonRef}
                      />
                    </div>

                    <div className="relative">
                      <Tooltip message="Select tools and personas">
                        <button
                          ref={toolsButtonRef}
                          onClick={() => setShowToolsMenu(!showToolsMenu)}
                          className={`text-sm flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                            isDarkMode
                              ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-gray-100 border-gray-600 hover:border-gray-500"
                              : "bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Settings2 className="w-4 h-4" />
                          <span className="font-medium">Tools</span>
                        </button>
                      </Tooltip>
                      <ToolsMenu
                        isOpen={showToolsMenu}
                        onClose={() => setShowToolsMenu(false)}
                        onToolSelect={handleToolSelect}
                        buttonRef={toolsButtonRef}
                      />
                    </div>

                    {selectedTool && (
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                          isDarkMode
                            ? "bg-blue-900/50 border-blue-700"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-blue-300" : "text-blue-700"
                          }`}
                        >
                          {selectedTool.persona
                            ? selectedTool.persona
                            : selectedTool.tool}
                        </span>
                        <button
                          onClick={handleRemoveTool}
                          className={`transition-colors ${
                            isDarkMode
                              ? "text-blue-400 hover:text-blue-300"
                              : "text-blue-400 hover:text-blue-600"
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isDarkMode
                        ? "bg-white hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 disabled:text-gray-400"
                        : "bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white"
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
