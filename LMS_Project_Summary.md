# AI-Driven Smart LMS — Complete Project Summary
> **Purpose:** Yeh file frontend code dekhay baghair poora system samajhne ke liye hai.  
> **Stack:** FastAPI (Python) + MySQL + React (Vite) | Base API URL: `/api/v1`

---

## 1. SYSTEM OVERVIEW

| Component | Detail |
|---|---|
| **Database** | `AI_Driven_Smart_LMS` (MySQL) |
| **Backend** | FastAPI, SQLAlchemy ORM, JWT Auth |
| **Frontend Portals** | 3 portals: Admin, Teacher, Student |
| **AI Layer** | Gemini 2.5 Flash (Chatbot), HuggingFace Embeddings + FAISS (RAG), Dlib (Face Recognition), Custom Analytics Engine |
| **WebSocket** | Real-time chat via `/ws/chat/{group_id}` |

---

## 2. AUTHENTICATION SYSTEM

### Endpoints (`/api/v1/auth/`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Email+Password login → returns JWT tokens |
| POST | `/auth/face-login` | Public | Base64 image → face match → JWT tokens |
| POST | `/auth/enroll-face` | Any logged-in user | Enroll own face embedding |
| GET | `/auth/profile` | Any logged-in user | Get own full profile |
| PUT | `/auth/profile` | Any logged-in user | Update own profile |
| POST | `/auth/profile/upload-picture` | Any logged-in user | Upload avatar image |
| POST | `/auth/change-password` | Any logged-in user | Change password |
| POST | `/auth/refresh-token` | Public | Refresh access token |

### JWT Flow
- Access Token: 60 min expiry
- Refresh Token: 7 days expiry
- Frontend stores both in `localStorage`
- Axios interceptor auto-refreshes on 401

### Roles
- `admin` — full system access
- `teacher` — course/assessment management
- `student` — read + own submissions

---

## 3. DATABASE MODELS (Tables)

### User & Auth Tables
| Table | Purpose |
|---|---|
| `users` | Master user table (all roles), stores `face_embedding` BLOB |
| `student_profiles` | Student personal info (name, CNIC, guardian etc.) |
| `teacher_profiles` | Teacher professional info (employee_id, designation etc.) |
| `admin_profiles` | Admin/security staff info |

### Academic Structure
| Table | Purpose |
|---|---|
| `departments` | Departments (CS, BBA etc.) |
| `programs` | Degree programs (BS CS, BBA etc.) |
| `semesters` | Semesters with start/end dates, `is_active` flag |
| `courses` | Course definitions with credit hours, CLOs |
| `course_clos` | Course Learning Outcomes per course |

### Enrollment
| Table | Purpose |
|---|---|
| `course_offerings` | Course + Semester + Teacher + Section combo |
| `enrollments` | Student ↔ Offering mapping, grades, status |
| `student_program_enrollment` | Student ↔ Program mapping, CGPA tracking |

### Attendance (Two-Level System)
| Table | Purpose |
|---|---|
| `lecture_sessions` | Individual class sessions per offering |
| `lecture_attendance` | Per-session attendance (present/absent/late/excused) |
| `attendance_summary` | Aggregate % per student per offering (auto-updated) |
| `campus_gates` | Physical campus gates |
| `gate_cameras` | Cameras attached to gates |
| `gate_schedules` | Weekly open/close schedule per gate |
| `campus_attendance` | Face-recognition based campus entry/exit logs |
| `face_recognition_logs` | Every face scan attempt (success/fail) |
| `gate_access_logs` | Manual gate operations log |

### Assessment
| Table | Purpose |
|---|---|
| `assignments` | Teacher-created assignments |
| `assignment_submissions` | Student file submissions + grades |
| `quizzes` | Teacher-created quizzes |
| `quiz_questions` | MCQ/True-False/Short questions |
| `quiz_attempts` | Student quiz attempts + scores |
| `ai_quizzes` | Gemini-generated practice quizzes per student |
| `exams` | Midterm/Final/Special exams |
| `exam_results` | Student exam marks + grades |

### Fee Management
| Table | Purpose |
|---|---|
| `fee_structure` | Fee breakdown per program per semester |
| `fee_vouchers` | Generated payment vouchers per student |
| `fee_payments` | Actual payment records (partial/full) |

