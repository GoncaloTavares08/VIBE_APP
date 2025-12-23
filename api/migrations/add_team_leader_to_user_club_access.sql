-- Migration: Add team_leader_id to user_club_access table
-- Database: GLOBAL DB (if0_40705886_vibe_db)
-- Purpose: Establish team hierarchy for RPs

-- Add team_leader_id column
ALTER TABLE user_club_access 
ADD COLUMN team_leader_id INT NULL;

-- Add foreign key constraint
ALTER TABLE user_club_access
ADD CONSTRAINT fk_team_leader 
FOREIGN KEY (team_leader_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_team_leader ON user_club_access(team_leader_id);

-- Notes:
-- - team_leader_id is NULL for ADMIN, TEAM_LEADER, and CLIENT roles
-- - team_leader_id is REQUIRED for RP role (enforced at application level)
-- - ON DELETE SET NULL ensures RPs aren't deleted if their team leader is removed
