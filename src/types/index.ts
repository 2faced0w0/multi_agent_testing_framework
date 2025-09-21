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