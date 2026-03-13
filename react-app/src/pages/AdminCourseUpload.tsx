import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadVideo, uploadPDF, uploadThumbnail, validateFile } from '../firebase/storage.ts';
import { addCourse } from '../firebase/firestore.ts';
import { FOLDER_STRUCTURE } from '../utils/folderStructure.ts';

export default function AdminCourseUpload() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    isFree: false,
    instructor: '',
    duration: '',
    category: '',
  });

  const [files, setFiles] = useState({
    videoFile: null as File | null,
    pdfFile: null as File | null,
    thumbnailFile: null as File | null,
  });

  const [uploadProgress, setUploadProgress] = useState({
    video: 0,
    pdf: 0,
    thumbnail: 0,
  });

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === 'price' ? parseFloat(value) : value,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'video' | 'pdf' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (file) {
      const validationType = fileType === 'video' ? 'video' : fileType === 'pdf' ? 'pdf' : 'image';
      const validation = validateFile(file, validationType);

      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      setFiles({
        ...files,
        [fileType === 'video' ? 'videoFile' : fileType === 'pdf' ? 'pdfFile' : 'thumbnailFile']: file,
      });
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!files.videoFile || !files.pdfFile) {
      setError('Please upload both video and PDF files');
      return;
    }

    const courseId = `course_${Date.now()}`;

    try {
      setUploading(true);

      // Upload video
      const videoURL = await uploadVideo(files.videoFile, courseId, (progress) => {
        setUploadProgress((prev) => ({ ...prev, video: progress }));
      });

      // Upload PDF
      const pdfURL = await uploadPDF(files.pdfFile, courseId, (progress) => {
        setUploadProgress((prev) => ({ ...prev, pdf: progress }));
      });

      // Upload thumbnail (optional)
      let thumbnailURL = 'https://via.placeholder.com/400x300?text=No+Image';
      if (files.thumbnailFile) {
        thumbnailURL = await uploadThumbnail(files.thumbnailFile, courseId, (progress) => {
          setUploadProgress((prev) => ({ ...prev, thumbnail: progress }));
        });
      }

      // Add course to Firestore
      await addCourse({
        title: formData.title,
        description: formData.description,
        price: formData.isFree ? 0 : formData.price,
        isFree: formData.isFree,
        videoUrl: videoURL,
        pdfUrl: pdfURL,
        thumbnail: thumbnailURL,
        instructor: formData.instructor,
        duration: formData.duration,
        category: formData.category,
        studentsEnrolled: 0,
        rating: 0,
      });

      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        price: 0,
        isFree: false,
        instructor: '',
        duration: '',
        category: '',
      });
      setFiles({
        videoFile: null,
        pdfFile: null,
        thumbnailFile: null,
      });
      setUploadProgress({ video: 0, pdf: 0, thumbnail: 0 });

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create course');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold transition"
        >
          ← Back to Admin
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-black text-gray-900 mb-8">📚 Add New Course</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded">
              <p className="text-red-800 font-semibold">Error: {error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-600 rounded">
              <p className="text-green-800 font-semibold">✅ Course created successfully!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Course Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
                placeholder="e.g., UPSC Civil Services Mastery"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
                placeholder="Describe the course..."
              />
            </div>

            {/* Course Type */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isFree"
                  checked={formData.isFree}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="font-bold text-gray-700">Free Course</span>
              </label>
            </div>

            {/* Price (if paid) */}
            {!formData.isFree && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
                  placeholder="e.g., 5999"
                />
              </div>
            )}

            {/* Instructor */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Instructor</label>
              <input
                type="text"
                name="instructor"
                value={formData.instructor}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
                placeholder="e.g., Raj Kumar Singh"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
                placeholder="e.g., 16 weeks"
              />
            </div>

            {/* Category / Folder */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Folder (Exam › Level › Subject)</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
              >
                <option value="">Select Folder</option>
                {Object.entries(FOLDER_STRUCTURE).map(([exam, levels]) =>
                  Object.entries(levels).map(([level, subjects]) =>
                    (subjects as string[]).map((subject) => {
                      const val = `${exam}-${level}-${subject}`
                      return (
                        <option key={val} value={val}>
                          {exam} › {level} › {subject}
                        </option>
                      )
                    })
                  )
                )}
              </select>
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Course Video (MP4) *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-600 hover:bg-indigo-50 transition-all">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, 'video')}
                  className="hidden"
                  id="videoInput"
                  required
                />
                <label htmlFor="videoInput" className="cursor-pointer">
                  <div className="text-4xl mb-2">🎬</div>
                  <p className="font-bold text-gray-700">
                    {files.videoFile ? files.videoFile.name : 'Click to upload video'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Max 500MB</p>
                </label>
              </div>
              {uploadProgress.video > 0 && uploadProgress.video < 100 && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all"
                      style={{ width: `${uploadProgress.video}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{uploadProgress.video.toFixed(0)}%</p>
                </div>
              )}
            </div>

            {/* PDF Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Course PDF *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-600 hover:bg-indigo-50 transition-all">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'pdf')}
                  className="hidden"
                  id="pdfInput"
                  required
                />
                <label htmlFor="pdfInput" className="cursor-pointer">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="font-bold text-gray-700">
                    {files.pdfFile ? files.pdfFile.name : 'Click to upload PDF'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Max 100MB</p>
                </label>
              </div>
              {uploadProgress.pdf > 0 && uploadProgress.pdf < 100 && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all"
                      style={{ width: `${uploadProgress.pdf}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{uploadProgress.pdf.toFixed(0)}%</p>
                </div>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Course Thumbnail (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-600 hover:bg-indigo-50 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'thumbnail')}
                  className="hidden"
                  id="thumbnailInput"
                />
                <label htmlFor="thumbnailInput" className="cursor-pointer">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="font-bold text-gray-700">
                    {files.thumbnailFile ? files.thumbnailFile.name : 'Click to upload image'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Max 10MB</p>
                </label>
              </div>
              {uploadProgress.thumbnail > 0 && uploadProgress.thumbnail < 100 && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all"
                      style={{ width: `${uploadProgress.thumbnail}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{uploadProgress.thumbnail.toFixed(0)}%</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full px-6 py-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? '⏳ Uploading...' : '✅ Create Course'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
