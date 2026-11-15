import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Shield,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Lock,
  Mail
} from 'lucide-react';

export default function AdminUsers() {
  const { session, user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create User Form
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'Supervisor',
    designation: 'Overman / Sirdar',
    mine_section: 'Colliery Sec-1'
  });

  // Edit User Form
  const [editForm, setEditForm] = useState({
    full_name: '',
    role: 'Supervisor',
    designation: '',
    mine_section: '',
    is_active: true
  });

  const roles = ['Admin', 'Mine Manager', 'Shift In-charge', 'Supervisor'];

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const res = await fetch('/api/admin/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch personnel list.');
      }

      const result = await res.json();
      setUsers(result.data || []);
    } catch (err) {
      console.warn('[AdminUsers] Fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [session]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(createForm)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to create user account.');

      setSuccess(result.message);
      setShowCreateModal(false);
      setCreateForm({
        email: '',
        password: '',
        full_name: '',
        role: 'Supervisor',
        designation: 'Overman / Sirdar',
        mine_section: 'Colliery Sec-1'
      });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setEditForm({
      full_name: u.full_name || '',
      role: u.role || 'Supervisor',
      designation: u.designation || '',
      mine_section: u.mine_section || '',
      is_active: u.is_active !== false
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editForm)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to update user profile.');

      setSuccess(result.message);
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Mine Manager':
        return 'bg-blue-50 text-primary border-blue-200';
      case 'Shift In-charge':
        return 'bg-emerald-50 text-status-success border-emerald-200';
      case 'Supervisor':
      default:
        return 'bg-slate-100 text-slateText-secondary border-borderLight';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-borderLight rounded p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            <span className="text-xs font-semibold text-slateText-muted uppercase tracking-wider">
              System Administration
            </span>
          </div>
          <h1 className="text-xl font-bold text-slateText">
            Mine Personnel & Access Control
          </h1>
          <p className="text-xs text-slateText-secondary mt-1">
            Manage colliery staff credentials, designations, and role-based statutory permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="text-slateText-secondary hover:text-slateText p-2 rounded hover:bg-background border border-borderLight transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded text-xs font-medium transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Personnel</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-status-success flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded text-xs text-status-danger flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Personnel Table */}
      <div className="bg-white border border-borderLight rounded overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slateText-secondary space-y-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Loading colliery personnel roster...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Users className="w-8 h-8 text-slateText-muted mx-auto" />
            <p className="text-xs font-semibold text-slateText">No user profiles found</p>
            <p className="text-[11px] text-slateText-secondary">
              Configure Supabase Auth and add colliery personnel.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-borderLight bg-slate-50 text-slateText-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Personnel Name</th>
                  <th className="py-3 px-4 font-semibold">System Role</th>
                  <th className="py-3 px-4 font-semibold">Designation</th>
                  <th className="py-3 px-4 font-semibold">Assigned Section</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slateText">
                          {u.full_name}
                          {isCurrent && (
                            <span className="ml-1.5 px-1.5 py-0.2 bg-blue-100 text-primary text-[10px] rounded font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slateText-muted mt-0.5">
                          {u.email !== '—' ? u.email : `ID: ${u.id.substring(0, 8)}...`}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadge(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slateText">
                        {u.designation || 'Staff'}
                      </td>
                      <td className="py-3 px-4 text-slateText-secondary">
                        {u.mine_section || 'General'}
                      </td>
                      <td className="py-3 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-status-success font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slateText-muted font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            <span>Deactivated</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slateText-secondary hover:text-primary rounded hover:bg-white border border-transparent hover:border-borderLight transition-colors"
                          title="Edit personnel profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Personnel */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-lg border border-borderLight shadow-lg max-w-lg w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-borderLight pb-3">
              <h3 className="text-sm font-bold text-slateText">
                Add Colliery Personnel Account
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slateText-muted hover:text-slateText p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slateText mb-1">
                    Email Address <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="user@colliery.in"
                    className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slateText mb-1">
                    Password <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slateText mb-1">
                  Full Name <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slateText mb-1">
                    System Role <span className="text-status-danger">*</span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-borderLight rounded bg-white text-xs text-slateText focus:outline-none focus:border-primary"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slateText mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={createForm.designation}
                    onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                    placeholder="e.g. Overman, Sirdar, Manager"
                    className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slateText mb-1">
                  Mine Section / District
                </label>
                <input
                  type="text"
                  value={createForm.mine_section}
                  onChange={(e) => setCreateForm({ ...createForm, mine_section: e.target.value })}
                  placeholder="e.g. Colliery Sec-1, Panel A"
                  className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-borderLight">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 border border-borderLight rounded text-xs text-slateText hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white rounded text-xs font-medium"
              >
                {actionLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Personnel Profile */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
          <form
            onSubmit={handleEditUser}
            className="bg-white rounded-lg border border-borderLight shadow-lg max-w-lg w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-borderLight pb-3">
              <h3 className="text-sm font-bold text-slateText">
                Edit Personnel Profile
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slateText-muted hover:text-slateText p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-slateText mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slateText mb-1">
                    System Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-borderLight rounded bg-white text-xs text-slateText focus:outline-none focus:border-primary"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slateText mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slateText mb-1">
                  Mine Section
                </label>
                <input
                  type="text"
                  value={editForm.mine_section}
                  onChange={(e) => setEditForm({ ...editForm, mine_section: e.target.value })}
                  className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_toggle"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="rounded border-borderLight text-primary focus:ring-0"
                />
                <label htmlFor="is_active_toggle" className="text-xs text-slateText select-none">
                  Account Active (Uncheck to suspend login access)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-borderLight">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-3 py-1.5 border border-borderLight rounded text-xs text-slateText hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white rounded text-xs font-medium"
              >
                {actionLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
