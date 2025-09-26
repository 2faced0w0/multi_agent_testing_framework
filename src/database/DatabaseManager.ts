import fs from 'fs';
import Database from 'better-sqlite3';
import path from 'path';

export class DatabaseManager {
  public getLatestExecutionByTestCaseId(testCaseId: string): any {
  const stmt = this.db.prepare('SELECT * FROM test_executions WHERE creation_id = ? ORDER BY start_time DESC');
    const executions = stmt.all(testCaseId);
    return executions.length > 0 ? executions[0] : null;
  }
  private db: any;

  constructor(dbPath: string) {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    fs.mkdirSync(dir, { recursive: true });
  
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_cases (
        creation_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        target_url TEXT NOT NULL,
        playwright_code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS test_executions (
        creation_id TEXT PRIMARY KEY,
        test_case_creation_id TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        result TEXT,
        artifacts TEXT,
        FOREIGN KEY (test_case_creation_id) REFERENCES test_cases(creation_id)
      );

      CREATE TABLE IF NOT EXISTS test_reports (
        creation_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creation_id) REFERENCES test_cases(creation_id)
      );
    `);
  }

  // Test Cases
  createTestCase(testCase: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO test_cases (creation_id, name, description, type, target_url, playwright_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      testCase.creation_id,
      testCase.name,
      testCase.description,
      testCase.type,
      testCase.targetUrl,
      testCase.playwrightCode
    );
  }

  getTestCase(creation_id: string): any {
    const stmt = this.db.prepare('SELECT * FROM test_cases WHERE creation_id = ?');
    return stmt.get(creation_id);
  }

  getAllTestCases(): any[] {
    const stmt = this.db.prepare('SELECT * FROM test_cases ORDER BY created_at DESC');
    return stmt.all();
  }

  // Test Executions
  createTestExecution(execution: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO test_executions (creation_id, test_case_creation_id, status, start_time, result, artifacts)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      execution.creation_id,
      execution.testCaseCreationId,
      execution.status,
      execution.startTime.toISOString(),
      JSON.stringify(execution.result || {}),
      JSON.stringify(execution.artifacts || [])
    );
  }

  updateTestExecution(creation_id: string, updates: any): void {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const stmt = this.db.prepare(`UPDATE test_executions SET ${fields} WHERE creation_id = ?`);
    stmt.run(...values, creation_id);
  }

  getTestExecution(creation_id: string): any {
    const stmt = this.db.prepare('SELECT * FROM test_executions WHERE creation_id = ?');
    return stmt.get(creation_id);
  }

  // Test Reports
  createTestReport(report: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO test_reports (creation_id, name, type, content)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(
      report.creation_id,
      report.name,
      report.type,
      report.content
    );
  }

  getTestReport(creation_id: string): any {
    const stmt = this.db.prepare('SELECT * FROM test_reports WHERE creation_id = ?');
    return stmt.get(creation_id);
  }

  close(): void {
    this.db.close();
  }
}