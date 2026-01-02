-- =====================================================
-- ELC MANAGEMENT SYSTEM - SEED DATA
-- Run this script in Supabase SQL Editor to populate sample data
-- =====================================================
--
-- THIS SCRIPT IS IDEMPOTENT - Safe to run multiple times!
-- It will delete existing sample data and re-insert fresh data.
--
-- UUID PREFIX MAPPING (all using valid hex characters 0-9, a-f):
-- - Locations:        10000001-...
-- - Featured Teachers: f0000001-...
-- - Online Modules:   0a000001-...
-- - Student of Month: 50000001-...
-- - Placement Qs:     60000001-...
-- - News:             70000001-...
-- - Olympiads:        90000001-...
-- - Kahoot:           a0000001-...
-- - Teachers Profile: e1000001-...
-- - Students Profile: e2000001-...
-- - Admin Profile:    e3000001-...
-- - Class Sessions:   c0000001-...
-- - Session Reports:  e4000001-...
--
-- =====================================================

-- =====================================================
-- 1. DISABLE FOREIGN KEY CONSTRAINTS (for seed data)
-- =====================================================
-- Use session_replication_role to bypass FK checks
-- This is the Supabase-compatible way to disable FK constraints
SET session_replication_role = 'replica';

-- =====================================================
-- 2. CLEANUP - Delete existing sample data first
-- =====================================================
-- Delete in reverse order of dependencies
-- Note: Cast UUID to text for LIKE comparison

DELETE FROM session_reports WHERE id::text LIKE 'e4%';
DELETE FROM class_sessions WHERE id::text LIKE 'c0000%';
DELETE FROM profiles WHERE id::text LIKE 'e1%' OR id::text LIKE 'e2%' OR id::text LIKE 'e3%';
DELETE FROM olympiads WHERE id::text LIKE '90000%';
DELETE FROM kahoot_quizzes WHERE id::text LIKE 'a0000%';
DELETE FROM news WHERE id::text LIKE '70000%';
DELETE FROM placement_questions WHERE id::text LIKE '60000%';
DELETE FROM student_of_the_month WHERE id::text LIKE '50000%';
DELETE FROM online_modules WHERE id::text LIKE '0a000%';
DELETE FROM featured_teachers WHERE id::text LIKE 'f0000%';
DELETE FROM locations WHERE id::text LIKE '10000%';
DELETE FROM site_settings WHERE id = '00000000-0000-0000-0000-000000000001';


-- =====================================================
-- 3. LOCATIONS (School Branches)
-- =====================================================

INSERT INTO locations (id, name, address, capacity, level) VALUES
('10000001-0000-0000-0000-000000000001', 'ELC Surabaya - Pakuwon Mall', 'Pakuwon Mall Lt. 3, Surabaya', 50, 'Premium'),
('10000002-0000-0000-0000-000000000002', 'ELC Surabaya - Galaxy Mall', 'Galaxy Mall Lt. 2, Surabaya', 40, 'Standard'),
('10000003-0000-0000-0000-000000000003', 'ELC Surabaya - Ciputra World', 'Ciputra World Lt. 1, Surabaya', 45, 'Premium'),
('10000004-0000-0000-0000-000000000004', 'ELC Surabaya - Tunjungan Plaza', 'Tunjungan Plaza 6 Lt. 5, Surabaya', 35, 'Standard');


-- =====================================================
-- 4. FEATURED TEACHERS (Guru of the Year)
-- =====================================================

INSERT INTO featured_teachers (id, name, country, country_flag, type, photo_url, certifications, experience, specialty, quote, is_active) VALUES
('f0000001-0000-0000-0000-000000000001', 'Ms. Sarah Johnson', 'United States', '🇺🇸', 'native',
 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
 ARRAY['TEFL Certified', 'Cambridge CELTA', 'IELTS Examiner'], 8,
 'Business English & IELTS Preparation',
 'Teaching is not just about imparting knowledge, but igniting a passion for learning.',
 true),
('f0000002-0000-0000-0000-000000000002', 'Mr. James Williams', 'United Kingdom', '🇬🇧', 'native',
 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
 ARRAY['CELTA Certified', 'DELTA Module 1', 'TOEFL iBT Trainer'], 12,
 'Academic English & Cambridge Exams',
 'Every student has potential; our job is to help them discover it.',
 true),
('f0000003-0000-0000-0000-000000000003', 'Ms. Anita Wijaya', 'Indonesia', '🇮🇩', 'local',
 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
 ARRAY['TESOL Certified', 'TKT Cambridge', 'IELTS Band 8.5'], 6,
 'Grammar & Writing Skills',
 'Belajar bahasa Inggris itu menyenangkan jika kita tahu caranya!',
 true),
('f0000004-0000-0000-0000-000000000004', 'Mr. Michael Brown', 'Australia', '🇦🇺', 'native',
 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
 ARRAY['TESOL Masters', 'Cambridge CELTA', 'Pronunciation Specialist'], 10,
 'Speaking & Pronunciation',
 'Communication is the key to success in any language.',
 true);


-- =====================================================
-- 5. ONLINE MODULES (Learning Hub Materials)
-- =====================================================

