// Simple in-memory test database for unified app testing
export class TestDatabase {
  private static instance: TestDatabase;
  private data!: {
    tasks: any[];
    messages: any[];
    models: any[];
    services: any[];
  };

  private constructor() {
    this.reset();
  }

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  reset(): void {
    this.data = {
      tasks: [],
      messages: [],
      models: [
        { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', version: '4.0', active: true },
        { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic', version: '3.0', active: true },
        { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', version: '1.0', active: true },
      ],
      services: [
        { id: 'bytebot', name: 'Bytebot', status: 'running', port: 9990 },
        { id: 'aios', name: 'AIOS', status: 'running', port: 8000 },
        { id: 'postiz', name: 'Postiz', status: 'running', port: 3001 },
      ],
    };
  }

  // Task operations
  createTask(task: any): any {
    const newTask = {
      id: `task-${Date.now()}`,
      ...task,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.tasks.push(newTask);
    return newTask;
  }

  getTasks(): any[] {
    return [...this.data.tasks];
  }

  getTaskById(id: string): any {
    return this.data.tasks.find(task => task.id === id);
  }

  updateTask(id: string, updates: any): any {
    const taskIndex = this.data.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return null;

    this.data.tasks[taskIndex] = {
      ...this.data.tasks[taskIndex],
      ...updates,
      updatedAt: new Date(),
    };
    return this.data.tasks[taskIndex];
  }

  deleteTask(id: string): boolean {
    const taskIndex = this.data.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return false;

    this.data.tasks.splice(taskIndex, 1);
    return true;
  }

  // Message operations
  createMessage(message: any): any {
    const newMessage = {
      id: `msg-${Date.now()}`,
      ...message,
      timestamp: new Date(),
    };
    this.data.messages.push(newMessage);
    return newMessage;
  }

  getMessagesByTaskId(taskId: string): any[] {
    return this.data.messages.filter(msg => msg.taskId === taskId);
  }

  // Model operations
  getModels(): any[] {
    return [...this.data.models];
  }

  getModelById(id: string): any {
    return this.data.models.find(model => model.id === id);
  }

  // Service operations
  getServices(): any[] {
    return [...this.data.services];
  }

  getServiceById(id: string): any {
    return this.data.services.find(service => service.id === id);
  }

  updateServiceStatus(id: string, status: string): any {
    const serviceIndex = this.data.services.findIndex(service => service.id === id);
    if (serviceIndex === -1) return null;

    this.data.services[serviceIndex].status = status;
    return this.data.services[serviceIndex];
  }
}

export const testDb = TestDatabase.getInstance();