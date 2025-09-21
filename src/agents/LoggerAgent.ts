import { BaseAgent } from './BaseAgent.js';
import { AgentMessage } from '../types/index.js';
import fs from 'fs';
import path from 'path';

export class LoggerAgent extends BaseAgent {
  private logFile!: string;

  protected async initialize(): Promise<void> {
    this.logFile = path.join(process.cwd(), 'data', 'logs', 'system.log');
  
    // Ensure log directory exists
    fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
  
    console.log('Logger initialized');
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
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
  
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: logMessage,
      source: message.source,
      data
    };

    // Write to file
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
  
    // Also log to console for development
    console.log(`[${level.toUpperCase()}] ${message.source}: ${logMessage}`);
  }

  protected async cleanup(): Promise<void> {
    // Cleanup resources if needed
  }
}