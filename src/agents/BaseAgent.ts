import { createClient } from 'redis';
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
  protected redis: any; // Command client for all Redis operations
  protected subscriber: any; // Subscriber client for pub/sub

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
  const { commandClient, subscriber } = await this.initializeRedis();
  this.redis = commandClient;
  this.subscriber = subscriber;
  await this.initialize();
  }

  async stop(): Promise<void> {
    await this.cleanup();
    await this.redis?.quit();
  }

  protected abstract initialize(): Promise<void>;
  protected abstract cleanup(): Promise<void>;

  protected async initializeRedis(): Promise<any> {
    const redisUrl = this.config.redis?.url || 'redis://localhost:6379';
    const commandClient = createClient({ url: redisUrl });
    const subscriber = createClient({ url: redisUrl });
    await commandClient.connect();
    await subscriber.connect();

    // Subscribe to this agent's channel
    await subscriber.subscribe(this.config.id, async (message: string) => {
      try {
        const parsed: AgentMessage = JSON.parse(message);
        await this.processMessage(parsed);
      } catch (err: unknown) {
        console.error('Error processing incoming message:', err);
      }
    });

    return { commandClient, subscriber };
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