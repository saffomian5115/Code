import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LoginPage from "./pages/auth/LoginPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import { authStore } from "./store/authStore";
import ProfilePage from './pages/shared/ProfilePage'

// ── Phase 1: Admin Pages ────────────────────────────
import AdminDashboard    from './pages/admin/AdminDashboard'
import StudentsPage      from './pages/admin/StudentsPage'
import TeachersPage from "./pages/admin/TeachersPage";
import DepartmentsPage from "./pages/admin/DepartmentsPage";
import ProgramsPage from "./pages/admin/ProgramsPage";
import SemestersPage from "./pages/admin/SemestersPage";
import CoursesPage from "./pages/admin/CoursesPage";
import OfferingsPage from "./pages/admin/OfferingsPage";
import EnrollmentsPage from "./pages/admin/EnrollmentsPage";
import FeeStructurePage from "./pages/admin/FeeStructurePage";
import FeeVouchersPage from "./pages/admin/FeeVouchersPage";
import AnnouncementsPage from "./pages/admin/AnnouncementsPage";
import NoticesPage from "./pages/admin/NoticesPage";
import GatesPage from "./pages/admin/GatesPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import GateAttendancePage from "./pages/admin/GateAttendancePage";

// ── Phase 2: Teacher Pages ──────────────────────────
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import MyCoursesPage from "./pages/teacher/MyCoursesPage";
import AttendancePage from "./pages/teacher/AttendancePage";
import AssignmentsPage from "./pages/teacher/AssignmentsPage";
import QuizzesPage from "./pages/teacher/QuizzesPage";
import ResultsPage from "./pages/teacher/ResultsPage";
import TeacherAnnouncementsPage from "./pages/teacher/TeacherAnnouncementsPage";
import ChatPage from "./pages/teacher/ChatPage";

// Phase 3: Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/MyCoursesPage";
import CourseDetailsPage from "./pages/student/CourseDetailsPage";
import StudentAttendance from "./pages/student/AttendancePage";
import StudentAssignments from "./pages/student/AssignmentsPage";
import StudentQuizzes from "./pages/student/QuizzesPage";
import StudentResults from "./pages/student/ResultsPage";
import StudentFee from "./pages/student/FeePage";
import StudentAnnounce from "./pages/student/AnnouncementsPage";
import StudentChat from "./pages/student/ChatPage";
import StudentAI from "./pages/student/AIAssistantPage";

// ── Route Guards ────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const user = authStore.getUser();
  const token = authStore.getToken();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/login" replace />;
  return children;
}

function RoleRedirect() {
  const user = authStore.getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "teacher")
    return <Navigate to="/teacher/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
}

const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <p className="text-xl font-display font-bold text-slate-700">{title}</p>
      <p className="text-slate-400 mt-1 text-sm">Coming in Phase 3</p>
    </div>
  </div>
);

// ── App ─────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            background: "#1e293b",
            color: "#f1f5f9",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RoleRedirect />} />

        {/* ══════════════════════════════════════════
            ADMIN PANEL — Phase 1 (15 pages) ✅
        ══════════════════════════════════════════ */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard"     element={<AdminDashboard />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="students"      element={<StudentsPage />} />
                  <Route path="teachers" element={<TeachersPage />} />
                  <Route path="departments" element={<DepartmentsPage />} />
                  <Route path="programs" element={<ProgramsPage />} />
                  <Route path="semesters" element={<SemestersPage />} />
                  <Route path="courses" element={<CoursesPage />} />
                  <Route path="offerings" element={<OfferingsPage />} />
                  <Route path="enrollments" element={<EnrollmentsPage />} />
                  <Route path="fee/structure" element={<FeeStructurePage />} />
                  <Route path="fee/vouchers" element={<FeeVouchersPage />} />
                  <Route path="announcements" element={<AnnouncementsPage />} />
                  <Route path="notices" element={<NoticesPage />} />
                  <Route path="gates" element={<GatesPage />} />
                  <Route path="gate-attendance" element={<GateAttendancePage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route
                    path="*"
                    element={<Navigate to="/admin/dashboard" replace />}
                  />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ══════════════════════════════════════════
            TEACHER PANEL — Phase 2 (8 pages) ✅
        ══════════════════════════════════════════ */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={["teacher", "admin"]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="courses" element={<MyCoursesPage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="assignments" element={<AssignmentsPage />} />
                  <Route path="quizzes" element={<QuizzesPage />} />
                  <Route path="results" element={<ResultsPage />} />
                  <Route
                    path="announcements"
                    element={<TeacherAnnouncementsPage />}
                  />
                  <Route path="chat" element={<ChatPage />} />
                  <Route
                    path="*"
                    element={<Navigate to="/teacher/dashboard" replace />}
                  />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ══════════════════════════════════════════
            STUDENT PANEL — Phase 3 (Coming Soon)
        ══════════════════════════════════════════ */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="courses" element={<StudentCourses />} />
                  <Route path="courses/:offeringId" element={<CourseDetailsPage />} />
                  <Route path="attendance" element={<StudentAttendance />} />
                  <Route path="assignments" element={<StudentAssignments />} />
                  <Route path="quizzes" element={<StudentQuizzes />} />
                  <Route path="results" element={<StudentResults />} />
                  <Route path="fee" element={<StudentFee />} />
                  <Route path="announcements" element={<StudentAnnounce />} />
                  <Route path="chat" element={<StudentChat />} />
                  <Route path="ai" element={<StudentAI />} />
                  <Route
                    path="*"
                    element={<Navigate to="/student/dashboard" replace />}
                  />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
