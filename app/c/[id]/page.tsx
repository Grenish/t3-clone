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
  AlertCircle
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
  const initialMessageProcessedRef = useRef(false);
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
  const [conversationTitle, setConversationTitle] = useState("New Chat");
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash');
  const [userApiKeys, setUserApiKeys] = useState<Record<string, string>>({});
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null!);
  const toolsButtonRef = useRef<HTMLButtonElement>(null!);
  const { isDarkMode } = useTheme();
  const { currentLayout } = useLayout();

  // SIMPLE: Use useChat with conversation ID - let it handle everything
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    setMessages,
    append,
    reload,
  } = useChat({
    api: "/api/chat",
    body: {
      persona: selectedPersona,
      conversationId: chatId, // Always use the chatId directly
      modelId: selectedModel,
      userApiKeys: userApiKeys,
    },
    id: chatId,
    onError: (error) => {
      console.error("Chat processing error:", error);
    },
    onFinish: async (message) => {
      console.log("Message finished:", message.id);
    },
  });

  // Check if coming from transition
  useEffect(() => {
    const transition = searchParams.get("transition");
    const persona = searchParams.get("persona");

    if (persona) {
      setSelectedPersona(persona);
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

      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("transition");
      url.searchParams.delete("persona");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // SIMPLE: Load existing conversation if it exists, or prepare for new one
  useEffect(() => {
    const loadConversation = async () => {
      // Skip temp IDs - these don't exist yet
      if (chatId.startsWith('temp-') || !chatId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        setConversationTitle("New Chat");
        return;
      }

      try {
        console.log('🔥 Loading conversation:', chatId);
        const response = await fetch(`/api/conversations/${chatId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔥 Successfully loaded existing conversation:', chatId);
          
          setConversationTitle(data.conversation.title);
          
          // Convert database messages to chat format
          const chatMessages = data.messages.map((msg: any) => {
            const baseMessage = {
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: new Date(msg.created_at),
            };
            
            // Add toolInvocations if they exist
            if (msg.role === 'assistant' && msg.metadata?.toolResults) {
              return {
                ...baseMessage,
                toolInvocations: msg.metadata.toolResults.map((tool: any) => ({
                  toolCallId: tool.toolCallId || `tool-${Date.now()}-${Math.random()}`,
                  toolName: tool.toolName,
                  args: tool.args,
                  result: tool.result,
                  state: 'result'
                }))
              };
            }
            
            return baseMessage;
          });
          
          setMessages(chatMessages);
          console.log('🔥 Loaded', chatMessages.length, 'messages from existing conversation');
        } else if (response.status === 404) {
          console.log('🔥 Conversation not found (404) - will create new one on first message');
          setConversationTitle("New Chat");
        }
      } catch (error) {
        console.error('🔥 Error loading conversation:', error);
        setConversationTitle("New Chat");
      }
    };

    loadConversation();
  }, [chatId, setMessages]);

  // SIMPLE: Process initial message from URL
  useEffect(() => {
    const initialMessage = searchParams.get("message");

    if (initialMessage && !initialMessageProcessedRef.current) {
      console.log('🔥 Processing initial message:', initialMessage);
      initialMessageProcessedRef.current = true;

      // Increment API usage
      if ((window as any).incrementApiUsage) {
        (window as any).incrementApiUsage();
      }

      // Send the message - useChat and backend will handle conversation creation
      append({
        role: "user",
        content: initialMessage,
      });

      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, append]);

  // SIMPLE: Handle submit - just send the message
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    console.log('🔥 Sending message with model:', selectedModel);
    
    // The original handleSubmit from useChat will handle everything
    originalHandleSubmit(e);
  };

  // Update conversation title when first message is sent
  useEffect(() => {
    if (messages.length > 0 && conversationTitle === "New Chat") {
      const firstUserMessage = messages.find(m => m.role === "user");
      if (firstUserMessage) {
        const title = generateFallbackTitle(firstUserMessage.content);
        setConversationTitle(title);
        
        // Generate AI title asynchronously
        setTimeout(() => {
          generateAndUpdateTitle(chatId, firstUserMessage.content).catch(console.error);
        }, 1000);
      }
    }
  }, [messages.length]);

  // Generate fallback title
  const generateFallbackTitle = (content: string) => {
    const words = content.split(" ").slice(0, 6).join(" ");
    let title = words.length > 40 ? words.substring(0, 37) + "..." : words;
    title = title.replace(/\b\w/g, (char) => char.toUpperCase());
    return title || 'New Chat';
  };

  // Generate AI title
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
        
        // Broadcast title update to other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('conversationUpdated', {
            detail: { id: conversationId, title: data.title }
          }));
        }
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

  // Load user preferences including model selection
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const { preferences } = await response.json();
          if (preferences?.preferred_model) {
            setSelectedModel(preferences.preferred_model);
          }
        }
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      }
    };

    loadUserPreferences();
  }, []);

  // Load model from URL params
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
              {isLoading ? (
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
