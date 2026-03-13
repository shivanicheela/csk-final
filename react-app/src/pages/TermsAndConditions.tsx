import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function TermsAndConditions() {
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
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center text-2xl">📄</div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Terms of Use</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Civil Services Kendra (CSK)</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Effective From: 01st April 2026</p>
          </div>

          <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-8">
            <p>
              By accessing or using the Civil Services Kendra website, application, courses, or services, you acknowledge that you have read, understood, and agree to be bound by the following Terms of Use without limitation or qualification. Please read these terms carefully before using the platform.
            </p>
            <p>
              Civil Services Kendra reserves the right to modify or update these terms at any time by updating this page. Users are responsible for reviewing this page periodically to remain aware of the current terms and conditions. Continued use of the platform after changes indicates your acceptance of the updated terms.
            </p>

            <Section title="1. Disclaimers">
              <p>To the fullest extent permissible under applicable law, all materials, courses, content, and services provided on the Civil Services Kendra platform are offered "as is" and "as available" without warranties of any kind, either express or implied.</p>
              <p className="mt-3">Civil Services Kendra and its affiliates disclaim all warranties including, but not limited to:</p>
              <BulletList items={[
                'Implied warranties of merchantability',
                'Fitness for a particular purpose',
                'Accuracy, reliability, or completeness of educational content',
              ]} />
              <p className="mt-3">Civil Services Kendra does not guarantee that:</p>
              <BulletList items={[
                'The platform will operate without interruptions or errors',
                'Any defects will be corrected immediately',
                'The website, servers, or services are free from viruses or harmful components',
              ]} />
              <p className="mt-3">Users assume full responsibility for any costs related to system servicing, repair, or corrections arising from the use of this platform. Educational materials provided are intended only for learning purposes and do not guarantee success in any examination including Civil Services or other competitive exams.</p>
            </Section>

            <Section title="2. Limitation of Liability">
              <p>Civil Services Kendra makes reasonable efforts to ensure that information on the platform is accurate and up to date, but errors or omissions may occur.</p>
              <p className="mt-3">Under no circumstances shall Civil Services Kendra, its affiliates, partners, employees, or service providers be liable for:</p>
              <BulletList items={[
                'Direct damages',
                'Indirect damages',
                'Incidental damages',
                'Consequential damages',
                'Punitive damages',
              ]} />
              <p className="mt-3">arising from:</p>
              <BulletList items={[
                'The use of the website or services',
                'Inability to access the platform',
                'Errors in educational materials',
                'Technical issues or interruptions',
              ]} />
              <p className="mt-3">This applies even if Civil Services Kendra has been advised of the possibility of such damages.</p>
            </Section>

            <Section title="3. Restrictions on Use of Materials">
              <p>All content on the Civil Services Kendra platform, including but not limited to:</p>
              <BulletList items={['Study materials','Video lectures','PDFs and notes','Graphics and design','Website content']} />
              <p className="mt-3">is the intellectual property of Civil Services Kendra unless otherwise stated.</p>
              <p className="mt-3">Except with prior written permission, users may not:</p>
              <BulletList items={['Copy','Reproduce','Republish','Upload','Post','Transmit','Distribute','Sell or commercially use any content from the platform']} />
              <p className="mt-3">Unauthorized distribution of paid course content may result in account suspension or legal action.</p>
            </Section>

            <Section title="4. Jurisdictional Issues">
              <p>Civil Services Kendra operates primarily within India. We make no representation that the materials or services on this website are appropriate or available for use outside India.</p>
              <p className="mt-3">Users who access the platform from other locations do so at their own risk and are responsible for compliance with local laws.</p>
              <p className="mt-3">All disputes arising from the use of this platform shall be subject to the jurisdiction of the courts in India.</p>
            </Section>

            <Section title="5. Trademarks and Copyrights">
              <p>All trademarks, logos, service marks, brand names, and content displayed on the Civil Services Kendra platform are the exclusive property of Civil Services Kendra.</p>
              <p className="mt-3">Nothing contained on this website should be interpreted as granting any license or right to use any trademark or copyrighted material without prior written consent.</p>
            </Section>

            <Section title="6. Software and Platform Usage">
              <p>Any software, digital platform, mobile applications, or learning tools provided through Civil Services Kendra may contain technology subject to Indian laws and regulations.</p>
              <p className="mt-3">Users agree not to misuse, reverse engineer, copy, or exploit any software or platform features.</p>
            </Section>

            <Section title="7. Consent for Communication">
              <p>By registering, signing up, or submitting forms on the Civil Services Kendra website or platform, you consent to receive communications including:</p>
              <BulletList items={['Phone calls','SMS messages','WhatsApp messages','Emails','Notifications']} />
              <p className="mt-3">These communications may include:</p>
              <BulletList items={['Course updates','Educational information','Promotional offers','Important service announcements']} />
              <p className="mt-3">Such communications may be sent through third-party communication platforms used by Civil Services Kendra. Users may opt out of promotional communications where applicable.</p>
            </Section>

            <Section title="8. Termination of Access">
              <p>Civil Services Kendra reserves the right to suspend or terminate user access to the platform if:</p>
              <BulletList items={['The user violates these terms','Content is misused or distributed illegally','Fraudulent activities are detected']} />
              <p className="mt-3">Termination may occur without prior notice.</p>
            </Section>

            <Section title="9. Governing Law">
              <p>These Terms of Use shall be governed by and interpreted in accordance with the laws of India.</p>
              <p className="mt-3">Any legal disputes shall fall under the jurisdiction of the competent courts in India.</p>
            </Section>

            <Section title="10. Contact Information">
              <p>For questions regarding these Terms of Use, please contact:</p>
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
