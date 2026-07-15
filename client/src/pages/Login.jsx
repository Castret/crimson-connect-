import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'donor';
  const [form, setForm] = useState({ email: '', password: '', role: defaultRole });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { value: 'donor', label: 'Donor' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'bloodbank', label: 'Blood Bank' },
    { value: 'admin', label: 'Admin' },
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password, form.role);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'bloodbank') navigate('/bloodbank/dashboard');
      else if (user.role === 'hospital') navigate('/hospital/dashboard');
      else navigate('/donor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-64 h-64 bg-red-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-900/50">
            <Droplets size={36} className="text-white" />
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Welcome Back to<br />
            <span className="text-red-400">CrimsonConnect</span>
          </h2>
          <p className="text-white/60 leading-relaxed">
            Your platform for real-time blood availability, donation scheduling, and emergency coordination.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {['A+', 'B+', 'O+', 'AB+', 'A-', 'O-'].map(bg => (
              <div key={bg} className="bg-white/10 border border-white/20 rounded-xl py-2 text-white font-bold text-sm">
                {bg}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo (mobile) */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center">
              <Droplets size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-red-600">Crimson</span><span className="text-gray-800">Connect</span>
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h1>
          <p className="text-gray-500 mb-8">Choose your role and enter your credentials.</p>

          {/* Role Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {roles.map(r => (
              <button
                key={r.value}
                onClick={() => setForm({ ...form, role: r.value })}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${
                  form.role === r.value
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-5">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input type="checkbox" className="accent-red-600" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-red-600 hover:underline">Forgot password?</Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-red-600/20"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            New to CrimsonConnect?{' '}
            <Link to="/register" className="text-red-600 font-semibold hover:underline">Create account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
