"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { fetchModels, startTask, fetchTasks } from "@/utils/taskUtils";
import type { Model, Task } from "@/types";
import {
  ChevronRight,
  Activity,
  Cpu,
  Globe,
  Monitor,
  Moon,
  Settings,
  Sun,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Terminal,
  Layers,
} from "lucide-react";
import { KronosLogo } from "@/components/branding/KronosLogo";

const FALLBACK_CHAIN: Model[] = [
  { provider: 'groq', name: 'llama-3.3-70b-versatile', title: 'Llama 3.3 70B (Fallback)', capabilities: { toolCalling: true, vision: false, streaming: true } },
  { provider: 'openai', name: 'o3-2025-04-16', title: 'o3 (Final Fallback)', capabilities: { toolCalling: true, vision: false, streaming: true } },
];

interface ServiceHealth {
  name: string;
  port: number;
  status: 'healthy' | 'degraded' | 'down';
  icon: React.ReactNode;
  responseTime?: number;
}

const SERVICES: ServiceHealth[] = [
  { name: 'bytebotd', port: 9990, status: 'healthy', icon: <Monitor className="h-3 w-3" /> },
  { name: 'bytebot-agent', port: 9991, status: 'healthy', icon: <Cpu className="h-3 w-3" /> },
  { name: 'bytebot-ui', port: 9992, status: 'healthy', icon: <Layers className="h-3 w-3" /> },
  { name: 'nginx', port: 80, status: 'healthy', icon: <Globe className="h-3 w-3" /> },
];

