import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase/config.ts'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ResourceItem {
  id: string
  title: string
  url: string
  type: 'video' | 'pdf' | 'doc' | 'other'
  size?: string
  instructor?: string
  duration?: string
  courseId: string
  folderPath: string // e.g. "UPSC/Prelims/Indian Polity"
  uploadedAt?: any
  storagePath?: string
}

// ─── Course config ────────────────────────────────────────────────────────────
const TNPSC_PRELIMS_SUBS = ['Polity','Indian Economy','History (Indian History + INM + TN History)','Unit 9','Geography','Current Affairs','Aptitude']
const UPSC_PRELIMS_SUBS  = ['Polity','Indian Economy','History (Ancient + Medieval + Modern)','Geography','Environment','Science and Tech','Current Affairs','CSAT']
const MAINS_SUBS         = ['GS – 1','GS – 2','GS – 3','GS – 4']

interface CourseConfig {
  id: string
  title: string
  examType: 'UPSC' | 'TNPSC'
  topFolders: { name: string; color: string; subs: string[] }[]
  studyMaterialSubs: string[]
}

const COURSE_CONFIGS: CourseConfig[] = [
  {
    id: 'tnpsc-prelims',
    title: 'TNPSC Group 1 Prelims',
    examType: 'TNPSC',
    topFolders: [
      { name: 'Recorded Sessions', color: '#F59E0B', subs: TNPSC_PRELIMS_SUBS },
      { name: 'Study Materials',   color: '#3B82F6', subs: TNPSC_PRELIMS_SUBS },
    ],
    studyMaterialSubs: TNPSC_PRELIMS_SUBS,
  },
  {
    id: 'tnpsc-prelims-mains',
    title: 'TNPSC Group 1 Prelims + Mains',
    examType: 'TNPSC',
    topFolders: [
      { name: 'Prelims',        color: '#F59E0B', subs: TNPSC_PRELIMS_SUBS },
      { name: 'Mains',          color: '#F97316', subs: MAINS_SUBS },
      { name: 'Study Materials', color: '#3B82F6', subs: [...TNPSC_PRELIMS_SUBS,'GS-1','GS-2','GS-3','GS-4'] },
    ],
    studyMaterialSubs: [...TNPSC_PRELIMS_SUBS,'GS-1','GS-2','GS-3','GS-4'],
  },
  {
    id: 'tnpsc-mentorship',
    title: 'TNPSC Personal Mentorship',
    examType: 'TNPSC',
    topFolders: [
      { name: 'Prelims',        color: '#F59E0B', subs: TNPSC_PRELIMS_SUBS },
      { name: 'Mains',          color: '#F97316', subs: MAINS_SUBS },
      { name: 'Study Materials', color: '#3B82F6', subs: [...TNPSC_PRELIMS_SUBS,'GS-1','GS-2','GS-3','GS-4'] },
    ],
    studyMaterialSubs: [...TNPSC_PRELIMS_SUBS,'GS-1','GS-2','GS-3','GS-4'],
  },
  {
    id: 'upsc-prelims',
    title: 'UPSC CSE Prelims',
    examType: 'UPSC',
    topFolders: [
      { name: 'Recorded Sessions', color: '#F59E0B', subs: UPSC_PRELIMS_SUBS },
      { name: 'Study Materials',   color: '#3B82F6', subs: UPSC_PRELIMS_SUBS },
    ],
    studyMaterialSubs: UPSC_PRELIMS_SUBS,
  },
  {
    id: 'upsc-prelims-mains',
    title: 'UPSC CSE Prelims + Mains',
    examType: 'UPSC',
    topFolders: [
      { name: 'Prelims',        color: '#F59E0B', subs: UPSC_PRELIMS_SUBS },
      { name: 'Mains',          color: '#F97316', subs: MAINS_SUBS },
      { name: 'Study Materials', color: '#3B82F6', subs: [...UPSC_PRELIMS_SUBS,'GS-1','GS-2','GS-3','GS-4'] },
    ],
    studyMaterialSubs: [...UPSC_PRELIMS_SUBS,'GS-1','GS-2','GS-3','GS-4'],
  },
  {
    id: 'upsc-mentorship',
    title: 'UPSC Personal Mentorship',
    examType: 'UPSC',
    topFolders: [
      { name: 'Prelims',        color: '#F59E0B', subs: UPSC_PRELIMS_SUBS },
      { name: 'Mains',          color: '#F97316', subs: MAINS_SUBS },
      { name: 'Study Materials', color: '#3B82F6', subs: [...UPSC_PRELIMS_SUBS,'GS-1','GS-2','GS-3','GS-4'] },
    ],
    studyMaterialSubs: [...UPSC_PRELIMS_SUBS,'GS-1','GS-2','GS-3','GS-4'],
  },
]

