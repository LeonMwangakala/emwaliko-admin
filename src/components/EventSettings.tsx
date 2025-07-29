import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import DatePicker from './form/date-picker';

interface ScannerUser {
  id: number;
  name: string;
  email: string;
  phone_number: string;
}

interface EventSettingsProps {
  eventId: number;
  initialSettings: {
    notification_date?: string;
    scanner_person?: string;
  };
  onSuccess?: () => void;
}

const EventSettings: React.FC<EventSettingsProps> = ({ eventId, initialSettings, onSuccess }) => {
  const [settings, setSettings] = useState({
    notification_date: '',
    notification_time: '',
    scanner_person: initialSettings.scanner_person || '',
  });
  const [scannerUsers, setScannerUsers] = useState<ScannerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingScanners, setLoadingScanners] = useState(false);
  const [defaultNotificationDate, setDefaultNotificationDate] = useState<Date | undefined>();

  useEffect(() => {
    // Extract date and time from notification_date if it exists
    if (initialSettings.notification_date) {
      // Parse the raw date string directly without timezone conversion
      const dateTimeString = initialSettings.notification_date;
      const [datePart, timePart] = dateTimeString.split('T');
      const timeString = timePart ? timePart.slice(0, 5) : ''; // HH:MM format
      
      setSettings(prev => ({
        ...prev,
        notification_date: datePart || '',
        notification_time: timeString
      }));
      
      // Set default date for the date picker (parse as local date)
      if (datePart) {
        const [year, month, day] = datePart.split('-').map(Number);
        const defaultDate = new Date(year, month - 1, day); // month is 0-indexed
        setDefaultNotificationDate(defaultDate);
      }
    }
    
    // Load scanner users
    loadScannerUsers();
  }, [initialSettings.notification_date]);

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

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = useCallback((selectedDates: Date[], dateStr: string, instance: any) => {
    if (selectedDates.length > 0) {
      // Use the raw date string from flatpickr (already in YYYY-MM-DD format)
      setSettings(prev => ({
        ...prev,
        notification_date: dateStr
      }));
    } else {
      // Clear the date if no date is selected
      setSettings(prev => ({
        ...prev,
        notification_date: ''
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Combine date and time as raw values without timezone conversion
      let notificationDateTime = null;
      if (settings.notification_date && settings.notification_time) {
        // Create raw date time string in YYYY-MM-DDTHH:MM:SS format
        notificationDateTime = `${settings.notification_date}T${settings.notification_time}:00`;
      }

      const updateData = {
        notification_date: notificationDateTime,
        scanner_person: settings.scanner_person,
      };

      await apiService.updateEvent(eventId, updateData);

      setSuccess('Event settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      onSuccess?.(); // Call the onSuccess prop
    } catch (error: any) {
      console.error('Error updating event settings:', error);
      setError(error.message || 'Failed to update event settings');
    } finally {
      setLoading(false);
    }
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

        {/* Scanner Person */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Scanner Settings</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scanner Person
            </label>
            {loadingScanners ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
                <span className="text-sm text-gray-500">Loading scanners...</span>
              </div>
            ) : (
              <select
                value={settings.scanner_person}
                onChange={(e) => handleInputChange('scanner_person', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select a scanner</option>
                {scannerUsers.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This person will be responsible for scanning guest QR codes at the event
            </p>
            {scannerUsers.length === 0 && !loadingScanners && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                No scanner users found. Please create users with scanner role first.
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventSettings; 