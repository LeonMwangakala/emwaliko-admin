import { useEffect, useState, useCallback, type FC } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router";
import { apiService } from "../services/api";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import ExcelUploadModal from "../components/ExcelUploadModal";
import AddGuestModal from "../components/AddGuestModal";
import SendNotificationsModal from "../components/SendNotificationsModal";
import CardDesign from "../components/CardDesign";
import EventSettings from "../components/EventSettings";
import ScanModal from "../components/ScanModal";
import GuestCardModal from "../components/GuestCardModal";
import RegenerateQrCodesModal from "../components/RegenerateQrCodesModal";
import GuestsTable from "../components/tables/GuestsTable";
import Pagination from "../components/common/Pagination";
import type { Guest as GuestType } from "../types/guest";

interface Event {
  id: number;
  event_name: string;
  event_date: string;
  event_location?: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  status: "initiated" | "inprogress" | "notified" | "scanned" | "completed" | "cancelled";
  customer?: {
    id: number;
    name: string;
  };
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
  package?: {
    id: number;
    name: string;
    amount: number;
    currency: string;
  };
  country?: {
    id: number;
    name: string;
  };
  region?: {
    id: number;
    name: string;
  };
  district?: {
    id: number;
    name: string;
  };
  guests_count?: number;
  scanners?: Array<{
    id: number;
    user_id: number;
    role: 'primary' | 'secondary';
    is_active: boolean;
    user: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  notification_date?: string;
  card_design_path?: string;
  card_design_base64?: string;
  card_type?: {
    id: number;
    name: string;
  };
  sms_template?: string;
  event_code?: string;
}

type Guest = GuestType;

interface Notification {
  id: number;
  guest_id: number;
  message: string;
  notification_type: 'SMS' | 'WhatsApp';
  status: 'Sent' | 'Not Sent';
  sent_date?: string;
  guest?: {
    name: string;
    phone_number?: string;
  };
}

interface Scan {
  id: number;
  guest_id: number;
  quantity: number;
  scan_count: number;
  scanned_by?: number;
  scanned_date?: string;
  status: "scanned" | "not_scanned";
  guest?: {
    name: string;
    card_class?: {
      id: number;
      name: string;
      max_guests: number;
    };
  };
  scannedBy?: {
    name: string;
  };
}

type EventTab = "guests" | "notifications" | "card-design" | "settings" | "scan";

const ViewEvent: FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<EventTab>("guests");
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [error, setError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showExcelUploadModal, setShowExcelUploadModal] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showGuestCardModal, setShowGuestCardModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showRegenerateQrCodesModal, setShowRegenerateQrCodesModal] = useState(false);
  
  // Pagination state for guests
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state for notifications
  const [notificationsCurrentPage, setNotificationsCurrentPage] = useState(1);
  const [notificationsItemsPerPage, setNotificationsItemsPerPage] = useState(10);
  const [notificationsTotalItems, setNotificationsTotalItems] = useState(0);
  const [notificationsTotalPages, setNotificationsTotalPages] = useState(0);
  const [notificationsSearchTerm, setNotificationsSearchTerm] = useState("");

  useEffect(() => {
    if (!user || !id) {
      return;
    }
    fetchEvent();
  }, [user, id]);

  const fetchEvent = async () => {
    try {
      const res = await apiService.getEvent(parseInt(id!)) as Event;
      setEvent(res);
    } catch (e) {
      console.error('Error fetching event:', e);
      setError("Failed to fetch event");
    } finally {
    }
  };

  const fetchTabData = useCallback(async () => {
    if (!event) {
      return;
    }
    
    setTabLoading(true);
    try {
      switch (activeTab) {
        case "guests":
          const guestsRes = await apiService.getEventGuests(event.id, currentPage, itemsPerPage, searchTerm);
          
          // Handle paginated response
          if (guestsRes && typeof guestsRes === 'object' && 'data' in guestsRes) {
            setGuests((guestsRes as any).data);
            setTotalItems((guestsRes as any).total || 0);
            setTotalPages((guestsRes as any).last_page || 1);
          } else {
            // Fallback for non-paginated response
            setGuests(guestsRes as Guest[]);
            setTotalItems((guestsRes as Guest[]).length);
            setTotalPages(1);
          }
          break;
        case "notifications":
          const notificationsRes = await apiService.getEventNotifications(event.id, notificationsCurrentPage, notificationsItemsPerPage, notificationsSearchTerm);
          if (notificationsRes && typeof notificationsRes === 'object' && 'data' in notificationsRes) {
            setNotifications((notificationsRes as any).data);
            setNotificationsTotalItems((notificationsRes as any).total || 0);
            setNotificationsTotalPages((notificationsRes as any).last_page || 1);
          } else {
            setNotifications(notificationsRes as Notification[]);
            setNotificationsTotalItems((notificationsRes as Notification[]).length);
            setNotificationsTotalPages(1);
          }
          break;
        case "scan":
          const scansRes = await apiService.getEventScans(event.id);
          setScans((scansRes as any).data || scansRes);
          break;
      }
    } catch (e) {
      console.error(`Failed to fetch ${activeTab} data:`, e);
    } finally {
      setTabLoading(false);
    }
  }, [event, activeTab, currentPage, itemsPerPage, searchTerm, notificationsCurrentPage, notificationsItemsPerPage, notificationsSearchTerm]);

  useEffect(() => {
    if (!event) {
      return;
    }
    fetchTabData();
  }, [fetchTabData]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const [datePart] = dateString.split('T');
    if (!datePart) return 'Invalid Date';
    const [year, month, day] = datePart.split('-');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const timePart = dateString.split('T')[1];
    if (!timePart) return '';
    const [hour, minute] = timePart.split(':');
    return `${hour}:${minute}`;
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "initiated":
        return "bg-blue-100 text-blue-800";
      case "inprogress":
        return "bg-yellow-100 text-yellow-800";
      case "notified":
        return "bg-purple-100 text-purple-800";
      case "scanned":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-teal-100 text-teal-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUploadSuccess = () => {
    setUploadSuccess("Guests uploaded successfully!");
    setError("");
    // Refresh guests list
    fetchTabData();
    // Clear success message after 3 seconds
    setTimeout(() => setUploadSuccess(""), 3000);
  };

  const handleUploadError = (message: string) => {
    setError(message);
    setUploadSuccess("");
  };

  const handleNotificationSuccess = () => {
    setUploadSuccess("Notifications sent successfully!");
    setError("");
    // Refresh notifications list
    fetchTabData();
    // Clear success message after 3 seconds
    setTimeout(() => setUploadSuccess(""), 3000);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleNotificationsPageChange = (page: number) => {
    setNotificationsCurrentPage(page);
  };

  const handleNotificationsItemsPerPageChange = (newItemsPerPage: number) => {
    setNotificationsItemsPerPage(newItemsPerPage);
    setNotificationsCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleSearchChange = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    // Add minimal delay to prevent excessive API calls
    setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 100);
  }, []);

  const handleNotificationsSearchChange = useCallback((newSearchTerm: string) => {
    setNotificationsSearchTerm(newSearchTerm);
    // Add minimal delay to prevent excessive API calls
    setTimeout(() => {
      setNotificationsCurrentPage(1); // Reset to first page when searching
    }, 100);
  }, []);

  const handleDeleteNotification = async (notificationId: number) => {
    if (!event) return;
    try {
      await apiService.deleteNotification(event.id, notificationId);
      setUploadSuccess("Notification deleted successfully!");
      setError("");
      fetchTabData();
      setTimeout(() => setUploadSuccess(""), 3000);
    } catch (e: any) {
      console.error("Error deleting notification:", e);
      // Handle specific error for sent notifications
      if (e.message && e.message.includes('Cannot delete notification that has been sent')) {
        setError("Cannot delete notification that has been sent");
      } else {
        setError("Failed to delete notification");
      }
      setUploadSuccess("");
    }
  };

  const handleRegenerateQrCodes = () => {
    setShowRegenerateQrCodesModal(true);
  };

  const handleRegenerateQrCodesSuccess = () => {
    setUploadSuccess("QR codes regenerated successfully!");
    setError("");
    fetchTabData();
    setTimeout(() => setUploadSuccess(""), 3000);
  };

  const handleScanSuccess = () => {
    setUploadSuccess("Scan recorded successfully!");
    setError("");
    fetchTabData();
    setTimeout(() => setUploadSuccess(""), 3000);
  };

  const handleViewCard = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowGuestCardModal(true);
  };



  if (!user) return null;

  const tabConfig = [
    { key: "guests" as EventTab, label: "Guests", count: totalItems },
    { key: "notifications" as EventTab, label: "Notifications", count: notificationsTotalItems },
    { key: "card-design" as EventTab, label: "Card Design", count: 0 },
    { key: "settings" as EventTab, label: "Settings", count: 0 },
    { key: "scan" as EventTab, label: "Scan", count: scans.length },
  ];

  return (
    <>
      <PageMeta title={`${event?.event_name || 'Event'} | Admin`} description="View event details" />
      <PageBreadcrumb pageTitle={event?.event_name || 'Event Details'} />
      
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Events
          </button>
        </div>

        {/* Event Details Card */}
        {event && (
          <ComponentCard title="Event Details">
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Event Name</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-semibold">{event.event_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Event Code</label>
                    <span className="mt-1 inline-flex items-center gap-2 px-2 py-1 text-xs font-mono font-semibold rounded bg-gray-100 dark:bg-gray-800 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-700">
                      {event.event_code || 'N/A'}
                      <button
                        type="button"
                        className="ml-1 text-xs text-gray-400 hover:text-brand-600 focus:outline-none"
                        onClick={() => {
                          if (event.event_code) {
                            navigator.clipboard.writeText(event.event_code);
                          }
                        }}
                        title="Copy event code"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8a2 2 0 002-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
                        </svg>
                      </button>
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${formatStatus(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer & Package Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Customer & Package
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{event.customer?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Event Type</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{event.event_type?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Package</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {event.package ? `${event.package.name} (${event.package.amount} ${event.package.currency})` : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date & Time Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Date & Time
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Event Date & Time</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatDate(event.event_date)} at {formatTime(event.event_date)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notification Date & Time</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {event.notification_date ? `${formatDate(event.notification_date)} at ${formatTime(event.notification_date)}` : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Location
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Event Location</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{event.event_location || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{event.country?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Region</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{event.region?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">District</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{event.district?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {event.latitude ? Number(event.latitude).toFixed(6) : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {event.longitude ? Number(event.longitude).toFixed(6) : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Google Maps URL</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {event.google_maps_url ? (
                        <a 
                          href={event.google_maps_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 underline"
                        >
                          View on Google Maps
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guest & Scan Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Guest & Scan Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Guests</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{event.guests_count || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Scanners</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {event.scanners && event.scanners.length > 0 ? (
                        event.scanners.map(scanner => `${scanner.user.name} (${scanner.role})`).join(', ')
                      ) : 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Card Type</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{event.card_type?.name || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          </ComponentCard>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            {tabConfig.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  // Reset pagination when switching to guests tab
                  if (tab.key === 'guests') {
                    setCurrentPage(1);
                  }
                  // Reset pagination when switching to notifications tab
                  if (tab.key === 'notifications') {
                    setNotificationsCurrentPage(1);
                    setNotificationsSearchTerm("");
                  }
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs dark:bg-gray-700 dark:text-gray-300">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <ComponentCard 
          title={tabConfig.find(t => t.key === activeTab)?.label || 'Event Details'}
          action={
            activeTab === "guests" && event ? (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowAddGuestModal(true)}
                  className="px-3 py-1 text-sm bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors"
                >
                  Add Guest
                </button>
                <button 
                  onClick={() => setShowExcelUploadModal(true)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Upload Excel
                </button>
                <button 
                  onClick={handleRegenerateQrCodes}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  Regenerate QR Codes
                </button>
              </div>
            ) : activeTab === "notifications" && event ? (
              <button 
                onClick={() => setShowNotificationsModal(true)}
                className="px-3 py-1 text-sm bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors"
              >
                Send Notifications
              </button>
            ) : activeTab === "scan" && event ? (
              <button 
                onClick={() => setShowScanModal(true)}
                className="px-3 py-1 text-sm bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors"
              >
                New Scan
              </button>
            ) : undefined
          }
        >
          {!event ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-4">{error}</div>
          ) : (
            <div className="py-4">
              {tabLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
                </div>
              )}
              
              {!tabLoading && activeTab === "guests" && (
                <div>
                  {/* Success/Error Messages */}
                  {uploadSuccess && (
                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                      {uploadSuccess}
                    </div>
                  )}
                  {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                      {error}
                    </div>
                  )}
                  
                  {/* Search Results Indicator */}
                  {searchTerm && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          Search results for "<span className="font-semibold">{searchTerm}</span>"
                          {!tabLoading && (
                            <span className="ml-2 text-blue-600 dark:text-blue-400">
                              ({totalItems} {totalItems === 1 ? 'result' : 'results'})
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setSearchTerm("")}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Clear search
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <GuestsTable 
                    guests={guests} 
                    loading={tabLoading}
                    pagination={{
                      currentPage,
                      totalPages,
                      totalItems,
                      itemsPerPage,
                      onPageChange: handlePageChange,
                      onItemsPerPageChange: handleItemsPerPageChange
                    }}
                    onEdit={(guest) => {
                      setEditingGuest(guest);
                      setShowAddGuestModal(true);
                    }}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    cardDesignPath={event?.card_design_path}
                    onViewCard={handleViewCard}
                    event={event}
                    cardType={event?.card_type}
                    onRefresh={fetchTabData}
                  />
                </div>
              )}

              {!tabLoading && activeTab === "notifications" && (
                <div>
                  {/* Success/Error Messages */}
                  {uploadSuccess && (
                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                      {uploadSuccess}
                    </div>
                  )}
                  {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                      {error}
                    </div>
                  )}
                  
                  {/* Search Results Indicator */}
                  {notificationsSearchTerm && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          Search results for "<span className="font-semibold">{notificationsSearchTerm}</span>"
                          {!tabLoading && (
                            <span className="ml-2 text-blue-600 dark:text-blue-400">
                              ({notificationsTotalItems} {notificationsTotalItems === 1 ? 'result' : 'results'})
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setNotificationsSearchTerm("")}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Clear search
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Search Input */}
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search notifications by name, phone, message, type, or status..."
                        value={notificationsSearchTerm}
                        onChange={(e) => handleNotificationsSearchChange(e.target.value)}
                        className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No notifications found for this event.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {notifications.map((notification) => (
                            <tr key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{notification.guest?.name || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{notification.guest?.phone_number || '-'}</td>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate" title={notification.message}>{notification.message}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  notification.notification_type === 'WhatsApp' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {notification.notification_type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  notification.status === 'Sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {notification.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                <button
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  disabled={notification.status === 'Sent'}
                                  className={`p-2 rounded-md transition-colors ${
                                    notification.status === 'Sent'
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-red-500 hover:bg-red-600 text-white'
                                  }`}
                                  title={notification.status === 'Sent' ? 'Cannot delete sent notification' : 'Delete notification'}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {/* Notifications Pagination */}
                  {notificationsTotalPages > 1 && (
                    <Pagination
                      currentPage={notificationsCurrentPage}
                      totalPages={notificationsTotalPages}
                      totalItems={notificationsTotalItems}
                      itemsPerPage={notificationsItemsPerPage}
                      onPageChange={handleNotificationsPageChange}
                      onItemsPerPageChange={handleNotificationsItemsPerPageChange}
                    />
                  )}
                </div>
              )}

              {!tabLoading && activeTab === "card-design" && (
                <div>
                  {/* <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Card Design</h3> */}
                  {event && (
                    <CardDesign 
                      eventId={event.id} 
                      cardTypeId={event.card_type?.id || 1}
                      cardDesignPath={(event.card_design_path as string) || ''}
                      onCardDesignUpdate={(newPath) => {
                        // Update the event state with the new card design path
                        setEvent(prev => prev ? { ...prev, card_design_path: newPath } : null);
                      }}
                    />
                  )}
                </div>
              )}

              {!tabLoading && activeTab === "settings" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Event Settings</h3>
                  {event && (
                    <EventSettings 
                      eventId={event.id} 
                      initialSettings={{
                        notification_date: event.notification_date,
                      }}
                      onSuccess={() => {
                        // Refresh the event data after successful settings update
                        fetchEvent();
                      }}
                    />
                  )}
                </div>
              )}

              {!tabLoading && activeTab === "scan" && (
                <div>
                  {scans.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No scan records found for this event.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guest</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Card</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scan Count</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scanned By</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scanned Date</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {scans.map((scan) => (
                            <tr key={scan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{scan.guest?.name || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{scan.guest?.card_class?.name || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{scan.quantity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{scan.scan_count}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  scan.status === 'scanned' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {scan.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{scan.scannedBy?.name || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {scan.scanned_date ? formatDate(scan.scanned_date) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </ComponentCard>
      </div>
      
      {/* Send Notifications Modal */}
      {event && (
        <SendNotificationsModal
          eventId={event.id}
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          onSuccess={handleNotificationSuccess}
        />
      )}
      {/* Excel Upload Modal */}
      {event && (
        <ExcelUploadModal
          isOpen={showExcelUploadModal}
          onClose={() => setShowExcelUploadModal(false)}
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
          eventId={event.id}
        />
      )}
      {/* Add Guest Modal */}
      {event && (
        <AddGuestModal
          isOpen={showAddGuestModal}
          onClose={() => {
            setShowAddGuestModal(false);
            setEditingGuest(null);
          }}
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
          eventId={event.id}
          guest={editingGuest}
        />
      )}
      {/* Scan Modal */}
      {event && (
        <ScanModal
          isOpen={showScanModal}
          onClose={() => setShowScanModal(false)}
          onSuccess={handleScanSuccess}
          eventId={event.id}
        />
      )}
      {/* Guest Card Modal */}
      {event && (
        <GuestCardModal
          isOpen={showGuestCardModal}
          onClose={() => {
            setShowGuestCardModal(false);
            setSelectedGuest(null);
          }}
          guest={selectedGuest}
          eventId={event.id}
          cardTypeId={event.card_type?.id || 1}
          cardDesignPath={event.card_design_path}
          onRefresh={fetchTabData}
        />
      )}
      
      {/* Regenerate QR Codes Modal */}
      {event && (
        <RegenerateQrCodesModal
          isOpen={showRegenerateQrCodesModal}
          onClose={() => setShowRegenerateQrCodesModal(false)}
          onSuccess={handleRegenerateQrCodesSuccess}
          eventId={event.id}
          eventName={event.event_name}
          totalGuests={totalItems}
        />
      )}
    </>
  );
};

export default ViewEvent;