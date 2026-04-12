-- Venue Partners Table (must be created first due to foreign key)
CREATE TABLE venue_partners (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255)        NOT NULL,
    phone         VARCHAR(20),
    email         VARCHAR(255)        UNIQUE
);

-- Venues Table
CREATE TABLE venues (
    venue_id      SERIAL PRIMARY KEY,
    venue_name    VARCHAR(255)        NOT NULL,
    venue_link    TEXT,
    venue_lat     DECIMAL(9, 6),
    venue_long    DECIMAL(9, 6),
    created_at    TIMESTAMPTZ         DEFAULT NOW(),
    venue_partner_id INT              REFERENCES venue_partners(id) ON DELETE SET NULL
);

-- Alloted Schedules Table (separate table for the list of schedule ranges)
CREATE TABLE alloted_schedules (
    id            SERIAL PRIMARY KEY,
    venue_id      INT                 NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
    start_time    TIMESTAMPTZ         NOT NULL,
    end_time      TIMESTAMPTZ         NOT NULL,
    CONSTRAINT no_overlap CHECK (start_time < end_time)
);