import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function RefundPolicy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold transition"
        >
          ← Back
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 md:p-12">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center text-2xl">💰</div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Refund &amp; Cancellation Policy</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Civil Services Kendra (CSK)</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Effective From: 01st April 2026</p>
          </div>

          {/* Content */}
          <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-8">
            {/* Intro */}
            <p>
              This Refund Policy ("Policy") applies to all online examination courses, subscriptions, and digital products offered on the Civil Services Kendra platform. This Policy should be read together with the Terms and Conditions, Privacy Policy, and any other policies made available to users on the Civil Services Kendra platform.
            </p>
            <p>
              Any term not defined in this Policy shall have the same meaning as defined in the platform's Terms and Conditions.
            </p>
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4">
              <p className="text-red-800 dark:text-red-300 font-semibold">
                ⚠️ Civil Services Kendra maintains a strict no-refund policy for most online purchases. Payments once made will not be refunded, cancelled, or transferred to another user, except in specific cases mentioned in this policy.
              </p>
              <p className="text-red-700 dark:text-red-400 mt-2">
                Civil Services Kendra shall not be liable to provide refunds for reasons including but not limited to lack of usage, change of preference, or dissatisfaction with course content, educators, or teaching methods.
              </p>
            </div>

            <Section title="1. General No-Refund Policy for Online Courses">
              <p>All online and digital courses offered by Civil Services Kendra are generally non-refundable once purchased.</p>
              <p className="mt-3">Users are strongly advised to carefully review the course details, features, and payment information before completing any purchase, as digital purchases are typically final.</p>
            </Section>

            <Section title="2. Exceptions to the No-Refund Policy">
              <p>Refunds may only be considered in the following exceptional circumstances:</p>
              <div className="mt-4 space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <p className="font-bold text-gray-900 dark:text-white mb-1">Course Not Provided</p>
                  <p>If a user has purchased a course and Civil Services Kendra fails to provide access to the course within the stated timeframe, a refund request may be reviewed.</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <p className="font-bold text-gray-900 dark:text-white mb-1">Duplicate Payment</p>
                  <p>If a duplicate payment or excess payment is made due to a technical issue or payment error, Civil Services Kendra will review the claim and process a refund for the excess amount upon verification.</p>
                </div>
              </div>
            </Section>

            <Section title="3. Course Change or Shift Policy">
              <p>Students may request to change or shift from one course to another, subject to approval by Civil Services Kendra. In such cases:</p>
              <BulletList items={[
                'An administrative charge of at least 25% of the total course fee will be deducted.',
                'The remaining balance will be retained as credit.',
                'This retained balance may only be used for enrolment in another course offered by Civil Services Kendra.',
              ]} />
              <p className="mt-3">All course change requests are subject to review and approval by Civil Services Kendra management.</p>
            </Section>

            <Section title="4. Refund Processing for Duplicate or Extra Payments">
              <p>If Civil Services Kendra receives duplicate or excess payment for a course, the refund for the surplus amount will be processed within <strong>15 days</strong> after verification of valid proof.</p>
              <p className="mt-3">Refunds may be processed through one of the following methods:</p>
              <BulletList items={[
                'Bank transfer (NEFT/online transfer)',
                'Cheque collection by the student or authorized representative',
                'Any other method mutually agreed upon between the student and Civil Services Kendra',
              ]} />
              <p className="mt-3">Civil Services Kendra is not responsible for any delays caused by banking institutions or payment gateways.</p>
            </Section>

            <Section title="5. Payment Errors and Bank Issues">
              <p>Civil Services Kendra is not liable for damages resulting from bank processing errors, payment gateway failures, or incorrect payment details provided by the student.</p>
              <p className="mt-3">Students are advised to first contact their bank or payment provider in case of transaction failures or delays. Civil Services Kendra may assist in resolving such issues where possible, subject to operational limitations.</p>
            </Section>

            <Section title="6. Refund Request Process">
              <p>To request a refund in eligible cases, the user must submit a Refund Request through the official Civil Services Kendra communication channels.</p>
              <p className="mt-3 font-semibold text-gray-900 dark:text-white">Important conditions:</p>
              <BulletList items={[
                'Requests must be sent only from the registered email ID and phone number used during course registration.',
                'Civil Services Kendra may contact the subscriber within 7 business days to verify the request and confirm details.',
              ]} />
              <p className="mt-3">For the purpose of this policy, <strong>"Business Day"</strong> refers to any day excluding Saturdays, Sundays, public holidays, and bank holidays in India.</p>
            </Section>

            <Section title="7. Fraudulent Activity">
              <p>Civil Services Kendra reserves the right to reject or cancel refund requests if fraudulent activity is detected, including but not limited to:</p>
              <BulletList items={[
                'Violation of platform Terms and Conditions',
                'Abuse or misuse of course access',
                'Unauthorized sharing or distribution of course content',
                'Any activity violating applicable laws',
              ]} />
              <p className="mt-3">In such cases, no refund will be processed, and Civil Services Kendra may take further action including account suspension or termination.</p>
            </Section>

            <Section title="8. Contact for Refund Requests">
              <p>For refund-related inquiries, please contact:</p>
              <div className="mt-3 space-y-2">
                <ContactItem icon="✉️" label="Email" value="civilserviceskendra@gmail.com" href="mailto:civilserviceskendra@gmail.com" />
                <ContactItem icon="💬" label="WhatsApp" value="+91 8050713535" href="https://wa.me/918050713535" />
              </div>
            </Section>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-8">
          © 2026 CSK - Civil Services Kendra. All rights reserved.
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-indigo-500 pl-5">
      <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">{title}</h2>
      <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5 list-none">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-indigo-500 mt-0.5 flex-shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ContactItem({ icon, label, value, href }: { icon: string; label: string; value: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
      <span>{icon}</span>
      <span className="text-gray-600 dark:text-gray-400 font-normal">{label}:</span>
      <span>{value}</span>
    </a>
  )
}
