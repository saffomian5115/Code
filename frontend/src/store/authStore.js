export const authStore = {
  setAuth: (token, refreshToken, user) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
  },

  getToken: () => localStorage.getItem('access_token'),

  getUser: () => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  },

  updateUser: (updatedFields) => {
  const existing = authStore.getUser()
  if (existing) {
    const merged = { ...existing, ...updatedFields }
    localStorage.setItem('user', JSON.stringify(merged))
    window.dispatchEvent(new Event('profileUpdated'))
  }
},

  clear: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },

  isLoggedIn: () => !!localStorage.getItem('access_token'),
}