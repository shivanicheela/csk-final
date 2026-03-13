import React from 'react'
import CourseCard from '../components/CourseCard'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'

export default function TNPSC(){
  const navigate = useNavigate()
  const { user, enrolledCourses, loading } = useAuth()

  // Instant check — no Firestore call needed
  // User can see TNPSC page if they have no enrollment yet (browsing), or have any TNPSC-related course
  const hasTNPSCCourse = enrolledCourses.some(c =>
    c === 'TNPSC' || c === 'BOTH' || c.startsWith('tnpsc-')
  )
  const hasUPSCOnlyCourse = enrolledCourses.length > 0 && enrolledCourses.every(c =>
    c === 'UPSC' || c.startsWith('upsc-')
  )
  const hasAccess = !user || enrolledCourses.length === 0 || hasTNPSCCourse || !hasUPSCOnlyCourse

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!hasAccess && user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Back Button */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all font-semibold"
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-3xl font-black text-gray-900 mb-4">Access Restricted</h1>
            <p className="text-lg text-gray-600 mb-2">
              You don't have access to TNPSC courses.
            </p>
            <p className="text-gray-500 mb-8">
              It looks like you're enrolled in a different course program.
            </p>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
              <p className="text-sm text-gray-700">
                <strong>📌 Note:</strong> Users enrolled in UPSC courses have access only to UPSC content, and vice versa.
                To access both programs, you'll need to purchase the combined package.
              </p>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => navigate('/contact')}
                className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all transform hover:scale-105"
              >
                Contact Us for Access
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const programs = [
    {
      title: "Prelims Oriented",
      desc: "Build your foundation for the first hurdle with comprehensive syllabus coverage and previous year question focus.",
      price: "₹5,999",
      courseId: "tnpsc-prelims",
      features: ["180+ HD Video Lessons (Syllabus-wise)", "PYQ Focused: In-depth analysis of Previous Year Questions", "Teaching in Tamil | Materials in English", "Daily PDF Support: Notes provided before every session", "TN Special: State-focused Current Affairs & Schemes", "Test Series: Standard Prelims Mock Tests"]
    },
    {
      title: "TNPSC Prelims + Mains",
      desc: "Comprehensive coaching for the complete journey covering both prelims and mains with integrated preparation strategy.",
      price: "₹9,999",
      courseId: "tnpsc-prelims-mains",
      features: ["350+ In-depth Videos (Prelims & Mains)", "PYQ Focused: Topic-wise Previous Year Question mapping", "Teaching in Tamil | Materials in English", "Daily PDF Support: Pre-session study notes", "Writing Practice: Mains Answer Evaluation & Feedback", "Test Series: Integrated Prelims + Mains Mock Exams"]
    },
    {
      title: "One-to-One Coaching",
      desc: "Your own private tutor for personalized success with daily live sessions and real-time feedback tailored to your pace.",
      price: "₹14,999",
      courseId: "tnpsc-mentorship",
      features: ["Personalized Live Classes: Daily 1-on-1 sessions", "PYQ Strategy: Personalized drill on high-weightage topics", "Custom Study Plan: Tailored to your pace & schedule (For working professionals)", "Real-time Feedback: Instant answer writing correction", "Zero-Doubt Guarantee: We stay on a topic and re-explain until your doubt is 100% resolved"]
    }
  ]

  const highlights = [
    { emoji: '🎯', title: 'Result-oriented Strategy', desc: 'We ensure your minimum efforts get the maximum results.' },
    { emoji: '👥', title: 'Limited Batch Size', desc: 'Ensure every student gets individual attention from faculty.' },
    { emoji: '🏛️', title: 'Tailored Coaching for TNPSC Group 1 Exam', desc: 'Content specifically designed for the TNPSC Group 1 syllabus and exam pattern.' },
    { emoji: '🗣️', title: 'Bilingual Approach', desc: 'Concepts explained in Tamil to ensure 100% understanding.' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all font-semibold"
          >
            ← Back
          </button>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-emerald-700 via-teal-600 to-green-700 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute -bottom-8 right-20 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10 text-white">
          {/* Left: Text */}
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-black leading-tight whitespace-nowrap">TNPSC Group 1 Excellence</h1>
            <p className="mt-4 text-xl md:text-2xl text-emerald-100 leading-relaxed max-w-2xl">
              Dominate Tamil Nadu Public Service Commission exams. Specially designed for state-specific requirements and highest selection rates.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/contact')}
                className="px-8 py-4 bg-white/20 backdrop-blur-md text-white font-bold text-lg rounded-lg border-2 border-white hover:bg-white/30 transition-all duration-300"
              >
                Free Demo Class
              </button>
            </div>
          </div>

          {/* Right: TNPSC Image */}
          <div className="flex-shrink-0 w-80 md:w-[28rem] flex items-center justify-end pr-2">
            <img
              src="/images/WhatsApp Image 2026-03-11 at 2.52.50 PM.jpeg"
              alt="TNPSC Group 1 Excellence"
              className="w-full rounded-2xl shadow-2xl border-2 border-white/30 object-contain"
              style={{ maxHeight: '400px' }}
            />
          </div>
        </div>
      </div>



      {/* Highlights Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-4xl md:text-4xl font-black text-gray-900 dark:text-white text-center mb-12">Why Choose CSK for TNPSC?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg hover:border-emerald-300 transition-all">
              <div className="text-5xl mb-3">{item.emoji}</div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Programs Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-4xl md:text-4xl font-black text-gray-900 dark:text-white text-center mb-12">Our Programs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {programs.map((prog, idx) => (
            <CourseCard 
              key={idx}
              title={prog.title}
              description={prog.desc}
              price={prog.price}
              theme="tnpsc"
              features={prog.features}
              courseId={prog.courseId}
            />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 py-16 px-6 mt-12">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-black">Ace Your TNPSC Exam Today</h2>
          <p className="mt-4 text-lg text-emerald-100">Get expert guidance tailored for Tamil Nadu's unique requirements</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/contact" className="px-8 py-4 bg-white/20 backdrop-blur-md text-white font-bold text-lg rounded-lg border-2 border-white hover:bg-white/30 transition-all duration-300 inline-block">
              Talk to Expert
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
