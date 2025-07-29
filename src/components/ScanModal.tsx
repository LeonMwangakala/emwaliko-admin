import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Guest {
  id: number;
  name: string;
  title?: string;
  phone_number?: string;
  invite_code: string;
  card_class?: {
    id: number;
    name: string;
    max_guests: number;
  };
}

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: number;
}

const ScanModal: React.FC<ScanModalProps> = ({ isOpen, onClose, onSuccess, eventId }) => {
  const [qrCode, setQrCode] = useState('');
  const [guest, setGuest] = useState<Guest | null>(null);
  const [scannedBy, setScannedBy] = useState<number | null>(null);
  const [scanners, setScanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadScanners();
    }
  }, [isOpen]);

  const loadScanners = async () => {
    try {
      const response: { id: number; name: string }[] = await apiService.getScannerUsers();
      setScanners(response);
      if (response.length > 0) {
        setScannedBy(response[0].id);
      }
    } catch (error) {
      console.error('Error loading scanners:', error);
    }
  };

  const handleQrCodeSubmit = async () => {
    if (!qrCode.trim()) {
      setError('Please enter a QR code');
      return;
    }

    setLoading(true);
    setError('');
    setGuest(null);

    try {
      const response = await apiService.getGuestByQrCode(eventId, qrCode.trim()) as { guest: Guest };
      setGuest(response.guest);
    } catch (error: any) {
      setError(error.message || 'Guest not found');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSubmit = async () => {
    if (!guest || !scannedBy) {
      setError('Please select a scanner');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.createScan(eventId, {
        guest_id: guest.id,
        scanned_by: scannedBy,
      });

      setSuccess('Scan recorded successfully!');
      setGuest(null);
      setQrCode('');
      
      // Call onSuccess to refresh the scans list
      onSuccess();

      // Clear success message after 2 seconds
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to record scan');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQrCode('');
    setGuest(null);
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[999999]">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 relative z-10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Scan Guest</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* QR Code Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            QR Code / Invite Code
          </label>
          <div className="flex">
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Enter QR code or invite code"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleQrCodeSubmit()}
            />
            <button
              onClick={handleQrCodeSubmit}
              disabled={loading}
              className="px-4 py-2 bg-brand-500 text-white rounded-r-md hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Guest Information */}
        {guest && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Guest Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{guest.title} {guest.name}</span>
              </div>
              {guest.phone_number && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{guest.phone_number}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Card Class:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{guest.card_class?.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Max Guests:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{guest.card_class?.max_guests}</span>
              </div>
            </div>
          </div>
        )}

        {/* Scan Details */}
        {guest && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scanned By
              </label>
              <select
                value={scannedBy || ''}
                onChange={(e) => setScannedBy(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select a scanner</option>
                {scanners.map((scanner) => (
                  <option key={scanner.id} value={scanner.id}>
                    {scanner.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleScanSubmit}
                disabled={loading || !scannedBy}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Recording...' : 'Record Scan'}
              </button>
              <button
                onClick={() => {
                  setGuest(null);
                  setQrCode('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">Instructions:</h4>
          <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Enter the QR code or invite code from the guest's card</li>
            <li>• Verify guest information is correct</li>
            <li>• Select the scanner performing the scan</li>
            <li>• Click "Record Scan" to save</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScanModal; 