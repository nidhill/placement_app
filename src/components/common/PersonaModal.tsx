import React from 'react';
import { User, UserRole } from '../../types.ts';
import { X, Shield, Briefcase, GraduationCap, BarChart3, Check } from 'lucide-react';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser,
}) => {
  if (!isOpen) return null;

  const rolesConfig: { role: UserRole; title: string; icon: React.ReactNode }[] = [
    {
      role: 'MAIN_ADMIN',
      title: 'Main Admin',
      icon: <Shield className="w-4 h-4 text-slate-800" />,
    },
    {
      role: 'PLACEMENT_OFFICER',
      title: 'Placement Officer',
      icon: <Briefcase className="w-4 h-4 text-slate-800" />,
    },
    {
      role: 'MANAGEMENT',
      title: 'Management',
      icon: <BarChart3 className="w-4 h-4 text-slate-800" />,
    },
    {
      role: 'STUDENT',
      title: 'Student',
      icon: <GraduationCap className="w-4 h-4 text-slate-800" />,
    },
  ];

  const handleSelectRole = (role: UserRole) => {
    const matchingUser = users.find(u => u.role === role) || users[0];
    onSelectUser(matchingUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">HACA Placement Platform</h2>
            <p className="text-xs text-slate-500 mt-1">Choose a demo role</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Four Role Buttons */}
        <div className="p-4 space-y-2.5">
          {rolesConfig.map(rc => {
            const isCurrent = currentUser?.role === rc.role;
            return (
              <button
                key={rc.role}
                onClick={() => handleSelectRole(rc.role)}
                className={`w-full py-3 px-4 rounded-xl border font-medium text-sm transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isCurrent ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {rc.icon}
                  </div>
                  <span>{rc.title}</span>
                </div>
                {isCurrent && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};

