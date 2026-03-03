# Database Seeds - AI-Driven Smart LMS

## Overview
Complete seed data for development and testing of BZU LMS system.

## Credentials

| Role     | Email                          | Password     |
|----------|-------------------------------|--------------|
| Admin    | admin@bzu.edu.pk              | Admin@123    |
| Security | security@bzu.edu.pk           | Admin@123    |
| Teacher  | dr.kamran@bzu.edu.pk          | Teacher@123  |
| Teacher  | ms.ayesha@bzu.edu.pk          | Teacher@123  |
| Teacher  | mr.hassan@bzu.edu.pk          | Teacher@123  |
| Student  | ali.hassan@student.bzu.edu.pk | Student@123  |
| Student  | sara.ahmed@student.bzu.edu.pk | Student@123  |

## Seed Files

| File | Content | Records |
|------|---------|---------|
| 01_departments.sql | IT, CS, BBA, Math departments | 4 |
| 02_programs.sql | BSIT, BSCS, BBA, ADIT | 4 |
| 03_semesters.sql | Fall 2023 → Spring 2025 (active) | 4 |
| 04_courses.sql | 17 courses + CLOs | 17 + 6 CLOs |
| 05_users_admin.sql | 3 admin users | 3 |
| 06_users_teachers.sql | 5 teachers | 5 |
| 07_users_students.sql | 17 students (BSIT + BSCS) | 17 |
| 08_program_enrollments.sql | Student-program mappings | 17 |
| 09_offerings_enrollments.sql | 5 offerings + course enrollments | 5 + 35 |
| 10_attendance.sql | Sessions, lecture attendance, gates | 12 sessions + records |
| 11_assignments.sql | 7 assignments + submissions | 7 + 17 |
| 12_quizzes.sql | 4 quizzes + 20 questions + attempts | 4 + 20 + 11 |
| 13_exams.sql | 6 exams + results | 6 + 25 |
| 14_fees.sql | Fee structure + vouchers + payments | 12 + 17 + 13 |
| 15_communication.sql | Announcements + notices + chats | 7 + 5 + 18 msgs |
| 16_ai_analytics.sql | Performance scores + chatbot data | 7 + 9 intents + 10 FAQs |
| 17_ai_campus.sql | AI quizzes + campus attendance | 4 + 20 logs |

## How to Run

```bash
cd database/seeds/
mysql -u root -p AI_Driven_SMart_LMS < 00_run_all_seeds.sql
```

### Attendance
- **Student 10 (Sara)** → 100% attendance (best case)
- **Student 9 (Ali)** → 87.5% attendance (good)
- **Student 11 (Usman)** → 62.5% attendance (short alert triggered)
- **Student 23 (Danish)** → 37.5% attendance (critical - at risk)

### Fee Status
- **Paid** → Students 9, 10, 12, 14, 15, 18, 19, 20, 22, 24, 25
- **Partial** → Student 11 (paid Rs. 25,000 of 46,000)
- **Overdue** → Students 13, 17, 23 (with fine)
- **Unpaid** → Students 16, 21

### AI Analytics
- **High performer** → Student 10 (score: 94.2, rank 1)
- **At-risk** → Students 11, 13, 23 (flagged with risk factors)
- **Declining** → Student 23 (score: 42.1, multiple red flags)

### Quiz Performance
- **Perfect** → Student 10 (100% on CSS quiz)
- **Average** → Student 9 (80-90%)
- **Poor** → Student 11 (60%)

## Notes
- All passwords are bcrypt hashed
- Active semester is Spring 2025 (semester_id = 4)
- Face embeddings are NULL (enroll via API after seeding)
- Campus attendance logs are sample data without actual face embeddings