INSERT INTO online_modules (id, title, description, video_url, skill_category, difficulty_level, status, materials, exams) VALUES
('0a000001-0000-0000-0000-000000000001', 'Professional Email Writing',
 'Master the art of writing professional emails in English. Learn proper greetings, closings, and business etiquette.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ',
 'Writing', 'Intermediate', 'PUBLISHED',
 ARRAY['Email Templates.pdf', 'Common Phrases Guide.pdf'],
 '[{"id": "q1", "text": "Which greeting is most appropriate for a formal business email?", "type": "MULTIPLE_CHOICE", "options": ["Hey!", "Dear Mr. Smith,", "Yo!", "Whats up?"], "correctAnswerIndex": 1}]'::jsonb),

('0a000002-0000-0000-0000-000000000002', 'Mastering Present Perfect Tense',
 'Understand when and how to use the present perfect tense correctly. Includes practice exercises and real-world examples.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ',
 'Grammar', 'Upper-Intermediate', 'PUBLISHED',
 ARRAY['Present Perfect Worksheet.pdf', 'Tense Comparison Chart.pdf'],
 '[{"id": "q1", "text": "I _____ to Paris three times.", "type": "MULTIPLE_CHOICE", "options": ["went", "have been", "was going", "go"], "correctAnswerIndex": 1}]'::jsonb),

('0a000003-0000-0000-0000-000000000003', 'Public Speaking: Body Language',
 'Learn how to use body language effectively during presentations. Tips from professional speakers.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ',
 'Speaking', 'Advanced', 'PUBLISHED',
 ARRAY['Body Language Guide.pdf', 'Presentation Checklist.pdf'],
 '[{"id": "q1", "text": "What does maintaining eye contact during a presentation show?", "type": "MULTIPLE_CHOICE", "options": ["Nervousness", "Confidence", "Disinterest", "Confusion"], "correctAnswerIndex": 1}]'::jsonb),

('0a000004-0000-0000-0000-000000000004', 'IELTS Listening Strategies',
 'Essential strategies for achieving high scores in the IELTS Listening test. Practice with sample questions.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ',
 'Listening', 'Upper-Intermediate', 'PUBLISHED',
 ARRAY['IELTS Listening Tips.pdf', 'Sample Questions.pdf'],
 '[{"id": "q1", "text": "When should you read the questions in IELTS Listening?", "type": "MULTIPLE_CHOICE", "options": ["After the audio", "Before the audio", "During the audio", "Never"], "correctAnswerIndex": 1}]'::jsonb),

('0a000005-0000-0000-0000-000000000005', 'Business Vocabulary Essentials',
 'Build your business vocabulary with 100+ essential terms used in corporate environments.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ',
 'Vocabulary', 'Intermediate', 'PUBLISHED',
 ARRAY['Business Terms Glossary.pdf', 'Flashcards.pdf'],
 '[{"id": "q1", "text": "What does ROI stand for?", "type": "MULTIPLE_CHOICE", "options": ["Return on Investment", "Rate of Interest", "Risk of Inflation", "Revenue of Industry"], "correctAnswerIndex": 0}]'::jsonb);


-- =====================================================
-- 6. STUDENT OF THE MONTH
-- =====================================================

INSERT INTO student_of_the_month (id, name, image, achievement, month_year) VALUES
('50000001-0000-0000-0000-000000000001', 'Budi Santoso',
 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
 'Achieved IELTS Band 7.5 after only 3 months of intensive preparation. Showed exceptional dedication and improvement in Speaking skills.',
 'January 2025'),
('50000002-0000-0000-0000-000000000002', 'Siti Rahma',
 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
 'Won 1st Place in the Regional English Debate Competition. Demonstrated outstanding critical thinking and fluency.',
 'December 2024'),
('50000003-0000-0000-0000-000000000003', 'Ahmad Fauzi',
 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
 'Completed all Learning Hub modules with perfect scores. Active participant in Speaking Club sessions.',
 'November 2024');


-- =====================================================
-- 7. PLACEMENT QUESTIONS (Test Your English Skills)
-- =====================================================

INSERT INTO placement_questions (id, text, options, correct_answer_index, weight, is_active) VALUES
-- Grammar Questions (Elementary - weight 1)
('60000001-0000-0000-0000-000000000001', 'She _____ to the gym every morning before work.',
 ARRAY['go', 'goes', 'going', 'gone'], 1, 1, true),
('60000002-0000-0000-0000-000000000002', 'I _____ breakfast at 7 AM every day.',
 ARRAY['have', 'has', 'having', 'had'], 0, 1, true),

-- Grammar Questions (Intermediate - weight 2)
('60000003-0000-0000-0000-000000000003', 'If I _____ rich, I would travel the world.',
 ARRAY['am', 'was', 'were', 'be'], 2, 2, true),
('60000004-0000-0000-0000-000000000004', 'By next year, I _____ here for 5 years.',
 ARRAY['will work', 'will be working', 'will have worked', 'work'], 2, 2, true),

-- Grammar Questions (Advanced - weight 3)
('60000005-0000-0000-0000-000000000005', 'The report _____ by the time you arrive tomorrow.',
 ARRAY['will finish', 'will be finished', 'will have been finished', 'is finished'], 2, 3, true),

-- Vocabulary Questions
('60000006-0000-0000-0000-000000000006', 'Choose the synonym of "abundant":',
 ARRAY['scarce', 'plentiful', 'limited', 'rare'], 1, 2, true),
('60000007-0000-0000-0000-000000000007', 'The word "ubiquitous" means:',
 ARRAY['rare', 'everywhere', 'unique', 'ancient'], 1, 3, true),

