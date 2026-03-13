import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, signup } from '../firebase/auth.ts'
import { useAuth } from '../context/AuthContext.tsx'
import { updateProfile } from 'firebase/auth'
import { auth } from '../firebase/config.ts'

const ADMIN_EMAIL = 'civilserviceskendra@gmail.com'
const ADMIN_PASSWORD = 'CSKadmin@2026'

export default function Login() {
  const [isAdminLogin, setIsAdminLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const { user, loading: authLoading, isAdmin } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin) {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, authLoading, isAdmin, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isAdminLogin) {
        if (
          email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() ||
          password !== ADMIN_PASSWORD
        ) {
          setError('Invalid admin credentials. Access denied.')
          setLoading(false)
          return
        }
        try {
          await login(ADMIN_EMAIL, ADMIN_PASSWORD)
        } catch (firebaseErr: any) {
          if (
            firebaseErr.code === 'auth/user-not-found' ||
            firebaseErr.code === 'auth/invalid-credential' ||
            firebaseErr.code === 'auth/wrong-password'
          ) {
            await signup(ADMIN_EMAIL, ADMIN_PASSWORD, 'CSK Admin')
          } else {
            throw firebaseErr
          }
        }
        return
      }
      if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setError('This email is reserved. Please use a different account.')
        setLoading(false)
        return
      }
      // Try to login; if not found, auto-register with provided name
      let loggedInUser
      try {
        loggedInUser = await login(email, password)
      } catch (loginErr: any) {
        if (
          loginErr.code === 'auth/user-not-found' ||
          loginErr.code === 'auth/invalid-credential'
        ) {
          // Auto-register new user with their name
          loggedInUser = await signup(email, password, name.trim() || email.split('@')[0])
        } else {
          throw loginErr
        }
      }
      // If user has no displayName and a name was typed, set it now
      if (loggedInUser && !loggedInUser.displayName && name.trim()) {
        await updateProfile(loggedInUser, { displayName: name.trim() })
        // Reload so auth listener picks up the new displayName
        await loggedInUser.reload()
      }
    } catch (err: any) {
      const code = err.code
      if (code === 'auth/user-not-found') setError('No account found with this email.')
      else if (code === 'auth/wrong-password') setError('Incorrect password. Please try again.')
      else if (code === 'auth/invalid-email') setError('Invalid email address.')
      else if (code === 'auth/invalid-credential') setError('Invalid email or password.')
      else if (code === 'auth/too-many-requests') setError('Too many attempts. Try again later.')
      else if (code === 'auth/network-request-failed') setError('Network error. Check your connection.')
      else setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (admin: boolean) => {
    setIsAdminLogin(admin)
    setError('')
    setEmail('')
    setPassword('')
    setName('')
    setShowPassword(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl shadow-2xl overflow-hidden">

        {/* ── LEFT BRANDING PANEL ── */}
        <div className={`hidden lg:flex flex-col justify-center p-12 text-white ${isAdminLogin ? 'bg-gradient-to-br from-gray-800 to-gray-950' : 'bg-gradient-to-br from-indigo-600 to-purple-700'}`}>
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-lg ${isAdminLogin ? 'bg-white/10' : 'bg-white/20'}`}>
            <span className="text-white font-black text-2xl tracking-wider">CSK</span>
          </div>
          {isAdminLogin ? (
            <>
              <h2 className="text-3xl font-black mb-3">Admin Portal</h2>
              <p className="text-gray-300 text-sm mb-8 leading-relaxed">Manage courses, students, and content from one place.</p>
              <ul className="space-y-4">
                {[
                  { icon: '📤', text: 'Upload videos & study materials' },
                  { icon: '👥', text: 'Manage student enrollments' },
                  { icon: '📊', text: 'View performance analytics' },
                  { icon: '📝', text: 'Add & edit mock tests' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sm flex-shrink-0">{item.icon}</span>
                    <span className="text-gray-200 text-sm">{item.text}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-black mb-3">Civil Services Kendra</h2>
              <p className="text-indigo-100 text-sm mb-8 leading-relaxed">Start your Civil Services Preparation with CSK.</p>
              <ul className="space-y-4">
                {[
                  { icon: '🎓', text: 'Coaching from Expert Tutors' },
                  { icon: '🎬', text: 'HD video lectures & study materials' },
                  { icon: '📝', text: 'Mock tests & performance analytics' },
                  { icon: '💼', text: 'Working Professional Friendly' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-sm flex-shrink-0">{item.icon}</span>
                    <span className="text-indigo-50 text-sm">{item.text}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div className="bg-white dark:bg-gray-900 flex flex-col justify-center p-8 md:p-12">

          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8 w-fit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>

          {/* Tab Switch */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-8">
            <button
              onClick={() => switchTab(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                !isAdminLogin
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              🎓 User Login
            </button>
            <button
              onClick={() => switchTab(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                isAdminLogin
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              ⚙️ Admin Login
            </button>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              {isAdminLogin ? 'Admin Access' : 'Sign in to access your courses and Dashboard'}
            </h1>
            {isAdminLogin && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                Sign in with your admin credentials
              </p>
            )}
          </div>

          {/* Error Box */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* User login info banner */}
            {!isAdminLogin && (
              <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl">
                <span className="text-indigo-500 text-lg">🎓</span>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                  Enter your registered email and password to sign in.
                </p>
              </div>
            )}

            {/* Name Field — user login only */}
            {!isAdminLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Sam, Priya, Rahul..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors placeholder-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder={isAdminLogin ? 'admin@csk.com' : 'you@example.com'}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 ${
                isAdminLogin
                  ? 'bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in...
                </>
              ) : isAdminLogin ? '⚙️  Sign In as Admin' : '🎓  Sign In'}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-7 text-xs text-center text-gray-400 dark:text-gray-600">
            By signing in, you agree to our{' '}
            <a href="#" className="text-indigo-500 hover:underline">Terms of Service</a>{' '}
            &amp;{' '}
            <a href="#" className="text-indigo-500 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
