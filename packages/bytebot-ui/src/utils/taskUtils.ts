import { Message, Task, Model, GroupedMessages, FileWithBase64, TaskStatus } from "@/types";

/**
 * Base configuration for API requests
 */
const API_CONFIG = {
  baseUrl: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include" as RequestCredentials,
};

const DESKTOP_API_CONFIG = {
  baseUrl: "/api/proxy/desktop",
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T | null> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers,
      },
      credentials: API_CONFIG.credentials,
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Error in API request to ${endpoint}:`, error);
    return null;
  }
}

async function desktopRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T | null> {
  try {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("bytebot:authToken")
        : null;

    const response = await fetch(`${DESKTOP_API_CONFIG.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...DESKTOP_API_CONFIG.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Desktop API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Error in desktop API request to ${endpoint}:`, error);
    return null;
  }
}

/**
 * Build query string from parameters
 */
function buildQueryString(
  params: Record<string, string | number | boolean>,
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Fetches messages for a specific task
 */
export async function fetchTaskMessages(
  taskId: string,
  options?: {
    limit?: number;
    page?: number;
  },
): Promise<Message[]> {
  const queryString = options ? buildQueryString(options) : "";
  const result = await apiRequest<Message[]>(
    `/tasks/${taskId}/messages${queryString}`,
    { method: "GET" },
  );
  return result || [];
}

/**
 * Fetches raw messages for a specific task (unprocessed)
 */
export async function fetchTaskRawMessages(
  taskId: string,
  options?: {
    limit?: number;
    page?: number;
  },
): Promise<Message[]> {
  const queryString = options ? buildQueryString(options) : "";
  const result = await apiRequest<Message[]>(
    `/tasks/${taskId}/messages/raw${queryString}`,
    { method: "GET" },
  );
  return result || [];
}

/**
 * Fetches processed and grouped messages for a specific task (for chat UI)
 */
export async function fetchTaskProcessedMessages(
  taskId: string,
  options?: {
    limit?: number;
    page?: number;
  },
): Promise<GroupedMessages[]> {
  const queryString = options ? buildQueryString(options) : "";
  const result = await apiRequest<GroupedMessages[]>(
    `/tasks/${taskId}/messages/processed${queryString}`,
    { method: "GET" },
  );
  return result || [];
}

/**
 * Fetches a specific task by ID
 */
export async function fetchTaskById(taskId: string): Promise<Task | null> {
  return apiRequest<Task>(`/tasks/${taskId}`, { method: "GET" });
}

/**
 * Sends a message to start a new task
 */
export async function startTask(data: {
  description: string;
  model: Model;
  files?: FileWithBase64[];
}): Promise<Task | null> {
  return apiRequest<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Guides an existing task with a message
 */
export async function addMessage(
  taskId: string,
  message: string,
): Promise<Task | null> {
  return apiRequest<Task>(`/tasks/${taskId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

/**
 * Fetches all tasks with optional pagination and filtering
 */
export async function fetchTasks(options?: {
  page?: number;
  limit?: number;
  status?: string;
  statuses?: string[];
}): Promise<{ tasks: Task[]; total: number; totalPages: number }> {
  const params: Record<string, string | number> = {};
  
  if (options?.page) params.page = options.page;
  if (options?.limit) params.limit = options.limit;
  if (options?.status) params.status = options.status;
  if (options?.statuses && options.statuses.length > 0) {
    params.statuses = options.statuses.join(',');
  }
  
  const queryString = Object.keys(params).length > 0 ? buildQueryString(params) : "";
  const result = await apiRequest<{ tasks: Task[]; total: number; totalPages: number }>(
    `/tasks${queryString}`,
    { method: "GET" }
  );
  return result || { tasks: [], total: 0, totalPages: 0 };
}

/**
 * Fetches task counts for grouped tabs
 */
export async function fetchTaskCounts(): Promise<Record<string, number>> {
  try {
    const allTasksResult = await fetchTasks();
    
    // Define the status groups
    const statusGroups = {
      ALL: Object.values(TaskStatus),
      ACTIVE: [TaskStatus.PENDING, TaskStatus.RUNNING, TaskStatus.NEEDS_HELP, TaskStatus.NEEDS_REVIEW],
      COMPLETED: [TaskStatus.COMPLETED],
      CANCELLED_FAILED: [TaskStatus.CANCELLED, TaskStatus.FAILED],
    };

    const counts: Record<string, number> = {
      ALL: allTasksResult.total,
      ACTIVE: 0,
      COMPLETED: 0,
      CANCELLED_FAILED: 0,
    };

    // Fetch counts for each group
    const groupPromises = Object.entries(statusGroups).map(async ([groupKey, statuses]) => {
      if (groupKey === 'ALL') {
        return { groupKey, count: allTasksResult.total };
      }
      
      const result = await fetchTasks({ statuses, limit: 1 });
      return { groupKey, count: result.total };
    });

    const groupCounts = await Promise.all(groupPromises);
    groupCounts.forEach(({ groupKey, count }) => {
      counts[groupKey] = count;
    });

    return counts;
  } catch (error) {
    console.error("Failed to fetch task counts:", error);
    return {
      ALL: 0,
      ACTIVE: 0,
      COMPLETED: 0,
      CANCELLED_FAILED: 0,
    };
  }
}

export async function fetchModels(): Promise<Model[]> {
  console.log("Fetching models from /api/tasks/models");
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/models`, {
      method: "GET",
      headers: API_CONFIG.headers,
      // Remove credentials for Electron compatibility
      // credentials: API_CONFIG.credentials,
    });

    console.log("Fetch response status:", response.status);
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Fetched models data:", data?.length || 0, "models");
    if (Array.isArray(data)) {
      return data;
    }
    return data.models || [];
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
}

/**
 * Controller API functions
 */

export interface ControllerStatus {
  status: string;
  message: string;
  components?: any;
  version?: string;
  uptime?: number;
}

export async function getAIOSStatus(): Promise<ControllerStatus> {
  return (await desktopRequest<ControllerStatus>("/aios/status")) || {
    status: "error",
    message: "Failed to get AIOS status"
  };
}

export async function getFactifAIStatus(): Promise<ControllerStatus> {
  return (await desktopRequest<ControllerStatus>("/factif-ai/status")) || {
    status: "error",
    message: "Failed to get Factif-AI status"
  };
}

export async function getAIOSCoreStatus(): Promise<any> {
  return await desktopRequest("/aios/core/status");
}

export async function listAIOSLLMs(): Promise<any> {
  return await desktopRequest("/aios/llms");
}

export async function selectAIOSLLMs(llms: any[]): Promise<any> {
  return await desktopRequest("/aios/llms/select", {
    method: "POST",
    body: JSON.stringify({ llms }),
  });
}

export async function getSelectedAIOSLLMs(): Promise<any> {
  return await desktopRequest("/aios/llms/selected");
}

export async function submitAIOSAgent(agentId: string, config: any): Promise<any> {
  return await desktopRequest("/aios/agents/submit", {
    method: "POST",
    body: JSON.stringify({ agent_id: agentId, agent_config: config }),
  });
}

export async function getAIOSAgentStatus(executionId: number): Promise<any> {
  return await desktopRequest(`/aios/agents/${executionId}/status`);
}

export async function listAIOSAgentProcesses(): Promise<any> {
  return await desktopRequest("/aios/agents/ps");
}

export async function refreshAIOSConfiguration(): Promise<any> {
  return await desktopRequest("/aios/core/refresh", {
    method: "POST",
  });
}

export async function getFactifAIModes(): Promise<any> {
  return await desktopRequest("/factif-ai/modes");
}

export async function setFactifAIMode(mode: string): Promise<any> {
  return await desktopRequest("/factif-ai/modes", {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}

export async function sendFactifAIChatMessage(
  message: string,
  mode?: string,
  context?: any
): Promise<any> {
  return await desktopRequest("/factif-ai/chat", {
    method: "POST",
    body: JSON.stringify({ message, mode, context }),
  });
}

export async function getFactifAIHistory(): Promise<any> {
  return await desktopRequest("/factif-ai/history");
}

export async function clearFactifAIHistory(): Promise<any> {
  return await desktopRequest("/factif-ai/history", {
    method: "DELETE",
  });
}

export async function executeFactifAIAction(action: any): Promise<any> {
  return await desktopRequest("/factif-ai/actions/execute", {
    method: "POST",
    body: JSON.stringify(action),
  });
}

export async function getFactifAIFileSystemInfo(path?: string): Promise<any> {
  const url = path ? `/factif-ai/filesystem?path=${encodeURIComponent(path)}` : '/factif-ai/filesystem';
  return await desktopRequest(url);
}

/**
 * Takes over control of a task
 */
export async function takeOverTask(taskId: string): Promise<Task | null> {
  return apiRequest<Task>(`/tasks/${taskId}/takeover`, { method: "POST" });
}

/**
 * Resumes a paused or stopped task
 */
export async function resumeTask(taskId: string): Promise<Task | null> {
  return apiRequest<Task>(`/tasks/${taskId}/resume`, { method: "POST" });
}

/**
 * Cancels a running task
 */
export async function cancelTask(taskId: string): Promise<Task | null> {
  return apiRequest<Task>(`/tasks/${taskId}/cancel`, { method: "POST" });
}

/**
 * Connects to BrowserOS directly
 */
  export async function connectBrowserOSSimple(): Promise<{ success: boolean; message: string } | null> {
   return apiRequest<{ success: boolean; message: string }>(`/tasks/browseros/connect`, { method: "POST" });
}
