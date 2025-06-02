import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { wishlists } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AxiosError } from 'axios';
import Markdown from 'react-markdown';
import { DocumentPlusIcon } from '@heroicons/react/24/solid';

interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  url: string | null;
  isPurchased: boolean;
  reservedBy: {
    id: string;
    name: string;
  } | null;
}

interface Wishlist {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  items: Item[];
  user: {
    id: string;
    name: string;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myWishlists, setMyWishlists] = useState<Wishlist[]>([]);
  const [otherWishlists, setOtherWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'other'>('my');

  useEffect(() => {
    const fetchWishlists = async () => {
      try {
        const [myResponse, allResponse] = await Promise.all([
          wishlists.getMyWishlists(),
          wishlists.getAll()
        ]);

        setMyWishlists(myResponse.data);
        // Filter out the current user's wishlists from the "other" list
        setOtherWishlists(allResponse.data.filter((wishlist: Wishlist) => wishlist.user.id !== user?.id));
        setError('');
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        setError(error.response?.data?.message || 'Failed to fetch wishlists');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlists();
  }, [user?.id]);

  const renderWishlistTable = (wishlists: Wishlist[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Items
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {activeTab === 'my' ? 'Last Updated' : 'Created By'}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {wishlists.map((wishlist) => (
            <tr
              key={wishlist.id}
              onClick={() => navigate(`/wishlists/${wishlist.id}`)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{wishlist.name}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-500">
                  <p className="prose prose-sm max-w-none">
                    <Markdown>{wishlist.description}</Markdown>
                  </p>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{wishlist.items.length} items</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {activeTab === 'my'
                    ? new Date(wishlist.updatedAt).toLocaleDateString()
                    : wishlist.user.name}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Home</h1>
          <Link to="/wishlists/new" className="btn-primary">
            <DocumentPlusIcon className="w-5 h-5 mx-[5px]" />
            Create New Wishlist
          </Link>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as 'my' | 'other')}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="my">My Wishlists ({myWishlists.length})</option>
              <option value="other">Other Wishlists ({otherWishlists.length})</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-0" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('my')}
                  className={`${
                    activeTab === 'my'
                      ? 'tab-active'
                      : 'tab-inactive hover:text-gray-700 hover:bg-gray-50'
                  } whitespace-nowrap py-0 px-5 border-b-2 font-medium text-sm`}
                >
                  My Wishlists ({myWishlists.length})
                </button>
                <button
                  onClick={() => setActiveTab('other')}
                  className={`${
                    activeTab === 'other'
                      ? 'tab-active'
                      : 'tab-inactive hover:text-gray-700 hover:bg-gray-50'
                  } whitespace-nowrap py-2 px-5 border-b-2 font-medium text-sm`}
                >
                  Other Wishlists ({otherWishlists.length})
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          {activeTab === 'my' ? renderWishlistTable(myWishlists) : renderWishlistTable(otherWishlists)}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 