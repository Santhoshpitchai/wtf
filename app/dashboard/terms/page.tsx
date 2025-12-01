'use client'

import { FileText, AlertCircle, CheckCircle, XCircle, Mail } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <FileText className="text-cyan-600" size={36} />
          Terms of Service
        </h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose prose-cyan max-w-none">
        <div className="bg-cyan-50 border-l-4 border-cyan-600 p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>Welcome to WTF - Witness The Fitness!</strong> By using our platform, 
            you agree to these terms. Please read them carefully.
          </p>
        </div>

        <div className="space-y-6">
          {/* Acceptance of Terms */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-600" />
              Acceptance of Terms
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                By accessing and using the WTF Fitness Management System, you accept and agree 
                to be bound by these Terms of Service and our Privacy Policy.
              </p>
              <p>
                If you do not agree to these terms, please do not use our service.
              </p>
            </div>
          </section>

          {/* User Accounts */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">User Accounts</h2>
            <div className="space-y-3 text-gray-700">
              <h3 className="font-semibold">Account Types:</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Administrator:</strong> Full access to manage trainers, clients, sessions, and invoices</li>
                <li><strong>Personal Trainer (PT):</strong> Access to assigned clients and their sessions</li>
              </ul>
              
              <h3 className="font-semibold mt-4">Account Responsibilities:</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must not share your login credentials</li>
                <li>You must notify us immediately of any unauthorized access</li>
                <li>You are responsible for all activities under your account</li>
              </ul>
            </div>
          </section>

          {/* Acceptable Use */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-600" />
              Acceptable Use
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>You agree to use our service only for lawful purposes.</strong></p>
              <p>You may:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Manage client and trainer information</li>
                <li>Schedule and track training sessions</li>
                <li>Generate and manage invoices</li>
                <li>Communicate with clients and trainers</li>
                <li>Access reports and analytics</li>
              </ul>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <XCircle className="text-red-600" />
              Prohibited Activities
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>You must NOT:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Upload malicious code or viruses</li>
                <li>Attempt to gain unauthorized access</li>
                <li>Interfere with service operation</li>
                <li>Scrape or harvest data without permission</li>
                <li>Impersonate others or provide false information</li>
                <li>Use the service for spam or harassment</li>
              </ul>
            </div>
          </section>

          {/* Data & Privacy */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Data & Privacy</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                Your use of our service is also governed by our Privacy Policy. By using our 
                service, you consent to our collection and use of your data as described in 
                the Privacy Policy.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>We store your data securely using industry-standard encryption</li>
                <li>You retain ownership of your data</li>
                <li>You can request data export or deletion at any time</li>
                <li>We comply with applicable data protection laws</li>
              </ul>
            </div>
          </section>

          {/* Payment Terms */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Terms</h2>
            <div className="space-y-3 text-gray-700">
              <h3 className="font-semibold">For Gym Administrators:</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Subscription fees are billed monthly/annually</li>
                <li>Payments must be made on time to maintain service access</li>
                <li>Late payments may result in service suspension</li>
                <li>Refunds are subject to our refund policy</li>
              </ul>
              
              <h3 className="font-semibold mt-4">For Client Invoices:</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Invoices are generated through the platform</li>
                <li>Payment processing is handled by the gym</li>
                <li>We are not responsible for payment disputes between gym and clients</li>
              </ul>
            </div>
          </section>

          {/* Service Availability */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="text-orange-600" />
              Service Availability
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                We strive to provide 99.9% uptime, but we cannot guarantee uninterrupted service.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Scheduled maintenance will be announced in advance</li>
                <li>We are not liable for service interruptions</li>
                <li>We reserve the right to modify or discontinue features</li>
                <li>Critical updates may require temporary downtime</li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                All content, features, and functionality of the WTF Fitness Management System 
                are owned by Dscape and protected by copyright, trademark, and other laws.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>You may not copy, modify, or distribute our software</li>
                <li>The WTF logo and branding are trademarks</li>
                <li>You retain rights to your own data and content</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>The service is provided "as is" without warranties of any kind.</strong>
              </p>
              <p>
                To the maximum extent permitted by law, Dscape shall not be liable for any 
                indirect, incidental, special, or consequential damages arising from your use 
                of the service.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Termination</h2>
            <div className="space-y-3 text-gray-700">
              <p>We may terminate or suspend your account if you:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Violate these Terms of Service</li>
                <li>Fail to pay subscription fees</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Abuse or misuse the service</li>
              </ul>
              <p className="mt-3">
                You may terminate your account at any time by contacting support.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these terms at any time. We will notify users of 
              significant changes via email or platform notification. Continued use of the 
              service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          {/* Governing Law */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700">
              These terms shall be governed by and construed in accordance with the laws of India. 
              Any disputes shall be subject to the exclusive jurisdiction of the courts in 
              Bangalore, Karnataka.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="text-cyan-600" />
              Questions About Terms?
            </h2>
            <p className="text-gray-700 mb-3">
              If you have questions about these terms:
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
