import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PharmacyOrderTracker } from '../PharmacyOrderTracker';

export const PatientHome: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Welcome Back</h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">Real-time healthcare & pharmacy summary</p>
        </div>
      </div>
      
      {/* 3 Big Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-5 text-white shadow-lg shadow-blue-500/20">
          <h3 className="font-extrabold text-base mb-1">Doctor Consultation</h3>
          <p className="text-blue-100 text-xs">Better Care Made Simple</p>
        </div>
        <div className="bg-gradient-to-r from-teal-500 to-teal-700 rounded-3xl p-5 text-white shadow-lg shadow-teal-500/20">
          <h3 className="font-extrabold text-base mb-1">Book Lab Tests</h3>
          <p className="text-teal-100 text-xs">NABL Accredited</p>
        </div>
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <h3 className="font-extrabold text-base mb-1">Order Medicines</h3>
          <p className="text-emerald-100 text-xs">Up to 25% Off</p>
        </div>
      </div>

      {/* Real-Time Pharmacy Order Status Progress Tracker */}
      <PharmacyOrderTracker />
    </div>
  );
};
