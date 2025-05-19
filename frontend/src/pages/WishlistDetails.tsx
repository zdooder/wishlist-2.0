import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { wishlists, items } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AxiosError } from 'axios';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

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
  comments: Comment[];
  newComment?: string;
  imageUrl?: string;
  imageData?: string;
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

const WishlistDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    url: '',
    imageUrl: '',
    imageData: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [itemComments, setItemComments] = useState<{ [key: string]: string }>({});
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await wishlists.getById(id!);
        setWishlist(response.data);
        // Initialize comment fields for each item
        const initialComments: { [key: string]: string } = {};
        response.data.items.forEach((item: Item) => {
          initialComments[item.id] = '';
        });
        setItemComments(initialComments);
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        setError(error.response?.data?.message || 'Failed to fetch wishlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [id]);

  const handleImagePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError('Image size should be less than 5MB');
          return;
        }

        try {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setNewItem(prev => ({ ...prev, imageData: base64, imageUrl: '' }));
            setImagePreview(base64);
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.log(`error processing pasted image: ${error}`);
          setError('Failed to process pasted image');
        }
        break;
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setNewItem(prev => ({ ...prev, imageData: base64, imageUrl: '' }));
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.log(`error processing image: ${error}`);
      setError('Failed to process image');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await items.create({
        wishlistId: id!,
        name: newItem.name,
        description: newItem.description,
        price: newItem.price ? parseFloat(newItem.price) : 0,
        url: newItem.url,
        imageUrl: newItem.imageUrl,
        imageData: newItem.imageData
      });
      setWishlist(prev => prev ? {
        ...prev,
        items: [...prev.items, { ...data, comments: [] }]
      } : null);
      setNewItem({
        name: '',
        description: '',
        price: '',
        url: '',
        imageUrl: '',
        imageData: ''
      });
      setImagePreview(null);
      setShowAddItemForm(false);
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to add item');
    }
  };

  const handleAddComment = async (itemId: string) => {
    try {
      const { data } = await items.addComment(itemId, { content: itemComments[itemId] });
      setWishlist(prev => prev ? {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId
            ? { ...item, comments: [...(item.comments || []), data] }
            : item
        )
      } : null);
      setItemComments(prev => ({
        ...prev,
        [itemId]: ''
      }));
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleReserveItem = async (itemId: string) => {
    try {
      const { data } = await items.reserve(itemId);
      setWishlist(prev => prev ? {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId
            ? { ...item, reservedBy: data.reservedBy }
            : item
        )
      } : null);
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to reserve item');
    }
  };

  const handleMarkAsPurchased = async (itemId: string) => {
    try {
      const { data } = await items.markAsPurchased(itemId);
      setWishlist(prev => prev ? {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId
            ? { ...item, isPurchased: true, reservedBy: data.reservedBy }
            : item
        )
      } : null);
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to mark item as purchased');
    }
  };

  const handleClearReservation = async (itemId: string) => {
    try {
      await items.clearReservation(itemId);
      setWishlist(prev => prev ? {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId
            ? { ...item, reservedBy: null }
            : item
        )
      } : null);
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to clear reservation');
    }
  };

  const handleClearPurchase = async (itemId: string) => {
    try {
      await items.clearPurchase(itemId);
      setWishlist(prev => prev ? {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId
            ? { ...item, isPurchased: false }
            : item
        )
      } : null);
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to clear purchase status');
    }
  };

  const handleDeleteClick = (item: Item) => {
    setItemToDelete(item);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      await items.delete(itemToDelete.id);
      setWishlist(prev => prev ? {
        ...prev,
        items: prev.items.filter(item => item.id !== itemToDelete.id)
      } : null);
      setItemToDelete(null);
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleDeleteCancel = () => {
    setItemToDelete(null);
  };

  const handleEditComment = async (itemId: string, commentId: string, content: string) => {
    try {
      const { data } = await items.updateComment(itemId, commentId, { content });
      setWishlist(prev => prev ? {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId
            ? {
                ...item,
                comments: item.comments.map(comment =>
                  comment.id === commentId ? data : comment
                )
              }
            : item
        )
      } : null);
      setEditingComment(null);
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (itemId: string, commentId: string) => {
    try {
      await items.deleteComment(itemId, commentId);
      setWishlist(prev => prev ? {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId
            ? {
                ...item,
                comments: item.comments.filter(comment => comment.id !== commentId)
              }
            : item
        )
      } : null);
      setError('');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to delete comment');
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

  if (!wishlist) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Wishlist not found</h2>
            <Link to="/dashboard" className="btn-primary mt-4 inline-block">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === wishlist.user.id;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{wishlist.name}</h1>
            <p className="text-gray-600 mt-1">{wishlist.description}</p>
            <p className="text-sm text-gray-500 mt-2">
              Created by {wishlist.user.name}
            </p>
          </div>
          <div className="flex space-x-4">
            {isOwner && (
              <button
                onClick={() => setShowAddItemForm(!showAddItemForm)}
                className="btn-primary"
              >
                {showAddItemForm ? 'Cancel' : 'Add Item'}
              </button>
            )}
            <Link to="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isOwner && showAddItemForm && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Item</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price
                </label>
                <input
                  type="number"
                  id="price"
                  value={newItem.price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                  step="0.01"
                  min="0"
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  Item URL
                </label>
                <input
                  type="url"
                  id="url"
                  value={newItem.url}
                  onChange={(e) => setNewItem(prev => ({ ...prev, url: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                  Image URL or Paste Image
                </label>
                <input
                  type="text"
                  id="imageUrl"
                  value={newItem.imageUrl}
                  onChange={(e) => {
                    setNewItem(prev => ({ ...prev, imageUrl: e.target.value, imageData: '' }));
                    setImagePreview(null);
                  }}
                  onPaste={handleImagePaste}
                  placeholder="Enter image URL or paste an image"
                  className="input-field"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setNewItem(prev => ({ ...prev, imageData: '' }));
                      }}
                      className="mt-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700">
                  Or Upload Image
                </label>
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddItemForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Item
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {wishlist.items.map((item) => (
            <div key={item.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                  <p className="text-gray-600 mt-1">{item.description}</p>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 mt-1 inline-block"
                    >
                      View Item
                    </a>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {item.price && (
                    <div className="text-lg font-medium text-gray-900">
                      ${item.price.toFixed(2)}
                    </div>
                  )}
                  {item.reservedBy && !item.isPurchased && (
                    <span className="px-2 py-1 text-sm rounded bg-yellow-100 text-yellow-800 flex items-center">
                      Reserved by {item.reservedBy.name}
                      {item.reservedBy.id === user?.id && (
                        <button
                          onClick={() => handleClearReservation(item.id)}
                          className="ml-1.5 text-yellow-800 hover:text-yellow-900 bg-transparent p-0.5"
                          title="Clear reservation"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  )}
                  {item.isPurchased && (
                    <span className="px-2 py-1 text-sm rounded bg-green-100 text-green-800 flex items-center">
                      Purchased
                      {item.reservedBy?.id === user?.id && (
                        <button
                          onClick={() => handleClearPurchase(item.id)}
                          className="ml-1.5 text-green-800 hover:text-green-900 bg-transparent p-0.5"
                          title="Clear purchase status"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {item.imageData && (
                <div className="mt-4">
                  <img
                    src={item.imageData}
                    alt={item.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="flex space-x-2 mt-4">
                {!isOwner && !item.reservedBy && !item.isPurchased && (
                  <button
                    onClick={() => handleReserveItem(item.id)}
                    className="btn-secondary"
                  >
                    Reserve Item
                  </button>
                )}

                {!item.isPurchased && (
                  <button
                    onClick={() => handleMarkAsPurchased(item.id)}
                    className="btn-secondary"
                  >
                    Mark as Purchased
                  </button>
                )}

                {isOwner && (
                  <button
                    onClick={() => handleDeleteClick(item)}
                    className="btn-secondary bg-red-600 hover:bg-red-700"
                  >
                    Delete Item
                  </button>
                )}
              </div>

              {!isOwner && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Comments</h4>
                  <div className="mt-2 space-y-2">
                    {item.comments && item.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-2 rounded">
                        {editingComment?.id === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingComment.content}
                              onChange={(e) => setEditingComment(prev => prev ? { ...prev, content: e.target.value } : null)}
                              className="input-field w-full"
                              rows={2}
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setEditingComment(null)}
                                className="text-sm text-gray-600 hover:text-gray-800 bg-transparent"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleEditComment(item.id, comment.id, editingComment.content)}
                                className="text-sm text-blue-600 hover:text-blue-800 bg-transparent"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-900">{comment.content}</p>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-xs text-gray-500">
                                {comment.user.name} • {new Date(comment.createdAt).toLocaleDateString()}
                              </p>
                              {comment.user.id === user?.id && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setEditingComment({ id: comment.id, content: comment.content })}
                                    className="text-xs text-blue-600 hover:text-blue-800 bg-transparent"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(item.id, comment.id)}
                                    className="text-xs text-red-600 hover:text-red-800 bg-transparent"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <textarea
                      value={itemComments[item.id] || ''}
                      onChange={(e) => setItemComments(prev => ({
                        ...prev,
                        [item.id]: e.target.value
                      }))}
                      placeholder="Add a comment..."
                      className="input-field"
                    />
                    <button
                      onClick={() => handleAddComment(item.id)}
                      disabled={!itemComments[item.id]?.trim()}
                      className="btn-secondary mt-2"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Item
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{itemToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleDeleteCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn-secondary bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistDetails; 