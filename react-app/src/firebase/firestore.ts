import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  setDoc
} from 'firebase/firestore';
import { db } from './config.ts';

// ============================================
// FIRESTORE TYPES
// ============================================

export interface Course extends DocumentData {
  id?: string;
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  videoUrl: string;
  pdfUrl: string;
  instructor?: string;
  duration?: string;
  category?: string;
  thumbnail?: string;
  studentsEnrolled?: number;
  rating?: number;
  createdAt?: any;
}

// ============================================
// STUDENT PROGRESS TYPES
// ============================================

export interface VideoProgress extends DocumentData {
  id?: string;
  userId: string;
  courseId: string;
  videoUrl: string;
  videoTitle: string;
  watchedAt: any;
  duration?: number;
  percentageWatched?: number;
}

export interface MockTestScore extends DocumentData {
  id?: string;
  userId: string;
  testId: string;
  testName: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  duration: number;
  takenAt: any;
}

export interface StudentProgress extends DocumentData {
  id?: string;
  userId: string;
  email: string;
  displayName?: string;
  totalHoursWatched: number;
  videosWatched: number;
  totalVideos: number;
  mockTestsCompleted: number;
  averageTestScore: number;
  lastActivityAt: any;
  createdAt: any;
  updatedAt: any;
}

// ============================================
// USER ENROLLMENT & COURSE ACCESS TYPES
// ============================================

export interface UserEnrollment extends DocumentData {
  id?: string;
  userId: string;
  email: string;
  enrolledCourses: string[]; // Array of course types: 'UPSC', 'TNPSC', 'BOTH'
  paymentStatus: 'paid' | 'pending' | 'failed';
  enrolledAt: any;
  expiresAt?: any;
}

// ============================================
// COURSES COLLECTION FUNCTIONS
// ============================================

/**
 * FETCH ALL COURSES
 * @returns {Promise<Course[]>} Array of all courses
 */
export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, 'courses');
    const snapshot = await getDocs(coursesRef);
    
    const courses: Course[] = [];
    snapshot.forEach((doc) => {
      courses.push({
        id: doc.id,
        ...doc.data()
      } as Course);
    });
    
    console.log('✅ Fetched all courses:', courses.length);
    return courses;
  } catch (error: any) {
    console.error('❌ Error fetching courses:', error.message);
    throw error;
  }
};

/**
 * FETCH FREE COURSES ONLY
 * @returns {Promise<Course[]>} Array of free courses
 */
export const getFreeCourses = async (): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, where('isFree', '==', true));
    const snapshot = await getDocs(q);
    
    const courses: Course[] = [];
    snapshot.forEach((doc) => {
      courses.push({
        id: doc.id,
        ...doc.data()
      } as Course);
    });
    
    console.log('✅ Fetched free courses:', courses.length);
    return courses;
  } catch (error: any) {
    console.error('❌ Error fetching free courses:', error.message);
    throw error;
  }
};

/**
 * FETCH PAID COURSES ONLY
 * @returns {Promise<Course[]>} Array of paid courses
 */
export const getPaidCourses = async (): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, where('isFree', '==', false));
    const snapshot = await getDocs(q);
    
    const courses: Course[] = [];
    snapshot.forEach((doc) => {
      courses.push({
        id: doc.id,
        ...doc.data()
      } as Course);
    });
    
    console.log('✅ Fetched paid courses:', courses.length);
    return courses;
  } catch (error: any) {
    console.error('❌ Error fetching paid courses:', error.message);
    throw error;
  }
};

/**
 * FETCH COURSES BY CATEGORY
 * @param {string} category - Category name
 * @returns {Promise<Course[]>} Array of courses in that category
 */
export const getCoursesByCategory = async (category: string): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, where('category', '==', category));
    const snapshot = await getDocs(q);
    
    const courses: Course[] = [];
    snapshot.forEach((doc) => {
      courses.push({
        id: doc.id,
        ...doc.data()
      } as Course);
    });
    
    console.log(`✅ Fetched courses in category "${category}":`, courses.length);
    return courses;
  } catch (error: any) {
    console.error('❌ Error fetching courses by category:', error.message);
    throw error;
  }
};

/**
 * FETCH SINGLE COURSE BY ID
 * @param {string} courseId - Course document ID
 * @returns {Promise<Course>} Course object
 */
