import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { users } from '../services/api';
import { AxiosError } from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
}

const AdminPanel: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await users.getAll();
      const allUsers = response.data;
      setPendingUsers(allUsers.filter((user: User) => !user.isApproved));
      setApprovedUsers(allUsers.filter((user: User) => user.isApproved));
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await users.approve(id);
      await fetchUsers();
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to approve user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await users.delete(id);
      await fetchUsers();
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this user? They will be logged out immediately.')) {
      return;
    }

    try {
      await users.deactivate(id);
      await fetchUsers();
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await users.reactivate(id);
      await fetchUsers();
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to reactivate user');
    }
  };

  const handleToggleAdmin = async (id: string) => {
    if (!window.confirm('Are you sure you want to change this user\'s admin status?')) {
      return;
    }

    try {
      await users.toggleAdmin(id);
      await fetchUsers();
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to toggle admin status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <Link to="/dashboard" className="btn-secondary">
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Approvals</h2>
              {pendingUsers.length === 0 ? (
                <p className="text-gray-600">No pending approvals</p>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex justify-between items-center bg-gray-50 p-4 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Registered: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="btn-primary"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn-secondary bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Approved Users</h2>
              {approvedUsers.length === 0 ? (
                <p className="text-gray-600">No approved users</p>
              ) : (
                <div className="space-y-4">
                  {approvedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex justify-between items-center bg-gray-50 p-4 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex space-x-2 text-xs">
                          <span className={`px-2 py-1 rounded-full ${
                            user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </span>
                          <span className={`px-2 py-1 rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {user.isActive ? (
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            className="btn-secondary bg-yellow-600 hover:bg-yellow-700"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(user.id)}
                            className="btn-secondary bg-green-600 hover:bg-green-700"
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleAdmin(user.id)}
                          disabled={user.isAdmin && user.id === currentUser?.id}
                          className={`btn-secondary ${
                            user.isAdmin 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'bg-purple-600 hover:bg-purple-700'
                          } ${
                            user.isAdmin && user.id === currentUser?.id
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          title={user.isAdmin && user.id === currentUser?.id ? "You cannot remove your own admin rights" : ""}
                        >
                          {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 