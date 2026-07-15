import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, Phone, Mail, MapPin, Share2, ExternalLink, Globe, Heart } from 'lucide-react';

const Footer = () => (
  <footer className="bg-gray-900 text-gray-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center">
              <Droplets size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              <span className="text-red-400">Crimson</span>Connect
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed mb-5">
            Connecting blood donors, patients, and hospitals to save lives every day. Join our mission.
          </p>
          <div className="flex gap-3">
            {[Share2, Globe, ExternalLink].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                <Icon size={16} className="text-gray-400 hover:text-white" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2.5">
            {[
              { to: '/', label: 'Home' },
              { to: '/register', label: 'Register' },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-sm text-gray-400 hover:text-red-400 transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Blood Groups */}
        <div>
          <h4 className="text-white font-semibold mb-4">Blood Groups</h4>
          <div className="grid grid-cols-4 gap-2">
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <span key={bg} className="bg-gray-800 border border-red-900/40 text-red-400 text-xs font-bold rounded-lg py-1.5 text-center">
                {bg}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">All blood types accepted. Every drop counts.</p>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-4">Contact & Emergency</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Phone size={15} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-white font-medium">Emergency Helpline</p>
                <p className="text-gray-400">+91 1800-XXX-XXXX (24/7)</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={15} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-white font-medium">Email</p>
                <p className="text-gray-400">help@crimsonconnect.in</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <MapPin size={15} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-white font-medium">Address</p>
                <p className="text-gray-400">Medical Hub, New Delhi, India</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} CrimsonConnect. All rights reserved.
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          Made with <Heart size={12} className="text-red-500 fill-red-500" /> to save lives
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
