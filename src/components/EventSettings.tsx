import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import DatePicker from './form/date-picker';

interface ScannerUser {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
}

interface ScannerAssignment {
  id: number;
  user_id: number;
  role: 'primary' | 'secondary';
  is_active: boolean;
  assigned_at: string;
  user: ScannerUser;
}

interface EventSettingsProps {
  eventId: number;
  initialSettings: {
    notification_date?: string;
  };
  onSuccess?: () => void;
}

const EventSettings: React.FC<EventSettingsProps> = ({ eventId, initialSettings, onSuccess }) => {
  const [settings, setSettings] = useState({
    notification_date: '',
    notification_time: '',
  });
  
  const [scannerUsers, setScannerUsers] = useState<ScannerUser[]>([]);
  const [currentScanners, setCurrentScanners] = useState<ScannerAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingScanners, setLoadingScanners] = useState(false);
  const [loadingCurrentScanners, setLoadingCurrentScanners] = useState(false);
  const [defaultNotificationDate, setDefaultNotificationDate] = useState<Date | undefined>();

  // Ensure currentScanners is always an array
  const safeCurrentScanners = Array.isArray(currentScanners) ? currentScanners : [];

  useEffect(() => {
    // Extract date and time from notification_date if it exists
    if (initialSettings.notification_date) {
      const dateTimeString = initialSettings.notification_date;
      const [datePart, timePart] = dateTimeString.split('T');
      const timeString = timePart ? timePart.slice(0, 5) : '';
      
      setSettings(prev => ({
        ...prev,
        notification_date: datePart || '',
        notification_time: timeString
      }));
      
      if (datePart) {
        const [year, month, day] = datePart.split('-').map(Number);
        const defaultDate = new Date(year, month - 1, day);
        setDefaultNotificationDate(defaultDate);
      }
    }
    
    // Load scanner users and current assignments
    loadScannerUsers();
    loadCurrentScanners();
  }, [initialSettings.notification_date, eventId]);

  const loadScannerUsers = async () => {
    setLoadingScanners(true);
    try {
      const users = await apiService.getScannerUsers();
      setScannerUsers(users);
    } catch (error) {
      console.error('Error loading scanner users:', error);
      setError('Failed to load scanner users');
    } finally {
      setLoadingScanners(false);
    }
  };

  const loadCurrentScanners = async () => {
    setLoadingCurrentScanners(true);
    try {
      const response = await apiService.getEventScanners(eventId);
      console.log('getEventScanners response:', response);
      
      // Handle different response structures
      let scanners: ScannerAssignment[] = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          scanners = response as ScannerAssignment[];
        } else if ('data' in response && Array.isArray((response as any).data)) {
          scanners = (response as any).data as ScannerAssignment[];
        } else if ('scanners' in response && Array.isArray((response as any).scanners)) {
          scanners = (response as any).scanners as ScannerAssignment[];
        }
      }
      
      console.log('Parsed scanners:', scanners);
      setCurrentScanners(scanners);
    } catch (error) {
      console.error('Error loading current scanners:', error);
      // Set empty array on error to prevent filter errors
      setCurrentScanners([]);
    } finally {
      setLoadingCurrentScanners(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = useCallback((selectedDates: Date[], dateStr: string) => {
    if (selectedDates.length > 0) {
      setSettings(prev => ({
        ...prev,
        notification_date: dateStr
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        notification_date: ''
      }));
    }
  }, []);

  const addScanner = async (userId: number, role: 'primary' | 'secondary') => {
    try {
      await apiService.assignEventScanner(eventId, { user_id: userId, role });
      setSuccess(`Scanner assigned successfully as ${role}`);
      loadCurrentScanners(); // Refresh the list
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to assign scanner');
      setTimeout(() => setError(''), 5000);
    }
  };

  const updateScannerRole = async (scannerId: number, newRole: 'primary' | 'secondary') => {
    try {
      await apiService.updateEventScannerRole(eventId, scannerId, { role: newRole });
      setSuccess('Scanner role updated successfully');
      loadCurrentScanners(); // Refresh the list
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to update scanner role');
      setTimeout(() => setError(''), 5000);
    }
  };

  const deactivateScanner = async (scannerId: number) => {
    try {
      await apiService.deactivateEventScanner(eventId, scannerId);
      setSuccess('Scanner deactivated successfully');
      loadCurrentScanners(); // Refresh the list
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to deactivate scanner');
      setTimeout(() => setError(''), 5000);
    }
  };

  const reactivateScanner = async (scannerId: number) => {
    try {
      await apiService.reactivateEventScanner(eventId, scannerId);
      setSuccess('Scanner reactivated successfully');
      loadCurrentScanners(); // Refresh the list
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to reactivate scanner');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let notificationDateTime = null;
      if (settings.notification_date && settings.notification_time) {
        notificationDateTime = `${settings.notification_date}T${settings.notification_time}:00`;
      }

      const updateData = {
        notification_date: notificationDateTime,
      };

      await apiService.updateEvent(eventId, updateData);

      setSuccess('Event settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating event settings:', error);
      setError(error.message || 'Failed to update event settings');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableScanners = () => {
    const assignedUserIds = safeCurrentScanners.map(s => s.user_id);
    return scannerUsers.filter(user => !assignedUserIds.includes(user.id));
  };

  const getPrimaryScanner = () => {
    return safeCurrentScanners.find(s => s.role === 'primary' && s.is_active);
  };

  const getSecondaryScanners = () => {
    return safeCurrentScanners.filter(s => s.role === 'secondary' && s.is_active);
  };

  const getInactiveScanners = () => {
    return safeCurrentScanners.filter(s => !s.is_active);
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notification Date and Time */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DatePicker
                id="notification-date"
                label="Notification Date"
                placeholder="Select notification date"
                defaultDate={defaultNotificationDate}
                onChange={handleDateChange}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Date when notifications will be sent to guests
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notification Time
              </label>
              <input
                type="time"
                value={settings.notification_time}
                onChange={(e) => handleInputChange('notification_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Time when notifications will be sent to guests
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button for Notification Settings */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>
      </form>

      {/* Scanner Management Section */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Scanner Management</h3>
          <div className="text-sm text-gray-500">
            {safeCurrentScanners.filter(s => s.is_active).length} active scanner(s)
          </div>
        </div>

        {/* Add New Scanner */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Add New Scanner</h4>
          {loadingScanners ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
              <span className="text-sm text-gray-500">Loading available scanners...</span>
            </div>
          ) : getAvailableScanners().length > 0 ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Scanner
                  </label>
                  <select
                    id="new-scanner-select"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Choose a scanner...</option>
                    {getAvailableScanners().map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    id="new-scanner-role"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="secondary">Secondary</option>
                    <option value="primary">Primary</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    const select = document.getElementById('new-scanner-select') as HTMLSelectElement;
                    const roleSelect = document.getElementById('new-scanner-role') as HTMLSelectElement;
                    const userId = parseInt(select.value);
                    const role = roleSelect.value as 'primary' | 'secondary';
                    
                    if (userId && role) {
                      addScanner(userId, role);
                      select.value = '';
                      roleSelect.value = 'secondary';
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Add Scanner
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No available scanners to assign. All scanner users are already assigned to this event.
            </p>
          )}
        </div>

        {/* Current Scanners */}
        <div className="space-y-4">
          {loadingCurrentScanners ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : safeCurrentScanners.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No scanners assigned to this event yet.</p>
              <p className="text-sm mt-1">Add scanners above to get started.</p>
            </div>
          ) : (
            <>
              {/* Primary Scanner */}
              {getPrimaryScanner() && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Primary Scanner
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getPrimaryScanner()?.user.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getPrimaryScanner()?.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateScannerRole(getPrimaryScanner()!.id, 'secondary')}
                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Make Secondary
                      </button>
                      <button
                        onClick={() => deactivateScanner(getPrimaryScanner()!.id)}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Secondary Scanners */}
              {getSecondaryScanners().map((scanner) => (
                <div key={scanner.id} className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        Secondary Scanner
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {scanner.user.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {scanner.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateScannerRole(scanner.id, 'primary')}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Make Primary
                      </button>
                      <button
                        onClick={() => deactivateScanner(scanner.id)}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Inactive Scanners */}
              {getInactiveScanners().map((scanner) => (
                <div key={scanner.id} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        {scanner.role === 'primary' ? 'Primary' : 'Secondary'} Scanner (Inactive)
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {scanner.user.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {scanner.user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => reactivateScanner(scanner.id)}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Reactivate
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {scannerUsers.length === 0 && !loadingScanners && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>No scanner users found.</strong> Please create users with scanner role first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSettings; 