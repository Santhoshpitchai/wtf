'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Filter, Calendar, Plus, X, CheckCircle, User, Edit2 } from 'lucide-react'
import type { Client, Trainer } from '@/types'
import { getCurrentUser } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const itemsPerPage = 10

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    age: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    trainer_id: '',
    first_payment: '',
    payment_mode: '' as 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other' | '',
    balance: '',
    session_type: '' as '1 month' | '3 months' | '6 months' | '12 months' | '',
    status: 'active' as 'active' | 'inactive'
  })

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    const user = await getCurrentUser()
    setCurrentUser(user)
    await fetchClients(user)
    await fetchTrainers(user)
  }

  const fetchClients = async (user: AuthUser | null) => {
    try {
      let query = supabase
        .from('clients')
        .select(`
          *,
          trainer:trainers(first_name, last_name)
        `)
        .order('created_at', { ascending: false })

      // If PT, filter to only show their clients
      // RLS will enforce this, but we add explicit filter for clarity
      if (user?.role === 'pt' && user.trainer_id) {
        query = query.eq('trainer_id', user.trainer_id)
      }

      const { data, error } = await query

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrainers = async (user: AuthUser | null) => {
    try {
      // If PT, only fetch their own trainer record
      // If Admin, fetch all trainers
      let query = supabase
        .from('trainers')
        .select('*')
        .eq('status', 'active')
        .order('first_name')

      if (user?.role === 'pt' && user.trainer_id) {
        query = query.eq('id', user.trainer_id)
      }

      const { data, error } = await query

      if (error) throw error
      setTrainers(data || [])
    } catch (error) {
      console.error('Error fetching trainers:', error)
    }
  }

  const generateClientId = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `CL${timestamp}${random}`
  }

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    setFormSuccess(false)

    try {
      const clientId = generateClientId()
      const firstPayment = formData.first_payment ? parseFloat(formData.first_payment) : 0
      const balance = formData.balance ? parseFloat(formData.balance) : 0
      
      // For PT users, automatically assign to their trainer_id
      let trainerId = formData.trainer_id || null
      if (currentUser?.role === 'pt' && currentUser.trainer_id) {
        trainerId = currentUser.trainer_id
      }
      
      // Insert client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([{
          client_id: clientId,
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number || null,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null,
          trainer_id: trainerId,
          first_payment: firstPayment,
          payment_mode: formData.payment_mode || null,
          balance: balance,
          session_type: formData.session_type || null,
          status: formData.status
        }])
        .select()
        .single()

      if (clientError) throw clientError

      // If there's a first payment, also create a payment record
      if (firstPayment > 0 && clientData) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert([{
            client_id: clientData.id,
            amount_paid: firstPayment,
            amount_pending: balance,
            payment_date: new Date().toISOString(),
            status: formData.status
          }])

        if (paymentError) {
          console.error('Error creating payment record:', paymentError)
          // Don't throw error here, client is already created
        }
      }

      setFormSuccess(true)
      setTimeout(() => {
        setShowAddModal(false)
        setFormSuccess(false)
        setFormData({
          full_name: '',
          email: '',
          phone_number: '',
          age: '',
          gender: '',
          trainer_id: '',
          first_payment: '',
          payment_mode: '',
          balance: '',
          session_type: '',
          status: 'active'
        })
        fetchClients(currentUser)
      }, 2000)
    } catch (error: any) {
      setFormError(error.message || 'Failed to add client')
    } finally {
      setFormLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditClick = (client: Client) => {
    setSelectedClient(client)
    // For PT users, ensure trainer_id is set to their own
    const trainerId = currentUser?.role === 'pt' && currentUser.trainer_id 
      ? currentUser.trainer_id 
      : client.trainer_id || ''
    
    setFormData({
      full_name: client.full_name,
      email: client.email,
      phone_number: client.phone_number || '',
      age: client.age?.toString() || '',
      gender: client.gender || '',
      trainer_id: trainerId,
      first_payment: client.first_payment?.toString() || '',
      payment_mode: client.payment_mode || '',
      balance: client.balance?.toString() || '',
      session_type: client.session_type || '',
      status: client.status
    })
    setShowEditModal(true)
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return

    setFormLoading(true)
    setFormError('')
    setFormSuccess(false)

    try {
      const firstPayment = formData.first_payment ? parseFloat(formData.first_payment) : 0
      const balance = formData.balance ? parseFloat(formData.balance) : 0

      // For PT users, ensure trainer_id stays as their own
      let trainerId = formData.trainer_id || null
      if (currentUser?.role === 'pt' && currentUser.trainer_id) {
        trainerId = currentUser.trainer_id
      }

      // Update client
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number || null,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null,
          trainer_id: trainerId,
          first_payment: firstPayment,
          payment_mode: formData.payment_mode || null,
          balance: balance,
          session_type: formData.session_type || null,
          status: formData.status
        })
        .eq('id', selectedClient.id)

      if (clientError) throw clientError

      // Update payment record if it exists
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('client_id', selectedClient.id)
        .single()

      if (existingPayment && firstPayment > 0) {
        await supabase
          .from('payments')
          .update({
            amount_paid: firstPayment,
            amount_pending: balance,
            status: formData.status
          })
          .eq('client_id', selectedClient.id)
      } else if (!existingPayment && firstPayment > 0) {
        // Create payment record if it doesn't exist
        await supabase
          .from('payments')
          .insert([{
            client_id: selectedClient.id,
            amount_paid: firstPayment,
            amount_pending: balance,
            payment_date: new Date().toISOString(),
            status: formData.status
          }])
      }

      setFormSuccess(true)
      setTimeout(() => {
        setShowEditModal(false)
        setFormSuccess(false)
        setSelectedClient(null)
        fetchClients(currentUser)
      }, 1500)
    } catch (error: any) {
      setFormError(error.message || 'Failed to update client')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredClients = clients.filter(client => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    
    // Date range filter
    let matchesDate = true
    if (dateRange.start && dateRange.end) {
      const clientDate = new Date(client.created_at)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999) // Include the entire end date
      matchesDate = clientDate >= startDate && clientDate <= endDate
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by ID, product, or others..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={20} />
              Filters
              {statusFilter !== 'all' && (
                <span className="ml-1 px-2 py-0.5 bg-teal-500 text-white text-xs rounded-full">1</span>
              )}
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 px-3 py-2">Status</div>
                  <button
                    onClick={() => { setStatusFilter('all'); setShowFilterMenu(false) }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm ${statusFilter === 'all' ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    All Status
                  </button>
                  <button
                    onClick={() => { setStatusFilter('active'); setShowFilterMenu(false) }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm ${statusFilter === 'active' ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => { setStatusFilter('inactive'); setShowFilterMenu(false) }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm ${statusFilter === 'inactive' ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    Inactive Only
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
            <Calendar size={20} />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border-none focus:outline-none text-sm"
              placeholder="Start date"
            />
            <span>-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border-none focus:outline-none text-sm"
              placeholder="End date"
            />
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus size={20} />
          Add Client
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left p-4">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Client ID</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Date</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Full Name</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Age</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Email</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">1st Payment</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Session Type</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center p-8 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paginatedClients.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center p-8 text-gray-500">
                  No clients found
                </td>
              </tr>
            ) : (
              paginatedClients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="p-4">
                    <span className="text-blue-600 font-medium">{client.client_id}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-gray-900">{client.full_name}</td>
                  <td className="p-4 text-sm text-gray-600">{client.age || '-'}</td>
                  <td className="p-4 text-sm text-gray-600">{client.email}</td>
                  <td className="p-4 text-sm text-gray-600">₹{client.first_payment || 0}</td>
                  <td className="p-4 text-sm text-gray-600">{client.session_type || '-'}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleEditClick(client)}
                      className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Edit client"
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show result</span>
            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option>1</option>
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              &lt;
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded ${
                  currentPage === i + 1
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Add New Client
                </h2>
                <p className="text-sm text-gray-600">Fill in the client details below</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              {formError && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-bold text-green-900">Client Added Successfully!</p>
                      <p className="text-sm text-green-700">Refreshing client list...</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Note: PT users will have clients auto-assigned to them */}
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="client@example.com"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="25"
                    min="1"
                    max="120"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Trainer - Only show for Admin */}
                {currentUser?.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Trainer
                    </label>
                    <select
                      name="trainer_id"
                      value={formData.trainer_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    >
                      <option value="">No trainer assigned</option>
                      {trainers.map((trainer) => (
                        <option key={trainer.id} value={trainer.id}>
                          {trainer.first_name} {trainer.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Session Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Type
                  </label>
                  <select
                    name="session_type"
                    value={formData.session_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  >
                    <option value="">Select session type</option>
                    <option value="1 month">1 Month</option>
                    <option value="3 months">3 Months</option>
                    <option value="6 months">6 Months</option>
                    <option value="12 months">12 Months</option>
                  </select>
                </div>

                {/* First Payment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Payment (₹)
                  </label>
                  <input
                    type="number"
                    name="first_payment"
                    value={formData.first_payment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode
                  </label>
                  <select
                    name="payment_mode"
                    value={formData.payment_mode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  >
                    <option value="">Select payment mode</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Balance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Balance
                  </label>
                  <input
                    type="number"
                    name="balance"
                    value={formData.balance}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || formSuccess}
                  className="flex-1 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'Adding...' : formSuccess ? 'Added!' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Client
                </h2>
                <p className="text-sm text-gray-600">Update client details and payment information</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedClient(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateClient} className="p-6 space-y-6">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-bold text-green-900">Client Updated Successfully!</p>
                      <p className="text-sm text-green-700">Refreshing client list...</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="client@example.com"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="25"
                    min="1"
                    max="120"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Trainer - Only show for Admin */}
                {currentUser?.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Trainer
                    </label>
                    <select
                      name="trainer_id"
                      value={formData.trainer_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    >
                      <option value="">No trainer assigned</option>
                      {trainers.map((trainer) => (
                        <option key={trainer.id} value={trainer.id}>
                          {trainer.first_name} {trainer.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Session Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Type
                  </label>
                  <select
                    name="session_type"
                    value={formData.session_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  >
                    <option value="">Select session type</option>
                    <option value="1 month">1 Month</option>
                    <option value="3 months">3 Months</option>
                    <option value="6 months">6 Months</option>
                    <option value="12 months">12 Months</option>
                  </select>
                </div>

                {/* First Payment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Payment (₹)
                  </label>
                  <input
                    type="number"
                    name="first_payment"
                    value={formData.first_payment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode
                  </label>
                  <select
                    name="payment_mode"
                    value={formData.payment_mode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  >
                    <option value="">Select payment mode</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Balance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Balance
                  </label>
                  <input
                    type="number"
                    name="balance"
                    value={formData.balance}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedClient(null)
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || formSuccess}
                  className="flex-1 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'Updating...' : formSuccess ? 'Updated!' : 'Update Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
