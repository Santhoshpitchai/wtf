'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Filter, MoreHorizontal, X, Edit2, Users, CheckCircle, Trash2, AlertTriangle } from 'lucide-react'
import type { Trainer, Client } from '@/types'
import ProtectedRoute from '@/components/ProtectedRoute'

interface TrainerWithClients extends Trainer {
  clients: Client[]
  client_count: number
}

function TrainersPageContent() {
  const [trainers, setTrainers] = useState<TrainerWithClients[]>([])
  const [filteredTrainers, setFilteredTrainers] = useState<TrainerWithClients[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showClientsModal, setShowClientsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerWithClients | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    status: 'active' as 'active' | 'inactive'
  })

  useEffect(() => {
    fetchTrainers()
  }, [])

  useEffect(() => {
    if (searchTerm || statusFilter !== 'all') {
      filterTrainers()
    } else {
      setFilteredTrainers(trainers)
    }
  }, [searchTerm, statusFilter, trainers])

  const fetchTrainers = async () => {
    try {
      const { data: trainersData, error } = await supabase
        .from('trainers')
        .select(`
          *,
          clients:clients(id, full_name, email, phone_number, age, gender, status, first_payment, balance)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const trainersWithCount = (trainersData || []).map(trainer => {
        const clients = trainer.clients || []
        const paymentsCollected = clients.reduce((sum: number, client: any) => sum + (client.first_payment || 0), 0)
        const paymentsPending = clients.reduce((sum: number, client: any) => sum + (client.balance || 0), 0)
        
        return {
          ...trainer,
          clients,
          client_count: clients.length,
          payments_collected: paymentsCollected,
          payments_pending: paymentsPending
        }
      })

      setTrainers(trainersWithCount)
      setFilteredTrainers(trainersWithCount)
    } catch (error) {
      console.error('Error fetching trainers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTrainers = () => {
    let filtered = trainers

    if (searchTerm) {
      filtered = filtered.filter(trainer =>
        trainer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(trainer => trainer.status === statusFilter)
    }

    setFilteredTrainers(filtered)
  }

  const handleEditClick = (trainer: TrainerWithClients) => {
    setSelectedTrainer(trainer)
    setEditFormData({
      first_name: trainer.first_name,
      last_name: trainer.last_name,
      email: trainer.email,
      phone_number: trainer.phone_number || '',
      status: trainer.status
    })
    setShowEditModal(true)
  }

  const handleViewClients = (trainer: TrainerWithClients) => {
    setSelectedTrainer(trainer)
    setShowClientsModal(true)
  }

  const handleUpdateTrainer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrainer) return

    setFormLoading(true)
    setFormError('')
    setFormSuccess(false)

    try {
      const { error } = await supabase
        .from('trainers')
        .update({
          first_name: editFormData.first_name,
          last_name: editFormData.last_name,
          email: editFormData.email,
          phone_number: editFormData.phone_number || null,
          status: editFormData.status
        })
        .eq('id', selectedTrainer.id)

      if (error) throw error

      setFormSuccess(true)
      setTimeout(() => {
        setShowEditModal(false)
        setFormSuccess(false)
        fetchTrainers()
      }, 1500)
    } catch (error: any) {
      setFormError(error.message || 'Failed to update trainer')
    } finally {
      setFormLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleDeleteClick = (trainer: TrainerWithClients) => {
    setSelectedTrainer(trainer)
    setShowDeleteModal(true)
    setDeleteError('')
  }

  const handleDeleteTrainer = async () => {
    if (!selectedTrainer) return

    setDeleteLoading(true)
    setDeleteError('')

    try {
      // First, check if trainer has an associated user account
      if (selectedTrainer.user_id) {
        // Delete the user from auth.users (this will cascade to public.users)
        const { error: authError } = await supabase.auth.admin.deleteUser(
          selectedTrainer.user_id
        )
        
        if (authError) {
          // If we don't have admin API access, just delete from public.users
          const { error: userError } = await supabase
            .from('users')
            .delete()
            .eq('id', selectedTrainer.user_id)
          
          if (userError) throw userError
        }
      }

      // Delete the trainer record (this will cascade delete related records)
      const { error: trainerError } = await supabase
        .from('trainers')
        .delete()
        .eq('id', selectedTrainer.id)

      if (trainerError) throw trainerError

      // Success - close modal and refresh
      setShowDeleteModal(false)
      setShowEditModal(false)
      fetchTrainers()
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete trainer')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or others..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter size={20} />
            Filters
          </button>
          {showFilterMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-2">
                <button
                  onClick={() => { setStatusFilter('all'); setShowFilterMenu(false) }}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${statusFilter === 'all' ? 'bg-gray-100' : ''}`}
                >
                  All Status
                </button>
                <button
                  onClick={() => { setStatusFilter('active'); setShowFilterMenu(false) }}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${statusFilter === 'active' ? 'bg-gray-100' : ''}`}
                >
                  Active Only
                </button>
                <button
                  onClick={() => { setStatusFilter('inactive'); setShowFilterMenu(false) }}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${statusFilter === 'inactive' ? 'bg-gray-100' : ''}`}
                >
                  Inactive Only
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left p-4"><input type="checkbox" className="rounded" /></th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Personal Trainer</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">No of Clients</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Payments Collected</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Payments Pending</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Status</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Edit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-gray-500">Loading...</td>
              </tr>
            ) : filteredTrainers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-gray-500">
                  {searchTerm || statusFilter !== 'all' ? 'No trainers match your search' : 'No trainers found'}
                </td>
              </tr>
            ) : (
              filteredTrainers.map((trainer) => (
                <tr key={trainer.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4"><input type="checkbox" className="rounded" /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-600">
                          {trainer.first_name.charAt(0)}{trainer.last_name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900">{trainer.first_name} {trainer.last_name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleViewClients(trainer)}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      <div className="flex -space-x-2">
                        {trainer.clients.slice(0, 4).map((client, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {client.full_name.charAt(0)}
                            </span>
                          </div>
                        ))}
                        {trainer.client_count > 4 && (
                          <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              +{trainer.client_count - 4}
                            </span>
                          </div>
                        )}
                      </div>
                      {trainer.client_count === 0 && (
                        <span className="text-sm text-gray-500">No clients</span>
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-900">₹{trainer.payments_collected?.toFixed(2) || '0.00'}</td>
                  <td className="p-4 text-sm font-medium text-gray-900">₹{trainer.payments_pending?.toFixed(2) || '0.00'}</td>
                  <td className="p-4">
                    <span className={`text-sm ${trainer.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {trainer.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleEditClick(trainer)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Trainer Modal */}
      {showEditModal && selectedTrainer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit2 className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Edit Trainer</h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleUpdateTrainer} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Trainer updated successfully!</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={editFormData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={editFormData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={editFormData.phone_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={editFormData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => handleDeleteClick(selectedTrainer)}
                  className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                  disabled={formLoading}
                >
                  <Trash2 size={18} />
                  Delete
                </button>
                <div className="flex-1 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
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
                    {formLoading ? 'Updating...' : formSuccess ? 'Updated!' : 'Update Trainer'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Clients Modal */}
      {showClientsModal && selectedTrainer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Clients - {selectedTrainer.first_name} {selectedTrainer.last_name}
                  </h2>
                  <p className="text-sm text-gray-600">{selectedTrainer.client_count} total clients</p>
                </div>
              </div>
              <button
                onClick={() => setShowClientsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {selectedTrainer.clients.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No clients assigned to this trainer yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTrainer.clients.map((client: any) => (
                    <div key={client.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              {client.full_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{client.full_name}</h3>
                            <p className="text-sm text-gray-600">{client.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {client.age && <p className="text-sm text-gray-600">Age: {client.age}</p>}
                          {client.gender && <p className="text-sm text-gray-600 capitalize">{client.gender}</p>}
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {client.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        {client.phone_number && (
                          <p className="text-sm text-gray-600">📞 {client.phone_number}</p>
                        )}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Outstanding</p>
                            <p className={`text-sm font-bold ${(client.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ₹{(client.balance || 0).toFixed(2)}
                            </p>
                          </div>
                          {(client.balance || 0) > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              Pending
                            </span>
                          )}
                          {(client.balance || 0) === 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Paid
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTrainer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete Trainer
              </h2>
              
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete <span className="font-semibold">{selectedTrainer.first_name} {selectedTrainer.last_name}</span>?
                {selectedTrainer.client_count > 0 && (
                  <span className="block mt-2 text-red-600 font-medium">
                    ⚠️ This trainer has {selectedTrainer.client_count} client{selectedTrainer.client_count > 1 ? 's' : ''} assigned.
                  </span>
                )}
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. The following will be deleted:
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1 ml-4 list-disc">
                  <li>Trainer profile and account</li>
                  {selectedTrainer.user_id && <li>User login credentials</li>}
                  <li>All associated data</li>
                </ul>
              </div>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTrainer}
                  disabled={deleteLoading}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete Trainer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TrainersPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <TrainersPageContent />
    </ProtectedRoute>
  )
}
