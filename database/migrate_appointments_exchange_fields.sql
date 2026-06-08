USE campus_share;

ALTER TABLE appointments
  ADD COLUMN exchange_mode VARCHAR(24) NOT NULL DEFAULT 'price' AFTER amount,
  ADD COLUMN exchange_value VARCHAR(255) NULL AFTER exchange_mode;

UPDATE appointments
SET exchange_mode = CASE
    WHEN amount > 0 THEN 'price'
    WHEN TRIM(COALESCE(note, '')) = '免費贈送' THEN 'free'
    WHEN note LIKE '請喝：%' THEN 'treat_drink'
    WHEN note LIKE '請吃：%' THEN 'treat_food'
    ELSE 'free'
  END,
  exchange_value = CASE
    WHEN amount > 0 THEN CAST(amount AS CHAR)
    WHEN note LIKE '請喝：%' THEN SUBSTRING(note, CHAR_LENGTH('請喝：') + 1)
    WHEN note LIKE '請吃：%' THEN SUBSTRING(note, CHAR_LENGTH('請吃：') + 1)
    ELSE NULL
  END;
