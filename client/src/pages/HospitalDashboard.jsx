import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Search, ClipboardList, Droplets, Phone, MapPin, Clock, CheckCircle, AlertCircle, ShieldAlert, Plus, Radio } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { StatCard, BloodGroupBadge, StatusBadge, Card, PageHeader, Spinner, EmptyState } from '../components/UI';
import { bloodService, emergencyService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const components = ['Whole Blood', 'Packed RBC', 'Platelets', 'Fresh Frozen Plasma', 'Cryoprecipitate'];
const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad'];

const HospitalDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('search');
  const [filters, setFilters] = useState({ bloodGroup: '', city: '', component: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Request modal state (for requesting from a specific blood bank)
  const [requestModal, setRequestModal] = useState(null);
  const [reqForm, setReqForm] = useState({ units: 1, reason: '', notes: '', urgencyLevel: 'normal' });
  const [reqMsg, setReqMsg] = useState({ type: '', text: '' });

  // Broadcast emergency state
  const [emergencyForm, setEmergencyForm] = useState({ patientName: '', bloodGroup: 'O+', units: 1, hospitalName: '', contact: '', emergencyLevel: 'high', additionalNotes: '' });
  const [emergencyMsg, setEmergencyMsg] = useState({ type: '', text: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const reqRes = await bloodService.getRequests();
      setRequests(reqRes.data);

      const emgRes = await emergencyService.getRequests({ hospitalId: user?.id });
      setEmergencyRequests(emgRes.data);

      if (user) {
        setEmergencyForm(prev => ({
          ...prev,
          hospitalName: user.name || '',
          contact: user.phone || ''
        }));
      }
    } catch (err) {
      console.error('Failed to load hospital dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearched(false);
    try {
      const res = await bloodService.search(filters);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
      setSearched(true);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setReqMsg({ type: '', text: '' });

    if (user?.status !== 'verified') {
      return setReqMsg({ type: 'error', text: 'Action denied. Your account is not verified.' });
    }

    if (!reqForm.units || reqForm.units <= 0) {
      return setReqMsg({ type: 'error', text: 'Please enter a valid unit count.' });
    }

    try {
      await bloodService.createRequest({
        bloodBankId: Number(requestModal.blood_bank_id || requestModal.id),
        bloodGroup: requestModal.bloodGroup || requestModal.blood_group,
        component: requestModal.component,
        units: Number(reqForm.units),
        reason: reqForm.reason,
        notes: reqForm.notes,
        urgencyLevel: reqForm.urgencyLevel
      });
      setReqMsg({ type: 'success', text: 'Request submitted successfully!' });
      setReqForm({ units: 1, reason: '', notes: '', urgencyLevel: 'normal' });
      setTimeout(() => setRequestModal(null), 1500);

      // Reload requests tab data
      const reqRes = await bloodService.getRequests();
      setRequests(reqRes.data);

    } catch (err) {
      setReqMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit request.' });
    }
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setEmergencyMsg({ type: '', text: '' });

    if (user?.status !== 'verified') {
      return setEmergencyMsg({ type: 'error', text: 'Action denied. Your account is not verified.' });
    }

    if (!emergencyForm.patientName || !emergencyForm.units || !emergencyForm.contact) {
      return setEmergencyMsg({ type: 'error', text: 'Patient name, units, and contact number are required.' });
    }

    try {
      await emergencyService.createRequest(emergencyForm);
      setEmergencyMsg({ type: 'success', text: 'Emergency request broadcasted to matching nearby donors!' });
      setEmergencyForm(prev => ({
        ...prev,
        patientName: '',
        units: 1,
        additionalNotes: ''
      }));

      // Reload emergency list
      const emgRes = await emergencyService.getRequests({ hospitalId: user?.id });
      setEmergencyRequests(emgRes.data);
    } catch (err) {
      setEmergencyMsg({ type: 'error', text: err.response?.data?.message || 'Failed to broadcast request.' });
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

  const approvedRequests = requests.filter(r => r.status === 'fulfilled');
  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'accepted');
  const unitsReceived = approvedRequests.reduce((sum, r) => sum + r.units, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <PageHeader
          title="Hospital Portal"
          subtitle="Search available blood inventories and manage/broadcast emergency requests."
          icon={Building2}
        />

        {/* Verification Status Warning */}
        {user?.status === 'pending' && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-2xl mb-6 flex items-start gap-3">
            <ShieldAlert className="text-orange-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold">Account Verification Pending</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Your hospital profile is currently awaiting administrator review. Verification is required before you can request inventory or broadcast emergency matching alerts.
              </p>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard icon={ClipboardList} label="Total Requests" value={requests.length} color="blue" />
          <StatCard icon={CheckCircle} label="Fulfilled Requests" value={approvedRequests.length} color="green" />
          <StatCard icon={Clock} label="Pending Requests" value={pendingRequests.length} color="orange" />
          <StatCard icon={Droplets} label="Units Received" value={unitsReceived} color="red" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-8">
          {['search', 'requests', 'emergency'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'search' ? '🔍 Find Blood' : tab === 'requests' ? '📋 My Requests' : '🚨 Emergency Alerts'}
            </button>
          ))}
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="mb-6">
              <h3 className="font-bold text-gray-800 mb-5">Search Network Blood Stocks</h3>
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Blood Group</label>
                  <select
                    value={filters.bloodGroup}
                    onChange={e => setFilters({ ...filters, bloodGroup: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="">All Groups</option>
                    {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Component</label>
                  <select
                    value={filters.component}
                    onChange={e => setFilters({ ...filters, component: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="">All Components</option>
                    {components.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">City</label>
                  <select
                    value={filters.city}
                    onChange={e => setFilters({ ...filters, city: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="">All Cities</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" disabled={searchLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                    {searchLoading ? <Spinner size="sm" /> : <><Search size={16} />Search Stock</>}
                  </button>
                </div>
              </form>
            </Card>

            {searched && (
              <div className="space-y-4">
                {searchResults.length === 0 ? (
                  <EmptyState icon={Droplets} title="No Stock Found" message="Try searching for a different blood group or component." />
                ) : (
                  searchResults.map((item, i) => (
                    <motion.div
                      key={item.id + '-' + item.bloodGroup + '-' + item.component}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                            <Building2 size={22} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">{item.bankName}</h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1"><MapPin size={11} />{item.city}</span>
                              <span className="flex items-center gap-1"><Phone size={11} />{item.contact}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <BloodGroupBadge group={item.bloodGroup} />
                              <span className="text-xs bg-gray-100 font-semibold px-2 py-1 rounded text-gray-600">{item.component}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Available: <span className="font-bold text-gray-700">{item.units} Units</span></p>
                          </div>
                          <button
                            onClick={() => { setRequestModal(item); setReqMsg({ type: '', text: '' }); }}
                            disabled={user?.status !== 'verified'}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
                          >
                            Request Units
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <h3 className="font-bold text-gray-800 mb-5">Track Active Blood Orders</h3>
              {requests.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No Requests Found" message="All orders and inventory requests will appear here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500">
                        <th className="text-left pb-3 pr-4">Order Date</th>
                        <th className="text-left pb-3 pr-4">Blood Bank</th>
                        <th className="text-left pb-3 pr-4">Blood Group</th>
                        <th className="text-left pb-3 pr-4">Component</th>
                        <th className="text-left pb-3 pr-4">Units</th>
                        <th className="text-left pb-3 pr-4">Urgency</th>
                        <th className="text-left pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {requests.map(req => (
                        <tr key={req.id}>
                          <td className="py-3.5 pr-4 text-gray-500">{new Date(req.created_at).toLocaleDateString('en-IN')}</td>
                          <td className="py-3.5 pr-4 font-medium text-gray-800">{req.bankName}</td>
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
                          <td className="py-3.5"><StatusBadge status={req.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Emergency Tab */}
        {activeTab === 'emergency' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Broadcast Emergency Request Form */}
              <div className="lg:col-span-1">
                <Card>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-1.5"><Radio size={18} className="text-red-600 animate-pulse" />Broadcast Emergency</h3>
                  <p className="text-xs text-gray-500 mb-5 leading-normal">
                    This triggers a real-time system alert and Socket.IO notification to all verified matching donors in your city.
                  </p>
                  {emergencyMsg.text && (
                    <div className={`p-3.5 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                      emergencyMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      <AlertCircle size={14} />
                      {emergencyMsg.text}
                    </div>
                  )}
                  <form onSubmit={handleEmergencySubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Patient Full Name</label>
                      <input
                        type="text" value={emergencyForm.patientName} onChange={e => setEmergencyForm({ ...emergencyForm, patientName: e.target.value })} required placeholder="e.g. John Doe"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Blood Group</label>
                        <select
                          value={emergencyForm.bloodGroup} onChange={e => setEmergencyForm({ ...emergencyForm, bloodGroup: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        >
                          {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Units (450ml)</label>
                        <input
                          type="number" min="1" max="10" value={emergencyForm.units} onChange={e => setEmergencyForm({ ...emergencyForm, units: e.target.value })} required
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Urgency Level</label>
                      <select
                        value={emergencyForm.emergencyLevel} onChange={e => setEmergencyForm({ ...emergencyForm, emergencyLevel: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      >
                        <option value="normal">Normal (Routine Transfusion)</option>
                        <option value="high">High (Surgery Backup)</option>
                        <option value="critical">Critical (Immediate Accident Trauma)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Emergency contact number</label>
                      <input
                        type="text" value={emergencyForm.contact} onChange={e => setEmergencyForm({ ...emergencyForm, contact: e.target.value })} required
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Additional Notes</label>
                      <input
                        type="text" value={emergencyForm.additionalNotes} onChange={e => setEmergencyForm({ ...emergencyForm, additionalNotes: e.target.value })} placeholder="Deliver to ICU, Ward 3"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      />
                    </div>
                    <button type="submit" disabled={user?.status !== 'verified'} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm">
                      Broadcast Emergency
                    </button>
                  </form>
                </Card>
              </div>

              {/* My Broadcast History */}
              <div className="lg:col-span-2">
                <Card>
                  <h3 className="font-bold text-gray-800 mb-4">My Emergency notice broadcasts</h3>
                  {emergencyRequests.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-sm text-gray-400">You haven't broadcasted any emergency requests yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {emergencyRequests.map(er => (
                        <div key={er.id} className="p-4 border border-gray-100 bg-gray-50 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                er.emergency_level === 'critical' ? 'bg-red-100 text-red-700' : er.emergency_level === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {er.emergency_level}
                              </span>
                              <span className="text-[11px] text-gray-400">{new Date(er.created_at).toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-bold text-gray-800 text-sm">{er.patient_name} (Patient)</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Need: {er.units} Unit(s) of {er.blood_group} · Contact: {er.contact}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg capitalize">
                            {er.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* Request Modal (Request units from blood bank) */}
        {requestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-xl">
              <h3 className="font-bold text-gray-800 text-lg mb-2">Request Blood Units</h3>
              <p className="text-xs text-gray-500 mb-4">Request inventory allocation from {requestModal.bankName}.</p>

              {reqMsg.text && (
                <div className={`p-3.5 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                  reqMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle size={14} />
                  {reqMsg.text}
                </div>
              )}

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 border border-gray-100 p-3 rounded-xl">
                  <div>
                    <span className="text-xs text-gray-400 block">Blood Group</span>
                    <span className="font-semibold text-gray-800">{requestModal.bloodGroup || requestModal.blood_group}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Component</span>
                    <span className="font-semibold text-gray-800">{requestModal.component}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Units (450ml)</label>
                    <input
                      type="number" min="1" max={requestModal.units} value={reqForm.units} onChange={e => setReqForm({ ...reqForm, units: Number(e.target.value) })} required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Urgency</label>
                    <select
                      value={reqForm.urgencyLevel} onChange={e => setReqForm({ ...reqForm, urgencyLevel: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Reason for Request</label>
                  <input
                    type="text" value={reqForm.reason} onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} placeholder="e.g. Surgery backup"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Additional Notes</label>
                  <input
                    type="text" value={reqForm.notes} onChange={e => setReqForm({ ...reqForm, notes: e.target.value })} placeholder="Deliver before 5 PM"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button" onClick={() => setRequestModal(null)}
                    className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={user?.status !== 'verified'}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Submit Request
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

export default HospitalDashboard;
