export interface AgentConfig {
  creation_id: string;
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
  creation_id: string;
  type: string;
  source: string;
  target: string;
  payload: any;
  timestamp: Date;
}

export interface TestCase {
  creation_id: string;
  name: string;
  description: string;
  type: 'functional' | 'accessibility' | 'performance';
  targetUrl: string;
  playwrightCode: string;
  createdAt: Date;
}

export interface TestExecution {
  creation_id: string;
  status: 'queued' | 'running' | 'passed' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: any;
  artifacts: string[];
}