USE AI_Driven_SMart_LMS;
SET FOREIGN_KEY_CHECKS = 0;

USE AI_Driven_Smart_LMS;

INSERT INTO departments (id, name, code, description, head_of_department) VALUES
(1, 'Information Technology', 'IT', 'Department of Information Technology', NULL),
(2, 'Computer Science', 'CS', 'Department of Computer Science', NULL),
(3, 'Business Administration', 'BBA', 'Department of Business Administration', NULL),
(4, 'Mathematics', 'MATH', 'Department of Mathematics', NULL);
-- =====================================================
-- SEED 02: PROGRAMS
-- =====================================================
USE AI_Driven_Smart_LMS;

INSERT INTO programs (id, name, code, department_id, duration_years, total_credit_hours, degree_type) VALUES
(1, 'Bachelor of Science in Information Technology', 'BSIT', 1, 4, 130, 'BS'),
(2, 'Bachelor of Science in Computer Science',       'BSCS', 2, 4, 130, 'BS'),
(3, 'Bachelor of Business Administration',           'BBA',  3, 4, 120, 'BBA'),
(4, 'Associate Degree in Information Technology',    'ADIT', 1, 2, 66,  'AD');
-- =====================================================
-- SEED 03: SEMESTERS
-- =====================================================
USE AI_Driven_Smart_LMS;

INSERT INTO semesters (id, name, code, start_date, end_date, is_active, registration_start, registration_end, add_drop_last_date) VALUES
(1, 'Fall 2023',   'FALL-2023',   '2023-09-01', '2024-01-31', FALSE, '2023-08-15', '2023-09-10', '2023-09-20'),
(2, 'Spring 2024', 'SPRING-2024', '2024-02-01', '2024-06-30', FALSE, '2024-01-15', '2024-02-10', '2024-02-20'),
(3, 'Fall 2024',   'FALL-2024',   '2024-09-01', '2025-01-31', FALSE, '2024-08-15', '2024-09-10', '2024-09-20'),
(4, 'Spring 2025', 'SPRING-2025', '2025-02-01', '2025-06-30', TRUE,  '2025-01-15', '2025-02-10', '2025-02-20');
-- =====================================================
-- SEED 04: COURSES
-- =====================================================
USE AI_Driven_Smart_LMS;

INSERT INTO courses (id, code, name, credit_hours, lecture_hours, lab_hours, description, department_id, program_id, semester_level, is_elective) VALUES
-- BSIT Courses
(1,  'IT-101', 'Introduction to Computing',          3, 3, 0, 'Basic computing concepts',              1, 1, 1, FALSE),
(2,  'IT-102', 'Programming Fundamentals',           3, 2, 2, 'Introduction to programming with C++',  1, 1, 1, FALSE),
(3,  'IT-103', 'Calculus and Analytical Geometry',   3, 3, 0, 'Mathematical foundations',              4, 1, 1, FALSE),
(4,  'IT-201', 'Object Oriented Programming',        3, 2, 2, 'OOP concepts using Java',               1, 1, 2, FALSE),
(5,  'IT-202', 'Data Structures and Algorithms',     3, 2, 2, 'Core data structures',                  1, 1, 2, FALSE),
(6,  'IT-203', 'Database Systems',                   3, 2, 2, 'Relational database design and SQL',    1, 1, 3, FALSE),
(7,  'IT-301', 'Web Technologies',                   3, 2, 2, 'HTML, CSS, JavaScript, PHP',            1, 1, 3, FALSE),
(8,  'IT-302', 'Computer Networks',                  3, 3, 0, 'Networking fundamentals',               1, 1, 4, FALSE),
(9,  'IT-303', 'Software Engineering',               3, 3, 0, 'SDLC and software processes',           1, 1, 4, FALSE),
(10, 'IT-401', 'Artificial Intelligence',            3, 3, 0, 'AI fundamentals and applications',      1, 1, 5, FALSE),
(11, 'IT-402', 'Machine Learning',                   3, 2, 2, 'ML algorithms and implementation',      1, 1, 6, TRUE),
(12, 'IT-403', 'Final Year Project I',               3, 0, 6, 'Capstone project part 1',               1, 1, 7, FALSE),

-- BSCS Courses
(13, 'CS-101', 'Programming in C',                   3, 2, 2, 'C programming language',                2, 2, 1, FALSE),
(14, 'CS-201', 'Discrete Mathematics',               3, 3, 0, 'Logic and discrete structures',         4, 2, 2, FALSE),
(15, 'CS-301', 'Operating Systems',                  3, 3, 0, 'OS concepts and design',                2, 2, 3, FALSE),

-- BBA Courses
(16, 'BBA-101', 'Principles of Management',          3, 3, 0, 'Management fundamentals',               3, 3, 1, FALSE),
(17, 'BBA-201', 'Financial Accounting',              3, 3, 0, 'Basic accounting principles',           3, 3, 2, FALSE);

-- ── CLOs for IT-101 ──────────────────────────────────
INSERT INTO course_clos (course_id, clo_number, description, domain, level) VALUES
(1, 'CLO-1', 'Understand basic computing concepts',         'Cognitive', 'Knowledge'),
(1, 'CLO-2', 'Identify hardware and software components',   'Cognitive', 'Comprehension'),
(1, 'CLO-3', 'Use basic office productivity tools',         'Psychomotor', 'Application');

-- ── CLOs for IT-102 ──────────────────────────────────
INSERT INTO course_clos (course_id, clo_number, description, domain, level) VALUES
(2, 'CLO-1', 'Write basic programs in C++',                 'Psychomotor', 'Application'),
(2, 'CLO-2', 'Apply control structures and loops',          'Cognitive', 'Application'),
(2, 'CLO-3', 'Implement functions and arrays',              'Psychomotor', 'Application');
-- =====================================================
-- SEED 05: ADMIN USERS
-- Password for all: Admin@123
-- bcrypt hash of "Admin@123"
-- =====================================================
USE AI_Driven_Smart_LMS;

INSERT INTO users (id, roll_number, email, password_hash, role, is_active) VALUES
(1, NULL, 'admin@bzu.edu.pk',
 '$2b$12$.B0JSpE.0aluBkNcCgcGQOzm2S6tC5hrFQKBfQfcy/RRx/6RBTEuq',
 'admin', TRUE),

(2, NULL, 'security@bzu.edu.pk',
 '$2b$12$.B0JSpE.0aluBkNcCgcGQOzm2S6tC5hrFQKBfQfcy/RRx/6RBTEuq',
 'admin', TRUE),

(3, NULL, 'gate.operator@bzu.edu.pk',
 '$2b$12$.B0JSpE.0aluBkNcCgcGQOzm2S6tC5hrFQKBfQfcy/RRx/6RBTEuq',
 'admin', TRUE);

INSERT INTO admin_profiles (user_id, employee_id, full_name, designation, phone, email_official, role_type) VALUES
(1, 'EMP-001', 'Muhammad Sarfraz',    'System Administrator', '0300-1234567', 'admin@bzu.edu.pk',        'admin'),
(2, 'EMP-002', 'Ahmad Security',      'Security Admin',       '0300-2345678', 'security@bzu.edu.pk',     'security_admin'),
(3, 'EMP-003', 'Ali Gate Operator',   'Gate Operator',        '0300-3456789', 'gate.operator@bzu.edu.pk','gate_operator');
-- =====================================================
-- SEED 06: TEACHERS
-- Password for all: Teacher@123
-- bcrypt hash of "Teacher@123"
-- =====================================================
USE AI_Driven_Smart_LMS;

INSERT INTO users (id, roll_number, email, password_hash, role, is_active) VALUES
(4, NULL, 'dr.kamran@bzu.edu.pk',
 '$2b$12$qz6Q0HsJOSUvj2qXLqcVSu0wsHvej5zn78/22BOXMgm2lMMXYgDx6',
 'teacher', TRUE),

(5, NULL, 'ms.ayesha@bzu.edu.pk',
 '$2b$12$qz6Q0HsJOSUvj2qXLqcVSu0wsHvej5zn78/22BOXMgm2lMMXYgDx6',
 'teacher', TRUE),

(6, NULL, 'mr.hassan@bzu.edu.pk',
 '$2b$12$qz6Q0HsJOSUvj2qXLqcVSu0wsHvej5zn78/22BOXMgm2lMMXYgDx6',
 'teacher', TRUE),

(7, NULL, 'dr.fatima@bzu.edu.pk',
 '$2b$12$qz6Q0HsJOSUvj2qXLqcVSu0wsHvej5zn78/22BOXMgm2lMMXYgDx6',
 'teacher', TRUE),

(8, NULL, 'mr.usman@bzu.edu.pk',
 '$2b$12$qz6Q0HsJOSUvj2qXLqcVSu0wsHvej5zn78/22BOXMgm2lMMXYgDx6',
 'teacher', TRUE);

INSERT INTO teacher_profiles (user_id, employee_id, full_name, designation, qualification, specialization, joining_date, phone, email, cnic) VALUES
(4, 'TCH-001', 'Dr. Kamran Mehmood',  'Associate Professor', 'PhD Computer Science',   'Artificial Intelligence, Machine Learning', '2015-08-01', '0301-1111111', 'dr.kamran@bzu.edu.pk',  '36302-1111111-1'),
(5, 'TCH-002', 'Ms. Ayesha Siddiqui', 'Lecturer',            'MS Information Technology', 'Web Development, Databases',             '2019-02-01', '0301-2222222', 'ms.ayesha@bzu.edu.pk',  '36302-2222222-2'),
(6, 'TCH-003', 'Mr. Hassan Raza',     'Lecturer',            'MS Computer Science',    'Programming, Data Structures',              '2020-09-01', '0301-3333333', 'mr.hassan@bzu.edu.pk',  '36302-3333333-3'),
(7, 'TCH-004', 'Dr. Fatima Malik',    'Assistant Professor', 'PhD Mathematics',        'Applied Mathematics, Statistics',           '2017-03-01', '0301-4444444', 'dr.fatima@bzu.edu.pk',  '36302-4444444-4'),
(8, 'TCH-005', 'Mr. Usman Tariq',     'Lecturer',            'MS Software Engineering','Software Engineering, Testing',             '2021-09-01', '0301-5555555', 'mr.usman@bzu.edu.pk',   '36302-5555555-5');

-- Update Department HODs
UPDATE departments SET head_of_department = 4 WHERE id = 1;
UPDATE departments SET head_of_department = 4 WHERE id = 2;
UPDATE departments SET head_of_department = 7 WHERE id = 4;
-- =====================================================
-- SEED 07: STUDENTS
-- Password for all: Student@123
-- bcrypt hash of "Student@123"
-- =====================================================
USE AI_Driven_Smart_LMS;