### Communication
| Table | Purpose |
|---|---|
| `announcements` | Targeted announcements (all/dept/program/course) |
| `notice_board` | General notices with expiry dates |
| `chat_groups` | Course-linked or general chat groups |
| `chat_group_members` | Group membership with roles |
| `messages` | Chat messages (text/image/file) |

### AI & Analytics
| Table | Purpose |
|---|---|
| `student_performance_scores` | Calculated AI scores per student per semester |
| `chatbot_intents` | (Legacy) Chatbot intent definitions |
| `chatbot_conversations` | Chat sessions per student |
| `chatbot_messages` | Individual chatbot messages |
| `chatbot_faqs` | FAQ knowledge base for RAG |
| `chatbot_preferences` | Per-student chatbot settings |
| `activity_logs` | System-wide audit trail |

---

## 4. ADMIN PORTAL

### What Admin Can Do
- Full CRUD on all entities
- Manage students, teachers
- Academic structure (departments, programs, semesters, courses)
- Course offerings & enrollments
- Fee structure, voucher generation, payment recording
- Campus gates & cameras management
- Face recognition enrollment (for any student)
- Announcements & Notices
- AI Analytics (calculate/view scores, leaderboard)
- FAQ management for chatbot

### Admin API Calls Used (from `admin.api.js`)

#### Students
| API Call | Endpoint | Method |
|---|---|---|
| `getStudents(page, per_page, search)` | `/students` | GET |
| `getStudent(id)` | `/students/:id` | GET |
| `createStudent(data)` | `/students` | POST |
| `updateStudent(id, data)` | `/students/:id` | PUT |
| `toggleStudentStatus(id)` | `/students/:id/status` | PATCH |
| `deleteStudent(id)` | `/students/:id` | DELETE |

#### Teachers
| API Call | Endpoint | Method |
|---|---|---|
| `getTeachers(page, per_page, search)` | `/teachers` | GET |
| `getTeacher(id)` | `/teachers/:id` | GET |
| `createTeacher(data)` | `/teachers` | POST |
| `updateTeacher(id, data)` | `/teachers/:id` | PUT |
| `toggleTeacherStatus(id)` | `/teachers/:id/status` | PATCH |
| `deleteTeacher(id)` | `/teachers/:id` | DELETE |

#### Academic Structure
| API Call | Endpoint | Method |
|---|---|---|
| `getDepartments()` | `/departments` | GET |
| `createDepartment(data)` | `/departments` | POST |
| `updateDepartment(id, data)` | `/departments/:id` | PUT |
| `deleteDepartment(id)` | `/departments/:id` | DELETE |
| `getPrograms()` | `/programs` | GET |
| `createProgram(data)` | `/programs` | POST |
| `getSemesters()` | `/semesters` | GET |
| `activateSemester(id)` | `/semesters/:id/activate` | PATCH |
| `createSemester(data)` | `/semesters` | POST |
| `getCourses(params)` | `/courses` | GET |
| `createCourse(data)` | `/courses` | POST |
| `getCourseCLOs(id)` | `/courses/:id/clos` | GET |
| `createCLO(courseId, data)` | `/courses/:id/clos` | POST |

#### Offerings & Enrollments
| API Call | Endpoint | Method |
|---|---|---|
| `getOfferings(params)` | `/offerings` | GET |
| `createOffering(data)` | `/offerings` | POST |
| `getOfferingStudents(id)` | `/offerings/:id/students` | GET |
| `enrollStudent(data)` | `/enrollments` | POST |
| `dropEnrollment(id, data)` | `/enrollments/:id/drop` | PATCH |
| `gradeEnrollment(id, data)` | `/enrollments/:id/grade` | PATCH |
| `getStudentEnrollments(studentId)` | `/students/:id/enrollments` | GET |
| `enrollStudentInProgram(studentId, data)` | `/program-enrollments` | POST |
| `getStudentProgram(studentId)` | `/students/:id/program` | GET |

