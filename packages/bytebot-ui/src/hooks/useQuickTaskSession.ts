import { useCallback, useEffect, useRef, useState } from "react";
import type { Message, Model, Task, TaskStatus } from "@/types";
import {
  isDocumentContentBlock,
  isImageContentBlock,
  isTextContentBlock,
  isToolResultContentBlock,
  MessageContentBlock,
} from "@bytebot/shared";
import {
  addMessage,
  fetchTaskById,
  fetchTaskMessages,
  startTask,
} from "@/utils/taskUtils";
import { useWebSocket } from "@/hooks/useWebSocket";

export type QuickTaskMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  text: string;
  time: string;
  timestamp: number;
};

export type QuickTaskLog = {
  id: string;
  time: string;
  message: string;
};

interface UseQuickTaskSessionOptions {
  storageKey: string;
}

interface UseQuickTaskSessionResult {
  messages: QuickTaskMessage[];
  logs: QuickTaskLog[];
  isLoading: boolean;
  currentTaskId: string | null;
  taskStatus: TaskStatus | null;
  sendMessage: (message: string, model: Model) => Promise<void>;
  clearMessages: () => void;
  clearLogs: () => void;
  addLog: (message: string) => void;
  resetSession: () => void;
}

const formatTimestamp = (timestamp?: string): { label: string; value: number } => {
  const time = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(time.getTime())) {
    return { label: "Now", value: Date.now() };
  }

  return {
    label: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    value: time.getTime(),
  };
};

const flattenBlocks = (blocks: MessageContentBlock[]): string[] => {
  const lines: string[] = [];

  blocks.forEach((block) => {
    if (isTextContentBlock(block)) {
      lines.push(block.text);
      return;
    }

    if (isToolResultContentBlock(block) && block.content) {
      lines.push(...flattenBlocks(block.content));
      return;
    }

    if (isImageContentBlock(block)) {
      lines.push("[Image]");
      return;
    }

    if (isDocumentContentBlock(block)) {
      lines.push("[Document]");
    }
  });

  return lines;
};

const formatMessage = (message: Message): QuickTaskMessage | null => {
  const text = flattenBlocks(message.content).join("\n").trim();
  if (!text) return null;

  const { label, value } = formatTimestamp(message.createdAt);
  return {
    id: message.id,
    role: message.role,
    text,
    time: label,
    timestamp: value,
  };
};

const sortMessages = (items: QuickTaskMessage[]): QuickTaskMessage[] => {
  return [...items].sort((a, b) => b.timestamp - a.timestamp);
};

export function useQuickTaskSession({
  storageKey,
}: UseQuickTaskSessionOptions): UseQuickTaskSessionResult {
  const [messages, setMessages] = useState<QuickTaskMessage[]>([]);
  const [logs, setLogs] = useState<QuickTaskLog[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const lastStatus = useRef<TaskStatus | null>(null);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => {
      const { label } = formatTimestamp();
      const entry = {
        id: `${Date.now()}-${message.slice(0, 8)}`,
        time: label,
        message,
      };
      return [entry, ...prev].slice(0, 30);
    });
  }, []);

  const resetMessageCache = useCallback((items: QuickTaskMessage[]) => {
    processedMessageIds.current = new Set(items.map((item) => item.id));
  }, []);

  const setFormattedMessages = useCallback(
    (raw: Message[]) => {
      const formatted = raw
        .map((message) => formatMessage(message))
        .filter((message): message is QuickTaskMessage => Boolean(message));
      const sorted = sortMessages(formatted);
      resetMessageCache(sorted);
      setMessages(sorted);
    },
    [resetMessageCache],
  );

  const syncMessages = useCallback(
    async (taskId: string) => {
      const result = await fetchTaskMessages(taskId, { limit: 50, page: 1 });
      setFormattedMessages(result);
    },
    [setFormattedMessages],
  );

  const handleNewMessage = useCallback(
    (message: Message) => {
      if (!currentTaskId || message.taskId !== currentTaskId) return;
      if (processedMessageIds.current.has(message.id)) return;

      const formatted = formatMessage(message);
      if (!formatted) return;

      processedMessageIds.current.add(message.id);
      setMessages((prev) => sortMessages([formatted, ...prev]));
    },
    [currentTaskId],
  );

  const handleTaskUpdate = useCallback(
    (task: Task) => {
      if (task.id !== currentTaskId) return;
      setTaskStatus(task.status);

      if (task.status !== lastStatus.current) {
        lastStatus.current = task.status;
        addLog(`Task status: ${task.status}`);
      }
    },
    [addLog, currentTaskId],
  );

  const { joinTask, leaveTask } = useWebSocket({
    onTaskUpdate: handleTaskUpdate,
    onNewMessage: handleNewMessage,
  });

  useEffect(() => {
    if (currentTaskId) {
      joinTask(currentTaskId);
      return;
    }

    leaveTask();
  }, [currentTaskId, joinTask, leaveTask]);

  useEffect(() => {
    const storedTask = window.localStorage.getItem(storageKey);
    if (!storedTask) return;

    const load = async () => {
      const task = await fetchTaskById(storedTask);
      if (!task) {
        window.localStorage.removeItem(storageKey);
        return;
      }

      setCurrentTaskId(task.id);
      setTaskStatus(task.status);
      lastStatus.current = task.status;
      addLog(`Restored task ${task.id}`);
      await syncMessages(task.id);
    };

    void load();
  }, [addLog, storageKey, syncMessages]);

  const sendMessage = useCallback(
    async (message: string, model: Model) => {
      if (!message.trim()) return;

      setIsLoading(true);
      try {
        if (!currentTaskId) {
          const created = await startTask({
            description: message,
            model,
          });

          if (created) {
            setCurrentTaskId(created.id);
            setTaskStatus(created.status);
            lastStatus.current = created.status;
            window.localStorage.setItem(storageKey, created.id);
            addLog(`Task created: ${created.id}`);
            await syncMessages(created.id);
          } else {
            addLog("Task creation failed");
          }

          return;
        }

        await addMessage(currentTaskId, message);
        await syncMessages(currentTaskId);
      } finally {
        setIsLoading(false);
      }
    },
    [addLog, currentTaskId, storageKey, syncMessages],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const resetSession = useCallback(() => {
    if (currentTaskId) {
      window.localStorage.removeItem(storageKey);
    }
    processedMessageIds.current.clear();
    lastStatus.current = null;
    setCurrentTaskId(null);
    setTaskStatus(null);
    setMessages([]);
    setLogs([]);
  }, [currentTaskId, storageKey]);

  return {
    messages,
    logs,
    isLoading,
    currentTaskId,
    taskStatus,
    sendMessage,
    clearMessages,
    clearLogs,
    addLog,
    resetSession,
  };
}
