ALTER TABLE public.organizers DROP COLUMN category_qualifications;
CREATE TABLE organizer_qualifications (
    organizer_id INT NOT NULL,
    category_id  INT NOT NULL,

    PRIMARY KEY (organizer_id, category_id),

    CONSTRAINT fk_oq_organizers
        FOREIGN KEY (organizer_id)
        REFERENCES organizers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_oq_categories
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);