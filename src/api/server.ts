import { createClient } from 'redis';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { DatabaseManager } from '../database/DatabaseManager.js';
import { v4 as uuid } from 'uuid';

export class APIServer {
  private app: express.Application;
  private redis: any;
  private port: number;
  private db: DatabaseManager;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.db = new DatabaseManager(process.env.DATABASE_PATH || './data/sqlite/framework.db');
    this.redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    this.redis.connect();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(morgan('combined'));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  
    // Serve static files (for UI)
    this.app.use(express.static(path.join(process.cwd(), 'public')));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date(),
        version: '1.0.0'
      });
    });

    // Test Cases API
    this.app.post('/api/v1/tests/generate', async (req, res) => {
      try {
        const { url, testType, description } = req.body;
      
        if (!url || !testType) {
          return res.status(400).json({ error: 'URL and testType are required' });
        }

        // Send message to Test Writer Agent
        const creation_id = uuid();
        const message = {
          creation_id,
          type: 'GENERATE_TEST',
          source: 'api_server',
          target: 'test_writer',
          payload: { url, testType, description },
          timestamp: new Date()
        };

        await this.redis.lPush('queue:test_writer', JSON.stringify(message));
        await new Promise(resolve => setTimeout(resolve, 12000));
        // Try to get the generated test code if it already exists (rare, but possible in fast systems)
        let testCase = this.db.getTestCase(creation_id);
        let playwrightCode = testCase ? testCase.playwright_code : null;

        res.json({
          message: 'Test generation started',
          url,
          testType,
          description,
          timestamp: message.timestamp,
          status: 'pending',
          creation_id,
          playwrightCode
        });

      } catch (error) {
        console.error('Error generating test:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    this.app.get('/api/v1/tests/generate/status/:creation_id', async (req, res) => {
      try {
        const testCase = this.db.getTestCase(req.params.creation_id);
        if (testCase) {
          return res.json({ status: 'completed', testCase });
        } else {
          return res.json({ status: 'pending', testCase: null });
        }
      } catch (error) {
        console.error('Error checking test generation status:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // CodeWatcher API endpoint
    this.app.post('/api/v1/codewatcher/validate', express.text({ type: '*/*' }), async (req, res) => {
      try {
        const code = req.body;
        if (!code || typeof code !== 'string') {
          return res.status(400).json({ error: 'Missing or invalid code' });
        }
        const { CodeWatcher } = await import('../utils/codewatcher.js');
        const fixedCode = CodeWatcher.validateAndFixTestCode(code);
        res.json({ fixedCode });
      } catch (error) {
        console.error('Error validating code:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.post('/api/v1/tests/execute', async (req, res) => {
      try {
        const { creation_id } = req.body;
        if (!creation_id) {
          return res.status(400).json({ error: 'creation_id is required' });
        }

        // Send message to Test Executor Agent
        const message = {
          creation_id,
          type: 'EXECUTE_TEST',
          source: 'api_server',
          target: 'test_executor',
          payload: { creation_id },
          timestamp: new Date()
        };

        await this.redis.lPush('queue:test_executor', JSON.stringify(message));

        // Respond immediately with test execution started and messageId
        res.json({ 
          message: 'Test execution started',
          messageId: message.creation_id,
          statusEndpoint: `/api/v1/tests/execute/status/${creation_id}`
        });

      } catch (error) {
        console.error('Error executing test:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.get('/api/v1/tests/execute/status/:creation_id', async (req, res) => {
      try {
        const creation_id = req.params.creation_id;
        let executionStatus = null;
        if (this.db && this.db.getLatestExecutionByTestCaseId) {
          const latest = await this.db.getLatestExecutionByTestCaseId(creation_id);
          if (latest) {
            executionStatus = {
              status: latest.status,
              startTime: latest.start_time,
              endTime: latest.end_time,
              result: latest.result ? JSON.parse(latest.result) : null,
              artifacts: latest.artifacts ? JSON.parse(latest.artifacts) : [],
              creation_id: latest.creation_id
            };
          }
        }
        if (executionStatus) {
          res.json({
            status: executionStatus.status,
            creation_id: executionStatus.creation_id,
            startTime: executionStatus.startTime,
            endTime: executionStatus.endTime,
            result: executionStatus.result,
            artifacts: executionStatus.artifacts
          });
        } else {
          res.json({ status: 'pending' });
        }
      } catch (error) {
        console.error('Error checking test execution status:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.get('/api/v1/tests/cases', async (req, res) => {
      try {
        const testCases = await this.db.getAllTestCases();
        res.json(testCases);
      } catch (error) {
        console.error('Error fetching test cases:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.get('/api/v1/tests/cases/:creation_id', async (req, res) => {
      try {
        const testCase = await this.db.getTestCase(req.params.creation_id);
        if (!testCase) {
          return res.status(404).json({ error: 'Test case not found' });
        }
        res.json(testCase);
      } catch (error) {
        console.error('Error fetching test case:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // System Status API
    this.app.get('/api/v1/system/status', async (req, res) => {
      try {
        const redisStatus = await this.redis.ping();
        const testCases = await this.db.getAllTestCases();
        const testCasesCount = Array.isArray(testCases) ? testCases.length : 0;
        res.json({
          status: 'operational',
          redis: redisStatus === 'PONG' ? 'connected' : 'disconnected',
          database: 'connected',
          testCases: testCasesCount,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error getting system status:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Serve main UI
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`API Server running on port ${this.port}`);
        console.log(`Access the UI at: http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    await this.redis.quit();
    this.db.close();
  }
}