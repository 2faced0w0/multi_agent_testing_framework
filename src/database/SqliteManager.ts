import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import { TestCase } from '../agents/BaseAgent.js';

export class SqliteManager {
  private db: BetterSqlite3.Database;

  constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'sqlite', 'framework.db');
  this.db = new BetterSqlite3(dbPath);
    this.createTable();
  }

  private createTable() {
    this.db.prepare(`CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      type TEXT,
      target_url TEXT,
      playwright_code TEXT,
      created_at TEXT
    )`).run();
  }

  insertTestCase(testCase: TestCase) {
    this.db.prepare(`INSERT OR REPLACE INTO test_cases (id, name, description, type, target_url, playwright_code, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(
        testCase.id,
        testCase.name,
        testCase.description,
        testCase.type,
        testCase.targetUrl,
        testCase.playwrightCode,
        testCase.createdAt.toISOString()
      );
  }

  getTestCase(id: string): TestCase | undefined {
  return this.db.prepare('SELECT * FROM testcases WHERE id = ?').get(id) as TestCase | undefined;
  }

  getAllTestCases(): TestCase[] {
  return this.db.prepare('SELECT * FROM testcases').all() as TestCase[];
  }
}
