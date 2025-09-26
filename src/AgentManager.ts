import { TestWriterAgent } from './agents/TestWriterAgent.js';
import { TestExecutorAgent } from './agents/TestExecutorAgent.js';
import { ReportGeneratorAgent } from './agents/ReportGeneratorAgent.js';
import { TestOptimizerAgent } from './agents/TestOptimizerAgent.js';
import { ContextManagerAgent } from './agents/ContextManagerAgent.js';
import { LoggerAgent } from './agents/LoggerAgent.js';
import { Agent } from './agents/BaseAgent.js';
import { AgentType, AgentConfig } from './types/index.js';

export class AgentManager {
  private agents: Map<string, Agent> = new Map();

  async startAllAgents(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
    const agentConfigs: AgentConfig[] = [
      {
        creation_id: 'test_writer_1',
        type: 'test_writer',
        redis: { url: redisUrl },
        logging: { level: 'info', file: './data/logs/test_writer.log' }
      },
      {
        creation_id: 'test_executor_1',
        type: 'test_executor',
        redis: { url: redisUrl },
        logging: { level: 'info', file: './data/logs/test_executor.log' }
      },
      {
        creation_id: 'report_generator_1',
        type: 'report_generator',
        redis: { url: redisUrl },
        logging: { level: 'info', file: './data/logs/report_generator.log' }
      },
      {
        creation_id: 'test_optimizer_1',
        type: 'test_optimizer',
        redis: { url: redisUrl },
        logging: { level: 'info', file: './data/logs/test_optimizer.log' }
      },
      {
        creation_id: 'context_manager_1',
        type: 'context_manager',
        redis: { url: redisUrl },
        logging: { level: 'info', file: './data/logs/context_manager.log' }
      },
      {
        creation_id: 'logger_1',
        type: 'logger',
        redis: { url: redisUrl },
        logging: { level: 'info', file: './data/logs/logger.log' }
      }
    ];

    // Start all agents
    for (const config of agentConfigs) {
      let agent: Agent;
    
      switch (config.type) {
        case 'test_writer':
          agent = new TestWriterAgent(config);
          break;
        case 'test_executor':
          agent = new TestExecutorAgent(config);
          break;
        case 'report_generator':
          agent = new ReportGeneratorAgent(config);
          break;
        case 'test_optimizer':
          agent = new TestOptimizerAgent(config);
          break;
        case 'context_manager':
          agent = new ContextManagerAgent(config);
          break;
        case 'logger':
          agent = new LoggerAgent(config);
          break;
        default:
          throw new Error(`Unknown agent type: ${config.type}`);
      }

      await agent.start();
  this.agents.set(config.creation_id, agent);
    }

    console.log(`Started ${this.agents.size} agents`);
  }

  async stopAllAgents(): Promise<void> {
    for (const [id, agent] of this.agents) {
      await agent.stop();
    }
    this.agents.clear();
    console.log('All agents stopped');
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): Map<string, Agent> {
    return this.agents;
  }
}