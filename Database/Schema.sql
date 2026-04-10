-- =====================================================
-- DATABASE: lms_system (LEARNING MANAGEMENT SYSTEM)
-- =====================================================
CREATE DATABASE IF NOT EXISTS AI_Driven_SMart_LMS;
USE AI_Driven_SMart_LMS;

-- =====================================================
-- 1. USERS & AUTHENTICATION TABLES
-- =====================================================

-- Users master table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    roll_number VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    face_embedding BLOB, 
    face_enrolled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_roll (roll_number),
    INDEX idx_role (role)
);

-- Student profiles (extends users)
CREATE TABLE student_profiles (
    user_id INT PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    father_name VARCHAR(100),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    cnic VARCHAR(15) UNIQUE,
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    current_address TEXT,
    permanent_address TEXT,
    city VARCHAR(50),
    guardian_phone VARCHAR(20),
    guardian_cnic VARCHAR(15),
    guardian_relation VARCHAR(50),
    profile_picture_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_cnic (cnic),
    INDEX idx_registration (registration_number)
);

-- Teacher profiles (extends users)
CREATE TABLE teacher_profiles (
    user_id INT PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    designation VARCHAR(100),
    qualification TEXT,
    specialization VARCHAR(200),
    joining_date DATE,
    phone VARCHAR(20),
    email VARCHAR(100),
    cnic VARCHAR(15),
    address TEXT,
    profile_picture_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id)
);

-- Admin/Security profiles
CREATE TABLE admin_profiles (
    user_id INT PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    designation VARCHAR(100),
    phone VARCHAR(20),
    email_official VARCHAR(100),
    profile_picture_url TEXT NULL,
    role_type ENUM('admin', 'security_admin', 'gate_operator') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 2. ACADEMIC STRUCTURE TABLES
-- =====================================================

-- Departments
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    head_of_department INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (head_of_department) REFERENCES teacher_profiles(user_id),
    INDEX idx_dept_code (code)
);

-- Programs (e.g., BS CS, BBA, etc.)
CREATE TABLE programs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    department_id INT NOT NULL,
    duration_years INT DEFAULT 4,
    total_credit_hours INT,
    degree_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_program_code (code)
);

-- Semesters
CREATE TABLE semesters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    registration_start DATE,
    registration_end DATE,
    add_drop_last_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, end_date)
);

-- Courses/Subjects
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    credit_hours INT NOT NULL,
    lecture_hours INT DEFAULT 0,
    lab_hours INT DEFAULT 0,
    description TEXT,
    syllabus TEXT, -- Course outline
    department_id INT NOT NULL,
    program_id INT,
    semester_level INT,
    is_elective BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (program_id) REFERENCES programs(id),
    INDEX idx_code (code),
    INDEX idx_department (department_id)
);

-- Course Learning Outcomes (CLOs)
CREATE TABLE course_clos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    clo_number VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    domain VARCHAR(50),
    level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_clo (course_id, clo_number)
);

-- =====================================================
-- 3. COURSE OFFERING & ENROLLMENT
-- =====================================================

-- Course offerings (specific semester)
CREATE TABLE course_offerings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    semester_id INT NOT NULL,
    instructor_id INT NOT NULL,
    section VARCHAR(10) NOT NULL,
    max_students INT DEFAULT 50,
    enrolled_students INT DEFAULT 0,
    room_number VARCHAR(50),
    lab_number VARCHAR(50),
    schedule_json JSON,
    online_meet_link TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id),
    FOREIGN KEY (instructor_id) REFERENCES teacher_profiles(user_id),
    UNIQUE KEY unique_course_section (course_id, semester_id, section),
    INDEX idx_instructor (instructor_id),
    INDEX idx_semester (semester_id)
);

