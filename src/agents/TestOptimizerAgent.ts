import { BaseAgent, AgentConfig, AgentMessage } from './BaseAgent.js';
import { AgentMessage as TypesAgentMessage } from '../types/index.js';

// Use the imported AgentMessage from types/index.js to avoid duplicate import
type Message = TypesAgentMessage;

export class TestOptimizerAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  // Handles incoming messages and routes them to processMessage
  protected async handleMessage(message: Message): Promise<void> {
  console.log('TestOptimizerAgent: Received message:', message);
  await this.sendMessage('logger_1', 'LOG', {
    level: 'info',
    message: 'TestOptimizerAgent: Received message',
    data: { message }
  });
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
    console.log('Test Optimizer initialized');
    await this.sendMessage('logger_1', 'LOG', {
      level: 'info',
      message: 'Test Optimizer initialized',
      data: {}
    });
    // You could load optimization rules or models here
  }

  public async processMessage(message: Message): Promise<void> {
    switch (message.type) {
      case 'OPTIMIZE_TEST':
        await this.handleOptimizeTest(message);
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

  private async handleOptimizeTest(message: Message): Promise<void> {
  console.log('TestOptimizerAgent: Handling OPTIMIZE_TEST for script:', message.payload?.testScript);
  await this.sendMessage('logger_1', 'LOG', {
    level: 'info',
    message: 'TestOptimizerAgent: Handling OPTIMIZE_TEST',
    data: { testScript: message.payload?.testScript }
  });
    // Example: Analyze the test script and provide suggestions
    const testScript = message.payload?.testScript || '';
    const suggestions: string[] = [];

    if (!testScript) {
      suggestions.push('No test script provided.');
    } else {
      if (!testScript.includes('waitFor')) {
        suggestions.push('Add explicit waits for dynamic content.');
      }
      if (!testScript.includes('catch')) {
        suggestions.push('Include error handling for network timeouts.');
      }
      if (testScript.match(/selector/g)?.length < 2) {
        suggestions.push('Consider adding more specific selectors.');
      }
    }

    await this.sendMessage(message.source, 'OPTIMIZATION_COMPLETE', {
      message: 'Optimization analysis complete',
      suggestions,
    });
  }

  protected async cleanup(): Promise<void> {
    // Cleanup resources if needed
    console.log('Test Optimizer cleanup complete');
    await this.sendMessage('logger_1', 'LOG', {
      level: 'info',
      message: 'Test Optimizer cleanup complete',
      data: {}
    });
  }
}