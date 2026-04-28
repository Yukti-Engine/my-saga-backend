CREATE TABLE legal_versions (
  app             text     PRIMARY KEY CHECK (app IN ('user', 'guide', 'expert')),
  terms_version   integer  NOT NULL DEFAULT 1,
  privacy_version integer  NOT NULL DEFAULT 1
);

INSERT INTO legal_versions (app, terms_version, privacy_version) VALUES
  ('user',   1, 1),
  ('guide',  1, 1),
  ('expert', 1, 1);
