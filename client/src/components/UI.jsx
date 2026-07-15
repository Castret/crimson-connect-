import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

// ── Stat Card ──────────────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, color = 'red', delay = 0 }) => {
  const colors = {
    red: 'bg-red-50 text-red-600 border-red-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow ${colors[color]?.split(' ')[2] || 'border-gray-100'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]?.split(' ').slice(0, 2).join(' ')}`}>
          <Icon size={22} />
        </div>
        <TrendingUp size={16} className="text-green-500" />
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </motion.div>
  );
};

// ── Blood Group Badge ──────────────────────────────────────────────────────────
export const BloodGroupBadge = ({ group, size = 'md' }) => {
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1', lg: 'text-base px-4 py-1.5' };
  return (
    <span className={`inline-flex items-center font-bold rounded-full bg-red-100 text-red-700 border border-red-200 ${sizes[size]}`}>
      {group}
    </span>
  );
};

// ── Status Badge ───────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const styles = {
    available: 'bg-green-100 text-green-700',
    unavailable: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-gray-100 text-gray-600',
    expired: 'bg-red-100 text-red-700',
    critical: 'bg-red-200 text-red-800',
    high: 'bg-orange-100 text-orange-700',
    normal: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

// ── Page Header ───────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, icon: Icon }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-2">
      {Icon && (
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <Icon size={20} className="text-red-600" />
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
    </div>
    {subtitle && <p className="text-gray-500 text-sm ml-13">{subtitle}</p>}
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
      {Icon && <Icon size={28} className="text-red-300" />}
    </div>
    <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
    <p className="text-sm text-gray-400 max-w-xs">{message}</p>
  </div>
);

// ── Loading Spinner ────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-2 border-red-200 border-t-red-600 rounded-full animate-spin`} />
  );
};

// ── Card Wrapper ──────────────────────────────────────────────────────────────
export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

// ── Section Title ─────────────────────────────────────────────────────────────
export const SectionTitle = ({ children, subtitle }) => (
  <div className="text-center mb-12">
    <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">{children}</h2>
    {subtitle && <p className="text-gray-500 max-w-2xl mx-auto">{subtitle}</p>}
  </div>
);