-- Student enrollment
CREATE TABLE enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    offering_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('enrolled', 'dropped', 'completed', 'failed') DEFAULT 'enrolled',
    grade_letter VARCHAR(2) NULL,
    grade_points DECIMAL(3,2) NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    advisor_remarks TEXT,
    advisor_approval_requested BOOLEAN DEFAULT FALSE,
    advisor_approval_date TIMESTAMP NULL,
    advisor_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (offering_id) REFERENCES course_offerings(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    UNIQUE KEY unique_enrollment (student_id, offering_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
);

-- Student program enrollment
CREATE TABLE student_program_enrollment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    program_id INT NOT NULL,
    batch_year INT NOT NULL,
    enrollment_semester_id INT NOT NULL,
    current_semester INT DEFAULT 1,
    status ENUM('active', 'graduated', 'suspended', 'withdrawn') DEFAULT 'active',
    advisor_id INT,
    enrollment_date DATE NOT NULL,
    expected_graduation DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (program_id) REFERENCES programs(id),
    FOREIGN KEY (enrollment_semester_id) REFERENCES semesters(id),
    FOREIGN KEY (advisor_id) REFERENCES teacher_profiles(user_id),
    INDEX idx_student_program (student_id, program_id)
);

-- =====================================================
-- 4. ATTENDANCE SYSTEM (TWO-LEVEL)
-- =====================================================

-- Lecture sessions
CREATE TABLE lecture_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    offering_id INT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    topic VARCHAR(200),
    session_type ENUM('lecture', 'lab', 'tutorial') DEFAULT 'lecture',
    is_makeup BOOLEAN DEFAULT FALSE,
    makeup_of_session INT NULL,
    attendance_marked BOOLEAN DEFAULT FALSE,
    marked_by INT,
    marked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (offering_id) REFERENCES course_offerings(id),
    FOREIGN KEY (makeup_of_session) REFERENCES lecture_sessions(id),
    FOREIGN KEY (marked_by) REFERENCES users(id),
    INDEX idx_offering_date (offering_id, session_date)
);

-- Lecture attendance (Level 1 - Manual/Teacher Controlled)
CREATE TABLE lecture_attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'absent',
    marked_by INT NOT NULL,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    FOREIGN KEY (session_id) REFERENCES lecture_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (marked_by) REFERENCES users(id),
    UNIQUE KEY unique_session_student (session_id, student_id),
    INDEX idx_student (student_id)
);

-- =====================================================
-- 5. CAMPUS GATE & CAMERA MANAGEMENT (NEW)
-- =====================================================

-- Campus gates master table
CREATE TABLE campus_gates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    gate_name VARCHAR(100) NOT NULL,
    gate_code VARCHAR(50) UNIQUE NOT NULL,
    gate_type ENUM('main', 'department', 'lab', 'library', 'hostel') DEFAULT 'main',
    department_id INT NULL,
    location_description TEXT,
    ip_address VARCHAR(45),
    mac_address VARCHAR(17),
    device_model VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_ping TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_gate_code (gate_code),
    INDEX idx_active (is_active),
    INDEX idx_department (department_id)
);

-- Cameras attached to gates
CREATE TABLE gate_cameras (
    id INT PRIMARY KEY AUTO_INCREMENT,
    gate_id INT NOT NULL,
    camera_name VARCHAR(100) NOT NULL,
    camera_ip VARCHAR(45),
    rtsp_url TEXT,
    camera_type ENUM('entry', 'exit', 'both') DEFAULT 'both',
    coverage_area VARCHAR(255),
    angle VARCHAR(50),
    resolution VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    last_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (gate_id) REFERENCES campus_gates(id) ON DELETE CASCADE,
    INDEX idx_gate (gate_id),
    INDEX idx_status (status)
);

-- Gate operational schedules
CREATE TABLE gate_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    gate_id INT NOT NULL,
    day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_holiday BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gate_id) REFERENCES campus_gates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_gate_day (gate_id, day_of_week)
);

-- Campus entry attendance (Level 2 - AI Face Recognition)
CREATE TABLE campus_attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    gate_id INT NOT NULL,
    camera_id INT NOT NULL,
    entry_time TIMESTAMP NOT NULL,
    exit_time TIMESTAMP NULL,
    entry_direction ENUM('in', 'out') DEFAULT 'in',
    face_match_confidence DECIMAL(5,2) NOT NULL,
    processing_time_ms INT,
    spoof_check_passed BOOLEAN DEFAULT TRUE,
    liveness_score DECIMAL(5,2),
    raw_image_path TEXT,
    processed_image_path TEXT,
    is_duplicate_filtered BOOLEAN DEFAULT FALSE,
    manual_override BOOLEAN DEFAULT FALSE,
    override_by INT NULL,
    override_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (gate_id) REFERENCES campus_gates(id),
    FOREIGN KEY (camera_id) REFERENCES gate_cameras(id),
    FOREIGN KEY (override_by) REFERENCES users(id),
    INDEX idx_student_date (student_id, entry_time),
    INDEX idx_gate (gate_id),
    INDEX idx_direction (entry_direction)
);

