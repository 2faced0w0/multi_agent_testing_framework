import { DatabaseManager } from '../database/DatabaseManager.js';
import { BaseAgent, AgentConfig, AgentMessage } from './BaseAgent.js';
const { Mistral } = require('@mistralai/mistralai');
import { v4 as uuid } from 'uuid';

export class TestWriterAgent extends BaseAgent {
  private dbManager: DatabaseManager;

  private mistral: any;

  constructor(config: AgentConfig) {
  super(config);
  this.dbManager = new DatabaseManager(process.env.DATABASE_PATH || './data/sqlite/framework.db');
  }

  async start(): Promise<void> {
    await super.start();
  }

  async stop(): Promise<void> {
    await super.stop();
  }

  protected async initialize(): Promise<void> {
  this.mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY ?? '' });
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'GENERATE_TEST':
        await this.handleGenerateTest(message);
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  private async handleGenerateTest(message: AgentMessage): Promise<void> {
  const { url, testType, description } = message.payload;
  console.log('TestWriterAgent: Received GENERATE_TEST message:', { url, testType, description });
  
    try {
      console.log(`Generating ${testType} test for: ${url}`);

      // Generate test using Mistral AI chat completions
      const testCode = await this.generateTestCode(url, testType, description);

      // Create test case
      const testCase = {
        id: uuid(),
        name: `${testType} test for ${url}`,
        description: description || `Automated ${testType} test`,
        type: testType,
        targetUrl: url,
        playwrightCode: testCode,
        createdAt: new Date()
      };

      // Store test case in Redis
      await this.storeData(`testcase:${testCase.id}`, testCase);
      console.log('TestWriterAgent: Stored test case in Redis:', testCase.id);

      // Store test case in test_cases table using DatabaseManager
      this.dbManager.createTestCase({
        id: testCase.id,
        name: testCase.name,
        description: testCase.description,
        type: testCase.type,
        targetUrl: testCase.targetUrl,
        playwrightCode: testCase.playwrightCode
      });
      console.log('TestWriterAgent: Stored test case in SQLite:', testCase.id);

      // Log test generation event
      console.log('TestWriterAgent: Sending LOG message to logger_1');
      await this.sendMessage('logger_1', 'LOG', {
        level: 'info',
        message: `Test generated for ${url} (${testType})`,
        data: { testCase }
      });

      // Send response back
      console.log('TestWriterAgent: Sending TEST_GENERATED message to', message.source);
      await this.sendMessage(message.source, 'TEST_GENERATED', {
        testCase,
        success: true
      });

    } catch (error) {
  console.error('TestWriterAgent: Error generating test:', error);

      // Log test generation failure
      console.log('TestWriterAgent: Sending LOG error message to logger_1');
      await this.sendMessage('logger_1', 'LOG', {
        level: 'error',
        message: `Test generation failed for ${url} (${testType})`,
        data: { error: (error instanceof Error ? error.message : String(error)), url, testType, description }
      });

      console.log('TestWriterAgent: Sending TEST_GENERATION_FAILED message to', message.source);
      await this.sendMessage(message.source, 'TEST_GENERATION_FAILED', {
        error: (error instanceof Error ? error.message : String(error)),
        success: false
      });
    }
  }

  private async generateTestCode(url: string, testType: string, description: string): Promise<string> {
    const prompt = this.buildPrompt(url, testType, description);

    // Use Mistral AI chat completions API
    const response = await this.mistral.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Playwright test automation engineer. Generate clean, working Playwright test code.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1
    });

    // Log the raw Mistral response for debugging
    console.log('Mistral chat completions API response:', JSON.stringify(response, null, 2));

    // Type checking and fallback handling for response.choices[0].message.content
    if (
      response &&
      Array.isArray(response.choices) &&
      response.choices[0] &&
      response.choices[0].message &&
      typeof response.choices[0].message.content === 'string'
    ) {
      const text = response.choices[0].message.content as string;
      if (text.trim().length > 0) {
        return text;
      }
    }
    console.warn('Mistral response did not contain valid test code:', response);
    return '';
  }

  private buildPrompt(url: string, testType: string, description: string): string {
    const basePrompt = `Generate a Playwright test for the website: ${url}
Test Type: ${testType}
Description: ${description}

Requirements:
- Use TypeScript
- Include proper imports
- Add meaningful assertions
- Handle errors gracefully
- Include comments explaining the test steps
- Use modern Playwright syntax

The test should be complete and ready to run.`;

    switch (testType) {
      case 'functional':
        return `${basePrompt}

Focus on:
- User interactions (clicks, form fills, navigation)
- Element visibility and content verification
- Basic functionality testing`;

      case 'accessibility':
        return `${basePrompt}

Focus on:
- Use @axe-core/playwright for accessibility testing
- Check for WCAG compliance
- Test keyboard navigation
- Verify proper heading structure
- Check alt text for images`;

      case 'performance':
        return `${basePrompt}

Focus on:
- Measure page load times
- Check Core Web Vitals (LCP, FID, CLS)
- Monitor network requests
- Verify resource loading performance`;

      default:
        return basePrompt;
    }
  }

  protected async cleanup(): Promise<void> {
    // Cleanup resources if needed
  }
}