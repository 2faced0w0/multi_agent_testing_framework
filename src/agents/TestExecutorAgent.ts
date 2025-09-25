import { BaseAgent, AgentConfig, AgentMessage } from './BaseAgent.js';
import { AgentMessage as AgentMessageType } from '../types/index.js';
import { chromium, Browser, Page } from 'playwright';
import { DatabaseManager } from '../database/DatabaseManager.js';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import { createClient } from 'redis';

export class TestExecutorAgent extends BaseAgent {
  private browser: Browser | null = null;
  private db: any;

  constructor(config: AgentConfig) {
  super(config);
  this.db = new DatabaseManager(process.env.DATABASE_PATH || './data/sqlite/framework.db');
  }

  // Handles incoming messages and delegates to processMessage
  protected async handleMessage(message: AgentMessageType): Promise<void> {
    await this.processMessage(message);
  }

  // Fetches data from JSON files in the data directory
  protected async getData(key: string): Promise<any> {
    const safeKey = key.replace(/[^a-zA-Z0-9:_-]/g, '');
    const dataPath = path.join(process.cwd(), 'data', `${safeKey}.json`);
    if (fs.existsSync(dataPath)) {
      const raw = await fs.promises.readFile(dataPath, 'utf-8');
      return JSON.parse(raw);
    }
    return null;
  }

  // Stores data as JSON files in the data directory
  protected async storeData(key: string, value: any): Promise<void> {
    const safeKey = key.replace(/[^a-zA-Z0-9:_-]/g, '');
    const dataPath = path.join(process.cwd(), 'data', `${safeKey}.json`);
    await fs.promises.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.promises.writeFile(dataPath, JSON.stringify(value, null, 2), 'utf-8');
  }

  // Sends a message to another agent (stub: logs to console)
  protected async sendMessage(target: string, type: string, payload: any): Promise<void> {
    // Replace with actual messaging logic (e.g., event bus, IPC, etc.)
    console.log(`Sending message to ${target}:`, { type, payload });
    if (target !== 'logger_1') {
      await super.sendMessage('logger_1', 'LOG', {
        level: 'info',
        message: `Sending message to ${target}`,
        data: { type, payload }
      });
    }
  }

  protected async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true
    });
  }

  public async processMessage(message: AgentMessageType): Promise<void> {
    switch (message.type) {
      case 'EXECUTE_TEST':
        await this.handleExecuteTest(message);
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

  private async handleExecuteTest(message: AgentMessageType): Promise<void> {
    const { testCaseId } = message.payload;

    try {
      console.log(`Executing test: ${testCaseId}`);
      await this.sendMessage('logger_1', 'LOG', {
        level: 'info',
        message: `Executing test: ${testCaseId}`,
        data: { testCaseId }
      });

      let testCase = await this.getData(`testcase:${testCaseId}`);
      if (!testCase && this.db) {
        const dbCase = this.db.getTestCase(testCaseId);
        if (dbCase) {
          testCase = {
            id: dbCase.id,
            name: dbCase.name,
            description: dbCase.description,
            type: dbCase.type,
            targetUrl: dbCase.target_url,
            playwrightCode: dbCase.playwright_code,
            createdAt: dbCase.created_at
          };
        }
      }
      if (!testCase) {
        throw new Error(`Test case not found: ${testCaseId}`);
      }

      const execution = {
        id: uuid(),
        testCaseId,
        status: 'running',
        startTime: new Date(),
        endTime: null as Date | null,
        result: undefined,
        artifacts: [] as string[]
      };

      await this.storeData(`execution:${execution.id}`, execution);

      const result = await this.executeTest(testCase, execution.id);

      execution.status = result.success ? 'passed' : 'failed';
      execution.endTime = new Date();
      execution.result = result;
      if (result.screenshot) {
        execution.artifacts.push(result.screenshot);
      }

      await this.storeData(`execution:${execution.id}`, execution);

      await this.sendMessage(message.source, 'TEST_EXECUTED', {
        execution,
        success: result.success
      });

      await this.sendMessage('report_generator', 'GENERATE_REPORT', {
        executionId: execution.id
      });

    } catch (error: unknown) {
      console.error('Error executing test:', error);
      await this.sendMessage(message.source, 'TEST_EXECUTION_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
  }

  private async executeTest(testCase: any, executionId: string): Promise<any> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      const testResult = await this.runTestCode(page, testCase, executionId);

      const screenshotPath = await this.takeScreenshot(page, executionId);

      return {
        success: true,
        result: testResult,
        screenshot: screenshotPath,
        duration: Date.now() - new Date(testCase.createdAt).getTime()
      };

    } catch (error: unknown) {
      const screenshotPath = await this.takeScreenshot(page, executionId, 'error');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        screenshot: screenshotPath
      };
    } finally {
      await context.close();
    }
  }

  private async runTestCode(page: Page, testCase: any, executionId: string): Promise<any> {
    console.log('Navigating to:', testCase.targetUrl);
    await this.sendMessage('logger_1', 'LOG', {
      level: 'info',
      message: 'Navigating to',
      data: { targetUrl: testCase.targetUrl }
    });
    await page.goto(testCase.targetUrl);

    await page.waitForLoadState('networkidle');

    const title = await page.title();
    const url = page.url();

    const isLoaded = await page.evaluate(() => {
      return document.readyState === 'complete';
    });

    return {
      title,
      url,
      isLoaded,
      timestamp: new Date()
    };
  }

  private async takeScreenshot(page: Page, executionId: string, type: string = 'result'): Promise<string> {
    const screenshotDir = path.join(process.cwd(), 'data', 'artifacts', 'screenshots');
    await fs.promises.mkdir(screenshotDir, { recursive: true });

    const filename = `${executionId}_${type}_${Date.now()}.png`;
    const filepath = path.join(screenshotDir, filename);

    await page.screenshot({ path: filepath });

    return filepath;
  }

  protected async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    await this.sendMessage('logger_1', 'LOG', {
      level: 'info',
      message: 'TestExecutorAgent cleanup complete',
      data: {}
    });
  }

  // Poll Redis queue:test_executor for new messages
  private async pollQueue(): Promise<void> {
    while (true) {
      try {
        const result = await this.redis.sendCommand(['BRPOP', 'queue:test_executor', '0']);
        if (result && result.length === 2) {
          const message = JSON.parse(result[1]);
          await this.handleMessage(message);
        }
      } catch (err) {
        console.error('[TestExecutorAgent] Error polling Redis queue:', err);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  async start(): Promise<void> {
    await this.initialize();
    await super.start();
    this.pollQueue();
  }

  async stop(): Promise<void> {
    await this.cleanup();
    await super.stop();
  }
}
