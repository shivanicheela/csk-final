import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { enrollUserInCourse } from '../firebase/firestore.ts'

type PaymentMethod = 'upi' | 'netbanking' | 'card'
type PaymentStep = 'details' | 'otp' | 'payment'

export default function Payment() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const state = location.state as { title?: string; price?: string; courseType?: string; courseId?: string } | null
  const title = state?.title || 'CSK Course'
  const price = state?.price || 'Rs. 7,999'
  const courseId = state?.courseId || state?.courseType || 'upsc-prelims'
  const programLabel = courseId.startsWith('tnpsc') ? 'TNPSC' : 'UPSC'

  const [step, setStep] = useState<PaymentStep>('details')
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [upiId, setUpiId] = useState('')
  const [bank, setBank] = useState('')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [details, setDetails] = useState({
    fullName: user?.displayName || '',
    mobile: '',
    email: user?.email || '',
    state: '',
  })
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [otpStatus, setOtpStatus] = useState<'idle' | 'sent' | 'verified'>('idle')
  const [otpError, setOtpError] = useState('')
  const [formError, setFormError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [paid, setPaid] = useState(false)

  useEffect(() => {
    setDetails((current) => ({
      ...current,
      fullName: current.fullName || user?.displayName || '',
      email: current.email || user?.email || '',
    }))
  }, [user])

  const handleDetailsChange = (
    key: 'fullName' | 'mobile' | 'email' | 'state',
    value: string
  ) => {
    setDetails((current) => ({
      ...current,
      [key]: key === 'mobile' ? value.replace(/\D/g, '').slice(0, 10) : value,
    }))
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!details.fullName.trim()) {
      setFormError('Enter full name.')
      return
    }

    if (!/^\d{10}$/.test(details.mobile)) {
      setFormError('Enter a valid 10-digit mobile number.')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(details.email.trim())) {
      setFormError('Enter a valid email address.')
      return
    }

    if (!details.state.trim()) {
      setFormError('Enter your state.')
      return
    }

    setStep('otp')
  }

  const handleSendOtp = () => {
    setOtpError('')
    const nextOtp = String(Math.floor(100000 + Math.random() * 900000))
    setGeneratedOtp(nextOtp)
    setOtp('')
    setOtpStatus('sent')
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()

    if (!generatedOtp) {
      setOtpError('Send OTP first.')
      return
    }

    if (otp !== generatedOtp) {
      setOtpError('Invalid OTP. Check and try again.')
      return
    }

    setOtpError('')
    setOtpStatus('verified')
    setStep('payment')
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    if (otpStatus !== 'verified') {
      setStep('otp')
      return
    }

    setProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await enrollUserInCourse(user.uid, details.email.trim(), courseId, {
        fullName: details.fullName.trim(),
        phone: `+91${details.mobile}`,
        state: details.state.trim(),
        paymentMethod: method || undefined,
        otpVerified: true,
      })
      setPaid(true)
    } catch (err: any) {
      console.error('Enrollment failed:', err)
      alert('Payment processed but enrollment failed. Please contact support.')
    } finally {
      setProcessing(false)
    }
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="text-7xl mb-6">Success</div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-2">You are now enrolled in</p>
          <p className="text-xl font-bold text-indigo-600 mb-6">{title}</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
            <p className="text-green-800 font-semibold">Account activated</p>
            <p className="text-sm text-green-700 mt-1">Access your content from the Dashboard</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-indigo-600 text-white font-black text-lg rounded-xl hover:bg-indigo-700 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 rounded-lg font-semibold">
            Back
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Complete Your Enrollment</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Fill details, verify OTP, then pay securely.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 shadow-sm sticky top-24">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Order Summary</h3>
              <div className="bg-indigo-50 rounded-xl p-4 mb-4">
                <p className="font-bold text-indigo-900">{title}</p>
                <p className="text-sm text-indigo-600 mt-1">{programLabel} Program</p>
              </div>
              <div className="space-y-2 text-sm text-gray-600 border-t pt-4">
                <div className="flex justify-between">
                  <span>Course Fee</span>
                  <span className="font-semibold">{price}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span className="font-semibold">Included</span>
                </div>
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t font-black text-lg">
                <span>Total</span>
                <span className="text-indigo-600">{price}</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <span>Secure</span>
                <span>100% Secure and Encrypted</span>
              </div>
              <div className="mt-6 space-y-2 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                <div className={step === 'details' ? 'font-semibold text-indigo-600' : 'font-semibold'}>1. Fill student details</div>
                <div className={step === 'otp' ? 'font-semibold text-indigo-600' : 'font-semibold'}>2. Verify mobile OTP</div>
                <div className={step === 'payment' ? 'font-semibold text-indigo-600' : 'font-semibold'}>3. Make payment</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
              {step === 'details' && (
                <>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Student Details</h3>
                  <p className="text-sm text-gray-500 mb-6">Admin will receive these details with the enrollment record.</p>
                  <form onSubmit={handleDetailsSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={details.fullName}
                        onChange={(e) => handleDetailsChange('fullName', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={details.mobile}
                          onChange={(e) => handleDetailsChange('mobile', e.target.value)}
                          placeholder="10 digit mobile number"
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                        <input
                          type="text"
                          value={details.state}
                          onChange={(e) => handleDetailsChange('state', e.target.value)}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={details.email}
                        onChange={(e) => handleDetailsChange('email', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    {formError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {formError}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-full py-4 bg-indigo-600 text-white font-black text-lg rounded-xl hover:bg-indigo-700 transition-all"
                    >
                      Enter
                    </button>
                  </form>
                </>
              )}

              {step === 'otp' && (
                <>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Verify Mobile Number</h3>
                  <p className="text-sm text-gray-500 mb-6">Verify +91 {details.mobile} before payment.</p>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-4">
                    OTP verification is added in this flow. Right now it works as a local OTP gate on the payment page.
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all"
                    >
                      {otpStatus === 'sent' ? 'Resend OTP' : 'Send OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      className="px-5 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:border-gray-400 transition-all"
                    >
                      Edit Details
                    </button>
                  </div>
                  {otpStatus === 'sent' && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 mb-4">
                      OTP sent to +91 {details.mobile}. Demo OTP: <span className="font-black">{generatedOtp}</span>
                    </div>
                  )}
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Enter OTP</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6 digit OTP"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600 tracking-[0.3em] text-center text-lg font-bold"
                      />
                    </div>
                    {otpError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {otpError}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-full py-4 bg-indigo-600 text-white font-black text-lg rounded-xl hover:bg-indigo-700 transition-all"
                    >
                      Verify OTP
                    </button>
                  </form>
                </>
              )}

              {step === 'payment' && (
                <>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Select Payment Method</h3>
                  <p className="text-sm text-gray-500 mb-6">Verified for {details.fullName} on +91 {details.mobile}</p>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                      { key: 'upi', label: 'UPI', icon: 'UPI' },
                      { key: 'netbanking', label: 'Net Banking', icon: 'Bank' },
                      { key: 'card', label: 'Card', icon: 'Card' },
                    ].map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setMethod(m.key as PaymentMethod)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-bold transition-all ${
                          method === m.key
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                        }`}
                      >
                        <span className="text-2xl">{m.icon}</span>
                        <span className="text-sm">{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {method === 'upi' && (
                    <form onSubmit={handlePay} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">UPI ID</label>
                        <input
                          type="text"
                          placeholder="yourname@upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600"
                        />
                        <p className="text-xs text-gray-500 mt-1">Example: name@okicici, name@paytm, name@ybl</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                        A payment request will be sent to your UPI app.
                      </div>
                      <PayButton processing={processing} price={price} />
                    </form>
                  )}

                  {method === 'netbanking' && (
                    <form onSubmit={handlePay} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Select Bank</label>
                        <select
                          value={bank}
                          onChange={(e) => setBank(e.target.value)}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600"
                        >
                          <option value="">-- Choose your bank --</option>
                          <option>State Bank of India (SBI)</option>
                          <option>HDFC Bank</option>
                          <option>ICICI Bank</option>
                          <option>Axis Bank</option>
                          <option>Kotak Mahindra Bank</option>
                          <option>Punjab National Bank</option>
                          <option>Bank of Baroda</option>
                          <option>Canara Bank</option>
                          <option>IndusInd Bank</option>
                          <option>Yes Bank</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                        You will be redirected to your bank secure login page.
                      </div>
                      <PayButton processing={processing} price={price} />
                    </form>
                  )}

                  {method === 'card' && (
                    <form onSubmit={handlePay} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          value={card.number}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 16)
                            const formatted = val.replace(/(.{4})/g, '$1 ').trim()
                            setCard({ ...card, number: formatted })
                          }}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="Name on card"
                          value={card.name}
                          onChange={(e) => setCard({ ...card, name: e.target.value })}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            maxLength={5}
                            value={card.expiry}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                              const formatted = val.length > 2 ? `${val.slice(0, 2)}/${val.slice(2)}` : val
                              setCard({ ...card, expiry: formatted })
                            }}
                            required
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">CVV</label>
                          <input
                            type="password"
                            placeholder="***"
                            maxLength={4}
                            value={card.cvv}
                            onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                            required
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600 font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500 items-center">
                        <span>Secured by SSL</span>
                        <span>|</span>
                        <span>Visa / Mastercard / RuPay</span>
                      </div>
                      <PayButton processing={processing} price={price} />
                    </form>
                  )}

                  {!method && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-5xl mb-3">Choose</p>
                      <p className="font-semibold">Select a payment method above</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PayButton({ processing, price }: { processing: boolean; price: string }) {
  return (
    <button
      type="submit"
      disabled={processing}
      className="w-full py-4 bg-indigo-600 text-white font-black text-lg rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
    >
      {processing ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          Processing...
        </>
      ) : (
        <>Pay {price}</>
      )}
    </button>
  )
}
