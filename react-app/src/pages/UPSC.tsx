import React from 'react'
import CourseCard from '../components/CourseCard'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'

export default function UPSC(){
  const navigate = useNavigate()
  const { user, enrolledCourses, loading } = useAuth()

  // Instant check — no Firestore call needed
  // User can see UPSC page if they have no enrollment yet (browsing), or have any UPSC-related course
  const hasUPSCCourse = enrolledCourses.some(c =>
    c === 'UPSC' || c === 'BOTH' || c.startsWith('upsc-')
  )
  const hasTNPSCOnlyCourse = enrolledCourses.length > 0 && enrolledCourses.every(c =>
    c === 'TNPSC' || c.startsWith('tnpsc-')
  )
  const hasAccess = !user || enrolledCourses.length === 0 || hasUPSCCourse || !hasTNPSCOnlyCourse

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
              className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-semibold"
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
              You don't have access to UPSC courses.
            </p>
            <p className="text-gray-500 mb-8">
              It looks like you're enrolled in a different course program.
            </p>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
              <p className="text-sm text-gray-700">
                <strong>📌 Note:</strong> Users enrolled in TNPSC courses have access only to TNPSC content, and vice versa.
                To access both programs, you'll need to purchase the combined package.
              </p>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => navigate('/contact')}
                className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105"
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
      title: "UPSC Prelims Focused",
      desc: "Master the fundamentals and clear the CSAT + GS hurdle with comprehensive concept coverage and PYQ analysis.",
      price: "₹7,999",
      courseId: "upsc-prelims",
      features: ["250+ HD Concept Videos: Complete GS (Static + Dynamic) & CSAT coverage", "PYQ Trend Analysis: Deep-dive into UPSC's evolving question patterns and logic", "Teaching in Tamil | Standard English study materials", "Pre-Session PDFs: Daily high-yield notes provided before every lecture", "Current Affairs Plus: Integration of The Hindu, IE, and PIB for UPSC standards", "Prelims Test Series: Standard-quality mocks with detailed performance analytics"]
    },
    {
      title: "UPSC Prelims + Mains",
      desc: "A holistic approach for the serious civil service aspirant with comprehensive coverage of all GS papers and essay.",
      price: "₹12,999",
      courseId: "upsc-prelims-mains",
      features: ["500+ Analytical Videos: Comprehensive coverage of GS Papers I-IV and Essay", "Thematic PYQ Mapping: Topic-wise analysis of the last 10 years of UPSC Mains", "Teaching in Tamil | Standard English materials", "Mains Answer Lab: Periodic answer writing practice with expert evaluation", "Daily Prep Support: Subject-wise PDFs delivered daily to keep you ahead", "Integrated Test Series: Combined Prelims Mocks + Mains Answer Evaluation"]
    },
    {
      title: "1-on-1 Coaching",
      desc: "Premium, on-demand mentorship for busy professionals with personalized guidance and flexible scheduling.",
      price: "₹19,999",
      courseId: "upsc-mentorship",
      features: ["Private Live Sessions: Daily 1-on-1 coaching scheduled at your convenience", "Executive Flexibility: A dynamic study plan that adapts to your work-life shifts", "Zero-Doubt Guarantee: We explain complex UPSC concepts until they are 100% clear", "Personalized PYQ Strategy: Target high-weightage topics to maximize limited study time", "Instant Feedback: Real-time correction of your Answer Writing and Logic", "Efficiency First: A No-Waste roadmap focused purely on clearing the cutoff"]
    }
  ]

  const highlights = [
    { emoji: '👨‍🏫', title: 'Expert Faculty', desc: 'Learn from Subject Matter experts and experienced Tutors.' },
    { emoji: '🤝', title: 'Community Support', desc: 'Learn and grow with 500+ Aspirants.' },
    { emoji: '📱', title: 'Classroom in Your Pocket', desc: 'Access HD video lectures, interactive PDFs, and instant doubt-clearing features on the move.' },
    { emoji: '📚', title: 'High-Quality Resources', desc: 'Concise, high-yield notes.' },
    { emoji: '🎯', title: 'Modern Pedagogy', desc: 'Strictly aligned with the latest trends and evolving question patterns.' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-semibold"
          >
            ← Back
          </button>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute -bottom-8 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10 text-white">
          {/* Left: Text */}
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-black leading-tight whitespace-nowrap">UPSC CSE Mastery</h1>
            <p className="mt-4 text-xl md:text-2xl text-indigo-100 leading-relaxed max-w-2xl">
              Complete preparation for Union Public Service Commission. Study with India's top educators and join thousands of successful aspirants.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/contact')}
                className="px-8 py-4 bg-white/20 backdrop-blur-md text-white font-bold text-lg rounded-lg border-2 border-white hover:bg-white/30 transition-all duration-300"
              >
                Schedule Demo
              </button>
            </div>
          </div>

          {/* Right: UPSC Image */}
          <div className="flex-shrink-0 w-80 md:w-[28rem] flex items-center justify-end pr-2">
            <img
              src="/images/WhatsApp Image 2026-03-11 at 2.53.04 PM.jpeg"
              alt="UPSC CSE Mastery"
              className="w-full rounded-2xl shadow-2xl border-2 border-white/30 object-contain"
              style={{ maxHeight: '400px' }}
            />
          </div>
        </div>
      </div>



      {/* Highlights Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-4xl md:text-4xl font-black text-gray-900 dark:text-white text-center mb-12">Why Choose CSK for UPSC?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg hover:border-indigo-300 transition-all">
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
              theme="upsc"
              features={prog.features}
              courseId={prog.courseId}
            />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 py-16 px-6 mt-12">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-black">Ready to Start Your UPSC Journey?</h2>
          <p className="mt-4 text-lg text-indigo-100">Get personalized guidance and join thousands of successful aspirants</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/contact" className="px-8 py-4 bg-white/20 backdrop-blur-md text-white font-bold text-lg rounded-lg border-2 border-white hover:bg-white/30 transition-all duration-300 inline-block">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
