import { BaseAgent, AgentConfig } from './BaseAgent.js';
import { AgentMessage } from '../types/index.js';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';

export class ReportGeneratorAgent extends BaseAgent {
  protected async initialize(): Promise<void> {
    // Initialize report generator
  }

  protected async processMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'GENERATE_REPORT':
        await this.handleGenerateReport(message);
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  private async handleGenerateReport(message: AgentMessage): Promise<void> {
    const { executionId } = message.payload;
  
    try {
      console.log(`Generating report for execution: ${executionId}`);
    
      // Get execution data
      const execution = await this.getData(`execution:${executionId}`);
      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }

      // Get test case data
      const testCase = await this.getData(`testcase:${execution.testCaseId}`);
    
      // Generate HTML report
      const reportHtml = this.generateHtmlReport(execution, testCase);
    
      // Save report
      const reportPath = await this.saveReport(execution.id, reportHtml);
    
      // Store report metadata
      const report = {
        id: uuid(),
        executionId,
        type: 'html',
        path: reportPath,
        generatedAt: new Date()
      };

      await this.storeData(`report:${report.id}`, report);

      console.log(`Report generated: ${reportPath}`);

    } catch (error) {
      console.error('Error generating report:', error);
    }
  }

  private generateHtmlReport(execution: any, testCase: any): string {
    const status = execution.status === 'passed' ? 'PASSED' : 'FAILED';
    const statusColor = execution.status === 'passed' ? 'green' : 'red';
  
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - ${testCase.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .status { font-size: 24px; font-weight: bold; color: ${statusColor}; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .code { background: #f8f8f8; padding: 10px; border-radius: 3px; font-family: monospace; }
        .screenshot { max-width: 100%; height: auto; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Execution Report</h1>
        <div class="status">Status: ${status}</div>
        <p><strong>Test:</strong> ${testCase.name}</p>
        <p><strong>URL:</strong> ${testCase.targetUrl}</p>
        <p><strong>Type:</strong> ${testCase.type}</p>
        <p><strong>Executed:</strong> ${new Date(execution.startTime).toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>Test Details</h2>
        <p><strong>Description:</strong> ${testCase.description}</p>
        <p><strong>Execution ID:</strong> ${execution.id}</p>
        <p><strong>Duration:</strong> ${execution.result?.duration || 'N/A'}ms</p>
    </div>

    <div class="section">
        <h2>Results</h2>
        <pre class="code">${JSON.stringify(execution.result, null, 2)}</pre>
    </div>

    ${execution.result?.screenshot ? `
    <div class="section">
        <h2>Screenshot</h2>
        <img src="${execution.result.screenshot}" alt="Test Screenshot" class="screenshot">
    </div>
    ` : ''}

    <div class="section">
        <h2>Generated Code</h2>
        <pre class="code">${testCase.playwrightCode}</pre>
    </div>
</body>
</html>`;
  }

  private async saveReport(executionId: string, html: string): Promise<string> {
    const reportsDir = path.join(process.cwd(), 'data', 'artifacts', 'reports');
  
    // Ensure directory exists
    fs.mkdirSync(reportsDir, { recursive: true });
  
    const filename = `report_${executionId}_${Date.now()}.html`;
    const filepath = path.join(reportsDir, filename);
  
    fs.writeFileSync(filepath, html);
  
    return filepath;
  }

  protected async cleanup(): Promise<void> {
    // Cleanup resources if needed
  }
}