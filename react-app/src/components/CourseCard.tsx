import React from 'react'
import { useNavigate } from 'react-router-dom'

interface CourseCardProps {
  title: string
  description: string
  price: string
  theme: 'upsc' | 'tnpsc'
  features?: string[]
  courseId: string
}

export default function CourseCard({ title, description, price, theme, features = [], courseId }: CourseCardProps) {
  const navigate = useNavigate()

  const isUPSC = theme === 'upsc'
  const gradient = isUPSC
    ? 'from-indigo-600 to-purple-700'
    : 'from-emerald-600 to-teal-700'
  const border = isUPSC ? 'border-indigo-200' : 'border-emerald-200'
  const bg = isUPSC ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'
  const btnHover = isUPSC ? 'hover:from-indigo-700 hover:to-purple-800' : 'hover:from-emerald-700 hover:to-teal-800'
  const tag = isUPSC ? 'UPSC' : 'TNPSC'

  return (
    <div className={`flex flex-col rounded-2xl border-2 ${border} shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden`}>
      {/* Card header */}
      <div className={`bg-gradient-to-r ${gradient} p-6 text-white`}>
        <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">{tag}</span>
        <h3 className="text-xl font-black mt-3 leading-snug">{title}</h3>
        <p className="mt-2 text-sm text-white/80">{description}</p>
      </div>

      {/* Card body */}
      <div className={`flex flex-col flex-1 p-6 ${bg}`}>
        {features.length > 0 && (
          <ul className="space-y-2 mb-4 flex-1">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}
        <div className={`text-2xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-4`}>{price}</div>
        <button
          onClick={() => navigate('/payment', { state: { title, price, courseType: tag, courseId } })}
          className={`w-full py-3 rounded-xl bg-gradient-to-r ${gradient} ${btnHover} text-white font-bold text-sm shadow hover:shadow-lg transition-all`}
        >
          Enroll Now
        </button>
      </div>
    </div>
  )
}
