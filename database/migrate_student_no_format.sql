USE campus_share;

UPDATE students
SET student_no = 'CSE113001', email = 'cse113001@campus.example'
WHERE student_no = 'S110001';

UPDATE students
SET student_no = 'BUS112002', email = 'bus112002@campus.example'
WHERE student_no = 'S110002';

UPDATE students
SET student_no = 'ENG111003', email = 'eng111003@campus.example'
WHERE student_no = 'S110003';

ALTER TABLE students
  ADD CONSTRAINT chk_students_student_no_format
  CHECK (student_no REGEXP '^[A-Z]{3}[0-9]{6}$');
