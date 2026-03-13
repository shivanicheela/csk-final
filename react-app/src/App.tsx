import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx'

// Lazy-load pages
const Home = lazy(() => import('./pages/Home.tsx'))
const Login = lazy(() => import('./pages/Login.tsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'))
const Admin = lazy(() => import('./pages/Admin.tsx'))
const UPSC = lazy(() => import('./pages/UPSC.tsx'))
const TNPSC = lazy(() => import('./pages/TNPSC.tsx'))
const Courses = lazy(() => import('./pages/Courses.tsx'))
const Contact = lazy(() => import('./pages/Contact.tsx'))
const Payment = lazy(() => import('./pages/Payment.tsx'))
const FreeTrial = lazy(() => import('./pages/FreeTrial.tsx'))
const CourseDetail = lazy(() => import('./pages/CourseDetail.tsx'))
const CourseContentPage = lazy(() => import('./pages/CourseContentPage.tsx'))
const VideoUpload = lazy(() => import('./pages/VideoUpload.tsx'))
const AdminCourseUpload = lazy(() => import('./pages/AdminCourseUpload.tsx'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy.tsx'))
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions.tsx'))
const RefundPolicy = lazy(() => import('./pages/RefundPolicy.tsx'))
const FreeLectures = lazy(() => import('./pages/FreeLectures.tsx'))

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function Navbar() {
  const { user, isAdmin } = useAuth()
  const { dark, toggleDark } = useTheme()
  const navigate = useNavigate()

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
            CSK
          </div>
          <span className="font-black text-gray-900 dark:text-white text-lg hidden sm:inline">Civil Services Kendra</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/" className="px-4 py-1.5 text-sm font-bold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-full hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">Home</Link>
          <Link to="/upsc" className="px-4 py-1.5 text-sm font-bold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-full hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">UPSC</Link>
          <Link to="/tnpsc" className="px-4 py-1.5 text-sm font-bold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-full hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">TNPSC</Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            title="Toggle dark mode"
          >
            {dark ? '☀️' : '🌙'}
          </button>

          <Link
            to="/free-trial"
            className="px-3 py-1.5 text-sm font-bold text-black dark:text-black bg-yellow-400 hover:bg-yellow-300 rounded-lg transition-all"
          >
            FREE TRIAL
          </Link>

          {user ? (
            <button
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              className="px-4 py-1.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all"
            >
              {isAdmin ? '👤 Admin' : '👤 ' + (user.displayName?.split(' ')[0] || 'Profile')}
            </button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all"
            >
              LOGIN
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Quick Links */}
          <div>
            <h4 className="font-black text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/upsc" className="hover:text-white transition-colors">UPSC</Link></li>
              <li><Link to="/tnpsc" className="hover:text-white transition-colors">TNPSC</Link></li>
              <li><Link to="/free-trial" className="hover:text-white transition-colors">Free Trial</Link></li>
            </ul>
          </div>

          {/* FAQ */}
          <div>
            <h4 className="font-black text-white mb-4">FAQ</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link to="/refund-policy" className="hover:text-white transition-colors">Refund &amp; Cancellation</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="font-black text-white mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a href="https://wa.me/918050713535" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-400 transition-colors">
                  <span>💬</span>
                  <span className="text-green-400">WhatsApp: +91 8050713535</span>
                </a>
                <p className="text-xs text-gray-500 ml-6">Available 24×7</p>
              </li>
              <li>
                <a href="https://t.me/civilserviceskendra" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                  <span>✈️</span>
                  <span className="text-blue-400">t.me/civilserviceskendra</span>
                </a>
              </li>
              <li>
                <a href="mailto:civilserviceskendra@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
                  <span>✉️</span>
                  <span>civilserviceskendra@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Civil Services Kendra. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<AppLayout><Home /></AppLayout>} />
        <Route path="/login" element={<Login />} />
        <Route path="/upsc" element={<AppLayout><UPSC /></AppLayout>} />
        <Route path="/tnpsc" element={<AppLayout><TNPSC /></AppLayout>} />
        <Route path="/courses" element={<AppLayout><Courses /></AppLayout>} />
        <Route path="/contact" element={<AppLayout><Contact /></AppLayout>} />
        <Route path="/free-trial" element={<AppLayout><FreeTrial /></AppLayout>} />
        <Route path="/free-lectures" element={<AppLayout><FreeLectures /></AppLayout>} />
        <Route path="/privacy-policy" element={<AppLayout><PrivacyPolicy /></AppLayout>} />
        <Route path="/terms" element={<AppLayout><TermsAndConditions /></AppLayout>} />
        <Route path="/refund-policy" element={<AppLayout><RefundPolicy /></AppLayout>} />
        <Route path="/payment" element={<AppLayout><Payment /></AppLayout>} />
        <Route path="/course/:courseId" element={<ProtectedRoute><AppLayout><CourseContentPage /></AppLayout></ProtectedRoute>} />
        <Route path="/course-detail/:id" element={<AppLayout><CourseDetail /></AppLayout>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/upload-video" element={<AdminRoute><VideoUpload /></AdminRoute>} />
        <Route path="/admin-upload" element={<AdminRoute><AdminCourseUpload /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}

