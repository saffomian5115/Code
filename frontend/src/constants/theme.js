// src/constants/theme.js

// Colors - Tumhari marzi ke accented colors
export const colors = {
  light: {
    base: '#eef2f8',
    surface: '#f8fcff',
    accent: '#4361ee', // Nice blue
    accent2: '#7209b7', // Purple
    accent3: '#f72585', // Pink
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      muted: '#64748b'
    },
    border: 'rgba(0,0,0,0.05)',
    shadow: {
      dark: '#b0bed2',
      light: '#ffffff'
    }
  },
  dark: {
    base: '#0f172a',
    surface: '#1e293b',
    accent: '#4cc9f0', // Light blue for dark
    accent2: '#b5179e',
    accent3: '#f72585',
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      muted: '#94a3b8'
    },
    border: 'rgba(255,255,255,0.05)',
    shadow: {
      dark: '#000000',
      light: '#334155'
    }
  }
};

// Shadow styles - Tumhare social-btn jaisa effect
export const shadows = {
  // 3D press effect wala button
  button3d: (theme) => `
    background: radial-gradient(circle at 30% 30%, ${colors[theme].surface}, ${colors[theme].base});
    box-shadow: 
      0 5px 0 ${colors[theme].shadow.dark},
      0 8px 12px -6px rgba(0,0,0,0.2),
      inset 0 1px 2px ${colors[theme].shadow.light};
    border: 1px solid ${theme === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.1)'};
  `,
  
  // Neumorphic (soft) shadow
  neumorph: (theme) => `
    box-shadow: 
      8px 8px 16px ${theme === 'light' ? 'rgba(163,177,198,0.5)' : 'rgba(0,0,0,0.6)'},
      -8px -8px 16px ${theme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(45,46,50,0.8)'};
  `,
  
  // Inset neumorphic (for inputs)
  neumorphInset: (theme) => `
    box-shadow: 
      inset 4px 4px 8px ${theme === 'light' ? 'rgba(138,149,168,0.5)' : 'rgba(0,0,0,0.8)'},
      inset -4px -4px 8px ${theme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(45,46,50,0.6)'};
  `,
  
  // Card shadow
  card: (theme) => `
    box-shadow: 
      0 10px 25px -5px rgba(0,0,0,0.1),
      0 8px 10px -6px rgba(0,0,0,0.1);
  `
};

// Tailwind mein use karne ke liye classes
export const themeClasses = {
  // Base classes
  card: 'rounded-2xl p-6 transition-all duration-300',
  input: 'w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-300',
  button: 'font-semibold rounded-xl transition-all duration-200 active:scale-[0.98]',
  
  // Specific styles
  socialButton: 'w-[52px] h-[52px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-100 relative top-0 active:top-1',
};

// Theme context ke liye default config
export const defaultTheme = 'light';