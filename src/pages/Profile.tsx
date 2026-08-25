import { useState } from 'react';
import { User as UserIcon, Mail, Lock, Eye, EyeOff, Save, Shield, BadgeCheck, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import Badge, { statusVariant, roleLabel } from '../components/ui/Badge';

export default function Profile() {
  const { currentUser, updateUser } = useAuth();
  const { runWithFeedback } = useFeedback();
  const [name, setName] = useState(currentUser?.name ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!currentUser) return null;

  const idField = currentUser.adminId ?? currentUser.officerId ?? currentUser.studentId ?? currentUser.facultyId ?? currentUser.employeeId;
  const idLabel =
    currentUser.role === 'admin' ? 'Admin ID' :
    currentUser.role === 'health_officer' ? 'Health Officer ID' :
    currentUser.role === 'student' ? 'Student ID' :
    currentUser.role === 'faculty' ? 'Faculty ID' :
    currentUser.role === 'staff' ? 'Staff ID' :
    'Employee ID';

  const handleSave = async () => {
    setError('');
    if (!name.trim()) { setError('Name cannot be empty.'); return; }
    if (!email.trim()) { setError('Email cannot be empty.'); return; }
    if (newPassword && newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword && newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    const updates: Partial<typeof currentUser> = { name: name.trim(), email: email.trim().toLowerCase() };
    const pw = newPassword.trim() || undefined;

    await runWithFeedback(
      () => updateUser(currentUser.id, updates, pw),
      {
        loadingTitle: 'Saving profile…',
        successTitle: 'Profile updated',
        successMessage: 'Your profile has been saved successfully.',
        autoCloseMs: 1800,
      },
    );
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Profile header card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30">
              <span className="text-white font-bold text-3xl">{currentUser.name.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-white truncate">{currentUser.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge label={roleLabel(currentUser.role)} variant={statusVariant(currentUser.role)} />
                {currentUser.department && <span className="text-teal-100 text-sm">{currentUser.department}</span>}
              </div>
              <p className="text-teal-100 text-sm mt-1 truncate">{currentUser.email}</p>
            </div>
          </div>
        </div>

        {/* Account info (read-only IDs) */}
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Account Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="p-2 bg-slate-100 rounded-lg shrink-0"><BadgeCheck size={16} className="text-slate-500" /></div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">{idLabel}</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{idField || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="p-2 bg-slate-100 rounded-lg shrink-0"><Building2 size={16} className="text-slate-500" /></div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">College / Department</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{currentUser.department || '—'}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <Shield size={12} /> School IDs are managed by the administrator and cannot be changed here.
          </p>
        </div>

        {/* Editable fields */}
        <div className="px-6 py-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Edit Profile</h3>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address (Username)</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                placeholder="you@gmail.com"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">This is the email you use to sign in.</p>
          </div>

          {/* Password */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Change Password</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                    placeholder="Leave blank to keep current"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Password must be at least 6 characters. Leave both fields blank to keep your current password.</p>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <Save size={15} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
