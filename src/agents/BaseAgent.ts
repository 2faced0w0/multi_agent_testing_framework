import Redis from 'ioredis';
export interface Agent {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export abstract class BaseAgent implements Agent {
  // Concrete method for message dispatch from Redis
  async processMessage(message: AgentMessage): Promise<void> {
    await this.handleMessage(message);
  }

  // Overridable by subclasses for custom message handling
  protected abstract handleMessage(message: AgentMessage): Promise<void>;
  protected config: AgentConfig;
  protected redis: any; // TODO: Add proper Redis client type

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    this.redis = await this.initializeRedis();
    await this.initialize();
  }

  async stop(): Promise<void> {
    await this.cleanup();
    await this.redis?.quit();
  }

  protected abstract initialize(): Promise<void>;
  protected abstract cleanup(): Promise<void>;

  protected async initializeRedis(): Promise<any> {
    const redisUrl = this.config.redis.url || 'redis://localhost:6379';
    const pub = new Redis(redisUrl);
    const sub = new Redis(redisUrl);

    // Subscribe to this agent's channel
    sub.subscribe(this.config.id, (err) => {
      if (err) {
        console.error(`Failed to subscribe to channel ${this.config.id}:`, err);
      }
    });

    // Listen for messages and route to processMessage
    sub.on('message', async (channel, message) => {
      try {
        const parsed = JSON.parse(message);
        await this.processMessage(parsed);
      } catch (err) {
        console.error('Error processing incoming message:', err);
      }
    });

    // Return an object with publish, set, get methods
    return {
      publish: (target: string, msg: string) => pub.publish(target, msg),
      set: (key: string, value: string) => pub.set(key, value),
      get: (key: string) => pub.get(key),
      quit: () => { pub.quit(); sub.quit(); }
    };
  }

  protected async storeData(key: string, data: any): Promise<void> {
    if (!this.redis) throw new Error('Redis not initialized');
    await this.redis.set(key, JSON.stringify(data));
  }

  protected async getData(key: string): Promise<any> {
    if (!this.redis) throw new Error('Redis not initialized');
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  protected async sendMessage(target: string, type: string, payload: any): Promise<void> {
    if (!this.redis) throw new Error('Redis not initialized');
    const message: AgentMessage = {
      id: crypto.randomUUID(),
      type,
      source: this.config.id,
      target,
      payload,
      timestamp: new Date()
    };
    await this.redis.publish(target, JSON.stringify(message));
  }
}

export interface AgentConfig {
  id: string;
  type: AgentType;
  redis: {
    url: string;
  };
  logging: {
    level: string;
    file: string;
  };
}

export type AgentType = 'test_writer' | 'test_executor' | 'report_generator' | 
                       'test_optimizer' | 'context_manager' | 'logger';

export interface AgentMessage {
  id: string;
  type: string;
  source: string;
  target: string;
  payload: any;
  timestamp: Date;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: 'functional' | 'accessibility' | 'performance';
  targetUrl: string;
  playwrightCode: string;
  createdAt: Date;
}

export interface TestExecution {
  id: string;
  testCaseId: string;
  status: 'queued' | 'running' | 'passed' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: any;
  artifacts: string[];
}