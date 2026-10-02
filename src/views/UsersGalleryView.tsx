import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Download, 
  UserPlus, 
  UserX, 
  CheckCircle2, 
  Eye, 
  Trash2, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  Lock,
  Unlock
} from 'lucide-react';
import { EnrolledUser, UserRole } from '../types';
import { BiometricCard } from '../components/BiometricCard';
import { exportUsersToCsv } from '../lib/exportCsv';
import { useAuth } from '../context/AuthContext';

interface UsersGalleryViewProps {
  users: EnrolledUser[];
  onSelectUser: (user: EnrolledUser) => void;
  onOpenEnroll: () => void;
  onQuickAttendance: (user: EnrolledUser) => void;
  onRequestLockToggle?: (user: EnrolledUser) => void;
  onEmergencyLockdown?: (lockAll: boolean) => void;
}

export const UsersGalleryView: React.FC<UsersGalleryViewProps> = ({
  users,
  onSelectUser,
  onOpenEnroll,
  onQuickAttendance,
  onRequestLockToggle,
  onEmergencyLockdown,
}) => {
  const { isAdmin, isStaff } = useAuth();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive' | 'locked' | 'unlocked'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Sorting
  const [sortBy, setSortBy] = useState<'name' | 'roll' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [cardSize, setCardSize] = useState<'mini' | 'small' | 'medium'>('mini'); // Minimized small faces by default
  const pageSize = cardSize === 'mini' ? 32 : cardSize === 'small' ? 24 : 12;

  const lockedCount = useMemo(() => users.filter(u => u.is_locked).length, [users]);

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  // Filtered & Sorted users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || (
        user.full_name.toLowerCase().includes(searchLower) ||
        (user.roll_number && user.roll_number.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.department && user.department.toLowerCase().includes(searchLower))
      );

      // Department filter
      const matchesDept = selectedDepartment === 'all' || user.department === selectedDepartment;

      // Role filter
      const matchesRole = selectedRole === 'all' || user.user_role === selectedRole;

      // Status filter
      let matchesStatus = true;
      if (selectedStatus === 'active') matchesStatus = user.is_active;
      else if (selectedStatus === 'inactive') matchesStatus = !user.is_active;
      else if (selectedStatus === 'locked') matchesStatus = Boolean(user.is_locked);
      else if (selectedStatus === 'unlocked') matchesStatus = !user.is_locked;

      return matchesSearch && matchesDept && matchesRole && matchesStatus;
    }).sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortBy === 'name') {
        valA = a.full_name.toLowerCase();
        valB = b.full_name.toLowerCase();
      } else if (sortBy === 'roll') {
        valA = (a.roll_number || '').toLowerCase();
        valB = (b.roll_number || '').toLowerCase();
      } else if (sortBy === 'date') {
        valA = a.created_at;
        valB = b.created_at;
      }

      if (sortOrder === 'asc') return valA.localeCompare(valB);
      return valB.localeCompare(valA);
    });
  }, [users, searchTerm, selectedDepartment, selectedRole, selectedStatus, sortBy, sortOrder]);

  // Paginated chunk
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handleExport = () => {
    exportUsersToCsv(filteredUsers);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Search Bar */}
      <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <span>Enrolled Biometric Repository</span>
              <span className="text-xs mono px-2.5 py-0.5 rounded-full border" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-soft)' }}>
                {filteredUsers.length} Profiles
              </span>
              {lockedCount > 0 && (
                <span className="text-xs mono px-2.5 py-0.5 rounded-full border font-bold bg-amber-500/15 border-amber-500/30 text-amber-300 flex items-center space-x-1">
                  <Lock className="w-3 h-3 mr-1" />
                  {lockedCount} Protected
                </span>
              )}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Biometric face repository with 128-d vectors and zero-trust repository lock enforcement
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {/* Emergency Repository Lockdown Toggle (Admin Only) */}
            {isAdmin && onEmergencyLockdown && (
              <button
                onClick={() => onEmergencyLockdown(lockedCount < users.length)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                  lockedCount > 0
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                    : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20'
                }`}
                title="Repository Lockdown / Release (requires Master Passkey)"
              >
                {lockedCount > 0 ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{lockedCount > 0 ? 'Unlock All Repositories' : 'Lock All Repositories'}</span>
              </button>
            )}

            {/* View Mode & Size Toggle */}
            <div className="flex items-center space-x-1 border rounded-lg p-0.5" style={{ borderColor: 'var(--line)' }}>
              {viewMode === 'grid' && (
                <>
                  <button
                    onClick={() => setCardSize('mini')}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${cardSize === 'mini' ? 'shadow-sm text-black' : 'opacity-70 hover:opacity-100'}`}
                    style={{
                      background: cardSize === 'mini' ? 'var(--accent)' : 'transparent',
                    }}
                    title="Mini Smallest Face Size (High Density)"
                  >
                    Mini
                  </button>
                  <button
                    onClick={() => setCardSize('small')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${cardSize === 'small' ? 'shadow-sm text-black' : 'opacity-70 hover:opacity-100'}`}
                    style={{
                      background: cardSize === 'small' ? 'var(--accent)' : 'transparent',
                    }}
                    title="Small Face Cards"
                  >
                    Small
                  </button>
                  <button
                    onClick={() => setCardSize('medium')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${cardSize === 'medium' ? 'shadow-sm text-black' : 'opacity-70 hover:opacity-100'}`}
                    style={{
                      background: cardSize === 'medium' ? 'var(--accent)' : 'transparent',
                    }}
                    title="Regular Size Cards"
                  >
                    Medium
                  </button>
                  <span className="w-px h-3 bg-gray-600/40 mx-0.5" />
                </>
              )}

              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'grid' ? 'shadow-sm' : ''}`}
                style={{
                  background: viewMode === 'grid' ? 'var(--accent-soft)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-dim)',
                }}
                title="Grid / Card View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'table' ? 'shadow-sm' : ''}`}
                style={{
                  background: viewMode === 'table' ? 'var(--accent-soft)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--accent)' : 'var(--text-dim)',
                }}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* CSV Export (Admin only) */}
            {isAdmin && (
              <button
                id="btn-export-users-csv"
                onClick={handleExport}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 hover:opacity-80 transition-colors"
                style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                title="Export enrolled users to CSV (Admin only)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}

            {/* Enroll New User (Admin only) */}
            {isAdmin && (
              <button
                id="btn-gallery-enroll"
                onClick={onOpenEnroll}
                className="px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md"
                style={{ background: 'var(--accent)', color: '#0a0e13' }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Enroll Face</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
          
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-dim)' }} />
            <input
              id="input-user-search"
              type="text"
              placeholder="Search by name, roll number, email, or dept..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border bg-transparent text-xs"
              style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl border bg-transparent text-xs"
              style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl border bg-transparent text-xs"
              style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="staff">Staff / Faculty</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl border bg-transparent text-xs"
              style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="locked">Locked Only (Hold)</option>
              <option value="unlocked">Unlocked Only</option>
            </select>
          </div>
        </div>

        {/* Sorting controls */}
        <div className="flex items-center justify-between text-xs pt-1" style={{ color: 'var(--text-dim)' }}>
          <div className="flex items-center space-x-2">
            <span>Sort by:</span>
            <button
              onClick={() => setSortBy('name')}
              className={`font-semibold hover:underline ${sortBy === 'name' ? 'text-emerald-500' : ''}`}
            >
              Name
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setSortBy('roll')}
              className={`font-semibold hover:underline ${sortBy === 'roll' ? 'text-emerald-500' : ''}`}
            >
              Roll Number
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setSortBy('date')}
              className={`font-semibold hover:underline ${sortBy === 'date' ? 'text-emerald-500' : ''}`}
            >
              Enrolled Date
            </button>
          </div>

          <button
            onClick={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center space-x-1 hover:opacity-80"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="mono uppercase">{sortOrder}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredUsers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <ShieldAlert className="w-10 h-10 mx-auto text-yellow-500" />
          <h3 className="text-base font-bold">No Matching Biometric Records</h3>
          <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-dim)' }}>
            No enrolled subjects match your current search and filter criteria. Try resetting filters or enroll a new user.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDepartment('all');
              setSelectedRole('all');
              setSelectedStatus('all');
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold border"
            style={{ borderColor: 'var(--line)' }}
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid View (Minimized compact 6 to 8-column grid or standard) */
        <div className={
          cardSize === 'mini' 
            ? "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5" 
            : cardSize === 'small' 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3" 
              : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        }>
          {paginatedUsers.map((user, index) => (
            <BiometricCard
              key={user.id}
              user={user}
              index={index}
              onSelect={onSelectUser}
              onQuickAttendance={onQuickAttendance}
              onRequestLockToggle={onRequestLockToggle}
              compact={cardSize !== 'medium'}
              mini={cardSize === 'mini'}
            />
          ))}
        </div>
      ) : (
        /* Paginated Table View */
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b uppercase mono text-[11px]" style={{ borderColor: 'var(--line)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Lock Condition</th>
                  <th className="py-3 px-4">Biometric Vector</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {paginatedUsers.map((user) => {
                  const isLocked = Boolean(user.is_locked);
                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                        isLocked ? 'bg-amber-500/[0.04]' : ''
                      }`} 
                      onClick={() => onSelectUser(user)}
                    >
                      <td className="py-3 px-4 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border flex-shrink-0" style={{ borderColor: isLocked ? '#f59e0b' : 'var(--accent)' }}>
                          {user.photo_url ? (
                            <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold block" style={{ color: 'var(--text)' }}>{user.full_name}</span>
                          <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{user.email || 'No email'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 mono font-medium" style={{ color: isLocked ? '#fbbf24' : 'var(--accent)' }}>
                        {user.roll_number || '—'}
                      </td>
                      <td className="py-3 px-4">{user.department || 'General'}</td>
                      <td className="py-3 px-4 uppercase mono">{user.user_role}</td>
                      <td className="py-3 px-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center text-emerald-500 mono">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-400 mono">
                            <UserX className="w-3 h-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isLocked ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                            <Lock className="w-3 h-3 mr-1 text-amber-400" />
                            Locked (Hold)
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs mono text-gray-400">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 mono text-[11px]">
                        {user.face_descriptor?.length === 128 ? (
                          <span className="text-emerald-500">128-d Vector</span>
                        ) : (
                          <span className="text-yellow-500">Missing</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        {onRequestLockToggle && (
                          <button
                            onClick={() => onRequestLockToggle(user)}
                            className={`p-1.5 rounded border ${
                              isLocked
                                ? 'border-amber-500/35 text-amber-300 hover:bg-amber-500/15'
                                : 'border-gray-500/30 text-gray-400 hover:text-white'
                            }`}
                            title={isLocked ? 'Unlock profile (requires Master Passkey)' : 'Lock profile (requires Master Passkey)'}
                          >
                            {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={() => onSelectUser(user)}
                          className="p-1 rounded border hover:opacity-80"
                          style={{ borderColor: 'var(--line)' }}
                          title="View Full Profile & Vector"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-xl border text-xs" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <span style={{ color: 'var(--text-dim)' }}>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} subjects
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--line)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="mono font-bold px-2">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--line)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