#### Attendance Management
| API Call | Endpoint | Method |
|---|---|---|
| `createSession(data)` | `/sessions` | POST |
| `getOfferingSessions(offeringId)` | `/offerings/:id/sessions` | GET |
| `markAttendance(sessionId, data)` | `/sessions/:id/attendance` | POST |
| `getSessionAttendance(sessionId)` | `/sessions/:id/attendance` | GET |
| `getStudentAttendance(studentId, offeringId)` | `/students/:id/attendance` | GET |
| `getShortAttendance(offeringId)` | `/offerings/:id/short-attendance` | GET |

#### Campus Gates (Face Recognition System)
| API Call | Endpoint | Method |
|---|---|---|
| `getGates()` | `/gates` | GET |
| `createGate(data)` | `/gates` | POST |
| `updateGate(id, data)` | `/gates/:id` | PUT |
| `deleteGate(id)` | `/gates/:id` | DELETE |
| `addCamera(gateId, data)` | `/gates/:id/cameras` | POST |
| `addSchedule(gateId, data)` | `/gates/:id/schedules` | POST |
| `gateAttendance(data)` | `/face/gate-attendance` | POST |
| `getStudentCampusAttendance(studentId)` | `/students/:id/campus-attendance` | GET |
| `manualOverride(data)` | `/campus-attendance/override` | POST |

#### Fee Management
| API Call | Endpoint | Method |
|---|---|---|
| `getFeeStructures(programId)` | `/fee-structure` | GET |
| `createFeeStructure(data)` | `/fee-structure` | POST |
| `updateFeeStructure(id, data)` | `/fee-structure/:id` | PUT |
| `deleteFeeStructure(id)` | `/fee-structure/:id` | DELETE |
| `getVouchers(params)` | `/vouchers` | GET |
| `createVoucher(data)` | `/vouchers` | POST |
| `createBulkVouchers(data)` | `/vouchers/bulk` | POST |
| `payVoucher(id, data)` | `/vouchers/:id/pay` | POST |
| `applyFine(id, data)` | `/vouchers/:id/fine` | PATCH |
| `updateOverdueVouchers()` | `/vouchers/update-overdue` | PATCH |
| `getStudentVouchers(studentId)` | `/students/:id/vouchers` | GET |

#### Communication
| API Call | Endpoint | Method |
|---|---|---|
| `getAnnouncements(page)` | `/announcements` | GET |
| `createAnnouncement(data)` | `/announcements` | POST |
| `updateAnnouncement(id, data)` | `/announcements/:id` | PUT |
| `deleteAnnouncement(id)` | `/announcements/:id` | DELETE |
| `getNotices(page)` | `/notices` | GET |
| `createNotice(data)` | `/notices` | POST |
| `updateNotice(id, data)` | `/notices/:id` | PUT |
| `deleteNotice(id)` | `/notices/:id` | DELETE |

#### AI & Analytics (Admin)
| API Call | Endpoint | Method |
|---|---|---|
| `calculateAnalytics(data)` | `/analytics/calculate` | POST |
| `getLeaderboard(semesterId)` | `/analytics/semester/:id/leaderboard` | GET |
| `getAtRiskStudents(semesterId)` | `/analytics/semester/:id/at-risk` | GET |
| `calculateRanks(semesterId)` | `/analytics/semester/:id/calculate-ranks` | PATCH |
| `enrollFace(data)` | `/face/enroll` | POST |
| `getFAQs(category)` | `/chatbot/faqs` | GET |
| `createFAQ(data)` | `/chatbot/faqs` | POST |
| `updateFAQ(id, data)` | `/chatbot/faqs/:id` | PUT |

---

## 5. TEACHER PORTAL

### What Teacher Can Do
- View own assigned course offerings
- Create/manage lecture sessions
- Mark & update attendance
- Create/manage assignments (with file uploads)
- Create/manage quizzes (MCQ/True-False/Short)
- Create/manage exams, enter results
- View short-attendance students
- View attendance reports
- Read announcements & notices
- Chat in course groups
- View/update own profile

### Teacher API Calls Used (from `teacher.api.js`)

#### My Offerings
| API Call | Endpoint | Method |
|---|---|---|
| `getMyOfferings()` | `/teachers/me/offerings` | GET |
| `getOffering(id)` | `/offerings/:id` | GET |
| `getOfferingStudents(offeringId)` | `/offerings/:id/students` | GET |

