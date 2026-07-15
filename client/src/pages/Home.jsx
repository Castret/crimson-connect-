import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, Droplets, Shield, Clock, ArrowRight, Activity,
  Users, Building2, Award, ChevronRight, Zap, Phone
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { SectionTitle } from '../components/UI';

// Animated counter
const Counter = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const increment = target / 60;
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev >= target) { clearInterval(timer); return target; }
        return Math.min(prev + increment, target);
      });
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{Math.floor(count).toLocaleString()}{suffix}</span>;
};

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const facts = [
  { icon: Clock, title: 'Every 2 Seconds', desc: 'Someone in India needs blood — be the reason they survive.' },
  { icon: Heart, title: 'One Donation', desc: 'A single donation can save up to 3 lives by separating components.' },
  { icon: Shield, title: 'Safe & Tested', desc: 'All donated blood is rigorously screened for safety.' },
  { icon: Activity, title: '42 Days Shelf Life', desc: 'Whole blood can be stored up to 42 days under proper conditions.' },
];

const steps = [
  { step: '01', title: 'Register', desc: 'Create your free donor profile in minutes.' },
  { step: '02', title: 'Get Screened', desc: 'Quick health check to ensure you are eligible.' },
  { step: '03', title: 'Donate', desc: 'Visit a nearby blood bank — it takes only 10 minutes.' },
  { step: '04', title: 'Save Lives', desc: 'Your blood reaches patients who need it the most.' },
];

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative hero-gradient min-h-screen flex items-center overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-32 w-80 h-80 bg-red-600/15 rounded-full blur-3xl" />
          {/* Floating blood drops */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-red-400/30 rounded-full"
              style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 20}%` }}
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                <span className="text-red-300 text-sm font-medium">National Blood Donation Network</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-6">
                Donate Blood,<br />
                <span className="text-red-400">Save Lives</span>
              </h1>
              <p className="text-lg text-white/70 mb-10 leading-relaxed max-w-lg">
                Connecting blood donors, patients, and hospitals across India. Real-time blood availability, emergency requests, and seamless coordination — all in one platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-7 py-3.5 rounded-full transition-all shadow-xl shadow-red-900/40 hover:scale-105"
                >
                  <Heart size={18} className="fill-white" />
                  Become a Donor
                </Link>
                <Link
                  to="/login?role=hospital"
                  className="inline-flex items-center gap-2 text-white/70 hover:text-white font-medium text-sm mt-1.5 transition-colors"
                >
                  Hospital Login <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>

            {/* Right — Blood Group Card Grid */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8">
                  <p className="text-white/60 text-sm font-medium mb-4 uppercase tracking-widest">Live Blood Availability</p>
                  <div className="grid grid-cols-4 gap-3">
                    {bloodGroups.map((bg, i) => (
                      <motion.div
                        key={bg}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.08 }}
                        className="aspect-square bg-red-600/80 hover:bg-red-500 border border-red-400/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors group"
                      >
                        <Droplets size={16} className="text-white/60 group-hover:text-white mb-1 transition-colors" />
                        <span className="text-white font-bold text-lg">{bg}</span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-2xl">4,820</p>
                      <p className="text-white/60 text-xs">Units Available Now</p>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div>
                      <p className="text-white font-bold text-2xl">238</p>
                      <p className="text-white/60 text-xs">Banks Connected</p>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div>
                      <p className="text-white font-bold text-2xl">12K+</p>
                      <p className="text-white/60 text-xs">Active Donors</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, label: 'Registered Donors', value: 12480, suffix: '+', color: 'text-red-600', bg: 'bg-red-50' },
              { icon: Droplets, label: 'Blood Units Available', value: 4820, suffix: '', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: Heart, label: 'Lives Saved', value: 38200, suffix: '+', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Building2, label: 'Partner Hospitals', value: 238, suffix: '', color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(({ icon: Icon, label, value, suffix, color, bg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center"
              >
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <Icon size={22} className={color} />
                </div>
                <p className={`text-3xl font-extrabold ${color}`}>
                  <Counter target={value} suffix={suffix} />
                </p>
                <p className="text-gray-500 text-sm mt-1">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle subtitle="Donating blood is simple. Here's how the process works.">
            How It Works
          </SectionTitle>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-red-100 -z-10" />
                )}
                <div className="w-16 h-16 bg-red-600 text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-600/30">
                  {step}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Donate ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle subtitle="Understanding blood donation can inspire more people to contribute.">
            Why Donate Blood?
          </SectionTitle>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {facts.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={22} className="text-red-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle subtitle="Join as the role that fits you best.">Join CrimsonConnect</SectionTitle>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                role: 'Donor',
                desc: 'Register as a blood donor, manage your profile, view donation history, and schedule appointments.',
                cta: 'Register as Donor',
                to: '/register?role=donor',
                color: 'from-red-500 to-red-700',
              },
              {
                icon: Building2,
                role: 'Hospital',
                desc: 'Search real-time blood availability, request units, and track delivery from connected blood banks.',
                cta: 'Hospital Login',
                to: '/login?role=hospital',
                color: 'from-blue-500 to-blue-700',
              },
              {
                icon: Award,
                role: 'Blood Bank Admin',
                desc: 'Manage blood inventory, approve requests, and keep your stock levels up to date.',
                cta: 'Admin Login',
                to: '/login?role=bloodbank',
                color: 'from-purple-500 to-purple-700',
              },
            ].map(({ icon: Icon, role, desc, cta, to, color }, i) => (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className={`bg-gradient-to-br ${color} p-8 flex items-center justify-center`}>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Icon size={30} className="text-white" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{role}</h3>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">{desc}</p>
                  <Link
                    to={to}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 group"
                  >
                    {cta}
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