-- Reading/Context Questions
('60000008-0000-0000-0000-000000000008', 'Based on the context, what does "commenced" mean in: "The meeting commenced at 9 AM sharp."',
 ARRAY['ended', 'started', 'was cancelled', 'was delayed'], 1, 2, true),
('60000009-0000-0000-0000-000000000009', 'What does "procrastinate" mean?',
 ARRAY['to work hard', 'to delay doing something', 'to celebrate', 'to organize'], 1, 2, true);


-- =====================================================
-- 8. NEWS & ARTICLES
-- =====================================================

INSERT INTO news (id, title, featured_image, video_url, display_media, content, published_date, summary, is_published) VALUES
('70000001-0000-0000-0000-000000000001', 'ELC Students Achieve Record IELTS Scores in 2024',
 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
 NULL, 'image',
 '<p>We are thrilled to announce that ELC students have achieved record-breaking IELTS scores in 2024! Our dedicated teachers and innovative teaching methods have helped over 50 students achieve their target band scores.</p>
 <p>Key highlights:</p>
 <ul>
   <li>15 students achieved Band 8.0 or above</li>
   <li>Average improvement of 1.5 bands after 3 months</li>
   <li>100% student satisfaction rate</li>
 </ul>
 <p>Congratulations to all our students and teachers for this remarkable achievement!</p>',
 '2025-01-15',
 'ELC students break records with outstanding IELTS performance in 2024.',
 true),

('70000002-0000-0000-0000-000000000002', 'New Speaking Club: Practice English with Native Speakers',
 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800',
 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'video',
 '<p>Introducing our brand new Speaking Club! Every Saturday from 2-4 PM, students can practice conversational English with our native-speaking teachers in a relaxed, friendly environment.</p>
 <p>What to expect:</p>
 <ul>
   <li>Small group discussions (max 6 students)</li>
   <li>Real-world topics and scenarios</li>
   <li>Pronunciation feedback</li>
   <li>Free snacks and beverages!</li>
 </ul>
 <p>Sign up now at your nearest ELC branch!</p>',
 '2025-01-10',
 'Join our new Speaking Club every Saturday and practice with native speakers!',
 true),

('70000003-0000-0000-0000-000000000003', 'ELC Surabaya Opens New Branch at Tunjungan Plaza',
 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
 NULL, 'image',
 '<p>We are excited to announce the grand opening of our newest branch at Tunjungan Plaza 6, 5th Floor!</p>
 <p>Our new facility features:</p>
 <ul>
   <li>Modern, air-conditioned classrooms</li>
   <li>State-of-the-art multimedia lab</li>
   <li>Comfortable student lounge</li>
   <li>Free WiFi throughout</li>
 </ul>
 <p>Visit us for a free trial class and experience the ELC difference!</p>',
 '2025-01-05',
 'ELC expands with a new modern facility at Tunjungan Plaza 6.',
 true),

('70000004-0000-0000-0000-000000000004', 'Tips for Mastering English Pronunciation',
 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800',
 NULL, 'image',
 '<p>Pronunciation is often the most challenging aspect of learning English. Here are some tips from our expert teachers:</p>
 <ol>
   <li><strong>Listen actively:</strong> Pay attention to how native speakers pronounce words in movies and podcasts.</li>
   <li><strong>Practice tongue twisters:</strong> They help improve your articulation and fluency.</li>
   <li><strong>Record yourself:</strong> Compare your pronunciation with native speakers.</li>
   <li><strong>Focus on stress patterns:</strong> English is a stress-timed language.</li>
   <li><strong>Learn the IPA:</strong> Understanding phonetic symbols helps with pronunciation.</li>
 </ol>
 <p>Join our Pronunciation Workshop every Wednesday for more tips!</p>',
 '2024-12-28',
 'Expert tips to improve your English pronunciation from ELC teachers.',
 true),

('70000005-0000-0000-0000-000000000005', 'Upcoming: English Olympiad 2025 Registration Now Open',
 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
 NULL, 'image',
 '<p>The ELC English Olympiad 2025 is back! This prestigious competition is open to all students from grades 7-12.</p>
 <p>Competition details:</p>
 <ul>
   <li><strong>Date:</strong> March 15, 2025</li>
   <li><strong>Venue:</strong> ELC Surabaya - Pakuwon Mall</li>
   <li><strong>Registration fee:</strong> Rp 150.000</li>
   <li><strong>Prizes:</strong> Scholarships up to Rp 10.000.000</li>
 </ul>
 <p>Register now through our website or visit any ELC branch!</p>',
 '2024-12-20',
 'Register now for ELC English Olympiad 2025 with scholarships up to Rp 10 million!',
 true);


-- =====================================================
-- 9. OLYMPIADS
-- =====================================================

INSERT INTO olympiads (id, title, description, status, start_date, end_date, event_date, event_time, event_location, questions, reward, participant_count, price, terms, benefits, is_active) VALUES
('90000001-0000-0000-0000-000000000001', 'ELC English Olympiad 2025',
 'Annual English competition for students grades 7-12. Test your skills in Grammar, Vocabulary, Reading, and Writing!',
 'OPEN', '2025-01-01', '2025-03-01', '2025-03-15', '08:00', 'ELC Surabaya - Pakuwon Mall',
 '[{"id": "q1", "text": "Choose the correct form: She _____ to school every day.", "options": ["go", "goes", "going", "went"], "correctAnswerIndex": 1}]'::jsonb,
 'Scholarships up to Rp 10.000.000 + Certificates + Trophies',
 45, 150000,
 'Open for students grades 7-12. Each participant can only register once.',
 '["Certificate of Participation", "Free ELC Trial Class", "Exclusive ELC Merchandise"]'::jsonb,
 true);


