import React, {useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { logout } from '../firebase/auth.ts'
import { getStudentStats, getVideosWatchedByUser, getMockTestScoresByUser, isUserAdmin, getLiveSessions, getVideosFromDatabase, addVideoToDatabase, FirestoreLiveSession, enrollUserInCourse, removeUserEnrollment } from '../firebase/firestore.ts'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase/config.ts'
import { initProtections } from '../utils/protections'
import MockTestEngine from '../components/MockTestEngine'
import FolderView from '../components/FolderView'
import { logVideoWatch, logMockTestCompletion } from '../utils/progressTracker.ts'
import { SAMPLE_MATERIALS, organizeByCategory } from '../utils/resourceManager.ts'
import { getAllStudents, StudentInfo } from '../firebase/getAllStudents'

interface Stats {
  totalHoursWatched: number
  videosWatched: number
  mockTestsCompleted: number
  averageTestScore: number
  currentStreak: number
  allTestScores: any[]
}

export default function Dashboard(){
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, enrolledCourses, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [activeTestId, setActiveTestId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [videoTracked, setVideoTracked] = useState(false)
  const [checkingUploadAccess, setCheckingUploadAccess] = useState(false)

  // State for dynamic data
  const [stats, setStats] = useState<Stats | null>(null)
  const [videosWatched, setVideosWatched] = useState<any[]>([])
  const [testScores, setTestScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalVideosCount, setTotalVideosCount] = useState<number>(0)
  const [liveSessions, setLiveSessions] = useState<FirestoreLiveSession[]>([])
  const [sessionFormOpen, setSessionFormOpen] = useState(false)
  const [sessionSaving, setSessionSaving] = useState(false)
  const [sessionDeleting, setSessionDeleting] = useState<string | null>(null)
  const [newSession, setNewSession] = useState({
    title: '', topic: '', instructor: '', description: '',
    scheduledAt: '', duration: 60, meetLink: '',
    status: 'upcoming' as 'upcoming' | 'live' | 'completed',
    category: 'UPSC' as 'UPSC' | 'TNPSC'
  })

  // State for notes feature
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [notesContent, setNotesContent] = useState('')
  const [savedNotes, setSavedNotes] = useState<{[key: string]: string}>({})
  const [currentNoteSession, setCurrentNoteSession] = useState<string>('')

  // ── Mock Test Management (Admin) ──────────────────────────────────────
  interface MockQuestion {
    id: string
    testId: string
    testName: string
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
    category: string
  }
  const [mqTestId, setMqTestId] = useState('gs-paper-1')
  const [allMockQuestions, setAllMockQuestions] = useState<MockQuestion[]>([])
  const [mqModalMode, setMqModalMode] = useState<'add' | 'edit' | null>(null)
  const [mqEditTarget, setMqEditTarget] = useState<MockQuestion | null>(null)
  const [mqForm, setMqForm] = useState({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', category: '' })
  const [mqImportError, setMqImportError] = useState('')

  const MOCK_TEST_OPTIONS = [
    // UPSC → Prelims
    { id: 'upsc-prelims-indian-polity',   name: 'Indian Polity',        group: 'UPSC › Prelims' },
    { id: 'upsc-prelims-history',          name: 'History',               group: 'UPSC › Prelims' },
    { id: 'upsc-prelims-indian-economy',   name: 'Indian Economy',        group: 'UPSC › Prelims' },
    { id: 'upsc-prelims-geography',        name: 'Geography',             group: 'UPSC › Prelims' },
    { id: 'upsc-prelims-environment',      name: 'Environment',           group: 'UPSC › Prelims' },
    { id: 'upsc-prelims-science-tech',     name: 'Science and Tech',      group: 'UPSC › Prelims' },
    { id: 'upsc-prelims-current-affairs',  name: 'Current Affairs',       group: 'UPSC › Prelims' },
    { id: 'upsc-prelims-csat',             name: 'CSAT',                  group: 'UPSC › Prelims' },
    // UPSC → Mains
    { id: 'upsc-mains-gs1', name: 'GS 1', group: 'UPSC › Mains' },
    { id: 'upsc-mains-gs2', name: 'GS 2', group: 'UPSC › Mains' },
    { id: 'upsc-mains-gs3', name: 'GS 3', group: 'UPSC › Mains' },
    { id: 'upsc-mains-gs4', name: 'GS 4', group: 'UPSC › Mains' },
    // TNPSC → Prelims
    { id: 'tnpsc-prelims-indian-polity',   name: 'Indian Polity',                               group: 'TNPSC › Prelims' },
    { id: 'tnpsc-prelims-history',          name: 'History (Indian History + INM + TN History)', group: 'TNPSC › Prelims' },
    { id: 'tnpsc-prelims-geography',        name: 'Geography',                                   group: 'TNPSC › Prelims' },
    { id: 'tnpsc-prelims-indian-economy',   name: 'Indian Economy',                              group: 'TNPSC › Prelims' },
    { id: 'tnpsc-prelims-unit9',            name: 'Unit 9',                                      group: 'TNPSC › Prelims' },
    { id: 'tnpsc-prelims-current-affairs',  name: 'Current Affairs',                             group: 'TNPSC › Prelims' },
    { id: 'tnpsc-prelims-aptitude',         name: 'Aptitude',                                    group: 'TNPSC › Prelims' },
    // TNPSC → Mains
    { id: 'tnpsc-mains-gs1', name: 'GS 1', group: 'TNPSC › Mains' },
    { id: 'tnpsc-mains-gs2', name: 'GS 2', group: 'TNPSC › Mains' },
    { id: 'tnpsc-mains-gs3', name: 'GS 3', group: 'TNPSC › Mains' },
  ]

  const loadMQs = (testId: string): MockQuestion[] => {
    try {
      const raw = localStorage.getItem(`mockQuestions_${testId}`)
      if (raw) return JSON.parse(raw) as MockQuestion[]
    } catch {}
    return []
  }
  const saveMQs = (testId: string, questions: MockQuestion[]) => {
    localStorage.setItem(`mockQuestions_${testId}`, JSON.stringify(questions))
  }

  const openAddMQ = () => {
    setMqForm({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', category: '' })
    setMqEditTarget(null)
    setMqModalMode('add')
  }
  const openEditMQ = (q: MockQuestion) => {
    setMqForm({ question: q.question, options: [...q.options], correctAnswer: q.correctAnswer, explanation: q.explanation, category: q.category })
    setMqEditTarget(q)
    setMqModalMode('edit')
  }
  const deleteMQ = (id: string) => {
    if (!confirm('Delete this question?')) return
    const updated = allMockQuestions.filter(q => q.id !== id)
    setAllMockQuestions(updated)
    saveMQs(mqTestId, updated)
  }
  const saveMQForm = () => {
    if (!mqForm.question.trim() || mqForm.options.some((o: string) => !o.trim())) {
      alert('Please fill in the question and all 4 options.')
      return
    }
    if (mqModalMode === 'add') {
      const newQ: MockQuestion = { id: Date.now().toString(), testId: mqTestId, testName: mqTestId, ...mqForm }
      const updated = [...allMockQuestions, newQ]
      setAllMockQuestions(updated)
      saveMQs(mqTestId, updated)
    } else if (mqModalMode === 'edit' && mqEditTarget) {
      const updated = allMockQuestions.map((q: MockQuestion) => q.id === mqEditTarget.id ? { ...q, ...mqForm } : q)
      setAllMockQuestions(updated)
      saveMQs(mqTestId, updated)
    }
    setMqModalMode(null)
  }

  const handleMQImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMqImportError('')
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        const lines = text.split('\n').filter((l: string) => l.trim())
        const imported: MockQuestion[] = []
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c: string) => c.trim().replace(/^"|"$/g, ''))
          if (cols.length < 6) continue
          imported.push({
            id: `${Date.now()}_${i}`,
            testId: mqTestId,
            testName: mqTestId,
            question: cols[0],
            options: [cols[1], cols[2], cols[3], cols[4]],
            correctAnswer: parseInt(cols[5]) || 0,
            explanation: cols[6] || '',
            category: cols[7] || '',
          })
        }
        if (imported.length === 0) { setMqImportError('No valid rows found. Check format.'); return }
        const updated = [...allMockQuestions, ...imported]
        setAllMockQuestions(updated)
        saveMQs(mqTestId, updated)
        alert(`Imported ${imported.length} question(s) successfully!`)
        e.target.value = ''
      } catch {
        setMqImportError('Failed to parse file. Ensure CSV format is correct.')
      }
    }
    reader.readAsText(file)
  }

  React.useEffect(() => {
    if (activeTab === 'tests' && isAdmin) {
      setAllMockQuestions(loadMQs(mqTestId))
    }
  }, [activeTab, mqTestId, isAdmin])

  // Demo data for testing/preview
  const [showDemoData, setShowDemoData] = useState(false)

  // Use displayed stats (real or demo)
  const displayStats = showDemoData && (!stats?.videosWatched || stats.videosWatched === 0) ? {
    totalHoursWatched: 24.5,
    videosWatched: 32,
    mockTestsCompleted: 8,
    averageTestScore: 78,
    currentStreak: 12,
    allTestScores: []
  } : stats

  const displayVideos = showDemoData && videosWatched.length === 0 ? [
    { id: '1', videoTitle: 'Indian Polity - Fundamentals', duration: '45 min', watchedAt: { toDate: () => new Date() } },
    { id: '2', videoTitle: 'Modern History - Freedom Struggle', duration: '52 min', watchedAt: { toDate: () => new Date() } },
    { id: '3', videoTitle: 'Economics - GDP & Inflation', duration: '38 min', watchedAt: { toDate: () => new Date() } }
  ] : videosWatched

  const displayTestScores = showDemoData && testScores.length === 0 ? [
    { id: '1', testName: 'General Studies - Paper 1', score: 82, takenAt: { toDate: () => new Date() } },
    { id: '2', testName: 'Current Affairs Test', score: 75, takenAt: { toDate: () => new Date() } }
  ] : testScores

  useEffect(()=>{
    if (user?.email) {
      initProtections(user.email, 'CSK - Civil Services Kendra')
    }
  },[user])

  // Fetch student stats and progress
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.uid) {
        // Set defaults immediately for non-logged in users
        setStats({
          totalHoursWatched: 0,
          videosWatched: 0,
          mockTestsCompleted: 0,
          averageTestScore: 0,
          currentStreak: 0,
          allTestScores: []
        })
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Fetch ALL data in parallel with Promise.allSettled for faster loading
        const [statsResult, videosResult, scoresResult, sessionsResult, allVideosResult] = await Promise.allSettled([
          getStudentStats(user.uid),
          getVideosWatchedByUser(user.uid),
          getMockTestScoresByUser(user.uid),
          getLiveSessions(),
          getVideosFromDatabase()
        ])

        // Process stats
        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value)
        } else {
          console.warn('⚠️ Stats unavailable, using defaults')
          setStats({
            totalHoursWatched: 0,
            videosWatched: 0,
            mockTestsCompleted: 0,
            averageTestScore: 0,
            currentStreak: 0,
            allTestScores: []
          })
        }
        
        // Process videos
        if (videosResult.status === 'fulfilled') {
          setVideosWatched(videosResult.value)
        } else {
          console.warn('⚠️ Videos unavailable')
          setVideosWatched([])
        }
        
        // Process test scores
        if (scoresResult.status === 'fulfilled') {
          setTestScores(scoresResult.value)
        } else {
          console.warn('⚠️ Test scores unavailable')
          setTestScores([])
        }

        // Process live sessions
        if (sessionsResult.status === 'fulfilled') {
          setLiveSessions(sessionsResult.value)
        } else {
          console.warn('⚠️ Live sessions unavailable')
          setLiveSessions([])
        }

        // Process total videos count
        if (allVideosResult.status === 'fulfilled') {
          setTotalVideosCount(allVideosResult.value.length)
        }


      } catch (err: any) {
        console.error('Failed to fetch student data:', err)
        // Use defaults on error
        setStats({
          totalHoursWatched: 0,
          videosWatched: 0,
          mockTestsCompleted: 0,
          averageTestScore: 0,
          currentStreak: 0,
          allTestScores: []
        })
      } finally {
        setLoading(false)
      }
    }

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Loading timeout - using default data')
        setStats({
          totalHoursWatched: 0,
          videosWatched: 0,
          mockTestsCompleted: 0,
          averageTestScore: 0,
          currentStreak: 0,
          allTestScores: []
        })
        setLoading(false)
      }
    }, 3000) // 3 second timeout

    fetchStudentData()

    return () => clearTimeout(timeoutId)
  }, [user?.uid])

  // ============================================
  // HANDLE LOGOUT
  // ============================================
  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      setLoggingOut(false)
    }
  }

  // ============================================
  // TRACK VIDEO WATCH FROM MODAL
  // ============================================
  const handleMarkVideoWatched = async () => {
    if (!user?.uid || !selectedVideo || videoTracked) return
    
    try {
      // Use courseId as a fallback if not available
      const courseId = selectedVideo.id || Math.random().toString(36).substr(2, 9)
      await logVideoWatch(
        user.uid,
        courseId,
        selectedVideo.url || '',
        selectedVideo.title || 'Unknown Video',
        parseInt(selectedVideo.duration) || 45
      )
      setVideoTracked(true)
      alert('✅ Video marked as watched! Your progress has been updated.')
    } catch (error: any) {
      console.error('❌ Failed to track video:', error)
      alert('Failed to track video. Please try again.')
    }
  }

  // Check if user has admin role
  const handleOpenUploadVideos = () => {
    if (!user?.uid) {
      alert('Please login to access upload features.')
      navigate('/login')
      return
    }

    if (!isAdmin) {
      alert('Only admin accounts can upload videos.')
      return
    }

    navigate('/upload-video')
  }

  // Add a live session (admin)
  const handleAddSession = async () => {
    if (!newSession.title.trim() || !newSession.meetLink.trim() || !newSession.scheduledAt) {
      alert('Please fill in Title, Meet Link, and Scheduled Date/Time.')
      return
    }
    setSessionSaving(true)
    try {
      const { addLiveSession } = await import('../firebase/firestore.ts')
      await addLiveSession({
        ...newSession,
        scheduledAt: new Date(newSession.scheduledAt),
        duration: Number(newSession.duration),
      })
      const updated = await getLiveSessions()
      setLiveSessions(updated)
      setSessionFormOpen(false)
      setNewSession({ title: '', topic: '', instructor: '', description: '', scheduledAt: '', duration: 60, meetLink: '', status: 'upcoming', category: 'UPSC' })
      alert('✅ Live session added!')
    } catch (e) {
      alert('❌ Failed to add session. Please try again.')
    } finally {
      setSessionSaving(false)
    }
  }

  // Delete a live session (admin)
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Delete this live session?')) return
    setSessionDeleting(sessionId)
    try {
      const { deleteLiveSession } = await import('../firebase/firestore.ts')
      await deleteLiveSession(sessionId)
      setLiveSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch (e) {
      alert('❌ Failed to delete session.')
    } finally {
      setSessionDeleting(null)
    }
  }

  // Fallback data in case of loading
  const mockTests = [
    { id: 1, title: "General Studies - Paper 1", duration: "2 hrs", questions: 100, taken: true, score: 78 },
    { id: 2, title: "General Studies - Paper 2", duration: "2 hrs", questions: 100, taken: true, score: 82 },
    { id: 3, title: "General Studies - Paper 3", duration: "2 hrs", questions: 100, taken: false, score: null },
  ]

  const videos = [
    { id: 1, title: "Modern Indian History - Basics", duration: "45 min", watched: true },
    { id: 2, title: "Contemporary Events", duration: "38 min", watched: true },
    { id: 3, title: "Constitutional Framework", duration: "52 min", watched: false },
    { id: 4, title: "Indian Economy Overview", duration: "41 min", watched: false },
  ]

  const materials = [
    { id: 1, title: "GS Paper 1 Study Notes", type: "PDF", size: "2.3 MB", downloaded: true },
    { id: 2, title: "Current Affairs Monthly", type: "PDF", size: "1.8 MB", downloaded: true },
    { id: 3, title: "Answer Writing Guide", type: "PDF", size: "3.1 MB", downloaded: false },
  ]

  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // State for enrollment forms
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollCourse, setEnrollCourse] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState('');

  const [removeEmail, setRemoveEmail] = useState('');
  const [removeCourse, setRemoveCourse] = useState('');
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeMsg, setRemoveMsg] = useState('');

  // Helper to find userId by email
  const findUserIdByEmail = (email: string) => {
    const student = students.find(s => s.email === email);
    return student ? student.id : null;
  };

  // Enroll user handler
  const handleEnrollUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollMsg('');
    setEnrollLoading(true);
    try {
      const userId = findUserIdByEmail(enrollEmail);
      if (!userId) throw new Error('User not found. Make sure the user is registered.');
      if (!enrollCourse) throw new Error('Select a course.');
      await enrollUserInCourse(userId, enrollEmail, enrollCourse);
      setEnrollMsg('✅ User enrolled successfully!');
      setEnrollEmail('');
      setEnrollCourse('');
      // Refresh students list
      getAllStudents().then(setStudents);
    } catch (err: any) {
      setEnrollMsg('❌ ' + (err.message || 'Failed to enroll user.'));
    } finally {
      setEnrollLoading(false);
    }
  };

  // Remove enrollment handler
  const handleRemoveEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setRemoveMsg('');
    setRemoveLoading(true);
    try {
      const userId = findUserIdByEmail(removeEmail);
      if (!userId) throw new Error('User not found.');
      if (!removeCourse) throw new Error('Select a course.');
      await removeUserEnrollment(userId, removeCourse);
      setRemoveMsg('✅ Enrollment removed!');
      setRemoveEmail('');
      setRemoveCourse('');
      // Refresh students list
      getAllStudents().then(setStudents);
    } catch (err: any) {
      setRemoveMsg('❌ ' + (err.message || 'Failed to remove enrollment.'));
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Mobile Hamburger Button - Visible on small screens */}
      <div className="fixed top-20 left-4 z-50 lg:hidden">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-all"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar - Hidden on mobile, visible on lg+ */}
      <aside className={`fixed lg:static inset-0 lg:inset-auto w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg sticky top-0 h-screen overflow-y-auto transition-all duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-full flex items-center justify-center shadow-lg">
            {isAdmin ? (
              <span className="text-white text-2xl">👤</span>
            ) : (
              <span className="text-white font-black text-base tracking-wide">
                {user?.displayName ? user.displayName.trim().charAt(0).toUpperCase() : '👤'}
              </span>
            )}
          </div>
          <div className="text-center">
            <h2 className="font-black text-sm text-gray-900 dark:text-white">
              {isAdmin ? 'Admin' : (user?.displayName?.trim() || user?.email?.split('@')[0] || 'User')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{isAdmin ? 'Administrator Panel' : 'Your Learning Platform'}</p>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {/* Overview / Cockpit */}
          <button onClick={() => { setActiveTab('overview'); setSidebarOpen(false) }} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'overview' ? 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            {isAdmin ? '📊 Overview' : `🚀 ${(user?.displayName?.trim().split(' ')[0] || user?.email?.split('@')[0] || 'My')}'s Cockpit`}
          </button>

          {/* Live Sessions — visible to non-admin users only */}
          {!isAdmin && (
            <button onClick={() => { setActiveTab('videos'); setSidebarOpen(false) }} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'videos' ? 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              🔴 Live Sessions
            </button>
          )}

          {/* Admin-only tabs */}
          {isAdmin && (
            <>
              <button onClick={() => { setActiveTab('lectures'); setSidebarOpen(false) }} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'lectures' ? 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                📹 Recorded Lectures
              </button>
              <button onClick={() => { setActiveTab('materials'); setSidebarOpen(false) }} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'materials' ? 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <span className="block">📚 Access Study Materials</span>
                <span className="block text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5">Your Tailored Notes</span>
              </button>
            </>
          )}
        </nav>


        {/* LOGOUT BUTTON */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full px-4 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loggingOut ? '⏳ Logging out...' : '🚪 Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 dark:bg-gray-900">

        {activeTab === 'overview' && (
          <div>
            <div className="mb-8">
              {isAdmin ? (
                <h1 className="text-4xl font-black text-gray-900 dark:text-white">Hello Admin 👋</h1>
              ) : (
                <h1 className="text-4xl font-black text-gray-900 dark:text-white">
                  {(() => {
                    const firstName = user?.displayName?.trim().split(' ')[0] || user?.email?.split('@')[0] || 'My'
                    return `${firstName}'s Cockpit 🚀`
                  })()}
                </h1>
              )}
            </div>

            {/* Admin dashboard features for admins only */}
            {isAdmin && (
              <>
                {/* Next Session Card */}
                {/* ...Insert Next Session, Manage Live Sessions, Mock Tests, Free Trial, Students, Enrollments, Reports, etc. from old Admin.tsx here... */}
                {/* For each section, wrap in a card/div as in Admin.tsx, and use the same state/handlers as before, but now in Dashboard.tsx */}

                {/* Students Section */}
                <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-900">Manage Students</h2>
                    <button
                      className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all text-sm"
                      onClick={() => {
                        setStudentsLoading(true);
                        getAllStudents().then(setStudents).finally(() => setStudentsLoading(false));
                      }}
                      disabled={studentsLoading}
                    >
                      {studentsLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b-2 border-gray-300">
                        <tr>
                          <th className="text-left py-3 font-bold text-gray-700">Name</th>
                          <th className="text-left py-3 font-bold text-gray-700">Email</th>
                          <th className="text-left py-3 font-bold text-gray-700">Courses</th>
                          <th className="text-left py-3 font-bold text-gray-700">Status</th>
                          <th className="text-right py-3 font-bold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {studentsLoading ? (
                          <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading students...</td></tr>
                        ) : students.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-8 text-gray-400">No students found.</td></tr>
                        ) : (
                          students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="py-4 font-semibold text-gray-900">{student.displayName || '—'}</td>
                              <td className="py-4 text-gray-600">{student.email}</td>
                              <td className="py-4 text-gray-600">{student.enrolledCourses?.join(', ') || '—'}</td>
                              <td className="py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${student.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{student.paymentStatus}</span>
                              </td>
                              <td className="py-4 text-right">
                                <button className="text-indigo-600 font-bold text-sm" onClick={() => alert('Edit coming soon!')}>Edit</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Enrollments Section */}
                <div className="space-y-6 mb-8">
                  <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
                    <h3 className="text-xl font-black text-gray-900 mb-6">➕ Enroll New User</h3>
                    <form onSubmit={handleEnrollUser} className="flex flex-col gap-4 max-w-xl">
                      <input
                        type="email"
                        placeholder="User Email"
                        value={enrollEmail}
                        onChange={e => setEnrollEmail(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
                        required
                      />
                      <select
                        value={enrollCourse}
                        onChange={e => setEnrollCourse(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
                        required
                      >
                        <option value="">Select Course</option>
                        <option value="tnpsc-prelims">TNPSC Group 1 Prelims</option>
                        <option value="tnpsc-prelims-mains">TNPSC Group 1 Prelims + Mains</option>
                        <option value="tnpsc-mentorship">TNPSC Personal Mentorship</option>
                        <option value="upsc-prelims">UPSC CSE Prelims</option>
                        <option value="upsc-prelims-mains">UPSC CSE Prelims + Mains</option>
                        <option value="upsc-mentorship">UPSC Personal Mentorship</option>
                      </select>
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white font-bold rounded-lg px-4 py-2 hover:bg-indigo-700 transition-all"
                        disabled={enrollLoading}
                      >
                        {enrollLoading ? 'Enrolling...' : 'Enroll User'}
                      </button>
                      {enrollMsg && <div className="text-sm mt-2 font-bold" style={{ color: enrollMsg.startsWith('✅') ? 'green' : 'red' }}>{enrollMsg}</div>}
                    </form>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
                    <h3 className="text-xl font-black text-gray-900 mb-6">🗑️ Remove Enrollment</h3>
                    <form onSubmit={handleRemoveEnrollment} className="flex flex-col gap-4 max-w-xl">
                      <input
                        type="email"
                        placeholder="User Email"
                        value={removeEmail}
                        onChange={e => setRemoveEmail(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
                        required
                      />
                      <select
                        value={removeCourse}
                        onChange={e => setRemoveCourse(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
                        required
                      >
                        <option value="">Select Course</option>
                        <option value="tnpsc-prelims">TNPSC Group 1 Prelims</option>
                        <option value="tnpsc-prelims-mains">TNPSC Group 1 Prelims + Mains</option>
                        <option value="tnpsc-mentorship">TNPSC Personal Mentorship</option>
                        <option value="upsc-prelims">UPSC CSE Prelims</option>
                        <option value="upsc-prelims-mains">UPSC CSE Prelims + Mains</option>
                        <option value="upsc-mentorship">UPSC Personal Mentorship</option>
                      </select>
                      <button
                        type="submit"
                        className="bg-red-600 text-white font-bold rounded-lg px-4 py-2 hover:bg-red-700 transition-all"
                        disabled={removeLoading}
                      >
                        {removeLoading ? 'Removing...' : 'Remove Enrollment'}
                      </button>
                      {removeMsg && <div className="text-sm mt-2 font-bold" style={{ color: removeMsg.startsWith('✅') ? 'green' : 'red' }}>{removeMsg}</div>}
                    </form>
                  </div>
                </div>

                {/* Reports Section */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
                  <h2 className="text-2xl font-black text-gray-900 mb-6">Reports & Analytics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 border-2 border-indigo-200">
                      <h3 className="font-bold text-gray-900 mb-4">📊 Monthly Revenue</h3>
                      <div className="text-4xl font-black text-indigo-600 mb-2">₹45.2L</div>
                      <p className="text-sm text-gray-700">+18% from last month</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-6 border-2 border-emerald-200">
                      <h3 className="font-bold text-gray-900 mb-4">📈 Student Growth</h3>
                      <div className="text-4xl font-black text-emerald-600 mb-2">8,245</div>
                      <p className="text-sm text-gray-700">+12% from last month</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                ⚠️ {error}
              </div>
            )}

            {/* ── MY COURSES ─────────────────────────────────────────────── */}
            {!isAdmin && (
              <MyCourses enrolledCourses={enrolledCourses} navigate={navigate} />
            )}

            {loading ? (
              <div className="space-y-6">
                {displayStats && !isAdmin ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-6 border-2 border-gray-200 h-64 animate-pulse"></div>
                  </div>
                ) : null}
                <div className="bg-white rounded-xl p-6 border-2 border-gray-200 h-64 animate-pulse"></div>
              </div>
            ) : (
              <>
                {/* Total Videos Watched Card */}
                <button
                  onClick={() => setActiveTab('videos')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-indigo-100 dark:border-indigo-900 shadow-md hover:shadow-lg hover:border-indigo-300 transition-all transform hover:scale-105 text-left cursor-pointer"
                >
                  <p className="text-gray-600 dark:text-gray-400 font-semibold text-sm">Total Videos Watched</p>
                  <p className="text-3xl font-black text-indigo-600 mt-2">
                    {displayStats?.videosWatched ?? 0}
                    <span className="text-lg font-semibold text-gray-400 dark:text-gray-500"> / {totalVideosCount > 0 ? totalVideosCount : (showDemoData ? 45 : 0)}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {(displayStats?.videosWatched ?? 0) > 0 ? (
                      <>▶️ {displayStats!.videosWatched} watched so far</>
                    ) : (
                      <>👆 Click to watch videos</>
                    )}
                  </p>
                </button>

                {/* Avg Score Card */}
                <button
                  onClick={() => setActiveTab('tests')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-blue-100 dark:border-blue-900 shadow-md hover:shadow-lg hover:border-blue-300 transition-all transform hover:scale-105 text-left cursor-pointer"
                >
                  <p className="text-gray-600 dark:text-gray-400 font-semibold text-sm">Avg Score</p>
                  <p className="text-3xl font-black text-blue-600 mt-2">
                    {(displayStats?.averageTestScore ?? 0) > 0 ? displayStats!.averageTestScore : '0'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {(displayStats?.mockTestsCompleted ?? 0) > 0 ? (
                      <>{displayStats!.mockTestsCompleted} tests taken</>
                    ) : (
                      <>👆 Click to take tests</>
                    )}
                  </p>
                </button>

                {/* Streak Card */}
                <button
                  onClick={() => {
                    alert('🔥 Study daily to build your streak!\n\nTips:\n• Watch at least 1 video daily\n• Complete mock tests regularly\n• Download study materials\n• Attend live sessions')
                  }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-purple-100 dark:border-purple-900 shadow-md hover:shadow-lg hover:border-purple-300 transition-all transform hover:scale-105 text-left cursor-pointer"
                >
                  <p className="text-gray-600 dark:text-gray-400 font-semibold text-sm">Streak</p>
                  <p className="text-3xl font-black text-purple-600 mt-2">
                    {(displayStats?.currentStreak ?? 0) > 0 ? displayStats!.currentStreak : '0'} days
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {(displayStats?.currentStreak ?? 0) > 0 ? 'Keep it going! 🔥' : '👆 Start your streak!'}
                  </p>
                </button>

                {/* Rank Card */}
                <button
                  onClick={() => {
                    const score = displayStats?.averageTestScore ?? 0
                    const testsDone = displayStats?.mockTestsCompleted ?? 0
                    const rank = score > 80 ? '#245' : score > 60 ? '#1,245' : testsDone > 0 ? '#5,678' : 'N/A'
                    const percentile = score > 80 ? 'Top 1%' : score > 60 ? 'Top 3%' : testsDone > 0 ? 'Top 15%' : 'No rank yet'
                    alert(`🏆 Your Current Rank\n\nRank: ${rank}\nPercentile: ${percentile}\n\n${testsDone === 0 ? '💡 Take mock tests to get ranked!' : score === 0 ? '💪 Keep trying! Every attempt counts!' : '💪 Keep studying to climb higher!'}`)
                  }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-pink-100 dark:border-pink-900 shadow-md hover:shadow-lg hover:border-pink-300 transition-all transform hover:scale-105 text-left cursor-pointer"
                >
                  <p className="text-gray-600 dark:text-gray-400 font-semibold text-sm">Rank (Est.)</p>
                  <p className="text-3xl font-black text-pink-600 mt-2">
                    {(() => { const s = displayStats?.averageTestScore ?? 0; const t = displayStats?.mockTestsCompleted ?? 0; return s > 80 ? '#245' : s > 60 ? '#1,245' : t > 0 ? '#5,678' : '--' })()}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {(() => { const s = displayStats?.averageTestScore ?? 0; const t = displayStats?.mockTestsCompleted ?? 0; return s > 80 ? 'Top 1% 🚀' : s > 60 ? 'Top 3% 🚀' : t > 0 ? 'Top 15% 📈' : '👆 Start climbing!' })()}
                  </p>
                </button>
              </>
            )}

            {!isAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {displayVideos.slice(0, 3).length > 0 ? (
                      <>
                        {displayVideos.slice(0, 3).map((v: any) => (
                          <div key={v.id} className="flex gap-3 pb-3 border-b border-gray-200">
                            <div className="text-2xl">▶️</div>
                            <div>
                              <p className="font-semibold text-gray-900">{v.videoTitle || 'Video'}</p>
                              <p className="text-xs text-gray-500">Watched • {v.watchedAt?.toDate?.().toLocaleDateString?.() || 'Recently'}</p>
                            </div>
                          </div>
                        ))}
                        {displayTestScores.slice(0, 1).map((t: any) => (
                          <div key={t.id} className="flex gap-3 pb-3 border-b border-gray-200">
                            <div className="text-2xl">✅</div>
                            <div>
                              <p className="font-semibold text-gray-900">{t.testName}</p>
                              <p className="text-xs text-gray-500">Scored {t.score}% • {t.takenAt?.toDate?.().toLocaleDateString?.() || 'Recently'}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <p className="text-sm">No activity yet. Start learning!</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 shadow-lg text-white">
                  <h3 className="text-lg font-black mb-4">Next Session</h3>
                  <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 mb-4">
                    <p className="font-bold text-lg">Modern Indian History - Advanced</p>
                    <p className="text-indigo-100 text-sm mt-1">📅 Tomorrow at 6:00 PM</p>
                    <p className="text-indigo-100 text-sm">👨‍🏫 Hosted by Rahul</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!('Notification' in window)) {
                        alert('Your browser does not support notifications.')
                        return
                      }
                      const permission = await Notification.requestPermission()
                      if (permission === 'granted') {
                        // Schedule reminder 30 min before — 6:00 PM tomorrow = next occurrence
                        const now = new Date()
                        const session = new Date()
                        session.setDate(now.getDate() + 1)
                        session.setHours(17, 30, 0, 0) // 5:30 PM reminder for 6 PM session
                        const delay = session.getTime() - now.getTime()
                        if (delay > 0) {
                          setTimeout(() => {
                            new Notification('📢 CSK Live Session in 30 minutes!', {
                              body: 'Modern Indian History - Advanced starts at 6:00 PM. Get ready!',
                              icon: '/images/csk-logo.png'
                            })
                          }, delay)
                          alert(`✅ Reminder set!\nYou'll get a notification at 5:30 PM tomorrow before the session.`)
                        } else {
                          new Notification('📢 CSK Reminder', { body: 'Your session is starting soon!' })
                          alert('✅ Notification sent!')
                        }
                      } else {
                        alert('❌ Notification permission denied. Please allow notifications in your browser settings.')
                      }
                    }}
                    className="w-full px-4 py-3 bg-yellow-400 text-indigo-900 font-bold rounded-lg hover:bg-yellow-300 transition-all transform hover:scale-105"
                  >
                    Set Reminder
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'videos' && (
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6">🔴 Live Sessions</h2>

            {/* Always-visible Join box */}
            <JoinMeetBox />

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : liveSessions.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-md border border-gray-200 dark:border-gray-700 text-center mt-6">
                <div className="text-6xl mb-4">📡</div>
                <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2">No Live Sessions Scheduled Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  The admin hasn't scheduled any live sessions. Check back soon!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {liveSessions.map((session) => {
                  const scheduledDate = session.scheduledAt?.toDate ? session.scheduledAt.toDate() : new Date(session.scheduledAt)
                  const isLive = session.status === 'live'
                  const isUpcoming = session.status === 'upcoming'
                  const isCompleted = session.status === 'completed'
                  return (
                    <div
                      key={session.id}
                      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-2 ${isLive ? 'border-red-400' : isUpcoming ? 'border-indigo-200' : 'border-gray-200 dark:border-gray-700'} flex flex-col md:flex-row md:items-center gap-4`}
                    >
                      {/* Status badge */}
                      <div className="flex-shrink-0">
                        {isLive && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 font-bold rounded-full text-xs animate-pulse">
                            🔴 LIVE NOW
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 font-bold rounded-full text-xs">
                            📅 UPCOMING
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 font-bold rounded-full text-xs">
                            ✅ COMPLETED
                          </span>
                        )}
                      </div>

                      {/* Session info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{session.title}</h3>
                        {session.topic && <p className="text-xs font-semibold text-indigo-500 mt-0.5 uppercase tracking-wide">{session.topic}</p>}
                        {session.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{session.description}</p>}
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {session.instructor && <span>👨‍🏫 {session.instructor}</span>}
                          <span>📅 {scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          {session.duration && <span>⏱ {session.duration} min</span>}
                          {session.category && <span>🏷 {session.category}</span>}
                        </div>
                      </div>

                      {/* Join button */}
                      {(isLive || isUpcoming) && (
                        <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                          {session.meetLink ? (
                            <button
                              onClick={() => window.open(session.meetLink, '_blank')}
                              className={`px-6 py-3 font-bold rounded-xl transition-all transform hover:scale-105 text-sm whitespace-nowrap ${isLive ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                            >
                              {isLive ? '🔴 Join Now' : '🔗 Join Live Session'}
                            </button>
                          ) : (
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Enter Meet ID or link"
                                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value.trim()
                                    if (val) {
                                      const url = val.startsWith('http') ? val : `https://meet.google.com/${val}`
                                      window.open(url, '_blank')
                                    }
                                  }
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  const input = (e.currentTarget.previousSibling as HTMLInputElement)
                                  const val = input?.value?.trim()
                                  if (val) {
                                    const url = val.startsWith('http') ? val : `https://meet.google.com/${val}`
                                    window.open(url, '_blank')
                                  }
                                }}
                                className={`px-4 py-2 font-bold rounded-xl transition-all ${isLive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                              >
                                {isLive ? '🔴 Join' : '🔗 Join'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {isCompleted && (
                        <span className="flex-shrink-0 px-6 py-3 bg-gray-100 text-gray-400 font-bold rounded-xl text-sm cursor-not-allowed">Session Ended</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'materials' && (
          <div>
            <FolderView category="study-material" allowedExams={enrolledCourses} />
          </div>
        )}

        {activeTab === 'lectures' && (
          <div>
            <FolderView category="recorded-lectures" allowedExams={enrolledCourses} />
          </div>
        )}

        {activeTab === 'tests' && (
          <div>
            {isAdmin ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">✅ Mock Test Management</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add, edit, delete or import questions for any test.</p>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={openAddMQ}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all shadow"
                    >
                      ➕ Add Question
                    </button>
                    <button
                      onClick={() => {
                        if (allMockQuestions.length === 0) { alert('No questions to remove in this test.'); return }
                        const list = allMockQuestions.map((q, i) => `${i + 1}. ${q.question.slice(0, 70)}`).join('\n')
                        const num = prompt(`Enter question number to remove (1–${allMockQuestions.length}):\n\n${list}`)
                        if (!num) return
                        const idx = parseInt(num) - 1
                        if (isNaN(idx) || idx < 0 || idx >= allMockQuestions.length) { alert('Invalid number.'); return }
                        deleteMQ(allMockQuestions[idx].id)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow"
                    >
                      🗑️ Remove Question
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow cursor-pointer">
                      📥 Import CSV / Excel
                      <input type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" onChange={handleMQImport} />
                    </label>
                  </div>
                </div>

                {/* Add Mock Test heading before timer */}
                <h3 className="text-xl font-black text-gray-900 dark:text-white mt-8 mb-4">Mock Test</h3>

                {/* Test Selector */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-gray-700">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Mock Test</label>
                  <select
                    value={mqTestId}
                    onChange={e => setMqTestId(e.target.value)}
                    className="w-full sm:w-96 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {['UPSC › Prelims', 'UPSC › Mains', 'TNPSC › Prelims', 'TNPSC › Mains'].map(group => (
                      <optgroup key={group} label={group}>
                        {MOCK_TEST_OPTIONS.filter(t => t.group === group).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-2">{allMockQuestions.length} question(s) in this test</p>
                </div>

                {/* Import error */}
                {mqImportError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-xs text-red-600 dark:text-red-400 font-bold">
                    ⚠ {mqImportError}
                  </div>
                )}

                {/* Questions List */}
                {allMockQuestions.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                    <p className="text-5xl mb-3">📝</p>
                    <p className="font-semibold">No questions yet.</p>
                    <p className="text-sm">Click "Add Question" or import a CSV file to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allMockQuestions.map((q, idx) => (
                      <div key={q.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-gray-700">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-0.5 rounded-full">Q{idx + 1}</span>
                              {q.category && <span className="text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">{q.category}</span>}
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm mb-3">{q.question}</p>
                            <ul className="space-y-1">
                              {q.options.map((opt, i) => (
                                <li key={i} className={`text-xs px-3 py-1.5 rounded-lg ${i === q.correctAnswer ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold' : 'bg-gray-50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400'}`}>
                                  {['A', 'B', 'C', 'D'][i]}. {opt} {i === q.correctAnswer && '✓'}
                                </li>
                              ))}
                            </ul>
                            {q.explanation && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">💡 {q.explanation}</p>}
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <button
                              onClick={() => openEditMQ(q)}
                              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 font-bold rounded-lg text-xs transition-all"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => deleteMQ(q.id)}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 font-bold rounded-lg text-xs transition-all"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add / Edit Modal */}
                {mqModalMode && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">
                        {mqModalMode === 'add' ? '➕ Add New Question' : '✏️ Edit Question'}
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Question <span className="text-red-500">*</span></label>
                          <textarea
                            rows={3}
                            value={mqForm.question}
                            onChange={e => setMqForm(f => ({ ...f, question: e.target.value }))}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="Enter question text..."
                          />
                        </div>

                        {['A', 'B', 'C', 'D'].map((letter, i) => (
                          <div key={i}>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Option {letter} <span className="text-red-500">*</span>
                              {i === mqForm.correctAnswer && <span className="ml-2 text-green-600 text-xs">(Correct Answer)</span>}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={mqForm.options[i]}
                                onChange={e => {
                                  const opts = [...mqForm.options]
                                  opts[i] = e.target.value
                                  setMqForm(f => ({ ...f, options: opts }))
                                }}
                                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder={`Option ${letter}`}
                              />
                              <button
                                onClick={() => setMqForm(f => ({ ...f, correctAnswer: i }))}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${mqForm.correctAnswer === i ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-green-100'}`}
                              >
                                ✓
                              </button>
                            </div>
                          </div>
                        ))}

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                          <input
                            type="text"
                            value={mqForm.category}
                            onChange={e => setMqForm(f => ({ ...f, category: e.target.value }))}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Polity, History, Economics..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Explanation</label>
                          <textarea
                            rows={2}
                            value={mqForm.explanation}
                            onChange={e => setMqForm(f => ({ ...f, explanation: e.target.value }))}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="Optional explanation for the correct answer..."
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={saveMQForm}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
                        >
                          {mqModalMode === 'add' ? '➕ Add Question' : '💾 Save Changes'}
                        </button>
                        <button
                          onClick={() => setMqModalMode(null)}
                          className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <FolderView
                category="mock-tests"
                allowedExams={enrolledCourses}
                onStartTest={(testId, testName) => {
                  setActiveTestId(testId)
                }}
              />
            )}
          </div>
        )}

        {/* Mock Test Engine */}
        {activeTestId && (
          <MockTestEngine
            testId={activeTestId}
            testName={activeTestId.replace(/-/g, ' ').toUpperCase()}
            onComplete={async (result) => {
              // Save test results locally
              setTestResults({ score: result.score, testId: activeTestId })
              // Log to Firestore
              if (user?.uid) {
                try {
                  await logMockTestCompletion(
                    user.uid,
                    activeTestId,
                    activeTestId.replace(/-/g, ' ').toUpperCase(),
                    result.percentage,
                    result.total,
                    result.score,
                    30
                  )
                  const updatedStats = await getStudentStats(user.uid)
                  setStats(updatedStats)
                } catch (error) {
                  console.error('❌ Failed to save test results:', error)
                }
              }
            }}
            onClose={() => setActiveTestId(null)}
          />
        )}

        {/* Video Player Modal */}
        <>
          {videoModalOpen && selectedVideo && (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
              <div className="bg-black rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Close Button */}
                <div className="flex justify-between items-center p-4 bg-gray-900">
                  <h3 className="text-white font-black text-lg">{selectedVideo.title}</h3>
                  <button
                    onClick={() => {
                      setVideoModalOpen(false)
                      setVideoTracked(false) // Reset after closing
                    }}
                    className="text-white text-2xl hover:text-gray-300 transition-all"
                  >
                    ✕
                  </button>
                </div>

                {/* Video Player */}
                <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {selectedVideo.url ? (
                    <video
                      key={selectedVideo.url}
                      controls
                      autoPlay
                      className="w-full h-full"
                      style={{ backgroundColor: '#000' }}
                      controlsList="nodownload"
                    >
                      <source src={selectedVideo.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="text-white text-center">
                      <p className="text-xl mb-2">📹</p>
                      <p>Video loading...</p>
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="bg-gray-900 p-6 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Instructor</p>
                      <p className="font-bold text-white">{selectedVideo.instructor || 'Dr. Expert'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Duration</p>
                      <p className="font-bold text-white">{selectedVideo.duration}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Uploaded</p>
                      <p className="font-bold text-white">Mar 4, 2026</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Description</p>
                    <p className="text-gray-300">{selectedVideo.description || 'Comprehensive lecture on this topic'}</p>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-700">
                    <button 
                      onClick={handleMarkVideoWatched}
                      disabled={videoTracked}
                      className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${videoTracked ? 'bg-green-600 text-white cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'}`}
                    >
                      {videoTracked ? '✓ Watched' : '✓ Mark as Watched'}
                    </button>
                    <button className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-all">
                      ⬇️ Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      </main>
    </div>
  )
}

// Helper components and functions should be outside the main Dashboard component

// ─────────────────────────────────────────────────────────────────────────────
// JOIN MEET BOX — always visible in Live Sessions tab
// ─────────────────────────────────────────────────────────────────────────────
function JoinMeetBox() {
  const [meetInput, setMeetInput] = React.useState('')

  const handleJoin = () => {
    const val = meetInput.trim()
    if (!val) return
    const url = val.startsWith('http') ? val : `https://meet.google.com/${val}`
    window.open(url, '_blank')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border-2 border-indigo-200 dark:border-indigo-700 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xl">🎥</div>
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white">Join Google Meet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Enter a Meet link or Meeting ID to join your live class</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={meetInput}
          onChange={e => setMeetInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          placeholder="e.g. abc-defg-hij  or  https://meet.google.com/abc-defg-hij"
          className="flex-1 border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 placeholder-gray-400"
        />
        <button
          onClick={handleJoin}
          disabled={!meetInput.trim()}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all transform hover:scale-105 text-sm whitespace-nowrap shadow-md"
        >
          🔗 Join Now
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        You can paste the full Google Meet URL or just the meeting code (e.g. <span className="font-mono">abc-defg-hij</span>)
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MY COURSES component (shown in Overview for regular users)
// ─────────────────────────────────────────────────────────────────────────────
const ALL_COURSES = [
  { id: 'tnpsc-prelims',       label: 'TNPSC Group 1 Prelims',          icon: '📋', color: 'from-emerald-500 to-teal-600' },
  { id: 'tnpsc-prelims-mains', label: 'TNPSC Group 1 Prelims + Mains',  icon: '📖', color: 'from-teal-500 to-cyan-600' },
  { id: 'tnpsc-mentorship',    label: 'TNPSC Personal Mentorship',       icon: '🤝', color: 'from-cyan-500 to-blue-600' },
  { id: 'upsc-prelims',        label: 'UPSC CSE Prelims',                icon: '🏛️', color: 'from-indigo-500 to-violet-600' },
  { id: 'upsc-prelims-mains',  label: 'UPSC CSE Prelims + Mains',        icon: '📚', color: 'from-violet-500 to-purple-600' },
  { id: 'upsc-mentorship',     label: 'UPSC Personal Mentorship',        icon: '🎓', color: 'from-purple-500 to-pink-600' },
]

function MyCourses({ enrolledCourses, navigate }: { enrolledCourses: string[]; navigate: (path: string) => void }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">My Courses</h2>

      {enrolledCourses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-10 text-center mb-8">
          <div className="text-5xl mb-3">📂</div>
          <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">No courses enrolled yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Once you pay for a course, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_COURSES.filter(c => enrolledCourses.includes(c.id)).map(course => (
            <button
              key={course.id}
              onClick={() => navigate(`/course/${course.id}`)}
              className={`bg-gradient-to-br ${course.color} text-white rounded-2xl p-6 text-left shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]`}
            >
              <div className="text-3xl mb-3">{course.icon}</div>
              <p className="font-black text-base leading-snug">{course.label}</p>
              <p className="text-white/70 text-xs mt-2 flex items-center gap-1">
                Open course →
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sample questions for mock tests
// ─────────────────────────────────────────────────────────────────────────────
function getSampleQuestions(testId: string) {
  const baseQuestions = [
    {
      id: 1,
      question: 'Which of the following is the capital of India?',
      options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'],
      correctAnswer: 1,
      explanation: 'New Delhi is the capital and largest city of India.',
      category: 'Geography',
    },
    {
      id: 2,
      question: 'In which year did India gain independence?',
      options: ['1945', '1947', '1950', '1952'],
      correctAnswer: 1,
      explanation: 'India gained independence on August 15, 1947.',
      category: 'History',
    },
    {
      id: 3,
      question: 'Who was the first Prime Minister of India?',
      options: ['Dr. B.R. Ambedkar', 'Jawaharlal Nehru', 'Sardar Vallabhbhai Patel', 'Rajendra Prasad'],
      correctAnswer: 1,
      explanation: 'Jawaharlal Nehru was the first Prime Minister of India (1947-1964).',
      category: 'History',
    },
    {
      id: 4,
      question: 'What is the maximum number of members in the Lok Sabha?',
      options: ['500', '545', '552', '600'],
      correctAnswer: 2,
      explanation: 'The Lok Sabha (House of the People) can have a maximum of 552 members.',
      category: 'Polity',
    },
    {
      id: 5,
      question: 'Which article of the Indian Constitution defines the legislative powers of Parliament?',
      options: ['Article 79', 'Article 81', 'Article 245', 'Article 256'],
      correctAnswer: 2,
      explanation: 'Article 245 defines the extent of the power to make laws by Parliament.',
      category: 'Polity',
    },
    {
      id: 6,
      question: 'What is GDP primarily a measure of?',
      options: ['Population growth', 'Economic output', 'Inflation rate', 'Unemployment'],
      correctAnswer: 1,
      explanation: 'GDP (Gross Domestic Product) measures the total economic output of a country.',
      category: 'Economics',
    },
    {
      id: 7,
      question: 'Which of the following is NOT a function of the World Bank?',
      options: ['Lending money to countries', 'Providing technical assistance', 'Making laws for member countries', 'Supporting economic development'],
      correctAnswer: 2,
      explanation: 'The World Bank does not make laws; it provides loans and technical assistance for development.',
      category: 'Economics',
    },
    {
      id: 8,
      question: 'The monsoon winds in India are driven by:',
      options: ['Cold currents', 'Pressure differences', 'Coriolis force', 'Ocean waves'],
      correctAnswer: 1,
      explanation: 'Monsoon winds are driven by pressure differences between land and ocean.',
      category: 'Geography',
    },
    {
      id: 9,
      question: 'Which desert is the largest in Asia?',
      options: ['Gobi Desert', 'Arabian Desert', 'Taklamakan Desert', 'Kalahari Desert'],
      correctAnswer: 2,
      explanation: 'The Taklamakan Desert in China is the largest desert in Asia.',
      category: 'Geography',
    },
    {
      id: 10,
      question: 'What is the primary function of the Reserve Bank of India?',
      options: ['Lending to businesses', 'Controlling monetary policy', 'Taxation', 'Import/export control'],
      correctAnswer: 1,
      explanation: 'The RBI is responsible for controlling monetary policy and managing the currency.',
      category: 'Economics',
    },
  ]

  // Return all 10 questions or extend for specific tests
  if (testId === 'gs-paper-1') {
    return baseQuestions.slice(0, 10)
  } else if (testId === 'polity-mock') {
    return baseQuestions.slice(3, 5).concat(baseQuestions.slice(0, 3)).concat(baseQuestions.slice(5, 10))
  } else if (testId === 'economics-mock') {
    return baseQuestions.slice(5, 10).concat(baseQuestions.slice(0, 5))
  } else {
    return baseQuestions
  }
}


