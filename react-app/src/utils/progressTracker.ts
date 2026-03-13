import { trackVideoWatched, trackMockTestScore, updateStudentProgress, getStudentProgress } from '../firebase/firestore.ts'

/**
 * LOG A VIDEO WATCH EVENT
 * @param userId - User ID
 * @param courseId - Course ID
 * @param videoUrl - Video URL from Firebase Storage
 * @param videoTitle - Title of the video
 * @param duration - Optional video duration in minutes
 */
export const logVideoWatch = async (
  userId: string,
  courseId: string,
  videoUrl: string,
  videoTitle: string,
  duration?: number
): Promise<void> => {
  try {
    // First, track the video watched in the collection
    await trackVideoWatched({
      userId,
      courseId,
      videoUrl,
      videoTitle,
      watchedAt: new Date(),
      duration: duration || 45,
      percentageWatched: 100
    })
    
    // Get current progress to increment properly
    const currentProgress = await getStudentProgress(userId)
    const currentVideosWatched = currentProgress?.videosWatched || 0
    
    // Update total videos watched (increment properly)
    await updateStudentProgress(userId, {
      lastActivityAt: new Date(),
      videosWatched: currentVideosWatched + 1
    })
    
    console.log('✅ Video watch logged')
  } catch (error) {
    console.error('❌ Failed to log video watch:', error)
    throw error
  }
}

/**
 * LOG A MOCK TEST COMPLETION
 * @param userId - User ID
 * @param testId - Test ID
 * @param testName - Test name
 * @param score - Score percentage (0-100)
 * @param totalQuestions - Total questions in test
 * @param correctAnswers - Number of correct answers
 * @param duration - Duration in minutes
 */
export const logMockTestCompletion = async (
  userId: string,
  testId: string,
  testName: string,
  score: number,
  totalQuestions: number,
  correctAnswers: number,
  duration: number
): Promise<void> => {
  try {
    // First, track the test score in the collection
    await trackMockTestScore({
      userId,
      testId,
      testName,
      score,
      totalQuestions,
      correctAnswers,
      duration,
      takenAt: new Date()
    })
    
    // Get current progress to increment properly
    const currentProgress = await getStudentProgress(userId)
    const currentTestsCompleted = currentProgress?.mockTestsCompleted || 0
    
    // Update test completion count (increment properly)
    await updateStudentProgress(userId, {
      lastActivityAt: new Date(),
      mockTestsCompleted: currentTestsCompleted + 1
    })
    
    console.log('✅ Mock test completion logged')
  } catch (error) {
    console.error('❌ Failed to log mock test:', error)
    throw error
  }
}

/**
 * CALCULATE LEARNING STATS FROM ACTIVITIES
 */
export const calculateLearningStats = (
  videosWatched: number,
  testScores: any[],
  avgMinutesPerVideo: number = 45
) => {
  const totalHours = (videosWatched * avgMinutesPerVideo) / 60
  const avgScore = testScores.length > 0
    ? Math.round(testScores.reduce((sum, t) => sum + t.score, 0) / testScores.length)
    : 0
  
  return {
    totalHours: parseFloat(totalHours.toFixed(1)),
    videosWatched,
    testScores: testScores.length,
    averageScore: avgScore
  }
}

/**
 * ESTIMATE RANKING BASED ON PERFORMANCE
 */
export const estimateRank = (
  videosWatched: number,
  averageScore: number,
  daysActive: number
): string => {
  const score = (videosWatched * 10) + (averageScore * 5) + (daysActive * 2)
  
  if (score > 1000) return '#245 (Top 1%)'
  if (score > 800) return '#1,245 (Top 3%)'
  if (score > 600) return '#5,120 (Top 10%)'
  if (score > 400) return '#15,890 (Top 25%)'
  return '#50,000+ (Keep grinding!)'
}

/**
 * GET ACHIEVEMENT BADGES
 */
export const getAchievements = (
  videosWatched: number,
  testsTaken: number,
  averageScore: number
): string[] => {
  const badges = []
  
  if (videosWatched >= 1) badges.push('🎬 First Video Watched')
  if (videosWatched >= 5) badges.push('🎥 Video Enthusiast')
  if (videosWatched >= 10) badges.push('📺 Video Master')
  
  if (testsTaken >= 1) badges.push('✏️ Test Taker')
  if (testsTaken >= 3) badges.push('📝 Test Warrior')
  
  if (averageScore >= 80) badges.push('⭐ High Achiever')
  if (averageScore >= 90) badges.push('🏆 Excellence')
  
  return badges
}
