"use client";

import { useState, useRef } from "react";
import GradientBall from "@/components/gradient-ball";
import PromptBox from "@/components/prompt-box";
import TimeGreetings from "@/components/time-greetings";
import AutoResizeTextarea from "@/components/auto-resize-textarea";
import Tooltip from "@/components/tooltip";
import AddMenu from "@/components/add-menu";
import ToolsMenu from "@/components/tools-menu";
import {
  ChevronRight,
  Plus,
  Settings2,
  X,
  FileText,
  Image,
} from "lucide-react";

export default function Home() {
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [textareaValue, setTextareaValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedTool, setSelectedTool] = useState<{
    tool: string;
    persona?: string;
  } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const addButtonRef = useRef<HTMLButtonElement>(
    null
  ) as React.RefObject<HTMLButtonElement>;
  const toolsButtonRef = useRef<HTMLButtonElement>(
    null
  ) as React.RefObject<HTMLButtonElement>;

  const defaultPromptSuggestions = [
    "What's the weather in New York?",
    "Suggest me some good earbuds.",
    "How can I use AI in my business?",
    "What are the latest AI trends?",
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

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-4xl mx-auto">
        <div className="w-full flex items-center justify-center">
          <GradientBall />
        </div>

        <div className="mt-8 text-center">
          <TimeGreetings
            user="John"
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-700 mb-2"
          />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900">
            How can I help you today?
          </h2>
        </div>

        <div className="mt-12 sm:mt-16 w-full">
          <PromptBox onPromptsChange={setSelectedPrompts} />
          <div className="max-w-2xl mx-auto mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayedSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left p-4 cursor-pointer rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-gray-700 text-sm leading-relaxed pr-3 font-medium">
                      {suggestion}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-300 flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full mt-16 sm:mt-20">
          <div className="max-w-3xl mx-auto">
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
                          src={URL.createObjectURL(file)}
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
                placeholder="Ask me anything..."
                value={textareaValue}
                onChange={setTextareaValue}
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

                <button className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
