ALTER TABLE public.organizers
ADD COLUMN category_qualifications varchar(30)[] DEFAULT '{}';