export default function Home() {
  const router = useRouter();
  const [command, setCommand] = useState("");
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [serviceStatuses, setServiceStatuses] = useState<ServiceHealth[]>(SERVICES);
  const getModelKey = (model: Model) => `${model.provider}:${model.name}`;
  const pickRoutewayDefault = (candidates: Model[]): Model | null =>
    candidates.find((model) => model.provider === "routeway" && model.capabilities?.toolCalling) ||
    candidates[0] ||
    null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !window.electronAPI) return;
    window.electronAPI.expandToTab("home");
  }, [isMounted]);

  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("Loading models...");
      try {
        const result = await fetchModels();
        if (!isMounted) return;
        console.log("Loaded models:", result.length);
        const toolModels = result.filter((m) => m.capabilities?.toolCalling);
        const allowedProviders = new Set([
          "routeway",
          "groq",
          "openai",
          "proxy",
          "google",
          "ollama-local",
          "opencode-local",
        ]);
        const filteredModels = toolModels.filter((model) => allowedProviders.has(model.provider));
        console.log("Tool-capable models:", toolModels.length);
        setModels(filteredModels);
        setModelsError(null);

        const storedModel = window.localStorage.getItem("bytebot:model");
        const stored = storedModel && filteredModels.find((model) =>
          getModelKey(model) === storedModel || model.name === storedModel || model.title === storedModel
        );
        if (stored) setSelectedModel(stored);
        else {
          const preferred = pickRoutewayDefault(filteredModels) || pickRoutewayDefault(toolModels) || result[0] || null;
          setSelectedModel(preferred);
        }
      } catch (error) {
        console.error("Failed to load models:", error);
        setModelsError("Failed to load models. Please check your connection.");
        setModels([]);
        setSelectedModel(null);
      }
    };

    const loadTasks = async () => {
      try {
        const result = await fetchTasks();
        if (!isMounted) return;
        setTasks(result.tasks.slice(0, 5));
      } catch (error) {
        console.error("Failed to load tasks:", error);
      }
    };

    loadModels();
    loadTasks();

    const interval = setInterval(loadTasks, 10000);
    return () => { clearInterval(interval); isMounted = false; };
  }, []);

  const checkServiceHealth = async () => {
    const updated = await Promise.all(SERVICES.map(async (service) => {
      const start = Date.now();
      try {
        const response = await fetch(`http://localhost:${service.port}`, { mode: 'no-cors', signal: AbortSignal.timeout(2000) });
        return { ...service, status: 'healthy' as const, responseTime: Date.now() - start };
      } catch {
        return { ...service, status: 'down' as const };
      }
    }));
    setServiceStatuses(updated);
  };

  useEffect(() => {
    checkServiceHealth();
    const interval = setInterval(checkServiceHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const queueTask = async (taskCommand: string) => {
    if (!selectedModel) return;
    setIsSending(true);
    try {
      window.localStorage.setItem("bytebot:model", getModelKey(selectedModel));
      await startTask({ description: taskCommand, model: selectedModel });
      setCommand("");
      const updated = await fetchTasks();
      setTasks(updated.tasks.slice(0, 5));
    } catch (error: any) {
      console.error("Failed to start task:", error);
      const shouldFallback = selectedModel.provider === "routeway" && [422, 429, 500, 502, 503, 504].includes(error.status);
      if (shouldFallback) {
        console.warn(`Routeway error (${error.status}), attempting fallback chain...`);
        const availableFallbacks = FALLBACK_CHAIN.filter((fallback) =>
          models.some((model) => model.provider === fallback.provider && model.name === fallback.name)
        );
        let fallbackSuccess = false;
        for (let i = 0; i < availableFallbacks.length; i++) {
          const fallback = availableFallbacks[i];
          console.warn(`Trying fallback ${i + 1}/${availableFallbacks.length}:`, fallback.provider, fallback.name);
          setFallbackActive(true);
          try {
            await startTask({ description: taskCommand, model: fallback });
            console.warn("Fallback successful:", fallback.name);
            setCommand("");
            fallbackSuccess = true;
            break;
          } catch (fallbackError: any) {
            console.warn(`Fallback ${fallback.name} failed:`, fallbackError.status || fallbackError.message);
          }
        }
        if (!fallbackSuccess) console.error("All fallback models failed");
      }
    }
    setIsSending(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await queueTask(command);
  };

  const handleModelChange = (modelKey: string) => {
    const model = models.find((m) => getModelKey(m) === modelKey);
    setSelectedModel(model || null);
  };

  const handleQuickAction = async (action: string) => {
    setCommand(action);
    await queueTask(action);
  };

  const handleExpand = async (tab: string) => {
    setIsExpanded(true);
    setActiveTab(tab);
    router.push(`/${tab}`);
    if (window.electronAPI) await window.electronAPI.expandToTab(tab);
  };

  const handleHome = async () => {
    setIsExpanded(false);
    setActiveTab("home");
    if (window.electronAPI) await window.electronAPI.expandToTab("home");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-500 bg-emerald-500/20 border-emerald-500/30';
      case 'degraded': return 'text-amber-500 bg-amber-500/20 border-amber-500/30';
      case 'down': return 'text-red-500 bg-red-500/20 border-red-500/30';
      default: return 'text-slate-500 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-emerald-500" />;
      case 'running': return <Activity className="h-3 w-3 text-blue-500 animate-pulse" />;
      case 'pending': return <Clock className="h-3 w-3 text-amber-500" />;
      default: return <AlertCircle className="h-3 w-3 text-slate-500" />;
    }
  };

  const canSend = Boolean(selectedModel) && !isSending;
  const canSubmit = canSend && Boolean(command.trim());
  const healthyCount = serviceStatuses.filter(s => s.status === 'healthy').length;
  const systemHealth = healthyCount === serviceStatuses.length ? 100 : (healthyCount / serviceStatuses.length) * 100;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f3f3f3] via-[#ededed] to-[#e6e6e6] text-slate-900 dark:bg-gradient-to-b dark:from-[#0b0b0b] dark:via-[#0e0f12] dark:to-[#0a0b0e] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-size:52px_52px] [background-image:linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,0.08)_1px,transparent_1px)] dark:opacity-20 dark:[background-image:linear-gradient(90deg,rgba(248,250,252,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(248,250,252,0.05)_1px,transparent_1px)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={`w-full ${isExpanded ? "max-w-6xl" : "max-w-5xl"} transition-all duration-300`}>
          <div className={`relative border border-slate-300/80 bg-[#f1f1f1] shadow-[0_12px_30px_rgba(15,23,42,0.15)] dark:border-slate-700/60 dark:bg-[#1a1a1a] ${isExpanded ? "p-5" : "p-4"} rounded-lg`}>
            <div className={`border border-slate-300/70 bg-[#f9f9f9] dark:border-slate-700/50 dark:bg-[#151515] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${isExpanded ? "p-4" : "p-3"} rounded-md`}>
              <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="rounded-md border border-slate-300/70 bg-[#f0f0f0] px-3 py-2 dark:border-slate-700/60 dark:bg-[#1e1e1e]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]">
                      <KronosLogo size={48} className="h-8 w-auto" />
                      <span className="text-slate-700 dark:text-slate-200">KRONOS-OS</span>
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-500">v1.0</span>
                    </div>

                    {/* System Health Bar */}
                    <div className="hidden items-center gap-2 md:flex">
                      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                        <Activity className="h-3 w-3" />
                        System {Math.round(systemHealth)}%
                      </div>
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${systemHealth}%` }} transition={{ duration: 1 }} className="h-full rounded-full bg-emerald-500" />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
                      {[
                        { id: "home", label: "Home", icon: <Zap className="h-3 w-3" /> },
                        { id: "tasks", label: "Tasks", icon: <Terminal className="h-3 w-3" /> },
                        { id: "desktop", label: "Desktop", icon: <Monitor className="h-3 w-3" /> },
                        { id: "web", label: "Web", icon: <Globe className="h-3 w-3" /> },
                        { id: "settings", label: "Settings", icon: <Settings className="h-3 w-3" /> },
                      ].map((tab) => (
                        <button key={tab.id} type="button" onClick={() => tab.id === "home" ? handleHome() : handleExpand(tab.id)}
                          className={`flex items-center gap-1 rounded border px-2 py-1 transition-all ${
                            activeTab === tab.id
                              ? "border-slate-400/80 bg-slate-200 text-slate-800 dark:border-slate-600 dark:bg-[#2a2a2a] dark:text-white"
                              : "border-slate-300/70 bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700/60 dark:text-slate-400 dark:hover:bg-[#2a2a2a] dark:hover:text-white"
                          }`}>
                          {tab.icon}
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded border border-slate-300/70 bg-white/80 p-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-slate-700/60 dark:bg-[#1e1e1e] dark:text-slate-400">
                        <button type="button" onClick={() => setTheme("light")}
                          className={`flex items-center gap-1 rounded px-2 py-1 transition-all ${
                            isMounted && theme === "light" ? "bg-slate-600 text-white" : "hover:bg-slate-100 dark:hover:bg-[#2a2a2a]"
                          }`}>
                          <Sun className="h-3 w-3" /> Light
                        </button>
                        <button type="button" onClick={() => setTheme("dark")}
                          className={`flex items-center gap-1 rounded px-2 py-1 transition-all ${
                            isMounted && theme === "dark" ? "bg-slate-600 text-white" : "hover:bg-slate-100 dark:hover:bg-[#2a2a2a]"
                          }`}>
                          <Moon className="h-3 w-3" /> Dark
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Status Bar */}
                <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
                  {serviceStatuses.map((service) => (
                    <div key={service.name} className={`flex items-center gap-1.5 rounded border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${getStatusColor(service.status)}`}>
                      {service.icon}
                      <span className="hidden sm:inline">{service.name}</span>
                      <span className="opacity-60">:{service.port}</span>
                    </div>
                  ))}
                </div>

                {/* Main Content */}
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-start">
                  {/* Left: Task Input */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                      What do you want to
                    </p>
                    <h1 className={`font-semibold uppercase tracking-[0.18em] text-slate-900 dark:text-slate-100 ${isExpanded ? "text-2xl" : "text-xl"}`}>
                      Automate?
                    </h1>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Tell Kronos what you need, and watch it happen
                    </p>

                    <form onSubmit={handleSubmit} className="w-full">
                      <div className="flex flex-wrap items-center gap-2 rounded border border-slate-300/70 bg-white/80 px-3 py-2 dark:border-slate-700/60 dark:bg-[#1e1e1e]">
                        <input type="text" placeholder="Describe what you want to automate..."
                          className="flex-1 bg-transparent px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-600 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
                          value={command} onChange={(e) => setCommand(e.target.value)} />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 rounded border border-slate-300/70 bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700/60 dark:bg-[#111319] dark:text-slate-200">
                            <Cpu className="h-3 w-3" />
                            <select className="bg-transparent text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 focus:outline-none dark:text-slate-200"
                              value={selectedModel ? getModelKey(selectedModel) : ""} onChange={(e) => handleModelChange(e.target.value)}>
                              <option value="">Select</option>
                              {models.map((model) => (
                                <option key={getModelKey(model)} value={getModelKey(model)}>{model.title}</option>
                              ))}
                            </select>
                          </div>
                          {fallbackActive && (
                            <div className="bg-amber-500/20 border border-amber-500/50 rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-200 animate-pulse">
                              Fallback Active
                            </div>
                          )}
                          <button type="submit" disabled={!canSubmit}
                            className="flex items-center gap-2 rounded-md border border-slate-400/70 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600/70 dark:bg-[#111319] dark:text-slate-200 dark:hover:bg-[#1b1d22]">
                            Auto <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">
                        {modelsError ? (
                          <span className="flex items-center gap-1 text-red-500"><AlertCircle className="h-3 w-3" /> Models error</span>
                        ) : models.length > 0 ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle className="h-3 w-3" /> {models.length} models ready</span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-500 animate-pulse"><Activity className="h-3 w-3" /> Loading models...</span>
                        )}
                      </div>
                    </form>

                    {/* Quick Actions */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {["Open my email", "Schedule a meeting", "Organize downloads", "Set up dev environment"].map((action) => (
                        <button key={action} onClick={() => handleQuickAction(action)} disabled={isSending}
                          className="rounded-md border border-slate-300/70 bg-white/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700/60 dark:bg-[#15171c] dark:text-slate-300 dark:hover:bg-[#1e2026]">
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: Dashboard Panel */}
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      {/* Recent Tasks */}
                      <div className="rounded-md border border-slate-300/70 bg-[#f0f0f0] p-3 dark:border-slate-700/60 dark:bg-[#1e1e1e]">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                            <Terminal className="mr-1 inline h-3 w-3" /> Recent Tasks
                          </h3>
                          <button onClick={() => handleExpand("tasks")} className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            View All <ChevronRight className="inline h-3 w-3" />
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {tasks.length > 0 ? tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between rounded border border-slate-300/50 bg-white/80 px-2 py-1.5 dark:border-slate-700/50 dark:bg-[#151515]">
                              <span className="flex-1 truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600 dark:text-slate-300">{task.description}</span>
                              <div className="flex items-center gap-2">
                                {getTaskStatusIcon(task.status)}
                                <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400">{task.status}</span>
                              </div>
                            </div>
                          )) : (
                            <div className="py-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                              No recent tasks
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Model Performance */}
                      {selectedModel && (
                        <div className="rounded-md border border-slate-300/70 bg-[#f0f0f0] p-3 dark:border-slate-700/60 dark:bg-[#1e1e1e]">
                          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                            <Cpu className="mr-1 inline h-3 w-3" /> Active Model
                          </h3>
                          <div className="flex items-center justify-between rounded border border-slate-300/50 bg-white/80 px-3 py-2 dark:border-slate-700/50 dark:bg-[#151515]">
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200">{selectedModel.title}</div>
                              <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">{selectedModel.provider} • {selectedModel.name}</div>
                            </div>
                            <div className="flex gap-1">
                              {selectedModel.capabilities?.toolCalling && <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-500">Tools</span>}
                              {selectedModel.capabilities?.vision && <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-500">Vision</span>}
                              {selectedModel.capabilities?.streaming && <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-purple-500">Stream</span>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-md border border-slate-300/70 bg-[#f0f0f0] p-3 dark:border-slate-700/60 dark:bg-[#1e1e1e]">
                          <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">Active Agents</div>
                          <div className="mt-1 text-xl font-bold uppercase tracking-wider text-emerald-500">6</div>
                        </div>
                        <div className="rounded-md border border-slate-300/70 bg-[#f0f0f0] p-3 dark:border-slate-700/60 dark:bg-[#1e1e1e]">
                          <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">Tasks Today</div>
                          <div className="mt-1 text-xl font-bold uppercase tracking-wider text-blue-500">{tasks.length}</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
