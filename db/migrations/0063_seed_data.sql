-- Seed categories, badges, and themes.
-- Uses explicit IDs with OVERRIDING SYSTEM VALUE; sequences are bumped at the end.
-- ON CONFLICT DO NOTHING makes this safe to re-run.

-- Categories
INSERT INTO public.categories (id, category, subcategory, min_pay_per_head, max_pay_per_head, icon_version)
OVERRIDING SYSTEM VALUE VALUES
  (1,  'Coding',               'App Development',   1000, 1900, 0),
  (2,  'Coding',               'AIML',              1000, 1900, 0),
  (4,  'Fitness & Wellness',   'Cardio',            1000, 1900, 0),
  (5,  'Fitness & Wellness',   'Cognitive Training',1000, 1900, 0),
  (6,  'Visual Arts',          'Digital Creation',  1000, 1900, 0),
  (8,  'Visual Arts',          'Photography',       1300, 2200, 0),
  (9,  'Communication Skills', 'Public Speaking',    800, 1500, 0),
  (10, 'Communication Skills', 'Storytelling',       600, 1200, 0)
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.categories_id_seq', (SELECT MAX(id) FROM public.categories));

-- Badges (roadmaps left NULL — refreshBadgeRoadmaps will populate them)
INSERT INTO public.badges (id, title, category_id, league, description)
OVERRIDING SYSTEM VALUE VALUES
  (22, 'Frontend Web Developer',      1,  90, 'Build and style interactive web pages using HTML, CSS, and JavaScript — including responsive layouts, DOM manipulation, and basic form handling.'),
  (23, 'API Developer',               1,  70, 'Design, build, and document RESTful or GraphQL APIs with proper authentication, versioning, error handling, and rate limiting.'),
  (24, 'Mobile App Developer',        1,  50, 'Develop and publish cross-platform mobile applications with responsive UI, offline support, and push notifications.'),
  (25, 'Full-Stack Engineer',         1,  30, 'Build end-to-end production applications covering frontend frameworks, backend services, databases, authentication, and CI/CD pipelines.'),
  (26, 'Web App Developer',           1,  50, 'Develop and publish cross-platform web applications with responsive UI, offline support and push notifications.'),
  (27, 'DevOps Architect',            1,  10, 'Design and deploy scalable, fault-tolerant distributed applications with microservices, event-driven architecture, and multi-region cloud infrastructure.'),
  (28, 'Python Developer',            2,  90, 'Master the building blocks of AI/ML — writing Python scripts, working with data structures, using Jupyter notebooks, and understanding core statistics and probability concepts.'),
  (29, 'Data Analyst',                2,  70, 'Analyze datasets, build visualizations, and train classical machine learning models — covering data wrangling, feature engineering, and model evaluation fundamentals.'),
  (30, 'NLP & Generative AI Developer',2, 50, 'Develop applications powered by large language models — including prompt engineering, retrieval-augmented generation (RAG), embeddings, and AI agent workflows.'),
  (31, 'ML Engineer',                 2,  30, 'Build, train, evaluate, and ship machine learning models into production — covering deep learning, model optimization, experiment tracking, and serving infrastructure.'),
  (32, 'AI Systems Architect',        2,  10, 'Design and deploy end-to-end AI platforms at scale — spanning model training infrastructure, MLOps pipelines, LLM fine-tuning, and responsible AI governance across production environments.'),
  (33, 'Graphic Designer',            6,  50, 'Create compelling visual assets for digital platforms — mastering typography, layout, vector illustration, and brand consistency using industry-standard design tools for web, social, and print.'),
  (34, 'Video Producer',              6,  30, 'Produce high-quality video content from concept to final cut — covering cinematography, color grading, sound design, motion graphics, and storytelling for YouTube, film, or branded content.'),
  (35, 'Video Editor',                6,  70, 'Edit or transform raw footage into polished, engaging content for social media platforms or commercial projects. Handle cutting, color grading, sound design, and motion graphics with skilled storytelling, and deliver high-quality visual media.'),
  (36, 'Street Photographer',         8,  70, 'Shoot confidently in real-world environments using available light — applying compositional techniques, reading natural light conditions, and capturing authentic, unposed moments across street, travel, and documentary photography.'),
  (37, 'Photo Editor',                8,  61, 'Build a professional post-processing workflow in Lightroom and Photoshop — mastering RAW editing, color grading, skin retouching, batch processing, and developing a consistent personal editing style.'),
  (38, 'Short Story & Scene Writer',  10, 70, 'Write tight, engaging short stories and scenes with a clear beginning, middle, and end — using dialogue, sensory detail, conflict, and resolution to create a memorable reader experience.'),
  (39, 'Beginner Storyteller',        10, 90, 'Understand and apply the core elements of storytelling — the hero''s journey, three-act structure, character motivation, and point of view — to write your first complete short narrative.'),
  (40, 'Beginner Speaker',            9,  90, 'Build the core habits of an effective speaker — managing nervousness, maintaining eye contact, speaking at a clear pace, and delivering a short prepared talk to a small group.'),
  (41, 'Runner',                      4,  70, 'Do intense cardio and reduce three kilograms of weight and be able to run one kilometer at least.'),
  (42, 'Gym Rat',                     5,  81, 'Consistently show up to the exercise drills while aiming for hypertrophy.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.badges_id_seq', (SELECT MAX(id) FROM public.badges));

-- Themes
INSERT INTO public.themes (id, name, description)
OVERRIDING SYSTEM VALUE VALUES
  (1,  'Earth 2026',     'World of Today'),
  (2,  'Cyberpunk',      'A rain-soaked megacity of hackers, corpo towers, and neon-lit streets. Every achievement is a heist, upgrade, or reputation climb.'),
  (3,  'Space opera',    'An interstellar federation spanning galaxies. Adventures are missions across alien worlds, space stations, and uncharted nebulae.'),
  (4,  'Steampunk',      'A Victorian-era world of brass airships, clockwork automatons, and steam-powered inventions. Progress is literally engineered.'),
  (5,  'Shōnen anime',   'A vibrant archipelago where warriors train, unlock power arcs, and face tournament-style trials to rank up.'),
  (6,  'Dark gothic',    'A fog-drenched land of cursed manors, eldritch secrets, and monster hunters. Every challenge is a mystery to survive.'),
  (7,  'Greek mythology','An odyssey across divine realms — climb Olympus, sail treacherous seas, and earn the favor (or wrath) of gods.'),
  (8,  'Wild west',      'A lawless frontier of desert towns, train heists, and legendary showdowns. Reputation is everything.'),
  (9,  'Multiverse',     'A reality-bending hub where each adventure drops you into a different dimension. The only constant is your journal.'),
  (10, 'High fantasy',   'A sprawling kingdom of ancient magic, enchanted forests, and dragon-guarded peaks. Quests are royal decrees, skills are spells mastered.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.themes_id_seq', (SELECT MAX(id) FROM public.themes));
