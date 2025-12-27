"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { Button } from "@/components/ui/button";

interface LLMProvider {
  id: string;
  name: string;
  apiKey: string;
  model: string;
  endpoint: string;
}

export default function SettingsPage() {
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
