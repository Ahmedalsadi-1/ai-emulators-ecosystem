"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { Button } from "@/components/ui/button";
import { turixService, TurixHealthStatus } from "@/services/TurixService";
import { Globe, Check, X, HelpCircle, RefreshCw } from "lucide-react";

interface LLMProvider {
  id: string;
  name: string;
  apiKey: string;
  model: string;
  endpoint: string;
}

export default function SettingsPage() {
  // Turix Configuration State
  const [turixApiUrl, setTurixApiUrl] = useState<string>(
    turixService.getApiUrl()
  );
  const [turixHealthStatus, setTurixHealthStatus] = useState<TurixHealthStatus>('unknown');
  const [turixLastChecked, setTurixLastChecked] = useState<Date | null>(null);
  const [turixMessage, setTurixMessage] = useState<string>('');
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // LLM Providers State
  const [providers, setProviders] = useState<LLMProvider[]>([
    {
      id: "1",
      name: "OpenAI",
      apiKey: "",
      model: "gpt-4o",
      endpoint: "https://api.openai.com/v1",
    },
    {
      id: "2",
      name: "Anthropic",
      apiKey: "",
      model: "claude-3-5-sonnet-20241022",
      endpoint: "https://api.anthropic.com",
    },
    {
      id: "3",
      name: "Google",
      apiKey: "",
      model: "gemini-2.5-pro",
      endpoint: "https://generativelanguage.googleapis.com/v1beta",
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState<Partial<LLMProvider>>({
    name: "",
    apiKey: "",
    model: "",
    endpoint: "",
  });

  // Initialize Turix health checks
  useEffect(() => {
    const unsubscribe = turixService.subscribe((result) => {
      setTurixHealthStatus(result.status);
      setTurixLastChecked(result.timestamp);
      setTurixMessage(result.message || '');
      setIsCheckingHealth(result.status === 'checking');
    });

    // Manual health checks only - no periodic polling

    // Cleanup on unmount
    return () => {
      unsubscribe();
      turixService.stopHealthChecks();
    };
  }, []);

  // Handle Turix API URL change
  const handleTurixUrlChange = (url: string) => {
    setTurixApiUrl(url);
    turixService.setApiUrl(url);
  };

  // Manual health check refresh
  const handleRefreshHealth = async () => {
    setIsCheckingHealth(true);
    await turixService.checkHealth();
  };

  // Get status icon and color
  const getStatusIcon = () => {
    switch (turixHealthStatus) {
      case 'connected':
        return <Check className="h-5 w-5 text-emerald-400" />;
      case 'offline':
        return <X className="h-5 w-5 text-slate-400" />;
      case 'checking':
        return <RefreshCw className="h-5 w-5 text-yellow-400 animate-spin" />;
      default:
        return <HelpCircle className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getStatusColor = () => {
    switch (turixHealthStatus) {
      case 'connected':
        return 'bg-emerald-500';
      case 'offline':
        return 'bg-slate-500';
      case 'checking':
        return 'bg-yellow-500 animate-pulse';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (turixHealthStatus) {
      case 'connected':
        return 'Connected';
      case 'offline':
        return 'Offline';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  const formatLastChecked = () => {
    if (!turixLastChecked) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - turixLastChecked.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return turixLastChecked.toLocaleTimeString();
  };

  const handleUpdateProvider = (id: string, field: keyof LLMProvider, value: string) => {
    setProviders(providers.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleDeleteProvider = (id: string) => {
    setProviders(providers.filter((p) => p.id !== id));
  };

  const handleAddProvider = () => {
    if (newProvider.name && newProvider.model) {
      setProviders([
        ...providers,
        {
          id: Date.now().toString(),
          name: newProvider.name,
          apiKey: newProvider.apiKey || "",
          model: newProvider.model,
          endpoint: newProvider.endpoint || "",
        },
      ]);
      setNewProvider({ name: "", apiKey: "", model: "", endpoint: "" });
      setShowAddForm(false);
    }
  };

  return (
    <div className="relative flex h-screen flex-col bg-black">
      <FloatingNav />

      <main className="flex flex-1 items-center justify-center px-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 text-center"
          >
            <h1 className="mb-2 text-5xl font-bold text-white">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Settings
              </span>
            </h1>
            <p className="text-lg text-white/60">
              Configure your AI providers and preferences
            </p>
          </motion.div>

          {/* Turix Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-6 rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
          >
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-semibold text-white">
              <Globe className="h-6 w-6 text-sky-400" />
              Turix Configuration
            </h2>

            {/* API URL Configuration */}
            <div className="mb-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  Turix API URL
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={turixApiUrl}
                    onChange={(e) => handleTurixUrlChange(e.target.value)}
                    placeholder="http://localhost:3000"
                    className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none transition-all focus:border-sky-500/50 focus:bg-white/10"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRefreshHealth}
                    disabled={isCheckingHealth}
                    className="rounded-md border border-white/20 bg-white/5 px-4 py-3 text-white transition-all hover:border-sky-500/50 hover:bg-sky-500/10 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-5 w-5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                  </motion.button>
                </div>
                <p className="mt-2 text-sm text-white/50">
                  Configure the connection to your Turix host application
                </p>
              </div>
            </div>

            {/* Health Status */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${getStatusColor()}`}>
                    {getStatusIcon()}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{getStatusText()}</div>
                    {turixMessage && (
                      <div className="text-sm text-white/60">{turixMessage}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/60">Last checked</div>
                  <div className="text-sm font-medium text-white/80">{formatLastChecked()}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Model Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
          >
            <h2 className="mb-6 text-2xl font-semibold text-white">
              Model Configuration
            </h2>

            {/* Provider List */}
            <div className="space-y-4">
              {providers.map((provider, index) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-white/20"
                >
                  {/* Provider Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">
                      {provider.name}
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteProvider(provider.id)}
                      className="rounded-md bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition-all hover:bg-red-500/20"
                    >
                      Remove
                    </motion.button>
                  </div>

                  {/* Provider Settings */}
                  <div className="space-y-4">
                    {/* API Key */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/70">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={provider.apiKey}
                        onChange={(e) =>
                          handleUpdateProvider(provider.id, "apiKey", e.target.value)
                        }
                        placeholder="Enter your API key..."
                        className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/10"
                      />
                    </div>

                    {/* Model Name */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/70">
                        Model Name
                      </label>
                      <input
                        type="text"
                        value={provider.model}
                        onChange={(e) =>
                          handleUpdateProvider(provider.id, "model", e.target.value)
                        }
                        placeholder="e.g., gpt-4o, claude-3-5-sonnet..."
                        className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/10"
                      />
                    </div>

                    {/* Endpoint */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/70">
                        Endpoint URL
                      </label>
                      <input
                        type="url"
                        value={provider.endpoint}
                        onChange={(e) =>
                          handleUpdateProvider(provider.id, "endpoint", e.target.value)
                        }
                        placeholder="https://api.example.com/v1"
                        className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/10"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add New Provider Button */}
            {!showAddForm ? (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddForm(true)}
                className="mt-6 w-full rounded-md border-2 border-dashed border-white/20 px-6 py-4 text-lg font-medium text-white/60 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-white"
              >
                + Add New Provider
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6"
              >
                <h3 className="mb-4 text-xl font-semibold text-emerald-400">
                  Add New Provider
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Provider Name
                    </label>
                    <input
                      type="text"
                      value={newProvider.name}
                      onChange={(e) =>
                        setNewProvider({ ...newProvider, name: e.target.value })
                      }
                      placeholder="e.g., Custom LLM"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={newProvider.apiKey}
                      onChange={(e) =>
                        setNewProvider({ ...newProvider, apiKey: e.target.value })
                      }
                      placeholder="Enter API key..."
                      className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={newProvider.model}
                      onChange={(e) =>
                        setNewProvider({ ...newProvider, model: e.target.value })
                      }
                      placeholder="Model identifier..."
                      className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Endpoint URL
                    </label>
                    <input
                      type="url"
                      value={newProvider.endpoint}
                      onChange={(e) =>
                        setNewProvider({ ...newProvider, endpoint: e.target.value })
                      }
                      placeholder="API endpoint..."
                      className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/10"
                    />
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddProvider}
                      className="flex-1 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-emerald-500/50"
                    >
                      Add Provider
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowAddForm(false);
                        setNewProvider({ name: "", apiKey: "", model: "", endpoint: "" });
                      }}
                      className="flex-1 rounded-md border border-white/20 px-6 py-3 font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Runtime Environment Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-6 rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
          >
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-semibold text-white">
              <Globe className="h-6 w-6 text-purple-400" />
              Runtime Environment
            </h2>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-white/70">BYTEBOT_AGENT_BASE_URL</div>
                  <div className="mt-1 font-mono text-sm text-white">
                    {process.env.NEXT_PUBLIC_BYTEBOT_AGENT_BASE_URL || 'http://localhost:9991'}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-white/70">BYTEBOT_DESKTOP_VNC_URL</div>
                  <div className="mt-1 font-mono text-sm text-white">
                    {process.env.NEXT_PUBLIC_BYTEBOT_DESKTOP_VNC_URL || 'ws://localhost:9990/websockify'}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-white/70">TURIX_API_URL</div>
                  <div className="mt-1 font-mono text-sm text-white">
                    {process.env.NEXT_PUBLIC_TURIX_API_URL || 'http://localhost:3000'}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-white/70">NODE_ENV</div>
                  <div className="mt-1 font-mono text-sm text-white">
                    {process.env.NODE_ENV || 'development'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 flex justify-center"
          >
            <Button className="w-full max-w-xs rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-emerald-500/50">
              Save Changes
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
