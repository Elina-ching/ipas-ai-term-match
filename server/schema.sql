PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS players(id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, alias TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS mastery(player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE, level TEXT NOT NULL CHECK(level IN ('beginner','intermediate')), term_id TEXT NOT NULL, PRIMARY KEY(player_id,level,term_id));
CREATE INDEX IF NOT EXISTS mastery_level ON mastery(level,player_id);
CREATE TABLE IF NOT EXISTS scores(player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,level TEXT NOT NULL,stars INTEGER NOT NULL,PRIMARY KEY(player_id,level));
CREATE INDEX IF NOT EXISTS scores_ranking ON scores(level,stars DESC,player_id);
CREATE TRIGGER IF NOT EXISTS mastery_score_add AFTER INSERT ON mastery BEGIN
 INSERT INTO scores(player_id,level,stars) VALUES(NEW.player_id,NEW.level,1) ON CONFLICT(player_id,level) DO UPDATE SET stars=stars+1;
END;
CREATE TRIGGER IF NOT EXISTS mastery_score_remove AFTER DELETE ON mastery BEGIN
 UPDATE scores SET stars=stars-1 WHERE player_id=OLD.player_id AND level=OLD.level;
 DELETE FROM scores WHERE player_id=OLD.player_id AND level=OLD.level AND stars<=0;
END;
INSERT INTO scores(player_id,level,stars) SELECT player_id,level,COUNT(*) FROM mastery GROUP BY player_id,level ON CONFLICT(player_id,level) DO UPDATE SET stars=excluded.stars;
CREATE TABLE IF NOT EXISTS activity(player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,updated_at TEXT NOT NULL,action TEXT NOT NULL,result TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS player_activity AFTER INSERT ON players BEGIN
 INSERT INTO activity VALUES(NEW.id,strftime('%Y-%m-%dT%H:%M:%SZ','now'),'join','success');
END;
CREATE TRIGGER IF NOT EXISTS mastery_activity AFTER INSERT ON mastery BEGIN
 INSERT INTO activity VALUES(NEW.player_id,strftime('%Y-%m-%dT%H:%M:%SZ','now'),'mastery','success') ON CONFLICT(player_id) DO UPDATE SET updated_at=excluded.updated_at,action=excluded.action,result=excluded.result;
END;
