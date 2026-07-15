import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Droplets, Phone, User, Settings, LogOut, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'Messenger' },
  { to: '/profile', icon: User, label: 'My Profile' },
];

const bloodbankLinks = [
  { to: '/bloodbank/dashboard', icon: LayoutDashboard, label: 'Bank Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'Messenger' },
  { to: '/profile', icon: User, label: 'My Profile' },
];

const hospitalLinks = [
  { to: '/hospital/dashboard', icon: LayoutDashboard, label: 'Hospital Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'Messenger' },
  { to: '/profile', icon: User, label: 'My Profile' },
];

const donorLinks = [
  { to: '/donor/dashboard', icon: LayoutDashboard, label: 'Donor Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'Messenger' },
  { to: '/profile', icon: User, label: 'My Profile' },
];


const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = user?.role === 'admin' ? adminLinks
    : user?.role === 'bloodbank' ? bloodbankLinks
    : user?.role === 'hospital' ? hospitalLinks
    : donorLinks;

  const displayRoleLabel = (role) => {
    if (role === 'bloodbank') return 'Blood Bank';
    if (role === 'hospital') return 'Hospital';
    if (role === 'donor') return 'Blood Donor';
    return 'Administrator';
  };

  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm"
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center">
            <Droplets size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold">
            <span className="text-red-600">Crimson</span>
            <span className="text-gray-800">Connect</span>
          </span>
        </div>
        {user && (
          <div className="mt-4 p-3 bg-red-50 rounded-xl">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">{displayRoleLabel(user.role)}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5 truncate">{user.name || user.email}</p>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to + label}
              to={to}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 space-y-1">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all cursor-pointer"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
