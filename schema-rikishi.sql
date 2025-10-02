-- Enhanced schema for rikishi (sumo wrestlers) data from sumo-api.com

-- Drop existing tables and recreate with enhanced structure
DROP TABLE IF EXISTS ranks CASCADE;
DROP TABLE IF EXISTS measurements CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS rikishis CASCADE;

-- Rikishi table with full API data
CREATE TABLE IF NOT EXISTS rikishis (
    id SERIAL PRIMARY KEY,
    sumo_db_id INTEGER,
    nsk_id INTEGER,
    shikona_en VARCHAR(255) NOT NULL,
    shikona_jp VARCHAR(255),
    current_rank VARCHAR(100),
    heya VARCHAR(255),
    birth_date DATE,
    shusshin VARCHAR(255),
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    debut VARCHAR(50),
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sumo_db_id)
);

-- Ranks table for tracking historical rankings
CREATE TABLE IF NOT EXISTS ranks (
    id SERIAL PRIMARY KEY,
    rikishi_id INTEGER NOT NULL REFERENCES rikishis(id) ON DELETE CASCADE,
    basho_id INTEGER,
    rank_value INTEGER,
    rank VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Measurements table for tracking historical measurements
CREATE TABLE IF NOT EXISTS measurements (
    id SERIAL PRIMARY KEY,
    rikishi_id INTEGER NOT NULL REFERENCES rikishis(id) ON DELETE CASCADE,
    basho_id INTEGER,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    measurement_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bouts table for real match data from sumo-api
CREATE TABLE IF NOT EXISTS bouts (
    id SERIAL PRIMARY KEY,
    basho_id VARCHAR(20) NOT NULL,
    division VARCHAR(50),
    day INTEGER,
    match_no INTEGER,
    east_id INTEGER,
    east_shikona VARCHAR(255),
    east_rank VARCHAR(100),
    west_id INTEGER,
    west_shikona VARCHAR(255),
    west_rank VARCHAR(100),
    kimarite VARCHAR(100),
    winner_id INTEGER,
    winner_en VARCHAR(255),
    winner_jp VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(basho_id, division, day, match_no)
);

-- Matches table (updated to work with new rikishis table)
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    rikishi_id INTEGER NOT NULL REFERENCES rikishis(id) ON DELETE CASCADE,
    rikishi_name VARCHAR(255) NOT NULL,
    result VARCHAR(10) NOT NULL CHECK (result IN ('win', 'loss')),
    opponent VARCHAR(255) NOT NULL,
    match_date DATE NOT NULL,
    tournament VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rikishi_id ON matches(rikishi_id);
CREATE INDEX IF NOT EXISTS idx_match_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_current_rank ON rikishis(current_rank);
CREATE INDEX IF NOT EXISTS idx_heya ON rikishis(heya);
CREATE INDEX IF NOT EXISTS idx_shikona_en ON rikishis(shikona_en);
CREATE INDEX IF NOT EXISTS idx_ranks_rikishi ON ranks(rikishi_id);
CREATE INDEX IF NOT EXISTS idx_ranks_basho ON ranks(basho_id);
CREATE INDEX IF NOT EXISTS idx_measurements_rikishi ON measurements(rikishi_id);
CREATE INDEX IF NOT EXISTS idx_measurements_basho ON measurements(basho_id);
CREATE INDEX IF NOT EXISTS idx_bouts_basho ON bouts(basho_id);
CREATE INDEX IF NOT EXISTS idx_bouts_east_id ON bouts(east_id);
CREATE INDEX IF NOT EXISTS idx_bouts_west_id ON bouts(west_id);
CREATE INDEX IF NOT EXISTS idx_bouts_winner_id ON bouts(winner_id);
