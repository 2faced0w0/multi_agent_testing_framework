import { BaseAgent } from './BaseAgent.js';
import { AgentMessage } from '../types/index.js';
import fs from 'fs';
import path from 'path';

export class LoggerAgent extends BaseAgent {
  constructor(config: any) {
    super(config);
    console.log('LoggerAgent: Constructor called');
  }
  private logFile!: string;

  protected async initialize(): Promise<void> {
  console.log('LoggerAgent: Initializing...');
    this.logFile = path.join(process.cwd(), 'data', 'logs', 'system.log');
  
    // Ensure log directory exists
    fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
  console.log('LoggerAgent: Log directory ensured at', path.dirname(this.logFile));
  
    console.log('Logger initialized');
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
  console.log('LoggerAgent: Received message:', message);
    switch (message.type) {
      case 'LOG':
        await this.handleLog(message);
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  private async handleLog(message: AgentMessage): Promise<void> {
    const { level, message: logMessage, data } = message.payload;

    console.log('LoggerAgent: Received LOG message:', { level, logMessage, data });

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: logMessage,
      source: message.source,
      data
    };

    try {
      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
      console.log('LoggerAgent: Log entry written to file:', this.logFile);
    } catch (err) {
      console.error('LoggerAgent: Error writing log entry:', err);
    }

    // Also log to console for development
    console.log(`[${level.toUpperCase()}] ${message.source}: ${logMessage}`);
  }

  protected async cleanup(): Promise<void> {
    // Cleanup resources if needed
  }
}