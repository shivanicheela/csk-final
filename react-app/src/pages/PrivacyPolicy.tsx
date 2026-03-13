import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicy() {
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
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center text-2xl">🔒</div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Privacy Policy</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Civil Services Kendra (CSK)</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Effective From: 01st April 2026</p>
          </div>

          {/* Intro */}
          <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-8">
            <p>
              This Privacy Policy applies to all users accessing the Civil Services Kendra platform and its associated services. By using our platform, website, application, or services, users consent to the terms outlined in this policy.
            </p>
            <p>
              Civil Services Kendra is committed to protecting the privacy of its users and safeguarding their personal information. This policy explains how we collect, use, store, and protect the information provided by users.
            </p>

            {/* Section 1 */}
            <Section title="1. Usage and Retention of Information">
              <p>We collect the information that you provide when you access, register, or use the Civil Services Kendra Application, Website, Online Courses, Services, or Products. This information may include:</p>
              <BulletList items={['Name','Age','Email address','Phone number','Educational interests','Exam preparation preferences','Transaction and payment-related information']} />
              <p className="mt-3">Information collected may fall under categories such as Personal Information, Sensitive Personal Information, or Associated Information as defined under the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011. Collectively, this information will be referred to as "Information."</p>
              <p className="mt-3">We may use this Information for purposes including:</p>
              <BulletList items={[
                'Providing educational services and exam preparation resources',
                'Communicating with users about courses, programs, and updates',
                'Sending important notifications or announcements',
                'Providing customer support',
                'Preventing fraud or misuse of the platform',
                'Improving our services, platform performance, and learning experience',
                'Personalizing recommendations, courses, and study materials',
                'Sending promotional offers, surveys, and educational updates',
              ]} />
            </Section>

            {/* Section 2 */}
            <Section title="2. Cookies">
              <p>Civil Services Kendra may use cookies and similar technologies to:</p>
              <BulletList items={['Track user preferences','Enable faster login and navigation','Analyse platform usage','Improve user experience']} />
              <p className="mt-3">Users can disable cookies through browser settings. However, certain features of the platform may not function properly without cookies.</p>
            </Section>

            {/* Section 3 */}
            <Section title="3. Sharing and Disclosure of Information">
              <p>Civil Services Kendra may engage trusted third-party service providers to support services such as:</p>
              <BulletList items={['Payment processing','Technical support','Email communication','Platform hosting and analytics']} />
              <p className="mt-3">These service providers are authorized to use the information only for service-related purposes and are required to maintain confidentiality.</p>
              <p className="mt-3">Civil Services Kendra does not sell, trade, or rent personal information to third parties for marketing purposes without user consent.</p>
              <p className="mt-3">Information may be disclosed if required by law, legal processes, or government authorities.</p>
            </Section>

            {/* Section 4 */}
            <Section title="4. Information Security">
              <p>Civil Services Kendra takes reasonable security measures to protect user information. Personal information is stored on secure servers protected by industry-standard safeguards.</p>
              <p className="mt-3">While we strive to protect all data, users acknowledge that no digital system is completely secure, and we cannot guarantee absolute protection from unauthorized access or breaches.</p>
            </Section>

            {/* Section 5 */}
            <Section title="5. Public Forums">
              <p>Civil Services Kendra may provide features such as:</p>
              <BulletList items={['Discussion forums','Community groups','Comment sections']} />
              <p className="mt-3">Information shared in these public areas may become visible to other users. Users are advised to exercise caution before sharing personal details in such forums.</p>
            </Section>

            {/* Section 6 */}
            <Section title="6. Consent">
              <p>By registering or using Civil Services Kendra services, you consent to the collection, storage, and processing of your information as described in this Privacy Policy.</p>
              <p className="mt-3">If the user is a minor, consent is deemed to have been provided by their parent or legal guardian.</p>
            </Section>

            {/* Section 7 */}
            <Section title="7. Updates to This Policy">
              <p>Civil Services Kendra reserves the right to update or modify this Privacy Policy from time to time.</p>
              <p className="mt-3">Any changes will be posted on the platform, and continued use of the services after such updates will constitute acceptance of the revised policy.</p>
            </Section>

            {/* Section 8 */}
            <Section title="8. Limitation of Liability">
              <p>Civil Services Kendra is not responsible for user-generated content posted on the platform.</p>
              <p className="mt-3">Under no circumstances shall Civil Services Kendra or its affiliates be liable for any damages arising from the use or inability to use the platform or its services.</p>
            </Section>

            {/* Section 9 */}
            <Section title="9. Refund Policy">
              <p>All purchases made on Civil Services Kendra are generally non-refundable.</p>
              <p className="mt-3">Refunds may be considered only in exceptional cases such as:</p>
              <BulletList items={['Damaged or incorrect physical products','Technical errors in transactions']} />
              <p className="mt-3">Requests related to refunds or account concerns may be submitted through customer support.</p>
            </Section>

            {/* Section 10 */}
            <Section title="10. Account Deletion">
              <p>Users may request deletion of their account by sending an email to the official Civil Services Kendra support email.</p>
              <p className="mt-3">Upon verification, the account and associated data will be deleted within 96 hours.</p>
            </Section>

            {/* Section 11 */}
            <Section title="11. Contact Us">
              <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us through:</p>
              <div className="mt-3 space-y-2">
                <ContactItem icon="💬" label="WhatsApp" value="+91 8050713535" href="https://wa.me/918050713535" />
                <ContactItem icon="✉️" label="Email" value="civilserviceskendra@gmail.com" href="mailto:civilserviceskendra@gmail.com" />
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
