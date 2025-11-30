-- Add approval_status column to activities table
-- This allows admin to approve/reject activities before they are visible to users

-- Add approval_status column (pending, approved, rejected)
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_activities_approval_status ON activities(approval_status);

-- Update existing activities to 'approved' status (so they remain visible)
UPDATE activities 
SET approval_status = 'approved' 
WHERE approval_status IS NULL OR approval_status = 'pending';

-- Add comment to column
COMMENT ON COLUMN activities.approval_status IS 'Status of activity approval: pending (awaiting admin approval), approved (visible to users), rejected (not visible)';

