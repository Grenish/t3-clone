"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useChat } from "ai/react";
import { gsap } from "gsap";
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
import CitationCard from "@/components/cards/citation-card";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null!);
  const toolsButtonRef = useRef<HTMLButtonElement>(null!);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append,
  } = useChat({
    api: "/api/chat",
    headers: {
      "x-api-key": process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
    },
  });

  // Check if coming from transition
  useEffect(() => {
    const transition = searchParams.get("transition");
    if (transition === "true") {
      setIsFromTransition(true);

      // Animate header in from top
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { y: -80, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
        );
      }

      // Ensure input container is at natural bottom position
      if (inputContainerRef.current) {
        gsap.set(inputContainerRef.current, { clearProps: "all" });
      }

      // Animate messages container in
      if (messagesContainerRef.current) {
        gsap.fromTo(
          messagesContainerRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", delay: 0.2 }
        );
      }

      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("transition");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Get initial message from URL params or localStorage
  useEffect(() => {
    if (hasInitialized) return;

    const urlParams = new URLSearchParams(window.location.search);
    const initialMessage = urlParams.get("message");

    if (initialMessage && messages.length === 0) {
      setHasInitialized(true);
      // Use the append function to properly handle the conversation
      append({
        role: "user",
        content: initialMessage,
      });
    }
  }, [messages.length, hasInitialized, append]);

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

  const handleBackToHome = () => {
    if (!isTransitioningBack) {
      setIsTransitioningBack(true);

      const tl = gsap.timeline({
        onComplete: () => {
          router.push("/");
        },
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
  };

  const handleRemoveTool = () => {
    setSelectedTool(null);
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
      case "webSearch":
        if (!result || !result.success) return null;
        return (
          <CitationCard
            query={result.query}
            citations={result.citations || []}
            totalResults={result.totalResults}
            searchTime={result.searchTime}
            searchType={result.searchType}
          />
        );
      case "generateProductCard":
        if (!result) return null;

        // Handle array of products
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
                  platform={product.platform}
                  imageAlt={product.imageAlt}
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
            platform={result.platform}
            imageAlt={result.imageAlt}
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
              chartData: result.chartData,
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
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div
          ref={headerRef}
          className="bg-white border-b border-gray-200 px-4 py-3"
        >
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <button
              onClick={handleBackToHome}
              disabled={isTransitioningBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">T3 Chat</h1>
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
                  <div className="max-w-2xl px-4 py-3 rounded-2xl bg-gray-900 text-white">
                    <MessageContent content={message.content} isUser={true} />
                  </div>
                ) : (
                  <div className="w-full group">
                    <MessageContent content={message.content} isUser={false} />

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
                        className={`p-1.5 hover:bg-gray-100 rounded-md transition-all duration-200 cursor-pointer transform hover:scale-110 active:scale-95 ${
                          copiedMessageId === (message.id || `${index}`)
                            ? "bg-green-100 text-green-600"
                            : ""
                        }`}
                        title={
                          copiedMessageId === (message.id || `${index}`)
                            ? "Copied!"
                            : "Copy"
                        }
                      >
                        <Copy
                          className={`w-4 h-4 text-gray-600 transition-all duration-200 ${
                            copiedMessageId === (message.id || `${index}`)
                              ? "text-green-600 scale-110"
                              : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleRetryMessage(index)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-all duration-200 cursor-pointer transform hover:scale-110 active:scale-95 hover:rotate-180"
                        title="Retry"
                      >
                        <RotateCcw className="w-4 h-4 text-gray-600 transition-transform duration-300" />
                      </button>
                      <button
                        onClick={() =>
                          handleFeedback(message.id || `${index}`, true)
                        }
                        className="p-1.5 hover:bg-green-50 hover:text-green-600 rounded-md transition-all duration-200 cursor-pointer transform hover:scale-110 active:scale-95"
                        title="Good response"
                      >
                        <ThumbsUp className="w-4 h-4 text-gray-600 hover:text-green-600 transition-all duration-200" />
                      </button>
                      <button
                        onClick={() =>
                          handleFeedback(message.id || `${index}`, false)
                        }
                        className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md transition-all duration-200 cursor-pointer transform hover:scale-110 active:scale-95"
                        title="Bad response"
                      >
                        <ThumbsDown className="w-4 h-4 text-gray-600 hover:text-red-600 transition-all duration-200" />
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
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
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
        <div
          ref={inputContainerRef}
          className="bg-white border-t border-gray-200 px-4 py-4"
        >
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                {uploadedFiles.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 max-w-fit"
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
                          <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                        <span className="text-xs text-gray-600 font-medium">
                          {getDisplayFileName(file.name)}
                        </span>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
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
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 text-sm flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 cursor-pointer"
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
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 text-sm flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 cursor-pointer"
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
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-sm text-blue-700 font-medium">
                          {selectedTool.persona
                            ? selectedTool.persona
                            : selectedTool.tool}
                        </span>
                        <button
                          onClick={handleRemoveTool}
                          className="text-blue-400 hover:text-blue-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
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
