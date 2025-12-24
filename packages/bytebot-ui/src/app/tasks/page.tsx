"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { fetchTasks, fetchTaskCounts } from "@/utils/taskUtils";
import { Task } from "@/types";
import { FloatingNav } from "@/components/layout/FloatingNav";
import Link from "next/link";
import { Suspense } from "react";

function TasksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getInitialTab = (): "ALL" | "ACTIVE" | "COMPLETED" => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["ALL", "ACTIVE", "COMPLETED"].includes(tabParam)) {
      return tabParam as "ALL" | "ACTIVE" | "COMPLETED";
    }
    return "ALL";
  };

  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">(getInitialTab);
  const [currentPage, setCurrentPage] = useState(1);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({
    ALL: 0,
    ACTIVE: 0,
    COMPLETED: 0,
  });
  const PAGE_SIZE = 10;

  const statusConfig = {
    completed: {
      icon: "✓",
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      label: "Completed",
    },
    in_progress: {
      icon: "⟳",
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      label: "In Progress",
    },
    pending: {
      icon: "○",
      color: "bg-white/10 text-white/50 border-white/10",
      label: "Pending",
    },
    running: {
      icon: "▶",
      color: "bg-violet-500/20 text-violet-400 border-violet-500/30",
      label: "Running",
    },
  };

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const statuses =
          activeTab === "ALL"
            ? undefined
            : activeTab === "COMPLETED"
              ? ["completed"]
              : ["pending", "running", "in_progress"];
        const result = await fetchTasks({
          page: currentPage,
          limit: PAGE_SIZE,
          statuses,
        });
        setTasks(result.tasks);
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [currentPage, activeTab]);

  useEffect(() => {
    const loadTaskCounts = async () => {
      try {
        const counts = await fetchTaskCounts();
        setTaskCounts(counts);
      } catch (error) {
        console.error("Failed to load task counts:", error);
      }
    };

    loadTaskCounts();
  }, []);

  const handleTabChange = (tab: "ALL" | "ACTIVE" | "COMPLETED") => {
    setActiveTab(tab);
    setCurrentPage(1);

    const newSearchParams = new URLSearchParams(searchParams);
    if (tab === "ALL") {
      newSearchParams.delete("tab");
    } else {
      newSearchParams.set("tab", tab);
    }

    const newUrl = `/tasks${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""}`;
    router.push(newUrl, { scroll: false });
  };

  const getStatusConfig = (status: string) => {
    if (status === "completed") return statusConfig.completed;
    if (status === "in_progress") return statusConfig.in_progress;
    if (status === "running") return statusConfig.running;
    return statusConfig.pending;
  };

  return (
    <div className="relative flex h-screen flex-col bg-black">
      <FloatingNav />

      <main className="flex flex-1 items-center justify-center px-4">
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
                Your Tasks
              </span>
            </h1>
            <p className="text-lg text-white/60">
              Manage and monitor your automations
            </p>
          </motion.div>

          {/* Tabs */}
          {!isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6 flex justify-center gap-2"
            >
              {(["ALL", "ACTIVE", "COMPLETED"] as const).map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    rounded-full px-6 py-2.5 text-sm font-medium transition-all
                    ${
                      activeTab === tab
                        ? "bg-white text-black shadow-lg"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {tab}
                  {taskCounts[tab] > 0 && (
                    <span className="ml-2 rounded-full bg-white/20 px-2 text-xs">
                      {taskCounts[tab]}
                    </span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Task List */}
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-white/20 border-t-white/60"
              />
              <p className="text-white/60">Loading tasks...</p>
            </motion.div>
          ) : tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center"
            >
              <div className="flex flex-col items-center">
                <h3 className="mb-2 text-2xl font-semibold text-white">
                  No tasks yet
                </h3>
                <p className="mb-6 text-white/60">
                  Get started by creating your first task
                </p>
                <Link href="/">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:shadow-emerald-500/50"
                  >
                    + Create New Task
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {tasks.map((task, index) => {
                  const status = getStatusConfig(task.status);
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                    >
                      <Link href={`/tasks/${task.id}`}>
                        <motion.div
                          whileHover={{ scale: 1.01, y: -2 }}
                          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition-all hover:border-white/20 hover:bg-white/10"
                        >
                          {/* Status Badge */}
                          <div
                            className={`
                              absolute right-6 top-6 flex items-center gap-2 rounded-full px-4 py-1.5
                              border text-sm font-medium
                              ${status.color}
                            `}
                          >
                            <span className="text-base">{status.icon}</span>
                            {status.label}
                          </div>

                          {/* Task Content */}
                          <div className="pr-36">
                            <h3 className="mb-2 text-xl font-semibold text-white group-hover:text-white/90 transition-colors">
                              {task.description}
                            </h3>

                            {/* Task Meta */}
                            <div className="flex items-center gap-4 text-sm text-white/40">
                              <span>
                                {new Date(task.createdAt).toLocaleDateString()}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-white/20" />
                              <span className="group-hover:text-white/60 transition-colors">
                                View Details →
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Create New Task Button */}
          {!isLoading && tasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-8 flex justify-center"
            >
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-emerald-500/50"
                >
                  + Create New Task
                </motion.button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </main>
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
