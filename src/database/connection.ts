import Database from 'better-sqlite3';
// Removed broken import for DatabaseConfig

export class DatabaseManager {
	private db: Database.Database;

	constructor(dbPath: string) {
		this.db = new Database(dbPath);
		this.db.pragma('journal_mode = WAL');
		this.db.pragma('synchronous = NORMAL');
		this.db.pragma('cache_size = 1000000');
		this.db.pragma('temp_store = memory');
	}

	initialize(): void {
		// Table creation logic should be here or delegated to another method
		// No createIndexes or seedInitialData methods exist
		// Example:
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
		`);
	}
}