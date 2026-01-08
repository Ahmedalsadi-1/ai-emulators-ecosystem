"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  SkipForward,
  ChevronRight,
  CheckCircle2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Send,
  Image as ImageIcon,
} from "lucide-react";

// Mock task data to match the image
const mockTasks = [
  {
    id: 1,
    action: "navigated to photoshop",
    thumbnail: null,
    progress: 2,
    total: 5,
    completed: true,
    confirmation: "Successfully navigated to Photoshop",
  },
  {
    id: 2,
    action: "clicked on file menu",
    thumbnail: null,
    progress: 3,
    total: 5,
    completed: true,
    confirmation: "File menu opened",
  },
  {
    id: 3,
    action: "clicked new document",
    thumbnail: null,
    progress: 4,
    total: 5,
    completed: true,
    confirmation: "New document created",
  },
  {
    id: 4,
    action: "saved the document",
    thumbnail: null,
    progress: 5,
    total: 5,
    completed: true,
    confirmation: "Document saved successfully",
  },
];

interface TaskItemProps {
  task: {
    id: number;
    action: string;
    thumbnail?: string | null;
    progress: number;
    total: number;
    completed: boolean;
    confirmation: string;
  };
  index: number;
}

function TaskItem({ task, index }: TaskItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="mb-4 pl-2"
    >
      {/* Terminal-style Chevron Prompt */}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-green-400 font-mono text-sm mt-0.5">{`>`}</span>
        <span className="text-white text-sm">{task.action}</span>
      </div>

      {/* Thumbnail Preview - EXACT 200x150px as in image */}
      {task.thumbnail ? (
        <div className="ml-6 mb-2">
          <img
            src={task.thumbnail}
            alt={`Task ${task.id} preview`}
            className="w-[200px] h-[150px] object-cover rounded-lg border border-white/10"
          />
        </div>
      ) : (
        <div className="ml-6 mb-2 w-[200px] h-[150px] bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-white/20" />
        </div>
      )}

      {/* Progress Indicator - Gray dot + "X / Y" text */}
      <div className="flex items-center gap-2 ml-6 mb-2">
        <div className="flex items-center gap-1.5">
          {/* Gray dot - hollow for completed, filled for current */}
          <div className="w-2 h-2 rounded-full border border-gray-500" />
          <span className="text-gray-400 text-xs">
            {task.progress} / {task.total}
          </span>
        </div>
      </div>

      {/* Success Checkmark + Confirmation Message */}
      {task.completed && (
        <div className="flex items-center gap-2 ml-6 mb-4">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-xs">{task.confirmation}</span>
        </div>
      )}
    </motion.div>
  );
}

export function LeftActivitySidebar() {
  const [isPaused, setIsPaused] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [message, setMessage] = useState("");

  return (
    <div className="w-[320px] flex-shrink-0 bg-kronos-glass backdrop-blur-glass border-r border-glass flex flex-col h-full">
      {/* Top: Media Controls */}
      <div className="flex items-center justify-center gap-4 px-4 py-3 border-b border-glass">
        <motion.button
          onClick={() => setIsPaused(!isPaused)}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isPaused ? (
            <Play className="w-5 h-5 text-white" />
          ) : (
            <Pause className="w-5 h-5 text-white" />
          )}
        </motion.button>

        <motion.button
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <SkipForward className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Middle: Scrollable Task History */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {mockTasks.map((task, index) => (
            <TaskItem key={task.id} task={task} index={index} />
          ))}
        </div>
      </div>

      {/* Bottom: Historical Session + Feedback + Message Input */}
      <div className="border-t border-glass p-4">
        {/* Historical Session Indicator */}
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">Historical Session</span>
        </div>

        {/* Feedback Buttons */}
        <div className="flex items-center gap-2 mb-3">
          <motion.button
            onClick={() => setFeedback(feedback === "up" ? null : "up")}
            className={`flex-1 py-2 rounded-lg border transition-all ${
              feedback === "up"
                ? "bg-green-500/20 border-green-500/30 text-green-400"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ThumbsUp className="w-4 h-4 mx-auto" />
          </motion.button>

          <motion.button
            onClick={() => setFeedback(feedback === "down" ? null : "down")}
            className={`flex-1 py-2 rounded-lg border transition-all ${
              feedback === "down"
                ? "bg-red-500/20 border-red-500/30 text-red-400"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ThumbsDown className="w-4 h-4 mx-auto" />
          </motion.button>
        </div>

        {/* Message Input */}
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message input..."
            className="w-full h-20 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-white/20"
          />
          <motion.button
            className="absolute bottom-2 right-2 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default LeftActivitySidebar;
