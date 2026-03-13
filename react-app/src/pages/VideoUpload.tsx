import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { uploadVideo } from '../firebase/storage.ts'
import { addVideoToDatabase, getVideosFromDatabase, deleteVideoFromDatabase } from '../firebase/firestore.ts'
import { FOLDER_STRUCTURE } from '../utils/folderStructure.ts'

interface Video {
  id: string
  title: string
  instructor: string
  duration: string
  description: string
  url: string
  courseId: string
  uploadedAt: string
}

interface FileEntry {
  file: File
  title: string
  duration: string
  description: string
}

export default function VideoUpload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navState = location.state as { exam?: string; level?: string; subject?: string } | null

  const defaultCourseId = navState?.exam && navState?.level && navState?.subject
    ? `${navState.exam}-${navState.level}-${navState.subject}`.toLowerCase().replace(/\s+/g, '-')
    : 'UPSC-Prelims-Indian Polity'

  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0)

  const [instructor, setInstructor] = useState('')
  const [courseId, setCourseId] = useState(defaultCourseId)
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([])

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const videosData = await getVideosFromDatabase()
      setVideos(videosData)
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const newEntries: FileEntry[] = Array.from(e.target.files).map(file => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      duration: '',
      description: ''
    }))
    setFileEntries(prev => [...prev, ...newEntries])
  }

  const updateEntry = (index: number, field: keyof Omit<FileEntry, 'file'>, value: string) => {
    setFileEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  const removeEntry = (index: number) => {
    setFileEntries(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!instructor.trim()) { alert('Please enter instructor name'); return }
    if (fileEntries.length === 0) { alert('Please select at least one video file'); return }
    if (!user?.uid) { alert('Please login first'); return }

    const incomplete = fileEntries.findIndex(f => !f.title.trim() || !f.duration.trim())
    if (incomplete !== -1) {
      alert(`Please fill Title and Duration for video #${incomplete + 1}`)
      return
    }

    try {
      setUploading(true)
      for (let i = 0; i < fileEntries.length; i++) {
        setCurrentUploadIndex(i)
        setUploadProgress(0)
        const entry = fileEntries[i]
        const videoUrl = await uploadVideo(entry.file, courseId, setUploadProgress)
        await addVideoToDatabase({
          title: entry.title,
          instructor,
          duration: entry.duration,
          description: entry.description,
          url: videoUrl,
          courseId,
          uploadedBy: user.uid
        })
      }
      alert(`✅ ${fileEntries.length} video(s) uploaded successfully!`)
      setFileEntries([])
      setInstructor('')
      setUploadProgress(0)
      fetchVideos()
    } catch (error: any) {
      alert(`❌ Error uploading video: ${error.message}`)
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return
    try {
      await deleteVideoFromDatabase(videoId)
      alert('✅ Video deleted successfully')
      fetchVideos()
    } catch (error: any) {
      alert(`❌ Error deleting video: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-semibold mb-4"
          >
            ← Back to Admin
          </button>
          <h1 className="text-4xl font-black text-gray-900">📹 Video Management</h1>
          <p className="text-gray-600 mt-2">Upload and manage your lecture videos — select multiple files at once</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-black text-gray-900 mb-4">📤 Upload Videos</h2>

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Instructor — shared across all uploads */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Instructor Name</label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={e => setInstructor(e.target.value)}
                    placeholder="e.g., Dr. Rajesh Kumar"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>

                {/* Folder — shared */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Folder (Exam › Level › Subject)</label>
                  <select
                    value={courseId}
                    onChange={e => setCourseId(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  >
                    {Object.entries(FOLDER_STRUCTURE).map(([exam, levels]) =>
                      Object.entries(levels).map(([level, subjects]) =>
                        (subjects as string[]).map((subject) => {
                          const val = `${exam}-${level}-${subject}`
                          return (
                            <option key={val} value={val}>
                              {exam} › {level} › {subject}
                            </option>
                          )
                        })
                      )
                    )}
                  </select>
                </div>

                {/* Multi-file picker */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Video Files (MP4)</label>
                  <input
                    type="file"
                    accept="video/mp4,video/*"
                    multiple
                    onChange={handleFilesChange}
                    className="w-full px-4 py-2 border-2 border-dashed border-indigo-400 rounded-lg focus:outline-none bg-indigo-50 cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">You can select multiple files at once</p>
                </div>

                {/* Per-file entries */}
                {fileEntries.length > 0 && (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                    {fileEntries.map((entry, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 border-2 border-gray-200 rounded-lg relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-indigo-600">Video {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeEntry(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                          >✕ Remove</button>
                        </div>
                        <p className="text-xs text-gray-500 mb-2 truncate">📁 {entry.file.name}</p>
                        <input
                          type="text"
                          value={entry.title}
                          onChange={e => updateEntry(idx, 'title', e.target.value)}
                          placeholder="Title *"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-600 mb-2"
                          required
                        />
                        <input
                          type="text"
                          value={entry.duration}
                          onChange={e => updateEntry(idx, 'duration', e.target.value)}
                          placeholder="Duration * (e.g., 45 min)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-600 mb-2"
                          required
                        />
                        <textarea
                          value={entry.description}
                          onChange={e => updateEntry(idx, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-600 h-16 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {uploading && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Uploading video {currentUploadIndex + 1} of {fileEntries.length}...
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading || fileEntries.length === 0}
                  className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                    uploading || fileEntries.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105'
                  }`}
                >
                  {uploading
                    ? `Uploading ${currentUploadIndex + 1}/${fileEntries.length} — ${uploadProgress.toFixed(0)}%...`
                    : fileEntries.length > 0
                      ? `📤 Upload ${fileEntries.length} Video${fileEntries.length > 1 ? 's' : ''}`
                      : '📤 Upload Videos'}
                </button>
              </form>
            </div>
          </div>

          {/* Videos List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-black text-gray-900 mb-4">📺 Your Videos ({videos.length})</h2>

              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">No videos uploaded yet</p>
                  <p className="text-gray-500 text-sm">Upload your first lecture using the form on the left</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-400 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{video.title}</h3>
                          <p className="text-sm text-gray-600">👨‍🏫 {video.instructor}</p>
                          <p className="text-sm text-gray-600">⏱️ {video.duration}</p>
                          <p className="text-sm text-gray-600 mt-2">{video.description}</p>
                          <div className="flex gap-2 mt-3">
                            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                              {video.courseId}
                            </span>
                            <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">
                              {new Date(video.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          className="ml-4 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-all transform hover:scale-105"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
