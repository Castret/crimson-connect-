import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, ClipboardList, CheckCircle, Clock, AlertTriangle, Plus, Trash2, Edit2, Heart, Calendar, Users, ShieldAlert, TrendingUp, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { StatCard, BloodGroupBadge, StatusBadge, Card, PageHeader, Spinner, EmptyState } from '../components/UI';
import { bloodService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const components = ['Whole Blood', 'Packed RBC', 'Platelets', 'Fresh Frozen Plasma', 'Cryoprecipitate'];

const BloodBankDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ bloodGroup: 'O+', component: 'Whole Blood', units: 5, collected: '', expiry: '' });
  const [addMsg, setAddMsg] = useState({ type: '', text: '' });

  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ units: '', status: 'available', expiry: '' });
  const [editMsg, setEditMsg] = useState({ type: '', text: '' });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const invRes = await bloodService.getInventory();
      setInventory(invRes.data);

      const reqRes = await bloodService.getRequests();
      setRequests(reqRes.data);

      const apptRes = await bloodService.getAppointments();
      setAppointments(apptRes.data);

      const donorRes = await bloodService.getDonors();
      setDonors(donorRes.data);
    } catch (err) {
      console.error('Failed to load blood bank dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddMsg({ type: '', text: '' });

    if (user?.status !== 'verified') {
      return setAddMsg({ type: 'error', text: 'Action denied. Your account is not verified.' });
    }

    try {
      await bloodService.addInventory({
        bloodGroup: addForm.bloodGroup,
        component: addForm.component,
        units: Number(addForm.units),
        collected: addForm.collected,
        expiry: addForm.expiry
      });
      setAddMsg({ type: 'success', text: 'Inventory unit added successfully!' });
      setAddForm({ bloodGroup: 'O+', component: 'Whole Blood', units: 5, collected: '', expiry: '' });
      
      // Reload inventory
      const invRes = await bloodService.getInventory();
      setInventory(invRes.data);
      setTimeout(() => setShowAddModal(false), 1200);
    } catch (err) {
      setAddMsg({ type: 'error', text: err.response?.data?.message || 'Failed to add inventory.' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditMsg({ type: '', text: '' });

    if (user?.status !== 'verified') {
      return setEditMsg({ type: 'error', text: 'Action denied. Your account is not verified.' });
    }

    try {
      await bloodService.updateInventory(editItem.id, editForm);
      setEditMsg({ type: 'success', text: 'Inventory updated successfully!' });
      
      const invRes = await bloodService.getInventory();
      setInventory(invRes.data);
      setTimeout(() => setEditItem(null), 1200);
    } catch (err) {
      setEditMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update inventory.' });
    }
  };

  const handleDeleteInventory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory record?')) return;
    try {
      await bloodService.deleteInventory(id);
      const invRes = await bloodService.getInventory();
      setInventory(invRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete inventory.');
    }
  };

  const handleRequestResolve = async (id, status) => {
    if (user?.status !== 'verified') {
      return alert('Action denied. Your account is not verified.');
    }
    if (!window.confirm(`Are you sure you want to set status of request to "${status}"?`)) return;
    try {
      await bloodService.updateRequestStatus(id, status);
      const reqRes = await bloodService.getRequests();
      setRequests(reqRes.data);
      const invRes = await bloodService.getInventory();
      setInventory(invRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update request status.');
    }
  };

  const handleAppointmentResolve = async (id, status) => {
    if (user?.status !== 'verified') {
      return alert('Action denied. Your account is not verified.');
    }
    if (!window.confirm(`Are you sure you want to set appointment status to "${status}"?`)) return;
    try {
      await bloodService.updateAppointmentStatus(id, status);
      const apptRes = await bloodService.getAppointments();
      setAppointments(apptRes.data);
      // If completed, reload inventory and donor list
      if (status === 'completed') {
        const invRes = await bloodService.getInventory();
        setInventory(invRes.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update appointment.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center"><Spinner size="lg" /></main>
      </div>
    );
  }

  // Low stock check (total available units per blood group < 5)
  const lowStockAlerts = [];
  bloodGroups.forEach(bg => {
    const total = inventory
      .filter(i => i.blood_group === bg && i.status === 'available')
      .reduce((sum, item) => sum + item.units, 0);
    if (total < 5) {
      lowStockAlerts.push({ group: bg, count: total });
    }
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const totalStockUnits = inventory.filter(i => i.status === 'available').reduce((sum, i) => sum + i.units, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <PageHeader
          title="Blood Bank Console"
          subtitle="Manage blood inventory, verify donor appointments, and resolve hospital orders."
          icon={Package}
        />

        {/* Verification Status Warning */}
        {user?.status === 'pending' && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-2xl mb-6 flex items-start gap-3">
            <ShieldAlert className="text-orange-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold">Account Verification Pending</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Your blood bank profile is awaiting administrator review. You can view logs and dashboard stats, but actions such as modifying inventory or resolving requests are disabled until verified.
              </p>
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && user?.status === 'verified' && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl mb-6 space-y-1 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-500 shrink-0" size={18} />
              <p className="font-bold text-sm">Critical Low Stock Warning</p>
            </div>
            <p className="text-xs text-red-600">
              The following blood groups have dropped below safety thresholds (less than 5 units):
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowStockAlerts.map(alert => (
                <span key={alert.group} className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                  {alert.group} ({alert.count} units)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard icon={Package} label="Total Stock Units" value={totalStockUnits} color="red" />
          <StatCard icon={ClipboardList} label="Incoming Orders" value={pendingRequests.length} color="blue" />
          <StatCard icon={Calendar} label="Pending Visits" value={pendingAppointments.length} color="orange" />
          <StatCard icon={Users} label="Registered Donors" value={donors.length} color="green" />
        </div>

        {/* Stock Levels Chart */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800">Current Blood Stock Levels</h3>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {bloodGroups.map(bg => {
              const total = inventory.filter(i => i.blood_group === bg && i.status === 'available').reduce((s, i) => s + i.units, 0);
              const pct = Math.min((total / 30) * 100, 100);
              return (
                <div key={bg} className="text-center">
                  <div className="relative h-24 bg-gray-100 rounded-xl overflow-hidden mb-2">
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-xl transition-all ${pct > 60 ? 'bg-green-500' : pct > 20 ? 'bg-orange-400' : 'bg-red-500'}`}
                      style={{ height: `${pct}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-800">{total}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-600">{bg}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Tabs Bar */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {['inventory', 'requests', 'appointments', 'donors'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'inventory' ? '📦 Stock Inventory' : tab === 'requests' ? '📋 Hospital Requests' : tab === 'appointments' ? '📅 Appointments' : '👥 Network Donors'}
            </button>
          ))}
        </div>

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-800">Available Inventory Units</h3>
                <button
                  disabled={user?.status !== 'verified'}
                  onClick={() => { setShowAddModal(true); setAddMsg({ type: '', text: '' }); }}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
                >
                  <Plus size={15} />
                  Add Blood Unit
                </button>
              </div>
              {inventory.length === 0 ? (
                <p className="text-sm text-gray-400 py-10 text-center">No inventory records. Click add to register stock.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500 text-left">
                        <th className="pb-3 pr-4">Blood Group</th>
                        <th className="pb-3 pr-4">Component</th>
                        <th className="pb-3 pr-4">Units</th>
                        <th className="pb-3 pr-4">Collected Date</th>
                        <th className="pb-3 pr-4">Expiry Date</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {inventory.map(item => (
                        <tr key={item.id}>
                          <td className="py-3 pr-4"><BloodGroupBadge group={item.blood_group} size="sm" /></td>
                          <td className="py-3 pr-4 font-semibold text-gray-600 text-xs">{item.component}</td>
                          <td className="py-3 pr-4 font-bold text-gray-800">{item.units}</td>
                          <td className="py-3 pr-4 text-xs text-gray-500">{item.collected_date ? new Date(item.collected_date).toLocaleDateString() : '—'}</td>
                          <td className="py-3 pr-4 text-xs text-gray-500">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—'}</td>
                          <td className="py-3 pr-4"><StatusBadge status={item.status} /></td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <button
                                disabled={user?.status !== 'verified'}
                                onClick={() => { setEditItem(item); setEditForm({ units: item.units, status: item.status, expiry: item.expiry_date ? item.expiry_date.substring(0, 10) : '' }); setEditMsg({ type: '', text: '' }); }}
                                className="p-1.5 text-gray-500 hover:text-red-600 transition"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                disabled={user?.status !== 'verified'}
                                onClick={() => handleDeleteInventory(item.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <h3 className="font-bold text-gray-800 mb-5">Hospital Emergency Requests</h3>
              {requests.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No Orders" message="Requests submitted by hospitals will list here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500 text-left">
                        <th className="pb-3 pr-4">Order Date</th>
                        <th className="pb-3 pr-4">Hospital Name</th>
                        <th className="pb-3 pr-4">Blood Group</th>
                        <th className="pb-3 pr-4">Component</th>
                        <th className="pb-3 pr-4">Units Needed</th>
                        <th className="pb-3 pr-4">Urgency</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {requests.map(req => (
                        <tr key={req.id}>
                          <td className="py-3.5 pr-4 text-gray-500">{new Date(req.created_at).toLocaleDateString()}</td>
                          <td className="py-3.5 pr-4 font-semibold text-gray-800">
                            <div>
                              <p>{req.requesterName}</p>
                              <p className="text-[10px] text-gray-400 font-normal">{req.contact}</p>
                            </div>
                          </td>
                          <td className="py-3.5 pr-4"><BloodGroupBadge group={req.blood_group} size="sm" /></td>
                          <td className="py-3.5 pr-4 text-xs font-semibold text-gray-600">{req.component}</td>
                          <td className="py-3.5 pr-4 font-bold">{req.units}</td>
                          <td className="py-3.5 pr-4">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-semibold ${
                              req.urgency_level === 'critical' ? 'bg-red-50 text-red-700' : req.urgency_level === 'high' ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {req.urgency_level}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4"><StatusBadge status={req.status} /></td>
                          <td className="py-3.5">
                            {req.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  disabled={user?.status !== 'verified'}
                                  onClick={() => handleRequestResolve(req.id, 'accepted')}
                                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                                >
                                  Accept
                                </button>
                                <button
                                  disabled={user?.status !== 'verified'}
                                  onClick={() => handleRequestResolve(req.id, 'rejected')}
                                  className="border border-red-200 text-red-600 hover:bg-red-50 disabled:bg-transparent disabled:text-gray-300 font-bold text-xs px-3 py-1.5 rounded-lg transition"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {req.status === 'accepted' && (
                              <button
                                disabled={user?.status !== 'verified'}
                                onClick={() => handleRequestResolve(req.id, 'fulfilled')}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                              >
                                Fulfill Order
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <h3 className="font-bold text-gray-800 mb-5">Incoming Donor Appointments</h3>
              {appointments.length === 0 ? (
                <EmptyState icon={Calendar} title="No Appointments" message="Donor scheduling visits will display here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500 text-left">
                        <th className="pb-3 pr-4">Visit Date</th>
                        <th className="pb-3 pr-4">Donor Name</th>
                        <th className="pb-3 pr-4">Phone</th>
                        <th className="pb-3 pr-4">Blood Group</th>
                        <th className="pb-3 pr-4">Time Slot</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {appointments.map(appt => (
                        <tr key={appt.id}>
                          <td className="py-3.5 pr-4 text-gray-500">{new Date(appt.appointment_date).toLocaleDateString()}</td>
                          <td className="py-3.5 pr-4 font-semibold text-gray-800">{appt.donorName}</td>
                          <td className="py-3.5 pr-4 text-gray-500">{appt.contact || '—'}</td>
                          <td className="py-3.5 pr-4"><BloodGroupBadge group={appt.blood_group} size="sm" /></td>
                          <td className="py-3.5 pr-4 text-xs font-medium text-gray-600">{appt.time_slot}</td>
                          <td className="py-3.5 pr-4"><StatusBadge status={appt.status} /></td>
                          <td className="py-3.5">
                            {appt.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  disabled={user?.status !== 'verified'}
                                  onClick={() => handleAppointmentResolve(appt.id, 'accepted')}
                                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                                >
                                  Accept
                                </button>
                                <button
                                  disabled={user?.status !== 'verified'}
                                  onClick={() => handleAppointmentResolve(appt.id, 'rejected')}
                                  className="border border-red-200 text-red-600 hover:bg-red-50 disabled:bg-transparent disabled:text-gray-300 font-bold text-xs px-3 py-1.5 rounded-lg transition"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {appt.status === 'accepted' && (
                              <button
                                disabled={user?.status !== 'verified'}
                                onClick={() => handleAppointmentResolve(appt.id, 'completed')}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                              >
                                Mark Completed
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Donors List Tab */}
        {activeTab === 'donors' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <h3 className="font-bold text-gray-800 mb-5">Registered Network Donors</h3>
              {donors.length === 0 ? (
                <EmptyState icon={Users} title="No Donors Registered" message="Active matching network donors will appear here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500 text-left">
                        <th className="pb-3 pr-4">Donor Name</th>
                        <th className="pb-3 pr-4">Blood Group</th>
                        <th className="pb-3 pr-4">Phone Number</th>
                        <th className="pb-3 pr-4">Age/Gender</th>
                        <th className="pb-3 pr-4">Location (City)</th>
                        <th className="pb-3">Last Donation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {donors.map(d => (
                        <tr key={d.id}>
                          <td className="py-3.5 pr-4 font-semibold text-gray-800">{d.name}</td>
                          <td className="py-3.5 pr-4"><BloodGroupBadge group={d.blood_group} size="sm" /></td>
                          <td className="py-3.5 pr-4 text-gray-500">{d.phone || '—'}</td>
                          <td className="py-3.5 pr-4 text-gray-500">{d.age ? `${d.age} / ${d.gender || '—'}` : '—'}</td>
                          <td className="py-3.5 pr-4 font-medium text-gray-700">{d.city || '—'}</td>
                          <td className="py-3.5 text-xs text-gray-500">{d.last_donation_date ? new Date(d.last_donation_date).toLocaleDateString() : 'Never logged'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Add Inventory Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-xl">
              <h3 className="font-bold text-gray-800 text-lg mb-2">Register Blood Unit</h3>
              <p className="text-xs text-gray-500 mb-4 font-normal">Add stock items directly to the blood bank inventory.</p>

              {addMsg.text && (
                <div className={`p-3.5 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                  addMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle size={14} />
                  {addMsg.text}
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Blood Group</label>
                    <select
                      value={addForm.bloodGroup} onChange={e => setAddForm({ ...addForm, bloodGroup: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    >
                      {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Component</label>
                    <select
                      value={addForm.component} onChange={e => setAddForm({ ...addForm, component: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    >
                      {components.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Units (450ml)</label>
                    <input
                      type="number" min="1" value={addForm.units} onChange={e => setAddForm({ ...addForm, units: e.target.value })} required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Collected Date</label>
                    <input
                      type="date" value={addForm.collected} max={new Date().toISOString().split('T')[0]} onChange={e => setAddForm({ ...addForm, collected: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry Date</label>
                  <input
                    type="date" min={new Date().toISOString().split('T')[0]} value={addForm.expiry} onChange={e => setAddForm({ ...addForm, expiry: e.target.value })} required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button" onClick={() => setShowAddModal(false)}
                    className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={user?.status !== 'verified'}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Add Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Inventory Modal */}
        {editItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-xl">
              <h3 className="font-bold text-gray-800 text-lg mb-2">Edit Inventory Record</h3>
              <p className="text-xs text-gray-500 mb-4 font-normal">Modify units and availability for this stock allocation.</p>

              {editMsg.text && (
                <div className={`p-3.5 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                  editMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle size={14} />
                  {editMsg.text}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 border border-gray-100 p-3 rounded-xl">
                  <div>
                    <span className="text-xs text-gray-400 block">Blood Group</span>
                    <span className="font-semibold text-gray-800">{editItem.blood_group}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Component</span>
                    <span className="font-semibold text-gray-800">{editItem.component}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Units (450ml)</label>
                    <input
                      type="number" min="0" value={editForm.units} onChange={e => setEditForm({ ...editForm, units: Number(e.target.value) })} required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                    <select
                      value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    >
                      <option value="available">Available</option>
                      <option value="expired">Expired</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry Date</label>
                  <input
                    type="date" value={editForm.expiry} onChange={e => setEditForm({ ...editForm, expiry: e.target.value })} required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button" onClick={() => setEditItem(null)}
                    className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={user?.status !== 'verified'}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BloodBankDashboard;
