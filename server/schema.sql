PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS players(id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, alias TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS mastery(player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE, level TEXT NOT NULL CHECK(level IN ('beginner','intermediate')), term_id TEXT NOT NULL, PRIMARY KEY(player_id,level,term_id));
CREATE INDEX IF NOT EXISTS mastery_level ON mastery(level,player_id);
