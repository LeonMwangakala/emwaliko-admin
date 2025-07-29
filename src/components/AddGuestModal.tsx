import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import PhoneInput from './form/input/PhoneInput';
import { PhoneValidationResult } from '../utils/phoneValidation';

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
  eventId: number;
  guest?: {
    id: number;
    name: string;
    title?: string;
    phone_number?: string;
    card_class_id: number;
  } | null;
}

interface CardClass {
  id: number;
  name: string;
}

const AddGuestModal: React.FC<AddGuestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  eventId,
  guest
}) => {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    phone_number: '',
    card_class_id: ''
  });
  const [cardClasses, setCardClasses] = useState<CardClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCardClasses, setLoadingCardClasses] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<PhoneValidationResult>({
    isValid: false,
    normalized: null,
    error: null,
    country: null,
    type: null
  });

  useEffect(() => {
    if (isOpen) {
      fetchCardClasses();
      if (guest) {
        setFormData({
          name: guest.name || '',
          title: guest.title || '',
          phone_number: guest.phone_number || '',
          card_class_id: guest.card_class_id ? String(guest.card_class_id) : ''
        });
      } else {
        setFormData({
          name: '',
          title: '',
          phone_number: '',
          card_class_id: ''
        });
      }
    }
  }, [isOpen, guest]);

  const fetchCardClasses = async () => {
    setLoadingCardClasses(true);
    try {
      const response = await apiService.getCardClasses();
      setCardClasses(response as CardClass[]);
    } catch (error) {
      console.error('Error fetching card classes:', error);
      onError('Failed to fetch card classes');
    } finally {
      setLoadingCardClasses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      onError('Guest name is required');
      return;
    }

    if (!formData.phone_number.trim()) {
      onError('Phone number is required');
      return;
    }

    if (!phoneValidation.isValid) {
      onError('Please enter a valid phone number');
      return;
    }

    if (!formData.card_class_id) {
      onError('Card class is required');
      return;
    }

    setLoading(true);

    try {
      // Check for phone number uniqueness if creating a new guest
      if (!guest) {
        const guestsRes = await apiService.getEventGuests(eventId);
        let existingPhoneNumbers: string[] = [];
        if (guestsRes && typeof guestsRes === 'object' && 'data' in guestsRes) {
          existingPhoneNumbers = (guestsRes as any).data.map((g: any) => g.phone_number);
        } else if (Array.isArray(guestsRes)) {
          existingPhoneNumbers = (guestsRes as any[]).map((g: any) => g.phone_number);
        }
        if (existingPhoneNumbers.includes(formData.phone_number.trim())) {
          onError('A guest with this phone number already exists in this event');
          setLoading(false);
          return;
        }
      }

      if (guest) {
        // Update guest
        await apiService.updateGuest(guest.id, {
          name: formData.name.trim(),
          title: formData.title.trim() || null,
          phone_number: formData.phone_number.trim(),
          card_class_id: parseInt(formData.card_class_id),
        });
      } else {
        // Create guest
        await apiService.createGuest({
          name: formData.name.trim(),
          title: formData.title.trim() || null,
          phone_number: formData.phone_number.trim(),
          card_class_id: parseInt(formData.card_class_id),
          event_id: eventId
        });
      }
      onSuccess();
      onClose();
      setFormData({
        name: '',
        title: '',
        phone_number: '',
        card_class_id: ''
      });
    } catch (error) {
      console.error('Error saving guest:', error);
      onError(error instanceof Error ? error.message : 'Failed to save guest');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[999999]">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {guest ? 'Edit Guest' : 'Add New Guest'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Guest Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Guest Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder="Enter guest name"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title (Optional)
            </label>
            <select
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select Title</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Miss">Miss</option>
              <option value="Dr.">Dr.</option>
              <option value="Prof.">Prof.</option>
              <option value="Eng.">Eng.</option>
              <option value="Hon.">Hon.</option>
              <option value="Sir">Sir</option>
              <option value="Lady">Lady</option>
              <option value="Capt.">Capt.</option>
              <option value="Col.">Col.</option>
              <option value="Gen.">Gen.</option>
              <option value="Rev.">Rev.</option>
              <option value="Bishop">Bishop</option>
              <option value="Sheikh">Sheikh</option>
              <option value="Imam">Imam</option>
              <option value="Chief">Chief</option>
              <option value="Elder">Elder</option>
            </select>
          </div>

          {/* Phone Number */}
          <PhoneInput
            value={formData.phone_number}
            onChange={(value) => handleInputChange('phone_number', value)}
            onValidationChange={(_, validation) => setPhoneValidation(validation)}
            placeholder="e.g., 0712345678 or +1234567890"
            required
            label="Phone Number *"
          />

          {/* Card Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Card Class *
            </label>
            {loadingCardClasses ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 rounded"></div>
              </div>
            ) : (
              <select
                required
                value={formData.card_class_id}
                onChange={(e) => handleInputChange('card_class_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select a card class</option>
                {cardClasses.map((cardClass) => (
                  <option key={cardClass.id} value={cardClass.id}>
                    {cardClass.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Note */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              The guest will be automatically assigned an invite code and QR code upon creation. 
              QR codes are required for event tracking and card generation.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </div>
              ) : (
                'Add Guest'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGuestModal; 