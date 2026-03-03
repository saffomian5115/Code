import { useState, useEffect } from 'react';
import { NavLink } from "react-router-dom";
import { authStore } from "../../store/authStore";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BarChart2,
  CreditCard,
  Bell,
  MessageSquare,
  Users,
  GraduationCap,
  Settings,
  Building2,
  Calendar,
  ClipboardCheck,
  PenSquare,
  BrainCircuit,
  ChevronRight,
} from "lucide-react";

const MENUS = {
  student: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/student/dashboard" },
    { label: "My Courses", icon: BookOpen, to: "/student/courses" },
    { label: "Attendance", icon: ClipboardCheck, to: "/student/attendance" },
    { label: "Assignments", icon: FileText, to: "/student/assignments" },
    { label: "Quizzes", icon: PenSquare, to: "/student/quizzes" },
    { label: "Results", icon: BarChart2, to: "/student/results" },
    { label: "Fee", icon: CreditCard, to: "/student/fee" },
    { label: "Announcements", icon: Bell, to: "/student/announcements" },
    { label: "Chat", icon: MessageSquare, to: "/student/chat" },
    { label: "AI Assistant", icon: BrainCircuit, to: "/student/ai" },
  ],
  teacher: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/teacher/dashboard" },
    { label: "My Courses", icon: BookOpen, to: "/teacher/courses" },
    { label: "Attendance", icon: ClipboardCheck, to: "/teacher/attendance" },
    { label: "Assignments", icon: FileText, to: "/teacher/assignments" },
    { label: "Quizzes", icon: PenSquare, to: "/teacher/quizzes" },
    { label: "Results", icon: BarChart2, to: "/teacher/results" },
    { label: "Announcements", icon: Bell, to: "/teacher/announcements" },
    { label: "Chat", icon: MessageSquare, to: "/teacher/chat" },
  ],
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
    { label: "Students", icon: GraduationCap, to: "/admin/students" },
    { label: "Teachers", icon: Users, to: "/admin/teachers" },
    { label: "Departments", icon: Building2, to: "/admin/departments" },
    { label: "Semesters", icon: Calendar, to: "/admin/semesters" },
    { label: "Courses", icon: BookOpen, to: "/admin/courses" },
    { label: "Fee Structure", icon: CreditCard, to: "/admin/fee/structure" },
    { label: "Fee Vouchers", icon: FileText, to: "/admin/fee/vouchers" },
    { label: "Announcements", icon: Bell, to: "/admin/announcements" },
    { label: "Gates", icon: Settings, to: "/admin/gates" },
  ],
};

const ROLE_CONFIG = {
  admin: { label: "Administrator", color: "bg-purple-500", text: "A" },
  teacher: { label: "Teacher", color: "bg-emerald-500", text: "T" },
  student: { label: "Student", color: "bg-blue-500", text: "S" },
};

const BASE_URL = "http://127.0.0.1:8000";

export default function Sidebar({ isOpen }) {
  const [user, setUser] = useState(authStore.getUser());
  useEffect(() => {
    const handleUpdate = () => setUser(authStore.getUser());
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("profileUpdated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("profileUpdated", handleUpdate);
    };
  }, []);
  const role = user?.role || "student";
  const menus = MENUS[role] || [];
  const rc = ROLE_CONFIG[role];

  const avatarUrl = user?.profile_picture_url
    ? `${BASE_URL}${user.profile_picture_url}`
    : null;

  return (
    <aside
      className={`
      ${isOpen ? "w-64" : "w-0 overflow-hidden"}
      transition-all duration-300 bg-slate-900 flex flex-col h-full flex-shrink-0
    `}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-display font-bold text-sm leading-tight">
              BZU Smart LMS
            </p>
            <p className="text-slate-400 text-xs">Multan</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div
              className={`w-9 h-9 ${rc.color} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
            >
              {user?.full_name?.[0]?.toUpperCase() || rc.text}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-white text-sm font-semibold truncate">
              {user?.full_name || "User"}
            </p>
            <p className="text-slate-400 text-xs">{rc.label}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {menus.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
              ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }
            `}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
            <span className="flex-1">{label}</span>
            <ChevronRight
              className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity"
              size={14}
            />
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
