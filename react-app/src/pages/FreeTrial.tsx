import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config.ts'

const SUBJECTS = [
	{ id: 'polity', name: 'Polity', icon: '⚖️', color: 'from-indigo-600 to-indigo-800' },
	{ id: 'economy', name: 'Economy', icon: '📈', color: 'from-emerald-600 to-emerald-800' },
	{ id: 'geography', name: 'Geography & Environment', icon: '🌍', color: 'from-teal-600 to-teal-800' },
	{ id: 'history', name: 'History', icon: '🏛️', color: 'from-amber-600 to-amber-800' },
	{ id: 'aptitude', name: 'Aptitude', icon: '🔢', color: 'from-purple-600 to-purple-800' },
]

interface FreeVideo {
	id: string
	title: string
	url?: string
	videoUrl?: string
	subject: string
	uploadedAt?: any
}

export default function FreeTrial() {
	const [openFolder, setOpenFolder] = useState<string | null>(null)
	const [videosBySubject, setVideosBySubject] = useState<Record<string, FreeVideo[]>>({})
	const [loading, setLoading] = useState(true)
	const [playingId, setPlayingId] = useState<string | null>(null)

	useEffect(() => {
		const fetchVideos = async () => {
			try {
				// Fetch both isFree videos AND free-trial-* course uploads
				const [freeSnap, ftSnap] = await Promise.allSettled([
					getDocs(query(collection(db, 'videos'), where('isFree', '==', true))),
					getDocs(collection(db, 'videos')),
				])
				const map: Record<string, FreeVideo[]> = {}
				const seenIds = new Set<string>()
				const addToMap = (data: any, docId: string) => {
					if (seenIds.has(docId)) return
					const isFreeVideo = data.isFree === true
					const isFreeTrialCourse = typeof data.courseId === 'string' && data.courseId.startsWith('free-trial-')
					if (!isFreeVideo && !isFreeTrialCourse) return
					seenIds.add(docId)
					const subj = (data.subject || data.courseId?.replace('free-trial-', '') || '').toLowerCase()
					if (!subj) return
					if (!map[subj]) map[subj] = []
					map[subj].push({ ...data, id: docId })
				}
				if (freeSnap.status === 'fulfilled') {
					freeSnap.value.forEach(doc => addToMap(doc.data(), doc.id))
				}
				if (ftSnap.status === 'fulfilled') {
					ftSnap.value.forEach(doc => addToMap(doc.data(), doc.id))
				}
				setVideosBySubject(map)
			} catch (err) {
				console.error('Failed to fetch free videos:', err)
			} finally {
				setLoading(false)
			}
		}
		fetchVideos()
	}, [])

	const toggleFolder = (id: string) => {
		setOpenFolder(prev => (prev === id ? null : id))
		setPlayingId(null)
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{/* Hero */}
			<section className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white py-16 md:py-20">
				<div className="max-w-4xl mx-auto px-6 text-center space-y-4">
					<span className="inline-block bg-yellow-400 text-indigo-900 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
						100% Free Access
					</span>
					<h1 className="text-4xl md:text-5xl font-black">Free Trial</h1>
					<p className="text-lg text-indigo-100 max-w-2xl mx-auto">
						Explore free video lectures across 5 core subjects. No registration required.
					</p>
					<a
						href="#subjects"
						className="inline-block mt-2 px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-all"
					>
						Browse Subjects ↓
					</a>
				</div>
			</section>

			{/* Subject Folders */}
			<section id="subjects" className="py-16 max-w-4xl mx-auto px-6">
				<h2 className="text-3xl font-black text-center mb-2 dark:text-white">
					Subject Folders
				</h2>
				<p className="text-center text-gray-500 dark:text-gray-400 mb-10">
					Click on a subject to view free video lectures
				</p>

				{loading ? (
					<div className="flex justify-center items-center py-20">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
					</div>
				) : (
					<div className="space-y-4">
						{SUBJECTS.map(subject => {
							const videos = videosBySubject[subject.id] || []
							const isOpen = openFolder === subject.id

							return (
								<div
									key={subject.id}
									className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
								>
									{/* Folder Header */}
									<button
										onClick={() => toggleFolder(subject.id)}
										className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
									>
										<div
											className={`w-12 h-12 rounded-xl bg-gradient-to-br ${subject.color} flex items-center justify-center text-2xl shadow flex-shrink-0`}
										>
											{subject.icon}
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="text-lg font-bold text-gray-900 dark:text-white">
												{subject.name}
											</h3>
											<p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
												{videos.length > 0
													? `${videos.length} video${
															videos.length > 1 ? 's' : ''
													  } available`
													: 'Videos coming soon'}
											</p>
										</div>
										<span
											className={`text-gray-400 text-2xl transition-transform duration-200 ${
												isOpen ? 'rotate-90' : ''
											}`}
										>
											›
										</span>
									</button>

									{/* Folder Contents */}
									{isOpen && (
										<div className="border-t border-gray-200 dark:border-gray-700 px-5 py-4">
											{videos.length === 0 ? (
												<div className="text-center py-10 text-gray-400 dark:text-gray-500">
													<p className="text-4xl mb-2">📂</p>
													<p className="font-semibold">
														No videos uploaded yet
													</p>
													<p className="text-sm mt-1">
														Check back soon — new content is being added!
													</p>
												</div>
											) : (
												<div className="space-y-3">
													{videos.map(video => (
														<div
															key={video.id}
															className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden"
														>
															{/* Video row */}
															<button
																onClick={() =>
																	setPlayingId(
																		playingId === video.id
																			? null
																			: video.id
																	)
																}
																className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900/40 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left"
															>
																<span
																	className={`w-8 h-8 rounded-full bg-gradient-to-br ${subject.color} flex items-center justify-center text-white text-sm flex-shrink-0`}
																>
																	▶
																</span>
																<span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
																	{video.title}
																</span>
																<span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex-shrink-0">
																	FREE
																</span>
																<span className="text-gray-400 text-sm ml-1 flex-shrink-0">
																	{playingId === video.id ? '▲' : '▼'}
																</span>
															</button>
															{/* Inline video player */}
															{playingId === video.id && (
																<div className="bg-black w-full aspect-video">
																	<video
																		src={video.url || video.videoUrl}
																		controls
																		autoPlay
																		className="w-full h-full"
																	/>
																</div>
															)}
														</div>
													))}
												</div>
											)}
										</div>
									)}
								</div>
							)
						})}
					</div>
				)}
			</section>
		</div>
	)
}

