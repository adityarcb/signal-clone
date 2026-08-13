'use client';

import { useAppStore } from '@/store/appStore';

export function SettingsPlaceholder() {
  const { currentUser, logout } = useAppStore();
  
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div>
          <h2 className="font-medium text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500">Manage your account and preferences</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6 max-w-xl">
          {/* Profile Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Profile</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <img
                  src={currentUser?.avatar_url || ''}
                  alt={currentUser?.display_name || ''}
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-lg font-medium text-gray-900">{currentUser?.display_name}</p>
                  <p className="text-sm text-gray-500">{currentUser?.phone_number}</p>
                </div>
              </div>
              <button className="mt-4 text-sm text-blue-600 hover:text-blue-700">
                Edit Profile
              </button>
            </div>
          </div>
          
          {/* Account Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account</h3>
            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100">
                <span className="text-sm text-gray-700">Phone Number</span>
                <span className="text-sm text-gray-500">{currentUser?.phone_number}</span>
              </button>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100">
                <span className="text-sm text-gray-700">Change Number</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Appearance Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Appearance</h3>
            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100">
                <span className="text-sm text-gray-700">Theme</span>
                <span className="text-sm text-gray-500">System</span>
              </button>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100">
                <span className="text-sm text-gray-700">Chat Wallpaper</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Notifications Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notifications</h3>
            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Message Notifications</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Show Preview</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Sounds</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
          
          {/* Privacy Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Privacy</h3>
            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100">
                <span className="text-sm text-gray-700">Blocked Contacts</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100">
                <span className="text-sm text-gray-700">Read Receipts</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </button>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100">
                <span className="text-sm text-gray-700">Disappearing Messages</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Linked Devices */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Linked Devices</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                This device (Web) - Active now
              </p>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100">
                <span className="text-sm text-gray-700">Link New Device</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* About Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">About</h3>
            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100">
                <span className="text-sm text-gray-700">Help & Feedback</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100">
                <span className="text-sm text-gray-700">Privacy Policy</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center justify-between p-2 text-left rounded-md hover:bg-gray-100">
                <span className="text-sm text-gray-700">Terms of Service</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Logout */}
          <div className="pt-4 border-t border-gray-200">
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