INSERT INTO users (id, roll_number, email, password_hash, role, is_active) VALUES
-- BSIT 2021 Batch
(9,  'BSIT-21-01', 'ali.hassan@student.bzu.edu.pk',      '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(10, 'BSIT-21-02', 'sara.ahmed@student.bzu.edu.pk',      '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(11, 'BSIT-21-03', 'usman.malik@student.bzu.edu.pk',     '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(12, 'BSIT-21-04', 'fatima.khan@student.bzu.edu.pk',     '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(13, 'BSIT-21-05', 'bilal.qureshi@student.bzu.edu.pk',   '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(14, 'BSIT-21-06', 'zara.butt@student.bzu.edu.pk',       '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(15, 'BSIT-21-07', 'hamza.riaz@student.bzu.edu.pk',      '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(16, 'BSIT-21-08', 'nadia.iqbal@student.bzu.edu.pk',     '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(17, 'BSIT-21-09', 'tariq.mehmood@student.bzu.edu.pk',   '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(18, 'BSIT-21-10', 'amna.farooq@student.bzu.edu.pk',     '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),

-- BSIT 2022 Batch
(19, 'BSIT-22-01', 'omar.sheikh@student.bzu.edu.pk',     '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(20, 'BSIT-22-02', 'hina.nawaz@student.bzu.edu.pk',      '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(21, 'BSIT-22-03', 'asad.ali@student.bzu.edu.pk',        '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(22, 'BSIT-22-04', 'sana.rehman@student.bzu.edu.pk',     '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(23, 'BSIT-22-05', 'danish.siddiqui@student.bzu.edu.pk', '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),

-- BSCS Batch
(24, 'BSCS-21-01', 'raheel.aslam@student.bzu.edu.pk',    '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE),
(25, 'BSCS-21-02', 'mehwish.javed@student.bzu.edu.pk',   '$2b$12$oE61qDe.Wt/p3M6F4pNRweoYqJsBltm2TDYNF7201ORC4QbbQAFva', 'student', TRUE);

INSERT INTO student_profiles
  (user_id, registration_number, full_name, father_name, date_of_birth, gender, cnic, phone, current_address, city, guardian_phone, guardian_relation)
VALUES
(9,  'BZU-IT-2021-001', 'Ali Hassan',         'Hassan Ali',         '2003-03-15', 'male',   '36302-0000001-1', '0311-1000001', 'Street 1, Multan',      'Multan',     '0311-9000001', 'Father'),
(10, 'BZU-IT-2021-002', 'Sara Ahmed',         'Ahmed Ali',          '2003-05-20', 'female', '36302-0000002-2', '0311-1000002', 'Street 2, Multan',      'Multan',     '0311-9000002', 'Father'),
(11, 'BZU-IT-2021-003', 'Usman Malik',        'Malik Usman',        '2002-11-10', 'male',   '36302-0000003-3', '0311-1000003', 'Street 3, Multan',      'Multan',     '0311-9000003', 'Father'),
(12, 'BZU-IT-2021-004', 'Fatima Khan',        'Khan Sahib',         '2003-07-25', 'female', '36302-0000004-4', '0311-1000004', 'Street 4, Lahore',      'Lahore',     '0311-9000004', 'Father'),
(13, 'BZU-IT-2021-005', 'Bilal Qureshi',      'Qureshi Sahib',      '2002-09-05', 'male',   '36302-0000005-5', '0311-1000005', 'Street 5, Multan',      'Multan',     '0311-9000005', 'Father'),
(14, 'BZU-IT-2021-006', 'Zara Butt',          'Butt Sahib',         '2003-01-18', 'female', '36302-0000006-6', '0311-1000006', 'Street 6, Sahiwal',     'Sahiwal',    '0311-9000006', 'Father'),
(15, 'BZU-IT-2021-007', 'Hamza Riaz',         'Riaz Ahmed',         '2003-06-30', 'male',   '36302-0000007-7', '0311-1000007', 'Street 7, Multan',      'Multan',     '0311-9000007', 'Father'),
(16, 'BZU-IT-2021-008', 'Nadia Iqbal',        'Iqbal Sahib',        '2002-12-12', 'female', '36302-0000008-8', '0311-1000008', 'Street 8, Bahawalpur',  'Bahawalpur', '0311-9000008', 'Father'),
(17, 'BZU-IT-2021-009', 'Tariq Mehmood',      'Mehmood Sahib',      '2003-04-22', 'male',   '36302-0000009-9', '0311-1000009', 'Street 9, Multan',      'Multan',     '0311-9000009', 'Father'),
(18, 'BZU-IT-2021-010', 'Amna Farooq',        'Farooq Ahmed',       '2003-08-14', 'female', '36302-0000010-0', '0311-1000010', 'Street 10, Vehari',     'Vehari',     '0311-9000010', 'Father'),
(19, 'BZU-IT-2022-001', 'Omar Sheikh',        'Sheikh Rashid',      '2004-02-28', 'male',   '36302-0000011-1', '0311-1000011', 'Street 11, Multan',     'Multan',     '0311-9000011', 'Father'),
(20, 'BZU-IT-2022-002', 'Hina Nawaz',         'Nawaz Sahib',        '2004-07-15', 'female', '36302-0000012-2', '0311-1000012', 'Street 12, Multan',     'Multan',     '0311-9000012', 'Father'),
(21, 'BZU-IT-2022-003', 'Asad Ali',           'Ali Khan',           '2004-03-10', 'male',   '36302-0000013-3', '0311-1000013', 'Street 13, Khanewal',   'Khanewal',   '0311-9000013', 'Father'),
(22, 'BZU-IT-2022-004', 'Sana Rehman',        'Rehman Sahib',       '2004-09-05', 'female', '36302-0000014-4', '0311-1000014', 'Street 14, Multan',     'Multan',     '0311-9000014', 'Father'),
(23, 'BZU-IT-2022-005', 'Danish Siddiqui',    'Siddiqui Sahib',     '2004-11-20', 'male',   '36302-0000015-5', '0311-1000015', 'Street 15, Lodhran',    'Lodhran',    '0311-9000015', 'Father'),
(24, 'BZU-CS-2021-001', 'Raheel Aslam',       'Aslam Sahib',        '2003-05-18', 'male',   '36302-0000016-6', '0311-1000016', 'Street 16, Multan',     'Multan',     '0311-9000016', 'Father'),
(25, 'BZU-CS-2021-002', 'Mehwish Javed',      'Javed Sahib',        '2003-10-25', 'female', '36302-0000017-7', '0311-1000017', 'Street 17, Multan',     'Multan',     '0311-9000017', 'Father');
-- =====================================================
-- SEED 08: STUDENT PROGRAM ENROLLMENTS
-- =====================================================
USE AI_Driven_Smart_LMS;

INSERT INTO student_program_enrollment
  (student_id, program_id, batch_year, enrollment_semester_id, current_semester, status, advisor_id, enrollment_date, expected_graduation)
VALUES
-- BSIT 2021 Batch → Semester 8 (Final Year)
(9,  1, 2021, 1, 8, 'active', 4, '2021-09-01', '2025-06-30'),
(10, 1, 2021, 1, 8, 'active', 4, '2021-09-01', '2025-06-30'),
(11, 1, 2021, 1, 8, 'active', 5, '2021-09-01', '2025-06-30'),
(12, 1, 2021, 1, 8, 'active', 5, '2021-09-01', '2025-06-30'),
(13, 1, 2021, 1, 7, 'active', 4, '2021-09-01', '2025-06-30'),
(14, 1, 2021, 1, 7, 'active', 4, '2021-09-01', '2025-06-30'),
(15, 1, 2021, 1, 8, 'active', 6, '2021-09-01', '2025-06-30'),
(16, 1, 2021, 1, 8, 'active', 6, '2021-09-01', '2025-06-30'),
(17, 1, 2021, 1, 7, 'active', 5, '2021-09-01', '2025-06-30'),
(18, 1, 2021, 1, 8, 'active', 5, '2021-09-01', '2025-06-30'),

-- BSIT 2022 Batch → Semester 6
(19, 1, 2022, 2, 6, 'active', 4, '2022-09-01', '2026-06-30'),
(20, 1, 2022, 2, 6, 'active', 4, '2022-09-01', '2026-06-30'),
(21, 1, 2022, 2, 6, 'active', 5, '2022-09-01', '2026-06-30'),
(22, 1, 2022, 2, 6, 'active', 5, '2022-09-01', '2026-06-30'),
(23, 1, 2022, 2, 6, 'active', 6, '2022-09-01', '2026-06-30'),

-- BSCS 2021 Batch
(24, 2, 2021, 1, 8, 'active', 4, '2021-09-01', '2025-06-30'),
(25, 2, 2021, 1, 8, 'active', 4, '2021-09-01', '2025-06-30');
-- =====================================================
-- SEED 09: COURSE OFFERINGS + ENROLLMENTS
-- =====================================================
USE AI_Driven_Smart_LMS;

-- ── Course Offerings (Spring 2025 = semester_id 4) ──
INSERT INTO course_offerings
  (id, course_id, semester_id, instructor_id, section, max_students, enrolled_students, room_number, schedule_json, is_active)
VALUES
(1,  7,  4, 5, 'A', 40, 10, 'IT-101', '[{"day":"monday","start_time":"08:00","end_time":"09:30"},{"day":"wednesday","start_time":"08:00","end_time":"09:30"}]', TRUE),
(2,  8,  4, 6, 'A', 40, 10, 'IT-102', '[{"day":"tuesday","start_time":"10:00","end_time":"11:30"},{"day":"thursday","start_time":"10:00","end_time":"11:30"}]', TRUE),
(3,  9,  4, 8, 'A', 40, 5,  'IT-103', '[{"day":"monday","start_time":"11:00","end_time":"12:30"},{"day":"friday","start_time":"11:00","end_time":"12:30"}]',   TRUE),
(4,  10, 4, 4, 'A', 30, 5,  'IT-201', '[{"day":"wednesday","start_time":"02:00","end_time":"03:30"},{"day":"friday","start_time":"02:00","end_time":"03:30"}]', TRUE),
(5,  5,  4, 6, 'B', 40, 5,  'IT-104', '[{"day":"tuesday","start_time":"08:00","end_time":"09:30"},{"day":"thursday","start_time":"08:00","end_time":"09:30"}]', TRUE);


-- ── Course Enrollments ───────────────────────────────
-- Offering 1 (Web Technologies) - BSIT 2022 students
INSERT INTO enrollments (student_id, offering_id, status, is_approved, advisor_approval_requested) VALUES
(19, 1, 'enrolled', TRUE,  TRUE),
(20, 1, 'enrolled', TRUE,  TRUE),
(21, 1, 'enrolled', TRUE,  TRUE),
(22, 1, 'enrolled', TRUE,  TRUE),
(23, 1, 'enrolled', TRUE,  TRUE),
-- BSIT 2021 some students
(9,  1, 'enrolled', TRUE,  TRUE),
(10, 1, 'enrolled', TRUE,  TRUE),
(11, 1, 'enrolled', TRUE,  TRUE),
(12, 1, 'enrolled', TRUE,  TRUE),
(13, 1, 'enrolled', TRUE,  TRUE);

-- Offering 2 (Computer Networks) - BSIT students
INSERT INTO enrollments (student_id, offering_id, status, is_approved, advisor_approval_requested) VALUES
(9,  2, 'enrolled', TRUE, TRUE),
(10, 2, 'enrolled', TRUE, TRUE),
(11, 2, 'enrolled', TRUE, TRUE),
(14, 2, 'enrolled', TRUE, TRUE),
(15, 2, 'enrolled', TRUE, TRUE),
(16, 2, 'enrolled', TRUE, TRUE),
(17, 2, 'enrolled', TRUE, TRUE),
(18, 2, 'enrolled', TRUE, TRUE),
(19, 2, 'enrolled', TRUE, TRUE),
(20, 2, 'enrolled', TRUE, TRUE);

-- Offering 3 (Software Engineering) - Mixed
INSERT INTO enrollments (student_id, offering_id, status, is_approved, advisor_approval_requested) VALUES
(9,  3, 'enrolled', TRUE, TRUE),
(10, 3, 'enrolled', TRUE, TRUE),
(13, 3, 'enrolled', TRUE, TRUE),
(14, 3, 'enrolled', TRUE, TRUE),
(15, 3, 'enrolled', TRUE, TRUE);

-- Offering 4 (Artificial Intelligence) - Final Year
INSERT INTO enrollments (student_id, offering_id, status, is_approved, advisor_approval_requested) VALUES
(9,  4, 'enrolled', TRUE, TRUE),
(11, 4, 'enrolled', TRUE, TRUE),
(15, 4, 'enrolled', TRUE, TRUE),
(18, 4, 'enrolled', TRUE, TRUE),
(24, 4, 'enrolled', TRUE, TRUE);
-- =====================================================
-- SEED 10: LECTURE SESSIONS + ATTENDANCE
-- =====================================================
USE AI_Driven_Smart_LMS;

-- ── Lecture Sessions (Offering 1 - Web Technologies) ─
INSERT INTO lecture_sessions
  (id, offering_id, session_date, start_time, end_time, topic, session_type, attendance_marked, marked_by, marked_at)
VALUES
(1,  1, '2025-02-03', '08:00', '09:30', 'Introduction to Web Technologies', 'lecture', TRUE, 5, '2025-02-03 09:35:00'),
(2,  1, '2025-02-05', '08:00', '09:30', 'HTML Basics',                      'lecture', TRUE, 5, '2025-02-05 09:35:00'),
(3,  1, '2025-02-10', '08:00', '09:30', 'CSS Fundamentals',                 'lecture', TRUE, 5, '2025-02-10 09:35:00'),
(4,  1, '2025-02-12', '08:00', '09:30', 'CSS Layouts and Flexbox',          'lecture', TRUE, 5, '2025-02-12 09:35:00'),
(5,  1, '2025-02-17', '08:00', '09:30', 'JavaScript Introduction',          'lecture', TRUE, 5, '2025-02-17 09:35:00'),
(6,  1, '2025-02-19', '08:00', '09:30', 'JavaScript DOM Manipulation',      'lecture', TRUE, 5, '2025-02-19 09:35:00'),
(7,  1, '2025-02-24', '08:00', '09:30', 'JavaScript Events',                'lecture', TRUE, 5, '2025-02-24 09:35:00'),
(8,  1, '2025-02-26', '08:00', '09:30', 'Responsive Design',                'lecture', TRUE, 5, '2025-02-26 09:35:00'),

-- Offering 2 - Computer Networks
(9,  2, '2025-02-04', '10:00', '11:30', 'Introduction to Networks',         'lecture', TRUE, 6, '2025-02-04 11:35:00'),
(10, 2, '2025-02-06', '10:00', '11:30', 'OSI Model',                        'lecture', TRUE, 6, '2025-02-06 11:35:00'),
(11, 2, '2025-02-11', '10:00', '11:30', 'TCP/IP Protocol',                  'lecture', TRUE, 6, '2025-02-11 11:35:00'),
(12, 2, '2025-02-13', '10:00', '11:30', 'IP Addressing',                    'lecture', TRUE, 6, '2025-02-13 11:35:00');

-- ── Lecture Attendance ───────────────────────────────

-- Offering 1 Sessions 1-8
-- Student 9 (Ali) - Good attendance (7/8 = 87%)
INSERT INTO lecture_attendance (session_id, student_id, status, marked_by) VALUES
(1, 9, 'present', 5), (2, 9, 'present', 5), (3, 9, 'present', 5), (4, 9, 'present', 5),
(5, 9, 'present', 5), (6, 9, 'present', 5), (7, 9, 'absent',  5), (8, 9, 'present', 5);

-- Student 10 (Sara) - Perfect attendance (8/8 = 100%)
INSERT INTO lecture_attendance (session_id, student_id, status, marked_by) VALUES
(1, 10, 'present', 5), (2, 10, 'present', 5), (3, 10, 'present', 5), (4, 10, 'present', 5),
(5, 10, 'present', 5), (6, 10, 'present', 5), (7, 10, 'present', 5), (8, 10, 'present', 5);

-- Student 11 (Usman) - Low attendance (5/8 = 62%) SHORT ALERT
INSERT INTO lecture_attendance (session_id, student_id, status, marked_by) VALUES
(1, 11, 'present', 5), (2, 11, 'absent',  5), (3, 11, 'absent',  5), (4, 11, 'present', 5),
(5, 11, 'absent',  5), (6, 11, 'present', 5), (7, 11, 'present', 5), (8, 11, 'absent',  5);

-- Student 12 (Fatima)
INSERT INTO lecture_attendance (session_id, student_id, status, marked_by) VALUES
(1, 12, 'present', 5), (2, 12, 'present', 5), (3, 12, 'late',    5), (4, 12, 'present', 5),
(5, 12, 'present', 5), (6, 12, 'absent',  5), (7, 12, 'present', 5), (8, 12, 'present', 5);

-- Student 13 (Bilal)
INSERT INTO lecture_attendance (session_id, student_id, status, marked_by) VALUES
(1, 13, 'present', 5), (2, 13, 'absent',  5), (3, 13, 'present', 5), (4, 13, 'absent',  5),
(5, 13, 'present', 5), (6, 13, 'present', 5), (7, 13, 'absent',  5), (8, 13, 'present', 5);

-- Remaining 5 students for offering 1
INSERT INTO lecture_attendance (session_id, student_id, status, marked_by) VALUES
(1, 19, 'present', 5),(2, 19, 'present', 5),(3, 19, 'present', 5),(4, 19, 'present', 5),
(5, 19, 'absent', 5), (6, 19, 'present', 5),(7, 19, 'present', 5),(8, 19, 'present', 5),
(1, 20, 'present', 5),(2, 20, 'absent', 5), (3, 20, 'present', 5),(4, 20, 'present', 5),
(5, 20, 'present', 5),(6, 20, 'present', 5),(7, 20, 'absent', 5), (8, 20, 'present', 5),
(1, 21, 'present', 5),(2, 21, 'present', 5),(3, 21, 'present', 5),(4, 21, 'absent', 5),
(5, 21, 'present', 5),(6, 21, 'present', 5),(7, 21, 'present', 5),(8, 21, 'present', 5),
(1, 22, 'present', 5),(2, 22, 'present', 5),(3, 22, 'absent', 5), (4, 22, 'present', 5),
(5, 22, 'present', 5),(6, 22, 'late', 5),   (7, 22, 'present', 5),(8, 22, 'present', 5),
(1, 23, 'absent', 5), (2, 23, 'absent', 5), (3, 23, 'present', 5),(4, 23, 'absent', 5),
(5, 23, 'present', 5),(6, 23, 'absent', 5), (7, 23, 'present', 5),(8, 23, 'absent', 5);

-- ── Attendance Summaries (auto-calculated) ──────────
INSERT INTO attendance_summary
  (student_id, offering_id, total_classes, attended_classes, percentage, alert_triggered, last_updated)
VALUES
(9,  1, 8, 7, 87.50, FALSE, '2025-02-26'),
(10, 1, 8, 8, 100.00,FALSE, '2025-02-26'),
(11, 1, 8, 5, 62.50, TRUE,  '2025-02-26'),
(12, 1, 8, 7, 87.50, FALSE, '2025-02-26'),
(13, 1, 8, 5, 62.50, TRUE,  '2025-02-26'),
(19, 1, 8, 7, 87.50, FALSE, '2025-02-26'),
(20, 1, 8, 6, 75.00, FALSE, '2025-02-26'),
(21, 1, 8, 7, 87.50, FALSE, '2025-02-26'),
(22, 1, 8, 7, 87.50, FALSE, '2025-02-26'),
(23, 1, 8, 3, 37.50, TRUE,  '2025-02-26');

-- ── Campus Gates ─────────────────────────────────────
INSERT INTO campus_gates
  (id, gate_name, gate_code, gate_type, location_description, ip_address, is_active)
VALUES
(1, 'Main Entrance Gate', 'GATE-MAIN', 'main',       'Main entrance of BZU campus',       '192.168.1.10', TRUE),
(2, 'IT Department Gate', 'GATE-IT',   'department',  'IT Department side entrance',       '192.168.1.11', TRUE),
(3, 'Library Gate',       'GATE-LIB',  'library',     'Central library entrance',          '192.168.1.12', TRUE),
(4, 'Lab Block Gate',     'GATE-LAB',  'lab',         'Computer lab block entrance',       '192.168.1.13', TRUE);

INSERT INTO gate_cameras (id, gate_id, camera_name, camera_ip, camera_type, resolution, is_primary, status) VALUES
(1, 1, 'Main Gate Cam 1', '192.168.1.101', 'entry', '1080p', TRUE,  'active'),
(2, 1, 'Main Gate Cam 2', '192.168.1.102', 'exit',  '1080p', FALSE, 'active'),
(3, 2, 'IT Gate Cam 1',   '192.168.1.103', 'both',  '720p',  TRUE,  'active'),
(4, 3, 'Library Cam 1',   '192.168.1.104', 'both',  '720p',  TRUE,  'active');

INSERT INTO gate_schedules (gate_id, day_of_week, open_time, close_time) VALUES
(1, 'monday',    '07:00', '22:00'),
(1, 'tuesday',   '07:00', '22:00'),
(1, 'wednesday', '07:00', '22:00'),
(1, 'thursday',  '07:00', '22:00'),
(1, 'friday',    '07:00', '22:00'),
(1, 'saturday',  '08:00', '14:00'),
(1, 'sunday',    '00:00', '00:00');
-- =====================================================
-- SEED 11: ASSIGNMENTS + SUBMISSIONS
-- =====================================================
USE AI_Driven_Smart_LMS;

-- ── Assignments ──────────────────────────────────────
INSERT INTO assignments
  (id, offering_id, title, description, total_marks, weightage_percent, due_date, file_required, allowed_file_types, plagiarism_check, created_by)
VALUES
-- Offering 1 (Web Technologies)
(1, 1, 'Assignment 1 - HTML Portfolio Page',
 'Create a personal portfolio page using HTML and CSS. Include sections for About, Skills, and Contact.',
 20, 10.00, '2025-02-15 23:59:00', TRUE, '.html,.zip', FALSE, 5),

(2, 1, 'Assignment 2 - CSS Responsive Layout',
 'Design a fully responsive webpage using Flexbox and Grid. Must work on mobile and desktop.',
 20, 10.00, '2025-03-01 23:59:00', TRUE, '.html,.css,.zip', TRUE, 5),

(3, 1, 'Assignment 3 - JavaScript Form Validation',
 'Build a registration form with complete client-side validation using JavaScript.',
 30, 15.00, '2025-03-20 23:59:00', TRUE, '.html,.js,.zip', TRUE, 5),

-- Offering 2 (Computer Networks)
(4, 2, 'Assignment 1 - OSI Model Report',
 'Write a detailed report explaining all 7 layers of the OSI model with real-world examples.',
 25, 10.00, '2025-02-20 23:59:00', TRUE, '.pdf,.docx', FALSE, 6),

(5, 2, 'Assignment 2 - Subnetting Practice',
 'Solve 10 subnetting problems. Show all working steps for each problem.',
 25, 10.00, '2025-03-10 23:59:00', TRUE, '.pdf,.docx', FALSE, 6),

-- Offering 3 (Software Engineering)
(6, 3, 'Assignment 1 - SRS Document',
 'Prepare a complete Software Requirements Specification for a Library Management System.',
 40, 15.00, '2025-02-28 23:59:00', TRUE, '.pdf,.docx', FALSE, 8),

-- Offering 4 (Artificial Intelligence)
(7, 4, 'Assignment 1 - AI Literature Review',
 'Write a 2000-word literature review on any current AI application in healthcare.',
 30, 10.00, '2025-02-25 23:59:00', TRUE, '.pdf', TRUE, 4);


-- ── Submissions ──────────────────────────────────────
-- Assignment 1 (HTML Portfolio) - Offering 1
INSERT INTO assignment_submissions
  (assignment_id, student_id, file_path, remarks, obtained_marks, feedback, status, graded_by, graded_at)
VALUES
(1, 9,  'uploads/submissions/a1_s9_portfolio.zip',  'Used Bootstrap for styling',     18, 'Good work! Clean structure.',           'graded', 5, '2025-02-17 10:00:00'),
(1, 10, 'uploads/submissions/a1_s10_portfolio.zip', 'All sections completed',         20, 'Excellent! Perfect submission.',        'graded', 5, '2025-02-17 10:30:00'),
(1, 11, 'uploads/submissions/a1_s11_portfolio.zip', 'Basic version submitted',        14, 'Missing contact section. Redo CSS.',    'graded', 5, '2025-02-17 11:00:00'),
(1, 12, 'uploads/submissions/a1_s12_portfolio.zip', NULL,                             17, 'Good layout, minor CSS issues.',        'graded', 5, '2025-02-17 11:30:00'),
(1, 13, 'uploads/submissions/a1_s13_portfolio.zip', 'Late submission',                12, 'Submitted late. Basic HTML only.',      'late',   5, '2025-02-17 12:00:00'),
(1, 19, 'uploads/submissions/a1_s19_portfolio.zip', NULL,                             19, 'Very good responsive design.',          'graded', 5, '2025-02-17 12:30:00'),
(1, 20, 'uploads/submissions/a1_s20_portfolio.zip', NULL,                             16, 'Good effort, improve animations.',      'graded', 5, '2025-02-17 13:00:00'),
(1, 21, 'uploads/submissions/a1_s21_portfolio.zip', NULL,                             15, 'Decent work, add more content.',        'graded', 5, '2025-02-17 13:30:00'),
(1, 22, 'uploads/submissions/a1_s22_portfolio.zip', NULL,                             18, 'Nice design and clean code.',           'graded', 5, '2025-02-17 14:00:00');
-- Student 23 did not submit

-- Assignment 4 (OSI Report) - Offering 2
INSERT INTO assignment_submissions
  (assignment_id, student_id, file_path, remarks, obtained_marks, feedback, status, graded_by, graded_at)
VALUES
(4, 9,  'uploads/submissions/a4_s9_osi.pdf',  'Covered all 7 layers with diagrams',  22, 'Well written with good examples.',     'graded', 6, '2025-02-22 10:00:00'),
(4, 10, 'uploads/submissions/a4_s10_osi.pdf', NULL,                                  25, 'Perfect report! Great research.',      'graded', 6, '2025-02-22 10:30:00'),
(4, 11, 'uploads/submissions/a4_s11_osi.pdf', NULL,                                  18, 'Missing examples for layers 5-7.',     'graded', 6, '2025-02-22 11:00:00'),
(4, 14, 'uploads/submissions/a4_s14_osi.pdf', NULL,                                  20, 'Good report, minor formatting issues.','graded', 6, '2025-02-22 11:30:00'),
(4, 15, 'uploads/submissions/a4_s15_osi.pdf', NULL,                                  23, 'Excellent work with references.',      'graded', 6, '2025-02-22 12:00:00');

-- Assignment 7 (AI Literature Review) - Offering 4
INSERT INTO assignment_submissions
  (assignment_id, student_id, file_path, remarks, obtained_marks, feedback, plagiarism_percentage, plagiarism_status, status, graded_by, graded_at)
VALUES
(7, 9,  'uploads/submissions/a7_s9_ai.pdf',  NULL, 27, 'Excellent review with strong references.', 8.5,  'completed', 'graded', 4, '2025-02-27 09:00:00'),
(7, 11, 'uploads/submissions/a7_s11_ai.pdf', NULL, 22, 'Good but needs more recent papers.',       12.0, 'completed', 'graded', 4, '2025-02-27 09:30:00'),
(7, 15, 'uploads/submissions/a7_s15_ai.pdf', NULL, 28, 'Outstanding literature review!',           5.2,  'completed', 'graded', 4, '2025-02-27 10:00:00'),
(7, 18, 'uploads/submissions/a7_s18_ai.pdf', NULL, 25, 'Well structured and well cited.',          7.8,  'completed', 'graded', 4, '2025-02-27 10:30:00'),
(7, 24, 'uploads/submissions/a7_s24_ai.pdf', NULL, 26, 'Great analysis of AI in healthcare.',      6.5,  'completed', 'graded', 4, '2025-02-27 11:00:00');
-- =====================================================
-- SEED 12: QUIZZES + QUESTIONS + ATTEMPTS
-- =====================================================
USE AI_Driven_Smart_LMS;

-- ── Quizzes ──────────────────────────────────────────
INSERT INTO quizzes
  (id, offering_id, title, description, quiz_type, total_questions, total_marks, time_limit_minutes, start_time, end_time, is_mandatory, auto_grading, shuffle_questions, created_by)
VALUES
-- Offering 1 (Web Technologies)
(1, 1, 'Quiz 1 - HTML Basics',
 'Test your knowledge of HTML tags and structure',
 'teacher', 5, 10, 15,
 '2025-02-10 08:00:00', '2025-02-10 23:59:00',
 TRUE, TRUE, FALSE, 5),

(2, 1, 'Quiz 2 - CSS Fundamentals',
 'CSS selectors, properties and box model',
 'teacher', 5, 10, 15,
 '2025-02-17 08:00:00', '2025-02-17 23:59:00',
 TRUE, TRUE, TRUE, 5),

-- Offering 2 (Computer Networks)
(3, 2, 'Quiz 1 - Network Basics',
 'OSI layers and TCP/IP fundamentals',
 'teacher', 5, 10, 15,
 '2025-02-11 10:00:00', '2025-02-11 23:59:00',
 TRUE, TRUE, FALSE, 6),

-- Offering 4 (Artificial Intelligence)
(4, 4, 'Quiz 1 - AI Concepts',
 'Introduction to AI, search algorithms, and agents',
 'teacher', 5, 10, 20,
 '2025-02-19 14:00:00', '2025-02-19 23:59:00',
 TRUE, TRUE, FALSE, 4);


-- ── Quiz Questions ───────────────────────────────────

-- Quiz 1 (HTML Basics)
INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, marks, difficulty, explanation) VALUES
(1, 'What does HTML stand for?',
 'mcq', '["HyperText Markup Language","HighText Machine Language","HyperText and links Markup Language","None of these"]',
 'HyperText Markup Language', 2, 'easy',
 'HTML stands for HyperText Markup Language, the standard for web pages.'),

(1, 'Which tag is used for the largest heading in HTML?',
 'mcq', '["<h6>","<heading>","<h1>","<head>"]',
 '<h1>', 2, 'easy',
 '<h1> defines the largest heading, <h6> the smallest.'),

(1, 'Which HTML attribute specifies an alternate text for an image?',
 'mcq', '["src","alt","title","href"]',
 'alt', 2, 'easy',
 'The alt attribute provides alternative text when image cannot be displayed.'),

(1, 'Which HTML tag is used to create a hyperlink?',
 'mcq', '["<link>","<a>","<href>","<url>"]',
 '<a>', 2, 'medium',
 'The <a> anchor tag with href attribute creates hyperlinks.'),

(1, 'What is the correct HTML element for inserting a line break?',
 'mcq', '["<break>","<lb>","<br>","<newline>"]',
 '<br>', 2, 'easy',
 '<br> is a self-closing tag that inserts a line break.');


-- Quiz 2 (CSS Fundamentals)
INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, marks, difficulty, explanation) VALUES
(2, 'What does CSS stand for?',
 'mcq', '["Cascading Style Sheets","Creative Style Sheets","Computer Style Sheets","Colorful Style Sheets"]',
 'Cascading Style Sheets', 2, 'easy',
 'CSS stands for Cascading Style Sheets, used to style HTML.'),

(2, 'Which CSS property controls the text size?',
 'mcq', '["font-style","text-size","font-size","text-style"]',
 'font-size', 2, 'easy',
 'font-size property sets the size of the font.'),

(2, 'How do you select an element with id "demo" in CSS?',
 'mcq', '[".demo","#demo","demo","*demo"]',
 '#demo', 2, 'easy',
 '# selector targets elements by their id attribute.'),

(2, 'Which property is used to change the background color?',
 'mcq', '["bgcolor","background-color","color","background"]',
 'background-color', 2, 'medium',
 'background-color property sets the background color of an element.'),

(2, 'What is the default display value for a <div> element?',
 'mcq', '["inline","inline-block","block","flex"]',
 'block', 2, 'medium',
 '<div> is a block-level element by default.');


-- Quiz 3 (Network Basics)
INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, marks, difficulty, explanation) VALUES
(3, 'How many layers does the OSI model have?',
 'mcq', '["4","5","6","7"]',
 '7', 2, 'easy',
 'The OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.'),

(3, 'Which layer of OSI is responsible for routing?',
 'mcq', '["Physical","Data Link","Network","Transport"]',
 'Network', 2, 'medium',
 'The Network layer (Layer 3) handles routing and logical addressing.'),

(3, 'What does IP stand for?',
 'mcq', '["Internet Protocol","Internal Protocol","Internet Process","Intranet Protocol"]',
 'Internet Protocol', 2, 'easy',
 'IP stands for Internet Protocol, used for addressing and routing.'),

(3, 'Which protocol operates at the Transport layer?',
 'mcq', '["HTTP","IP","TCP","ARP"]',
 'TCP', 2, 'medium',
 'TCP (Transmission Control Protocol) operates at Transport Layer (Layer 4).'),

(3, 'What is the maximum length of an IPv4 address in bits?',
 'mcq', '["16","32","64","128"]',
 '32', 2, 'easy',
 'IPv4 addresses are 32 bits (4 octets), e.g., 192.168.1.1');


-- Quiz 4 (AI Concepts)
INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, marks, difficulty, explanation) VALUES
(4, 'What is Artificial Intelligence?',
 'mcq', '["A programming language","Simulation of human intelligence by machines","A type of database","An operating system"]',
 'Simulation of human intelligence by machines', 2, 'easy',
 'AI is the simulation of human intelligence processes by computer systems.'),

(4, 'Which of the following is a type of AI search algorithm?',
 'mcq', '["Quick Sort","Breadth First Search","Binary Search","Bubble Sort"]',
 'Breadth First Search', 2, 'medium',
 'BFS is used in AI for uninformed search in problem-solving.'),

(4, 'What does ML stand for in AI context?',
 'mcq', '["Machine Logic","Machine Learning","Memory Logic","Multiple Learning"]',
 'Machine Learning', 2, 'easy',
 'ML stands for Machine Learning, a subset of AI.'),

(4, 'Which algorithm is used for classification in ML?',
 'mcq', '["K-Means","Linear Regression","Decision Tree","PCA"]',
 'Decision Tree', 2, 'medium',
 'Decision Trees are used for both classification and regression tasks.'),

(4, 'What is a neural network inspired by?',
 'mcq', '["Computer circuits","Human brain neurons","Mathematical equations","DNA structure"]',
 'Human brain neurons', 2, 'medium',
 'Neural networks are inspired by the biological neural networks in human brains.');


-- ── Quiz Attempts ────────────────────────────────────

-- Quiz 1 (HTML Basics) Attempts
INSERT INTO quiz_attempts (quiz_id, student_id, start_time, end_time, score, total_marks, percentage, answers, status) VALUES
(1, 9,  '2025-02-10 10:00:00', '2025-02-10 10:12:00', 10, 10, 100.00,
 '{"1":"HyperText Markup Language","2":"<h1>","3":"alt","4":"<a>","5":"<br>"}', 'completed'),

(1, 10, '2025-02-10 11:00:00', '2025-02-10 11:14:00', 8, 10, 80.00,
 '{"1":"HyperText Markup Language","2":"<h1>","3":"alt","4":"<href>","5":"<br>"}', 'completed'),

(1, 11, '2025-02-10 12:00:00', '2025-02-10 12:13:00', 6, 10, 60.00,
 '{"1":"HyperText Markup Language","2":"<h6>","3":"src","4":"<a>","5":"<br>"}', 'completed'),

(1, 12, '2025-02-10 13:00:00', '2025-02-10 13:11:00', 10, 10, 100.00,
 '{"1":"HyperText Markup Language","2":"<h1>","3":"alt","4":"<a>","5":"<br>"}', 'completed'),

(1, 19, '2025-02-10 14:00:00', '2025-02-10 14:12:00', 8, 10, 80.00,
 '{"1":"HyperText Markup Language","2":"<h1>","3":"title","4":"<a>","5":"<br>"}', 'completed'),

(1, 20, '2025-02-10 15:00:00', '2025-02-10 15:13:00', 6, 10, 60.00,
 '{"1":"HyperText Markup Language","2":"<h1>","3":"alt","4":"<href>","5":"<newline>"}', 'completed'),

(1, 22, '2025-02-10 16:00:00', '2025-02-10 16:14:00', 8, 10, 80.00,
 '{"1":"HyperText Markup Language","2":"<h1>","3":"alt","4":"<link>","5":"<br>"}', 'completed');


-- Quiz 3 (Network Basics) Attempts
INSERT INTO quiz_attempts (quiz_id, student_id, start_time, end_time, score, total_marks, percentage, answers, status) VALUES
(3, 9,  '2025-02-11 11:00:00', '2025-02-11 11:13:00', 8, 10, 80.00,
 '{"6":"7","7":"Network","8":"Internet Protocol","9":"TCP","10":"32"}', 'completed'),

(3, 10, '2025-02-11 12:00:00', '2025-02-11 12:14:00', 10, 10, 100.00,
 '{"6":"7","7":"Network","8":"Internet Protocol","9":"TCP","10":"32"}', 'completed'),

(3, 14, '2025-02-11 13:00:00', '2025-02-11 13:12:00', 8,  10, 80.00,
 '{"6":"7","7":"Transport","8":"Internet Protocol","9":"TCP","10":"32"}', 'completed'),

(3, 15, '2025-02-11 14:00:00', '2025-02-11 14:13:00', 10, 10, 100.00,
 '{"6":"7","7":"Network","8":"Internet Protocol","9":"TCP","10":"32"}', 'completed');
-- =====================================================
-- SEED 13: EXAMS + RESULTS
-- =====================================================
USE AI_Driven_Smart_LMS;

-- ── Exams ────────────────────────────────────────────
INSERT INTO exams
  (id, offering_id, exam_type, title, total_marks, weightage_percent, exam_date, start_time, end_time, room_number)
VALUES
-- Offering 1 (Web Technologies)
(1, 1, 'midterm', 'Web Technologies Midterm Exam',  50, 30.00, '2025-03-15', '09:00', '11:00', 'Exam Hall A'),
(2, 1, 'final',   'Web Technologies Final Exam',    100, 50.00, '2025-06-01', '09:00', '12:00', 'Exam Hall A'),

-- Offering 2 (Computer Networks)
(3, 2, 'midterm', 'Computer Networks Midterm Exam', 50, 30.00, '2025-03-17', '10:00', '12:00', 'Exam Hall B'),
(4, 2, 'final',   'Computer Networks Final Exam',   100, 50.00, '2025-06-03', '10:00', '13:00', 'Exam Hall B'),

-- Offering 3 (Software Engineering)
(5, 3, 'midterm', 'Software Engineering Midterm',   50, 30.00, '2025-03-18', '11:00', '13:00', 'IT-103'),

-- Offering 4 (Artificial Intelligence)
(6, 4, 'midterm', 'AI Midterm Exam',                50, 30.00, '2025-03-20', '14:00', '16:00', 'IT-201');


-- ── Exam Results ─────────────────────────────────────

-- Midterm 1 (Web Technologies)
INSERT INTO exam_results (exam_id, student_id, obtained_marks, grade, entered_by) VALUES
(1, 9,  44, 'A',  5),
(1, 10, 49, 'A+', 5),
(1, 11, 32, 'C+', 5),
(1, 12, 41, 'A-', 5),
(1, 13, 35, 'B',  5),
(1, 19, 46, 'A+', 5),
(1, 20, 38, 'B+', 5),
(1, 21, 40, 'A-', 5),
(1, 22, 43, 'A',  5),
(1, 23, 25, 'D',  5);

-- Midterm 3 (Computer Networks)
INSERT INTO exam_results (exam_id, student_id, obtained_marks, grade, entered_by) VALUES
(3, 9,  42, 'A',  6),
(3, 10, 47, 'A+', 6),
(3, 11, 30, 'B',  6),
(3, 14, 38, 'B+', 6),
(3, 15, 45, 'A+', 6),
(3, 16, 35, 'B',  6),
(3, 17, 28, 'C+', 6),
(3, 18, 40, 'A-', 6),
(3, 19, 44, 'A',  6),
(3, 20, 36, 'B+', 6);

-- Midterm 6 (AI)
INSERT INTO exam_results (exam_id, student_id, obtained_marks, grade, entered_by) VALUES
(6, 9,  43, 'A',  4),
(6, 11, 35, 'B',  4),
(6, 15, 48, 'A+', 4),
(6, 18, 40, 'A-', 4),
(6, 24, 45, 'A+', 4);


-- ── Grade updates for completed enrollments ──────────
UPDATE enrollments SET grade_letter = 'A',  grade_points = 4.00
WHERE student_id = 9  AND offering_id = 1;
UPDATE enrollments SET grade_letter = 'A+', grade_points = 4.00
WHERE student_id = 10 AND offering_id = 1;
UPDATE enrollments SET grade_letter = 'B',  grade_points = 3.00
WHERE student_id = 11 AND offering_id = 1;
UPDATE enrollments SET grade_letter = 'A-', grade_points = 3.67
WHERE student_id = 12 AND offering_id = 1;
UPDATE enrollments SET grade_letter = 'B+', grade_points = 3.33
WHERE student_id = 13 AND offering_id = 1;
UPDATE enrollments SET grade_letter = 'A+', grade_points = 4.00
WHERE student_id = 19 AND offering_id = 1;
UPDATE enrollments SET grade_letter = 'B+', grade_points = 3.33
WHERE student_id = 20 AND offering_id = 1;
UPDATE enrollments SET grade_letter = 'A-', grade_points = 3.67
WHERE student_id = 21 AND offering_id = 1;
UPDATE enrollments SET grade_letter = 'A',  grade_points = 4.00
WHERE student_id = 22 AND offering_id = 1;
UPDATE enrollments SET grade_letter = 'D',  grade_points = 1.00
WHERE student_id = 23 AND offering_id = 1;
-- =====================================================
-- SEED 14: FEE STRUCTURE + VOUCHERS + PAYMENTS
-- =====================================================
USE AI_Driven_Smart_LMS;

-- ── Fee Structure ────────────────────────────────────
INSERT INTO fee_structure
  (id, program_id, semester_number, tuition_fee, admission_fee, library_fee, sports_fee, other_fees, valid_from)
VALUES
-- BSIT Fee Structure (all 8 semesters)
(1,  1, 1, 35000, 5000, 1000, 500, '[{"name":"Lab Fee","amount":2000},{"name":"Examination Fee","amount":1500}]', '2021-09-01'),
(2,  1, 2, 35000, 0,    1000, 500, '[{"name":"Lab Fee","amount":2000},{"name":"Examination Fee","amount":1500}]', '2022-02-01'),
(3,  1, 3, 36000, 0,    1000, 500, '[{"name":"Lab Fee","amount":2000},{"name":"Examination Fee","amount":1500}]', '2022-09-01'),
(4,  1, 4, 36000, 0,    1000, 500, '[{"name":"Lab Fee","amount":2000},{"name":"Examination Fee","amount":1500}]', '2023-02-01'),
(5,  1, 5, 38000, 0,    1000, 500, '[{"name":"Lab Fee","amount":2000},{"name":"Examination Fee","amount":1500}]', '2023-09-01'),
(6,  1, 6, 38000, 0,    1000, 500, '[{"name":"Lab Fee","amount":2000},{"name":"Examination Fee","amount":1500}]', '2024-02-01'),
(7,  1, 7, 40000, 0,    1000, 500, '[{"name":"Lab Fee","amount":2500},{"name":"Examination Fee","amount":2000}]', '2024-09-01'),
(8,  1, 8, 40000, 0,    1000, 500, '[{"name":"Lab Fee","amount":2500},{"name":"Examination Fee","amount":2000}]', '2025-02-01'),

-- BSCS Fee Structure
(9,  2, 1, 37000, 5000, 1000, 500, '[{"name":"Lab Fee","amount":2500},{"name":"Examination Fee","amount":1500}]', '2021-09-01'),
(10, 2, 8, 42000, 0,    1000, 500, '[{"name":"Lab Fee","amount":3000},{"name":"Examination Fee","amount":2000}]', '2025-02-01'),

-- BBA Fee Structure
(11, 3, 1, 30000, 4000, 1000, 500, '[{"name":"Examination Fee","amount":1500}]', '2021-09-01'),
(12, 3, 8, 33000, 0,    1000, 500, '[{"name":"Examination Fee","amount":1500}]', '2025-02-01');


-- ── Fee Vouchers (Spring 2025 = semester_id 4) ───────
INSERT INTO fee_vouchers
  (id, student_id, voucher_number, semester_id, amount, due_date, issue_date, status, fine_amount)
VALUES
-- BSIT 2021 Batch (Semester 8 fee)
(1,  9,  'VCH-2025-00001', 4, 46000.00, '2025-02-28', '2025-02-01', 'paid',    0),
(2,  10, 'VCH-2025-00002', 4, 46000.00, '2025-02-28', '2025-02-01', 'paid',    0),
(3,  11, 'VCH-2025-00003', 4, 46000.00, '2025-02-28', '2025-02-01', 'partial', 0),
(4,  12, 'VCH-2025-00004', 4, 46000.00, '2025-02-28', '2025-02-01', 'paid',    0),
(5,  13, 'VCH-2025-00005', 4, 46000.00, '2025-02-28', '2025-02-01', 'overdue', 1500),
(6,  14, 'VCH-2025-00006', 4, 46000.00, '2025-02-28', '2025-02-01', 'paid',    0),
(7,  15, 'VCH-2025-00007', 4, 46000.00, '2025-02-28', '2025-02-01', 'paid',    0),
(8,  16, 'VCH-2025-00008', 4, 46000.00, '2025-02-28', '2025-02-01', 'unpaid',  0),
(9,  17, 'VCH-2025-00009', 4, 46000.00, '2025-02-28', '2025-02-01', 'overdue', 1000),
(10, 18, 'VCH-2025-00010', 4, 46000.00, '2025-02-28', '2025-02-01', 'paid',    0),

-- BSIT 2022 Batch (Semester 6 fee)
(11, 19, 'VCH-2025-00011', 4, 41500.00, '2025-02-28', '2025-02-01', 'paid',    0),
(12, 20, 'VCH-2025-00012', 4, 41500.00, '2025-02-28', '2025-02-01', 'paid',    0),
(13, 21, 'VCH-2025-00013', 4, 41500.00, '2025-02-28', '2025-02-01', 'unpaid',  0),
(14, 22, 'VCH-2025-00014', 4, 41500.00, '2025-02-28', '2025-02-01', 'paid',    0),
(15, 23, 'VCH-2025-00015', 4, 41500.00, '2025-02-28', '2025-02-01', 'overdue', 2000),

-- BSCS Batch
(16, 24, 'VCH-2025-00016', 4, 48000.00, '2025-02-28', '2025-02-01', 'paid',    0),
(17, 25, 'VCH-2025-00017', 4, 48000.00, '2025-02-28', '2025-02-01', 'paid',    0);


-- ── Fee Payments ─────────────────────────────────────
INSERT INTO fee_payments
  (voucher_id, amount_paid, payment_method, reference_number, bank_name, received_by, receipt_number)
VALUES
-- Paid vouchers full payment
(1,  46000.00, 'bank_transfer', 'TXN-2025-001', 'HBL',     1, 'RCP-2025-001'),
(2,  46000.00, 'online',        'TXN-2025-002', 'Easypaisa',1, 'RCP-2025-002'),
(4,  46000.00, 'cash',           NULL,           NULL,       1, 'RCP-2025-004'),
(6,  46000.00, 'bank_transfer', 'TXN-2025-006', 'MCB',      1, 'RCP-2025-006'),
(7,  46000.00, 'online',        'TXN-2025-007', 'JazzCash',  1, 'RCP-2025-007'),
(10, 46000.00, 'bank_transfer', 'TXN-2025-010', 'UBL',      1, 'RCP-2025-010'),
(11, 41500.00, 'bank_transfer', 'TXN-2025-011', 'HBL',      1, 'RCP-2025-011'),
(12, 41500.00, 'cash',           NULL,           NULL,       1, 'RCP-2025-012'),
(14, 41500.00, 'online',        'TXN-2025-014', 'Easypaisa',1, 'RCP-2025-014'),
(16, 48000.00, 'bank_transfer', 'TXN-2025-016', 'MCB',      1, 'RCP-2025-016'),
(17, 48000.00, 'bank_transfer', 'TXN-2025-017', 'HBL',      1, 'RCP-2025-017'),

-- Partial payment (voucher 3 - student 11)
(3,  25000.00, 'cash', NULL, NULL, 1, 'RCP-2025-003');
-- =====================================================
-- SEED 15: ANNOUNCEMENTS + NOTICES + CHAT GROUPS
-- =====================================================
USE AI_Driven_Smart_LMS;

-- ── Announcements ────────────────────────────────────
INSERT INTO announcements
  (id, title, content, created_by, target_type, target_id, priority, pinned_until)
VALUES
(1, 'Welcome to Spring 2025 Semester',
 'Dear Students, Welcome to Spring 2025 semester. Classes will begin from February 3, 2025. Please ensure your course registrations are complete. Best regards, Administration.',
 1, 'all', NULL, 'normal', '2025-02-10'),

(2, 'Fee Submission Deadline - URGENT',
 'This is to inform all students that the last date for fee submission is February 28, 2025. After this date a fine of Rs. 100/day will be charged. Please submit your fee immediately.',
 1, 'all', NULL, 'urgent', '2025-02-28'),

(3, 'Web Technologies - Lab Makeup Class',
 'Dear Students, A makeup lab session for Web Technologies (IT-301) will be held on Saturday February 22, 2025 at 10:00 AM in Lab 3. Attendance is mandatory.',
 5, 'course', 1, 'high', NULL),

(4, 'Computer Networks - Quiz 1 Schedule',
 'Quiz 1 for Computer Networks will be held on February 11, 2025 during class time. The quiz will cover OSI Model and TCP/IP. Duration: 15 minutes.',
 6, 'course', 2, 'normal', NULL),

(5, 'IT Department - HEC Accreditation Visit',
 'The HEC accreditation team will be visiting our department on March 5-6, 2025. Students are requested to maintain discipline and wear their ID cards during this period.',
 4, 'department', 1, 'high', '2025-03-06'),

(6, 'AI Course - Guest Lecture on NLP',
 'A guest lecture on Natural Language Processing will be conducted by Dr. Tariq from LUMS on February 28, 2025 at 3:00 PM in Seminar Hall. All IT students are welcome.',
 4, 'department', 1, 'normal', NULL),

(7, 'Midterm Exam Schedule Announced',
 'Midterm exams will be held from March 15-22, 2025. Detailed schedule has been posted on the notice board. Students are advised to prepare accordingly.',
 1, 'all', NULL, 'high', '2025-03-22');


-- ── Notice Board ─────────────────────────────────────
INSERT INTO notice_board
  (id, title, content, category, posted_by, expiry_date, is_public, views)
VALUES
(1, 'Spring 2025 Exam Schedule',
 'Midterm Examinations Spring 2025\n\nWeb Technologies:    March 15, 09:00 AM - Exam Hall A\nComputer Networks:  March 17, 10:00 AM - Exam Hall B\nSoftware Engineering: March 18, 11:00 AM - IT-103\nArtificial Intelligence: March 20, 02:00 PM - IT-201\n\nRules:\n1. Bring your university ID card\n2. No mobile phones allowed\n3. Report 15 minutes before exam',
 'Academic', 1, '2025-03-25', TRUE, 142),

(2, 'Final Year Project Guidelines 2025',
 'Dear Final Year Students,\n\nPlease note the following deadlines:\n- Project Proposal: March 1, 2025\n- Progress Report 1: April 1, 2025\n- Progress Report 2: May 1, 2025\n- Final Submission: June 1, 2025\n- Defense: June 15-20, 2025\n\nAll documentation must be submitted in prescribed format.',
 'Academic', 4, '2025-06-30', TRUE, 89),

(3, 'Campus Maintenance Notice',
 'The university swimming pool and sports complex will remain closed from February 20-28, 2025 for annual maintenance. All other facilities will remain operational.',
 'Administrative', 1, '2025-02-28', TRUE, 45),

(4, 'Scholarship Applications Open',
 'Applications for Need-Based Scholarship Spring 2025 are now open. Eligible students with CGPA >= 2.5 and family income below Rs. 50,000/month may apply.\n\nDeadline: March 15, 2025\nForms available at: Scholarship Office, Admin Block',
 'Financial', 1, '2025-03-15', TRUE, 210),

(5, 'IT Department Seminar Series',
 'IT Department Seminar Series 2025\n\nTopic: "Future of Artificial Intelligence in Pakistan"\nSpeaker: Dr. Umar Saif (Former Chairman, Punjab IT Board)\nDate: February 27, 2025\nTime: 2:00 PM\nVenue: Main Auditorium\n\nAll students and faculty are welcome.',
 'Events', 4, '2025-02-28', TRUE, 178);


-- ── Chat Groups ──────────────────────────────────────
INSERT INTO chat_groups
  (id, name, group_type, offering_id, created_by, is_active, moderation_required)
VALUES
(1, 'Web Technologies - Section A',    'class',   1, 5, TRUE, FALSE),
(2, 'Computer Networks - Section A',   'class',   2, 6, TRUE, FALSE),
(3, 'Software Engineering - Section A','class',   3, 8, TRUE, FALSE),
(4, 'Artificial Intelligence - Sec A', 'class',   4, 4, TRUE, FALSE),
(5, 'IT Department General Chat',      'department', NULL, 4, TRUE, TRUE),
(6, 'BSIT 2021 Batch Group',           'general', NULL, 1, TRUE, FALSE);


-- ── Chat Group Members ───────────────────────────────

-- Group 1 (Web Technologies) - Teacher + Enrolled Students
INSERT INTO chat_group_members (group_id, user_id, role) VALUES
(1, 5,  'teacher'),
(1, 9,  'member'), (1, 10, 'member'), (1, 11, 'member'),
(1, 12, 'member'), (1, 13, 'member'), (1, 19, 'member'),
(1, 20, 'member'), (1, 21, 'member'), (1, 22, 'member'), (1, 23, 'member');

-- Group 2 (Computer Networks) - Teacher + Enrolled Students
INSERT INTO chat_group_members (group_id, user_id, role) VALUES
(2, 6,  'teacher'),
(2, 9,  'member'), (2, 10, 'member'), (2, 11, 'member'),
(2, 14, 'member'), (2, 15, 'member'), (2, 16, 'member'),
(2, 17, 'member'), (2, 18, 'member'), (2, 19, 'member'), (2, 20, 'member');

-- Group 4 (AI)
INSERT INTO chat_group_members (group_id, user_id, role) VALUES
(4, 4,  'teacher'),
(4, 9,  'member'), (4, 11, 'member'), (4, 15, 'member'),
(4, 18, 'member'), (4, 24, 'member');

-- Group 6 (BSIT 2021 Batch)
INSERT INTO chat_group_members (group_id, user_id, role) VALUES
(6, 4,  'monitor'),
(6, 9,  'member'), (6, 10, 'member'), (6, 11, 'member'),
(6, 12, 'member'), (6, 13, 'member'), (6, 14, 'member'),
(6, 15, 'member'), (6, 16, 'member'), (6, 17, 'member'), (6, 18, 'member');


-- ── Sample Messages ──────────────────────────────────
INSERT INTO messages
  (group_id, sender_id, message, message_type, sent_at)
VALUES
(1, 5,  'Assalam o Alaikum! Welcome to Web Technologies class chat. Please use this group for course-related queries only.', 'system', '2025-02-03 09:00:00'),
(1, 9,  'Walaikum Assalam Sir! Thank you for adding us.', 'text', '2025-02-03 09:05:00'),
(1, 10, 'Sir, will assignment 1 require Bootstrap or pure CSS?', 'text', '2025-02-03 09:10:00'),
(1, 5,  'Pure CSS and HTML only for Assignment 1. Bootstrap is optional for Assignment 2 onwards.', 'text', '2025-02-03 09:15:00'),
(1, 12, 'Sir what is the file size limit for submission?', 'text', '2025-02-05 11:00:00'),
(1, 5,  'Maximum 10MB per file. Compress your project folder before uploading.', 'text', '2025-02-05 11:05:00'),
(1, 19, 'Sir can we use Flexbox in Assignment 1?', 'text', '2025-02-10 08:30:00'),
(1, 5,  'Yes, Flexbox is allowed and encouraged!', 'text', '2025-02-10 08:35:00'),

(2, 6,  'Welcome to Computer Networks group. Quiz 1 will be on Feb 11 during class. Prepare OSI model.', 'text', '2025-02-04 10:00:00'),
(2, 9,  'Sir, should we memorize all 7 layers with protocols?', 'text', '2025-02-04 10:30:00'),
(2, 6,  'Yes, know all layers with their functions and at least 2 protocols each.', 'text', '2025-02-04 10:35:00'),
(2, 15, 'Sir is subnetting included in Quiz 1?', 'text', '2025-02-05 09:00:00'),
(2, 6,  'No, subnetting will be in Quiz 2. Quiz 1 only covers OSI and TCP/IP.', 'text', '2025-02-05 09:05:00'),

(4, 4,  'Welcome AI class! This semester we cover search algorithms, ML basics, and neural networks.', 'text', '2025-02-03 14:00:00'),
(4, 9,  'Sir which programming language will we use for implementations?', 'text', '2025-02-03 14:30:00'),
(4, 4,  'Python primarily. Make sure you have Python 3.10+ installed with scikit-learn.', 'text', '2025-02-03 14:35:00'),
(4, 24, 'Sir will we implement neural networks from scratch?', 'text', '2025-02-05 15:00:00'),
(4, 4,  'We will use PyTorch for neural networks. No need to code from scratch.', 'text', '2025-02-05 15:05:00');
-- =====================================================
-- SEED 16: AI ANALYTICS + CHATBOT INTENTS + FAQS
-- =====================================================
USE AI_Driven_Smart_LMS;

-- ── Student Performance Scores ───────────────────────
-- Semester 4 (Spring 2025) analytics for main students
INSERT INTO student_performance_scores
  (student_id, semester_id, academic_score, consistency_index, improvement_index,
   engagement_level, class_rank, section_rank, trend_direction,
   risk_prediction, weak_subjects, recommendations, score_breakdown, calculated_at)
VALUES
(9, 4,
 82.50, 78.00, 5.00, 'high', 2, 2, 'improving',
 '{"level":"low","factors":[],"at_risk":false}',
 '[]',
 '[{"type":"general","priority":"low","message":"Great performance! Keep it up."}]',
 '{"lecture_attendance":87.50,"campus_presence":85.00,"assignment_consistency":88.89,"quiz_accuracy":90.00,"gpa_factor":100.00}',
 '2025-02-26 12:00:00'),

(10, 4,
 94.20, 92.00, 8.00, 'high', 1, 1, 'improving',
 '{"level":"low","factors":[],"at_risk":false}',
 '[]',
 '[{"type":"general","priority":"low","message":"Excellent! Top performer in class."}]',
 '{"lecture_attendance":100.00,"campus_presence":95.00,"assignment_consistency":100.00,"quiz_accuracy":90.00,"gpa_factor":100.00}',
 '2025-02-26 12:00:00'),

(11, 4,
 58.30, 45.00, -3.00, 'low', 8, 8, 'declining',
 '{"level":"high","factors":["Low lecture attendance","Missing assignments","Poor quiz performance"],"at_risk":true}',
 '[{"course":"Web Technologies","code":"IT-301","attendance":62.50,"reason":"Low attendance"}]',
 '[{"type":"attendance","priority":"high","message":"Attend more lectures to avoid shortage"},{"type":"assignment","priority":"high","message":"Submit assignments on time consistently"},{"type":"quiz","priority":"medium","message":"Practice AI quizzes to improve accuracy"}]',
 '{"lecture_attendance":62.50,"campus_presence":60.00,"assignment_consistency":55.56,"quiz_accuracy":60.00,"gpa_factor":75.00}',
 '2025-02-26 12:00:00'),

(12, 4,
 76.80, 70.00, 2.00, 'medium', 5, 5, 'stable',
 '{"level":"low","factors":[],"at_risk":false}',
 '[]',
 '[{"type":"quiz","priority":"medium","message":"Practice AI quizzes to improve accuracy"}]',
 '{"lecture_attendance":87.50,"campus_presence":80.00,"assignment_consistency":77.78,"quiz_accuracy":70.00,"gpa_factor":91.75}',
 '2025-02-26 12:00:00'),

(13, 4,
 62.50, 55.00, -1.00, 'medium', 7, 7, 'declining',
 '{"level":"medium","factors":["Low lecture attendance","Missing assignments"],"at_risk":true}',
 '[{"course":"Web Technologies","code":"IT-301","attendance":62.50,"reason":"Low attendance"}]',
 '[{"type":"attendance","priority":"high","message":"Attend more lectures to avoid shortage"},{"type":"assignment","priority":"high","message":"Submit assignments on time consistently"}]',
 '{"lecture_attendance":62.50,"campus_presence":65.00,"assignment_consistency":55.56,"quiz_accuracy":60.00,"gpa_factor":83.25}',
 '2025-02-26 12:00:00'),

(19, 4,
 88.40, 85.00, 6.00, 'high', 3, 3, 'improving',
 '{"level":"low","factors":[],"at_risk":false}',
 '[]',
 '[{"type":"general","priority":"low","message":"Great performance! Keep it up."}]',
 '{"lecture_attendance":87.50,"campus_presence":90.00,"assignment_consistency":88.89,"quiz_accuracy":80.00,"gpa_factor":100.00}',
 '2025-02-26 12:00:00'),

(23, 4,
 42.10, 30.00, -8.00, 'low', 10, 10, 'declining',
 '{"level":"high","factors":["Low lecture attendance","Missing assignments","Poor quiz performance","Low campus presence"],"at_risk":true}',
 '[{"course":"Web Technologies","code":"IT-301","attendance":37.50,"reason":"Low attendance"}]',
 '[{"type":"attendance","priority":"high","message":"Attend more lectures — shortage risk!"},{"type":"assignment","priority":"high","message":"Missing assignments will fail the course"},{"type":"subjects","priority":"high","message":"Focus on: Web Technologies"}]',
 '{"lecture_attendance":37.50,"campus_presence":40.00,"assignment_consistency":0.00,"quiz_accuracy":0.00,"gpa_factor":25.00}',
 '2025-02-26 12:00:00');


-- ── Chatbot Intents ──────────────────────────────────
INSERT INTO chatbot_intents
  (intent_name, description, category, example_queries, response_template, requires_auth, is_active)
VALUES
('check_attendance',
 'Student queries about their attendance percentage',
 'academic',
 '["What is my attendance?","Show my attendance","Am I short in attendance?","How many classes did I miss?"]',
 'Your attendance summary is available in your dashboard under the Attendance section.',
 TRUE, TRUE),

('check_fee',
 'Student queries about fee status and vouchers',
 'financial',
 '["What is my fee status?","Is my fee submitted?","Show my fee voucher","How much fee is due?"]',
 'You can check your fee status and vouchers in the Fee section of your student dashboard.',
 TRUE, TRUE),

('check_result',
 'Student queries about exam results and grades',
 'academic',
 '["What are my grades?","Show my result","What is my CGPA?","Did I pass?"]',
 'Your results and grades are available in the Results section. CGPA is auto-calculated.',
 TRUE, TRUE),

('check_schedule',
 'Student queries about class schedule and timetable',
 'academic',
 '["What is my schedule?","When is my next class?","Show timetable","What room is class in?"]',
 'Your class schedule is visible in each enrolled course on your dashboard.',
 TRUE, TRUE),

('assignment_info',
 'Student queries about assignments and deadlines',
 'academic',
 '["When is assignment due?","Show my assignments","What are the assignment requirements?","Did I submit assignment?"]',
 'Assignment details and deadlines are in each course under the Assignments tab.',
 TRUE, TRUE),

('quiz_info',
 'Student queries about quizzes',
 'academic',
 '["Is there a quiz today?","Show quiz schedule","How many quizzes are there?","Practice quiz"]',
 'You can view and attempt quizzes from your course page. AI practice quizzes are also available.',
 TRUE, TRUE),

('contact_teacher',
 'Student wants to contact teacher',
 'communication',
 '["How to contact teacher?","Teacher email?","Can I message teacher?"]',
 'Use the class group chat to message your teacher directly.',
 TRUE, TRUE),

('exam_schedule',
 'Student queries about exam dates',
 'academic',
 '["When is the exam?","Exam schedule?","Midterm date?","Final exam when?"]',
 'Exam schedules are announced via announcements and notice board. Check there for latest updates.',
 TRUE, TRUE),

('general_help',
 'General help and greeting',
 'general',
 '["Help","Hi","Hello","What can you do?","How to use LMS?"]',
 'I can help with attendance, fees, results, schedule, assignments, quizzes, and more. Just ask!',
 FALSE, TRUE);


-- ── Chatbot FAQs ─────────────────────────────────────
INSERT INTO chatbot_faqs
  (question, answer, category, tags, helpful_count, view_count, is_active)
VALUES
('How can I check my attendance percentage?',
 'Log in to your student dashboard and click on "Attendance" in the left sidebar. You will see attendance summary for each course including total classes, attended classes, and percentage. If your attendance falls below 75%, an alert will be shown.',
 'academic',
 '["attendance","percentage","dashboard"]',
 45, 120, TRUE),

('What happens if my attendance is below 75%?',
 'If your attendance drops below 75% in any course, you will receive an alert notification. You may be debarred from the final exam for that course. Contact your teacher immediately if you have valid reasons for absences.',
 'academic',
 '["attendance","shortage","exam","debarred"]',
 38, 95, TRUE),

('How do I submit my fee?',
 'Download your fee voucher from the Fee section in your dashboard. You can pay at any branch of HBL, MCB, or UBL using the voucher number. For online payment, use JazzCash or Easypaisa with the provided reference number.',
 'financial',
 '["fee","payment","voucher","bank"]',
 62, 180, TRUE),

('How is my CGPA calculated?',
 'CGPA is calculated based on all completed courses. Each course contributes based on credit hours and grade points: A+=4.0, A=4.0, A-=3.67, B+=3.33, B=3.0, B-=2.67, C+=2.33, C=2.0, D=1.0, F=0.0.',
 'academic',
 '["cgpa","gpa","grades","calculation"]',
 55, 160, TRUE),

('How to attempt an online quiz?',
 'Go to your course page and click on Quizzes tab. Click "Attempt Quiz" on any available quiz. Once started, answer all questions within the time limit and click Submit. Results are shown immediately after submission.',
 'academic',
 '["quiz","attempt","online","submit"]',
 41, 135, TRUE),

('How can I use the AI practice quiz?',
 'Go to AI Practice Quiz section in your dashboard. Select your course, enter a topic, choose difficulty level (easy/medium/hard), and click Generate. The AI will create MCQs for you to practice. After completion, you will see your score and weak areas.',
 'academic',
 '["ai quiz","practice","generate","mcq"]',
 30, 88, TRUE),

('What is the minimum passing grade?',
 'The minimum passing grade is D (50% marks). However, for graduation requirement, you need a minimum CGPA of 2.0. Courses with F grade must be repeated.',
 'academic',
 '["passing","grade","minimum","fail"]',
 48, 142, TRUE),

('How to join class group chat?',
 'You are automatically added to group chats for all your enrolled courses. Go to Chat section in your dashboard to see all your groups. You can message your classmates and teacher directly.',
 'communication',
 '["chat","group","message","teacher"]',
 25, 72, TRUE),

('Can I add or drop a course after registration?',
 'Yes, you can add or drop courses within the add/drop period specified in the academic calendar. Go to Course Registration and click Add/Drop. You need advisor approval for some changes.',
 'academic',
 '["add drop","course","registration","advisor"]',
 33, 98, TRUE),

('How to download my fee voucher?',
 'Login to your dashboard and go to Fee Management section. Click on the relevant semester voucher and click "Download Voucher" button. A PDF will be generated with all payment details.',
 'financial',
 '["voucher","download","fee","pdf"]',
 29, 85, TRUE);
-- =====================================================
-- SEED 17: AI QUIZZES + CAMPUS ATTENDANCE LOGS
-- =====================================================
USE AI_Driven_Smart_LMS;

-- ── AI Practice Quiz History ─────────────────────────
INSERT INTO ai_quizzes
  (student_id, course_id, topic, difficulty, questions_generated, student_answers, score, feedback, weak_areas_identified)
VALUES
(9, 7, 'JavaScript Basics', 'medium',
 '[{"id":1,"question":"What is a closure in JavaScript?","options":["A loop","A function with access to outer scope","A variable type","An event"],"correct_answer":"A function with access to outer scope","explanation":"Closures allow functions to access variables from outer scope even after execution."},{"id":2,"question":"What does DOM stand for?","options":["Document Object Model","Data Object Model","Document Order Model","Dynamic Object Model"],"correct_answer":"Document Object Model","explanation":"DOM is the Document Object Model, representing the HTML structure as objects."},{"id":3,"question":"Which method adds an element to the end of an array?","options":["push()","pop()","shift()","unshift()"],"correct_answer":"push()","explanation":"push() adds one or more elements to the end of an array."},{"id":4,"question":"What is the output of typeof null?","options":["null","undefined","object","string"],"correct_answer":"object","explanation":"typeof null returns object due to a historical JavaScript bug."},{"id":5,"question":"Which event fires when page loads?","options":["onload","onclick","onchange","onfocus"],"correct_answer":"onload","explanation":"onload event fires when the page has fully loaded."}]',
 '{"1":"A function with access to outer scope","2":"Document Object Model","3":"push()","4":"object","5":"onclick"}',
 80.00, 'Good performance! Review event handling.', '["Which event fires when page loads?"]'),

(10, 7, 'CSS Advanced', 'hard',
 '[{"id":1,"question":"What is specificity in CSS?","options":["Font weight","Priority of CSS rules","Page layout","Animation speed"],"correct_answer":"Priority of CSS rules","explanation":"Specificity determines which CSS rule is applied when multiple rules target the same element."},{"id":2,"question":"What is the z-index property?","options":["Horizontal position","Vertical position","Stack order","Opacity"],"correct_answer":"Stack order","explanation":"z-index controls the vertical stacking order of elements."},{"id":3,"question":"What does display: flex do?","options":["Hides element","Creates block element","Enables flexbox layout","Sets font size"],"correct_answer":"Enables flexbox layout","explanation":"display: flex turns an element into a flex container."},{"id":4,"question":"What is the CSS box model?","options":["Layout model","Color model","Grid model","Font model"],"correct_answer":"Layout model","explanation":"The CSS box model describes the rectangular boxes around elements."},{"id":5,"question":"What is a CSS pseudo-class?","options":["A fake class","A state-based selector","An HTML tag","A color value"],"correct_answer":"A state-based selector","explanation":"Pseudo-classes like :hover select elements based on state."}]',
 '{"1":"Priority of CSS rules","2":"Stack order","3":"Enables flexbox layout","4":"Layout model","5":"A state-based selector"}',
 100.00, 'Perfect! Outstanding CSS knowledge.', '[]'),

(11, 7, 'HTML Forms', 'easy',
 '[{"id":1,"question":"Which tag creates a form in HTML?","options":["<input>","<form>","<button>","<field>"],"correct_answer":"<form>","explanation":"The <form> tag creates an HTML form."},{"id":2,"question":"What attribute makes an input field required?","options":["mandatory","required","must","validate"],"correct_answer":"required","explanation":"The required attribute makes a field mandatory."},{"id":3,"question":"What type attribute creates a password field?","options":["hidden","text","password","secure"],"correct_answer":"password","explanation":"type=password creates a masked input field."}]',
 '{"1":"<form>","2":"required","3":"text"}',
 66.67, 'Review password field and input types.', '["What type attribute creates a password field?"]'),

(9, 8, 'IP Addressing', 'medium',
 '[{"id":1,"question":"How many classes of IP addresses are there?","options":["3","5","7","4"],"correct_answer":"5","explanation":"IPv4 addresses are divided into 5 classes: A, B, C, D, E."},{"id":2,"question":"What is a subnet mask?","options":["IP address range","Network identifier","Device name","Gateway address"],"correct_answer":"Network identifier","explanation":"Subnet mask identifies which part of an IP is the network address."},{"id":3,"question":"What is the loopback address?","options":["192.168.1.1","10.0.0.1","127.0.0.1","172.16.0.1"],"correct_answer":"127.0.0.1","explanation":"127.0.0.1 is the loopback address used to test network software."}]',
 '{"1":"5","2":"Network identifier","3":"127.0.0.1"}',
 100.00, 'Excellent! Perfect score on IP addressing.', '[]');


-- ── Campus Attendance Logs ───────────────────────────
-- Entry logs for main students (Feb 2025)
INSERT INTO campus_attendance
  (student_id, gate_id, camera_id, entry_time, exit_time, entry_direction,
   face_match_confidence, processing_time_ms, spoof_check_passed, liveness_score,
   is_duplicate_filtered, manual_override)
VALUES
-- Student 9 (Ali) - Regular attendee
(9, 1, 1, '2025-02-03 07:45:00', '2025-02-03 14:30:00', 'in',  96.50, 245, TRUE, 0.92, FALSE, FALSE),
(9, 1, 1, '2025-02-04 08:10:00', '2025-02-04 13:45:00', 'in',  97.20, 231, TRUE, 0.94, FALSE, FALSE),
(9, 1, 1, '2025-02-05 07:55:00', '2025-02-05 14:00:00', 'in',  96.90, 252, TRUE, 0.93, FALSE, FALSE),
(9, 1, 1, '2025-02-06 08:05:00', '2025-02-06 15:30:00', 'in',  95.60, 248, TRUE, 0.90, FALSE, FALSE),
(9, 1, 1, '2025-02-10 07:50:00', '2025-02-10 14:20:00', 'in',  97.10, 239, TRUE, 0.92, FALSE, FALSE),
(9, 1, 1, '2025-02-11 08:00:00', '2025-02-11 13:30:00', 'in',  96.30, 244, TRUE, 0.91, FALSE, FALSE),
(9, 1, 1, '2025-02-12 08:15:00', '2025-02-12 14:45:00', 'in',  97.50, 235, TRUE, 0.95, FALSE, FALSE),
(9, 1, 1, '2025-02-13 07:45:00', '2025-02-13 13:00:00', 'in',  96.80, 241, TRUE, 0.93, FALSE, FALSE),
(9, 1, 1, '2025-02-17 08:00:00', '2025-02-17 14:30:00', 'in',  97.00, 237, TRUE, 0.92, FALSE, FALSE),
(9, 1, 1, '2025-02-18 08:20:00', '2025-02-18 15:00:00', 'in',  96.40, 250, TRUE, 0.90, FALSE, FALSE),
(9, 1, 1, '2025-02-19 07:55:00', '2025-02-19 14:15:00', 'in',  97.30, 243, TRUE, 0.94, FALSE, FALSE),

-- Student 10 (Sara) - Very regular
(10, 1, 1, '2025-02-03 07:30:00', '2025-02-03 15:00:00', 'in', 98.20, 220, TRUE, 0.97, FALSE, FALSE),
(10, 1, 1, '2025-02-04 07:35:00', '2025-02-04 14:30:00', 'in', 97.80, 225, TRUE, 0.96, FALSE, FALSE),
(10, 1, 1, '2025-02-05 07:40:00', '2025-02-05 15:10:00', 'in', 98.50, 218, TRUE, 0.98, FALSE, FALSE),
(10, 1, 1, '2025-02-06 07:25:00', '2025-02-06 14:45:00', 'in', 98.10, 222, TRUE, 0.97, FALSE, FALSE),
(10, 1, 1, '2025-02-10 07:45:00', '2025-02-10 15:20:00', 'in', 97.90, 228, TRUE, 0.96, FALSE, FALSE),
(10, 1, 1, '2025-02-11 07:30:00', '2025-02-11 14:00:00', 'in', 98.30, 219, TRUE, 0.97, FALSE, FALSE),
(10, 1, 1, '2025-02-12 07:50:00', '2025-02-12 15:30:00', 'in', 98.00, 224, TRUE, 0.96, FALSE, FALSE),

-- Student 11 (Usman) - Irregular
(11, 1, 1, '2025-02-03 09:15:00', '2025-02-03 12:30:00', 'in', 94.30, 265, TRUE, 0.88, FALSE, FALSE),
(11, 1, 1, '2025-02-06 10:00:00', '2025-02-06 13:00:00', 'in', 93.80, 270, TRUE, 0.87, FALSE, FALSE),
(11, 1, 1, '2025-02-11 11:30:00', '2025-02-11 14:00:00', 'in', 94.50, 260, TRUE, 0.89, FALSE, FALSE),
(11, 1, 1, '2025-02-13 09:45:00', '2025-02-13 12:15:00', 'in', 93.60, 268, TRUE, 0.86, FALSE, FALSE),

-- Student 23 (Danish) - Very irregular / problematic
(23, 1, 1, '2025-02-05 11:00:00', '2025-02-05 13:00:00', 'in', 92.10, 280, TRUE, 0.85, FALSE, FALSE),
(23, 1, 1, '2025-02-13 10:30:00', '2025-02-13 12:30:00', 'in', 91.80, 285, TRUE, 0.84, FALSE, FALSE);


-- ── Face Recognition Attempt Logs ────────────────────
INSERT INTO face_recognition_logs
  (student_id, gate_id, camera_id, confidence, match_success, processing_time_ms, spoof_check_passed, liveness_score)
VALUES
(9,    1, 1, 96.50, TRUE,  245, TRUE, 0.92),
(10,   1, 1, 98.20, TRUE,  220, TRUE, 0.97),
(11,   1, 1, 94.30, TRUE,  265, TRUE, 0.88),
(NULL, 1, 1, 45.20, FALSE, 312, FALSE, 0.42),
(NULL, 1, 1, 38.50, FALSE, 325, TRUE,  0.35),
(9,    1, 1, 97.20, TRUE,  231, TRUE, 0.94),
(23,   1, 1, 92.10, TRUE,  280, TRUE, 0.85);

SET FOREIGN_KEY_CHECKS = 1;

-- ── Verify Data ──────────────────────────────────────
SELECT 'departments'              AS table_name, COUNT(*) AS records FROM departments
UNION ALL
SELECT 'programs',                               COUNT(*) FROM programs
UNION ALL
SELECT 'semesters',                              COUNT(*) FROM semesters
UNION ALL
SELECT 'courses',                                COUNT(*) FROM courses
UNION ALL
SELECT 'users',                                  COUNT(*) FROM users
UNION ALL
SELECT 'student_profiles',                       COUNT(*) FROM student_profiles
UNION ALL
SELECT 'teacher_profiles',                       COUNT(*) FROM teacher_profiles
UNION ALL
SELECT 'course_offerings',                       COUNT(*) FROM course_offerings
UNION ALL
SELECT 'enrollments',                            COUNT(*) FROM enrollments
UNION ALL
SELECT 'lecture_sessions',                       COUNT(*) FROM lecture_sessions
UNION ALL
SELECT 'lecture_attendance',                     COUNT(*) FROM lecture_attendance
UNION ALL
SELECT 'campus_gates',                           COUNT(*) FROM campus_gates
UNION ALL
SELECT 'campus_attendance',                      COUNT(*) FROM campus_attendance
UNION ALL
SELECT 'assignments',                            COUNT(*) FROM assignments
UNION ALL
SELECT 'assignment_submissions',                 COUNT(*) FROM assignment_submissions
UNION ALL
SELECT 'quizzes',                                COUNT(*) FROM quizzes
UNION ALL
SELECT 'quiz_questions',                         COUNT(*) FROM quiz_questions
UNION ALL
SELECT 'quiz_attempts',                          COUNT(*) FROM quiz_attempts
UNION ALL
SELECT 'exams',                                  COUNT(*) FROM exams
UNION ALL
SELECT 'exam_results',                           COUNT(*) FROM exam_results
UNION ALL
SELECT 'fee_structure',                          COUNT(*) FROM fee_structure
UNION ALL
SELECT 'fee_vouchers',                           COUNT(*) FROM fee_vouchers
UNION ALL
SELECT 'fee_payments',                           COUNT(*) FROM fee_payments
UNION ALL
SELECT 'announcements',                          COUNT(*) FROM announcements
UNION ALL
SELECT 'notice_board',                           COUNT(*) FROM notice_board
UNION ALL
SELECT 'chat_groups',                            COUNT(*) FROM chat_groups
UNION ALL
SELECT 'messages',                               COUNT(*) FROM messages
UNION ALL
SELECT 'student_performance_scores',             COUNT(*) FROM student_performance_scores
UNION ALL
SELECT 'chatbot_intents',                        COUNT(*) FROM chatbot_intents
UNION ALL
SELECT 'chatbot_faqs',                           COUNT(*) FROM chatbot_faqs
UNION ALL
SELECT 'ai_quizzes',                             COUNT(*) FROM ai_quizzes;
