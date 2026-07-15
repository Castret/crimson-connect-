import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Droplet, Calendar, Clock, Award, ChevronRight, User, AlertCircle, MapPin, Phone, CheckCircle, Plus } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { StatCard, BloodGroupBadge, StatusBadge, Card, PageHeader, Spinner } from '../components/UI';
import api, { profileService, bloodService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DonorDashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [matchingRequests, setMatchingRequests] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Availability state
  const [isAvailable, setIsAvailable] = useState(true);

  // Edit profile state
  const [editForm, setEditForm] = useState({
    name: '', phone: '', age: '', gender: '', address: '', city: '', state: '', bloodGroup: '', lastDonationDate: '', bio: ''
  });
  const [editMsg, setEditMsg] = useState({ type: '', text: '' });

  // Schedule appointment state
  const [schedForm, setSchedForm] = useState({ bloodBankId: '', appointmentDate: '', timeSlot: '09:00 AM – 10:00 AM' });
  const [schedMsg, setSchedMsg] = useState({ type: '', text: '' });

  // Manual history log state
  const [historyForm, setHistoryForm] = useState({ bankName: '', donationDate: '', units: '1', notes: '' });
  const [historyMsg, setHistoryMsg] = useState({ type: '', text: '' });

  // Emergency request modal
  const [activeRequest, setActiveRequest] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch profile
      const profRes = await profileService.getCurrent();
      setProfile(profRes.data);
      setIsAvailable(!!profRes.data.is_available);
      setEditForm({
        name: profRes.data.name || '',
        phone: profRes.data.phone || '',
        age: profRes.data.age || '',
        gender: profRes.data.gender || '',
        address: profRes.data.address || '',
        city: profRes.data.city || '',
        state: profRes.data.state || '',
        bloodGroup: profRes.data.blood_group || '',
        lastDonationDate: profRes.data.last_donation_date ? profRes.data.last_donation_date.substring(0, 10) : '',
        bio: profRes.data.bio || ''
      });

      // Fetch appointments
      const apptRes = await bloodService.getAppointments();
      setAppointments(apptRes.data);

      // Fetch matching emergency requests
      const matchRes = await bloodService.getMatchingRequests();
      setMatchingRequests(matchRes.data);

      // Fetch manual donation history
      const historyRes = await bloodService.getDonationHistory();
      setDonationHistory(historyRes.data);

      // Fetch blood banks for scheduling
      const bbRes = await bloodService.getBloodbanks();
      setBloodBanks(bbRes.data);
      if (bbRes.data.length > 0) {
        setSchedForm(prev => ({ ...prev, bloodBankId: bbRes.data[0].id.toString() }));
      }

    } catch (err) {
      console.error('Failed to load donor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProfileUpdateSubmit = async (e) => {
    e.preventDefault();
    setEditMsg({ type: '', text: '' });
    try {
      const res = await profileService.update(editForm);
      setProfile(res.data.profile);
      setUser({ ...user, ...res.data.profile });
      localStorage.setItem('cc_user', JSON.stringify({ ...user, ...res.data.profile }));
      setEditMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setEditMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setSchedMsg({ type: '', text: '' });
    if (!schedForm.bloodBankId || !schedForm.appointmentDate || !schedForm.timeSlot) {
      return setSchedMsg({ type: 'error', text: 'All fields are required.' });
    }
    try {
      await bloodService.scheduleAppointment({
        bloodBankId: Number(schedForm.bloodBankId),
        appointmentDate: schedForm.appointmentDate,
        timeSlot: schedForm.timeSlot
      });
      setSchedMsg({ type: 'success', text: 'Appointment scheduled successfully!' });
      setSchedForm(prev => ({ ...prev, appointmentDate: '' }));
      // Reload appointments
      const apptRes = await bloodService.getAppointments();
      setAppointments(apptRes.data);
    } catch (err) {
      setSchedMsg({ type: 'error', text: err.response?.data?.message || 'Failed to schedule appointment.' });
    }
  };

  const handleManualHistorySubmit = async (e) => {
    e.preventDefault();
    setHistoryMsg({ type: '', text: '' });
    if (!historyForm.bankName || !historyForm.donationDate) {
      return setHistoryMsg({ type: 'error', text: 'Blood bank name and donation date are required.' });
    }
    try {
      await bloodService.createDonationHistory(historyForm);
      setHistoryMsg({ type: 'success', text: 'Donation logged successfully!' });
      setHistoryForm({ bankName: '', donationDate: '', units: '1', notes: '' });
      // Reload history
      const historyRes = await bloodService.getDonationHistory();
      setDonationHistory(historyRes.data);
    } catch (err) {
      setHistoryMsg({ type: 'error', text: err.response?.data?.message || 'Failed to log donation history.' });
    }
  };

  const toggleAvailability = async () => {
    try {
      const nextVal = !isAvailable;
      await bloodService.updateDonorAvailability(nextVal);
      setIsAvailable(nextVal);
      setProfile(prev => ({ ...prev, is_available: nextVal ? 1 : 0 }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update availability.');
    }
  };

  const handleContactHospital = async (hospitalId) => {
    if (!hospitalId) return;
    setContactLoading(true);
    try {
      // Start/Retrieve chat room with hospital user
      await api.post('/chats', { userId2: hospitalId });
      setContactLoading(false);
      navigate(`/chat?userId=${hospitalId}`);
    } catch (err) {
      setContactLoading(false);
      alert('Failed to establish contact. Direct messenger may not be available.');
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center"><Spinner size="lg" /></main>
      </div>
    );
  }

  // Compute eligibility
  let eligible = true;
  let nextEligibleDate = 'Now';
  if (profile.last_donation_date) {
    const lastDate = new Date(profile.last_donation_date);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 90) {
      eligible = false;
      const nextDate = new Date(lastDate.getTime() + (90 * 24 * 60 * 60 * 1000));
      nextEligibleDate = nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  const completedVisits = appointments.filter(a => a.status === 'completed');
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const totalDonationsCount = completedVisits.length + donationHistory.length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        <PageHeader
          title="Donor Dashboard"
          subtitle="Manage your blood donations, schedule appointments, and view history."
          icon={Heart}
        />

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-8">
          {['overview', 'history', 'profile', 'schedule'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' ? '🏠 Overview' : tab === 'history' ? '📜 History' : tab === 'profile' ? '👤 Profile' : '📅 Schedule'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Eligibility Banner & Availability Control */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className={`col-span-2 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 ${eligible ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${eligible ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    <Heart size={20} className={eligible ? 'fill-green-600 text-green-600' : ''} />
                  </div>
                  <div>
                    <p className={`font-bold ${eligible ? 'text-green-700' : 'text-orange-700'}`}>
                      {eligible ? '✓ You are eligible to donate!' : '✗ Under 90-day waiting period'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {eligible ? 'Help save lives by scheduling a donation today.' : `Next eligible donation date: ${nextEligibleDate}`}
                    </p>
                  </div>
                </div>
                {eligible && (
                  <button onClick={() => setActiveTab('schedule')} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shrink-0">
                    Schedule Donation
                  </button>
                )}
              </div>

              {/* Availability Switch */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1">Donor Availability</h4>
                  <p className="text-xs text-gray-500 leading-normal">
                    Turn ON to match emergency requests nearby and alert hospitals.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isAvailable ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                    {isAvailable ? 'Available to Donate' : 'Unavailable'}
                  </span>
                  <button
                    onClick={toggleAvailability}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${isAvailable ? 'bg-red-600' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${isAvailable ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <StatCard icon={Droplet} label="Total Donations" value={totalDonationsCount} color="red" />
              <StatCard icon={Heart} label="Lives Saved" value={totalDonationsCount * 3} color="green" />
              <StatCard icon={Award} label="Donor Badge" value={totalDonationsCount >= 5 ? 'Gold' : totalDonationsCount >= 3 ? 'Silver' : 'Bronze'} color="orange" />
              <StatCard icon={Calendar} label="Pending Visits" value={pendingAppointments.length} color="blue" />
            </div>

            {/* Matching Emergency Alerts */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Droplet size={18} className="text-red-500 fill-red-500" />
                    Emergency Broadcasts (Matching City & Group)
                  </h3>
                  {matchingRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-400">No active emergency requests match your blood type ({profile.blood_group || 'Unset'}) and city ({profile.city || 'Unset'}) right now.</p>
                      <p className="text-xs text-gray-400 mt-1">Make sure your profile location and blood group details are accurate.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {matchingRequests.map(req => (
                        <div key={req.id} className="p-4 border border-red-100 bg-red-50/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full capitalize">{req.emergency_level} Urgency</span>
                              <span className="text-xs text-gray-500">Posted {new Date(req.created_at).toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-bold text-gray-800">{req.hospital_name}</h4>
                            <p className="text-xs text-gray-600 mt-1">
                              Requires <strong>{req.units} Units</strong> of <strong>{req.blood_group}</strong>.
                            </p>
                            {req.additional_notes && <p className="text-xs italic text-gray-500 mt-1">"{req.additional_notes}"</p>}
                          </div>
                          <button
                            onClick={() => setActiveRequest(req)}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm shrink-0"
                          >
                            Respond to Request
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Recent Appointments */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">Recent Scheduled Appointments</h3>
                    <button onClick={() => setActiveTab('history')} className="text-xs text-red-600 font-semibold hover:underline">
                      View all
                    </button>
                  </div>
                  {appointments.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">No appointments scheduled yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {appointments.slice(0, 3).map(appt => (
                        <div key={appt.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                              <Calendar size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{appt.bankName || 'Blood Bank'}</p>
                              <p className="text-xs text-gray-500">{new Date(appt.appointment_date).toLocaleDateString('en-IN')} · {appt.time_slot}</p>
                            </div>
                          </div>
                          <StatusBadge status={appt.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Profile Overview */}
              <div>
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">Profile Summary</h3>
                    <button onClick={() => setActiveTab('profile')} className="text-xs text-red-600 font-semibold hover:underline">
                      Edit profile
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-600 shrink-0">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-lg leading-tight">{profile.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {profile.blood_group ? <BloodGroupBadge group={profile.blood_group} size="sm" /> : <span className="text-xs text-orange-500">Group Unset</span>}
                        <span className="text-xs text-gray-400">· Registered Donor</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-400">Age</p>
                      <p className="font-semibold text-gray-700">{profile.age || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-400">Gender</p>
                      <p className="font-semibold text-gray-700">{profile.gender || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-400">Phone</p>
                      <p className="font-semibold text-gray-700 truncate">{profile.phone || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-400">City</p>
                      <p className="font-semibold text-gray-700">{profile.city || '—'}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Manual Entry Form */}
              <div className="lg:col-span-1">
                <Card>
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-1.5"><Plus size={18} className="text-red-600" />Log External Donation</h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Did you donate elsewhere? Log your manual history to keep track of your saved lives badge.
                  </p>
                  {historyMsg.text && (
                    <div className={`p-3.5 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                      historyMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      <AlertCircle size={14} />
                      {historyMsg.text}
                    </div>
                  )}
                  <form onSubmit={handleManualHistorySubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Blood Bank / Camp Name</label>
                      <input
                        type="text" value={historyForm.bankName} onChange={e => setHistoryForm({ ...historyForm, bankName: e.target.value })} required placeholder="e.g. Red Cross Camp"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Donation Date</label>
                        <input
                          type="date" max={new Date().toISOString().split('T')[0]} value={historyForm.donationDate} onChange={e => setHistoryForm({ ...historyForm, donationDate: e.target.value })} required
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Units Donated</label>
                        <input
                          type="number" min="1" max="5" value={historyForm.units} onChange={e => setHistoryForm({ ...historyForm, units: e.target.value })} required
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Additional Notes</label>
                      <input
                        type="text" value={historyForm.notes} onChange={e => setHistoryForm({ ...historyForm, notes: e.target.value })} placeholder="Felt healthy, standard checkup"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      />
                    </div>
                    <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm">
                      Log Donation History
                    </button>
                  </form>
                </Card>
              </div>

              {/* Records Tables */}
              <div className="lg:col-span-2 space-y-6">
                {/* Manual Donation History */}
                <Card>
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-1.5"><Droplet size={18} className="text-red-500" />Logged Donation Logs</h3>
                  {donationHistory.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">No manual donation history logged yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-500 text-left">
                            <th className="pb-3 pr-4">Date</th>
                            <th className="pb-3 pr-4">Donation Location</th>
                            <th className="pb-3 pr-4">Units</th>
                            <th className="pb-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-700">
                          {donationHistory.map(hist => (
                            <tr key={hist.id}>
                              <td className="py-3 pr-4 text-gray-500">{new Date(hist.donation_date).toLocaleDateString('en-IN')}</td>
                              <td className="py-3 pr-4 font-medium text-gray-800">{hist.blood_bank_name}</td>
                              <td className="py-3 pr-4 font-semibold text-red-600">{hist.units} Unit(s)</td>
                              <td className="py-3 text-xs italic text-gray-500">{hist.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                {/* Appointment history */}
                <Card>
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-1.5"><Calendar size={18} className="text-red-500" />Direct Appointments History</h3>
                  {appointments.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">No appointment records found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-500 text-left">
                            <th className="pb-3 pr-4">Date</th>
                            <th className="pb-3 pr-4">Blood Bank</th>
                            <th className="pb-3 pr-4">Slot</th>
                            <th className="pb-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-700">
                          {appointments.map(appt => (
                            <tr key={appt.id}>
                              <td className="py-3 pr-4 text-gray-500">{new Date(appt.appointment_date).toLocaleDateString('en-IN')}</td>
                              <td className="py-3 pr-4 font-medium text-gray-800">{appt.bankName || 'Blood Bank'}</td>
                              <td className="py-3 pr-4 text-gray-500 text-xs">{appt.time_slot}</td>
                              <td className="py-3"><StatusBadge status={appt.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="max-w-2xl">
              <h3 className="font-bold text-gray-800 mb-6">Update Profile Information</h3>
              {editMsg.text && (
                <div className={`p-4 rounded-xl text-sm mb-5 flex items-center gap-2 ${
                  editMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle size={15} />
                  {editMsg.text}
                </div>
              )}
              <form onSubmit={handleProfileUpdateSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      name="name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <input
                      name="phone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
                    <input
                      name="age" type="number" min="18" max="65" value={editForm.age} onChange={e => setEditForm({ ...editForm, age: e.target.value })} required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                    <select
                      name="gender" value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                    >
                      <option value="">Select</option>
                      {genders.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group</label>
                    <select
                      name="bloodGroup" value={editForm.bloodGroup} onChange={e => setEditForm({ ...editForm, bloodGroup: e.target.value })} required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                    >
                      <option value="">Select</option>
                      {bloodGroups.map(bg => <option key={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address</label>
                  <input
                    name="address" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <input
                      name="city" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                    <input
                      name="state" value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value })} required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Donation Date</label>
                    <input
                      name="lastDonationDate" type="date" value={editForm.lastDonationDate} max={new Date().toISOString().split('T')[0]}
                      onChange={e => setEditForm({ ...editForm, lastDonationDate: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio / Notes</label>
                    <textarea
                      name="bio" rows={1} value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none bg-white"
                    />
                  </div>
                </div>

                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm shadow-md">
                  Save Profile Changes
                </button>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="max-w-xl">
              <h3 className="font-bold text-gray-800 mb-6">Schedule a Donation Appointment</h3>
              {schedMsg.text && (
                <div className={`p-4 rounded-xl text-sm mb-5 flex items-center gap-2 ${
                  schedMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle size={15} />
                  {schedMsg.text}
                </div>
              )}
              {bloodBanks.length === 0 ? (
                <p className="text-gray-500 text-sm">No blood banks are currently registered on the network to schedule appointments.</p>
              ) : (
                <form onSubmit={handleScheduleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Choose Blood Bank</label>
                    <select
                      value={schedForm.bloodBankId}
                      onChange={e => setSchedForm({ ...schedForm, bloodBankId: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                    >
                      {bloodBanks.map(bank => (
                        <option key={bank.id} value={bank.id}>{bank.name} ({bank.city})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Date</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={schedForm.appointmentDate}
                      onChange={e => setSchedForm({ ...schedForm, appointmentDate: e.target.value })}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Time Slot</label>
                    <select
                      value={schedForm.timeSlot}
                      onChange={e => setSchedForm({ ...schedForm, timeSlot: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                    >
                      <option>09:00 AM – 10:00 AM</option>
                      <option>10:00 AM – 11:00 AM</option>
                      <option>11:00 AM – 12:00 PM</option>
                      <option>02:00 PM – 03:00 PM</option>
                      <option>03:00 PM – 04:00 PM</option>
                      <option>04:00 PM – 05:00 PM</option>
                    </select>
                  </div>
                  <button type="submit" disabled={!eligible} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors">
                    {eligible ? 'Confirm Appointment' : 'Not Eligible to Schedule yet'}
                  </button>
                </form>
              )}
            </Card>
          </motion.div>
        )}

        {/* Emergency Response Contact Modal */}
        {activeRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-xl">
              <h3 className="font-bold text-gray-800 text-lg mb-2">Respond to Emergency Request</h3>
              <p className="text-xs text-gray-500 mb-4">Confirm patient details and connect with the hospital coordinator.</p>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2.5 text-sm text-gray-700 mb-6">
                <div>
                  <span className="text-xs text-gray-400 block">Patient Name</span>
                  <span className="font-semibold text-gray-800">{activeRequest.patient_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-gray-400 block">Blood Group Required</span>
                    <span className="font-semibold text-red-600">{activeRequest.blood_group}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Units Required</span>
                    <span className="font-semibold text-gray-800">{activeRequest.units} Unit(s)</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Hospital / Location</span>
                  <span className="font-semibold text-gray-800">{activeRequest.hospital_name}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Contact Coordinator Phone</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1"><Phone size={13} />{activeRequest.contact}</span>
                </div>
                {activeRequest.additional_notes && (
                  <div>
                    <span className="text-xs text-gray-400 block">Notes from Hospital</span>
                    <span className="italic text-xs text-gray-500">"{activeRequest.additional_notes}"</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveRequest(null)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleContactHospital(activeRequest.hospital_id)}
                  disabled={contactLoading || !activeRequest.hospital_id}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {contactLoading ? <Spinner size="sm" /> : 'Start Chat'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const genders = ['Male', 'Female', 'Other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default DonorDashboard;
