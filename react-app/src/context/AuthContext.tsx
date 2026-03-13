import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '../firebase/config.ts'
import { getUserEnrolledCourses } from '../firebase/firestore.ts'

const ADMIN_EMAILS = ['civilserviceskendra@gmail.com', 'admin@csk.com']

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  enrolledCourses: string[]
  refreshEnrollments: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  enrolledCourses: [],
  refreshEnrollments: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([])

  const isAdmin = !!user && ADMIN_EMAILS.includes((user.email || '').toLowerCase())

  const refreshEnrollments = async () => {
    if (!user) { setEnrolledCourses([]); return }
    try {
      const courses = await getUserEnrolledCourses(user.uid)
      setEnrolledCourses(courses)
    } catch {
      setEnrolledCourses([])
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const courses = await getUserEnrolledCourses(firebaseUser.uid)
          setEnrolledCourses(courses)
        } catch {
          setEnrolledCourses([])
        }
      } else {
        setEnrolledCourses([])
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, enrolledCourses, refreshEnrollments }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