#### Sessions & Attendance
| API Call | Endpoint | Method |
|---|---|---|
| `createSession(data)` | `/sessions` | POST |
| `getOfferingSessions(offeringId)` | `/offerings/:id/sessions` | GET |
| `markAttendance(sessionId, data)` | `/sessions/:id/attendance` | POST |
| `getSessionAttendance(sessionId)` | `/sessions/:id/attendance` | GET |
| `updateAttendance(sessionId, studentId, data)` | `/sessions/:id/attendance/:studentId` | PATCH |
| `getAttendanceReport(offeringId)` | `/offerings/:id/attendance-report` | GET |
| `getShortAttendance(offeringId)` | `/offerings/:id/short-attendance` | GET |

#### Assignments
| API Call | Endpoint | Method |
|---|---|---|
| `createAssignment(offeringId, data)` | `/offerings/:id/assignments` | POST |
| `getOfferingAssignments(offeringId)` | `/offerings/:id/assignments` | GET |
| `getAssignmentSubmissions(assignmentId)` | `/assignments/:id/submissions` | GET |
| `gradeSubmission(submissionId, data)` | `/submissions/:id/grade` | PATCH |
| `deleteAssignment(id)` | `/assignments/:id` | DELETE |

#### Quizzes
| API Call | Endpoint | Method |
|---|---|---|
| `createQuiz(offeringId, data)` | `/offerings/:id/quizzes` | POST |
| `getOfferingQuizzes(offeringId)` | `/offerings/:id/quizzes` | GET |
| `getQuizDetail(quizId)` | `/quizzes/:id` | GET |
| `getQuizAttempts(quizId)` | `/quizzes/:id/attempts` | GET |
| `deleteQuiz(id)` | `/quizzes/:id` | DELETE |

#### Exams & Results
| API Call | Endpoint | Method |
|---|---|---|
| `createExam(offeringId, data)` | `/offerings/:id/exams` | POST |
| `getOfferingExams(offeringId)` | `/offerings/:id/exams` | GET |
| `enterExamResults(examId, data)` | `/exams/:id/results` | POST |
| `getExamResults(examId)` | `/exams/:id/results` | GET |
| `deleteExam(id)` | `/exams/:id` | DELETE |

#### Communication
| API Call | Endpoint | Method |
|---|---|---|
| `getAnnouncements(page)` | `/announcements` | GET |
| `getNotices(page)` | `/notices` | GET |
| `getChatGroups()` | `/chat/groups` | GET |
| `getChatMessages(groupId)` | `/chat/groups/:id/messages` | GET |
| `sendMessage(groupId, data)` | `/chat/groups/:id/messages` | POST |
| `deleteMessage(messageId)` | `/chat/messages/:id` | DELETE |

#### Profile
| API Call | Endpoint | Method |
|---|---|---|
| `getProfile()` | `/teachers/me` | GET |
| `updateProfile(data)` | `/teachers/me` | PUT |

---

## 6. STUDENT PORTAL

### What Student Can Do
- View own profile, analytics, enrollments
- View attendance per course
- Submit assignments (file upload)
- Attempt quizzes (time-limited)
- Generate AI practice quizzes (Gemini)
- View exam results
- View fee vouchers & payment history
- Read announcements/notices (filtered for their program/courses)
- Chat in course groups
- Use AI chatbot (Gemini + RAG)
- Face login & face enrollment

### Student API Calls Used (from `student.api.js`)

