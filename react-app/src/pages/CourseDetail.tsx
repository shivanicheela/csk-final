import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById } from '../firebase/firestore.ts';
import { Course } from '../firebase/firestore.ts';
import { logVideoWatch } from '../utils/progressTracker.ts';
import { useAuth } from '../context/AuthContext.tsx';

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoWatched, setVideoWatched] = useState(false);

  // Track video when completed
  const handleVideoEnded = async () => {
    if (!user?.uid || !courseId || !course || videoWatched) return;
    
    try {
      await logVideoWatch(
        user.uid,
        courseId,
        course.videoUrl || '',
        course.title || 'Unknown Course',
        45 // Default video duration in minutes
      );
      setVideoWatched(true);
      console.log('✅ Video watch tracked successfully');
    } catch (error: any) {
      console.error('❌ Failed to track video:', error);
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError('Course ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const courseData = await getCourseById(courseId);
        if (courseData) {
          setCourse(courseData);
        } else {
          setError('Course not found');
        }
      } catch (err: any) {
        console.error('Error fetching course:', err);
        setError('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          {/* Header Skeleton */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
            <div className="h-96 bg-gradient-to-r from-gray-300 to-gray-200"></div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-full"></div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-6 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded">
            <h2 className="text-red-800 font-bold text-lg">Error</h2>
            <p className="text-red-700 mt-2">{error || 'Course not found'}</p>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="mt-6 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/courses')}
          className="mb-8 px-4 py-2 text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-2"
        >
          ← Back to Courses
        </button>

        {/* Course Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {/* Thumbnail */}
          <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 h-96 flex items-center justify-center overflow-hidden">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-8xl">📚</div>
            )}
            {/* Badge */}
            <div className="absolute top-6 right-6">
              {course.isFree ? (
                <span className="bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg">
                  FREE
                </span>
              ) : (
                <span className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold text-lg">
                  ₹{course.price}
                </span>
              )}
            </div>
          </div>

          {/* Course Info */}
          <div className="p-8">
            {/* Title */}
            <h1 className="text-4xl font-black text-gray-900 mb-4">{course.title}</h1>

            {/* Meta Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {course.instructor && (
                <div>
                  <p className="text-sm text-gray-600">Instructor</p>
                  <p className="font-bold text-gray-900">👨‍🏫 {course.instructor}</p>
                </div>
              )}
              {course.duration && (
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-bold text-gray-900">⏱️ {course.duration}</p>
                </div>
              )}
              {course.studentsEnrolled && (
                <div>
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="font-bold text-gray-900">👥 {course.studentsEnrolled.toLocaleString()}</p>
                </div>
              )}
              {course.rating && (
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="font-bold text-gray-900">⭐ {course.rating.toFixed(1)}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Course</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{course.description}</p>
            </div>

            {/* Category */}
            {course.category && (
              <div className="mb-8">
                <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-full text-sm">
                  {course.category}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Video & PDF Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Video Player */}
          {course.videoUrl && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">📹 Course Video</h2>
              </div>
              <div className="p-6">
                <div className="w-full bg-black rounded-lg overflow-hidden">
                  <video
                    src={course.videoUrl}
                    controls
                    className="w-full h-80 object-cover"
                    onEnded={handleVideoEnded}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Click play to watch the course introduction
                </p>
              </div>
            </div>
          )}

          {/* PDF Download */}
          {course.pdfUrl && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">📄 Course Materials</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-lg">
                  <div className="text-6xl">📕</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">Course Study Materials</p>
                    <p className="text-sm text-gray-600">PDF guide with detailed course content</p>
                  </div>
                </div>
                <a
                  href={course.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all inline-block text-center"
                >
                  ⬇️ Download PDF
                </a>
                <p className="text-sm text-gray-600 mt-4">
                  Download the complete PDF guide for offline reading
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Enroll Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to start learning?</h2>
          <button 
            onClick={() => {
              if (course?.isFree) {
                // Free course - navigate to dashboard
                navigate('/dashboard');
              } else {
                // Paid course - navigate to payment/checkout (or login if not logged in)
                navigate('/login');
              }
            }}
            className="px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg"
          >
            {course?.isFree ? '✅ Enroll Free' : `💳 Enroll Now (₹${course?.price})`}
          </button>
          {course?.isFree && (
            <p className="text-green-600 font-semibold mt-4">Free course - No payment required!</p>
          )}
        </div>
      </div>
    </div>
  );
}