-- =====================================================
-- 10. KAHOOT QUIZZES (Live Quiz Challenge)
-- =====================================================

INSERT INTO kahoot_quizzes (id, title, description, is_active, questions, play_count) VALUES
('a0000001-0000-0000-0000-000000000001', 'Grammar Challenge: Tenses',
 'Test your knowledge of English tenses! From simple present to perfect continuous.',
 true,
 '[
   {"id": "q1", "text": "She _____ to school every day.", "options": ["go", "goes", "going", "went"], "correctIndex": 1, "timeLimit": 20},
   {"id": "q2", "text": "I _____ my homework when you called.", "options": ["do", "did", "was doing", "have done"], "correctIndex": 2, "timeLimit": 20},
   {"id": "q3", "text": "They _____ in Paris for 5 years now.", "options": ["live", "lived", "are living", "have lived"], "correctIndex": 3, "timeLimit": 20},
   {"id": "q4", "text": "By next month, I _____ this project.", "options": ["finish", "finished", "will finish", "will have finished"], "correctIndex": 3, "timeLimit": 25},
   {"id": "q5", "text": "If I _____ you, I would apologize.", "options": ["am", "was", "were", "be"], "correctIndex": 2, "timeLimit": 20}
 ]'::jsonb,
 127),

('a0000002-0000-0000-0000-000000000002', 'Vocabulary Builder: Business English',
 'Expand your professional vocabulary with common business terms!',
 true,
 '[
   {"id": "q1", "text": "What does ''ROI'' stand for?", "options": ["Return on Investment", "Rate of Interest", "Risk of Income", "Revenue on Interest"], "correctIndex": 0, "timeLimit": 15},
   {"id": "q2", "text": "A ''deadline'' is:", "options": ["The end of a project", "A time limit for completion", "A type of contract", "A financial term"], "correctIndex": 1, "timeLimit": 15},
   {"id": "q3", "text": "''To brainstorm'' means:", "options": ["To think of many ideas", "To have a headache", "To argue with colleagues", "To take a break"], "correctIndex": 0, "timeLimit": 15},
   {"id": "q4", "text": "An ''agenda'' is:", "options": ["A type of meeting", "A list of topics to discuss", "A business card", "An office supply"], "correctIndex": 1, "timeLimit": 15},
   {"id": "q5", "text": "''ASAP'' means:", "options": ["As Simple As Possible", "As Soon As Possible", "Always Say A Prayer", "After Several Attempts Please"], "correctIndex": 1, "timeLimit": 10}
 ]'::jsonb,
 89),

('a0000003-0000-0000-0000-000000000003', 'Quick Quiz: Common Mistakes',
 'Can you spot and fix these common English mistakes?',
 true,
 '[
   {"id": "q1", "text": "Which is CORRECT?", "options": ["Your beautiful", "Youre beautiful", "You are beautiful", "You is beautiful"], "correctIndex": 2, "timeLimit": 15},
   {"id": "q2", "text": "Which is CORRECT?", "options": ["Their going home", "Theyre going home", "There going home", "They are going home"], "correctIndex": 3, "timeLimit": 15},
   {"id": "q3", "text": "Which is CORRECT?", "options": ["I could of done it", "I could have done it", "I could has done it", "I could did it"], "correctIndex": 1, "timeLimit": 15},
   {"id": "q4", "text": "Which is CORRECT?", "options": ["Me and him went", "Him and me went", "He and I went", "I and he went"], "correctIndex": 2, "timeLimit": 15},
   {"id": "q5", "text": "Which is CORRECT?", "options": ["Less people came", "Fewer people came", "Lesser people came", "Little people came"], "correctIndex": 1, "timeLimit": 15}
 ]'::jsonb,
 156);


-- =====================================================
-- 11. SITE SETTINGS
-- =====================================================

INSERT INTO site_settings (id, primary_color, accent_color, video_url, video_title, video_description, video_orientation) VALUES
('00000000-0000-0000-0000-000000000001', '#1e40af', '#3b82f6',
 'https://www.youtube.com/embed/dQw4w9WgXcQ',
 'Welcome to ELC Surabaya',
 'Discover the joy of learning English with our expert teachers and proven methods.',
 'landscape');


-- =====================================================
-- 12. PROFILES (Users - Teachers & Students)
-- =====================================================

