import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllCourses, getFreeCourses, getPaidCourses, Course } from '../firebase/firestore.ts';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // ============================================
  // FETCH COURSES ON MOUNT
  // ============================================
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        let data: Course[] = [];
        if (filter === 'free') {
          data = await getFreeCourses();
        } else if (filter === 'paid') {
          data = await getPaidCourses();
        } else {
          data = await getAllCourses();
        }

        setCourses(data);
        setFilteredCourses(data);
      } catch (err: any) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [filter]);

  // ============================================
  // SEARCH COURSES
  // ============================================
  useEffect(() => {
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-semibold"
          >
            ← Back
          </button>
        </div>
        
        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Our Courses</h1>
          <p className="text-lg text-gray-600">Choose from our wide range of courses and start learning</p>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-8 max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="🔍 Search courses by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 rounded-lg border-2 border-gray-300 focus:border-indigo-600 focus:outline-none text-lg"
          />
        </div>

        {/* FILTERS */}
        <div className="flex gap-3 mb-8 justify-center flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Courses ({courses.length})
          </button>
          <button
            onClick={() => setFilter('free')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              filter === 'free'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Free Courses ({courses.filter(c => c.isFree).length})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              filter === 'paid'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Paid Courses ({courses.filter(c => !c.isFree).length})
          </button>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                <div key={skeleton} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gradient-to-r from-gray-300 to-gray-200"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="flex justify-between items-center pt-4">
                      <div className="h-6 bg-gray-300 rounded w-20"></div>
                      <div className="h-10 bg-gray-300 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded mb-8">
            <p className="text-red-800 font-bold">❌ {error}</p>
          </div>
        )}

        {/* NO COURSES STATE */}
        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-600 font-bold">No courses found</p>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        )}

        {/* COURSES GRID */}
        {!loading && filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden"
              >
                {/* COURSE THUMBNAIL */}
                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 h-48 flex items-center justify-center">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-6xl">📚</div>
                  )}

                  {/* FREE/PAID BADGE */}
                  <div className="absolute top-3 right-3">
                    {course.isFree ? (
                      <span className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                        FREE
                      </span>
                    ) : (
                      <span className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-sm">
                        ₹{course.price}
                      </span>
                    )}
                  </div>

                  {/* RATING BADGE */}
                  {course.rating && (
                    <div className="absolute top-3 left-3 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1">
                      ⭐ {course.rating.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* COURSE INFO */}
                <div className="p-6">
                  {/* CATEGORY */}
                  {course.category && (
                    <span className="text-xs font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded">
                      {course.category}
                    </span>
                  )}

                  {/* TITLE */}
                  <h3 className="text-xl font-bold text-gray-900 mt-3 line-clamp-2">
                    {course.title}
                  </h3>

                  {/* DESCRIPTION */}
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {course.description}
                  </p>

                  {/* INSTRUCTOR */}
                  {course.instructor && (
                    <p className="text-gray-700 text-sm mt-3 font-semibold">
                      👨‍🏫 {course.instructor}
                    </p>
                  )}

                  {/* DURATION */}
                  {course.duration && (
                    <p className="text-gray-600 text-sm mt-1">
                      ⏱️ {course.duration}
                    </p>
                  )}

                  {/* STUDENTS ENROLLED */}
                  {course.studentsEnrolled && (
                    <p className="text-gray-600 text-sm mt-1">
                      👥 {course.studentsEnrolled.toLocaleString()} students enrolled
                    </p>
                  )}

                  {/* BUTTONS */}
                  <div className="flex gap-3 mt-6">
                    <Link
                      to={`/courses/${course.id}`}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all text-center"
                    >
                      {course.isFree ? 'View Course' : 'View Course'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESULTS COUNT */}
        {!loading && (
          <div className="text-center mt-12">
            <p className="text-gray-600">
              Showing <span className="font-bold text-gray-900">{filteredCourses.length}</span> of{' '}
              <span className="font-bold text-gray-900">{courses.length}</span> courses
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
