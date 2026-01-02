import { useCallback, useEffect, useRef, useState } from "react";
import type { Message, Model, Task, TaskStatus } from "@/types";
import {
  isDocumentContentBlock,
  isImageContentBlock,
  isTextContentBlock,
  isToolResultContentBlock,
  isToolUseContentBlock,
  MessageContentBlock,
} from "@bytebot/shared";
import {
  addMessage,
  fetchTaskById,
  fetchTaskMessages,
  fetchTaskRawMessages,
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

export type QuickTaskTraceEntry = {
  id: string;
  time: string;
  timestamp: number;
  role: "USER" | "ASSISTANT";
  kind: "tool_use" | "tool_result";
  label: string;
  details?: string;
  toolUseId?: string;
  toolName?: string;
  sessionId?: string;
  image?: string;
  isError?: boolean;
};

interface UseQuickTaskSessionOptions {
  storageKey: string;
}

interface UseQuickTaskSessionResult {
  messages: QuickTaskMessage[];
  logs: QuickTaskLog[];
  traceEntries: QuickTaskTraceEntry[];
  isLoading: boolean;
  currentTaskId: string | null;
  taskStatus: TaskStatus | null;
  sendMessage: (message: string, model: Model) => Promise<void>;
  clearMessages: () => void;
  clearLogs: () => void;
  clearTrace: () => void;
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

const summarizeToolInput = (
  input?: Record<string, unknown>,
): { summary: string; sessionId?: string } => {
  if (!input) return { summary: "" };
  const sessionId =
    typeof input.session_id === "string" ? input.session_id : undefined;
  const payload = { ...input };
  if ("session_id" in payload) {
    delete payload.session_id;
  }
  const serialized = JSON.stringify(payload);
  const summary =
    serialized.length > 140 ? `${serialized.slice(0, 140)}...` : serialized;
  return { summary, sessionId };
};

const extractImageData = (
  blocks?: MessageContentBlock[],
): string | undefined => {
  if (!blocks) return undefined;
  for (const block of blocks) {
    if (isImageContentBlock(block)) {
      return block.source.data;
    }
    if (block.content) {
      const nested = extractImageData(block.content);
      if (nested) return nested;
    }
  }
  return undefined;
};

const extractTextPreview = (blocks?: MessageContentBlock[]): string => {
  if (!blocks) return "";
  const lines = flattenBlocks(blocks).filter((line) => line !== "[Image]");
  const text = lines.join(" ").trim();
  if (text.length > 160) {
    return `${text.slice(0, 160)}...`;
  }
  return text;
};

const extractTraceEntriesFromMessage = (
  message: Message,
): QuickTaskTraceEntry[] => {
  const { label, value } = formatTimestamp(message.createdAt);
  const entries: QuickTaskTraceEntry[] = [];

  message.content.forEach((block, index) => {
    if (isToolUseContentBlock(block)) {
      const { summary, sessionId } = summarizeToolInput(block.input);
      entries.push({
        id: `${message.id}:tool_use:${index}`,
        time: label,
        timestamp: value,
        role: message.role,
        kind: "tool_use",
        label: block.name,
        details: summary,
        toolUseId: block.id,
        toolName: block.name,
        sessionId,
      });
    }

    if (isToolResultContentBlock(block)) {
      entries.push({
        id: `${message.id}:tool_result:${index}`,
        time: label,
        timestamp: value,
        role: message.role,
        kind: "tool_result",
        label: `result:${block.tool_use_id}`,
        details: extractTextPreview(block.content),
        toolUseId: block.tool_use_id,
        image: extractImageData(block.content),
        isError: block.is_error,
      });
    }
  });

  return entries;
};

const sortTraceEntries = (items: QuickTaskTraceEntry[]): QuickTaskTraceEntry[] =>
  [...items].sort((a, b) => b.timestamp - a.timestamp);

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
  const [traceEntries, setTraceEntries] = useState<QuickTaskTraceEntry[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const processedTraceIds = useRef<Set<string>>(new Set());
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

  const resetTraceCache = useCallback((items: QuickTaskTraceEntry[]) => {
    processedTraceIds.current = new Set(items.map((item) => item.id));
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

  const setFormattedTrace = useCallback(
    (raw: Message[]) => {
      const entries = raw.reduce<QuickTaskTraceEntry[]>((acc, message) => {
        acc.push(...extractTraceEntriesFromMessage(message));
        return acc;
      }, []);
      const sorted = sortTraceEntries(entries);
      resetTraceCache(sorted);
      setTraceEntries(sorted);
    },
    [resetTraceCache],
  );

  const syncMessages = useCallback(
    async (taskId: string) => {
      const [formatted, raw] = await Promise.all([
        fetchTaskMessages(taskId, { limit: 50, page: 1 }),
        fetchTaskRawMessages(taskId, { limit: 50, page: 1 }),
      ]);
      setFormattedMessages(formatted);
      setFormattedTrace(raw);
    },
    [setFormattedMessages, setFormattedTrace],
  );

  const handleNewMessage = useCallback(
    (message: Message) => {
      if (!currentTaskId || message.taskId !== currentTaskId) return;
      if (processedMessageIds.current.has(message.id)) return;

      const formatted = formatMessage(message);
      if (!formatted) return;

      processedMessageIds.current.add(message.id);
      setMessages((prev) => sortMessages([formatted, ...prev]));

      const newEntries = extractTraceEntriesFromMessage(message).filter(
        (entry) => !processedTraceIds.current.has(entry.id),
      );
      if (newEntries.length > 0) {
        newEntries.forEach((entry) => processedTraceIds.current.add(entry.id));
        setTraceEntries((prev) => sortTraceEntries([...newEntries, ...prev]));
      }
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
    setCurrentTaskId(null);
    setTaskStatus(null);
    setMessages([]);
    setLogs([]);
    setTraceEntries([]);
    processedMessageIds.current.clear();
    processedTraceIds.current.clear();
    lastStatus.current = null;

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

  const clearTrace = useCallback(() => {
    setTraceEntries([]);
    processedTraceIds.current.clear();
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
    setTraceEntries([]);
    processedTraceIds.current.clear();
  }, [currentTaskId, storageKey]);

  return {
    messages,
    logs,
    traceEntries,
    isLoading,
    currentTaskId,
    taskStatus,
    sendMessage,
    clearMessages,
    clearLogs,
    clearTrace,
    addLog,
    resetSession,
  };
}