-- Face recognition attempt logs
CREATE TABLE face_recognition_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NULL,
    gate_id INT NOT NULL,
    camera_id INT NOT NULL,
    confidence DECIMAL(5,2),
    match_success BOOLEAN DEFAULT FALSE,
    processing_time_ms INT,
    spoof_check_passed BOOLEAN DEFAULT TRUE,
    liveness_score DECIMAL(5,2),
    face_image_path TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (gate_id) REFERENCES campus_gates(id),
    FOREIGN KEY (camera_id) REFERENCES gate_cameras(id),
    INDEX idx_student (student_id),
    INDEX idx_gate_time (gate_id, created_at),
    INDEX idx_success (match_success)
);

-- Camera health monitoring
CREATE TABLE camera_health_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    camera_id INT NOT NULL,
    status ENUM('online', 'offline', 'degraded') NOT NULL,
    ping_time INT,
    error_message TEXT,
    frame_rate DECIMAL(5,2),
    temperature DECIMAL(5,2),
    storage_available BIGINT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES gate_cameras(id) ON DELETE CASCADE,
    INDEX idx_camera_time (camera_id, checked_at)
);

-- Gate access logs (manual operations)
CREATE TABLE gate_access_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    gate_id INT NOT NULL,
    accessed_by INT NOT NULL,
    access_type ENUM('manual_override', 'maintenance', 'configuration') NOT NULL,
    reason TEXT,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gate_id) REFERENCES campus_gates(id),
    FOREIGN KEY (accessed_by) REFERENCES users(id),
    INDEX idx_gate_time (gate_id, accessed_at)
);

-- Daily attendance summary
CREATE TABLE attendance_summary (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    offering_id INT NOT NULL,
    total_classes INT DEFAULT 0,
    attended_classes INT DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    min_percentage_required DECIMAL(5,2) DEFAULT 75,
    alert_triggered BOOLEAN DEFAULT FALSE,
    short_alert_sent BOOLEAN DEFAULT FALSE,
    alert_sent_at TIMESTAMP NULL,
    last_updated DATE,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (offering_id) REFERENCES course_offerings(id),
    UNIQUE KEY unique_student_course (student_id, offering_id),
    INDEX idx_percentage (percentage)
);

-- =====================================================
-- 6. ASSESSMENT MODULE
-- =====================================================

-- Assignments
CREATE TABLE assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    offering_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    total_marks INT NOT NULL,
    weightage_percent DECIMAL(5,2) DEFAULT 0,
    due_date DATETIME NOT NULL,
    file_required BOOLEAN DEFAULT TRUE,
    max_file_size INT DEFAULT 10,
    allowed_file_types VARCHAR(255) DEFAULT '.pdf,.docx,.zip',
    plagiarism_check BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (offering_id) REFERENCES course_offerings(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_offering (offering_id),
    INDEX idx_due_date (due_date)
);

-- Assignment submissions
CREATE TABLE assignment_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT NOT NULL,
    remarks TEXT,
    obtained_marks DECIMAL(7,2) NULL,
    feedback TEXT,
    plagiarism_percentage DECIMAL(5,2) NULL,
    plagiarism_report_url TEXT,
    plagiarism_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    plagiarism_data JSON,
    graded_by INT,
    graded_at TIMESTAMP NULL,
    status ENUM('submitted', 'late', 'graded', 'resubmit') DEFAULT 'submitted',
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (graded_by) REFERENCES users(id),
    UNIQUE KEY unique_submission (assignment_id, student_id),
    INDEX idx_student (student_id)
);

-- Quizzes
CREATE TABLE quizzes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    offering_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    quiz_type ENUM('teacher', 'ai_generated') DEFAULT 'teacher',
    total_questions INT NOT NULL,
    total_marks INT NOT NULL,
    time_limit_minutes INT,
    start_time DATETIME,
    end_time DATETIME,
    is_mandatory BOOLEAN DEFAULT TRUE,
    auto_grading BOOLEAN DEFAULT TRUE,
    shuffle_questions BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (offering_id) REFERENCES course_offerings(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_offering (offering_id)
);

