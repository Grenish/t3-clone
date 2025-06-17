"use client";

import AutoResizeTextarea from "@/components/auto-resize-textarea";
import PromptBox from "@/components/prompt-box";
import ModelSelector from "@/components/model-selector";
import AddMenu from "@/components/add-menu";
import ToolsMenu from "@/components/tools-menu";
import {
  FileText,
  X,
  Plus,
  Settings2,
  ArrowUp,
  CircleFadingArrowUp,
  ChevronRight,
  LogIn,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/util/theme-provider";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function DefaultPage() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [textareaValue, setTextareaValue] = useState<string>("");
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [selectedTool, setSelectedTool] = useState<{
    tool: string;
    persona?: string;
  } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [selectedModel, setSelectedModel] =
    useState<string>("gemini-2.0-flash");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null!);
  const toolsButtonRef = useRef<HTMLButtonElement>(null!);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsAuthenticated(!!user);
      setUser(user);
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!textareaValue.trim() || isTransitioning) return;

    // Check if user can make API call
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

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

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

      console.log(
        "📎 Sending",
        filesForAPI.length,
        "files with new conversation"
      );

      const searchParams = new URLSearchParams({
        transition: "true",
        message: textareaValue.trim(),
        modelId: selectedModel,
        webSearchEnabled: selectedTool?.tool === "Web Search" ? "true" : "false", // Add web search parameter
      });

      if (selectedTool?.persona) {
        searchParams.set("persona", selectedTool.persona);
      }

      // Include files in the URL if there are any (for small files)
      // For larger files, we'll need to handle them differently
      if (filesForAPI.length > 0) {
        // Store files in sessionStorage temporarily for the transition
        sessionStorage.setItem(`files_${conversationId}`, JSON.stringify(filesForAPI));
        searchParams.set("hasFiles", "true");
      }

      router.push(`/c/${conversationId}?${searchParams.toString()}`);
    } catch (error) {
      setIsTransitioning(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((files) => files.filter((_, i) => i !== index));
  };

  const handleFileSelect = (file: File) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  const handleToolSelect = (tool: { tool?: string; persona?: string }) => {
    if (tool.tool) {
      setSelectedTool(tool as { tool: string; persona?: string });
    }
  };

  const handleRemoveTool = () => {
    setSelectedTool(null);
  };

  const getDisplayFileName = (name: string): string => {
    return name.length > 20 ? name.substring(0, 20) + "..." : name;
  };

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
            ? "You've reached your daily API limit. Your conversations are saved and you can continue tomorrow or upgrade to Pro for 50 daily requests."
            : "You've used all 5 free requests today. Sign in to get 20 daily requests, save your conversations, and access more features."}
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
            <Button onClick={() => {}} className="flex-1">
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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Mobile Header with Model Selector */}
      <div
        className={`flex-shrink-0 block sm:hidden border-b px-3 sm:px-4 py-3 ${
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
            className="w-full max-w-[200px]"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 overflow-y-auto">
        <div className="text-center mb-8 sm:mb-12 max-w-4xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-3 sm:mb-4">
            How can I help you today?
          </h2>

          {!isAuthenticated && (
            <p
              className={`text-base sm:text-lg ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <button
                onClick={() => router.push("/login")}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Sign in
              </button>{" "}
              to save your conversations and get more daily requests.
            </p>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          {showLimitWarning && !isAuthenticated && (
            <div
              className={`mb-4 sm:mb-6 p-4 sm:p-6 rounded-3xl border flex items-start gap-3 sm:gap-4 backdrop-blur-sm ${
                isDarkMode
                  ? "bg-orange-900/20 border-orange-800/50 text-orange-200"
                  : "bg-orange-50/80 border-orange-200 text-orange-800"
              }`}
            >
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold mb-1 text-sm sm:text-base">
                  Daily limit reached
                </p>
                <p className="text-xs sm:text-sm opacity-90 mb-3 sm:mb-4">
                  Sign in to get 20 daily requests, save conversations, and
                  access more features.
                </p>
                <div className="flex gap-2 sm:gap-3">
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

          <form onSubmit={handleSend}>
            <div
              className={`rounded-3xl border shadow-xl p-3 sm:p-4 backdrop-blur-sm ${
                isDarkMode
                  ? "bg-gray-800/90 border-gray-700/50"
                  : "bg-white/90 border-gray-200/50"
              }`}
            >
              {uploadedFiles.length > 0 && (
                <div className="mb-3 sm:mb-4 flex flex-wrap gap-2 sm:gap-3">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl border transition-all hover:scale-105 ${
                        isDarkMode
                          ? "bg-gray-700/60 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="w-6 h-6 sm:w-7 sm:h-7 object-cover rounded-xl border"
                        />
                      ) : (
                        <FileText
                          className={`w-5 h-5 sm:w-6 sm:h-6 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        />
                      )}
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {getDisplayFileName(file.name)}
                      </span>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className={`transition-all hover:scale-110 ${
                          isDarkMode
                            ? "text-gray-500 hover:text-red-400"
                            : "text-gray-400 hover:text-red-500"
                        }`}
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

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
                className="py-2 sm:py-3 text-base sm:text-lg leading-relaxed resize-none w-full"
              />

              <div className="flex items-center justify-between gap-3 sm:gap-4 mt-3 sm:mt-4">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
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
                      <button
                        ref={button.ref}
                        onClick={button.onClick}
                        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                          isDarkMode
                            ? "bg-gray-700/50 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600"
                            : "bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 border-gray-200"
                        }`}
                      >
                        <button.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="font-medium text-xs sm:text-sm hidden sm:inline">
                          {button.label}
                        </span>
                      </button>
                    </div>
                  ))}

                  {selectedTool && (
                    <div
                      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-2xl border ${
                        isDarkMode
                          ? "bg-blue-900/30 border-blue-700/50 text-blue-300"
                          : "bg-blue-50 border-blue-200 text-blue-700"
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-medium truncate max-w-24 sm:max-w-32 lg:max-w-none">
                        {selectedTool.persona || selectedTool.tool}
                      </span>
                      <button
                        onClick={handleRemoveTool}
                        className="transition-all hover:scale-110"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden sm:block">
                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      size="sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!textareaValue.trim() || isTransitioning}
                    className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl ${
                      isDarkMode
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white disabled:from-gray-600 disabled:to-gray-600"
                        : "bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white disabled:from-gray-400 disabled:to-gray-400"
                    }`}
                  >
                    {isTransitioning ? (
                      <CircleFadingArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>

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

      {showLimitModal && <LimitModal />}
    </div>
  );
}
