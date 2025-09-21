import fs from 'fs';
import Database from 'better-sqlite3';
import path from 'path';

export class DatabaseManager {
  private db: Database.Database;

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
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        target_url TEXT NOT NULL,
        playwright_code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS test_executions (
        id TEXT PRIMARY KEY,
        test_case_id TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        result TEXT,
        artifacts TEXT,
        FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
      );

      CREATE TABLE IF NOT EXISTS test_reports (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // Test Cases
  createTestCase(testCase: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO test_cases (id, name, description, type, target_url, playwright_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
  
    stmt.run(
      testCase.id,
      testCase.name,
      testCase.description,
      testCase.type,
      testCase.targetUrl,
      testCase.playwrightCode
    );
  }

  getTestCase(id: string): any {
    const stmt = this.db.prepare('SELECT * FROM test_cases WHERE id = ?');
    return stmt.get(id);
  }

  getAllTestCases(): any[] {
    const stmt = this.db.prepare('SELECT * FROM test_cases ORDER BY created_at DESC');
    return stmt.all();
  }

  // Test Executions
  createTestExecution(execution: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO test_executions (id, test_case_id, status, start_time, result, artifacts)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
  
    stmt.run(
      execution.id,
      execution.testCaseId,
      execution.status,
      execution.startTime.toISOString(),
      JSON.stringify(execution.result || {}),
      JSON.stringify(execution.artifacts || [])
    );
  }

  updateTestExecution(id: string, updates: any): void {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
  
    const stmt = this.db.prepare(`UPDATE test_executions SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);
  }

  getTestExecution(id: string): any {
    const stmt = this.db.prepare('SELECT * FROM test_executions WHERE id = ?');
    return stmt.get(id);
  }

  close(): void {
    this.db.close();
  }
}