-- Teachers (using e1 prefix - valid hex)
INSERT INTO profiles (id, name, email, phone, role, status, branch, address, assigned_location_id, school_origin, skill_levels) VALUES
('e1000001-0000-0000-0000-000000000001', 'Sarah Johnson', 'sarah.johnson@elc.co.id', '081234567890', 'TEACHER', 'ACTIVE', 'Surabaya', 'Jl. Raya Darmo 123', '10000001-0000-0000-0000-000000000001', NULL, '{"Grammar": "Advanced", "Speaking": "Advanced", "Writing": "Advanced", "Listening": "Advanced", "Reading": "Advanced"}'::jsonb),
('e1000002-0000-0000-0000-000000000002', 'James Williams', 'james.williams@elc.co.id', '081234567891', 'TEACHER', 'ACTIVE', 'Surabaya', 'Jl. Pemuda 456', '10000002-0000-0000-0000-000000000002', NULL, '{"Grammar": "Advanced", "Speaking": "Advanced", "Writing": "Upper-Intermediate", "Listening": "Advanced", "Reading": "Advanced"}'::jsonb),
('e1000003-0000-0000-0000-000000000003', 'Anita Wijaya', 'anita.wijaya@elc.co.id', '081234567892', 'TEACHER', 'ACTIVE', 'Surabaya', 'Jl. Tunjungan 789', '10000003-0000-0000-0000-000000000003', NULL, '{"Grammar": "Advanced", "Speaking": "Upper-Intermediate", "Writing": "Advanced", "Listening": "Upper-Intermediate", "Reading": "Advanced"}'::jsonb);

-- Students (using e2 prefix - valid hex)
INSERT INTO profiles (id, name, email, phone, role, status, branch, address, assigned_location_id, school_origin, skill_levels, needs_attention, teacher_notes) VALUES
-- SMA Petra Students
('e2000001-0000-0000-0000-000000000001', 'Budi Santoso', 'budi.santoso@gmail.com', '082111222333', 'STUDENT', 'ACTIVE', 'Surabaya', 'Jl. Manyar 10', '10000001-0000-0000-0000-000000000001', 'SMA Petra 1', '{"Grammar": "Intermediate", "Speaking": "Elementary", "Writing": "Intermediate", "Listening": "Intermediate", "Reading": "Upper-Intermediate"}'::jsonb, false, 'Shows great potential in reading comprehension'),
('e2000002-0000-0000-0000-000000000002', 'Siti Rahma', 'siti.rahma@gmail.com', '082111222334', 'STUDENT', 'ACTIVE', 'Surabaya', 'Jl. Dharmahusada 20', '10000001-0000-0000-0000-000000000001', 'SMA Petra 1', '{"Grammar": "Upper-Intermediate", "Speaking": "Intermediate", "Writing": "Upper-Intermediate", "Listening": "Intermediate", "Reading": "Upper-Intermediate"}'::jsonb, false, 'Excellent grammar skills'),
('e2000003-0000-0000-0000-000000000003', 'Ahmad Fauzi', 'ahmad.fauzi@gmail.com', '082111222335', 'STUDENT', 'ACTIVE', 'Surabaya', 'Jl. Rungkut 30', '10000001-0000-0000-0000-000000000001', 'SMA Petra 2', '{"Grammar": "Elementary", "Speaking": "Starter", "Writing": "Elementary", "Listening": "Elementary", "Reading": "Elementary"}'::jsonb, true, 'Needs more practice in speaking'),
-- SMA St. Louis Students
('e2000004-0000-0000-0000-000000000004', 'Maria Angelina', 'maria.angelina@gmail.com', '082111222336', 'STUDENT', 'ACTIVE', 'Surabaya', 'Jl. Kertajaya 40', '10000002-0000-0000-0000-000000000002', 'SMA St. Louis 1', '{"Grammar": "Advanced", "Speaking": "Upper-Intermediate", "Writing": "Advanced", "Listening": "Upper-Intermediate", "Reading": "Advanced"}'::jsonb, false, 'Top performer, preparing for IELTS'),
('e2000005-0000-0000-0000-000000000005', 'Kevin Hartono', 'kevin.hartono@gmail.com', '082111222337', 'STUDENT', 'ACTIVE', 'Surabaya', 'Jl. Mulyosari 50', '10000002-0000-0000-0000-000000000002', 'SMA St. Louis 1', '{"Grammar": "Intermediate", "Speaking": "Intermediate", "Writing": "Elementary", "Listening": "Intermediate", "Reading": "Intermediate"}'::jsonb, false, 'Consistent improvement'),
-- SMA Xaverius Students
('e2000006-0000-0000-0000-000000000006', 'Jessica Tanoto', 'jessica.tanoto@gmail.com', '082111222338', 'STUDENT', 'ACTIVE', 'Surabaya', 'Jl. Pakuwon 60', '10000003-0000-0000-0000-000000000003', 'SMA Xaverius 1', '{"Grammar": "Upper-Intermediate", "Speaking": "Advanced", "Writing": "Upper-Intermediate", "Listening": "Advanced", "Reading": "Upper-Intermediate"}'::jsonb, false, 'Excellent speaking skills'),
('e2000007-0000-0000-0000-000000000007', 'Daniel Wijaya', 'daniel.wijaya@gmail.com', '082111222339', 'STUDENT', 'ACTIVE', 'Surabaya', 'Jl. HR Muhammad 70', '10000003-0000-0000-0000-000000000003', 'SMA Xaverius 1', '{"Grammar": "Intermediate", "Speaking": "Intermediate", "Writing": "Intermediate", "Listening": "Elementary", "Reading": "Intermediate"}'::jsonb, true, 'Struggles with listening, needs audio practice'),
-- SMAK Gloria Students
('e2000008-0000-0000-0000-000000000008', 'Christina Lim', 'christina.lim@gmail.com', '082111222340', 'STUDENT', 'ACTIVE', 'Surabaya', 'Jl. Nginden 80', '10000001-0000-0000-0000-000000000001', 'SMAK Gloria 1', '{"Grammar": "Starter", "Speaking": "Starter", "Writing": "Starter", "Listening": "Starter", "Reading": "Elementary"}'::jsonb, true, 'New student, needs foundation building'),
('e2000009-0000-0000-0000-000000000009', 'Michael Susanto', 'michael.susanto@gmail.com', '082111222341', 'STUDENT', 'ACTIVE', 'Surabaya', 'Jl. Jemursari 90', '10000001-0000-0000-0000-000000000001', 'SMAK Gloria 1', '{"Grammar": "Elementary", "Speaking": "Elementary", "Writing": "Elementary", "Listening": "Elementary", "Reading": "Elementary"}'::jsonb, false, 'Making good progress'),
-- SMP Students
('e2000010-0000-0000-0000-000000000010', 'Rina Putri', 'rina.putri@gmail.com', '082111222342', 'STUDENT', 'ACTIVE', 'Surabaya', 'Jl. Gubeng 100', '10000002-0000-0000-0000-000000000002', 'SMP Negeri 1 Surabaya', '{"Grammar": "Elementary", "Speaking": "Elementary", "Writing": "Starter", "Listening": "Elementary", "Reading": "Elementary"}'::jsonb, false, 'Young learner, enthusiastic'),
('e2000011-0000-0000-0000-000000000011', 'Dimas Prasetyo', 'dimas.prasetyo@gmail.com', '082111222343', 'STUDENT', 'ACTIVE', 'Surabaya', 'Jl. Darmo Permai 110', '10000002-0000-0000-0000-000000000002', 'SMP Negeri 1 Surabaya', '{"Grammar": "Intermediate", "Speaking": "Elementary", "Writing": "Elementary", "Listening": "Intermediate", "Reading": "Intermediate"}'::jsonb, false, 'Good comprehension skills'),
('e2000012-0000-0000-0000-000000000012', 'Amanda Setiawan', 'amanda.setiawan@gmail.com', '082111222344', 'STUDENT', 'ACTIVE', 'Surabaya', 'Jl. Basuki Rahmat 120', '10000003-0000-0000-0000-000000000003', 'SMP Cita Hati', '{"Grammar": "Upper-Intermediate", "Speaking": "Intermediate", "Writing": "Intermediate", "Listening": "Intermediate", "Reading": "Upper-Intermediate"}'::jsonb, false, 'Advanced for age group');

