'use client'

import { Shield, Lock, Eye, Database, Mail } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Shield className="text-cyan-600" size={36} />
          Privacy Policy
        </h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose prose-cyan max-w-none">
        <div className="bg-cyan-50 border-l-4 border-cyan-600 p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>WTF - Witness The Fitness</strong> is committed to protecting your privacy. 
            This policy explains how we collect, use, and safeguard your information.
          </p>
        </div>

        <div className="space-y-6">
          {/* Information We Collect */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="text-cyan-600" />
              Information We Collect
            </h2>
            <div className="space-y-3 text-gray-700">
              <div>
                <h3 className="font-semibold">Personal Information:</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Name, email address, and phone number</li>
                  <li>Account credentials (encrypted passwords)</li>
                  <li>Profile information and preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Fitness Data:</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Training session records</li>
                  <li>Client-trainer assignments</li>
                  <li>Session attendance and verification</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Financial Information:</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Invoice and payment records</li>
                  <li>Transaction history</li>
                  <li>Payment method details (securely processed)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="text-cyan-600" />
              How We Use Your Information
            </h2>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>To provide and maintain our fitness management services</li>
              <li>To manage client-trainer relationships and sessions</li>
              <li>To process payments and generate invoices</li>
              <li>To send session confirmations and reminders</li>
              <li>To improve our platform and user experience</li>
              <li>To communicate important updates and support</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="text-cyan-600" />
              Data Security
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                <li><strong>Secure Authentication:</strong> Password hashing and secure session management</li>
                <li><strong>Access Control:</strong> Role-based permissions (Admin/PT)</li>
                <li><strong>Regular Backups:</strong> Automated data backups for disaster recovery</li>
                <li><strong>Secure Infrastructure:</strong> Hosted on Supabase with enterprise-grade security</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Data Sharing & Disclosure</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>We do NOT sell your personal information.</strong></p>
              <p>We may share your information only in these circumstances:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>With Your Trainer:</strong> Clients' information is shared with assigned trainers</li>
                <li><strong>Service Providers:</strong> Email/SMS services for notifications (Resend, Twilio)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect rights</li>
                <li><strong>Business Transfers:</strong> In case of merger or acquisition</li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <div className="space-y-2 text-gray-700">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct your information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Export your data in a standard format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              </ul>
            </div>
          </section>

          {/* Cookies & Tracking */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cookies & Tracking</h2>
            <div className="space-y-2 text-gray-700">
              <p>We use cookies and similar technologies for:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Authentication and session management</li>
                <li>Remembering your preferences</li>
                <li>Analytics to improve our service</li>
              </ul>
              <p className="mt-3">You can control cookies through your browser settings.</p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700">
              Our service is not intended for users under 18 years of age. We do not knowingly 
              collect personal information from children. If you believe we have collected 
              information from a child, please contact us immediately.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this privacy policy from time to time. We will notify you of any 
              changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="text-cyan-600" />
              Contact Us About Privacy
            </h2>
            <p className="text-gray-700 mb-3">
              If you have questions about this privacy policy or your data:
            </p>
            <div className="space-y-2">
              <p className="text-gray-700">
                <strong>Email:</strong>{' '}
                <a href="mailto:info@dscape.co" className="text-cyan-600 hover:text-cyan-700 font-medium">
                  info@dscape.co
                </a>
              </p>
              <p className="text-gray-700">
                <strong>Phone:</strong>{' '}
                <a href="tel:+919945299618" className="text-cyan-600 hover:text-cyan-700 font-medium">
                  +91 99452 99618
                </a>
              </p>
              <p className="text-gray-700">
                <strong>Developer:</strong> Dscape by Santhosh Pitchai
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
