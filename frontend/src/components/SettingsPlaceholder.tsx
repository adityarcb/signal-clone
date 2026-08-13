'use client';

import { useAppStore } from '@/store/appStore';
import { useToastStore } from '@/store/toastStore';
import { api } from '@/lib/api';
import { useState } from 'react';
import { useTheme } from 'next-themes';

export function SettingsPlaceholder() {
  const { currentUser, token, setUser, logout } = useAppStore();
  const { addToast } = useToastStore();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { theme, setTheme } = useTheme();

  const defaultAvatar = currentUser?.display_name 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.display_name)}&background=3b82f6&color=fff`
    : 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff';

  const handleEditProfile = () => {
    setDisplayName(currentUser?.display_name || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!token || !displayName.trim()) return;
    setIsSaving(true);
    try {
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;
      const updatedUser = await api.updateProfile(displayName, avatarUrl, token);
      setUser(updatedUser);
      addToast('Profile updated', 'success');
      setIsEditing(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-medium text-gray-900 dark:text-gray-100">Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6 max-w-xl">
          {/* Profile Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Profile</h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving || !displayName.trim()}
                      className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="rounded bg-gray-200 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <img
                      src={currentUser?.avatar_url || defaultAvatar}
                      alt={currentUser?.display_name || 'User'}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{currentUser?.display_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser?.phone_number}</p>
                    </div>
                  </div>
                  <button onClick={handleEditProfile} className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Account Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Account</h3>
            <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50">
                <span className="text-sm text-gray-700 dark:text-gray-300">Phone Number</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{currentUser?.phone_number}</span>
              </button>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50">
                <span className="text-sm text-gray-700 dark:text-gray-300">Change Number</span>
                <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Appearance Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Appearance</h3>
            <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50">
                <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="bg-transparent text-sm text-gray-500 dark:text-gray-400 focus:outline-none cursor-pointer"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50">
                <span className="text-sm text-gray-700 dark:text-gray-300">Chat Wallpaper</span>
                <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Notifications Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Notifications</h3>
            <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Message Notifications</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Show Preview</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Sounds</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
          
          {/* Privacy Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Privacy</h3>
            <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50">
                <span className="text-sm text-gray-700 dark:text-gray-300">Blocked Contacts</span>
                <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50">
                <span className="text-sm text-gray-700 dark:text-gray-300">Read Receipts</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                />
              </button>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50">
                <span className="text-sm text-gray-700 dark:text-gray-300">Disappearing Messages</span>
                <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Linked Devices */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Linked Devices</h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                This device (Web) - Active now
              </p>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50">
                <span className="text-sm text-gray-700 dark:text-gray-300">Link New Device</span>
                <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* About Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">About</h3>
            <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50">
                <span className="text-sm text-gray-700 dark:text-gray-300">Help & Feedback</span>
                <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50">
                <span className="text-sm text-gray-700 dark:text-gray-300">Privacy Policy</span>
                <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50">
                <span className="text-sm text-gray-700 dark:text-gray-300">Terms of Service</span>
                <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Logout */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