-- Admin user (using e3 prefix - valid hex)
INSERT INTO profiles (id, name, email, phone, role, status, branch, address) VALUES
('e3000001-0000-0000-0000-000000000001', 'Super Admin', 'admin@elc.co.id', '081000000001', 'ADMIN', 'ACTIVE', 'Surabaya', 'ELC Head Office');


-- =====================================================
-- 13. CLASS SESSIONS (Scheduled classes)
-- =====================================================

INSERT INTO class_sessions (id, teacher_id, topic, description, date_time, location, skill_category, difficulty_level, materials, location_id) VALUES
-- Past sessions (for grade history)
('c0000001-0000-0000-0000-000000000001', 'e1000001-0000-0000-0000-000000000001', 'Present Perfect Tense', 'Understanding when to use present perfect vs simple past', '2025-01-06 09:00:00+07', 'ELC Surabaya - Pakuwon Mall', 'Grammar', 'Intermediate', ARRAY['Tense Comparison Chart.pdf'], '10000001-0000-0000-0000-000000000001'),
('c0000002-0000-0000-0000-000000000002', 'e1000001-0000-0000-0000-000000000001', 'Business Email Writing', 'Professional email etiquette and formats', '2025-01-06 14:00:00+07', 'ELC Surabaya - Pakuwon Mall', 'Writing', 'Upper-Intermediate', ARRAY['Email Templates.pdf', 'Common Phrases.pdf'], '10000001-0000-0000-0000-000000000001'),
('c0000003-0000-0000-0000-000000000003', 'e1000002-0000-0000-0000-000000000002', 'Conversation Practice: Daily Life', 'Everyday conversations and small talk', '2025-01-07 10:00:00+07', 'ELC Surabaya - Galaxy Mall', 'Speaking', 'Elementary', ARRAY['Conversation Topics.pdf'], '10000002-0000-0000-0000-000000000002'),
('c0000004-0000-0000-0000-000000000004', 'e1000002-0000-0000-0000-000000000002', 'IELTS Reading Strategies', 'Techniques for skimming and scanning', '2025-01-07 14:00:00+07', 'ELC Surabaya - Galaxy Mall', 'Reading', 'Advanced', ARRAY['IELTS Reading Tips.pdf', 'Sample Passages.pdf'], '10000002-0000-0000-0000-000000000002'),
('c0000005-0000-0000-0000-000000000005', 'e1000003-0000-0000-0000-000000000003', 'Listening Comprehension: News', 'Understanding English news broadcasts', '2025-01-08 09:00:00+07', 'ELC Surabaya - Ciputra World', 'Listening', 'Intermediate', ARRAY['News Vocabulary.pdf'], '10000003-0000-0000-0000-000000000003'),
('c0000006-0000-0000-0000-000000000006', 'e1000003-0000-0000-0000-000000000003', 'Vocabulary Building: Academic', 'Essential academic vocabulary', '2025-01-08 14:00:00+07', 'ELC Surabaya - Ciputra World', 'Vocabulary', 'Upper-Intermediate', ARRAY['Academic Word List.pdf'], '10000003-0000-0000-0000-000000000003'),
('c0000007-0000-0000-0000-000000000007', 'e1000001-0000-0000-0000-000000000001', 'Conditional Sentences', 'All types of if-clauses', '2025-01-09 09:00:00+07', 'ELC Surabaya - Pakuwon Mall', 'Grammar', 'Advanced', ARRAY['Conditionals Worksheet.pdf'], '10000001-0000-0000-0000-000000000001'),
('c0000008-0000-0000-0000-000000000008', 'e1000001-0000-0000-0000-000000000001', 'Essay Writing Structure', 'Introduction, body, and conclusion', '2025-01-09 14:00:00+07', 'ELC Surabaya - Pakuwon Mall', 'Writing', 'Intermediate', ARRAY['Essay Template.pdf'], '10000001-0000-0000-0000-000000000001'),
-- Future sessions
('c0000009-0000-0000-0000-000000000009', 'e1000002-0000-0000-0000-000000000002', 'Public Speaking Basics', 'Confidence building for presentations', '2025-01-15 10:00:00+07', 'ELC Surabaya - Galaxy Mall', 'Speaking', 'Intermediate', ARRAY['Presentation Tips.pdf'], '10000002-0000-0000-0000-000000000002'),
('c0000010-0000-0000-0000-000000000010', 'e1000003-0000-0000-0000-000000000003', 'TOEFL Listening Practice', 'TOEFL-style listening exercises', '2025-01-16 09:00:00+07', 'ELC Surabaya - Ciputra World', 'Listening', 'Upper-Intermediate', ARRAY['TOEFL Audio Scripts.pdf'], '10000003-0000-0000-0000-000000000003');


