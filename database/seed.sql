USE campus_share;

INSERT INTO categories (name, slug, sort_order) VALUES
  ('課本/文具', 'books-stationery', 10),
  ('電子 3C', 'electronics', 20),
  ('生活雜物', 'daily-goods', 30),
  ('服飾配件', 'fashion', 40),
  ('宿舍用品', 'dorm', 50);

INSERT INTO admins (username, password_hash, role, status) VALUES
  ('admin', '$2y$10$nVv8C1Oyn/wJRqlNQfnnhuHmsaZv8b9IIGPljxFnaC.DGyhe2ocau', 'super_admin', 'active');