export const getCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const snapshot = await getDoc(courseRef);
    
    if (snapshot.exists()) {
      console.log('✅ Fetched course:', snapshot.id);
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Course;
    } else {
      console.warn('⚠️ Course not found:', courseId);
      return null;
    }
  } catch (error: any) {
    console.error('❌ Error fetching course:', error.message);
    throw error;
  }
};

/**
 * ADD NEW COURSE (Admin Only)
 * @param {Course} courseData - Course object with title, description, price, etc.
 * @returns {Promise<string>} New course ID
 */
export const addCourse = async (courseData: Course): Promise<string> => {
  try {
    const coursesRef = collection(db, 'courses');
    const docRef = await addDoc(coursesRef, {
      ...courseData,
      createdAt: new Date(),
      studentsEnrolled: 0,
      rating: 0
    });
    
    console.log('✅ Course added with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error adding course:', error.message);
    throw error;
  }
};

/**
 * UPDATE COURSE (Admin Only)
 * @param {string} courseId - Course document ID
 * @param {Partial<Course>} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateCourse = async (courseId: string, updates: Partial<Course>): Promise<void> => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, updates);
    
    console.log('✅ Course updated:', courseId);
  } catch (error: any) {
    console.error('❌ Error updating course:', error.message);
    throw error;
  }
};

/**
 * DELETE COURSE (Admin Only)
 * @param {string} courseId - Course document ID
 * @returns {Promise<void>}
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    await deleteDoc(courseRef);
    
    console.log('✅ Course deleted:', courseId);
  } catch (error: any) {
    console.error('❌ Error deleting course:', error.message);
    throw error;
  }
};

/**
 * SEARCH COURSES BY TITLE
 * @param {string} searchTerm - Search query
 * @returns {Promise<Course[]>} Matching courses (client-side filtering)
 */
export const searchCourses = async (searchTerm: string): Promise<Course[]> => {
  try {
    const courses = await getAllCourses();
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log('✅ Search results:', filtered.length);
    return filtered;
  } catch (error: any) {
    console.error('❌ Error searching courses:', error.message);
    throw error;
  }
};

/**
 * GET TOP RATED COURSES
 * @param {number} count - Number of courses to fetch
 * @returns {Promise<Course[]>} Top rated courses
 */
export const getTopRatedCourses = async (count: number = 5): Promise<Course[]> => {
  try {
    const courses = await getAllCourses();
    return courses
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, count);
  } catch (error: any) {
    console.error('❌ Error fetching top rated courses:', error.message);
    throw error;
  }
};

/**
 * GET TRENDING COURSES (Most enrolled)
 * @param {number} count - Number of courses to fetch
 * @returns {Promise<Course[]>} Trending courses
 */
export const getTrendingCourses = async (count: number = 5): Promise<Course[]> => {
  try {
    const courses = await getAllCourses();
    return courses
      .sort((a, b) => (b.studentsEnrolled || 0) - (a.studentsEnrolled || 0))
      .slice(0, count);
  } catch (error: any) {
    console.error('❌ Error fetching trending courses:', error.message);
    throw error;
  }
};

// ============================================
// STUDENT PROGRESS COLLECTION FUNCTIONS
// ============================================

/**
 * TRACK VIDEO WATCHED
 * @param {VideoProgress} videoData - Video progress data
 * @returns {Promise<string>} Document ID
 */
export const trackVideoWatched = async (videoData: VideoProgress): Promise<string> => {
  try {
    const videoProgressRef = collection(db, 'videoProgress');
    const docRef = await addDoc(videoProgressRef, {
      ...videoData,
      watchedAt: new Date()
    });
    console.log('✅ Video progress tracked:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error tracking video:', error.message);
    throw error;
  }
};

/**
 * TRACK MOCK TEST SCORE
 * @param {MockTestScore} scoreData - Mock test score data
 * @returns {Promise<string>} Document ID
 */
export const trackMockTestScore = async (scoreData: MockTestScore): Promise<string> => {
  try {
    const testScoresRef = collection(db, 'mockTestScores');
    const docRef = await addDoc(testScoresRef, {
      ...scoreData,
      takenAt: new Date()
    });
    console.log('✅ Mock test score recorded:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error tracking mock test:', error.message);
    throw error;
  }
};

