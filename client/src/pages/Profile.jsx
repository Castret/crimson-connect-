import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Award, Heart, Shield, Calendar, Edit2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';
import { BloodGroupBadge, StatusBadge, Card, Spinner } from '../components/UI';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['Male', 'Female', 'Other'];

const Profile = () => {
  const { user, setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // States
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Edit fields
  const [form, setForm] = useState({
    name: '', bio: '', phone: '', age: '', gender: '', address: '', city: '', state: '', bloodGroup: '', lastDonationDate: '', licenseNumber: ''
  });

  const profileId = searchParams.get('id');
  const isOwnProfile = !profileId || Number(profileId) === Number(user?.id);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const targetId = searchParams.get('id');
      const endpointId = targetId || user?.id;

      if (!endpointId) return;

      const res = await profileService.getById(endpointId);
      setProfile(res.data);

      setForm({
        name: res.data.name || '',
        bio: res.data.bio || '',
        phone: res.data.phone || '',
        age: res.data.age || '',
        gender: res.data.gender || '',
        address: res.data.address || '',
        city: res.data.city || '',
        state: res.data.state || '',
        bloodGroup: res.data.blood_group || '',
        lastDonationDate: res.data.last_donation_date ? res.data.last_donation_date.substring(0, 10) : '',
        licenseNumber: res.data.license_number || ''
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [searchParams, user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const res = await profileService.update(form);
      setProfile(res.data.profile);
      if (isOwnProfile) {
        setUser({ ...user, ...res.data.profile });
        localStorage.setItem('cc_user', JSON.stringify({ ...user, ...res.data.profile }));
      }
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      setEditMode(false);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const roleLabel = profile.role === 'bloodbank' ? 'Blood Bank' : profile.role === 'hospital' ? 'Hospital' : profile.role === 'donor' ? 'Blood Donor' : 'Administrator';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar spacer or we can just render the full page structure */}
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
        >
          ← Back to Dashboard
        </button>

        {/* Profile Card Header */}
        <Card className="mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-red-600" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center font-bold text-3xl shadow-inner uppercase shrink-0">
                {profile.name.slice(0, 2)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{profile.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 justify-center sm:justify-start">
                  <span className="bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {roleLabel}
                  </span>
                  {profile.blood_group && <BloodGroupBadge group={profile.blood_group} />}
                </div>
              </div>
            </div>

            {isOwnProfile && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="inline-flex items-center gap-2 border border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-600 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              >
                <Edit2 size={14} />
                Edit Profile
              </button>
            )}
          </div>
        </Card>

        {msg.text && (
          <div className={`p-4 rounded-xl text-sm mb-6 flex items-center gap-2 ${
            msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <AlertCircle size={15} />
            {msg.text}
          </div>
        )}

        {/* Edit Form Mode */}
        {editMode ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <h3 className="text-lg font-bold text-gray-800 mb-5">Edit Profile Information</h3>
              <form onSubmit={handleUpdate} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {profile.role === 'donor' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
                        <input
                          type="number" min="18" max="65"
                          value={form.age}
                          onChange={e => setForm({ ...form, age: e.target.value })}
                          required
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                        <select
                          value={form.gender}
                          onChange={e => setForm({ ...form, gender: e.target.value })}
                          required
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        >
                          <option value="">Select</option>
                          {genders.map(g => <option key={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group</label>
                        <select
                          value={form.bloodGroup}
                          onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                          required
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        >
                          <option value="">Select</option>
                          {bloodGroups.map(bg => <option key={bg}>{bg}</option>)}
                        </select>
                      </div>
                    </>
                  ) : profile.role === 'bloodbank' ? (
                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">License Number</label>
                      <input
                        value={form.licenseNumber}
                        onChange={e => setForm({ ...form, licenseNumber: e.target.value })}
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      />
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Biography</label>
                  <textarea
                    rows={3}
                    value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none bg-white"
                    placeholder="Short description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address</label>
                  <input
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <input
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                    <input
                      value={form.state}
                      onChange={e => setForm({ ...form, state: e.target.value })}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                </div>

                {profile.role === 'donor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Donation Date</label>
                    <input
                      type="date"
                      value={form.lastDonationDate}
                      onChange={e => setForm({ ...form, lastDonationDate: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-md"
                  >
                    Save Profile
                  </button>
                </div>
              </form>
            </Card>
          </motion.div>
        ) : (
          /* View Mode */
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left columns - Details */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <h3 className="font-bold text-gray-800 mb-4">About</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {profile.bio || 'No details provided.'}
                </p>
              </Card>

              <Card>
                <h3 className="font-bold text-gray-800 mb-4">Contact & Location Details</h3>
                <div className="space-y-4.5 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-gray-400 shrink-0" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-400 shrink-0" />
                    <span>{profile.phone || 'No phone registered'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                    <span>
                      {profile.address ? `${profile.address}, ` : ''}
                      {profile.city ? `${profile.city}, ` : ''}
                      {profile.state || ''}
                      {!profile.address && !profile.city && !profile.state && 'No address registered'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right column - Metadata summary */}
            <div className="space-y-6">
              {profile.role === 'donor' && (
                <Card className="text-center">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart size={22} className="fill-red-600 text-red-600" />
                  </div>
                  <h4 className="font-bold text-gray-800">Donor Information</h4>
                  <div className="mt-4 space-y-2.5 text-sm text-gray-600 text-left border-t border-gray-50 pt-4">
                    <p><strong>Age:</strong> {profile.age || '—'}</p>
                    <p><strong>Gender:</strong> {profile.gender || '—'}</p>
                    <p><strong>Last Donated:</strong> {profile.last_donation_date ? profile.last_donation_date.substring(0, 10) : 'Never'}</p>
                  </div>
                </Card>
              )}

              {profile.role === 'bloodbank' && (
                <Card className="text-center">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield size={22} />
                  </div>
                  <h4 className="font-bold text-gray-800">Verification Info</h4>
                  <div className="mt-4 space-y-2.5 text-sm text-gray-600 text-left border-t border-gray-50 pt-4">
                    <p className="truncate"><strong>License No:</strong> {profile.license_number || 'Pending verification'}</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
