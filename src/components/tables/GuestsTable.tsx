import { useState, useEffect, type FC } from "react";
import Pagination from "../common/Pagination";
import { PhoneNumberValidator } from '../../utils/phoneValidation';
import { Guest } from '../../types/guest';
import { PaginationProps } from '../../types/pagination';
import GenerateAllCardsModal from '../GenerateAllCardsModal';

interface GuestsTableProps {
  guests: Guest[];
  loading?: boolean;
  pagination?: PaginationProps;
  onEdit?: (guest: Guest) => void;
  searchTerm?: string;
  onSearchChange?: (searchTerm: string) => void;
  cardDesignPath?: string;
  onViewCard?: (guest: Guest) => void;
  event?: any; // Add event prop for card generation
  cardType?: any; // Add cardType prop for card generation
  onRefresh?: () => void; // Add refresh function prop
}

const GuestsTable: FC<GuestsTableProps> = ({ 
  guests, 
  loading = false,
  pagination,
  onEdit,
  searchTerm = "",
  onSearchChange,
  cardDesignPath,
  onViewCard,
  event,
  cardType,
  onRefresh
}) => {
  // Local state for search input to prevent cursor jumping
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  
  // Generate all cards modal state
  const [showGenerateAllModal, setShowGenerateAllModal] = useState(false);
  


  // Sync local state with prop
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleClearSearch = () => {
    setLocalSearchTerm("");
    if (onSearchChange) {
      onSearchChange("");
    }
  };



  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Copied to clipboard:', text);
    });
  };

  const getRsvpStatusColor = (status: string) => {
    switch (status) {
      case 'Yes':
        return 'bg-green-100 text-green-800';
      case 'No':
        return 'bg-red-100 text-red-800';
      case 'Maybe':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (guests.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
        No guests found for this event.
      </p>
    );
  }

  return (
    <div>
      {/* Generate All Cards Button */}
      {event && cardType && (
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                console.log('=== Generate All Cards button clicked ===');
                setShowGenerateAllModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Generate All Cards
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {guests.length} total guests
            </span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {onSearchChange && (
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              key="guest-search-input"
              type="text"
              placeholder="Search guests by name, title, phone, or invite code..."
              value={localSearchTerm}
              onChange={handleSearchInputChange}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              autoComplete="off"
            />
            {localSearchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Phone Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Invite Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Max Guests
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                RSVP Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Card Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {guests.map((guest) => (
              <tr key={guest.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div>
                    <div className="font-medium">{guest.name}</div>
                    {guest.title && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {guest.title}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {guest.phone_number ? PhoneNumberValidator.formatForDisplay(guest.phone_number) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono">{guest.invite_code}</span>
                    <button
                      onClick={() => copyToClipboard(guest.invite_code)}
                      className="text-gray-400 hover:text-brand-600 focus:outline-none"
                      title="Copy invite code"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8a2 2 0 002-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {guest.card_class?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {guest.card_class?.max_guests || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRsvpStatusColor(guest.rsvp_status || 'Pending')}`}>
                    {guest.rsvp_status || 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    guest.guest_card_path 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {guest.guest_card_path ? 'Generated' : 'Not Generated'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => onEdit && onEdit(guest)}
                      className="px-3 py-1 text-sm bg-brand-500 text-white rounded hover:bg-brand-600 focus:outline-none"
                      title="Edit guest"
                    >
                      Edit
                    </button>
                    {cardDesignPath && onViewCard && (
                      <div className="flex space-x-1">
                        {onViewCard && (
                          <button
                            onClick={() => onViewCard(guest)}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none"
                            title="View guest card"
                          >
                            View
                          </button>
                        )}

                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination {...pagination} />
        </div>
      )}

      {/* Generate All Cards Modal */}
      <GenerateAllCardsModal
        isOpen={showGenerateAllModal}
        onClose={() => setShowGenerateAllModal(false)}
        event={event}
        cardType={cardType}
        onRefresh={onRefresh}
      />
    </div>
  );
};

export default GuestsTable; 