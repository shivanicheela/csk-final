import React, { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CourseCard from '../components/CourseCard'
import { useAuth } from '../context/AuthContext.tsx'

const courseCards = [
  {
    id: 'upsc-prelims',
    tag: 'UPSC',
    title: 'UPSC Prelims',
    tagline: 'Take your first step.',
    desc: 'Start your Prelims prep now.',
    price: '₹7,999',
    color: 'from-indigo-600 to-blue-600',
    border: 'border-indigo-200 dark:border-indigo-700',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: '📘',
  },
  {
    id: 'upsc-prelims-mains',
    tag: 'UPSC',
    title: 'UPSC Prelims + Mains',
    tagline: 'Serious about UPSC?',
    desc: 'Complete UPSC Prep: Prelims + Mains.',
    price: '₹12,999',
    color: 'from-blue-600 to-violet-600',
    border: 'border-blue-200 dark:border-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: '📗',
  },
  {
    id: 'upsc-mentorship',
    tag: 'UPSC',
    title: 'UPSC 1 to 1 Mentorship',
    tagline: 'Want exclusive guidance?',
    desc: 'Crack UPSC with Personal Guidance.',
    price: '₹19,999',
    color: 'from-violet-600 to-purple-700',
    border: 'border-violet-200 dark:border-violet-700',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    icon: '🎯',
  },
  {
    id: 'tnpsc-prelims',
    tag: 'TNPSC',
    title: 'TNPSC Prelims',
    tagline: 'Concepts, practice, and strategy.',
    desc: 'Concepts, practice, and strategy for TNPSC Prelims success.',
    price: '₹5,999',
    color: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-200 dark:border-emerald-700',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: '📙',
  },
  {
    id: 'tnpsc-prelims-mains',
    tag: 'TNPSC',
    title: 'TNPSC Prelims + Mains',
    tagline: 'From preparation to selection—cover.',
    desc: 'Prepare Prelims and Mains together.',
    price: '₹9,999',
    color: 'from-teal-600 to-cyan-600',
    border: 'border-teal-200 dark:border-teal-700',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    icon: '📕',
  },
  {
    id: 'tnpsc-mentorship',
    tag: 'TNPSC',
    title: 'TNPSC 1 to 1 Mentorship',
    tagline: 'Personal mentor in your convenient time.',
    desc: 'Guiding you to Group 1 Prelims & Mains success.',
    price: '₹14,999',
    color: 'from-cyan-600 to-blue-500',
    border: 'border-cyan-200 dark:border-cyan-700',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    icon: '🏆',
  },
]

export default function Home(){
  const navigate = useNavigate()
  const sliderRef = useRef<HTMLDivElement>(null)
  const { user, enrolledCourses } = useAuth()

  const scroll = (dir: 'left' | 'right') => {
    if (!sliderRef.current) return
    sliderRef.current.scrollBy({ left: dir === 'right' ? 340 : -340, behavior: 'smooth' })
  }

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-black leading-tight">
              Crack UPSC & TNPSC with <span className="text-yellow-300">Confidence</span>
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 leading-relaxed">
              Expert-led coaching, live interactive sessions, comprehensive study materials, and personalized mock tests. Your success story starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                to="/free-trial"
                className="inline-block px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-all text-center"
              >
                Start Free Trial
              </Link>
              <a
                href="#courses"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-block px-8 py-3 bg-yellow-400 text-indigo-900 font-bold rounded-lg hover:bg-yellow-300 transition-all shadow-lg text-center"
              >
                Explore Courses ↓
              </a>
            </div>
          </div>
          
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl blur-2xl opacity-75"></div>
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-10 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <img
                src="/images/csk-logo.jpeg"
                alt="CSK Logo"
                className="w-72 h-72 object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-6">
                <h2 className="text-4xl font-black text-center mb-4 dark:text-white">Why Choose CSK for UPSC?</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">Everything you need to succeed in your civil services journey</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎓',
                title: 'Coaching from Expert Tutors',
                desc: 'Get personalised coaching from experienced tutors who have guided hundreds of successful UPSC & TNPSC aspirants to success.',
              },
              {
                icon: '👥',
                title: 'Community Support',
                desc: 'Learn and grow with 500+ Aspirants. Share insights, strategies and keep each other motivated every step of the way.',
              },
              {
                icon: '📱',
                title: 'Classroom in Your Pocket',
                desc: 'Access HD video lectures, interactive PDFs, and instant doubt-clearing features on the move — anytime, anywhere.',
              },
              {
                icon: '💼',
                title: 'Working Professional Friendly',
                desc: 'Flexible schedules, recorded sessions, and bite-sized content designed for working professionals preparing alongside their careers.',
              },
              {
                icon: '🧠',
                title: 'Modern Pedagogy',
                desc: 'Strictly aligned with the latest trends and evolving question patterns to keep you one step ahead in your preparation.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:translate-y-[-4px]">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-16 md:py-24 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black text-center mb-4 dark:text-white">Our Courses</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">Choose your path to success</p>

          {/* Slider wrapper */}
          <div className="relative">
            {/* Left arrow */}
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-gray-800 shadow-lg rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all -ml-5"
              aria-label="Scroll left"
            >
              ‹
            </button>

            {/* Cards track */}
            <div
              ref={sliderRef}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-4 px-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {courseCards.map((course) => {
                const theme = course.tag.toLowerCase() as 'upsc' | 'tnpsc'
                const isEnrolled = !!user && (
                  enrolledCourses.includes(course.id) ||
                  enrolledCourses.includes(course.tag) ||
                  enrolledCourses.includes('BOTH')
                )
                const hasAny = !!user && enrolledCourses.length > 0
                const isLocked = hasAny && !isEnrolled

                return (
                <div
                  key={course.id}
                  className={`flex-shrink-0 w-72 rounded-2xl border-2 ${course.border} ${course.bg} shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative`}
                >
                  {/* Locked overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 z-10 bg-white/80 dark:bg-gray-900/85 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl p-4 text-center">
                      <div className="text-4xl mb-2">🔒</div>
                      <p className="font-black text-gray-900 dark:text-white text-sm mb-1">{course.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Payment Required</p>
                      <div className={`text-lg font-black bg-gradient-to-r ${course.color} bg-clip-text text-transparent mb-3`}>{course.price}</div>
                      <button
                        onClick={() => navigate('/payment', { state: { title: course.title, price: course.price, courseType: course.tag, courseId: course.id } })}
                        className={`px-5 py-2 rounded-lg bg-gradient-to-r ${course.color} text-white font-bold text-sm shadow hover:opacity-90 transition-all`}
                      >
                        Enroll Now
                      </button>
                    </div>
                  )}

                  {/* Enrolled badge */}
                  {isEnrolled && (
                    <div className="absolute top-3 right-3 z-10 bg-green-100 border border-green-300 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      ✅ Enrolled
                    </div>
                  )}

                  {/* Card header */}
                  <div className={`bg-gradient-to-r ${course.color} p-6 text-white`}>
                    <span className="text-3xl">{course.icon}</span>
                    <span className="ml-2 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {course.tag}
                    </span>
                    <h3 className="text-xl font-black mt-3 leading-snug">{course.title}</h3>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col flex-1 p-6 space-y-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 italic">{course.tagline}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">{course.desc}</p>
                    <div className={`text-2xl font-black bg-gradient-to-r ${course.color} bg-clip-text text-transparent`}>
                      {course.price}
                    </div>
                    {isEnrolled ? (
                      <button
                        onClick={() => navigate(`/course/${course.id}`)}
                        className={`w-full py-3 rounded-xl bg-gradient-to-r ${course.color} text-white font-bold text-sm shadow hover:opacity-90 transition-all`}
                      >
                        Access Course →
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/payment', { state: { title: course.title, price: course.price, courseType: course.tag, courseId: course.id } })}
                        className={`w-full py-3 rounded-xl bg-gradient-to-r ${course.color} text-white font-bold text-sm shadow hover:opacity-90 transition-all`}
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
                )
              })}
            </div>

            {/* Right arrow */}
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-gray-800 shadow-lg rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all -mr-5"
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {courseCards.map((_, i) => (
              <button
                key={i}
                onClick={() => sliderRef.current?.scrollTo({ left: i * 300, behavior: 'smooth' })}
                className="w-2.5 h-2.5 rounded-full bg-indigo-300 dark:bg-indigo-700 hover:bg-indigo-600 dark:hover:bg-indigo-400 transition-all"
              />
            ))}
          </div>
        </div>
      </section>


      {/* End of page */}
    </div>
  )
}
