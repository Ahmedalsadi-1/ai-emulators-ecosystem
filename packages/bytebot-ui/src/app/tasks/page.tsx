"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { fetchTasks, fetchTaskCounts } from "@/utils/taskUtils";
import { Task, TaskStatus } from "@/types";
import Link from "next/link";
import Image from "next/image";

type ViewMode = "floating" | "bento" | "pulse";

const statusNeon: Record<string, { color: string; label: string }> = {
  COMPLETED: { color: "from-emerald-400/90 to-emerald-300/70", label: "Completed" },
  RUNNING: { color: "from-sky-400/90 to-blue-400/70", label: "In Progress" },
  PENDING: { color: "from-white/50 to-white/40", label: "Pending" },
  FAILED: { color: "from-rose-500/90 to-orange-400/80", label: "Failed" },
  CANCELLED: { color: "from-rose-500/90 to-orange-400/80", label: "Cancelled" },
  NEEDS_HELP: { color: "from-yellow-500/90 to-amber-400/80", label: "Needs Help" },
  NEEDS_REVIEW: { color: "from-purple-500/90 to-violet-400/80", label: "Needs Review" },
};

const appEmojis = ["🖥️", "🧭", "📝", "🌐", "📧", "📁", "⚙️", "🛰️"];

function TasksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["ALL", "ACTIVE", "COMPLETED"].includes(tabParam)) {
      return tabParam as "ALL" | "ACTIVE" | "COMPLETED";
    }
    return "ALL";
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({
    ALL: 0,
    ACTIVE: 0,
    COMPLETED: 0,
  });
  const [viewMode, setViewMode] = useState<ViewMode>("floating");
  const PAGE_SIZE = 20;

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statuses =
        activeTab === "ALL"
          ? undefined
          : activeTab === "COMPLETED"
            ? ["COMPLETED"]
            : ["PENDING", "RUNNING", "NEEDS_HELP", "NEEDS_REVIEW"];
      const result = await fetchTasks({
        page: currentPage,
        limit: PAGE_SIZE,
        statuses,
      });
      setTasks(result.tasks || []);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      setError(error instanceof Error ? error.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [currentPage, activeTab]);

  useEffect(() => {
    const loadTaskCounts = async () => {
      try {
        const counts = await fetchTaskCounts();
        setTaskCounts(counts);
      } catch (error) {
        console.error("Failed to load task counts:", error);
        // Don't set error state for counts failure to avoid blocking the UI
      }
    };

    loadTaskCounts();
  }, []);

  const handleTabChange = (tab: "ALL" | "ACTIVE" | "COMPLETED") => {
    setActiveTab(tab);
    setCurrentPage(1);

    const newSearchParams = new URLSearchParams(searchParams);
    if (tab === "ALL") newSearchParams.delete("tab");
    else newSearchParams.set("tab", tab);

    const newUrl = `/tasks${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""}`;
    router.push(newUrl, { scroll: false });
  };

  const neonForStatus = (status: string) => statusNeon[status.toUpperCase()] || statusNeon.PENDING;

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      const label = new Date(t.createdAt).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!groups[label]) groups[label] = [];
      groups[label].push(t);
    });
    return groups;
  }, [tasks]);

  const renderFloatingChronology = () => (
    <div className="flex flex-col items-center gap-4">
      {tasks.map((task, idx) => {
        const neon = neonForStatus(task.status);
        const appIcon = appEmojis[idx % appEmojis.length];
        return (
          <Link key={task.id} href={`/tasks/${task.id}`} className="w-full max-w-2xl">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="group relative overflow-hidden rounded-xl border border-white/25 bg-white/10 px-5 py-4 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
            >
              <div
                className={`absolute left-0 top-0 h-full w-[5px] bg-gradient-to-b ${neon.color} shadow-[0_0_16px_rgba(59,130,246,0.8)]`}
              />
              <div className="flex items-center gap-4 pl-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl text-white/90 shadow-inner shadow-white/20">
                  {appIcon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-white">
                    <span className="text-base font-semibold line-clamp-1">
                      {task.description || "Untitled task"}
                    </span>
                    <span className="text-xs text-white/60">
                      {new Date(task.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-white/60">
                    Flow: {task.status === TaskStatus.COMPLETED ? "Finished gracefully" : "Executing automations"}
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="rounded-md border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white"
                >
                  {neon.label}
                </motion.div>
              </div>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );

  const renderGlassBento = () => (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      {Object.entries(groupedByDate).map(([date, list]) => (
        <div
          key={date}
          className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
        >
          <div className="mb-3 flex items-center justify-between text-sm text-white/80">
            <span>{date}</span>
            <span className="rounded-md bg-white/15 px-2 py-1 text-xs text-white/80">
              {list.length} tasks
            </span>
          </div>
          <div className="grid gap-3">
            {list.map((task, idx) => {
              const neon = neonForStatus(task.status);
              const appIcon = appEmojis[idx % appEmojis.length];
              const isFailed = task.status === TaskStatus.FAILED;
              return (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <div className="group relative overflow-hidden rounded-lg border border-white/20 bg-white/12 px-3 py-3 shadow-inner shadow-white/10">
                    {isFailed && <div className="crack-overlay" />}
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg text-white/90">
                        {appIcon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white line-clamp-1">
                          {task.description || "Task"}
                        </p>
                        <p className="text-xs text-white/60">
                          {neon.label} • {new Date(task.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {isFailed ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          className="rounded-md bg-white/80 px-3 py-1 text-xs font-semibold text-[#0f2d3c] shadow-lg"
                        >
                          ↻ Replay
                        </motion.button>
                      ) : (
                        <div
                          className={`h-8 w-8 rounded-full bg-gradient-to-br ${neon.color} opacity-70 blur-[1px]`}
                        />
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderActivePulse = () => (
    <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center">
      <div className="absolute top-0 bottom-0 w-[2px] bg-white/15" />
      <div className="flex flex-col gap-6">
        {tasks.map((task, idx) => {
          const neon = neonForStatus(task.status);
          const isLeft = idx % 2 === 0;
          return (
            <div key={task.id} className={`flex ${isLeft ? "justify-start" : "justify-end"}`}>
              <Link href={`/tasks/${task.id}`}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative w-[480px] max-w-full rounded-xl border border-white/20 bg-white/12 p-4 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                >
                  <div className={`absolute ${isLeft ? "-left-6" : "-right-6"} top-6 h-3 w-3 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)]`} />
                  <div className="mb-2 flex items-center justify-between text-xs text-white/70">
                    <span>{new Date(task.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="rounded-md border border-white/25 bg-white/10 px-2 py-1 text-[11px] text-white/80">
                      Breadcrumb: Opened app → Running
                    </span>
                  </div>
                  <p className="text-base font-semibold text-white">
                    {task.description || "Agent action"}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${neon.color} opacity-80`} />
                    <span className="text-sm text-white/70">{neon.label}</span>
                  </div>
                </motion.div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );

  const backgroundStyle = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(180deg, rgba(16,49,69,0.6) 0%, rgba(8,25,38,0.65) 100%), url('/home-bg.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }),
    [],
  );

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10"
      style={backgroundStyle}
    >
      <div className="drag-region relative z-10 w-full max-w-[1200px] rounded-xl border border-white/20 bg-white/12 p-6 backdrop-blur-3xl shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-white/25 bg-white/8 px-3 py-2 text-white shadow-inner shadow-white/5">
            <Image src="/bytebot-logo.png" alt="KRONOS" width={44} height={44} className="h-10 w-auto drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]" />
            <span className="text-sm font-semibold">Navigation</span>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {[
              { href: "/", label: "Home" },
              { href: "/tasks", label: "Tasks" },
              { href: "/desktop", label: "Desktop" },
              { href: "/web", label: "Web" },
              { href: "/settings", label: "Settings" },
            ].map((item) => {
              const isActive = item.href === "/tasks";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`no-drag rounded-md px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-[#0f2d3c] shadow-lg shadow-white/50"
                      : "text-white/80 hover:bg-white/15"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-white/25 bg-white/8 px-3 py-2 text-white shadow-inner shadow-white/5">
            <Image src="/bytebot-logo.png" alt="KRONOS" width={44} height={44} className="h-10 w-auto drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]" />
            <span className="text-sm font-semibold">Tasks</span>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {(["ALL", "ACTIVE", "COMPLETED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`no-drag rounded-md px-4 py-2 text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-white text-[#0f2d3c] shadow-lg shadow-white/50"
                    : "text-white/80 hover:bg-white/15"
                }`}
              >
                {tab}
                {taskCounts[tab] > 0 && (
                  <span className="ml-2 rounded-md bg-white/15 px-2 py-0.5 text-[10px] text-white/80">
                    {taskCounts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(["floating", "bento", "pulse"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`no-drag rounded-md px-4 py-2 text-xs font-semibold capitalize transition-all ${
                  viewMode === mode
                    ? "bg-white text-[#0f2d3c] shadow-lg shadow-white/50"
                    : "text-white/80 hover:bg-white/15"
                }`}
              >
                {mode === "floating"
                  ? "Floating"
                  : mode === "bento"
                    ? "Glass Bento"
                    : "Active Pulse"}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/15 bg-white/10 p-6 backdrop-blur-2xl shadow-inner shadow-white/10">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-white/70">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-12 w-12 rounded-full border-4 border-white/20 border-t-white/60"
              />
              Loading tasks...
            </div>
          ) : error ? (
            <div className="text-center text-white/70">
              <p className="mb-4 text-lg text-red-400">Error loading tasks</p>
              <p className="mb-4 text-sm">{error}</p>
               <button
                 onClick={() => loadTasks()}
                 className="inline-block rounded-md bg-white/80 px-6 py-3 text-sm font-semibold text-[#0f2d3c] shadow-lg shadow-white/40"
               >
                 Refresh
               </button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-white/70">
              <p className="mb-4 text-lg">No tasks yet</p>
              <Link href="/" className="inline-block rounded-md bg-white/80 px-6 py-3 text-sm font-semibold text-[#0f2d3c] shadow-lg shadow-white/40">
                + Create New Task
              </Link>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
              >
                {viewMode === "floating" && renderFloatingChronology()}
                {viewMode === "bento" && renderGlassBento()}
                {viewMode === "pulse" && renderActivePulse()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

function TasksPageFallback() {
  return (
    <div className="p-8 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-white/20 border-t-white/60"
      />
      <p className="text-white/60">Loading tasks...</p>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksPageFallback />}>
      <TasksPageContent />
    </Suspense>
  );
}
