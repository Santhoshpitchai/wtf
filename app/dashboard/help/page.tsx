'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, Phone, Book, Users, FileText, DollarSign, Calendar, BarChart } from 'lucide-react'

export default function HelpPage() {
  const [userRole, setUserRole] = useState<'admin' | 'pt'>('admin')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (userData) {
          setUserRole(userData.role as 'admin' | 'pt')
        }
      }
      setLoading(false)
    }
    getUserRole()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
        <p className="text-gray-600">
          {userRole === 'admin' 
            ? 'Complete guide for administrators to manage the WTF Fitness platform' 
            : 'Guide for personal trainers to manage clients and sessions'}
        </p>
      </div>

      {/* Contact Support Section */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="text-cyan-600" />
          Need Help? Contact Dscape Support
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="text-cyan-600" size={20} />
            <div>
              <p className="text-sm font-semibold text-gray-700">Email Support</p>
              <a href="mailto:info@dscape.co" className="text-cyan-600 hover:text-cyan-700 font-medium">
                info@dscape.co
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="text-cyan-600" size={20} />
            <div>
              <p className="text-sm font-semibold text-gray-700">Phone Support</p>
              <a href="tel:+919945299618" className="text-cyan-600 hover:text-cyan-700 font-medium">
                +91 99452 99618
              </a>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          <strong>Support Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST
        </p>
      </div>

      {/* Role-Specific Guides */}
      {userRole === 'admin' ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Administrator Guide</h2>
          
          {/* Client Management */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="text-cyan-600" />
              Client Management
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Add New Client:</strong> Navigate to Clients → Click "Add Client" → Fill in details</li>
              <li>• <strong>Assign Trainer:</strong> Select a client → Choose trainer from dropdown</li>
              <li>• <strong>View Client Details:</strong> Click on any client to see full profile and history</li>
              <li>• <strong>Edit Client Info:</strong> Click edit icon next to client name</li>
              <li>• <strong>Delete Client:</strong> Use delete option (requires confirmation)</li>
            </ul>
          </div>

          {/* Trainer Management */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="text-cyan-600" />
              Trainer Management
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Add New Trainer:</strong> Go to Trainers → Click "Create PT" → Enter email and details</li>
              <li>• <strong>View All Trainers:</strong> Navigate to Trainers page to see all PTs</li>
              <li>• <strong>Activate/Deactivate:</strong> Toggle trainer status as needed</li>
              <li>• <strong>Assign Clients:</strong> Trainers can be assigned multiple clients</li>
            </ul>
          </div>

          {/* Session Management */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="text-cyan-600" />
              Session Management
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>View All Sessions:</strong> Sessions page shows all scheduled sessions</li>
              <li>• <strong>Start Session:</strong> Click "Start Session" → Select client and trainer</li>
              <li>• <strong>Session Verification:</strong> Clients receive email/SMS to confirm attendance</li>
              <li>• <strong>Track Attendance:</strong> View confirmed vs pending sessions</li>
            </ul>
          </div>

          {/* Invoice & Payments */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="text-cyan-600" />
              Invoices & Payments
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Create Invoice:</strong> Invoices → "Create Invoice" → Select client and amount</li>
              <li>• <strong>Track Payments:</strong> View paid, pending, and overdue invoices</li>
              <li>• <strong>Send Reminders:</strong> Resend invoice emails to clients</li>
              <li>• <strong>Payment Methods:</strong> Record cash, card, or online payments</li>
            </ul>
          </div>

          {/* Reports & Analytics */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart className="text-cyan-600" />
              Reports & Analytics
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Sales Dashboard:</strong> View revenue, sessions, and client metrics</li>
              <li>• <strong>Filter by Date:</strong> Use date range picker to view specific periods</li>
              <li>• <strong>Export Data:</strong> Download reports for accounting purposes</li>
              <li>• <strong>Trainer Performance:</strong> Track individual trainer metrics</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Personal Trainer Guide</h2>
          
          {/* My Clients */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="text-cyan-600" />
              Managing Your Clients
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>View Your Clients:</strong> Clients page shows only clients assigned to you</li>
              <li>• <strong>Client Details:</strong> Click on client to see profile and session history</li>
              <li>• <strong>Add Notes:</strong> Keep track of client progress and goals</li>
              <li>• <strong>Contact Clients:</strong> Email and phone details available in profile</li>
            </ul>
          </div>

          {/* Sessions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="text-cyan-600" />
              Session Management
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Start Session:</strong> Click "Start Session" → Select your client</li>
              <li>• <strong>Session Verification:</strong> Client receives confirmation request</li>
              <li>• <strong>View Schedule:</strong> See all your upcoming and past sessions</li>
              <li>• <strong>Track Attendance:</strong> Monitor client attendance rates</li>
            </ul>
          </div>

          {/* Invoices */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="text-cyan-600" />
              Your Invoices
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>View Invoices:</strong> See invoices for your clients only</li>
              <li>• <strong>Track Payments:</strong> Monitor which clients have paid</li>
              <li>• <strong>Payment Status:</strong> View pending and completed payments</li>
            </ul>
          </div>

          {/* Performance */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart className="text-cyan-600" />
              Your Performance
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Dashboard Stats:</strong> View your client count and session metrics</li>
              <li>• <strong>Monthly Revenue:</strong> Track your earnings</li>
              <li>• <strong>Session Count:</strong> Monitor your training activity</li>
            </ul>
          </div>
        </div>
      )}

      {/* Common Issues */}
      <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Book className="text-cyan-600" />
          Common Issues & Solutions
        </h3>
        <div className="space-y-3 text-gray-700">
          <div>
            <p className="font-semibold">Can't log in?</p>
            <p className="text-sm">Use "Forgot Password" link on login page or contact support</p>
          </div>
          <div>
            <p className="font-semibold">Email not received?</p>
            <p className="text-sm">Check spam folder or verify email address is correct</p>
          </div>
          <div>
            <p className="font-semibold">Data not updating?</p>
            <p className="text-sm">Click the refresh button in the footer or reload the page</p>
          </div>
          <div>
            <p className="font-semibold">Need a feature?</p>
            <p className="text-sm">Contact Dscape support with your suggestions</p>
          </div>
        </div>
      </div>
    </div>
  )
}
