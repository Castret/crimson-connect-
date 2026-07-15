import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Droplets, MapPin, Filter, Phone, Building2, CheckCircle, XCircle, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { BloodGroupBadge, StatusBadge, EmptyState, Spinner } from '../components/UI';
import { bloodService } from '../services/api';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const components = ['Whole Blood', 'Packed RBC', 'Platelets', 'Fresh Frozen Plasma', 'Cryoprecipitate'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad'];

// Mock data for UI demonstration
const mockResults = [
  { id: 1, bankName: 'Apollo Blood Bank', bloodGroup: 'O+', component: 'Whole Blood', units: 14, city: 'Delhi', contact: '+91 98765 43210', expiry: '2024-08-15', status: 'available' },
  { id: 2, bankName: 'AIIMS Blood Centre', bloodGroup: 'O+', component: 'Packed RBC', units: 6, city: 'Delhi', contact: '+91 11-2658-8700', expiry: '2024-08-20', status: 'available' },
  { id: 3, bankName: 'City Blood Bank', bloodGroup: 'A+', component: 'Whole Blood', units: 0, city: 'Delhi', contact: '+91 98000 11111', expiry: '—', status: 'unavailable' },
  { id: 4, bankName: 'Red Cross Society', bloodGroup: 'B+', component: 'Platelets', units: 3, city: 'Delhi', contact: '+91 11-2359-8099', expiry: '2024-08-05', status: 'available' },
];

const BloodAvailability = () => {
  const [filters, setFilters] = useState({ bloodGroup: '', city: '', component: '' });
  const [results, setResults] = useState(mockResults);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(true);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(false);
    try {
      const res = await bloodService.search(filters);
      setResults(res.data);
    } catch {
      setResults(mockResults); // Fallback to mock if API not ready
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header Banner */}
      <div className="crimson-gradient pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4">
              <Droplets size={14} className="text-white" />
              <span className="text-white text-sm font-medium">Real-Time Blood Availability</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-3">Find Blood Near You</h1>
            <p className="text-white/70 max-w-xl mx-auto">
              Search across our network of connected blood banks to locate the blood type you need instantly.
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onSubmit={handleSearch}
            className="mt-8 bg-white rounded-2xl shadow-2xl p-5 max-w-3xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Blood Group</label>
                <select
                  value={filters.bloodGroup}
                  onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Groups</option>
                  {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">City / Location</label>
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Cities</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Component Type</label>
                <select
                  value={filters.component}
                  onChange={(e) => setFilters({ ...filters, component: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Components</option>
                  {components.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20"
            >
              <Search size={18} />
              Search Blood Availability
            </button>
          </motion.form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : searched && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">
                {results.length} Blood Bank{results.length !== 1 ? 's' : ''} Found
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter size={14} />
                Sort by availability
              </div>
            </div>

            {results.length === 0 ? (
              <EmptyState icon={Droplets} title="No Results Found" message="Try broadening your search filters." />
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {results.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                          <Building2 size={22} className="text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{item.bankName}</h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <MapPin size={11} />
                            {item.city}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <BloodGroupBadge group={item.bloodGroup} />
                        <p className="text-xs text-gray-500 mt-1">Blood Group</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className={`text-lg font-extrabold ${item.units > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {item.units}
                        </p>
                        <p className="text-xs text-gray-500">Units Available</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock size={12} className="text-orange-500" />
                          <span className="text-xs font-semibold text-orange-600">{item.expiry !== '—' ? item.expiry : 'N/A'}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Expiry</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-4">
                      Component: <span className="font-medium text-gray-700">{item.component}</span>
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone size={14} className="text-red-500" />
                        {item.contact}
                      </div>
                      {item.status === 'available' && (
                        <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                          Request Units
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BloodAvailability;
