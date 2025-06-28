"use client";
import { useEffect, useState } from "react";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import React from "react";

export default function UserListPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { loading: profileLoading, profile } = useRequireProfile();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>("create");
  const [formData, setFormData] = useState<any>({ email: '', username: '', name: '', dob: '', gender: '' });
  const [editingUserEmail, setEditingUserEmail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const res = await fetch("/api/user/list");
      const data = await res.json();
      setUsers(data.users || []);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleDelete = async (email: string) => {
    if (!window.confirm(`Delete user ${email}?`)) return;
    setDeleting(email);
    await fetch("/api/user/list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setUsers(users => users.filter(u => u.email !== email));
    setDeleting(null);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setFormData({ email: '', username: '', name: '', dob: '', gender: '' });
    setShowModal(true);
    setEditingUserEmail(null);
  };

  const openEditModal = (user: any) => {
    setModalMode("edit");
    setFormData({ ...user });
    setShowModal(true);
    setEditingUserEmail(user.email);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ email: '', username: '', name: '', dob: '', gender: '' });
    setEditingUserEmail(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const res = await fetch('/api/user/list', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Error');
        setSaving(false);
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      closeModal();
    } catch (err) {
      alert('Error saving user');
    }
    setSaving(false);
  };

  if (profileLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-6">Registered Users</h1>
      <button
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        onClick={openCreateModal}
      >
        + Create User
      </button>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded">
            <thead>
              <tr className="bg-[#49C5B6] text-white">
                <th className="py-2 px-4 border">Email</th>
                <th className="py-2 px-4 border">Username</th>
                <th className="py-2 px-4 border">Name</th>
                <th className="py-2 px-4 border">DOB</th>
                <th className="py-2 px-4 border">Gender</th>
                <th className="py-2 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={idx} className="border-t">
                  <td className="py-2 px-4 border">{user.email}</td>
                  <td className="py-2 px-4 border">{user.username}</td>
                  <td className="py-2 px-4 border">{user.name}</td>
                  <td className="py-2 px-4 border">{user.dob}</td>
                  <td className="py-2 px-4 border">{user.gender}</td>
                  <td className="py-2 px-4 border flex gap-2">
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                      onClick={() => handleDelete(user.email)}
                      disabled={deleting === user.email}
                    >
                      {deleting === user.email ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal for create/edit user */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg min-w-[320px]">
            <h2 className="text-xl font-bold mb-4">{modalMode === 'create' ? 'Create User' : 'Edit User'}</h2>
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <input
                className="border px-3 py-2 rounded"
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleFormChange}
                required
                disabled={modalMode === 'edit'}
              />
              <input
                className="border px-3 py-2 rounded"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleFormChange}
                required
              />
              <input
                className="border px-3 py-2 rounded"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
              <input
                className="border px-3 py-2 rounded"
                name="dob"
                type="date"
                placeholder="DOB"
                value={formData.dob}
                onChange={handleFormChange}
                required
              />
              <select
                className="border px-3 py-2 rounded"
                name="gender"
                value={formData.gender}
                onChange={handleFormChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? (modalMode === 'create' ? 'Creating...' : 'Saving...') : (modalMode === 'create' ? 'Create' : 'Save')}
                </button>
                <button
                  type="button"
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 