-- Quiz questions
CREATE TABLE quiz_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('mcq', 'true_false', 'short') DEFAULT 'mcq',
    options JSON,
    correct_answer VARCHAR(500),
    marks INT DEFAULT 1,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_quiz (quiz_id)
);

-- Quiz attempts
CREATE TABLE quiz_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    score DECIMAL(7,2) DEFAULT 0,
    total_marks INT,
    percentage DECIMAL(5,2),
    answers JSON,
    status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    UNIQUE KEY unique_attempt (quiz_id, student_id),
    INDEX idx_student (student_id)
);

-- AI Generated Quizzes (for practice)
CREATE TABLE ai_quizzes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NULL,
    topic VARCHAR(200),
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    questions_generated JSON,
    student_answers JSON,
    score DECIMAL(5,2),
    feedback TEXT,
    weak_areas_identified JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    INDEX idx_student_course (student_id, course_id)
);

-- Exams (Midterm/Final)
CREATE TABLE exams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    offering_id INT NOT NULL,
    exam_type ENUM('midterm', 'final', 'special') NOT NULL,
    title VARCHAR(200) NOT NULL,
    total_marks INT NOT NULL,
    weightage_percent DECIMAL(5,2) NOT NULL,
    exam_date DATE,
    start_time TIME,
    end_time TIME,
    room_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (offering_id) REFERENCES course_offerings(id),
    INDEX idx_offering (offering_id)
);

-- Exam results
CREATE TABLE exam_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    obtained_marks DECIMAL(7,2) NOT NULL,
    grade VARCHAR(2),
    remarks TEXT,
    entered_by INT NOT NULL,
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (entered_by) REFERENCES users(id),
    UNIQUE KEY unique_exam_student (exam_id, student_id)
);

-- CLO Assessment Mapping
CREATE TABLE clo_assessment_mapping (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clo_id INT NOT NULL,
    assessment_type ENUM('assignment', 'quiz', 'exam') NOT NULL,
    assessment_id INT NOT NULL,
    weightage DECIMAL(5,2),
    FOREIGN KEY (clo_id) REFERENCES course_clos(id) ON DELETE CASCADE,
    INDEX idx_clo (clo_id)
);

-- =====================================================
-- 7. FEE MANAGEMENT
-- =====================================================

-- Fee structure
CREATE TABLE fee_structure (
    id INT PRIMARY KEY AUTO_INCREMENT,
    program_id INT NOT NULL,
    semester_number INT NOT NULL,
    tuition_fee DECIMAL(10,2) NOT NULL,
    admission_fee DECIMAL(10,2) DEFAULT 0,
    library_fee DECIMAL(10,2) DEFAULT 0,
    sports_fee DECIMAL(10,2) DEFAULT 0,
    other_fees JSON,
    total_fee DECIMAL(10,2) GENERATED ALWAYS AS (tuition_fee + admission_fee + library_fee + sports_fee) STORED,
    valid_from DATE NOT NULL,
    valid_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id),
    INDEX idx_program_semester (program_id, semester_number)
);

-- Fee vouchers
CREATE TABLE fee_vouchers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    voucher_number VARCHAR(50) UNIQUE NOT NULL,
    semester_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    issue_date DATE NOT NULL,
    status ENUM('paid', 'unpaid', 'partial', 'overdue') DEFAULT 'unpaid',
    fine_amount DECIMAL(10,2) DEFAULT 0,
    fine_calculated_at DATE,
    payment_date DATE NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    online_payment_data JSON,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id),
    INDEX idx_student (student_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
);

-- Fee payment history
CREATE TABLE fee_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    voucher_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('cash', 'bank_transfer', 'credit_card', 'online', 'cheque') NOT NULL,
    reference_number VARCHAR(100),
    bank_name VARCHAR(100),
    received_by INT,
    receipt_number VARCHAR(50) UNIQUE,
    FOREIGN KEY (voucher_id) REFERENCES fee_vouchers(id),
    FOREIGN KEY (received_by) REFERENCES users(id),
    INDEX idx_voucher (voucher_id)
);

-- =====================================================
-- 8. COMMUNICATION SYSTEM
-- =====================================================

-- Announcements
CREATE TABLE announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_by INT NOT NULL,
    target_type ENUM('all', 'department', 'program', 'course', 'section') DEFAULT 'all',
    target_id INT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    attachment_url TEXT,
    pinned_until DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created (created_at)
);

