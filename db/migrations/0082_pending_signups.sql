CREATE TABLE pending_signups (
  id                       serial          PRIMARY KEY,
  token                    text            NOT NULL UNIQUE,
  role                     text            NOT NULL CHECK (role IN ('organizer', 'boss')),
  email                    text            NOT NULL,
  name                     text            NOT NULL,
  phone                    text            NOT NULL,
  dob                      date            NOT NULL,
  gender                   text            NOT NULL,
  username                 text            NOT NULL,
  password                 text            NOT NULL,
  kyc_folder               text            NOT NULL,
  terms_accepted_version   integer         NOT NULL,
  privacy_accepted_version integer         NOT NULL,
  submitted_at             timestamptz     NOT NULL DEFAULT NOW()
);
