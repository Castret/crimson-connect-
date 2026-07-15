import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, ShieldCheck, AlertCircle, Clock, Radio, Users, Building2, ShieldAlert, Trash2, Calendar, FileText } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { StatCard, StatusBadge, Card, PageHeader, Spinner, EmptyState } from '../components/UI';
import { adminService } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ donors: 0, bloodbanks: 0, hospitals: 0, pending: 0, emergencies: 0 });
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const statsRes = await adminService.getStats();
      setStats(statsRes.data);

      const usersRes = await adminService.getUsers();
      setUsers(usersRes.data);

      const logsRes = await adminService.getLogs();
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateUserStatus = async (userId, newStatus) => {
    if (!window.confirm(`Are you sure you want to update this user status to ${newStatus}?`)) return;
    try {
      await adminService.updateUserStatus(userId, newStatus);
      // Reload stats and users
      const statsRes = await adminService.getStats();
      setStats(statsRes.data);
      const usersRes = await adminService.getUsers();
      setUsers(usersRes.data);
      const logsRes = await adminService.getLogs();
      setLogs(logsRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account? All associated records will be deleted.')) return;
    try {
      await adminService.deleteUser(userId);
      // Reload stats and users
      const statsRes = await adminService.getStats();
      setStats(statsRes.data);
      const usersRes = await adminService.getUsers();
      setUsers(usersRes.data);
      const logsRes = await adminService.getLogs();
      setLogs(logsRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
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

  const pendingUsers = users.filter(u => u.status === 'pending');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <PageHeader
          title="System Oversight Console"
          subtitle="Audit platform activity metrics, verify network medical entities, and suspend accounts."
          icon={ShieldCheck}
        />

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={Users} label="Registered Donors" value={stats.donors} color="red" />
          <StatCard icon={Building2} label="Blood Banks" value={stats.bloodbanks} color="blue" />
          <StatCard icon={Package} label="Hospitals" value={stats.hospitals} color="green" />
          <StatCard icon={ShieldAlert} label="Pending Reviews" value={stats.pending} color="orange" />
          <StatCard icon={Radio} label="Active Broadcasts" value={stats.emergencies} color="purple" />
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {['overview', 'verifications', 'users', 'logs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' ? '📊 System Stats' : tab === 'verifications' ? '🛡️ Verification Queue' : tab === 'users' ? '👥 User Management' : '📜 System Audit Logs'}
            </button>
          ))}
        </div>

        {/* System Stats / Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Summary */}
              <Card>
                <h3 className="font-bold text-gray-800 mb-4">Platform Oversight Summary</h3>
                <div className="space-y-3.5 text-sm text-gray-600">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-medium text-gray-700">Pending Clinic & Bank Verifications</span>
                    <span className="font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">{stats.pending} Account(s)</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-medium text-gray-700">Active Emergency notice broadcasts</span>
                    <span className="font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">{stats.emergencies} active</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-medium text-gray-700">Total Network Medical Entities</span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">{stats.bloodbanks + stats.hospitals} registered</span>
                  </div>
                </div>
              </Card>

              {/* Security Advisory */}
              <Card className="bg-red-50/20 border-red-100">
                <h3 className="font-bold text-red-800 mb-3 flex items-center gap-1.5"><ShieldCheck size={18} />Admin Moderation Standards</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  As a system administrator, you must verify the medical licenses and verification statuses of blood banks and hospitals before activating them.
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Suspending an account instantly blocks logins, and revokes active API authorization. Deleted users are permanently purged from the MySQL engine.
                </p>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Verifications Tab */}
        {activeTab === 'verifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="text-orange-500" size={18} />
                Medical Entities Verification Queue
              </h3>
              {pendingUsers.length === 0 ? (
                <EmptyState icon={ShieldCheck} title="Verification Queue Clean" message="No hospitals or blood banks are currently waiting for verification." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500 text-left">
                        <th className="pb-3 pr-4">Entity Type</th>
                        <th className="pb-3 pr-4">Organization Name</th>
                        <th className="pb-3 pr-4">Email</th>
                        <th className="pb-3 pr-4">City</th>
                        <th className="pb-3 pr-4">Registered Date</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {pendingUsers.map(u => (
                        <tr key={u.id}>
                          <td className="py-3.5 pr-4">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                              u.role === 'bloodbank' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {u.role === 'bloodbank' ? 'Blood Bank' : 'Hospital'}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4 font-semibold text-gray-800">{u.name}</td>
                          <td className="py-3.5 pr-4 text-gray-500">{u.email}</td>
                          <td className="py-3.5 pr-4 font-medium text-gray-700">{u.city || '—'}</td>
                          <td className="py-3.5 pr-4 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="py-3.5">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, 'verified')}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition"
                              >
                                Approve & Verify
                              </button>
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                                className="border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs px-3 py-1.5 rounded-lg transition"
                              >
                                Reject
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

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <h3 className="font-bold text-gray-800 mb-5">Manage Network Accounts</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 text-left">
                      <th className="pb-3 pr-4">User Name</th>
                      <th className="pb-3 pr-4">Email</th>
                      <th className="pb-3 pr-4">Role</th>
                      <th className="pb-3 pr-4">Location</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="py-3 pr-4 font-semibold text-gray-800">{u.name || 'System Admin'}</td>
                        <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'donor' ? 'bg-green-100 text-green-700' : u.role === 'bloodbank' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-xs font-semibold text-gray-600">{u.city || '—'}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-semibold ${
                            u.status === 'verified' ? 'bg-green-50 text-green-700 border border-green-200' : u.status === 'pending' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            {u.role !== 'admin' && (
                              <>
                                {u.status === 'suspended' ? (
                                  <button
                                    onClick={() => handleUpdateUserStatus(u.id, 'verified')}
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-2 py-1 rounded-lg transition"
                                  >
                                    Activate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs px-2 py-1 rounded-lg transition"
                                  >
                                    Suspend
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* System Logs Tab */}
        {activeTab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-1.5"><FileText size={18} className="text-gray-600" />Audit Activity Logs</h3>
              {logs.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No system logs available.</p>
              ) : (
                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2 text-xs">
                  {logs.map(log => (
                    <div key={log.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-700">{log.action}</span>
                          <span className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-gray-600 leading-normal">{log.details}</p>
                      </div>
                      <span className="text-[10px] bg-gray-200 font-semibold px-2 py-0.5 rounded text-gray-600">User ID: {log.user_id || 'System'}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
