USE campus_share;

INSERT INTO categories (name, slug, sort_order) VALUES
  ('課本/文具', 'books-stationery', 10),
  ('電子 3C', 'electronics', 20),
  ('生活雜物', 'daily-goods', 30),
  ('服飾配件', 'fashion', 40),
  ('宿舍用品', 'dorm', 50);

INSERT INTO students (student_no, name, email, password_hash, status) VALUES
  ('S110001', '林同學', 's110001@campus.example', '$2y$10$replace_with_password_hash', 'active'),
  ('S110002', '陳同學', 's110002@campus.example', '$2y$10$replace_with_password_hash', 'active'),
  ('S110003', '王同學', 's110003@campus.example', '$2y$10$replace_with_password_hash', 'frozen');

INSERT INTO admins (username, password_hash, role, status) VALUES
  ('admin', '$2y$10$replace_with_password_hash', 'super_admin', 'active');
