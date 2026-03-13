import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase/config.ts'
import { useAuth } from '../context/AuthContext.tsx'

// ─── Types ────────────────────────────────────────────────────────────────────
interface FolderViewProps {
  category?: 'recorded-lectures' | 'study-material' | 'mock-tests'
  allowedExams?: string[]
  onStartTest?: (testId: string, testName: string) => void
  courseId?: string
  folderPath?: string
  isAdmin?: boolean
}

interface FileItem {
  id: string
  title: string
  url: string
  type: 'video' | 'pdf' | 'doc' | 'other'
  size?: string
  instructor?: string
  duration?: string
  courseId?: string
  folderPath?: string
  storagePath?: string
  uploadedAt?: any
}

// ─── Folder structure definitions ────────────────────────────────────────────
const TNPSC_PRELIMS_SUBS = ['Polity','Indian Economy','History (Indian History + INM + TN History)','Unit 9','Geography','Current Affairs','Aptitude']
const UPSC_PRELIMS_SUBS  = ['Polity','Indian Economy','History (Ancient + Medieval + Modern)','Geography','Environment','Science and Tech','Current Affairs','CSAT']
const MAINS_SUBS         = ['GS – 1','GS – 2','GS – 3','GS – 4']

const COURSE_FOLDER_MAP: Record<string, { label: string; subs: string[] }[]> = {
  'tnpsc-prelims':       [{ label: 'Recorded Sessions', subs: TNPSC_PRELIMS_SUBS },{ label: 'Study Materials', subs: TNPSC_PRELIMS_SUBS }],
  'tnpsc-prelims-mains': [{ label: 'Prelims', subs: TNPSC_PRELIMS_SUBS },{ label: 'Mains', subs: MAINS_SUBS },{ label: 'Study Materials', subs: [...TNPSC_PRELIMS_SUBS,'GS-1','GS-2','GS-3','GS-4'] }],
  'tnpsc-mentorship':    [{ label: 'Prelims', subs: TNPSC_PRELIMS_SUBS },{ label: 'Mains', subs: MAINS_SUBS },{ label: 'Study Materials', subs: [...TNPSC_PRELIMS_SUBS,'GS-1','GS-2','GS-3','GS-4'] }],
  'upsc-prelims':        [{ label: 'Recorded Sessions', subs: UPSC_PRELIMS_SUBS },{ label: 'Study Materials', subs: UPSC_PRELIMS_SUBS }],
  'upsc-prelims-mains':  [{ label: 'Prelims', subs: UPSC_PRELIMS_SUBS },{ label: 'Mains', subs: MAINS_SUBS },{ label: 'Study Materials', subs: [...UPSC_PRELIMS_SUBS,'GS-1','GS-2','GS-3','GS-4'] }],
  'upsc-mentorship':     [{ label: 'Prelims', subs: UPSC_PRELIMS_SUBS },{ label: 'Mains', subs: MAINS_SUBS },{ label: 'Study Materials', subs: [...UPSC_PRELIMS_SUBS,'GS-1','GS-2','GS-3','GS-4'] }],
}

