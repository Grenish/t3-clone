"use client";

import { Limiter } from "@/components/limiter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThemeSwitch from "@/components/theme-switch";
import LayoutSwitch from "@/components/layout-switch";
import ImageGallery from "@/components/image-gallery";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import {
  Zap,
  TrendingUp,
  Headphones,
  AlertTriangle,
  Monitor,
  Globe,
  Type,
  Settings,
  User,
  X,
  Plus,
  Eye,
  ArrowLeft,
  Menu,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserPreferences {
  display_name?: string;
  occupation?: string;
  traits?: string[];
  additional_info?: string;
}

interface UserFile {
  id: string;
  file_name: string;
  file_size: number;
  type: "image" | "document";
  created_at: string;
  conversation_title: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Form state
  const [userName, setUserName] = useState("");
  const [userOccupation, setUserOccupation] = useState("");
  const [traitInput, setTraitInput] = useState("");
  const [traits, setTraits] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({
    openai: "",
    gemini: "",
    grok: "",
    groq: "",
    openrouter: "",
  });

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  // Files state
  const [userImages, setUserImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [imagesStats, setImagesStats] = useState({
    total_images: 0,
    total_size_mb: 0,
  });

  const loadUserPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const response = await fetch("/api/user/preferences");

      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setUserName(data.preferences.display_name || "");
          setUserOccupation(data.preferences.occupation || "");
          setTraits(data.preferences.traits || []);
          setAdditionalInfo(data.preferences.additional_info || "");
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const loadUserImages = async () => {
    try {
      setLoadingImages(true);
      const response = await fetch("/api/user/files");

      if (response.ok) {
        const data = await response.json();
        // Only get images, not documents
        setUserImages(data.files.images || []);
        setImagesStats({
          total_images: data.stats.total_images || 0,
          total_size_mb: Math.round((data.stats.total_size_bytes || 0) / (1024 * 1024) * 100) / 100,
        });
      }
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setLoadingImages(false);
    }
  };

  // Load user preferences on mount
  useEffect(() => {
    if (user && !authLoading) {
      loadUserPreferences();
      loadUserImages();
    }
  }, [user, authLoading]);

  const saveUserPreferences = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setSaveStatus("idle");

      const preferences: UserPreferences = {
        display_name: userName.trim() || undefined,
        occupation: userOccupation.trim() || undefined,
        traits: traits.length > 0 ? traits : undefined,
        additional_info: additionalInfo.trim() || undefined,
      };

      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including conversations, preferences, and uploaded files."
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      // Sign out first to clear the session
      await supabase.auth.signOut();

      const response = await fetch("/api/user/account", {
        method: "DELETE",
      });

      if (response.ok) {
        // Redirect to login after successful deletion
        router.push("/login");
      } else {
        alert("Failed to delete account. Please try again or contact support.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch("/api/user/history");

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-history-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("Failed to export history. Please try again.");
      }
    } catch (error) {
      console.error("Error exporting history:", error);
      alert("Failed to export history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete all your message history? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await fetch("/api/user/history", {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Message history deleted successfully.");
      } else {
        alert("Failed to delete history. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting history:", error);
      alert("Failed to delete history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-[#fdfbfb] to-[#ebedee] dark:from-[#1B1B1B] dark:to-[#003153] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-400" />
      </div>
    );
  }

  const apiProviders = [
    {
      id: "openai",
      name: "OpenAI",
      description: "Access GPT-4, GPT-3.5, and other OpenAI models",
      placeholder: "sk-...",
      website: "https://platform.openai.com/api-keys",
    },
    {
      id: "gemini",
      name: "Google Gemini",
      description: "Access Gemini Pro and other Google AI models",
      placeholder: "AIza...",
      website: "https://makersuite.google.com/app/apikey",
    },
    {
      id: "grok",
      name: "Grok (xAI)",
      description: "Access Grok models from xAI",
      placeholder: "xai-...",
      website: "https://x.ai",
    },
    {
      id: "groq",
      name: "Groq",
      description: "Access high-speed inference for various models",
      placeholder: "gsk_...",
      website: "https://console.groq.com/keys",
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      description: "Access multiple AI models through one API",
      placeholder: "sk-or-...",
      website: "https://openrouter.ai/keys",
    },
  ];

  const handleApiKeyChange = (providerId: string, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [providerId]: value,
    }));
  };

  const handleSaveApiKey = (providerId: string) => {
    // Here you would save the API key to your backend/storage
    console.log(`Saving API key for ${providerId}:`, apiKeys[providerId]);
  };

  const handleRemoveApiKey = (providerId: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [providerId]: "",
    }));
  };

  const handleTraitAdd = (trait: string) => {
    if (trait.trim() && traits.length < 50 && !traits.includes(trait.trim())) {
      setTraits([...traits, trait.trim()]);
    }
  };

  const handleTraitInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (traitInput.trim()) {
        handleTraitAdd(traitInput);
        setTraitInput("");
      }
    }
  };

  const removeTrait = (index: number) => {
    setTraits(traits.filter((_, i) => i !== index));
  };

  const suggestedTraits = [
    "empathetic",
    "creative",
    "patient",
    "analytical",
    "humorous",
    "direct",
  ];

  const upgradeBenefits = [
    {
      icon: Monitor,
      title: "Advanced Models",
      description: "Access to GPT-4, Claude, and other premium AI models.",
      color: "emerald",
    },
    {
      icon: TrendingUp,
      title: "Higher Limits",
      description: "Unlimited conversations and extended usage quotas.",
      color: "purple",
    },
    {
      icon: Headphones,
      title: "Priority Support",
      description: "24/7 dedicated support with faster response times.",
      color: "orange",
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      emerald: {
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        text: "text-emerald-600 dark:text-emerald-400",
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        text: "text-purple-600 dark:text-purple-400",
      },
      orange: {
        bg: "bg-orange-50 dark:bg-orange-900/20",
        text: "text-orange-600 dark:text-orange-400",
      },
    };
    return colorMap[color as keyof typeof colorMap];
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#fdfbfb] to-[#ebedee] dark:from-[#1B1B1B] dark:to-[#003153]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Go Back Button */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Go Back</span>
          </button>
        </div>

        <div className="lg:flex lg:gap-8">
          {/* Mobile Sidebar Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              <Menu className="w-4 h-4" />
              <span className="text-sm font-medium">Profile & Limits</span>
            </button>
          </div>

          {/* Sidebar Profile */}
          <div
            className={`w-full lg:w-72 lg:flex-shrink-0 ${
              sidebarOpen ? "block" : "hidden lg:block"
            } mb-6 lg:mb-0`}
          >
            <div className="lg:sticky lg:top-8">
              <div className="text-center p-4 lg:p-0">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {userName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {user?.email}
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400 mt-3">
                  Free Plan
                </div>
              </div>

              <div className="mt-6 lg:mt-8">
                <Limiter />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your account and preferences
              </p>
            </div>

            <Tabs defaultValue="account" className="w-full">
              <TabsList className=" bg-gray-100 dark:bg-gray-800 p-1">
                <TabsTrigger
                  value="account"
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  Account
                </TabsTrigger>
                <TabsTrigger
                  value="customization"
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  Custom
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  History
                </TabsTrigger>
                <TabsTrigger
                  value="apikeys"
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  API Keys
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  Files
                </TabsTrigger>
                <TabsTrigger
                  value="contact"
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  Support
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="account"
                className="mt-6 sm:mt-8 space-y-6 sm:space-y-8"
              >
                {/* Upgrade Section */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                        Upgrade to Pro
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Unlock premium features and capabilities
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        $8
                        <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                          /mo
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">Billed monthly</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {upgradeBenefits.map((benefit, index) => {
                      const colors = getColorClasses(benefit.color);
                      const IconComponent = benefit.icon;

                      return (
                        <div
                          key={index}
                          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <div
                            className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center mb-3`}
                          >
                            <IconComponent
                              className={`w-4 h-4 ${colors.text}`}
                            />
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                            {benefit.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200">
                    Upgrade Now
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 sm:pt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="font-medium text-red-600 dark:text-red-400">
                      Danger Zone
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Permanently delete your account and all data. This action
                    cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Delete Account
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="customization" className="mt-6 sm:mt-8">
                {loadingPreferences ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-6 sm:space-y-8">
                    {/* Visual Options Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 sm:mb-6">
                        <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Visual Options
                        </h2>
                      </div>

                      <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Change Theme
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Switch between light, dark, system, or dynamic
                              themes to customize your visual experience.
                            </p>
                          </div>
                          <div className="sm:ml-6">
                            <ThemeSwitch />
                          </div>
                        </div>

                        <div className="border-b border-gray-200 dark:border-gray-600"></div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Change Layout
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Choose between default and rework layouts to
                              optimize your interface and workflow.
                            </p>
                          </div>
                          <div className="sm:ml-6">
                            <LayoutSwitch />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* User Info Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 sm:pt-8">
                      <div className="flex items-center gap-2 mb-4 sm:mb-6">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          User Info
                        </h2>
                      </div>

                      <div className="space-y-4 sm:space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            What should the AI call you?
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={userName}
                              onChange={(e) =>
                                setUserName(e.target.value.slice(0, 50))
                              }
                              placeholder="Your preferred name"
                              className="w-full p-3 sm:p-4 bg-transparent text-gray-900 dark:text-white focus:outline-none transition-colors"
                              maxLength={50}
                            />
                            <div className="absolute right-0 top-3 sm:top-4 text-xs text-gray-400">
                              {userName.length}/50
                            </div>
                            <div className="border-b border-gray-300 dark:border-gray-600"></div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            What do you do?
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={userOccupation}
                              onChange={(e) =>
                                setUserOccupation(e.target.value.slice(0, 100))
                              }
                              placeholder="Engineer, student, designer, etc."
                              className="w-full p-3 sm:p-4 bg-transparent text-gray-900 dark:text-white focus:outline-none transition-colors"
                              maxLength={100}
                            />
                            <div className="absolute right-0 top-3 sm:top-4 text-xs text-gray-400">
                              {userOccupation.length}/100
                            </div>
                            <div className="border-b border-gray-300 dark:border-gray-600"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chatbot Customization Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 sm:pt-8">
                      <div className="flex items-center gap-2 mb-4 sm:mb-6">
                        <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Chatbot Customization
                        </h2>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          What traits should the AI have?
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                          Type a trait and press Enter to add it. Maximum 50
                          traits.
                        </p>

                        {/* Trait Input */}
                        <div className="relative mb-4 sm:mb-6">
                          <input
                            type="text"
                            value={traitInput}
                            onChange={(e) =>
                              setTraitInput(e.target.value.slice(0, 100))
                            }
                            onKeyDown={handleTraitInputKeyDown}
                            placeholder="Type a trait and press Enter..."
                            className="w-full p-3 sm:p-4 bg-transparent text-gray-900 dark:text-white focus:outline-none transition-colors"
                            maxLength={100}
                            disabled={traits.length >= 50}
                          />
                          <div className="absolute right-0 top-3 sm:top-4 text-xs text-gray-400">
                            {traits.length}/50
                          </div>
                          <div className="border-b border-gray-300 dark:border-gray-600"></div>
                        </div>

                        {/* Suggested Traits */}
                        <div className="mb-4 sm:mb-6">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Suggested traits:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {suggestedTraits
                              .filter((trait) => !traits.includes(trait))
                              .map((trait, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleTraitAdd(trait)}
                                  disabled={traits.length >= 50}
                                  className="px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <Plus className="w-3 h-3 inline mr-1" />
                                  {trait}
                                </button>
                              ))}
                          </div>
                        </div>

                        {/* Current Traits */}
                        {traits.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {traits.map((trait, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                              >
                                <span>{trait}</span>
                                <button
                                  onClick={() => removeTrait(index)}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors cursor-pointer ml-1 p-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Preferences */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 sm:pt-8">
                      <div className="flex items-center gap-2 mb-4 sm:mb-6">
                        <Monitor className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Additional Preferences
                        </h2>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Anything else the AI should know about you?
                        </label>
                        <div className="relative">
                          <textarea
                            value={additionalInfo}
                            onChange={(e) =>
                              setAdditionalInfo(e.target.value.slice(0, 3000))
                            }
                            placeholder="Interests, values, communication style preferences, or anything else that would help the AI assist you better..."
                            className="w-full p-3 sm:p-4 bg-transparent text-gray-900 dark:text-white focus:outline-none transition-colors resize-none"
                            rows={6}
                            maxLength={3000}
                          />
                          <div className="absolute right-0 bottom-3 sm:bottom-4 text-xs text-gray-400">
                            {additionalInfo.length}/3000
                          </div>
                          <div className="border-b border-gray-300 dark:border-gray-600"></div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 sm:pt-8">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <button
                          onClick={loadUserPreferences}
                          disabled={loading}
                          className="px-4 py-2 cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium order-2 sm:order-1 flex items-center gap-2"
                        >
                          {loading && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          Reload Preferences
                        </button>

                        <div className="flex items-center gap-3 order-1 sm:order-2">
                          {saveStatus === "success" && (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              Saved!
                            </div>
                          )}
                          {saveStatus === "error" && (
                            <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                              <XCircle className="w-4 h-4" />
                              Error saving
                            </div>
                          )}

                          <button
                            onClick={saveUserPreferences}
                            disabled={saving}
                            className="px-6 py-3 cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            {saving && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            Save Preferences
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-6 sm:mt-8">
                <div className="space-y-6">
                  <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Message History
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage your conversation history and chat data. You can
                      export your messages for backup or delete them
                      permanently.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleExportHistory}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Export Message History
                    </button>
                    <button
                      onClick={handleDeleteHistory}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Delete All Messages
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>
                      • Export will download your chat history as a JSON file
                    </p>
                    <p>• Deleting messages is permanent and cannot be undone</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="apikeys" className="mt-6 sm:mt-8">
                <div className="space-y-6">
                  <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      API Keys
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add your own API keys to access different AI models. Your
                      keys are stored securely and only used for your requests.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {apiProviders.map((provider) => (
                      <div
                        key={provider.id}
                        className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {provider.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {provider.description}
                            </p>
                          </div>
                          <a
                            href={provider.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium whitespace-nowrap"
                          >
                            Get Key →
                          </a>
                        </div>

                        <div className="space-y-3">
                          <div className="relative">
                            <input
                              type="password"
                              value={apiKeys[provider.id]}
                              onChange={(e) =>
                                handleApiKeyChange(provider.id, e.target.value)
                              }
                              placeholder={provider.placeholder}
                              className="w-full p-3 bg-transparent text-gray-900 dark:text-white focus:outline-none transition-colors font-mono text-sm"
                              autoComplete="new-password"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck="false"
                              data-form-type="other"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              name={`api-key-${provider.id}-${Math.random()}`}
                            />
                            <div className="border-b border-gray-300 dark:border-gray-600"></div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleSaveApiKey(provider.id)}
                              disabled={!apiKeys[provider.id].trim()}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                            >
                              Save
                            </button>
                            {apiKeys[provider.id] && (
                              <button
                                onClick={() => handleRemoveApiKey(provider.id)}
                                className="text-red-500 hover:text-red-700 py-2 px-3 text-sm font-medium transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-6">
                    <p>• API keys are encrypted and stored securely</p>
                    <p>• Keys are only used to make requests on your behalf</p>
                    <p>• You can remove or update your keys at any time</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="mt-6 sm:mt-8">
                <div className="space-y-6">
                  <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Generated Images
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      View and download all the images you've generated in your conversations.
                    </p>
                  </div>

                  {loadingImages ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-400" />
                    </div>
                  ) : (
                    <>
                      {/* Images Statistics */}
                      {userImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {imagesStats.total_images}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Total Images
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {userImages.filter(img => new Date(img.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              This Week
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Image Gallery */}
                      <ImageGallery images={userImages} />
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="contact" className="mt-6 sm:mt-8">
                <div className="space-y-6">
                  <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Contact Support
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get help from our support team. We'll respond as quickly
                      as possible.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Subject
                      </label>
                      <div className="relative">
                        <input
                          className="w-full p-3 sm:p-4 bg-transparent text-gray-900 dark:text-white focus:outline-none transition-colors"
                          placeholder="How can we help?"
                        />
                        <div className="border-b border-gray-300 dark:border-gray-600"></div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Message
                      </label>
                      <div className="relative">
                        <textarea
                          className="w-full p-3 sm:p-4 bg-transparent text-gray-900 dark:text-white focus:outline-none transition-colors resize-none"
                          rows={6}
                          placeholder="Describe your issue or question..."
                        />
                        <div className="border-b border-gray-300 dark:border-gray-600"></div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Priority
                      </label>
                      <div className="relative">
                        <select className="w-full p-3 sm:p-4 bg-transparent text-gray-900 dark:text-white focus:outline-none transition-colors">
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                        <div className="border-b border-gray-300 dark:border-gray-600"></div>
                      </div>
                    </div>
                  </div>

                  <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                    Send Message
                  </button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
