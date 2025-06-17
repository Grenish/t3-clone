"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useTheme } from "@/util/theme-provider";
import { supabase } from "@/lib/supabase";
import GradientBall from "@/components/gradient-ball";
import PromptBox from "@/components/prompt-box";
import TimeGreetings from "@/components/time-greetings";
import AutoResizeTextarea from "@/components/auto-resize-textarea";
import Tooltip from "@/components/tooltip";
import AddMenu from "@/components/add-menu";
import ToolsMenu from "@/components/tools-menu";
import ModelSelector from "@/components/model-selector";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Plus,
  Settings2,
  X,
  FileText,
  LogIn,
  UserPlus,
  AlertTriangle,
  Send,
} from "lucide-react";

export default function ReworkPage() {
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [textareaValue, setTextareaValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [selectedTool, setSelectedTool] = useState<{
    tool: string;
    persona?: string;
  } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>("Guest");
  const [user, setUser] = useState<any>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [selectedModel, setSelectedModel] =
    useState<string>("gemini-2.0-flash");
  const [inputHasMoved, setInputHasMoved] = useState(false);
  const { isDarkMode } = useTheme();
  const pageRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const headerContentRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputSectionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const addButtonRef = useRef<HTMLButtonElement>(
    null
  ) as React.RefObject<HTMLButtonElement>;
  const toolsButtonRef = useRef<HTMLButtonElement>(
    null
  ) as React.RefObject<HTMLButtonElement>;

  const defaultPromptSuggestions = [
    "Explain how an AI can automate customer support.",
    "Find me a weekend getaway destination near Mumbai.",
    "Generate a workout plan for beginners at home.",
    "Convert this paragraph into a professional LinkedIn post.",
  ];

  const displayedSuggestions =
    selectedPrompts.length > 0 ? selectedPrompts : defaultPromptSuggestions;

  const handleSuggestionClick = (suggestion: string) => {
    setTextareaValue(suggestion);
  };

  const handleFileSelect = (file: File) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToolSelect = (tool: { tool?: string; persona?: string }) => {
    setSelectedTool({
      tool: tool.tool || tool.persona || "",
      persona: tool.persona,
    });
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

  const handleSend = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!textareaValue.trim() || isTransitioning) return;

      if (!(window as any).canMakeApiCall?.()) {
        if (!isAuthenticated) {
          setShowLimitWarning(true);
        } else {
          setShowLimitModal(true);
        }
        return;
      }

      setIsTransitioning(true);
      setShowLimitWarning(false);

      if (
        !inputHasMoved &&
        inputSectionRef.current &&
        headerContentRef.current
      ) {
        setInputHasMoved(true);

        const viewportHeight = window.innerHeight;
        const inputRect = inputSectionRef.current.getBoundingClientRect();
        const targetY = viewportHeight - inputRect.height - 20;
        const currentY = inputRect.top;
        const moveDistance = targetY - currentY;

        const tl = gsap.timeline();

        tl.to(headerContentRef.current, {
          y: -100,
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
        }).to(
          inputSectionRef.current,
          {
            y: moveDistance,
            duration: 0.6,
            ease: "power2.inOut",
          },
          "-=0.2"
        );

        await new Promise((resolve) => {
          tl.call(resolve);
        });
      }

      try {
        const title =
          textareaValue.length > 40
            ? textareaValue.substring(0, 37) + "..."
            : textareaValue;

        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const conversationId = data.conversation.id;

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

          console.log('📎 Sending', filesForAPI.length, 'files with new conversation');

          const searchParams = new URLSearchParams({
            transition: "true",
            message: textareaValue,
            modelId: selectedModel,
            webSearchEnabled: selectedTool?.tool === "Web Search" ? "true" : "false", // Add web search parameter
          });

          if (selectedTool?.persona) {
            searchParams.set("persona", selectedTool.persona);
          }

          // Include files in sessionStorage for the transition
          if (filesForAPI.length > 0) {
            sessionStorage.setItem(`files_${conversationId}`, JSON.stringify(filesForAPI));
            searchParams.set("hasFiles", "true");
          }

          router.push(`/c/${conversationId}?${searchParams.toString()}`);
        } else {
          throw new Error("Failed to create conversation");
        }
      } catch (error) {
        setIsTransitioning(false);
        setInputHasMoved(false);
      }
    },
    [
      textareaValue,
      isTransitioning,
      isAuthenticated,
      selectedModel,
      selectedTool,
      inputHasMoved,
      uploadedFiles,
      router,
    ]
  );

  const checkAuth = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setIsAuthenticated(true);
      setUserName(
        user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
      );
      setUser(user);
    } else {
      setIsAuthenticated(false);
      setUserName("Guest");
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
        const user = session.user;
        setUserName(
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
        );
        setUser(user);
      } else {
        setIsAuthenticated(false);
        setUserName("Guest");
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAuth]);

  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!isAuthenticated || !user) return;

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
  }, [isAuthenticated, user]);

  const LimitModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`p-6 rounded-lg max-w-md w-full mx-4 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Daily Limit Reached
        </h3>
        <p className={`mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          {isAuthenticated
            ? "You've reached your daily API limit. Upgrade to Pro for 50 daily requests."
            : "You've used all 5 free requests today. Sign in to get 20 daily requests or create an account for more features."}
        </p>
        <div className="flex gap-3">
          {!isAuthenticated && (
            <>
              <Button onClick={() => router.push("/login")} className="flex-1">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button
                onClick={() => router.push("/signup")}
                variant="outline"
                className="flex-1"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </>
          )}
          {isAuthenticated && (
            <Button
              onClick={() => {
                /* Handle pro upgrade */
              }}
              className="flex-1"
            >
              Upgrade to Pro
            </Button>
          )}
          <Button onClick={() => setShowLimitModal(false)} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div
        ref={pageRef}
        className={`w-full min-h-screen flex flex-col ${
          isDarkMode
            ? "bg-gradient-to-b from-[#1B1B1B] to-[#003153]"
            : "bg-gradient-to-b from-[#fdfbfb] to-[#ebedee]"
        }`}
      >
        {/* Mobile Header with Model Selector */}
        <div
          className={`block sm:hidden border-b px-4 py-4 ${
            isDarkMode
              ? "bg-gray-800/95 backdrop-blur-sm border-gray-700"
              : "bg-white/95 backdrop-blur-sm border-gray-200"
          }`}
        >
          <div className="flex items-center justify-center">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              size="sm"
              className="w-full max-w-[240px]"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12">
          <div className="w-full max-w-6xl mx-auto">
            <div ref={headerContentRef} className="text-center mb-12 sm:mb-16">
              <div className="w-full flex items-center justify-center mb-8">
                <GradientBall />
              </div>

              <div className="space-y-4">
                <TimeGreetings
                  user={userName}
                  className={`text-3xl sm:text-4xl lg:text-5xl font-light leading-tight ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                />
              </div>
            </div>

            {/* Input Section */}
            <div ref={inputSectionRef} className="w-full mt-8 sm:mt-12">
              <div ref={formRef} className="w-full sm:max-w-4xl mx-auto">
                {/* Limit Warning */}
                {showLimitWarning && !isAuthenticated && (
                  <div
                    className={`mb-6 p-6 rounded-3xl border flex items-start gap-4 backdrop-blur-sm ${
                      isDarkMode
                        ? "bg-orange-900/20 border-orange-800/50 text-orange-200"
                        : "bg-orange-50/80 border-orange-200 text-orange-800"
                    }`}
                  >
                    <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold mb-1">Daily limit reached</p>
                      <p className="text-sm opacity-90 mb-4">
                        Sign in to get 20 daily requests or create an account
                        for more features.
                      </p>
                      <div className="flex gap-3">
                        <Button size="sm" onClick={() => router.push("/login")}>
                          Sign In
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push("/signup")}
                        >
                          Sign Up
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input Form */}
                <form onSubmit={handleSend}>
                  <div
                    className={`rounded-3xl border shadow-xl p-4 sm:p-5 backdrop-blur-sm ${
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
                      placeholder="Ask me anything..."
                      value={textareaValue}
                      onChange={setTextareaValue}
                      onSubmit={() => {
                        if (textareaValue.trim() && !isTransitioning) {
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
                          },
                          {
                            ref: toolsButtonRef,
                            icon: Settings2,
                            label: "Tools",
                            onClick: () => setShowToolsMenu(!showToolsMenu),
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
                          disabled={!textareaValue.trim() || isTransitioning}
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

                {/* Menus */}
                <AddMenu
                  isOpen={showAddMenu}
                  onClose={() => setShowAddMenu(false)}
                  onFileSelect={handleFileSelect}
                  buttonRef={addButtonRef}
                />

                <ToolsMenu
                  isOpen={showToolsMenu}
                  onClose={() => setShowToolsMenu(false)}
                  onToolSelect={handleToolSelect}
                  buttonRef={toolsButtonRef}
                />
              </div>
            </div>
          </div>

          {showLimitModal && <LimitModal />}
        </div>
      </div>
    </PageTransition>
  );
}
