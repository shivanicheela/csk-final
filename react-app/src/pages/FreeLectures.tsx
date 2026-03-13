import React, {useState} from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function FreeLectures(){
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('all')

  const lectures = [
    { id: 1, category: 'upsc', title: 'Introduction to Indian Polity', duration: '45 min', views: '12.5K', rating: 4.8, instructor: 'Rahul' },
    { id: 2, category: 'upsc', title: 'Modern Indian History Basics', duration: '38 min', views: '8.2K', rating: 4.7, instructor: 'Rahul' },
    { id: 3, category: 'upsc', title: 'Indian Economy Overview', duration: '52 min', views: '15.3K', rating: 4.9, instructor: 'Rahul' },
    { id: 4, category: 'tnpsc', title: 'TNPSC Strategy & Approach', duration: '41 min', views: '6.8K', rating: 4.6, instructor: 'Rahul' },
    { id: 5, category: 'tnpsc', title: 'Tamil Nadu Current Affairs', duration: '33 min', views: '5.2K', rating: 4.8, instructor: 'Rahul' },
    { id: 6, category: 'tnpsc', title: 'Group 4 Success Tips', duration: '28 min', views: '4.1K', rating: 4.7, instructor: 'Rahul' },
    { id: 7, category: 'general', title: 'Mock Test Tips & Tricks', duration: '35 min', views: '9.5K', rating: 4.8, instructor: 'Rahul' },
    { id: 8, category: 'general', title: 'Time Management for Exams', duration: '42 min', views: '11.2K', rating: 4.9, instructor: 'Rahul' },
  ]

  const filtered = selectedCategory === 'all' ? lectures : lectures.filter(l => l.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-semibold"
          >
            ← Back
          </button>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute -bottom-8 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-6 text-white">
        <h1 className="text-5xl md:text-6xl font-black leading-tight">Free Learning Hub</h1>
          <p className="mt-4 text-xl md:text-2xl text-blue-100 leading-relaxed max-w-2xl">
            Watch expert-led lectures on UPSC & TNPSC topics. No signup required. Perfect for beginners and aspirants.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button className="px-8 py-4 bg-yellow-400 text-blue-900 font-black text-lg rounded-lg hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg">
              Start Learning
            </button>
            <Link to="/upsc" className="px-8 py-4 bg-white/20 backdrop-blur-md text-white font-bold text-lg rounded-lg border-2 border-white hover:bg-white/30 transition-all duration-300">
              Upgrade to Premium
            </Link>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-wrap gap-3 justify-center">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-300'}`}
          >
            All Topics
          </button>
          <button 
            onClick={() => setSelectedCategory('upsc')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${selectedCategory === 'upsc' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-300'}`}
          >
            UPSC
          </button>
          <button 
            onClick={() => setSelectedCategory('tnpsc')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${selectedCategory === 'tnpsc' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-emerald-300'}`}
          >
            TNPSC
          </button>
          <button 
            onClick={() => setSelectedCategory('general')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${selectedCategory === 'general' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-300'}`}
          >
            General
          </button>
        </div>
      </div>

      {/* Lectures Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((lecture) => (
            <div key={lecture.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:translate-y-[-8px]">
              {/* Video Thumbnail - Google Meet */}
              <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 aspect-video overflow-hidden group flex items-center justify-center">
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-full h-full" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  </svg>
                </div>
                <div className="relative z-10 text-center flex flex-col items-center gap-3">
                  <div className="text-5xl">👥</div>
                  <p className="text-white font-bold text-sm">Google Meet</p>
                  <p className="text-white/80 text-xs">Live Session</p>
                </div>
                <div className="absolute top-2 right-2 bg-gray-900/80 text-white px-3 py-1 rounded text-sm font-bold">
                  {lecture.duration}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-black text-gray-900 text-lg line-clamp-2">{lecture.title}</h3>
                
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">👨‍🏫 {lecture.instructor}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${lecture.category === 'upsc' ? 'bg-indigo-100 text-indigo-700' : lecture.category === 'tnpsc' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                    {lecture.category.toUpperCase()}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>👁️ {lecture.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⭐ {lecture.rating}</span>
                  </div>
                </div>

                <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:shadow-lg transition-all block text-center">
                  Join Live Session
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-black">Ready for In-Depth Learning?</h2>
          <p className="mt-4 text-lg text-indigo-100">Unlock 300+ hours of premium content, live classes, and personalized guidance with our courses.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/upsc" className="px-8 py-4 bg-yellow-400 text-indigo-900 font-black text-lg rounded-xl hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg inline-block">
              Explore UPSC
            </Link>
            <Link to="/tnpsc" className="px-8 py-4 bg-white/20 backdrop-blur-md text-white font-bold text-lg rounded-xl border-2 border-white hover:bg-white/30 transition-all inline-block">
              Explore TNPSC
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
