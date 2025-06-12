"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useTheme } from "@/util/theme-provider";
import GradientBall from "@/components/gradient-ball";
import PromptBox from "@/components/prompt-box";
import TimeGreetings from "@/components/time-greetings";
import AutoResizeTextarea from "@/components/auto-resize-textarea";
import Tooltip from "@/components/tooltip";
import AddMenu from "@/components/add-menu";
import ToolsMenu from "@/components/tools-menu";
import PageTransition from "@/components/page-transition";
import {
  ChevronRight,
  Plus,
  Settings2,
  X,
  FileText,
  Image,
} from "lucide-react";

export default function ReworkPage() {
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [textareaValue, setTextareaValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedTool, setSelectedTool] = useState<{
    tool: string;
    persona?: string;
  } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { isDarkMode } = useTheme();
  const pageRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const headerContentRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (textareaValue.trim() && !isTransitioning) {
      setIsTransitioning(true);

      const tl = gsap.timeline({
        onComplete: () => {
          // Generate a unique chat ID
          const chatId = Date.now().toString();

          // Create URL with message and persona
          const searchParams = new URLSearchParams({
            message: textareaValue.trim(),
            transition: "true",
          });

          // Add persona if selected
          if (selectedTool?.persona) {
            searchParams.set("persona", selectedTool.persona);
          }

          // Navigate to chat page
          router.push(`/c/${chatId}?${searchParams.toString()}`);
        },
      });

      // Animate header content (logo, greeting) to fade and move up
      tl.to(
        headerContentRef.current,
        {
          opacity: 0,
          y: -50,
          duration: 0.4,
          ease: "power2.inOut",
        },
        0
      );

      // Animate suggestions to fade and move up
      tl.to(
        suggestionsRef.current,
        {
          opacity: 0,
          y: -30,
          duration: 0.3,
          ease: "power2.inOut",
        },
        0.1
      );

      // Move the form to bottom position (matching chat page layout)
      tl.to(
        formRef.current,
        {
          y:
            window.innerHeight -
            formRef.current!.getBoundingClientRect().bottom -
            16,
          duration: 0.6,
          ease: "power2.inOut",
        },
        0.2
      );
    }
  };

  return (
    <PageTransition>
      <div
        ref={pageRef}
        className={`w-full min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 ${
          isDarkMode
            ? "bg-gradient-to-b from-[#1B1B1B] to-[#003153]"
            : "bg-gradient-to-b from-[#fdfbfb] to-[#ebedee]"
        }`}
      >
        <div className="w-full max-w-4xl mx-auto">
          <div ref={headerContentRef}>
            <div className="w-full flex items-center justify-center">
              <GradientBall />
            </div>

            <div className="mt-8 text-center">
              <TimeGreetings
                user="John"
                className={`text-2xl sm:text-3xl lg:text-4xl font-light mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              />
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-light ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                How can I help you today?
              </h2>
            </div>
          </div>

          <div ref={suggestionsRef} className="mt-12 sm:mt-16 w-full">
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

          <div
            className="w-full mt-16 sm:mt-20"
            style={{
              zIndex: isTransitioning ? 50 : "auto",
            }}
          >
            <div ref={formRef} className="max-w-3xl mx-auto">
              <form onSubmit={handleSend}>
                <div
                  className={`rounded-2xl border shadow-sm p-4 ${
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
                        <Tooltip message="Add images or documents">
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
                                ? "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-gray-100 border-gray-600 hover:border-gray-500"
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
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white disabled:text-gray-400"
                          : "bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white"
                      }`}
                    >
                      {isTransitioning ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
