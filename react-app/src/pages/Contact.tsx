import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'

export default function Contact(){
  const navigate = useNavigate()
  const [formData, setFormData] = useState({name: '', email: '', phone: '', subject: '', message: ''})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: any) => {
    setFormData({...formData, [e.target.name]: e.target.value})
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    // Reset form after submission
    setFormData({name: '', email: '', phone: '', subject: '', message: ''})
  }

  const contactMethods = [
    {
      emoji: '📞',
      title: 'Phone',
      value: '+91 8050713535',
      desc: 'Working Hours: 10 AM to 6 PM',
      href: 'tel:+918050713535',
      color: 'text-indigo-600',
    },
    {
      emoji: '✉️',
      title: 'Email',
      value: 'civilserviceskendra@gmail.com',
      desc: 'We reply within 24 hours',
      href: 'mailto:civilserviceskendra@gmail.com',
      color: 'text-indigo-600',
    },
    {
      emoji: '💬',
      title: 'WhatsApp',
      value: '+91 8050713535',
      desc: 'Available 24×7',
      href: 'https://wa.me/918050713535',
      color: 'text-blue-500',
    },
    {
      emoji: '✈️',
      title: 'Telegram Channel',
      value: 't.me/civilserviceskendra',
      desc: 'Ask your co-Aspirants for their suggestions.',
      href: 'https://t.me/civilserviceskendra',
      color: 'text-blue-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
      {/* Back Button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 rounded-lg transition-all font-semibold"
          >
            ← Back
          </button>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 py-16 md:py-20 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black">Get in Touch</h1>
          <p className="mt-4 text-xl text-indigo-100">Have questions? We're here to help you succeed in your civil services journey</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-8">Send us a Message</h2>

            {submitted ? (
              <div className="space-y-6 p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl text-center">
                <div className="text-6xl">✓</div>
                <h3 className="text-2xl font-black text-green-700">Thank You!</h3>
                <p className="text-lg text-green-600">Your message has been sent successfully.</p>
                <p className="text-gray-700">We'll review your inquiry and get back to you within 24 hours at the email you provided.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2">Full Name</label>
                    <input
                      type="text" name="name" value={formData.name} onChange={handleChange} required
                      className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-3 focus:border-indigo-600 focus:outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2">Phone</label>
                    <input
                      type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                      className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-3 focus:border-indigo-600 focus:outline-none transition-all"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2">Email Address</label>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange} required
                    className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-3 focus:border-indigo-600 focus:outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2">Subject</label>
                  <select
                    name="subject" value={formData.subject} onChange={handleChange} required
                    className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-3 focus:border-indigo-600 focus:outline-none transition-all"
                  >
                    <option value="">Select a subject</option>
                    <option value="enrollment">Enrollment Inquiry</option>
                    <option value="technical">Technical Issue</option>
                    <option value="payment">Payment Related</option>
                    <option value="demo">Schedule a Demo Class</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2">Message</label>
                  <textarea
                    name="message" value={formData.message} onChange={handleChange} required
                    className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-3 focus:border-indigo-600 focus:outline-none transition-all resize-none"
                    rows={6} placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>

                <button type="submit" className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg rounded-lg hover:shadow-lg transition-all transform hover:scale-105">
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-8">Get Help Now</h2>

            <div className="space-y-6 mb-12">
              {contactMethods.map((method, idx) => (
                <a
                  key={idx}
                  href={method.href}
                  target={method.href.startsWith('http') ? '_blank' : undefined}
                  rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="block bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all hover:border-indigo-300 no-underline"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{method.emoji}</div>
                    <div>
                      <h3 className="font-black text-gray-900 dark:text-white">{method.title}</h3>
                      <p className={`text-lg font-bold mt-1 ${method.color}`}>{method.value}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{method.desc}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-8 text-white text-center">
          <h3 className="text-3xl font-black mb-4">🌐 100% Online Learning Platform</h3>
          <p className="text-xl text-indigo-100 mb-4">Access quality education from anywhere, anytime!</p>
          <p className="text-indigo-100">We're a fully online platform dedicated to providing you with the best civil services preparation resources.</p>
        </div>
      </div>
    </div>
  )
}