const COURSE_LABELS: Record<string, string> = {
  'tnpsc-prelims':       'TNPSC Group 1 Prelims',
  'tnpsc-prelims-mains': 'TNPSC Group 1 Prelims + Mains',
  'tnpsc-mentorship':    'TNPSC Personal Mentorship',
  'upsc-prelims':        'UPSC CSE Prelims',
  'upsc-prelims-mains':  'UPSC CSE Prelims + Mains',
  'upsc-mentorship':     'UPSC Personal Mentorship',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFileType(fileName: string): FileItem['type'] {
  const ext = (fileName.split('.').pop() || '').toLowerCase()
  if (['mp4','webm','mov','avi','mkv'].includes(ext)) return 'video'
  if (ext === 'pdf') return 'pdf'
  if (['doc','docx','ppt','pptx','txt','xls','xlsx'].includes(ext)) return 'doc'
  return 'other'
}
function getFileIcon(type: string) {
  if (type === 'video') return '🎬'
  if (type === 'pdf') return '📄'
  if (type === 'doc') return '📝'
  return '📎'
}

// ─── Folder SVG ───────────────────────────────────────────────────────────────
function FolderIcon({ color = '#F59E0B' }: { color?: string }) {
  return (
    <svg width="36" height="30" viewBox="0 0 44 36" fill="none">
      <path d="M0 6C0 4.34315 1.34315 3 3 3H16L20 8H41C42.6569 8 44 9.34315 44 11V33C44 34.6569 42.6569 36 41 36H3C1.34315 36 0 34.6569 0 33V6Z" fill={color}/>
      <path d="M0 11C0 9.34315 1.34315 8 3 8H41C42.6569 8 44 9.34315 44 11V33C44 34.6569 42.6569 36 41 36H3C1.34315 36 0 34.6569 0 33V11Z" fill={color} opacity="0.85"/>
    </svg>
  )
}

// ─── Sub-folder content: fetches from BOTH videos + resources collections ─────
function SubFolderContent({
  courseId, folder, sub, isAdmin,
}: { courseId: string; folder: string; sub: string; isAdmin: boolean }) {
  const folderPath = `${courseId}/${folder}/${sub}`
  const [items, setItems] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [instructor, setInstructor] = useState('')
  const [playingId, setPlayingId] = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [folderPath])

  async function fetchAll() {
    setLoading(true)
    try {
      const itemMap = new Map<string, FileItem>()

      // ── 1. resources collection (uploaded via CourseContentPage) ─────────
      try {
        const rSnap = await getDocs(query(collection(db, 'resources'), where('folderPath', '==', folderPath)))
        rSnap.forEach(d => itemMap.set(d.id, { id: d.id, ...d.data() } as FileItem))
      } catch {}

      // ── 2. videos collection — multiple key formats ──────────────────────
      const examMap: Record<string,string> = {
        'tnpsc-prelims':'TNPSC','tnpsc-prelims-mains':'TNPSC','tnpsc-mentorship':'TNPSC',
        'upsc-prelims':'UPSC','upsc-prelims-mains':'UPSC','upsc-mentorship':'UPSC',
      }
      const levelMap: Record<string,string> = {
        'Recorded Sessions':'Prelims','Prelims':'Prelims','Mains':'Mains','Study Materials':'Study',
      }
      const examName  = examMap[courseId] || 'UPSC'
      const levelName = levelMap[folder] || folder

      const keys = [
        // new: courseId/folder/sub normalised
        folderPath.toLowerCase().replace(/\s+/g,'-').replace(/[()]/g,'').replace(/--+/g,'-'),
        // old VideoUpload format: EXAM-Level-Subject
        `${examName}-${levelName}-${sub}`,
        // also try raw folderPath
        folderPath,
      ]

      await Promise.allSettled(
        keys.map(k => getDocs(query(collection(db, 'videos'), where('courseId', '==', k))))
      ).then(results =>
        results.forEach(r => {
          if (r.status === 'fulfilled') r.value.forEach(d => {
            if (!itemMap.has(d.id)) {
              const data = d.data()
              itemMap.set(d.id, {
                id: d.id,
                title: data.title || 'Untitled',
                url: data.url || '',
                type: 'video',
                instructor: data.instructor,
                duration: data.duration,
                courseId: data.courseId,
              } as FileItem)
            }
          })
        })
      )

      setItems(Array.from(itemMap.values()))
    } catch { setItems([]) }
    finally { setLoading(false) }
  }

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const handleDownloadSelected = async () => {
    if (selected.size === 0) { alert('Please select files to download.'); return }
    for (const item of items.filter(i => selected.has(i.id))) {
      try {
        const a = document.createElement('a')
        a.href = item.url; a.download = item.title; a.target = '_blank'
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        await new Promise(r => setTimeout(r, 300))
      } catch {}
    }
  }

  const handleUpload = async () => {
    if (!uploadFiles.length) { alert('Please select files.'); return }
    setUploading(true)
    try {
      for (const file of uploadFiles) {
        const storagePath = `resources/${folderPath}/${Date.now()}_${file.name}`
        const storRef = ref(storage, storagePath)
        await new Promise<void>((resolve, reject) => {
          const task = uploadBytesResumable(storRef, file)
          task.on('state_changed',
            s => setUploadProgress(Math.round(s.bytesTransferred / s.totalBytes * 100)),
            reject,
            async () => {
              const url = await getDownloadURL(task.snapshot.ref)
              await addDoc(collection(db, 'resources'), {
                title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g,' '),
                url, type: getFileType(file.name),
                size: `${(file.size/1024/1024).toFixed(1)} MB`,
                instructor: instructor || 'CSK Faculty',
                courseId, folderPath, storagePath,
                uploadedAt: serverTimestamp(),
              })
              resolve()
            }
          )
        })
      }
      alert(`✅ ${uploadFiles.length} file(s) uploaded!`)
      setUploadFiles([]); setInstructor(''); setShowUpload(false); setUploadProgress(0)
      fetchAll()
    } catch (e: any) { alert('❌ Upload failed: ' + (e.message || e)) }
    finally { setUploading(false) }
  }

  const handleDelete = async (item: FileItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return
    try {
      if (item.storagePath) { try { await deleteObject(ref(storage, item.storagePath)) } catch {} }
      await deleteDoc(doc(db, 'resources', item.id))
      setItems(p => p.filter(i => i.id !== item.id))
    } catch (e: any) { alert('❌ Delete failed: ' + e.message) }
  }

  if (loading) return <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"/></div>

  return (
    <div className="px-3 py-3">
      {/* Action bar */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={handleDownloadSelected} disabled={selected.size === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all">
          ⬇️ Download Selected ({selected.size})
        </button>
        {isAdmin && (
          <button onClick={() => setShowUpload(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-all">
            {showUpload ? '✕ Cancel' : '📤 Upload Resources'}
          </button>
        )}
        {items.length > 0 && (
          <button onClick={() => setSelected(selected.size === items.length ? new Set() : new Set(items.map(i => i.id)))}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-all">
            {selected.size === items.length ? '☐ Deselect All' : '☑ Select All'}
          </button>
        )}
      </div>

      {/* Admin upload panel */}
      {isAdmin && showUpload && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-4 mb-3 space-y-3">
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Upload to: {folder} › {sub}</p>
          <input type="text" value={instructor} onChange={e => setInstructor(e.target.value)}
            placeholder="Instructor name (optional)"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-indigo-400 rounded-xl p-5 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all bg-white dark:bg-gray-800">
            <span className="text-2xl mb-1">📂</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Upload</span>
            <span className="text-xs text-gray-400 mt-0.5">Click to select files (videos, PDFs, docs)</span>
            <input type="file" multiple accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" className="hidden"
              onChange={e => setUploadFiles(Array.from(e.target.files || []))}/>
          </label>
          {uploadFiles.length > 0 && (
            <ul className="space-y-0.5">
              {uploadFiles.map((f,i) => (
                <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  {getFileIcon(getFileType(f.name))} <span className="truncate">{f.name}</span>
                  <span className="text-gray-400 ml-auto">({(f.size/1024/1024).toFixed(1)} MB)</span>
                </li>
              ))}
            </ul>
          )}
          {uploading && (
            <div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all" style={{width:`${uploadProgress}%`}}/>
              </div>
              <p className="text-xs text-gray-400 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}
          <button onClick={handleUpload} disabled={uploading || !uploadFiles.length}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-all">
            {uploading ? `Uploading ${uploadProgress}%...` : `📤 Upload ${uploadFiles.length} File${uploadFiles.length!==1?'s':''}`}
          </button>
        </div>
      )}

      {/* Files */}
      {items.length === 0 ? (
        <div className="text-center py-6 text-gray-400 dark:text-gray-500">
          <div className="text-3xl mb-1">📂</div>
          <p className="text-sm">{isAdmin ? 'No files yet. Upload using the button above.' : 'No content uploaded yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="p-3 flex items-center gap-2.5">
                <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)}
                  className="w-4 h-4 accent-indigo-600 flex-shrink-0"/>
                <span className="text-lg flex-shrink-0">{getFileIcon(item.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.title}</p>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {item.instructor && <span className="text-xs text-gray-500">👨‍🏫 {item.instructor}</span>}
                    {item.size && <span className="text-xs text-gray-400">{item.size}</span>}
                    {item.duration && <span className="text-xs text-gray-400">⏱ {item.duration}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {item.type === 'video' ? (
                    <button onClick={() => setPlayingId(playingId === item.id ? null : item.id)}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all">
                      {playingId === item.id ? '✕' : '▶ Play'}
                    </button>
                  ) : (
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all">
                      📖 Open
                    </a>
                  )}
                  <a href={item.url} download={item.title} target="_blank" rel="noopener noreferrer"
                    className="px-2 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-200 transition-all">
                    ⬇️
                  </a>
                  {isAdmin && (
                    <button onClick={() => handleDelete(item)}
                      className="px-2 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-bold rounded-lg hover:bg-red-200 transition-all">
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              {playingId === item.id && item.type === 'video' && (
                <div className="px-3 pb-3">
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

// ─── Mock test folder view ────────────────────────────────────────────────────
const MOCK_TEST_OPTIONS = [
  { id: 'upsc-prelims-indian-polity',  name: 'Indian Polity',   group: 'UPSC Prelims' },
  { id: 'upsc-prelims-history',         name: 'History',          group: 'UPSC Prelims' },
  { id: 'upsc-prelims-indian-economy',  name: 'Indian Economy',   group: 'UPSC Prelims' },
  { id: 'upsc-prelims-geography',       name: 'Geography',        group: 'UPSC Prelims' },
  { id: 'upsc-prelims-environment',     name: 'Environment',      group: 'UPSC Prelims' },
  { id: 'upsc-prelims-science-tech',    name: 'Science and Tech', group: 'UPSC Prelims' },
  { id: 'upsc-prelims-current-affairs', name: 'Current Affairs',  group: 'UPSC Prelims' },
  { id: 'upsc-prelims-csat',            name: 'CSAT',             group: 'UPSC Prelims' },
  { id: 'upsc-mains-gs1', name: 'GS 1', group: 'UPSC Mains' },
  { id: 'upsc-mains-gs2', name: 'GS 2', group: 'UPSC Mains' },
  { id: 'upsc-mains-gs3', name: 'GS 3', group: 'UPSC Mains' },
  { id: 'upsc-mains-gs4', name: 'GS 4', group: 'UPSC Mains' },
  { id: 'tnpsc-prelims-indian-polity',   name: 'Indian Polity',                               group: 'TNPSC Prelims' },
  { id: 'tnpsc-prelims-history',          name: 'History (Indian History + INM + TN History)', group: 'TNPSC Prelims' },
  { id: 'tnpsc-prelims-geography',        name: 'Geography',                                   group: 'TNPSC Prelims' },
  { id: 'tnpsc-prelims-indian-economy',   name: 'Indian Economy',                              group: 'TNPSC Prelims' },
  { id: 'tnpsc-prelims-unit9',            name: 'Unit 9',                                      group: 'TNPSC Prelims' },
  { id: 'tnpsc-prelims-current-affairs',  name: 'Current Affairs',                             group: 'TNPSC Prelims' },
  { id: 'tnpsc-prelims-aptitude',         name: 'Aptitude',                                    group: 'TNPSC Prelims' },
  { id: 'tnpsc-mains-gs1', name: 'GS 1', group: 'TNPSC Mains' },
  { id: 'tnpsc-mains-gs2', name: 'GS 2', group: 'TNPSC Mains' },
  { id: 'tnpsc-mains-gs3', name: 'GS 3', group: 'TNPSC Mains' },
]

function MockTestFolderView({ onStartTest }: { onStartTest?: (id: string, name: string) => void }) {
  const groups = Array.from(new Set(MOCK_TEST_OPTIONS.map(t => t.group)))
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">✅ Mock Tests</h2>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
        {groups.map(group => (
          <div key={group}>
            <button onClick={() => setOpenGroup(openGroup === group ? null : group)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <div className="flex items-center gap-3">
                <FolderIcon color="#6366F1"/>
                <span className="font-bold text-gray-900 dark:text-white text-base">{group}</span>
              </div>
              <svg width="18" height="18" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"
                style={{transform: openGroup===group?'rotate(90deg)':'none', transition:'transform 0.2s'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            {openGroup === group && (
              <div className="bg-gray-50 dark:bg-gray-900/30 divide-y divide-gray-100 dark:divide-gray-700">
                {MOCK_TEST_OPTIONS.filter(t => t.group === group).map(t => (
                  <div key={t.id} className="flex items-center justify-between px-8 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📝</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.name}</span>
                    </div>
                    <button onClick={() => onStartTest?.(t.id, t.name)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all">
                      Start Test
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── One course section ───────────────────────────────────────────────────────
function CourseSection({ courseId, courseLabel, folders, isAdmin }: {
  courseId: string; courseLabel: string; folders: { label: string; subs: string[] }[]; isAdmin: boolean
}) {
  const [openFolder, setOpenFolder] = useState<number | null>(null)
  const [openSub, setOpenSub] = useState<string | null>(null)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-black text-gray-900 dark:text-white text-base">{courseLabel}</h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {folders.map((folder, fIdx) => (
          <div key={fIdx}>
            <button onClick={() => { setOpenFolder(openFolder===fIdx?null:fIdx); setOpenSub(null) }}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
              <FolderIcon color="#F59E0B"/>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white text-sm">{folder.label}</p>
                <p className="text-xs text-gray-400">{folder.subs.length} sub-folder{folder.subs.length!==1?'s':''}</p>
              </div>
              <svg width="16" height="16" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"
                style={{transform: openFolder===fIdx?'rotate(90deg)':'none', transition:'transform 0.2s'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            {openFolder === fIdx && (
              <div className="bg-gray-50 dark:bg-gray-900/20 divide-y divide-gray-100 dark:divide-gray-700">
                {folder.subs.map((sub, sIdx) => {
                  const key = `${fIdx}-${sIdx}`
                  return (
                    <div key={sIdx}>
                      <button onClick={() => setOpenSub(openSub===key?null:key)}
                        className="w-full flex items-center gap-4 pl-14 pr-6 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left">
                        <FolderIcon color="#3B82F6"/>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{sub}</p>
                        </div>
                        <svg width="14" height="14" fill="none" stroke="#d1d5db" viewBox="0 0 24 24"
                          style={{transform: openSub===key?'rotate(90deg)':'none', transition:'transform 0.2s'}}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                      {openSub === key && (
                        <div className="pl-6 pr-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                          <SubFolderContent courseId={courseId} folder={folder.label} sub={sub} isAdmin={isAdmin}/>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main FolderView export ───────────────────────────────────────────────────
export default function FolderView({ category, allowedExams = [], onStartTest }: FolderViewProps) {
  const { enrolledCourses, isAdmin } = useAuth()

  if (category === 'mock-tests') return <MockTestFolderView onStartTest={onStartTest}/>

  const title = category === 'recorded-lectures' ? '🎬 Recorded Lectures' : '📚 Access Study Materials'

  // Admin sees ALL courses; regular users see only enrolled ones
  const effective = isAdmin
    ? Object.keys(COURSE_FOLDER_MAP)
    : (allowedExams.length > 0 ? allowedExams : enrolledCourses)

  const folderFilter = category === 'recorded-lectures'
    ? (f: { label: string }) => ['Recorded Sessions', 'Prelims', 'Mains'].includes(f.label)
    : (f: { label: string }) => f.label === 'Study Materials'

  const coursesToShow = Object.keys(COURSE_FOLDER_MAP).filter(id => effective.includes(id))

  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">{title}</h2>
      {coursesToShow.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
          <div className="text-5xl mb-3">🔒</div>
          <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">No courses enrolled</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enrol in a course to access {category === 'recorded-lectures' ? 'recorded lectures' : 'study materials'}.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {coursesToShow.map(id => (
            <CourseSection
              key={id}
              courseId={id}
              courseLabel={COURSE_LABELS[id] ?? id}
              folders={(COURSE_FOLDER_MAP[id] ?? []).filter(folderFilter)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  )
}

