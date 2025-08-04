import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

interface SendNotificationsModalProps {
  eventId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Guest {
  id: number;
  name: string;
  title?: string;
  invite_code?: string;
}

interface Event {
  id: number;
  event_name: string;
  event_date: string;
  event_location?: string;
  event_type?: {
    id: number;
    name: string;
    sms_template?: string;
    whatsapp_template?: string;
    sms_invitation_template?: string;
    whatsapp_invitation_template?: string;
    sms_donation_template?: string;
    whatsapp_donation_template?: string;
  };
  card_type?: {
    id: number;
    name: string;
  };
}

type TemplateType = 'invitation' | 'donation';
type NotificationType = 'SMS' | 'WhatsApp';

const SendNotificationsModal: React.FC<SendNotificationsModalProps> = ({
  eventId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationType>('SMS');
  const [selectedGuests, setSelectedGuests] = useState<number[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templateType, setTemplateType] = useState<TemplateType>('invitation');
  const [availableGuests, setAvailableGuests] = useState<Guest[]>([]);
  const [filteredOutCount, setFilteredOutCount] = useState(0);
  const [templateLoaded, setTemplateLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEventAndGuests();
    }
  }, [isOpen, eventId]);

  const fetchEventAndGuests = async () => {
    try {
      // Fetch event details with event type
      const eventRes = await apiService.getEvent(eventId);
      setEvent(eventRes as Event);

      // Fetch all guests (not paginated)
      const guestsRes = await apiService.getAllEventGuests(eventId);
      const guestsData = guestsRes as Guest[];
      setGuests(guestsData);
      
      // Initially, all guests are available (will be filtered when notification type is selected)
      setAvailableGuests(guestsData);
      setSelectedGuests(guestsData.map((guest: Guest) => guest.id));
      setFilteredOutCount(0);
    } catch (error) {
      console.error('Error fetching event and guests:', error);
      setError('Failed to fetch event and guests');
    }
  };

