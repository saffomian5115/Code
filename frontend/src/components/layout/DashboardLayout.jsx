// ═══════════════════════════════════════════════════════════════
//  DashboardLayout.jsx  —  Neumorphic App Shell
//  Replace:  frontend/src/components/layout/DashboardLayout.jsx
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--neu-bg)',
      overflow: 'hidden',
      transition: 'background 0.35s ease',
    }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        <Navbar onToggleSidebar={() => setSidebarOpen(p => !p)} />

        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          // Subtle inner shadow at top — depth feel
          boxShadow: 'inset 0 4px 12px rgba(163,177,198,0.18)',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}