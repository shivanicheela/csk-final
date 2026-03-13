import { collection, getDocs } from 'firebase/firestore';
import { db } from './config';

export interface StudentInfo {
  id: string;
  email: string;
  displayName?: string;
  enrolledCourses?: string[];
  paymentStatus?: string;
}

export const getAllStudents = async (): Promise<StudentInfo[]> => {
  const usersRef = collection(db, 'users');
  const enrollmentsRef = collection(db, 'enrollments');
  const [usersSnap, enrollmentsSnap] = await Promise.all([
    getDocs(usersRef),
    getDocs(enrollmentsRef)
  ]);

  // Map enrollments by userId
  const enrollmentsMap: Record<string, any> = {};
  enrollmentsSnap.forEach(doc => {
    enrollmentsMap[doc.id] = doc.data();
  });

  const students: StudentInfo[] = [];
  usersSnap.forEach(doc => {
    const data = doc.data();
    const enrollment = enrollmentsMap[doc.id] || {};
    students.push({
      id: doc.id,
      email: data.email,
      displayName: data.displayName,
      enrolledCourses: enrollment.enrolledCourses || [],
      paymentStatus: enrollment.paymentStatus || 'none',
    });
  });
  return students;
};

