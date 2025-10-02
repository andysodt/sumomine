-- Create database
-- Run this first: CREATE DATABASE sumomine;

-- Connect to the database and run the following:

-- Rikishis table
CREATE TABLE IF NOT EXISTS rikishis (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rank VARCHAR(100) NOT NULL,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    rikishi_id INTEGER NOT NULL REFERENCES rikishis(id) ON DELETE CASCADE,
    rikishi_name VARCHAR(255) NOT NULL,
    result VARCHAR(10) NOT NULL CHECK (result IN ('win', 'loss')),
    opponent VARCHAR(255) NOT NULL,
    match_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rikishi_id ON matches(rikishi_id);
CREATE INDEX IF NOT EXISTS idx_match_date ON matches(match_date);