-- =====================================================
-- 14. SESSION REPORTS (Student grades per session)
-- =====================================================

INSERT INTO session_reports (id, session_id, student_id, student_name, attendance_status, written_score, oral_score, cefr_level, teacher_notes) VALUES
-- Session 1: Present Perfect Tense (Grammar - Intermediate)
('e4000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'e2000001-0000-0000-0000-000000000001', 'Budi Santoso', 'PRESENT', 75, 70, 'B1', 'Good understanding of concept'),
('e4000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'e2000002-0000-0000-0000-000000000002', 'Siti Rahma', 'PRESENT', 88, 82, 'B2', 'Excellent performance'),
('e4000003-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 'e2000005-0000-0000-0000-000000000005', 'Kevin Hartono', 'PRESENT', 72, 68, 'B1', 'Needs more practice with irregular verbs'),
('e4000004-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000001', 'e2000009-0000-0000-0000-000000000009', 'Michael Susanto', 'LATE', 65, 60, 'A2', 'Late arrival, caught up well'),

-- Session 2: Business Email Writing (Writing - Upper-Intermediate)
('e4000005-0000-0000-0000-000000000005', 'c0000002-0000-0000-0000-000000000002', 'e2000002-0000-0000-0000-000000000002', 'Siti Rahma', 'PRESENT', 90, 85, 'B2', 'Professional writing style'),
('e4000006-0000-0000-0000-000000000006', 'c0000002-0000-0000-0000-000000000002', 'e2000004-0000-0000-0000-000000000004', 'Maria Angelina', 'PRESENT', 95, 92, 'C1', 'Outstanding email composition'),
('e4000007-0000-0000-0000-000000000007', 'c0000002-0000-0000-0000-000000000002', 'e2000006-0000-0000-0000-000000000006', 'Jessica Tanoto', 'PRESENT', 85, 88, 'B2', 'Good structure, minor grammar errors'),

-- Session 3: Conversation Practice (Speaking - Elementary)
('e4000008-0000-0000-0000-000000000008', 'c0000003-0000-0000-0000-000000000003', 'e2000003-0000-0000-0000-000000000003', 'Ahmad Fauzi', 'PRESENT', 55, 50, 'A1', 'Improving slowly, needs encouragement'),
('e4000009-0000-0000-0000-000000000009', 'c0000003-0000-0000-0000-000000000003', 'e2000008-0000-0000-0000-000000000008', 'Christina Lim', 'PRESENT', 58, 52, 'A1', 'Building basic vocabulary'),
('e4000010-0000-0000-0000-000000000010', 'c0000003-0000-0000-0000-000000000003', 'e2000010-0000-0000-0000-000000000010', 'Rina Putri', 'PRESENT', 62, 65, 'A2', 'Enthusiastic participant'),
('e4000011-0000-0000-0000-000000000011', 'c0000003-0000-0000-0000-000000000003', 'e2000011-0000-0000-0000-000000000011', 'Dimas Prasetyo', 'ABSENT', NULL, NULL, NULL, 'Absent - sick'),

-- Session 4: IELTS Reading Strategies (Reading - Advanced)
('e4000012-0000-0000-0000-000000000012', 'c0000004-0000-0000-0000-000000000004', 'e2000004-0000-0000-0000-000000000004', 'Maria Angelina', 'PRESENT', 92, 88, 'C1', 'Ready for IELTS exam'),
('e4000013-0000-0000-0000-000000000013', 'c0000004-0000-0000-0000-000000000004', 'e2000006-0000-0000-0000-000000000006', 'Jessica Tanoto', 'PRESENT', 85, 80, 'B2', 'Good progress in scanning techniques'),

-- Session 5: Listening Comprehension (Listening - Intermediate)
('e4000014-0000-0000-0000-000000000014', 'c0000005-0000-0000-0000-000000000005', 'e2000001-0000-0000-0000-000000000001', 'Budi Santoso', 'PRESENT', 78, 72, 'B1', 'Improved comprehension'),
('e4000015-0000-0000-0000-000000000015', 'c0000005-0000-0000-0000-000000000005', 'e2000005-0000-0000-0000-000000000005', 'Kevin Hartono', 'PRESENT', 70, 65, 'B1', 'Struggles with fast speech'),
('e4000016-0000-0000-0000-000000000016', 'c0000005-0000-0000-0000-000000000005', 'e2000007-0000-0000-0000-000000000007', 'Daniel Wijaya', 'PRESENT', 62, 58, 'A2', 'Needs more audio practice'),
('e4000017-0000-0000-0000-000000000017', 'c0000005-0000-0000-0000-000000000005', 'e2000012-0000-0000-0000-000000000012', 'Amanda Setiawan', 'PRESENT', 82, 78, 'B2', 'Excellent note-taking skills'),

-- Session 6: Vocabulary Building (Vocabulary - Upper-Intermediate)
('e4000018-0000-0000-0000-000000000018', 'c0000006-0000-0000-0000-000000000006', 'e2000002-0000-0000-0000-000000000002', 'Siti Rahma', 'PRESENT', 88, 85, 'B2', 'Strong vocabulary retention'),
('e4000019-0000-0000-0000-000000000019', 'c0000006-0000-0000-0000-000000000006', 'e2000004-0000-0000-0000-000000000004', 'Maria Angelina', 'PRESENT', 90, 88, 'C1', 'Excellent academic vocabulary'),
('e4000020-0000-0000-0000-000000000020', 'c0000006-0000-0000-0000-000000000006', 'e2000006-0000-0000-0000-000000000006', 'Jessica Tanoto', 'LATE', 82, 80, 'B2', 'Late but participated well'),

-- Session 7: Conditional Sentences (Grammar - Advanced)
('e4000021-0000-0000-0000-000000000021', 'c0000007-0000-0000-0000-000000000007', 'e2000004-0000-0000-0000-000000000004', 'Maria Angelina', 'PRESENT', 88, 85, 'C1', 'Mastered all conditional types'),
('e4000022-0000-0000-0000-000000000022', 'c0000007-0000-0000-0000-000000000007', 'e2000002-0000-0000-0000-000000000002', 'Siti Rahma', 'PRESENT', 85, 80, 'B2', 'Good understanding of mixed conditionals'),
('e4000023-0000-0000-0000-000000000023', 'c0000007-0000-0000-0000-000000000007', 'e2000006-0000-0000-0000-000000000006', 'Jessica Tanoto', 'PRESENT', 82, 78, 'B2', 'Needs practice with 3rd conditional'),

-- Session 8: Essay Writing Structure (Writing - Intermediate)
('e4000024-0000-0000-0000-000000000024', 'c0000008-0000-0000-0000-000000000008', 'e2000001-0000-0000-0000-000000000001', 'Budi Santoso', 'PRESENT', 72, 68, 'B1', 'Good paragraph structure'),
('e4000025-0000-0000-0000-000000000025', 'c0000008-0000-0000-0000-000000000008', 'e2000005-0000-0000-0000-000000000005', 'Kevin Hartono', 'PRESENT', 68, 65, 'B1', 'Needs work on thesis statements'),
('e4000026-0000-0000-0000-000000000026', 'c0000008-0000-0000-0000-000000000008', 'e2000007-0000-0000-0000-000000000007', 'Daniel Wijaya', 'PRESENT', 70, 68, 'B1', 'Improving essay organization'),
('e4000027-0000-0000-0000-000000000027', 'c0000008-0000-0000-0000-000000000008', 'e2000009-0000-0000-0000-000000000009', 'Michael Susanto', 'PRESENT', 62, 60, 'A2', 'Basic structure understood'),
('e4000028-0000-0000-0000-000000000028', 'c0000008-0000-0000-0000-000000000008', 'e2000012-0000-0000-0000-000000000012', 'Amanda Setiawan', 'PRESENT', 80, 75, 'B2', 'Well-structured essays');


-- =====================================================
-- 15. RE-ENABLE FOREIGN KEY CONSTRAINTS
-- =====================================================
-- Reset session_replication_role to re-enable FK checks
SET session_replication_role = 'origin';


-- =====================================================
-- DONE! Sample data has been inserted successfully.
-- =====================================================
--
-- SUMMARY OF SAMPLE DATA:
-- - 3 Teachers (Sarah Johnson, James Williams, Anita Wijaya)
-- - 12 Students (from 6 different schools)
-- - 1 Admin
-- - 10 Class Sessions (8 completed, 2 upcoming)
-- - 28 Session Reports with grades
--
-- Schools represented:
-- - SMA Petra 1 & 2 (3 students)
-- - SMA St. Louis 1 (2 students)
-- - SMA Xaverius 1 (2 students)
-- - SMAK Gloria 1 (2 students)
-- - SMP Negeri 1 Surabaya (2 students)
-- - SMP Cita Hati (1 student)
--
-- This script is IDEMPOTENT - safe to run multiple times!
-- =====================================================
