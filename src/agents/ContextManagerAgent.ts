import { BaseAgent, AgentConfig } from './BaseAgent.js';
import { AgentMessage } from '../types/index.js';

export class ContextManagerAgent extends BaseAgent {
  private contextStore: Map<string, any> = new Map();

  constructor(config: AgentConfig) {
    super(config);
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    await this.processMessage(message);
  }

  async start(): Promise<void> {
    await super.start();
    await this.initialize();
  }

  async stop(): Promise<void> {
    await this.cleanup();
    await super.stop();
  }

  protected async initialize(): Promise<void> {
    console.log('Context Manager initialized');
    await this.sendMessage('logger_1', 'LOG', {
      level: 'info',
      message: 'Context Manager initialized',
      data: {}
    });
    // Optionally load persisted context here
  }

  public async processMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'GET_CONTEXT':
        await this.handleGetContext(message);
        break;
      case 'SET_CONTEXT':
        await this.handleSetContext(message);
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
        await this.sendMessage('logger_1', 'LOG', {
          level: 'warn',
          message: `Unknown message type: ${message.type}`,
          data: { message }
        });
    }
  }

  private async handleGetContext(message: AgentMessage): Promise<void> {
    const { key } = message.payload;
    const value = await this.getData(`context:${key}`);
    await this.sendMessage(message.source, 'CONTEXT_RESPONSE', {
      key,
      value
    });
  }

  private async handleSetContext(message: AgentMessage): Promise<void> {
    const { key, value } = message.payload;
    await this.storeData(`context:${key}`, value);
    await this.sendMessage(message.source, 'CONTEXT_SET', {
      key,
      success: true
    });
  }

  // Store data in local contextStore and optionally persist
  protected async storeData(key: string, value: any): Promise<void> {
    this.contextStore.set(key, value);
    // Optionally persist to disk or database here
  }

  // Retrieve data from local contextStore
  protected async getData(key: string): Promise<any> {
    return this.contextStore.get(key);
    // Optionally load from disk or database if not found
  }

  protected async cleanup(): Promise<void> {
    this.contextStore.clear();
    // Cleanup resources if needed
  }
}