| API Call | Endpoint | Method |
|---|---|---|
| `getProfile()` | `/students/me` | GET |
| `getAnalytics()` | `/students/me/analytics` | GET |
| `getEnrollments(semesterId)` | `/students/me/enrollments` | GET |
| `getOffering(offeringId)` | `/offerings/:id` | GET |
| `getCourseCLOs(courseId)` | `/courses/:id/clos` | GET |
| `getAttendance(studentId, offeringId)` | `/students/:id/attendance?offering_id=X` | GET |
| `getOfferingAssignments(offeringId)` | `/offerings/:id/assignments` | GET |
| `submitAssignment(assignmentId, formData)` | `/assignments/:id/submit` | POST (multipart) |
| `getStudentSubmissions(studentId)` | `/students/:id/submissions` | GET |
| `getOfferingQuizzes(offeringId)` | `/offerings/:id/quizzes` | GET |
| `startQuizAttempt(quizId)` | `/quizzes/:id/attempt` | POST |
| `submitQuizAttempt(quizId, answers)` | `/quizzes/:id/submit` | POST |
| `getMyQuizAttempt(quizId)` | `/quizzes/:id/my-attempt` | GET |
| `generateAIQuiz(data)` | `/ai-quiz/generate` | POST |
| `submitAIQuiz(data)` | `/ai-quiz/submit` | POST |
| `getMyAIQuizHistory()` | `/ai-quiz/history` | GET |
| `getMyResults(studentId, semesterId)` | `/students/:id/results?semester_id=X` | GET |
| `getMyVouchers()` | `/students/me/vouchers` | GET |
| `getAnnouncements(page)` | `/announcements` | GET |
| `getNotices(page)` | `/notices` | GET |
| `getChatGroups()` | `/chat/groups` | GET |
| `getChatMessages(groupId)` | `/chat/groups/:id/messages` | GET |
| `sendMessage(groupId, data)` | `/chat/groups/:id/messages` | POST |
| `sendChatbotMessage(data)` | `/chatbot/chat` | POST |
| `getChatbotFAQs()` | `/chatbot/faqs` | GET |

---

## 7. AI FEATURES — CURRENT STATE

### 7.1 Analytics Engine (`analytics_engine.py`)

**Score Formula (Weighted):**
| Component | Weight | Data Source |
|---|---|---|
| Lecture Attendance | 25% | `attendance_summary` table |
| Campus Presence | 10% | `campus_attendance` table |
| Assignment Consistency | 20% | `assignment_submissions` table |
| Quiz Accuracy | 20% | `quiz_attempts` table |
| GPA Factor | 25% | `enrollments.grade_points` |

**Output Fields (stored in `student_performance_scores`):**
- `academic_score` — weighted total (0–100)
- `consistency_index` — std deviation based (higher = more consistent)
- `engagement_level` — "low" / "medium" / "high"
- `trend_direction` — "improving" / "stable" / "declining" *(currently always "stable" — NOT IMPLEMENTED)*
- `class_rank` — calculated separately via `/analytics/semester/:id/calculate-ranks`
- `section_rank` — stored but NOT populated
- `risk_prediction` — `{ level: "low/medium/high", factors: [...], at_risk: bool }`
- `weak_subjects` — courses with attendance < 75%
- `recommendations` — list of action items
- `score_breakdown` — raw component scores

**Analytics API Endpoints:**
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/analytics/calculate` | Any | Calculate + save score for one student |
| GET | `/analytics/students/:id?semester_id=X` | Any | Get student score (auto-calculates if missing) |
| GET | `/analytics/semester/:id/leaderboard?limit=10` | Any | Top students by academic_score |
| GET | `/analytics/semester/:id/at-risk` | Teacher | Students where `risk.at_risk == true` |
| PATCH | `/analytics/semester/:id/calculate-ranks` | Admin | Assign class_rank to all students |

**⚠️ GAPS IN ANALYTICS (needs work):**
- `trend_direction` — always "stable", no historical comparison logic
- `section_rank` — never calculated
- `improvement_index` — field exists in DB but never set
- Bulk calculate endpoint referenced in admin API (`bulkCalculateAnalytics`) but NOT in backend router
- No automated/scheduled score recalculation — manual trigger only

---

### 7.2 AI Chatbot (`chatbot_engine.py` + `gemini_service.py` + `rag_service.py`)

**Flow:**
```
Student message
  → RAGService.build_context()
    → Search ChatbotFAQ table with FAISS (HuggingFace embeddings)
    → Format student data (name, attendance placeholder, CGPA placeholder)
  → GeminiService.generate_response(message, context)
    → Gemini 2.5 Flash API call
  → Save to chatbot_messages
  → Return response