  const filterAvailableGuests = useCallback(async (notificationType: NotificationType) => {
    if (!event) return;

    try {
      // Use the new backend endpoint to get available guests
      const response = await apiService.getAvailableGuestsForNotificationType(event.id, notificationType.toUpperCase() as 'SMS' | 'WhatsApp') as any;
      
      setAvailableGuests(response.available_guests);
      setSelectedGuests(response.available_guests.map((guest: Guest) => guest.id));
      setFilteredOutCount(response.filtered_out_count);
    } catch (error) {
      console.error('Error filtering guests:', error);
      // Fallback to all guests if filtering fails
      setAvailableGuests(guests);
      setSelectedGuests(guests.map(guest => guest.id));
      setFilteredOutCount(0);
    }
  }, [event, guests]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const replaceTemplateVariables = (template: string, guest: Guest) => {
    if (!event) return template;
    
    return template
      .replace(/{guest_name}/g, guest.name)
      .replace(/{event_name}/g, event.event_name)
      .replace(/{event_date}/g, formatDate(event.event_date))
      .replace(/{event_time}/g, formatTime(event.event_date))
      .replace(/{event_location}/g, event.event_location || 'TBD')
      .replace(/{invite_code}/g, guest.invite_code || 'KRGC123456')
      .replace(/{rsvp_url}/g, `https://kadirafiki.com/rsvp/${guest.invite_code || 'KRGC123456'}`)
      .replace(/{mpesa_number}/g, '+255700000000')
      .replace(/{airtel_number}/g, '+255750000000');
  };

  const getTemplateByType = (notificationType: NotificationType, templateType: TemplateType) => {
    if (!event?.event_type) return null;

    const templates = event.event_type;
    
    if (templateType === 'invitation') {
      return notificationType === 'SMS' 
        ? templates.sms_invitation_template || templates.sms_template
        : templates.whatsapp_invitation_template || templates.whatsapp_template;
    } else {
      return notificationType === 'SMS'
        ? templates.sms_donation_template
        : templates.whatsapp_donation_template;
    }
  };

  const loadTemplate = (notificationType: NotificationType) => {
    const template = getTemplateByType(notificationType, templateType);
    
    if (template) {
      // Always load the template with variables intact
      setMessage(template);
      
      // Automatically set notification type based on template loaded
      setNotificationType(notificationType);

      // Filter available guests based on notification type
      filterAvailableGuests(notificationType);
      setTemplateLoaded(true);
    } else {
      setError('No template available for this event type');
    }
  };

  const determineDefaultTemplateType = (): TemplateType => {
    if (!event?.card_type) return 'invitation';
    
    // Determine template type based on card type name
    const cardTypeName = event.card_type.name.toLowerCase();
    
    // Card types that typically indicate donation requests
    const donationCardTypes = ['donation', 'fundraising', 'contribution', 'support'];
    
    return donationCardTypes.some(type => cardTypeName.includes(type)) 
      ? 'donation' 
      : 'invitation';
  };

  useEffect(() => {
    if (event?.card_type) {
      const determinedType = determineDefaultTemplateType();
      setTemplateType(determinedType);
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    if (!notificationType) {
      setError('Please select a notification type');
      return;
    }

    if (selectedGuests.length === 0) {
      setError('Please select at least one guest');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.sendEventNotifications(eventId, {
        message: message.trim(),
        notification_type: notificationType,
        guest_ids: selectedGuests
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      setError(error.message || 'Failed to send notifications');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMessage('');
    setNotificationType('SMS');
    setSelectedGuests([]);
    setError('');
    setTemplateType('invitation');
    setTemplateLoaded(false);
  };

  const handleSelectAll = () => {
    if (selectedGuests.length === availableGuests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(availableGuests.map(guest => guest.id));
    }
  };

  const handleGuestToggle = (guestId: number) => {
    setSelectedGuests(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[999999]">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Send Notifications
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          {/* Event Info */}
          {event && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event: {event.event_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {event.event_type?.name} • {event.card_type?.name} • {formatDate(event.event_date)} at {formatTime(event.event_date)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Template Type: <span className="font-medium capitalize">{templateType}</span>
              </p>
            </div>
          )}

          {/* Template Buttons */}
          {event?.event_type && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Templates</h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateType('invitation');
                      loadTemplate('SMS');
                    }}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Invitation SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateType('donation');
                      loadTemplate('SMS');
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Donation SMS
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp Templates</h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateType('invitation');
                      loadTemplate('WhatsApp');
                    }}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    Invitation WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateType('donation');
                      loadTemplate('WhatsApp');
                    }}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Donation WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your notification message or use template buttons above..."
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Available variables: {'{guest_name}'}, {'{event_name}'}, {'{event_date}'}, {'{event_time}'}, {'{event_location}'}, {'{invite_code}'}, {'{rsvp_url}'}
              {templateType === 'donation' && (
                <span>, {'{mpesa_number}'}, {'{airtel_number}'}</span>
              )}
            </p>
            {notificationType === 'WhatsApp' && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300">
                  💬 <strong>WhatsApp Integration:</strong> Guests can reply with "YES", "NO", or "MAYBE" to RSVP directly through WhatsApp. 
                  Responses will be automatically captured and updated in the system.
                </p>
              </div>
            )}
            
            {/* Preview Section */}
            {message && availableGuests.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                  Preview (showing how it will look for the first guest):
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                  {replaceTemplateVariables(message, availableGuests[0])}
                </p>
              </div>
            )}
          </div>

          {/* Notification Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notification Type *
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={notificationType === 'SMS'}
                  onChange={() => setNotificationType('SMS')}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  disabled={templateLoaded}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  SMS
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={notificationType === 'WhatsApp'}
                  onChange={() => setNotificationType('WhatsApp')}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  disabled={templateLoaded}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  WhatsApp
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {templateLoaded 
                ? 'Notification type is automatically set based on the template you loaded above'
                : 'Select the notification type you want to send'
              }
            </p>
          </div>

          {/* Guest Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Guests *
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-brand-600 hover:text-brand-500"
              >
                {selectedGuests.length === availableGuests.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 dark:border-gray-600">
              {availableGuests.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No guests found for this event
                </p>
              ) : (
                <div className="space-y-1">
                  {availableGuests.map((guest) => (
                    <label key={guest.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedGuests.includes(guest.id)}
                        onChange={() => handleGuestToggle(guest.id)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {guest.name} {guest.title && `(${guest.title})`}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedGuests.length} of {availableGuests.length} available guests selected
              {filteredOutCount > 0 && (
                <span className="block mt-1 text-orange-600">
                  {filteredOutCount} guests already have this notification type
                </span>
              )}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || availableGuests.length === 0}
              className={`px-4 py-2 text-sm font-medium border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                loading || availableGuests.length === 0
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'text-white bg-brand-500 hover:bg-brand-600'
              }`}
              title={availableGuests.length === 0 ? 'No guests available for notifications' : 'Send notifications to selected guests'}
            >
              {loading ? 'Sending...' : 'Send Notifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendNotificationsModal; 