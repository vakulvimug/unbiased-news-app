/*
  # User Stats and Badges System

  1. New Tables
    - `user_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `current_streak` (integer, default 0)
      - `longest_streak` (integer, default 0)
      - `total_analyses` (integer, default 0)
      - `last_analysis_date` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_badges`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `badge_type` (text)
      - `earned_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `analysis_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `headline` (text)
      - `predicted_bias` (text)
      - `analyzed_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for users to read/write their own data
*/

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_analyses integer DEFAULT 0,
  last_analysis_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_type text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- Create analysis_history table
CREATE TABLE IF NOT EXISTS analysis_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  headline text NOT NULL,
  predicted_bias text NOT NULL,
  analyzed_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_analyzed_at ON analysis_history(analyzed_at DESC);

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- Policies for user_stats
CREATE POLICY "Users can read own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_badges
CREATE POLICY "Users can read own badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for analysis_history
CREATE POLICY "Users can read own analysis history"
  ON analysis_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis history"
  ON analysis_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_stats
DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();