```

**⚠️ GAPS IN CHATBOT:**
- Student data in RAG context is PLACEHOLDER — attendance/CGPA/courses NOT fetched from real DB
- `get_student_data()` in `chatbot_engine.py` returns hardcoded strings ("Check your dashboard")
- Real data integration needed for meaningful personalized responses

**Chatbot API Endpoints:**
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/chatbot/chat` | Any | Send message, get AI response |
| POST | `/chatbot/end-session` | Any | End chat session |
| POST | `/chatbot/feedback` | Any | Rate session 1–5 |
| GET | `/chatbot/faqs` | Any | List all active FAQs |
| POST | `/chatbot/faqs` | Admin | Create FAQ |
| PUT | `/chatbot/faqs/:id` | Admin | Update FAQ |
| POST | `/chatbot/faqs/:id/vote` | Any | Mark FAQ helpful/not helpful |

---

### 7.3 Face Recognition (`face_recognition_engine.py`)

**Engine:** Dlib with 128-d face embeddings stored as BLOB in `users.face_embedding`

**Flows:**
1. **Enroll:** Base64 image → Dlib extract 128-d embedding → save to `users.face_embedding`
2. **Login:** Base64 image → extract embedding → compare with ALL enrolled users → return best match if distance ≤ 0.5
3. **Gate Attendance:** Same as login + log to `campus_attendance` table

**Face Recognition API Endpoints:**
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/face/enroll` | Admin | Enroll student face (admin does it) |
| POST | `/auth/enroll-face` | Any user | Self-enroll own face |
| POST | `/auth/face-login` | Public | Login with face |
| POST | `/face/verify` | Any | Verify face + log campus attendance |
| POST | `/face/gate-attendance` | Public (kiosk) | Gate camera face attendance (no auth) |

**⚠️ GAPS IN FACE RECOGNITION:**
- Linear scan of ALL users on every recognition — no FAISS indexing for face embeddings
- No liveness detection (spoofing possible)
- Models must be manually downloaded to `backend/app/ai/models/` (not included in repo)

---

### 7.4 AI Quiz Generation (`assessment_service.py` → `AIQuizService`)

**Flow:**
```
Student requests quiz (topic, difficulty, num_questions, course_id)
  → Gemini prompt to generate N MCQ questions as JSON array
  → Parse + validate JSON
  → Save to ai_quizzes table
  → Return questions to student (no correct_answer shown)

Student submits answers
  → Compare each answer to correct_answer (case-insensitive)
  → Calculate score %
  → Identify weak areas (wrong questions)
  → Return feedback
```

**AI Quiz API Endpoints:**
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/ai-quiz/generate` | Any | Generate AI quiz via Gemini |
| POST | `/ai-quiz/submit` | Any | Submit answers + get score |
| GET | `/ai-quiz/history` | Any | Student's past AI quizzes |

---

## 8. BACKEND SERVICES SUMMARY

| Service File | Classes | Responsibility |
|---|---|---|
| `auth_service.py` | `AuthService` | Login, password change, profile update, temp password generation |
| `user_service.py` | `UserService` | CRUD for students & teachers, auto roll number generation |
| `academic_service.py` | `DepartmentService`, `ProgramService`, `SemesterService`, `CourseService` | Academic structure management |
| `enrollment_service.py` | `OfferingService`, `EnrollmentService`, `StudentProgramService` | Course offerings, enrollments, CGPA calculation |
| `attendance_service.py` | `LectureSessionService`, `AttendanceService`, `GateService`, `CampusAttendanceService` | Two-level attendance (lecture + campus gate) |
| `assessment_service.py` | `AssignmentService`, `QuizService`, `AIQuizService`, `ExamService` | All assessment types including AI quiz |
| `fee_service.py` | `FeeStructureService`, `VoucherService`, `PaymentService` | Fee management, fine calculation, voucher generation |
| `communication_service.py` | `AnnouncementService`, `NoticeBoardService`, `ChatService`, `MessageService` | All communication features |
| `ai_service.py` | `AnalyticsService`, `FAQService`, `AIQuizOllamaService` | AI orchestration layer |

---

## 9. COMPLETE API ENDPOINT LIST (Backend Router)

All routes prefixed with `/api/v1`

### Auth Routes (`/auth/`)
```
POST   /auth/login
POST   /auth/face-login
POST   /auth/enroll-face
GET    /auth/profile
PUT    /auth/profile
POST   /auth/profile/upload-picture
POST   /auth/change-password
POST   /auth/refresh-token
```