/**
 * GET STUDENT PROGRESS
 * @param {string} userId - User ID
 * @returns {Promise<StudentProgress>} Student progress data
 */
export const getStudentProgress = async (userId: string): Promise<StudentProgress | null> => {
  try {
    const progressRef = collection(db, 'studentProgress');
    const q = query(progressRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('⚠️ No progress found for user:', userId);
      return null;
    }
    
    const doc = snapshot.docs[0];
    console.log('✅ Fetched student progress:', doc.id);
    return {
      id: doc.id,
      ...doc.data()
    } as StudentProgress;
  } catch (error: any) {
    console.error('❌ Error fetching student progress:', error.message);
    throw error;
  }
};

/**
 * GET VIDEOS WATCHED BY USER
 * @param {string} userId - User ID
 * @returns {Promise<VideoProgress[]>} Array of videos watched
 */
export const getVideosWatchedByUser = async (userId: string): Promise<VideoProgress[]> => {
  try {
    const videoProgressRef = collection(db, 'videoProgress');
    const q = query(videoProgressRef, where('userId', '==', userId), orderBy('watchedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const videos: VideoProgress[] = [];
    snapshot.forEach((doc) => {
      videos.push({
        id: doc.id,
        ...doc.data()
      } as VideoProgress);
    });
    
    console.log('✅ Fetched videos watched:', videos.length);
    return videos;
  } catch (error: any) {
    console.error('❌ Error fetching watched videos:', error.message);
    throw error;
  }
};

/**
 * GET MOCK TEST SCORES BY USER
 * @param {string} userId - User ID
 * @returns {Promise<MockTestScore[]>} Array of test scores
 */
export const getMockTestScoresByUser = async (userId: string): Promise<MockTestScore[]> => {
  try {
    const testScoresRef = collection(db, 'mockTestScores');
    const q = query(testScoresRef, where('userId', '==', userId), orderBy('takenAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const scores: MockTestScore[] = [];
    snapshot.forEach((doc) => {
      scores.push({
        id: doc.id,
        ...doc.data()
      } as MockTestScore);
    });
    
    console.log('✅ Fetched test scores:', scores.length);
    return scores;
  } catch (error: any) {
    console.error('❌ Error fetching test scores:', error.message);
    throw error;
  }
};

/**
 * GET ALL SCORES FOR A SPECIFIC TEST (for ranking)
 * @param {string} testId - Test ID
 * @returns {Promise<MockTestScore[]>} Array of all scores for this test
 */
export const getAllScoresForTest = async (testId: string): Promise<MockTestScore[]> => {
  try {
    console.log('🔍 getAllScoresForTest called with testId:', testId)
    const testScoresRef = collection(db, 'mockTestScores');
    // Only use where() — no orderBy — to avoid needing a composite index
    const q = query(testScoresRef, where('testId', '==', testId));

    console.log('📡 Executing Firestore query...')
    const snapshot = await getDocs(q);
    console.log('📦 Query completed. Documents found:', snapshot.size)

    const scores: MockTestScore[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data()
      scores.push({ id: doc.id, ...data } as MockTestScore);
    });

    // Sort in JS — no Firestore composite index needed
    scores.sort((a, b) => b.score - a.score);

    console.log('✅ Fetched all scores for test:', scores.length, 'scores:', scores.map(s => s.score))
    return scores;
  } catch (error: any) {
    console.error('❌ Error fetching all test scores:', error.message, error)
    return [];
  }
};

/**
 * UPDATE STUDENT PROGRESS
 * @param {string} userId - User ID
 * @param {Partial<StudentProgress>} data - Progress data to update
 * @returns {Promise<void>}
 */
export const updateStudentProgress = async (userId: string, data: Partial<StudentProgress>): Promise<void> => {
  try {
    const progressRef = collection(db, 'studentProgress');
    const q = query(progressRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Create new progress document if doesn't exist
      await addDoc(progressRef, {
        userId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Created new student progress');
    } else {
      // Update existing document
      const docRef = doc(db, 'studentProgress', snapshot.docs[0].id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
      console.log('✅ Updated student progress');
    }
  } catch (error: any) {
    console.error('❌ Error updating student progress:', error.message);
    throw error;
  }
};

/**
 * GET STUDENT STATISTICS
 * @param {string} userId - User ID
 * @returns {Promise<any>} Student statistics
 */
export const getStudentStats = async (userId: string): Promise<any> => {
  try {
    // Fetch videos watched
    const videosWatched = await getVideosWatchedByUser(userId);
    
    // Fetch test scores
    const testScores = await getMockTestScoresByUser(userId);
    
    // Calculate average score
    const avgScore = testScores.length > 0
      ? Math.round(testScores.reduce((sum, t) => sum + t.score, 0) / testScores.length)
      : 0;
    
    // Calculate total hours (estimate 45-60 min per video)
    const totalHours = videosWatched.length * 0.75;
    
    // Calculate streak (mock)
    const streak = videosWatched.length > 0 ? 7 : 0;
    
    console.log('✅ Fetched student stats');
    return {
      totalHoursWatched: parseFloat(totalHours.toFixed(1)),
      videosWatched: videosWatched.length,
      mockTestsCompleted: testScores.length,
      averageTestScore: avgScore,
      currentStreak: streak,
      allTestScores: testScores
    };
  } catch (error: any) {
    console.error('❌ Error fetching student stats:', error.message);
    throw error;
  }
};

// ============================================
// LECTURES COLLECTION FUNCTIONS
// ============================================

export interface Lecture extends DocumentData {
  id?: string;
  title: string;
  topic: string;
  videoUrl: string;
  duration: number;
  uploadedBy: string;
  uploadedAt: any;
  description?: string;
  thumbnail?: string;
}

/**
 * UPLOAD NEW LECTURE
 */
export const uploadLecture = async (lecture: Lecture): Promise<string> => {
  try {
    const lecturesRef = collection(db, 'lectures');
    const docRef = await addDoc(lecturesRef, {
      ...lecture,
      uploadedAt: new Date(),
    });
    console.log('✅ Lecture uploaded:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error uploading lecture:', error.message);
    throw error;
  }
};

/**
 * GET ALL LECTURES BY TOPIC
 */
export const getLecturesByTopic = async (topic: string): Promise<Lecture[]> => {
  try {
    const lecturesRef = collection(db, 'lectures');
    const q = query(lecturesRef, where('topic', '==', topic), orderBy('uploadedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const lectures: Lecture[] = [];
    snapshot.forEach((doc) => {
      lectures.push({
        id: doc.id,
        ...doc.data()
      } as Lecture);
    });
    console.log('✅ Fetched lectures for topic:', topic);
    return lectures;
  } catch (error: any) {
    console.error('❌ Error fetching lectures:', error.message);
    throw error;
  }
};

/**
 * GET ALL LECTURES
 */
export const getAllLectures = async (): Promise<Lecture[]> => {
  try {
    const lecturesRef = collection(db, 'lectures');
    const q = query(lecturesRef, orderBy('uploadedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const lectures: Lecture[] = [];
    snapshot.forEach((doc) => {
      lectures.push({
        id: doc.id,
        ...doc.data()
      } as Lecture);
    });
    console.log('✅ Fetched all lectures');
    return lectures;
  } catch (error: any) {
    console.error('❌ Error fetching all lectures:', error.message);
    throw error;
  }
};

/**
 * DELETE LECTURE
 */
export const deleteLecture = async (lectureId: string): Promise<void> => {
  try {
    const lectureRef = doc(db, 'lectures', lectureId);
    await deleteDoc(lectureRef);
    console.log('✅ Lecture deleted:', lectureId);
  } catch (error: any) {
    console.error('❌ Error deleting lecture:', error.message);
    throw error;
  }
};

/**
 * TRACK LECTURE VIEW
 */
export const trackLectureView = async (userId: string, lectureId: string, lectureTitle: string): Promise<void> => {
  try {
    const viewRef = collection(db, 'lectureViews');
    await addDoc(viewRef, {
      userId,
      lectureId,
      lectureTitle,
      viewedAt: new Date(),
    });
    console.log('✅ Lecture view tracked');
  } catch (error: any) {
    console.error('❌ Error tracking lecture view:', error.message);
    throw error;
  }
};

/**
 * GET USER'S WATCHED LECTURES
 */
export const getWatchedLectures = async (userId: string): Promise<any[]> => {
  try {
    const viewRef = collection(db, 'lectureViews');
    const q = query(viewRef, where('userId', '==', userId), orderBy('viewedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const lectures: any[] = [];
    snapshot.forEach((doc) => {
      lectures.push({
        id: doc.id,
        ...doc.data()
      });
    });
    console.log('✅ Fetched watched lectures');
    return lectures;
  } catch (error: any) {
    console.error('❌ Error fetching watched lectures:', error.message);
    throw error;
  }
};

// ============================================
// VIDEO MANAGEMENT FUNCTIONS
// ============================================

export const addVideoToDatabase = async (videoData: {
  title: string;
  instructor: string;
  duration: string;
  description: string;
  url: string;
  courseId: string;
  uploadedBy: string;
}) => {
  try {
    const videosRef = collection(db, 'videos');
    const docRef = await addDoc(videosRef, {
      ...videoData,
      uploadedAt: new Date().toISOString(),
      status: 'active'
    });
    console.log('✅ Video added to database:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error adding video:', error.message);
    throw error;
  }
};

export const getVideosFromDatabase = async () => {
  try {
    const videosRef = collection(db, 'videos');
    const q = query(videosRef, orderBy('uploadedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const videos: any[] = [];
    snapshot.forEach((doc) => {
      videos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    console.log('✅ Fetched all videos');
    return videos;
  } catch (error: any) {
    console.error('❌ Error fetching videos:', error.message);
    throw error;
  }
};

export const getVideosByCourse = async (courseId: string) => {
  try {
    const videosRef = collection(db, 'videos');
    const q = query(
      videosRef,
      where('courseId', '==', courseId),
      where('status', '==', 'active'),
      orderBy('uploadedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    const videos: any[] = [];
    snapshot.forEach((doc) => {
      videos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    console.log(`✅ Fetched videos for course: ${courseId}`);
    return videos;
  } catch (error: any) {
    console.error('❌ Error fetching videos by course:', error.message);
    throw error;
  }
};

export const deleteVideoFromDatabase = async (videoId: string) => {
  try {
    const videoRef = doc(db, 'videos', videoId);
    await deleteDoc(videoRef);
    console.log('✅ Video deleted from database');
  } catch (error: any) {
    console.error('❌ Error deleting video:', error.message);
    throw error;
  }
};

export const updateVideoInDatabase = async (videoId: string, updateData: any) => {
  try {
    const videoRef = doc(db, 'videos', videoId);
    await updateDoc(videoRef, updateData);
    console.log('✅ Video updated');
  } catch (error: any) {
    console.error('❌ Error updating video:', error.message);
    throw error;
  }
};

// ============================================
// ADMIN ROLE MANAGEMENT
// ============================================

/**
 * Check if user is admin
 * @param userId - Firebase user ID
 * @returns true if user is admin, false otherwise
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'admins', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error: any) {
    console.error('❌ Error checking admin status:', error.message);
    return false;
  }
};

/**
 * Add user as admin
 * @param userId - Firebase user ID
 * @param email - User email
 */
export const makeUserAdmin = async (userId: string, email: string) => {
  try {
    await setDoc(doc(db, 'admins', userId), {
      email,
      createdAt: new Date(),
      role: 'admin'
    });
    console.log('✅ User made admin');
  } catch (error: any) {
    console.error('❌ Error making user admin:', error.message);
    throw error;
  }
};

/**
 * Remove admin privileges
 * @param userId - Firebase user ID
 */
export const removeAdminRole = async (userId: string) => {
  try {
    await deleteDoc(doc(db, 'admins', userId));
    console.log('✅ Admin role removed');
  } catch (error: any) {
    console.error('❌ Error removing admin:', error.message);
    throw error;
  }
};

/**
 * Enroll user in a course (UPSC or TNPSC)
 * @param userId - Firebase user ID
 * @param email - User email
 * @param courseType - 'UPSC' | 'TNPSC' | 'BOTH'
 */
export const enrollUserInCourse = async (
  userId: string,
  email: string,
  courseId: string
): Promise<void> => {
  try {
    const enrollmentRef = doc(db, 'enrollments', userId);
    const enrollmentSnap = await getDoc(enrollmentRef);

    if (enrollmentSnap.exists()) {
      // Update existing enrollment — add courseId if not already present
      const currentData = enrollmentSnap.data() as UserEnrollment;
      const enrolledCourses: string[] = currentData.enrolledCourses || [];

      if (!enrolledCourses.includes(courseId)) {
        enrolledCourses.push(courseId);
        await updateDoc(enrollmentRef, {
          enrolledCourses,
          updatedAt: new Date()
        });
      }
    } else {
      // Create new enrollment
      await setDoc(enrollmentRef, {
        userId,
        email,
        enrolledCourses: [courseId],
        paymentStatus: 'paid',
        enrolledAt: new Date(),
        expiresAt: null
      });
    }
    console.log(`✅ User enrolled in ${courseId}`);
  } catch (error: any) {
    console.error('❌ Error enrolling user:', error.message);
    throw error;
  }
};

/**
 * Get user's enrolled courses
 * @param userId - Firebase user ID
 * @returns Array of enrolled course types
 */
export const getUserEnrolledCourses = async (userId: string): Promise<string[]> => {
  try {
    const enrollmentRef = doc(db, 'enrollments', userId);
    const enrollmentSnap = await getDoc(enrollmentRef);

    if (enrollmentSnap.exists()) {
      const data = enrollmentSnap.data() as UserEnrollment;
      return data.enrolledCourses || [];
    }
    return [];
  } catch (error: any) {
    console.error('❌ Error fetching enrolled courses:', error.message);
    return [];
  }
};

/**
 * Check if user has access to a specific course
 * @param userId - Firebase user ID
 * @param courseType - 'UPSC' | 'TNPSC'
 * @returns true if user has access, false otherwise
 */
export const hasUserAccessToCourse = async (
  userId: string,
  courseType: string
): Promise<boolean> => {
  try {
    const enrolledCourses = await getUserEnrolledCourses(userId);
    // Support both exact match (new specific IDs) and prefix match
    return enrolledCourses.some(c =>
      c === courseType || c.toLowerCase().startsWith(courseType.toLowerCase())
    );
  } catch (error: any) {
    console.error('❌ Error checking course access:', error.message);
    return false;
  }
};

/**
 * Remove user enrollment (specific course, or entire record)
 * @param userId - Firebase user ID
 * @param courseId - optional specific course ID to remove; omit to delete entire enrollment
 */
export const removeUserEnrollment = async (userId: string, courseId?: string): Promise<void> => {
  try {
    const enrollmentRef = doc(db, 'enrollments', userId);
    if (courseId) {
      // Remove only this specific course from the array
      const snap = await getDoc(enrollmentRef);
      if (snap.exists()) {
        const data = snap.data() as UserEnrollment;
        const updated = (data.enrolledCourses || []).filter((c: string) => c !== courseId);
        await updateDoc(enrollmentRef, { enrolledCourses: updated, updatedAt: new Date() });
      }
    } else {
      await deleteDoc(enrollmentRef);
    }
    console.log('✅ User enrollment removed');
  } catch (error: any) {
    console.error('❌ Error removing enrollment:', error.message);
    throw error;
  }
};

// ============================================
// LIVE SESSIONS
// ============================================

export interface FirestoreLiveSession extends DocumentData {
  id?: string;
  title: string;
  topic?: string;
  instructor?: string;
  description?: string;
  scheduledAt: any;
  duration?: number;
  meetLink: string;
  status: 'upcoming' | 'live' | 'completed';
  category?: string;
  createdAt?: any;
}

export const getLiveSessions = async (): Promise<FirestoreLiveSession[]> => {
  try {
    const ref = collection(db, 'liveSessions');
    const q = query(ref, orderBy('scheduledAt', 'asc'));
    const snapshot = await getDocs(q);
    const sessions: FirestoreLiveSession[] = [];
    snapshot.forEach((d) => {
      sessions.push({ id: d.id, ...d.data() } as FirestoreLiveSession);
    });
    return sessions;
  } catch (error: any) {
    console.error('❌ Error fetching live sessions:', error.message);
    return [];
  }
};

export const addLiveSession = async (session: Omit<FirestoreLiveSession, 'id'>): Promise<string> => {
  try {
    const ref = collection(db, 'liveSessions');
    const docRef = await addDoc(ref, { ...session, createdAt: new Date() });
    console.log('✅ Live session added:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error adding live session:', error.message);
    throw error;
  }
};

export const deleteLiveSession = async (sessionId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'liveSessions', sessionId));
    console.log('✅ Live session deleted');
  } catch (error: any) {
    console.error('❌ Error deleting live session:', error.message);
    throw error;
  }
};

