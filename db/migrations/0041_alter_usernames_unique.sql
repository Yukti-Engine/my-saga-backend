DELETE FROM users
WHERE id NOT IN (
  SELECT MIN(id)
  FROM users
  GROUP BY username
);

ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE (username);