### Student Routes (`/students/`)
```
GET    /students/me
GET    /students/me/analytics
GET    /students/me/enrollments
GET    /students/me/vouchers
GET    /students              (admin only)
POST   /students              (admin only)
GET    /students/:id
PUT    /students/:id          (admin only)
PATCH  /students/:id/status   (admin only)
DELETE /students/:id          (admin only)
GET    /students/:id/attendance
GET    /students/:id/campus-attendance
GET    /students/:id/enrollments
GET    /students/:id/vouchers
GET    /students/:id/payment-history
GET    /students/:id/fee-summary
GET    /students/:id/submissions
GET    /students/:id/results
GET    /students/:id/program
```

### Teacher Routes (`/teachers/`)
```
GET    /teachers/me
PUT    /teachers/me
GET    /teachers/me/offerings
GET    /teachers              (any auth)
POST   /teachers              (admin only)
GET    /teachers/:id
PUT    /teachers/:id
PATCH  /teachers/:id/status   (admin only)
DELETE /teachers/:id          (admin only)
```

### Academic Routes
```
GET/POST        /departments
GET/PUT/DELETE  /departments/:id
GET/POST        /programs
GET/PUT/DELETE  /programs/:id
GET/POST        /semesters
GET             /semesters/active
GET/PUT/DELETE  /semesters/:id
PATCH           /semesters/:id/activate
GET/POST        /courses
GET/PUT/DELETE  /courses/:id
GET/POST        /courses/:id/clos
DELETE/PUT      /courses/:id/clos/:cloId
```

### Enrollment Routes
```
GET/POST        /offerings
GET/PUT/DELETE  /offerings/:id
GET             /offerings/:id/students
POST            /enrollments
GET             /enrollments/:id
PATCH           /enrollments/:id/approve
PATCH           /enrollments/:id/drop
PATCH           /enrollments/:id/grade
POST            /program-enrollments
PATCH           /program-enrollments/:id
```

### Attendance Routes
```
POST   /sessions
GET    /offerings/:id/sessions
POST   /sessions/:id/attendance
GET    /sessions/:id/attendance
PATCH  /sessions/:id/attendance/:studentId
GET    /offerings/:id/attendance-report
GET    /offerings/:id/short-attendance
GET/POST        /gates
GET/PUT/DELETE  /gates/:id
PATCH           /gates/:id/ping
POST            /gates/:id/cameras
POST            /gates/:id/schedules
POST            /campus-attendance
POST            /campus-attendance/override
```

### Assessment Routes
```
POST   /offerings/:id/assignments
GET    /offerings/:id/assignments
GET    /assignments/:id
PUT    /assignments/:id
DELETE /assignments/:id
POST   /assignments/:id/submit
GET    /assignments/:id/submissions
PATCH  /submissions/:id/grade

POST   /offerings/:id/quizzes
GET    /offerings/:id/quizzes
GET    /quizzes/:id
PUT    /quizzes/:id
DELETE /quizzes/:id
POST   /quizzes/:id/attempt
POST   /quizzes/:id/submit
GET    /quizzes/:id/attempts
GET    /quizzes/:id/result
GET    /quizzes/:id/my-attempt

POST   /ai-quiz/generate
POST   /ai-quiz/submit
GET    /ai-quiz/history

POST   /offerings/:id/exams
GET    /offerings/:id/exams
PUT    /exams/:id
DELETE /exams/:id
POST   /exams/:id/results
GET    /exams/:id/results
```

### Fee Routes
```
GET/POST        /fee-structure
GET/PUT/DELETE  /fee-structure/:id
GET/POST        /vouchers
POST            /vouchers/bulk
GET             /vouchers/:id
GET             /vouchers/number/:voucher_number
PATCH           /vouchers/:id/fine
PATCH           /vouchers/update-overdue
POST            /vouchers/:id/pay
GET             /students/:id/payment-history
GET             /students/:id/fee-summary
```

