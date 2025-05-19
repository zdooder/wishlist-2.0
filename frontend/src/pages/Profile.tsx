import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { users } from '../services/api';
import { AxiosError } from 'axios';

interface BlockedUser {
  blockedUser: {
    id: string;
    name: string;
    email: string;
  };
}

interface Profile {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isApproved: boolean;
  blockedUsers: BlockedUser[];
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockEmail, setBlockEmail] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await users.getProfile();
        setProfile(response.data);
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        setError(error.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleBlockUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await users.block(blockEmail);
      const response = await users.getProfile();
      setProfile(response.data);
      setBlockEmail('');
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await users.unblock(userId);
      const response = await users.getProfile();
      setProfile(response.data);
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to unblock user');
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Profile not found</h2>
            <Link to="/dashboard" className="btn-primary mt-4 inline-block">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-gray-900">{profile.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-gray-900">{profile.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-gray-900">{profile.isAdmin ? 'Admin' : 'User'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-gray-900">
                    {profile.isApproved ? 'Approved' : 'Pending Approval'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Blocked Users</h2>
              <form onSubmit={handleBlockUser} className="mb-4">
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={blockEmail}
                    onChange={(e) => setBlockEmail(e.target.value)}
                    placeholder="Enter email to block"
                    className="input-field flex-1"
                    required
                  />
                  <button type="submit" className="btn-secondary">
                    Block
                  </button>
                </div>
              </form>

              {profile.blockedUsers.length === 0 ? (
                <p className="text-gray-600">No blocked users</p>
              ) : (
                <div className="space-y-2">
                  {profile.blockedUsers.map((block) => (
                    <div
                      key={block.blockedUser.id}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {block.blockedUser.name}
                        </p>
                        <p className="text-sm text-gray-500">{block.blockedUser.email}</p>
                      </div>
                      <button
                        onClick={() => handleUnblockUser(block.blockedUser.id)}
                        className="btn-secondary bg-red-600 hover:bg-red-700"
                      >
                        Unblock
                      </button>
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

export default Profile; 