// ─── Folder SVG ───────────────────────────────────────────────────────────────
function FolderSVG({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.82)} viewBox="0 0 44 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 6C0 4.34315 1.34315 3 3 3H16L20 8H41C42.6569 8 44 9.34315 44 11V33C44 34.6569 42.6569 36 41 36H3C1.34315 36 0 34.6569 0 33V6Z" fill={color} />
      <path d="M0 11C0 9.34315 1.34315 8 3 8H41C42.6569 8 44 9.34315 44 11V33C44 34.6569 42.6569 36 41 36H3C1.34315 36 0 34.6569 0 33V11Z" fill={color} opacity="0.85" />
      <rect x="4" y="12" width="36" height="20" rx="1" fill="white" opacity="0.2" />
    </svg>
  )
}

function getFileIcon(type: string) {
  if (type === 'video') return '🎬'
  if (type === 'pdf') return '📄'
  if (type === 'doc') return '📝'
  return '📎'
}

function getFileType(fileName: string): ResourceItem['type'] {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (['mp4','webm','mov','avi','mkv'].includes(ext)) return 'video'
  if (ext === 'pdf') return 'pdf'
  if (['doc','docx','ppt','pptx','txt','xls','xlsx'].includes(ext)) return 'doc'
  return 'other'
}

// ─── Sub-folder content viewer + admin upload ─────────────────────────────────
function SubFolderContent({
  courseId, folderName, subName, isAdmin,
}: {
  courseId: string; folderName: string; subName: string; isAdmin: boolean
}) {
  const folderPath = `${courseId}/${folderName}/${subName}`
  const [items, setItems] = useState<ResourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [instructor, setInstructor] = useState('')
  const [playingId, setPlayingId] = useState<string | null>(null)

  useEffect(() => { fetchItems() }, [folderPath])

  async function fetchItems() {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'resources'), where('folderPath', '==', folderPath)))
      const data: ResourceItem[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as ResourceItem))
      setItems(data)
    } catch { setItems([]) }
    finally { setLoading(false) }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDownloadSelected = async () => {
    if (selected.size === 0) { alert('Please select files to download.'); return }
    const toDownload = items.filter(i => selected.has(i.id))
    for (const item of toDownload) {
      try {
        const a = document.createElement('a')
        a.href = item.url
        a.download = item.title
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        await new Promise(r => setTimeout(r, 300))
      } catch { console.warn('Could not download', item.title) }
    }
  }

  const handleDeleteSelected = async () => {
    if (selected.size === 0) { alert('Please select files to delete.'); return }
    const toDelete = items.filter(i => selected.has(i.id))
    if (!confirm(`Delete ${toDelete.length} selected file(s)?`)) return

    try {
      for (const item of toDelete) {
        if (item.storagePath) {
          try { await deleteObject(ref(storage, item.storagePath)) } catch {}
        }
        await deleteDoc(doc(db, 'resources', item.id))
      }
      setItems(prev => prev.filter(i => !selected.has(i.id)))
      setSelected(new Set())
    } catch (e: any) {
      alert('Delete failed: ' + e.message)
    }
  }

  const handleUploadResources = async () => {
    if (uploadFiles.length === 0) { alert('Please select files to upload.'); return }
    setUploading(true)
    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i]
        const storagePath = `resources/${folderPath}/${Date.now()}_${file.name}`
        const storageRef = ref(storage, storagePath)
        await new Promise<void>((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, file)
          task.on('state_changed',
            snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
            reject,
            async () => {
              const url = await getDownloadURL(task.snapshot.ref)
              await addDoc(collection(db, 'resources'), {
                title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
                url,
                type: getFileType(file.name),
                size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                instructor: instructor || 'CSK Faculty',
                courseId,
                folderPath,
                storagePath,
                uploadedAt: serverTimestamp(),
              })
              resolve()
            }
          )
        })
      }
      alert(`✅ ${uploadFiles.length} file(s) uploaded!`)
      setUploadFiles([])
      setInstructor('')
      setShowUpload(false)
      setUploadProgress(0)
      fetchItems()
    } catch (e: any) {
      alert('❌ Upload failed: ' + (e.message || e))
    } finally { setUploading(false) }
  }

  const handleDeleteItem = async (item: ResourceItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return
    try {
      if (item.storagePath) {
        try { await deleteObject(ref(storage, item.storagePath)) } catch {}
      }
      await deleteDoc(doc(db, 'resources', item.id))
      setItems(prev => prev.filter(i => i.id !== item.id))
    } catch (e: any) { alert('❌ Delete failed: ' + e.message) }
  }

  if (loading) return (
    <div className="flex justify-center py-6">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
    </div>
  )

  return (
    <div className="px-4 py-3">
      {/* Action Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {isAdmin ? (
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-all"
          >
            Delete
          </button>
        ) : (
          <button
            onClick={handleDownloadSelected}
            disabled={selected.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all"
          >
            Download Selected ({selected.size})
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => setShowUpload(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-all"
          >
            {showUpload ? '✕ Cancel' : '📤 Upload Resources'}
          </button>
        )}
        {isAdmin && items.length > 0 && (
          <button
            onClick={() => setSelected(selected.size === items.length ? new Set() : new Set(items.map(i => i.id)))}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold rounded-lg transition-all"
          >
            {selected.size === items.length ? '☐ Deselect All' : '☑ Select All'}
          </button>
        )}
      </div>

      {/* Admin Upload Panel */}
      {isAdmin && showUpload && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-4 mb-4 space-y-3">
          <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">Upload to: {folderName} / {subName}</h4>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Instructor (optional)</label>
            <input
              type="text"
              value={instructor}
              onChange={e => setInstructor(e.target.value)}
              placeholder="e.g. Dr. Rajesh Kumar"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Select Files (videos, PDFs, docs)</label>
            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-indigo-400 rounded-xl p-6 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all bg-white dark:bg-gray-800">
              <span className="text-3xl mb-2">📂</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Upload</span>
              <span className="text-xs text-gray-500 mt-1">Click to select files</span>
              <input
                type="file"
                multiple
                accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                className="hidden"
                onChange={e => setUploadFiles(Array.from(e.target.files || []))}
              />
            </label>
            {uploadFiles.length > 0 && (
              <ul className="mt-2 space-y-1">
                {uploadFiles.map((f, i) => (
                  <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <span>{getFileIcon(getFileType(f.name))}</span>
                    <span className="truncate">{f.name}</span>
                    <span className="text-gray-400 ml-auto flex-shrink-0">({(f.size/1024/1024).toFixed(1)} MB)</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {uploading && (
            <div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}
          <button
            onClick={handleUploadResources}
            disabled={uploading || uploadFiles.length === 0}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all"
          >
            {uploading ? `Uploading ${uploadProgress}%...` : `📤 Upload ${uploadFiles.length} File${uploadFiles.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Files List */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <div className="text-3xl mb-1">📂</div>
          <p className="text-sm">{isAdmin ? 'No files yet. Upload some above.' : 'No content uploaded yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="p-3 flex items-center gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="w-4 h-4 accent-indigo-600 flex-shrink-0"
                />
                {/* Icon */}
                <span className="text-xl flex-shrink-0">{getFileIcon(item.type)}</span>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.title}</p>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {item.instructor && <span className="text-xs text-gray-500">👨‍🏫 {item.instructor}</span>}
                    {item.size && <span className="text-xs text-gray-400">{item.size}</span>}
                    {item.duration && <span className="text-xs text-gray-400">⏱ {item.duration}</span>}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.type === 'video' ? (
                    <button
                      onClick={() => setPlayingId(playingId === item.id ? null : item.id)}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all"
                    >
                      {playingId === item.id ? '✕' : '▶ Play'}
                    </button>
                  ) : (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all"
                    >
                      📖 Open
                    </a>
                  )}
                  {!isAdmin && (
                    <a
                      href={item.url}
                      download={item.title}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                      Download
                    </a>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-200 transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {/* Video player */}
              {playingId === item.id && item.type === 'video' && (
                <div className="px-4 pb-4">
                  <video src={item.url} controls autoPlay className="w-full rounded-lg max-h-72 bg-black">
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CourseContentPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { enrolledCourses, isAdmin } = useAuth()
  const [openFolder, setOpenFolder] = useState<number | null>(null)
  const [openSub, setOpenSub] = useState<string | null>(null)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

  const course = COURSE_CONFIGS.find(c => c.id === courseId)

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 max-w-md w-full">
          <p className="text-xl font-bold text-gray-900 dark:text-white mb-4">Course not found.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Admins can access all courses; users must be enrolled
  if (!isAdmin && !enrolledCourses.includes(courseId!)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Access Restricted</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            You haven't enrolled in <strong>{course.title}</strong> yet.
          </p>
          <button onClick={() => navigate('/payment', { state: { title: course.title, courseId: course.id } })}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all mb-3">
            Enrol Now →
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-gray-900 dark:text-white font-bold text-sm truncate">{course.title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{course.title}</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
          {course.topFolders.length} folder{course.topFolders.length !== 1 ? 's' : ''} · Click a folder to browse contents
          {isAdmin && <span className="ml-2 text-indigo-500 font-semibold">· Admin Mode (upload enabled)</span>}
        </p>

        {/* Folders */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
          {course.topFolders.map((folder, fIdx) => {
            const folderOpen = openFolder === fIdx
            return (
              <div key={fIdx}>
                {/* Top folder row */}
                <button
                  onClick={() => { setOpenFolder(folderOpen ? null : fIdx); setOpenSub(null) }}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <FolderSVG color={folder.color} size={40} />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{folder.name}</p>
                    <p className="text-xs text-gray-400">{folder.subs.length} sub-folder{folder.subs.length !== 1 ? 's' : ''}</p>
                  </div>
                  <svg width="16" height="16" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"
                    style={{ transform: folderOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Sub-folders */}
                {folderOpen && (
                  <div className="bg-gray-50 dark:bg-gray-900/20 divide-y divide-gray-100 dark:divide-gray-700">
                    {folder.subs.map((sub, sIdx) => {
                      const key = `${fIdx}-${sIdx}`
                      const subOpen = openSub === key
                      return (
                        <div key={sIdx}>
                          <button
                            onClick={() => setOpenSub(subOpen ? null : key)}
                            className="w-full flex items-center gap-4 pl-14 pr-6 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
                          >
                            <FolderSVG color="#3B82F6" size={32} />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{sub}</p>
                            </div>
                            <svg width="14" height="14" fill="none" stroke="#d1d5db" viewBox="0 0 24 24"
                              style={{ transform: subOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          {subOpen && (
                            <div className="pl-14 pr-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                              <SubFolderContent
                                courseId={course.id}
                                folderName={folder.name}
                                subName={sub}
                                isAdmin={isAdmin}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-center text-gray-400 dark:text-gray-600 text-xs mt-8">
          Content is uploaded by the admin. Check back regularly for new materials.
        </p>
      </div>
    </div>
  )
}