### Communication Routes
```
GET/POST        /announcements
GET             /announcements/pinned
GET             /announcements/my
GET/PUT/DELETE  /announcements/:id
GET/POST        /notices
GET/PUT/DELETE  /notices/:id
POST            /chat/groups
GET             /chat/groups
GET             /chat/groups/:id
POST            /chat/groups/:id/members
DELETE          /chat/groups/:id/members/:userId
PATCH           /chat/groups/:id/members/:userId/mute
POST            /chat/groups/:id/add-students
GET             /chat/groups/:id/messages
POST            /chat/groups/:id/messages
DELETE          /chat/messages/:id
WS              /ws/chat/:group_id?token=xxx
```

### AI & Analytics Routes
```
POST   /analytics/calculate
GET    /analytics/students/:id?semester_id=X
GET    /analytics/semester/:id/leaderboard
GET    /analytics/semester/:id/at-risk
PATCH  /analytics/semester/:id/calculate-ranks

POST   /chatbot/chat
POST   /chatbot/end-session
POST   /chatbot/feedback
GET    /chatbot/faqs
POST   /chatbot/faqs
PUT    /chatbot/faqs/:id
POST   /chatbot/faqs/:id/vote
GET    /chatbot/faqs/search?q=xxx

POST   /face/enroll
POST   /face/verify
POST   /face/gate-attendance
```

---

## 10. WHAT NEEDS TO BE BUILT / FIXED

### 🔴 Critical Gaps
1. **Chatbot real data integration** — `get_student_data()` in `chatbot_engine.py` returns hardcoded placeholders; needs real attendance %, CGPA, enrolled courses from DB
2. **Analytics `trend_direction`** — always "stable"; needs historical score comparison (store previous semester scores, compare)
3. **Bulk analytics endpoint** — `POST /analytics/bulk-calculate` is called from admin frontend but does NOT exist in backend router
4. **`section_rank` + `improvement_index`** — DB columns exist, never populated

### 🟡 Enhancement Opportunities
5. **Face recognition scaling** — currently linear scan O(n) users; switch to FAISS for face embeddings for performance
6. **Analytics scheduler** — no auto-recalculation; could add a cron/scheduled task
7. **Student chatbot context** — fetch real-time attendance %, pending fees, upcoming deadlines for personalized responses
8. **Announcement "my" endpoint** — `/announcements/my` queries enrolled offerings but student-facing dashboard may need server-side filtering improvement
9. **Quiz time enforcement** — time limit is stored but backend doesn't enforce it on submission (frontend timer only)
10. **Assignment plagiarism** — `plagiarism_check` flag exists, columns exist in DB, but no actual plagiarism service implemented

### 🟢 Already Working
- Full JWT auth with refresh token
- Face login + enrollment (Dlib)
- Gate attendance (kiosk mode, no auth)
- Lecture attendance with auto-summary update
- Fee vouchers, payments, fine calculation
- AI quiz generation via Gemini
- Chatbot with Gemini + FAISS RAG (but placeholder student data)
- Analytics score calculation (without trend/rank completeness)
- WebSocket real-time chat
- File upload for assignments
- All CRUD for academic structure

---

## 11. DEPENDENCIES (Key Libraries)

### Backend (`requirements.txt`)
| Library | Purpose |
|---|---|
| `fastapi` | Web framework |
| `sqlalchemy` | ORM |
| `pymysql` | MySQL driver |
| `python-jose` | JWT tokens |
| `passlib[bcrypt]` | Password hashing |
| `dlib` | Face recognition (128-d embeddings) |
| `numpy`, `scipy`, `scikit-learn` | Numerical computing |
| `google-generativeai` | Gemini AI API |
| `sentence-transformers` | HuggingFace embeddings for RAG |
| `faiss-cpu` | Vector similarity search for chatbot |
| `torch`, `transformers` | ML model support |
| `httpx` | Async HTTP (for Ollama calls) |

### Frontend (inferred from API files)
| Library | Purpose |
|---|---|
| `axios` | HTTP client with interceptors |
| `react` + `vite` | Frontend framework |
| JWT stored in `localStorage` | Auth token management |

---

## 12. ENVIRONMENT VARIABLES (`.env`)

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=AI_Driven_Smart_LMS
DB_USER=root
DB_PASSWORD=****

SECRET_KEY=****
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

APP_NAME=AI-Driven Smart LMS
DEBUG=True

GEMINI_API_KEY=****
```

---

*Last Updated: Based on codebase analysis — Backend + Frontend API files*
