'use client'

import Link from 'next/link'
import { HelpCircle, Shield, FileText, Mail, Phone } from 'lucide-react'

interface DashboardFooterProps {
  userRole: 'admin' | 'pt'
}

export default function DashboardFooter({ userRole }: DashboardFooterProps) {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard/help"
                  className="text-sm text-gray-600 hover:text-cyan-600 transition-colors flex items-center gap-2"
                >
                  <HelpCircle size={14} />
                  Help & Support
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/privacy"
                  className="text-sm text-gray-600 hover:text-cyan-600 transition-colors flex items-center gap-2"
                >
                  <Shield size={14} />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/terms"
                  className="text-sm text-gray-600 hover:text-cyan-600 transition-colors flex items-center gap-2"
                >
                  <FileText size={14} />
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Us</h3>
            <ul className="space-y-2">
              <li className="text-sm text-gray-600 flex items-center gap-2">
                <Mail size={14} />
                <a
                  href="mailto:info@dscape.co"
                  className="hover:text-cyan-600 transition-colors"
                >
                  info@dscape.co
                </a>
              </li>
              <li className="text-sm text-gray-600 flex items-center gap-2">
                <Phone size={14} />
                <a
                  href="tel:+919945299618"
                  className="hover:text-cyan-600 transition-colors"
                >
                  +91 99452 99618
                </a>
              </li>
              <li className="text-sm text-gray-600">
                <span className="font-medium">Hours:</span> Mon-Fri, 9AM-6PM IST
              </li>
            </ul>
          </div>

          {/* System Info & Branding */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">System Info</h3>
            <ul className="space-y-2">
              <li className="text-sm text-gray-600">
                <span className="font-medium">Version:</span> 1.2.0
              </li>
              <li className="text-sm text-gray-600">
                <span className="font-medium">Status:</span>{' '}
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Online
                </span>
              </li>
              <li className="text-sm text-gray-600">
                <span className="font-medium">Role:</span>{' '}
                <span className="capitalize font-semibold text-cyan-600">
                  {userRole === 'admin' ? 'Administrator' : 'Personal Trainer'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} WTF - Witness The Fitness. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
