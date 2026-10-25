import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, FileText, Pill, FlaskConical, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HealthPilotLogo } from './HealthPilotLogo';
import { UserRole } from '../types';

export const Sidebar: React.FC = () => {
  const { currentUser, logout, currentRole } = useAuth();

  const getNavLinks = (role: UserRole) => {
    switch (role) {
      case 'patient':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Appointments', path: '/appointments', icon: Calendar },
          { name: 'Records', path: '/records', icon: FileText },
        ];
      case 'doctor':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Appointments', path: '/appointments', icon: Calendar },
          { name: 'Patients', path: '/patients', icon: User },
        ];
      case 'lab':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Test Requests', path: '/test-requests', icon: FlaskConical },
        ];
      case 'pharmacist':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Orders', path: '/orders', icon: Pill },
        ];
      case 'super_admin':
      case 'sub_admin':
        return [
          { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Users', path: '/users', icon: User },
          { name: 'Appointments', path: '/appointments', icon: Calendar },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navLinks = currentRole ? getNavLinks(currentRole) : [];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col p-4">
      <div className="mb-8">
        <HealthPilotLogo size="md" />
      </div>
      <nav className="flex-1 space-y-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-xl transition-all ${
                isActive ? 'bg-[#1769E0] text-white' : 'text-slate-400 hover:bg-slate-800'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            <span className="font-semibold">{link.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-slate-800 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold">
            {currentUser?.name.charAt(0)}
          </div>
          <div className="text-sm">
            <p className="font-bold">{currentUser?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{currentRole?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full p-3 rounded-xl text-red-400 hover:bg-red-900/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );
};
