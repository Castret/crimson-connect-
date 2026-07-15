import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, AlertCircle, CheckCircle, Heart, Building2, User, Phone, MapPin, Lock, Mail, Package } from 'lucide-react';
import { authService } from '../services/api';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['Male', 'Female', 'Other'];

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('donor'); // 'donor', 'hospital', or 'bloodbank'
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form fields state
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', age: '', gender: '', bloodGroup: '',
    address: '', city: '', state: '', lastDonationDate: '',
    licenseNumber: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const nextStep = () => {
    if (step === 1) {
      if (!form.name || !form.email || !form.password || !form.confirmPassword) {
        return setError('Please fill all required account credentials.');
      }
      if (form.password.length < 6) {
        return setError('Password must be at least 6 characters.');
      }
      if (form.password !== form.confirmPassword) {
        return setError('Passwords do not match.');
      }
    } else if (step === 2) {
      if (!form.phone || !form.address || !form.city || !form.state) {
        return setError('Please fill all required contact & location details.');
      }
      if (role === 'donor' && (!form.age || !form.gender)) {
        return setError('Please fill all required personal profile fields.');
      }
      if ((role === 'bloodbank' || role === 'hospital') && !form.licenseNumber) {
        return setError('Please enter your license number.');
      }
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 'donor' && !form.bloodGroup) {
      return setError('Please select a blood group.');
    }
    if ((role === 'bloodbank' || role === 'hospital') && !form.licenseNumber) {
      return setError('Please provide your license number.');
    }

    setLoading(true);
    setError('');

    const payload = {
      email: form.email,
      password: form.password,
      role: role,
      name: form.name,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state
    };

    if (role === 'donor') {
      payload.age = form.age;
      payload.gender = form.gender;
      payload.bloodGroup = form.bloodGroup;
      payload.lastDonationDate = form.lastDonationDate || null;
    } else {
      payload.licenseNumber = form.licenseNumber;
    }

    try {
      await authService.register(payload);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Logo Banner */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
              <Droplets size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-red-600">Crimson</span><span className="text-gray-800">Connect</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Create an Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the network to save lives and support patients.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-8 gap-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                step > s ? 'bg-green-500 text-white' :
                step === s ? 'bg-red-600 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 rounded-full transition-all ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 -mt-6 mb-8 px-1">
          <span>Account Setup</span><span className="text-center ml-2">Personal & Location</span><span>Medical Details</span>
        </div>

        {/* Form Container */}
        <motion.div
          key={step + role}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
        >
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-5">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* STEP 1: Account Role and Login Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Account Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('donor')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      role === 'donor'
                        ? 'border-red-600 bg-red-50 text-red-600'
                        : 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'
                    }`}
                  >
                    <Heart size={20} className={role === 'donor' ? 'fill-red-600' : ''} />
                    <span className="font-semibold text-xs">Donor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('hospital')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      role === 'hospital'
                        ? 'border-red-600 bg-red-50 text-red-600'
                        : 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'
                    }`}
                  >
                    <Building2 size={20} />
                    <span className="font-semibold text-xs">Hospital</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('bloodbank')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      role === 'bloodbank'
                        ? 'border-red-600 bg-red-50 text-red-600'
                        : 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'
                    }`}
                  >
                    <Package size={20} />
                    <span className="font-semibold text-xs">Blood Bank</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <User size={14} className="inline mr-1 text-gray-400" />
                  {role === 'donor' ? 'Full Name' : role === 'hospital' ? 'Hospital Name' : 'Blood Bank Name'} *
                </label>
                <input
                  name="name" value={form.name} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  placeholder={role === 'donor' ? 'John Doe' : role === 'hospital' ? 'City General Hospital' : 'City Blood Center'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Mail size={14} className="inline mr-1 text-gray-400" />
                  Email Address *
                </label>
                <input
                  name="email" type="email" value={form.email} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  placeholder="name@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Lock size={14} className="inline mr-1 text-gray-400" />
                    Password *
                  </label>
                  <input
                    name="password" type="password" value={form.password} onChange={handleChange} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    placeholder="Min 6 chars"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Lock size={14} className="inline mr-1 text-gray-400" />
                    Confirm Password *
                  </label>
                  <input
                    name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 rounded-xl transition-colors mt-2"
              >
                Continue to Profile
              </button>
            </div>
          )}

          {/* STEP 2: Personal, Contact & Location Details */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800">Contact & Profile Information</h2>

              <div className="grid grid-cols-2 gap-4">
                {role === 'donor' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Age *</label>
                      <input
                        name="age" type="number" min="18" max="65" value={form.age} onChange={handleChange} required
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                        placeholder="18 - 65"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender *</label>
                      <select
                        name="gender" value={form.gender} onChange={handleChange} required
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                      >
                        <option value="">Select</option>
                        {genders.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Helpline/Medical License Number *</label>
                    <input
                      name="licenseNumber" value={form.licenseNumber} onChange={handleChange} required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                      placeholder="e.g. LIC-CGH-1111"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Phone size={14} className="inline mr-1 text-gray-400" />
                  Contact Phone Number *
                </label>
                <input
                  name="phone" value={form.phone} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <MapPin size={14} className="inline mr-1 text-gray-400" />
                  Street Address *
                </label>
                <input
                  name="address" value={form.address} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  placeholder="e.g. Sector 5, Medical Road"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                  <input
                    name="city" value={form.city} onChange={handleChange} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    placeholder="e.g. Delhi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                  <input
                    name="state" value={form.state} onChange={handleChange} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    placeholder="e.g. Delhi"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button" onClick={prevStep}
                  className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button" onClick={nextStep}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Final Details & Confirm */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800">
                {role === 'donor' ? 'Medical History' : 'Review & Submit'}
              </h2>

              {role === 'donor' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Select Blood Group *</label>
                    <div className="grid grid-cols-4 gap-2">
                      {bloodGroups.map(bg => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setForm({ ...form, bloodGroup: bg })}
                          className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                            form.bloodGroup === bg
                              ? 'bg-red-600 border-red-600 text-white shadow-md'
                              : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'
                          }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Donation Date (optional)</label>
                    <input
                      name="lastDonationDate" type="date" max={new Date().toISOString().split('T')[0]}
                      value={form.lastDonationDate} onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-xs text-yellow-700 leading-relaxed">
                    <strong>Medical Requirements:</strong> Donors must weigh at least 50 kg, be in good overall health, and not have donated blood in the last 90 days.
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2 text-sm text-gray-700">
                    <p><strong>Org Type:</strong> <span className="capitalize">{role === 'hospital' ? 'Hospital' : 'Blood Bank'}</span></p>
                    <p><strong>Name:</strong> {form.name}</p>
                    <p><strong>Email:</strong> {form.email}</p>
                    <p><strong>License:</strong> {form.licenseNumber}</p>
                    <p><strong>Phone:</strong> {form.phone}</p>
                    <p><strong>Location:</strong> {form.address}, {form.city}, {form.state}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    By submitting, you verify that the information is correct and the organization is registered with regulatory healthcare authorities.
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button" onClick={prevStep} disabled={loading}
                  className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-red-600/10"
                >
                  {loading ? 'Submitting...' : 'Register Account'}
                </button>
              </div>
            </form>
          )}
        </motion.div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-red-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
