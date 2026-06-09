USE campus_share;

ALTER TABLE students
  ADD COLUMN bio VARCHAR(500) NULL AFTER email;
