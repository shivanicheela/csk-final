import React, { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config.ts'
import { trackMockTestScore } from '../firebase/firestore.ts'
import { useAuth } from '../context/AuthContext.tsx'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  category?: string
  testId: string
}

interface MockTestEngineProps {
  testId: string
  testName?: string
  onClose: () => void
  onComplete?: (result: { score: number; total: number; percentage: number }) => void
}

export default function MockTestEngine({ testId, testName, onClose, onComplete }: MockTestEngineProps) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    loadQuestions()
  }, [testId])

  async function loadQuestions() {
    setLoading(true)
    try {
      // First try Firestore
      const q = query(collection(db, 'mockQuestions'), where('testId', '==', testId))
      const snap = await getDocs(q)
      const qs: Question[] = []
      snap.forEach(d => qs.push({ id: d.id, ...d.data() } as Question))

      // Fallback to localStorage
      if (qs.length === 0) {
        try {
          const raw = localStorage.getItem(`mockQuestions_${testId}`)
          if (raw) {
            const localQs = JSON.parse(raw) as Question[]
            qs.push(...localQs)
          }
        } catch {}
      }

      setQuestions(qs)
    } catch (err) {
      console.error('Failed to load questions:', err)
      // Try localStorage fallback
      try {
        const raw = localStorage.getItem(`mockQuestions_${testId}`)
        if (raw) setQuestions(JSON.parse(raw))
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (qIdx: number, optIdx: number) => {
    if (submitted) return
    setSelected(prev => ({ ...prev, [qIdx]: optIdx }))
  }

  const handleSubmit = useCallback(async () => {
    setSubmitted(true)
    const correct = questions.filter((q, i) => selected[i] === q.correctAnswer).length
    const total = questions.length
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    const duration = Math.round((Date.now() - startTime) / 1000)

    if (user && total > 0) {
      try {
        await trackMockTestScore({
          userId: user.uid,
          testId,
          testName: testName || testId,
          score: percentage,
          totalQuestions: total,
          correctAnswers: correct,
          duration,
          takenAt: new Date(),
        })
      } catch (err) {
        console.error('Failed to save score:', err)
      }
    }

    onComplete?.({ score: correct, total, percentage })
  }, [questions, selected, user, testId, testName, startTime, onComplete])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading questions...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Questions Yet</h2>
          <p className="text-gray-500 mb-6">The admin hasn't added questions for this test yet. Check back soon!</p>
          <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all">Close</button>
        </div>
      </div>
    )
  }

  if (submitted) {
    const correct = questions.filter((q, i) => selected[i] === q.correctAnswer).length
    const percentage = Math.round((correct / questions.length) * 100)
    return (
      <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            {/* Result header */}
            <div className={`p-8 text-center text-white ${percentage >= 60 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
              <div className="text-6xl mb-3">{percentage >= 60 ? '🎉' : '📚'}</div>
              <h2 className="text-3xl font-black mb-1">{percentage}%</h2>
              <p className="text-lg">{correct} / {questions.length} correct</p>
              <p className="text-sm opacity-80 mt-1">{percentage >= 60 ? 'Great job! Keep it up!' : 'Keep practicing!'}</p>
            </div>

            {/* Answer review */}
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              <h3 className="font-black text-gray-900 dark:text-white text-lg">Review Answers</h3>
              {questions.map((q, i) => {
                const userAns = selected[i]
                const isCorrect = userAns === q.correctAnswer
                return (
                  <div key={q.id} className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-red-300 bg-red-50 dark:bg-red-900/20'}`}>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{i + 1}. {q.question}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Your answer: <span className={isCorrect ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{userAns !== undefined ? q.options[userAns] : 'Not answered'}</span></p>
                    {!isCorrect && <p className="text-xs text-green-700 dark:text-green-400">Correct: {q.options[q.correctAnswer]}</p>}
                    {q.explanation && <p className="text-xs text-gray-500 mt-1 italic">{q.explanation}</p>}
                  </div>
                )
              })}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all">Close</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[current]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg">{testName || 'Mock Test'}</h2>
            <p className="text-sm opacity-80">Question {current + 1} of {questions.length}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-lg transition-all">✕</button>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }}></div>
        </div>

        {/* Question */}
        <div className="p-6">
          <p className="font-bold text-gray-900 dark:text-white text-lg mb-5">{q.question}</p>
          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(current, idx)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm
                  ${selected[current] === idx
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 text-gray-700 dark:text-gray-300'
                  }`}
              >
                <span className="font-black mr-2">{String.fromCharCode(65 + idx)}.</span>{opt}
              </button>
            ))}
          </div>
        </div>

        {/* Footer nav */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="px-5 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm"
          >
            ← Prev
          </button>

          <span className="text-xs text-gray-400">{Object.keys(selected).length} / {questions.length} answered</span>

          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent(c => c + 1)}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all text-sm"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(selected).length === 0}
              className="px-5 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-all text-sm disabled:opacity-50"
            >
              Submit ✓
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

