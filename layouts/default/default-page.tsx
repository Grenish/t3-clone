"use client";

import AutoResizeTextarea from "@/components/auto-resize-textarea";
import PromptBox from "@/components/prompt-box";
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
import { useConversations } from "@/hooks/use-conversations";

export default function DefaultPage() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [textareaValue, setTextareaValue] = useState<string>("");
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
  const [showToolsMenu, setShowToolsMenu] = useState<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<{
    persona?: string;
    tool?: string;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [user, setUser] = useState<any>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);

  // Add conversation management
  const { createConversation } = useConversations();

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
      let conversationId: string;

      if (isAuthenticated) {
        // Create a proper conversation in the database
        const title = textareaValue.trim().split(' ').slice(0, 6).join(' ');
        const conversation = await createConversation(title.length > 40 ? title.substring(0, 37) + '...' : title);
        conversationId = conversation.id;
      } else {
        // Generate a temporary chat ID for non-authenticated users
        conversationId = Date.now().toString();
      }

      // Create URL with message and persona for initial processing
      const searchParams = new URLSearchParams({
        message: textareaValue.trim(),
        transition: "true",
      });

      // Add persona if selected
      if (selectedTool?.persona) {
        searchParams.set("persona", selectedTool.persona);
      }

      // Navigate to chat page
      router.push(`/c/${conversationId}?${searchParams.toString()}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      setIsTransitioning(false);
      
      // Fallback to temporary ID if conversation creation fails
      const chatId = Date.now().toString();
      const searchParams = new URLSearchParams({
        message: textareaValue.trim(),
        transition: "true",
      });

      if (selectedTool?.persona) {
        searchParams.set("persona", selectedTool.persona);
      }

      router.push(`/c/${chatId}?${searchParams.toString()}`);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((files) => files.filter((_, i) => i !== index));
  };

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleToolSelect = (tool: { persona?: string; tool?: string }) => {
    setSelectedTool(tool);
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
        <p
          className={`mb-6 ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {isAuthenticated
            ? "You've reached your daily API limit. Your conversations are saved and you can continue tomorrow or upgrade to Pro for 50 daily requests."
            : "You've used all 5 free requests today. Sign in to get 20 daily requests, save your conversations, and access more features."}
        </p>
        <div className="flex gap-3">
          {!isAuthenticated && (
            <>
              <Button
                onClick={() => router.push("/login")}
                className="flex-1"
              >
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
          <Button
            onClick={() => setShowLimitModal(false)}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">
            How can I help you today?
          </h2>
          {isAuthenticated && user && (
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Welcome back, {user.email?.split('@')[0]}! Your conversations are automatically saved.
            </p>
          )}
          {!isAuthenticated && (
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <button 
                onClick={() => router.push('/login')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign in
              </button>
              {' '}to save your conversations and get more daily requests.
            </p>
          )}
        </div>

        <div className="w-full max-w-4xl">
          <PromptBox onPromptsChange={setSelectedPrompts} />
          <div className="max-w-2xl mx-auto mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayedSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isTransitioning}
                  className={`text-left p-4 cursor-pointer rounded-xl border transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-800/60 hover:bg-gray-700/60 hover:border-gray-600 hover:shadow-lg hover:shadow-blue-900/10"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-sm leading-relaxed pr-3 font-medium ${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      {suggestion}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 transition-colors duration-300 flex-shrink-0 mt-0.5 ${
                        isDarkMode
                          ? "text-gray-500 group-hover:text-gray-300"
                          : "text-gray-400 group-hover:text-gray-600"
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="max-w-3xl mx-auto">
          {/* Show limit warning above input when needed */}
          {showLimitWarning && !isAuthenticated && (
            <div className={`mb-4 p-4 rounded-xl border flex items-center gap-3 ${
              isDarkMode
                ? "bg-orange-900/20 border-orange-800 text-orange-200"
                : "bg-orange-50 border-orange-200 text-orange-800"
            }`}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  You've hit your daily limit of 5 requests.
                </p>
                <p className="text-xs mt-1 opacity-90">
                  Sign in to get 20 daily requests, save conversations, and access more features.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => router.push('/login')}
                  className="text-xs"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/signup')}
                  className="text-xs"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSend}>
            <div
              className={`rounded-t-2xl border shadow-sm p-4 ${
                isDarkMode
                  ? "bg-gray-800/70 border-gray-700"
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
                          ? "bg-gray-700/60 border-gray-600"
                          : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
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
                    <button
                      ref={addButtonRef}
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className={`text-sm flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                        isDarkMode
                          ? "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-gray-100 border-gray-600 hover:border-gray-500"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-medium">Add</span>
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      ref={toolsButtonRef}
                      onClick={() => setShowToolsMenu(!showToolsMenu)}
                      className={`text-sm flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                        isDarkMode
                          ? "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-gray-100 border-gray-600 hover:border-gray-500"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Settings2 className="w-4 h-4" />
                      <span className="font-medium">Tools</span>
                    </button>
                  </div>

                  {selectedTool && (
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        isDarkMode
                          ? "bg-blue-900/40 border-blue-700/50"
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
                  disabled={!textareaValue.trim() || isTransitioning}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isDarkMode
                      ? "bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white disabled:text-gray-400"
                      : "bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white"
                  }`}
                >
                  {isTransitioning ? (
                    <CircleFadingArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showLimitModal && <LimitModal />}
    </div>
  );
}
