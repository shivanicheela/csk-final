import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VideoUpload from './VideoUpload.tsx'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase/config.ts'
import {
  enrollUserInCourse,
  getUserEnrolledCourses,
  removeUserEnrollment,
  getLiveSessions,
  addLiveSession,
  deleteLiveSession,
  addVideoToDatabase,
  FirestoreLiveSession,
} from '../firebase/firestore.ts'
import { db } from '../firebase/config.ts'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'

// ─── Types ───────────────────────────────────────────────────────────────────
interface NextSession {
  title: string
  date: string
  time: string
  instructor: string
  meetLink: string
}

// Helper: format date+time into human-readable string like "6:00 PM, Tomorrow"
function formatSessionDisplay(date: string, time: string): string {
  if (!date || !time) return '—'
  const sessionDate = new Date(`${date}T${time}`)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  let dayLabel = sessionDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
  if (sessionDate.toDateString() === today.toDateString()) dayLabel = 'Today'
  else if (sessionDate.toDateString() === tomorrow.toDateString()) dayLabel = 'Tomorrow'
  const timeLabel = sessionDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${timeLabel}, ${dayLabel}`
}

interface MockQuestion {
  id?: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  category: string
  testId: string
}

export default function Admin() {
  const navigate = useNavigate()
  // Remove tab state, always show all dashboard sections in Overview
  // Always default to 'overview' if activeTab is not set or invalid
  const validTabs = ['overview', 'next-session', 'mock-tests', 'free-trial', 'students', 'enrollments', 'reports']
  const [activeTab, setActiveTabRaw] = useState('overview')
  const setActiveTab = (tab: string) => {
    setActiveTabRaw(validTabs.includes(tab) ? tab : 'overview')
  }

  // ── Next Session state ────────────────────────────────────────────────────
  const [nextSession, setNextSession] = useState<NextSession>({
    title: '',
    date: '',
    time: '',
    instructor: '',
    meetLink: '',
  })
  const [sessionSaving, setSessionSaving] = useState(false)
  const [sessionMsg, setSessionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Overview inline next-session edit ────────────────────────────────────
  const [overviewSessionEditing, setOverviewSessionEditing] = useState(false)
  const [overviewSession, setOverviewSession] = useState<NextSession>({
    title: 'UPSC Live Class',
    date: '',
    time: '18:00',
    instructor: 'Dr. Ramesh',
    meetLink: '',
  })
  const [overviewSessionSaving, setOverviewSessionSaving] = useState(false)
  const [overviewSessionMsg, setOverviewSessionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Mock Test state ───────────────────────────────────────────────────────
  const [mockTab, setMockTab] = useState<'add' | 'edit' | 'delete' | 'import'>('add')
  const [questions, setQuestions] = useState<MockQuestion[]>([])
  const [qLoading, setQLoading] = useState(false)
  const [qMsg, setQMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newQ, setNewQ] = useState<MockQuestion>({
    question: '', options: ['', '', '', ''], correctAnswer: 0,
    explanation: '', category: '', testId: 'gs-paper-1',
  })
  const [editQ, setEditQ] = useState<MockQuestion | null>(null)
  const [importText, setImportText] = useState('')
  const [mockTestTimer, setMockTestTimer] = useState<number>(60)   // Timer state for mock test

  useEffect(() => {
    const savedTimer = localStorage.getItem('admin_mock_test_timer_minutes')
    if (!savedTimer) return
    const parsedTimer = Number(savedTimer)
    if (!Number.isNaN(parsedTimer) && parsedTimer >= 10) {
      setMockTestTimer(parsedTimer)
    }
  }, [])

  useEffect(() => {
    if (!qMsg?.text.includes('Timer set to')) return

    const normalizedTimer = Number(mockTestTimer)
    if (Number.isNaN(normalizedTimer) || normalizedTimer < 10) {
      setQMsg({ type: 'error', text: 'Please enter a valid timer of at least 10 minutes.' })
      return
    }

    localStorage.setItem('admin_mock_test_timer_minutes', String(normalizedTimer))
    alert(`Timer saved successfully for ${normalizedTimer} minutes.`)
    setQMsg({ type: 'success', text: `Timer saved successfully for ${normalizedTimer} minutes.` })
  }, [qMsg, mockTestTimer])

  // ── Live Session state (for "Enter the link") ─────────────────────────────
  const [liveSessions, setLiveSessions] = useState<FirestoreLiveSession[]>([])
  const [lsLoading, setLsLoading] = useState(false)
  const [lsMsg, setLsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [lsDeleting, setLsDeleting] = useState<string | null>(null)
  const [newLs, setNewLs] = useState({
    title: '', topic: '', instructor: '', description: '',
    scheduledAt: '', duration: 60, meetLink: '',
    status: 'upcoming' as 'upcoming' | 'live' | 'completed',
    category: 'UPSC' as 'UPSC' | 'TNPSC',
  })

  // ── Manage Live Sessions (Overview panel) ────────────────────────────────
  const [manageLsForm, setManageLsForm] = useState({
    title: '', topic: '', instructor: '',
    scheduledAt: '', duration: 60, meetLink: '',
  })
  const [manageLsMsg, setManageLsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [manageLsSaving, setManageLsSaving] = useState(false)

  // ── Free Trial Upload state ───────────────────────────────────────────────
  const FREE_TRIAL_SUBJECTS = [
    { id: 'polity',    name: 'Polity',                  icon: '⚖️', color: 'from-indigo-600 to-indigo-800' },
    { id: 'economy',   name: 'Economy',                 icon: '📈', color: 'from-emerald-600 to-emerald-800' },
    { id: 'geography', name: 'Geography & Environment', icon: '🌍', color: 'from-teal-600 to-teal-800' },
    { id: 'history',   name: 'History',                 icon: '🏛️', color: 'from-amber-600 to-amber-800' },
    { id: 'aptitude',  name: 'Aptitude',                icon: '🔢', color: 'from-purple-600 to-purple-800' },
  ]
  const [ftOpenFolder, setFtOpenFolder] = useState<string | null>(null)
  const [ftUploading, setFtUploading] = useState<string | null>(null)   // subjectId currently uploading
  const [ftProgress, setFtProgress]   = useState<number>(0)
  const [ftMsg, setFtMsg] = useState<{ subject: string; type: 'success' | 'error'; text: string } | null>(null)
  const [ftTitle, setFtTitle]         = useState<Record<string, string>>({})
  const [ftInstructor, setFtInstructor] = useState<Record<string, string>>({})

  async function handleFtUpload(subjectId: string, file: File) {
    const title = ftTitle[subjectId]?.trim() || file.name.replace(/\.[^/.]+$/, '')
    setFtUploading(subjectId)
    setFtProgress(0)
    setFtMsg(null)
    try {
      const fileName = `${Date.now()}_${file.name}`
      const storageRef = ref(storage, `free-trial/${subjectId}/${fileName}`)
      const task = uploadBytesResumable(storageRef, file)
      await new Promise<void>((resolve, reject) => {
        task.on('state_changed',
          snap => setFtProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          resolve
        )
      })
      const url = await getDownloadURL(task.snapshot.ref)
      await addVideoToDatabase({
        title,
        instructor: ftInstructor[subjectId]?.trim() || '',
        duration: '',
        description: '',
        url,
        courseId: `free-trial-${subjectId}`,
        uploadedBy: 'admin',
        // @ts-ignore
        isFree: true,
        subject: subjectId,
      })
      setFtMsg({ subject: subjectId, type: 'success', text: `✅ "${title}" uploaded successfully!` })
      setFtTitle(prev => ({ ...prev, [subjectId]: '' }))
      setFtInstructor(prev => ({ ...prev, [subjectId]: '' }))
    } catch (err: any) {
      setFtMsg({ subject: subjectId, type: 'error', text: `❌ Upload failed: ${err.message}` })
    }
    setFtUploading(null)
    setFtProgress(0)
  }

  async function handleManageLsSave() {
    if (!manageLsForm.meetLink.trim()) {
      setManageLsMsg({ type: 'error', text: 'Please paste a Google Meet link.' })
      return
    }
    setManageLsSaving(true)
    try {
      await addLiveSession({
        title: manageLsForm.title.trim() || 'Live Class',
        topic: manageLsForm.topic,
        instructor: manageLsForm.instructor,
        meetLink: manageLsForm.meetLink,
        scheduledAt: manageLsForm.scheduledAt ? new Date(manageLsForm.scheduledAt) : new Date(),
        duration: Number(manageLsForm.duration) || 60,
        status: 'upcoming',
      })
      setManageLsMsg({ type: 'success', text: '✅ Meet link saved! Students will see the Join button now.' })
      setManageLsForm({ title: '', topic: '', instructor: '', scheduledAt: '', duration: 60, meetLink: '' })
    } catch {
      setManageLsMsg({ type: 'error', text: '❌ Failed to save. Try again.' })
    }
    setManageLsSaving(false)
  }

  // ── Enrollment state ──────────────────────────────────────────────────────
  const [enrollEmail, setEnrollEmail] = useState('')
  const [enrollUserId, setEnrollUserId] = useState('')
  const [enrollCourseType, setEnrollCourseType] = useState('upsc-prelims')
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [enrollMessage, setEnrollMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [checkUserId, setCheckUserId] = useState('')
  const [userCourses, setUserCourses] = useState<string[] | null>(null)

  const recentEnrollments = [
    { id: 1, name: 'Rajesh Kumar', email: 'rajesh@email.com', course: 'UPSC Premium', date: '2 mins ago', status: 'Active' },
    { id: 2, name: 'Priya Devi', email: 'priya@email.com', course: 'TNPSC Group 4', date: '15 mins ago', status: 'Active' },
    { id: 3, name: 'Arun Singh', email: 'arun@email.com', course: 'UPSC Foundation', date: '1 hour ago', status: 'Pending' },
  ]

  // ── Fetch live sessions on mount ──────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'live-sessions') {
      fetchLiveSessions()
    }
    if (activeTab === 'mock-tests' && mockTab === 'edit') {
      fetchQuestions()
    }
  }, [activeTab, mockTab])

  async function fetchLiveSessions() {
    setLsLoading(true)
    try {
      const sessions = await getLiveSessions()
      setLiveSessions(sessions)
    } catch { }
    setLsLoading(false)
  }

  async function fetchQuestions() {
    setQLoading(true)
    try {
      const snap = await getDocs(collection(db, 'mockQuestions'))
      const qs: MockQuestion[] = []
      snap.forEach(d => qs.push({ id: d.id, ...d.data() } as MockQuestion))
      setQuestions(qs)
    } catch { }
    setQLoading(false)
  }

  // ── Add live session ──────────────────────────────────────────────────────
  function handleSaveMockTestTimer() {
    const normalizedTimer = Number(mockTestTimer)
    if (Number.isNaN(normalizedTimer) || normalizedTimer < 10) {
      setQMsg({ type: 'error', text: 'Please enter a valid timer of at least 10 minutes.' })
      return
    }

    localStorage.setItem('admin_mock_test_timer_minutes', String(normalizedTimer))
    setMockTestTimer(normalizedTimer)
    setQMsg({ type: 'success', text: `Timer saved successfully for ${normalizedTimer} minutes.` })
  }

  async function handleAddLiveSession() {
    if (!newLs.title.trim() || !newLs.meetLink.trim() || !newLs.scheduledAt) {
      setLsMsg({ type: 'error', text: 'Please fill Title, Meet Link and Date/Time.' })
      return
    }
    setLsLoading(true)
    try {
      await addLiveSession({
        ...newLs,
        scheduledAt: new Date(newLs.scheduledAt),
        duration: Number(newLs.duration),
      })
      setLsMsg({ type: 'success', text: '✅ Session added! Users will see the Join link immediately.' })
      setNewLs({ title: '', topic: '', instructor: '', description: '', scheduledAt: '', duration: 60, meetLink: '', status: 'upcoming', category: 'UPSC' })
      await fetchLiveSessions()
    } catch {
      setLsMsg({ type: 'error', text: '❌ Failed to add session.' })
    }
    setLsLoading(false)
  }

  async function handleDeleteLiveSession(id: string) {
    if (!confirm('Delete this session?')) return
    setLsDeleting(id)
    try {
      await deleteLiveSession(id)
      setLiveSessions(prev => prev.filter(s => s.id !== id))
    } catch { }
    setLsDeleting(null)
  }

  // ── Add question ──────────────────────────────────────────────────────────
  async function handleAddQuestion() {
    if (!newQ.question.trim() || newQ.options.some(o => !o.trim())) {
      setQMsg({ type: 'error', text: 'Fill question and all 4 options.' })
      return
    }
    try {
      await addDoc(collection(db, 'mockQuestions'), newQ)
      setQMsg({ type: 'success', text: '✅ Question added!' })
      setNewQ({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', category: '', testId: 'gs-paper-1' })
    } catch {
      setQMsg({ type: 'error', text: '❌ Failed to add question.' })
    }
  }

  // ── Update question ───────────────────────────────────────────────────────
  async function handleUpdateQuestion() {
    if (!editQ?.id) return
    try {
      const { id, ...data } = editQ
      await updateDoc(doc(db, 'mockQuestions', id), data)
      setQMsg({ type: 'success', text: '✅ Question updated!' })
      setEditQ(null)
      fetchQuestions()
    } catch {
      setQMsg({ type: 'error', text: '❌ Failed to update.' })
    }
  }

  // ── Delete question ───────────────────────────────────────────────────────
  async function handleDeleteQuestion(id: string) {
    if (!confirm('Delete this question?')) return
    try {
      await deleteDoc(doc(db, 'mockQuestions', id))
      setQMsg({ type: 'success', text: '✅ Question deleted!' })
      fetchQuestions()
    } catch {
      setQMsg({ type: 'error', text: '❌ Failed to delete.' })
    }
  }

  // ── Import questions from CSV text ────────────────────────────────────────
  async function handleImportQuestions() {
    if (!importText.trim()) { setQMsg({ type: 'error', text: 'Paste CSV/JSON data first.' }); return }
    try {
      // Try JSON array first
      let parsed: any[] = []
      try { parsed = JSON.parse(importText) } catch {
        // Try CSV: question,optA,optB,optC,optD,correctIndex,explanation,category,testId
        parsed = importText.trim().split('\n').slice(1).map(line => {
          const cols = line.split(',')
          return {
            question: cols[0]?.trim() || '',
            options: [cols[1]?.trim()||'', cols[2]?.trim()||'', cols[3]?.trim()||'', cols[4]?.trim()||''],
            correctAnswer: Number(cols[5]?.trim()) || 0,
            explanation: cols[6]?.trim() || '',
            category: cols[7]?.trim() || '',
            testId: cols[8]?.trim() || 'gs-paper-1',
          }
        })
      }
      for (const q of parsed) {
        await addDoc(collection(db, 'mockQuestions'), q)
      }
      setQMsg({ type: 'success', text: `✅ Imported ${parsed.length} questions!` })
      setImportText('')
    } catch {
      setQMsg({ type: 'error', text: '❌ Invalid format. Use JSON array or CSV.' })
    }
  }

  // ── Save overview inline next session ────────────────────────────────────
  async function handleSaveOverviewSession() {
    if (!overviewSession.title || !overviewSession.date || !overviewSession.time || !overviewSession.meetLink) {
      setOverviewSessionMsg({ type: 'error', text: 'Please fill Title, Date, Time, and Meet Link.' })
      return
    }
    setOverviewSessionSaving(true)
    try {
      const scheduledAt = new Date(`${overviewSession.date}T${overviewSession.time}`)
      await addLiveSession({
        title: overviewSession.title,
        instructor: overviewSession.instructor,
        meetLink: overviewSession.meetLink,
        scheduledAt,
        status: 'upcoming',
        duration: 60,
      })
      setOverviewSessionMsg({ type: 'success', text: '✅ Session saved! Users will see "Join Live Session".' })
      setOverviewSessionEditing(false)
    } catch {
      setOverviewSessionMsg({ type: 'error', text: '❌ Failed to save. Try again.' })
    }
    setOverviewSessionSaving(false)
  }

  // ── Save next session to Firestore (liveSessions with status=upcoming) ────
  async function handleSaveNextSession() {
    if (!nextSession.title || !nextSession.date || !nextSession.time || !nextSession.meetLink) {
      setSessionMsg({ type: 'error', text: 'Please fill Title, Date, Time, and Meet Link.' })
      return
    }
    setSessionSaving(true)
    try {
      const scheduledAt = new Date(`${nextSession.date}T${nextSession.time}`)
      await addLiveSession({
        title: nextSession.title,
        instructor: nextSession.instructor,
        meetLink: nextSession.meetLink,
        scheduledAt,
        status: 'upcoming',
        duration: 60,
      })
      setSessionMsg({ type: 'success', text: '✅ Session saved! Users will see "Join Live Session" in their dashboard.' })
    } catch {
      setSessionMsg({ type: 'error', text: '❌ Failed to save. Try again.' })
    }
    setSessionSaving(false)
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header — Hello Admin only */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          {/* Left: Hello Admin */}
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Hello Admin 👋</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage sessions, tests, students and content</p>
          </div>
          {/* Right: Nav buttons */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
              ← Dashboard
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-sm">A</div>
          </div>

        </div>
      </div>

      {/* Main Overview Dashboard: All admin features as cards/tabs */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {false && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-indigo-700 dark:text-indigo-300">📅 Next Session</h2>
            <div className="flex gap-2">
              <button
                onClick={() => { setOverviewSessionEditing(prev => !prev); setOverviewSessionMsg(null) }}
                className="px-4 py-2 text-sm font-bold bg-white dark:bg-gray-700 border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-300 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900 transition">
                ✏️ Edit
              </button>
              <button
                onClick={handleSaveOverviewSession}
                disabled={overviewSessionSaving}
                className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50">
                {overviewSessionSaving ? '⏳ Saving...' : '💾 Save'}
              </button>
            </div>
          </div>

          {overviewSessionMsg && (
            <div className={`mb-4 px-4 py-2 rounded-xl text-sm font-semibold ${overviewSessionMsg.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
              {overviewSessionMsg.text}
            </div>
          )}

          {overviewSessionEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Session Title *</label>
                <input
                  className="w-full px-4 py-3 border-2 border-indigo-200 dark:border-indigo-600 rounded-xl text-sm focus:border-indigo-500 outline-none dark:bg-gray-700 dark:text-white"
                  placeholder="e.g. UPSC Polity Live Class"
                  value={overviewSession.title}
                  onChange={e => setOverviewSession(s => ({ ...s, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Instructor</label>
                <input
                  className="w-full px-4 py-3 border-2 border-indigo-200 dark:border-indigo-600 rounded-xl text-sm focus:border-indigo-500 outline-none dark:bg-gray-700 dark:text-white"
                  placeholder="e.g. Dr. Ramesh"
                  value={overviewSession.instructor}
                  onChange={e => setOverviewSession(s => ({ ...s, instructor: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Date *</label>
                <input type="date"
                  className="w-full px-4 py-3 border-2 border-indigo-200 dark:border-indigo-600 rounded-xl text-sm focus:border-indigo-500 outline-none dark:bg-gray-700 dark:text-white"
                  value={overviewSession.date}
                  onChange={e => setOverviewSession(s => ({ ...s, date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Time *</label>
                <input type="time"
                  className="w-full px-4 py-3 border-2 border-indigo-200 dark:border-indigo-600 rounded-xl text-sm focus:border-indigo-500 outline-none dark:bg-gray-700 dark:text-white"
                  value={overviewSession.time}
                  onChange={e => setOverviewSession(s => ({ ...s, time: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-xl font-black text-gray-900 dark:text-white">
                {overviewSession.title || 'No session scheduled'}
              </p>
              <p className="text-base font-semibold text-indigo-600 dark:text-indigo-300">
                🕐 {formatSessionDisplay(overviewSession.date, overviewSession.time)}
              </p>
              {overviewSession.instructor && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">👤 {overviewSession.instructor}</p>
              )}
              {overviewSession.meetLink && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 truncate">🔗 {overviewSession.meetLink}</p>
              )}
            </div>
          )}
        </div>
        )}

        {/* Enter Google Meet Link */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-6">
          <h2 className="text-lg font-black text-green-700 dark:text-green-300 mb-2">🔗 Enter Google Meet Link</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Paste a Google Meet URL here. It will be visible to all enrolled students on their Live Sessions page immediately.
          </p>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Google Meet URL</label>
          <div className="flex gap-3">
            <input
              className="flex-1 px-4 py-3 border-2 border-green-300 dark:border-green-600 rounded-xl text-sm focus:border-green-500 outline-none dark:bg-gray-700 dark:text-white"
              placeholder="https://meet.google.com/xxxx-xxxx-xxx"
              value={manageLsForm.meetLink}
              onChange={e => setManageLsForm(f => ({ ...f, meetLink: e.target.value }))}
            />
            <button
              onClick={handleManageLsSave}
              disabled={manageLsSaving || !manageLsForm.meetLink.trim()}
              className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl text-sm transition disabled:opacity-40"
            >
              {manageLsSaving ? '⏳...' : 'Enter'}
            </button>
          </div>
          <p className="text-xs text-green-500 mt-2">
            Example: <span className="font-mono">https://meet.google.com/abc-defg-hij</span>
          </p>
          {manageLsMsg && (
            <div className={`mt-3 px-4 py-2 rounded-xl text-xs font-semibold ${manageLsMsg.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
              {manageLsMsg.text}
            </div>
          )}
        </div>

        {/* ── NEXT SESSION CARD ─────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">📅 Schedule Next Session</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Fill in the details below. Once saved, the join link will automatically appear on all users' <strong>Live Sessions</strong> page.
          </p>

          {sessionMsg && (
            <div className={`mb-5 p-4 rounded-xl text-sm font-semibold ${sessionMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-300' : 'bg-red-50 text-red-800 border border-red-300'}`}>
              {sessionMsg.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Session Title *</label>
              <input className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:border-indigo-500 outline-none dark:bg-gray-700 dark:text-white"
                placeholder="e.g. UPSC Polity Live Class"
                value={nextSession.title}
                onChange={e => setNextSession(s => ({ ...s, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Date *</label>
                <input type="date" className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:border-indigo-500 outline-none dark:bg-gray-700 dark:text-white"
                  value={nextSession.date}
                  onChange={e => setNextSession(s => ({ ...s, date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Time *</label>
                <input type="time" className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:border-indigo-500 outline-none dark:bg-gray-700 dark:text-white"
                  value={nextSession.time}
                  onChange={e => setNextSession(s => ({ ...s, time: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Instructor Name</label>
              <input className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:border-indigo-500 outline-none dark:bg-gray-700 dark:text-white"
                placeholder="e.g. Dr. Ramesh"
                value={nextSession.instructor}
                onChange={e => setNextSession(s => ({ ...s, instructor: e.target.value }))} />
            </div>
            <button onClick={handleSaveNextSession} disabled={sessionSaving}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-xl hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 text-base">
              {sessionSaving ? '⏳ Saving...' : '✅ Save & Publish to Users'}
            </button>
          </div>
        </div>

        {/* ── MOCK TESTS TAB ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Mock Test</h2>
          {/* Set Timer Option - with presets */}
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Set Timer (minutes):</label>
            <div className="flex gap-2">
              {[30, 45, 60, 90, 120].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMockTestTimer(val)}
                  className={`px-3 py-1 rounded-lg text-sm font-bold border transition ${mockTestTimer === val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-gray-700'}`}
                >
                  {val} min
                </button>
              ))}
              <input
                type="number"
                min={10}
                max={300}
                step={5}
                value={mockTestTimer}
                onChange={e => setMockTestTimer(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white ml-2"
              />
              <button
                type="button"
                onClick={() => setQMsg({ type: 'success', text: `✅ Timer set to ${mockTestTimer} minutes!` })}
                className="ml-2 px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg text-sm hover:bg-indigo-700 transition"
              >
                Save Timer
              </button>
            </div>
          </div>
          {qMsg?.text.includes('Timer') && (
            <div className={`p-3 rounded-xl text-sm font-semibold ${qMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-300' : 'bg-red-50 text-red-800 border border-red-300'}`}>
              {qMsg.text}
            </div>
          )}
          {/* Sub-tabs */}
          <div className="flex gap-2 flex-wrap">
            {([
              { id: 'add',    label: '➕ Add Questions' },
              { id: 'edit',   label: '✏️ Edit Questions' },
              { id: 'delete', label: '🗑 Delete Questions' },
              { id: 'import', label: '📥 Import (CSV / Excel)' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => { setMockTab(t.id); setQMsg(null); if (t.id === 'edit' || t.id === 'delete') fetchQuestions() }}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${mockTab === t.id ? 'bg-indigo-600 text-white shadow' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* IMPORT */}
          {mockTab === 'import' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Import Questions (CSV / Excel)</h3>
              <div className="flex flex-col gap-3">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Upload CSV/Excel File</label>
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = async (ev) => {
                      const text = ev.target?.result as string
                      setImportText(text)
                      await handleImportQuestions()
                    }
                    reader.readAsText(file)
                  }}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Or Paste JSON/CSV Data</label>
                <textarea rows={8} className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm font-mono resize-none focus:border-indigo-400 outline-none dark:bg-gray-700 dark:text-white"
                  placeholder="Paste your CSV or JSON here..."
                  value={importText} onChange={e => setImportText(e.target.value)} />
                <button onClick={handleImportQuestions} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
                  📥 Import Questions
                </button>
              </div>
              {qMsg && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${qMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-300' : 'bg-red-50 text-red-800 border border-red-300'}`}>{qMsg.text}</div>
              )}
            </div>
          )}

          {/* ADD */}
          {mockTab === 'add' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Add New Question</h3>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Select Test / Subject *</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  value={newQ.testId} onChange={e => setNewQ(q => ({ ...q, testId: e.target.value }))}>
                  <optgroup label="── UPSC Prelims ──">
                    <option value="upsc-prelims-indian-polity">Indian Polity</option>
                    <option value="upsc-prelims-history">History</option>
                    <option value="upsc-prelims-indian-economy">Indian Economy</option>
                    <option value="upsc-prelims-geography">Geography</option>
                    <option value="upsc-prelims-environment">Environment</option>
                    <option value="upsc-prelims-science-tech">Science and Tech</option>
                    <option value="upsc-prelims-current-affairs">Current Affairs</option>
                    <option value="upsc-prelims-csat">CSAT</option>
                  </optgroup>
                  <optgroup label="── UPSC Mains ──">
                    <option value="upsc-mains-gs1">GS 1</option>
                    <option value="upsc-mains-gs2">GS 2</option>
                    <option value="upsc-mains-gs3">GS 3</option>
                    <option value="upsc-mains-gs4">GS 4</option>
                  </optgroup>
                  <optgroup label="── TNPSC Prelims ──">
                    <option value="tnpsc-prelims-indian-polity">Indian Polity</option>
                    <option value="tnpsc-prelims-history">History (Indian History + INM + TN History)</option>
                    <option value="tnpsc-prelims-geography">Geography</option>
                    <option value="tnpsc-prelims-indian-economy">Indian Economy</option>
                    <option value="tnpsc-prelims-unit9">Unit 9</option>
                    <option value="tnpsc-prelims-current-affairs">Current Affairs</option>
                    <option value="tnpsc-prelims-aptitude">Aptitude</option>
                  </optgroup>
                  <optgroup label="── TNPSC Mains ──">
                    <option value="tnpsc-mains-gs1">GS 1</option>
                    <option value="tnpsc-mains-gs2">GS 2</option>
                    <option value="tnpsc-mains-gs3">GS 3</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="e.g. Polity, History"
                  value={newQ.category} onChange={e => setNewQ(q => ({ ...q, category: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Question *</label>
                <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none dark:bg-gray-700 dark:text-white"
                  placeholder="Enter question..."
                  value={newQ.question} onChange={e => setNewQ(q => ({ ...q, question: e.target.value }))} />
              </div>
              {newQ.options.map((opt, i) => (
                <div key={i}>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Option {i + 1} {newQ.correctAnswer === i && <span className="text-green-600">(Correct)</span>}
                  </label>
                  <div className="flex gap-2">
                    <input className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder={`Option ${i + 1}`}
                      value={opt} onChange={e => { const o = [...newQ.options]; o[i] = e.target.value; setNewQ(q => ({ ...q, options: o })) }} />
                    <button onClick={() => setNewQ(q => ({ ...q, correctAnswer: i }))}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition ${newQ.correctAnswer === i ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-100'}`}>
                      ✓
                    </button>
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Explanation</label>
                <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none dark:bg-gray-700 dark:text-white"
                  placeholder="Explanation for the answer..."
                  value={newQ.explanation} onChange={e => setNewQ(q => ({ ...q, explanation: e.target.value }))} />
              </div>
              <button onClick={handleAddQuestion} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
                ➕ Add Question
              </button>
            </div>
          )}

          {/* EDIT */}
          {mockTab === 'edit' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Edit Questions</h3>
              {qLoading ? <p className="text-gray-400 text-center py-8">Loading questions...</p> : questions.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No questions found in Firestore.</p>
              ) : (
                <div className="space-y-3">
                  {questions.map(q => (
                    <div key={q.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                      {editQ?.id === q.id ? (
                        <div className="space-y-3">
                          <textarea rows={2} className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm resize-none dark:bg-gray-800 dark:text-white"
                            value={editQ?.question ?? ''} onChange={e => setEditQ(eq => eq && ({ ...eq, question: e.target.value }))} />
                          {(editQ?.options ?? []).map((opt, i) => (
                            <input key={i} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:text-white"
                              value={opt} onChange={e => { const o = [...(editQ?.options ?? [])]; o[i] = e.target.value; setEditQ(eq => eq && ({ ...eq, options: o })) }} />
                          ))}
                          <div className="flex gap-2">
                            <button onClick={handleUpdateQuestion} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg text-sm hover:bg-green-700">Save</button>
                            <button onClick={() => setEditQ(null)} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg text-sm hover:bg-gray-300">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white flex-1">{q.question}</p>
                          <button onClick={() => setEditQ(q)} className="px-3 py-1.5 bg-blue-100 text-blue-700 font-bold rounded-lg text-xs hover:bg-blue-200 flex-shrink-0">✏️ Edit</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DELETE */}
          {mockTab === 'delete' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Delete Questions</h3>
              {qLoading ? <p className="text-gray-400 text-center py-8">Loading...</p> : questions.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No questions found.</p>
              ) : (
                <div className="space-y-3">
                  {questions.map(q => (
                    <div key={q.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 gap-3">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white flex-1 truncate">{q.question}</p>
                      <button onClick={() => handleDeleteQuestion(q.id!)} className="px-3 py-1.5 bg-red-100 text-red-600 font-bold rounded-lg text-xs hover:bg-red-200 flex-shrink-0">🗑 Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── CONTENT TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
                <h3 className="text-xl font-black text-gray-900 mb-4">📤 Upload Study Material</h3>
                <div className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center hover:bg-indigo-50 transition-all cursor-pointer">
                  <div className="text-4xl mb-3">📁</div>
                  <p className="font-bold text-gray-900">Drag files here or click to upload</p>
                  <p className="text-sm text-gray-600 mt-2">PDF, DOC, PPT, or Images</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
                <h3 className="text-xl font-black text-gray-900 mb-4">📚 Existing Content</h3>
                <div className="space-y-3">
                  {['GS Paper 1 Study Notes', 'Mock Test - History', 'Video Lectures - Polity', 'Current Affairs PDF'].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <span className="font-semibold text-gray-900 text-sm">{item}</span>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded font-bold text-xs hover:bg-blue-200">Edit</button>
                        <button className="px-3 py-1 bg-red-100 text-red-700 rounded font-bold text-xs hover:bg-red-200">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LECTURES TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'lectures' && <VideoUpload />}

        {/* ── FREE TRIAL TAB ──────────────────────────────────────────────── */}
        {activeTab === 'free-trial' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">🆓 Free Trial</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload free videos for each subject. They will appear instantly on the Free Trial page for all visitors.</p>
            </div>

            <div className="space-y-4">
              {FREE_TRIAL_SUBJECTS.map(subject => {
                const isOpen = ftOpenFolder === subject.id
                const isUploading = ftUploading === subject.id
                const msg = ftMsg?.subject === subject.id ? ftMsg : null

                return (
                  <div key={subject.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">

                    {/* Folder Header */}
                    <button
                      onClick={() => setFtOpenFolder(isOpen ? null : subject.id)}
                      className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${subject.color} flex items-center justify-center text-2xl shadow flex-shrink-0`}>
                        {subject.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{subject.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Click to upload free videos for this subject</p>
                      </div>
                      <span className={`text-gray-400 text-2xl transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>›</span>
                    </button>

                    {/* Upload Panel */}
                    {isOpen && (
                      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-5 space-y-4">

                        {msg && (
                          <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-300' : 'bg-red-50 text-red-800 border border-red-300'}`}>
                            {msg.text}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Video Title</label>
                            <input
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              placeholder="e.g. Introduction to Indian Polity"
                              value={ftTitle[subject.id] || ''}
                              onChange={e => setFtTitle(prev => ({ ...prev, [subject.id]: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Instructor Name</label>
                            <input
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              placeholder="e.g. Dr. Ramesh"
                              value={ftInstructor[subject.id] || ''}
                              onChange={e => setFtInstructor(prev => ({ ...prev, [subject.id]: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">Select Video File</label>
                          <label className={`flex items-center justify-center gap-3 w-full py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isUploading ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}>
                            {isUploading ? (
                              <div className="text-center">
                                <div className="text-2xl mb-1">⏳</div>
                                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Uploading... {ftProgress}%</p>
                                <div className="w-48 h-2 bg-gray-200 rounded-full mt-2 mx-auto overflow-hidden">
                                  <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${ftProgress}%` }} />
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div className={`text-3xl mb-1`}>{subject.icon}</div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Upload</p>
                                <p className="text-xs text-gray-400 mt-0.5">MP4, MOV, AVI, MKV</p>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              disabled={isUploading}
                              onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) handleFtUpload(subject.id, file)
                                e.target.value = ''
                              }}
                            />
                          </label>
                        </div>

                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── STUDENTS TAB ────────────────────────────────────────────────── */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Manage Students</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left py-3 font-bold text-gray-700">Name</th>
                    <th className="text-left py-3 font-bold text-gray-700">Email</th>
                    <th className="text-left py-3 font-bold text-gray-700">Course</th>
                    <th className="text-left py-3 font-bold text-gray-700">Status</th>
                    <th className="text-right py-3 font-bold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentEnrollments.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="py-4 font-semibold text-gray-900">{e.name}</td>
                      <td className="py-4 text-gray-600">{e.email}</td>
                      <td className="py-4 text-gray-600">{e.course}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${e.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{e.status}</span>
                      </td>
                      <td className="py-4 text-right"><button className="text-indigo-600 font-bold text-sm">Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ENROLLMENTS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'enrollments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
              <h3 className="text-xl font-black text-gray-900 mb-6">➕ Enroll New User</h3>
              {enrollMessage && (
                <div className={`mb-6 p-4 rounded-lg border-2 ${enrollMessage.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
                  <p className="font-bold">{enrollMessage.text}</p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">User ID (Firebase UID)</label>
                  <input type="text" value={enrollUserId} onChange={e => setEnrollUserId(e.target.value)}
                    placeholder="Enter Firebase User ID"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-indigo-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">User Email</label>
                  <input type="email" value={enrollEmail} onChange={e => setEnrollEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-indigo-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Course</label>
                  <select value={enrollCourseType} onChange={e => setEnrollCourseType(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-indigo-600 outline-none bg-white">
                    <optgroup label="UPSC">
                      <option value="upsc-prelims">UPSC CSE Prelims</option>
                      <option value="upsc-prelims-mains">UPSC CSE Prelims + Mains</option>
                      <option value="upsc-mentorship">UPSC Personal Mentorship</option>
                    </optgroup>
                    <optgroup label="TNPSC">
                      <option value="tnpsc-prelims">TNPSC Group 1 Prelims</option>
                      <option value="tnpsc-prelims-mains">TNPSC Group 1 Prelims + Mains</option>
                      <option value="tnpsc-mentorship">TNPSC Personal Mentorship</option>
                    </optgroup>
                  </select>
                </div>
                <button onClick={async () => {
                  if (!enrollUserId || !enrollEmail) { setEnrollMessage({ type: 'error', text: 'Please fill all fields' }); return }
                  setEnrollLoading(true); setEnrollMessage(null)
                  try {
                    await enrollUserInCourse(enrollUserId, enrollEmail, enrollCourseType)
                    setEnrollMessage({ type: 'success', text: `✅ Enrolled ${enrollEmail} in ${enrollCourseType}!` })
                    setEnrollUserId(''); setEnrollEmail('')
                  } catch (err: any) {
                    setEnrollMessage({ type: 'error', text: `❌ ${err.message}` })
                  } finally { setEnrollLoading(false) }
                }} disabled={enrollLoading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50">
                  {enrollLoading ? '⏳ Enrolling...' : '✅ Enroll User'}
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
              <h3 className="text-xl font-black text-gray-900 mb-6">🗑️ Remove Enrollment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">User ID (Firebase UID)</label>
                  <input type="text" value={checkUserId} onChange={e => setCheckUserId(e.target.value)}
                    placeholder="Enter Firebase User ID"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-red-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Course to Remove</label>
                  <select value={enrollCourseType} onChange={e => setEnrollCourseType(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-red-500 outline-none bg-white">
                    <optgroup label="UPSC">
                      <option value="upsc-prelims">UPSC CSE Prelims</option>
                      <option value="upsc-prelims-mains">UPSC CSE Prelims + Mains</option>
                      <option value="upsc-mentorship">UPSC Personal Mentorship</option>
                    </optgroup>
                    <optgroup label="TNPSC">
                      <option value="tnpsc-prelims">TNPSC Group 1 Prelims</option>
                      <option value="tnpsc-prelims-mains">TNPSC Group 1 Prelims + Mains</option>
                      <option value="tnpsc-mentorship">TNPSC Personal Mentorship</option>
                    </optgroup>
                  </select>
                </div>
                <button onClick={async () => {
                  if (!checkUserId) { setEnrollMessage({ type: 'error', text: 'Please enter a User ID' }); return }
                  if (!confirm(`Remove ${enrollCourseType} enrollment for this user?`)) return
                  setEnrollLoading(true); setEnrollMessage(null)
                  try {
                    await removeUserEnrollment(checkUserId, enrollCourseType)
                    setEnrollMessage({ type: 'success', text: `✅ Removed ${enrollCourseType} enrollment successfully!` })
                    setCheckUserId('')
                  } catch (err: any) {
                    setEnrollMessage({ type: 'error', text: `❌ ${err.message}` })
                  } finally { setEnrollLoading(false) }
                }} disabled={enrollLoading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-black text-lg rounded-lg hover:from-red-600 hover:to-red-700 transition disabled:opacity-50">
                  {enrollLoading ? '⏳ Removing...' : '🗑️ Remove Enrollment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── REPORTS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
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
        )}

      </div>
    </div>
  )
}