-- Notice board
CREATE TABLE notice_board (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    target_audience ENUM('all', 'students', 'teachers', 'staff') NOT NULL DEFAULT 'all',
    posted_by INT NOT NULL,
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    file_attachments JSON,
    is_public BOOLEAN DEFAULT TRUE,
    views INT DEFAULT 0,
    FOREIGN KEY (posted_by) REFERENCES users(id),
    INDEX idx_expiry (expiry_date)
);

-- Chat groups
CREATE TABLE chat_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    group_type ENUM('class', 'department', 'project', 'general') DEFAULT 'class',
    offering_id INT NULL,
    created_by INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    moderation_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (offering_id) REFERENCES course_offerings(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_type (group_type)
);

-- Chat group members
CREATE TABLE chat_group_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('member', 'monitor', 'teacher', 'admin') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_muted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_member (group_id, user_id)
);

-- Messages
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    attachment_url TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by INT NULL,
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    INDEX idx_group (group_id),
    INDEX idx_sent_at (sent_at)
);

-- =====================================================
-- 9. AI ANALYTICS & SCORING
-- =====================================================

-- Student performance scores
CREATE TABLE student_performance_scores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    semester_id INT NOT NULL,
    academic_score DECIMAL(5,2) DEFAULT 0,
    consistency_index DECIMAL(5,2) DEFAULT 0,
    improvement_index DECIMAL(5,2) DEFAULT 0,
    engagement_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    class_rank INT,
    section_rank INT,
    risk_prediction JSON,
    weak_subjects JSON,
    recommendations JSON,
    score_breakdown JSON,
    trend_direction ENUM('improving', 'stable', 'declining') DEFAULT 'stable',
    recommendations_generated_at TIMESTAMP NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id),
    UNIQUE KEY unique_student_semester (student_id, semester_id),
    INDEX idx_scores (academic_score),
    INDEX idx_rank (class_rank)
);

-- =====================================================
-- 10. CHATBOT SYSTEM (SIMPLIFIED)
-- =====================================================

-- Chatbot intents
CREATE TABLE chatbot_intents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    intent_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50),
    example_queries JSON,
    response_template TEXT,
    requires_auth BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active)
);

-- Chatbot conversations
CREATE TABLE chatbot_conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'ended') DEFAULT 'active',
    context_data JSON,
    total_messages INT DEFAULT 0,
    feedback_rating INT NULL,
    feedback_text TEXT,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_session (session_id),
    INDEX idx_status (status)
);

-- Chatbot messages
CREATE TABLE chatbot_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    sender ENUM('student', 'bot') NOT NULL,
    message TEXT NOT NULL,
    intent_id INT,
    confidence DECIMAL(4,3),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_time_ms INT,
    metadata JSON,
    FOREIGN KEY (conversation_id) REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (intent_id) REFERENCES chatbot_intents(id),
    INDEX idx_conversation (conversation_id),
    INDEX idx_timestamp (timestamp)
);

-- Chatbot FAQs
CREATE TABLE chatbot_faqs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50),
    tags JSON,
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    FULLTEXT INDEX idx_search (question, answer)
);

-- Student chatbot preferences
CREATE TABLE chatbot_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL UNIQUE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_enabled BOOLEAN DEFAULT TRUE,
    quick_access_topics JSON,
    last_active TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student (student_id)
);

-- =====================================================
-- 11. SYSTEM LOGS & AUDIT
-- =====================================================

-- Activity logs
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
);

-- =====================================================
-- 12. PERFORMANCE INDEXES
-- =====================================================

CREATE INDEX idx_enrollments_student_status ON enrollments(student_id, status);
CREATE INDEX idx_attendance_session ON lecture_attendance(session_id, status);
CREATE INDEX idx_campus_attendance_date ON campus_attendance(entry_time);
CREATE INDEX idx_attendance_summary_lookup ON attendance_summary(student_id, offering_id, percentage);
CREATE INDEX idx_fee_vouchers_student_status ON fee_vouchers(student_id, status);
CREATE INDEX idx_fee_due_notifications ON fee_vouchers(due_date, status); 
CREATE INDEX idx_messages_group_sent ON messages(group_id, sent_at);

-- =====================================================
-- DATABASE CREATION COMPLETE
-- =====================================================