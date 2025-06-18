"use client";

import { Limiter } from "@/components/limiter";
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
  Shield,
  Crown,
  Star,
  Download,
  Trash2,
  Mail,
  MessageSquare,
  Palette,
  Database,
  Key,
  Image,
  ExternalLink,
  Brain,
  ChevronRight,
  CreditCard,
  Bell,
  Lock,
  HelpCircle,
  History,
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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  const [userImages, setUserImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [imagesStats, setImagesStats] = useState({
    total_images: 0,
    total_size_mb: 0,
  });

  // Memory state
  const [userMemory, setUserMemory] = useState<any[]>([]);
  const [loadingMemory, setLoadingMemory] = useState(true);

  // Navigation state
  const [activeSection, setActiveSection] = useState("account");

  // Constants for the UI
  const upgradeBenefits = [
    {
      icon: Zap,
      title: "Unlimited Messages",
      description: "Chat without any daily or monthly limits",
    },
    {
      icon: TrendingUp,
      title: "Advanced AI Models",
      description: "Access to GPT-4, Claude, and other premium models",
    },
    {
      icon: Headphones,
      title: "Priority Support",
      description: "Get help faster with dedicated premium support",
    },
  ];

  const suggestedTraits = [
    "Friendly",
    "Professional",
    "Helpful",
    "Concise",
    "Detailed",
    "Creative",
    "Analytical",
    "Empathetic",
    "Direct",
    "Patient",
    "Encouraging",
    "Humorous",
  ];

  const apiProviders = [
    {
      id: "openai",
      name: "OpenAI",
      icon: "🤖",
      description: "GPT-4, GPT-3.5, DALL-E, and other OpenAI models",
      placeholder: "sk-...",
      website: "https://platform.openai.com/api-keys",
    },
    {
      id: "gemini",
      name: "Google Gemini",
      icon: "🔮",
      description: "Google's Gemini Pro and other advanced models",
      placeholder: "AIza...",
      website: "https://aistudio.google.com/app/apikey",
    },
    {
      id: "grok",
      name: "Grok (xAI)",
      icon: "❌",
      description: "xAI's Grok models with real-time information",
      placeholder: "xai-...",
      website: "https://console.x.ai/",
    },
    {
      id: "groq",
      name: "Groq",
      icon: "⚡",
      description: "Ultra-fast inference with Llama and other models",
      placeholder: "gsk_...",
      website: "https://console.groq.com/keys",
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      icon: "🛣️",
      description: "Access to multiple AI models through one API",
      placeholder: "sk-or-...",
      website: "https://openrouter.ai/keys",
    },
  ];

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
      const response = await fetch("/api/user/images");

      if (response.ok) {
        const data = await response.json();
        setUserImages(data.images || []);
        setImagesStats({
          total_images: data.total_images,
          total_size_mb:
            Math.round(((data.total_size_bytes || 0) / (1024 * 1024)) * 100) /
            100,
        });
      }
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setLoadingImages(false);
    }
  };

  const loadUserMemory = async () => {
    try {
      setLoadingMemory(true);
      const response = await fetch("/api/user/memory");

      if (response.ok) {
        const data = await response.json();
        setUserMemory(data.memory || []);
      }
    } catch (error) {
      console.error("Error loading memory:", error);
    } finally {
      setLoadingMemory(false);
    }
  };

  // Load user preferences on mount
  useEffect(() => {
    if (user && !authLoading) {
      loadUserPreferences();
      loadUserImages();
      loadUserMemory();
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

  const handleDeleteAllMemory = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete all your AI memories? This will remove everything the AI remembers about you and cannot be undone."
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await fetch("/api/user/memory", {
        method: "DELETE",
      });

      if (response.ok) {
        setUserMemory([]);
        alert("All memories deleted successfully.");
      } else {
        alert("Failed to delete memories. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting memories:", error);
      alert("Failed to delete memories. Please try again.");
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

  const handleApiKeyChange = (providerId: string, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [providerId]: value,
    }));
  };

  const handleSaveApiKey = (providerId: string) => {
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

  const navigationSections = [
    {
      id: "account",
      title: "Account",
      icon: Crown,
      description: "Premium upgrade and account management",
    },
    {
      id: "appearance",
      title: "Appearance",
      icon: Palette,
      description: "Theme and visual customization",
    },
    {
      id: "personalization",
      title: "Personalization",
      icon: User,
      description: "Personal information and AI personality",
    },
    {
      id: "history",
      title: "History",
      icon: History,
      description: "Conversation history and data",
    },
    {
      id: "memory",
      title: "Memory",
      icon: Database,
      description: "Manage your AI's memory",
    },
    {
      id: "images",
      title: "Images",
      icon: Image,
      description: "Generated images and media",
    },
    {
      id: "api-keys",
      title: "API Keys",
      icon: Key,
      description: "External service integrations",
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: Bell,
      description: "Alert preferences and settings",
    },
    {
      id: "security",
      title: "Security",
      icon: Lock,
      description: "Privacy and security settings",
    },
    {
      id: "support",
      title: "Support",
      icon: HelpCircle,
      description: "Get help and contact support",
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <div className="space-y-8">
            {/* Profile Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 px-8 py-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-slate-800">
                      {user?.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt={user.user_metadata?.full_name || "User"}
                          className="w-full h-full rounded-2xl object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                      {userName ||
                        user?.user_metadata?.full_name ||
                        user?.email?.split("@")[0] ||
                        "User"}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm truncate">
                      {user?.email}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full shadow-sm">
                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Free Plan
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                  Quick Actions
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => setActiveSection("personalization")}
                    className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Edit Profile
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveSection("appearance")}
                    className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Theme
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveSection("security")}
                    className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Security
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveSection("support")}
                    className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <HelpCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Support
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Usage Limits */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Usage & Limits
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Track your current usage and plan limits
                  </p>
                </div>
              </div>
              <Limiter />
            </div>

            {/* Premium Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-2xl mb-6">
                  <Crown className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Upgrade to Premium
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Unlock advanced features, remove limits, and get priority
                  support for the best AI experience.
                </p>

                <div className="flex items-baseline justify-center gap-1 mt-6">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    $8
                  </span>
                  <span className="text-lg text-slate-500 dark:text-slate-400">
                    /month
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Cancel anytime
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {upgradeBenefits.map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <div
                      key={index}
                      className="text-center p-6 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600/50"
                    >
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 mb-4">
                        <IconComponent className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-base">
                        {benefit.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                <button className="w-full bg-slate-900 cursor-pointer hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-300 text-white dark:text-slate-900 py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md">
                  Start Premium
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-600 dark:text-red-400">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-red-500 dark:text-red-400">
                    Irreversible actions that affect your account
                  </p>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
              </div>

              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        );

      case "personalization":
        return (
          <div className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Personal Information
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Help the AI understand you better
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Display Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value.slice(0, 50))}
                      placeholder="What should the AI call you?"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      maxLength={50}
                    />
                    <div className="absolute right-3 top-3 text-xs text-slate-400">
                      {userName.length}/50
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Occupation
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={userOccupation}
                      onChange={(e) =>
                        setUserOccupation(e.target.value.slice(0, 100))
                      }
                      placeholder="Engineer, student, designer, etc."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      maxLength={100}
                    />
                    <div className="absolute right-3 top-3 text-xs text-slate-400">
                      {userOccupation.length}/100
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Additional Context
                  </label>
                  <div className="relative">
                    <textarea
                      value={additionalInfo}
                      onChange={(e) =>
                        setAdditionalInfo(e.target.value.slice(0, 3000))
                      }
                      placeholder="Share your interests, communication style preferences, or anything else that would help the AI assist you better..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                      rows={6}
                      maxLength={3000}
                    />
                    <div className="absolute right-3 bottom-3 text-xs text-slate-400">
                      {additionalInfo.length}/3000
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Personality Traits */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    AI Personality Traits
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Define how the AI should communicate with you
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Add Traits
                    </label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {traits.length}/50 traits
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={traitInput}
                      onChange={(e) =>
                        setTraitInput(e.target.value.slice(0, 100))
                      }
                      onKeyDown={handleTraitInputKeyDown}
                      placeholder="Type a trait and press Enter..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      maxLength={100}
                      disabled={traits.length >= 50}
                    />
                  </div>
                </div>

                {/* Suggested Traits */}
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Quick suggestions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTraits
                      .filter((trait) => !traits.includes(trait))
                      .map((trait, index) => (
                        <button
                          key={index}
                          onClick={() => handleTraitAdd(trait)}
                          disabled={traits.length >= 50}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3" />
                          {trait}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Current Traits */}
                {traits.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      Current traits:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {traits.map((trait, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg text-sm text-blue-800 dark:text-blue-300"
                        >
                          <span>{trait}</span>
                          <button
                            onClick={() => removeTrait(index)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <button
                onClick={loadUserPreferences}
                disabled={loading}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Reset to Saved
              </button>

              <div className="flex items-center gap-4">
                {saveStatus === "success" && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Preferences saved!
                  </div>
                )}
                {saveStatus === "error" && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
                    <XCircle className="w-4 h-4" />
                    Failed to save
                  </div>
                )}

                <button
                  onClick={saveUserPreferences}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Visual Preferences
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Customize your interface appearance
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Theme Preference
                </label>
                <div className="p-6 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <ThemeSwitch />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Layout Style
                </label>
                <div className="p-6 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <LayoutSwitch />
                </div>
              </div>
            </div>
          </div>
        );

      case "history":
        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Memory & History
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Manage your conversation data and AI memory
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleExportHistory}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export History
                </button>

                <button
                  onClick={handleDeleteHistory}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Clear Memory
                </button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    <span>
                      Export downloads your chat history as a JSON file
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    <span>
                      Clearing memory removes all conversation context
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "memory":
        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  AI Memory
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  View what the AI remembers about you from conversations
                </p>
              </div>
            </div>

            {loadingMemory ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Loading memory...
                  </span>
                </div>
              </div>
            ) : userMemory.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
                  <Database className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No memories yet
                </h4>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  The AI will remember important information about you as you
                  have conversations. These memories help provide more
                  personalized responses.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {userMemory.length}{" "}
                    {userMemory.length === 1 ? "memory" : "memories"} stored
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Active memories</span>
                    </div>
                    <button
                      onClick={handleDeleteAllMemory}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Delete All
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {userMemory.map((memory) => {
                    // Extract content from memory_value
                    let displayContent = "";
                    try {
                      if (typeof memory.memory_value === "string") {
                        const parsed = JSON.parse(memory.memory_value);
                        displayContent = parsed.content || memory.memory_value;
                      } else if (memory.memory_value?.content) {
                        displayContent = memory.memory_value.content;
                      } else {
                        displayContent = JSON.stringify(memory.memory_value);
                      }
                    } catch {
                      displayContent = memory.memory_value;
                    }

                    return (
                      <div
                        key={memory.id}
                        className="group p-5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h5 className="font-medium text-slate-900 dark:text-white text-sm">
                                {memory.memory_key || "Memory"}
                              </h5>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(
                                    memory.created_at
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {memory.memory_type && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                                    {memory.memory_type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                          <p className="text-slate-900 dark:text-white leading-relaxed">
                            {displayContent}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case "images":
        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                <Image className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Generated Images
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  View and manage your AI-generated images
                </p>
              </div>
            </div>

            {loadingImages ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Loading images...
                  </span>
                </div>
              </div>
            ) : (
              <>
                <ImageGallery images={userImages} />
              </>
            )}
          </div>
        );

      case "api-keys":
        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  API Keys
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Connect your own AI service accounts
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {apiProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{provider.icon}</span>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {provider.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {provider.description}
                        </p>
                      </div>
                    </div>
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium whitespace-nowrap"
                    >
                      Get Key
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="password"
                      value={apiKeys[provider.id]}
                      onChange={(e) =>
                        handleApiKeyChange(provider.id, e.target.value)
                      }
                      placeholder={provider.placeholder}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono text-sm"
                      autoComplete="new-password"
                    />

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleSaveApiKey(provider.id)}
                        disabled={!apiKeys[provider.id].trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                      >
                        Save Key
                      </button>
                      {apiKeys[provider.id] && (
                        <button
                          onClick={() => handleRemoveApiKey(provider.id)}
                          className="text-red-500 hover:text-red-700 py-2 px-4 text-sm font-medium transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>All API keys are encrypted and stored securely</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full ml-2"></div>
                  <span>
                    Keys are only used to make requests on your behalf
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Notification Preferences
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Configure how you receive updates and alerts
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    Email notifications
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Receive updates about your account
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    Usage alerts
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Get notified when approaching limits
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Security & Privacy
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Manage your security settings and data privacy
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                  Two-Factor Authentication
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Add an extra layer of security to your account
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Enable 2FA
                </button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                  Data Privacy
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Control how your data is used and stored
                </p>
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                  View Privacy Settings
                </button>
              </div>
            </div>
          </div>
        );

      case "support":
        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Contact Support
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Get help from our dedicated support team
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="How can we help you?"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Message
                </label>
                <textarea
                  placeholder="Describe your issue or question in detail..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  rows={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Priority Level
                </label>
                <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                  <option value="low">Low - General question</option>
                  <option value="medium">Medium - Issue affecting usage</option>
                  <option value="high">High - Critical problem</option>
                </select>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200 mb-6"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Settings
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage your account preferences and personalization
              </p>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Menu className="w-4 h-4" />
              <span className="font-medium">Menu</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div
            className={`lg:col-span-1 ${
              sidebarOpen ? "block" : "hidden lg:block"
            } lg:block`}
          >
            <div className="lg:sticky lg:top-8">
              <nav className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                <div className="space-y-1">
                  {navigationSections.map((section) => {
                    const IconComponent = section.icon;
                    const isActive = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        <IconComponent
                          className={`w-5 h-5 ${
                            isActive
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {section.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {section.description}
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isActive ? "rotate-90" : "group-hover:translate-x-1"
                          } text-slate-400`}
                        />
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="min-h-96">
              {loadingPreferences && activeSection === "personalization" ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Loading preferences...
                    </span>
                  </div>
                </div>
              ) : (
                renderContent()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
