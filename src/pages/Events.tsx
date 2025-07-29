import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { apiService } from "../services/api";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import EventsTable from "../components/tables/EventsTable";
import Pagination from "../components/common/Pagination";
import DatePicker from "../components/form/date-picker";

interface Event {
  id: number;
  event_name: string;
  title?: string; // Keep for backward compatibility
  description?: string;
  event_date: string;
  event_time: string;
  event_location?: string;
  location?: string; // Keep for backward compatibility
  status: "initiated" | "inprogress" | "notified" | "scanned" | "completed" | "cancelled";
  event_type?: {
    id: number;
    name: string;
  };
  customer?: {
    id: number;
    name: string;
  };
  package?: {
    id: number;
    name: string;
    amount: number;
    currency: string;
  };
  guests_count?: number;
  total_guests?: number;
  confirmed_guests?: number;
}

type EventTab = "all" | "initiated" | "inprogress" | "notified" | "scanned" | "completed" | "cancelled";

const Events: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EventTab>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Form state for create event
  const [formData, setFormData] = useState({
    title: "",
    event_date: "",
    event_time: "",
    location: "",
    event_type_id: "",
    customer_id: "",
    card_type_id: "",
    package_id: "",
    notification_date: "",
    notification_time: "",
    country_id: "",
    region_id: "",
    district_id: "",
  });

  // Dropdown options state
  const [customers, setCustomers] = useState<Array<{ id: number; name: string }>>([]);
  const [eventTypes, setEventTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [cardTypes, setCardTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [packages, setPackages] = useState<Array<{ id: number; name: string; amount: number; currency: string }>>([]);
  const [countries, setCountries] = useState<Array<{ id: number; name: string; shortform: string }>>([]);
  const [regions, setRegions] = useState<Array<{ id: number; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchEvents();
  }, [user, activeTab, currentPage, itemsPerPage, searchTerm]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== "") {
        setCurrentPage(1); // Reset to first page when searching
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch dropdown options when modal opens
  useEffect(() => {
    if (showCreateModal) {
      fetchDropdownOptions();
    }
  }, [showCreateModal]);

  const fetchDropdownOptions = async () => {
    setLoadingOptions(true);
    try {
      const [customersRes, eventTypesRes, cardTypesRes, packagesRes, countriesRes] = await Promise.all([
        apiService.getCustomers(),
        apiService.getEventTypes(),
        apiService.getCardTypes(),
        apiService.getPackages(),
        apiService.getCountries(),
      ]);

      console.log('Dropdown options fetched:', {
        customers: customersRes,
        eventTypes: eventTypesRes,
        cardTypes: cardTypesRes,
        packages: packagesRes,
        countries: countriesRes,
      });

      // Handle paginated customers response
      const customersData = (customersRes as any).data || customersRes;
      setCustomers(customersData as Array<{ id: number; name: string }>);
      setEventTypes(eventTypesRes as Array<{ id: number; name: string }>);
      setCardTypes(cardTypesRes as Array<{ id: number; name: string }>);
      setPackages(packagesRes as Array<{ id: number; name: string; amount: number; currency: string }>);
      setCountries(countriesRes as Array<{ id: number; name: string; shortform: string }>);
    } catch (e) {
      console.error('Failed to fetch dropdown options:', e);
      setError('Failed to load form options. Please try again.');
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: itemsPerPage,
        status: activeTab,
      };
      
      // Add search parameter if search term exists
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const res = await apiService.getEvents(params);
      
      // Handle paginated response
      if (res && typeof res === 'object' && 'data' in res) {
        setEvents((res as any).data);
        setTotalItems((res as any).total || 0);
        setTotalPages((res as any).last_page || 1);
      } else {
        // Fallback for non-paginated response
        setEvents(res as Event[]);
        setTotalItems((res as Event[]).length);
        setTotalPages(1);
      }
    } catch (e) {
      setError("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    console.log('Form data being submitted:', formData);
    
    try {
      const eventData = {
        title: formData.title,
        event_date: formData.event_date,
        event_time: formData.event_time,
        location: formData.location || undefined,
        event_type_id: formData.event_type_id ? parseInt(formData.event_type_id) : undefined,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : undefined,
        card_type_id: formData.card_type_id ? parseInt(formData.card_type_id) : undefined,
        package_id: formData.package_id ? parseInt(formData.package_id) : undefined,
        notification_date: formData.notification_date || undefined,
        notification_time: formData.notification_time || undefined,
        country_id: formData.country_id ? parseInt(formData.country_id) : undefined,
        region_id: formData.region_id ? parseInt(formData.region_id) : undefined,
        district_id: formData.district_id ? parseInt(formData.district_id) : undefined,
      };
      
      console.log('Event data to be sent:', eventData);
      
      await apiService.createEvent(eventData);
      setShowCreateModal(false);
      setFormData({
        title: "",
        event_date: "",
        event_time: "",
        location: "",
        event_type_id: "",
        customer_id: "",
        card_type_id: "",
        package_id: "",
        notification_date: "",
        notification_time: "",
        country_id: "",
        region_id: "",
        district_id: "",
      });
      fetchEvents();
    } catch (e) {
      console.error('Failed to create event:', e);
      setError("Failed to create event");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleTabChange = (tab: EventTab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  // Location handling functions
  const handleCountryChange = async (countryId: string) => {
    console.log('Country changed:', countryId);
    setFormData(prev => ({
      ...prev,
      country_id: countryId,
      region_id: "",
      district_id: ""
    }));
    
    // Clear regions and districts when country changes
    setRegions([]);
    setDistricts([]);
    
    if (countryId) {
      setLoadingRegions(true);
      try {
        console.log('Fetching regions for country:', countryId);
        const regionsRes = await apiService.getRegions(parseInt(countryId));
        console.log('Regions response:', regionsRes);
        setRegions(regionsRes as Array<{ id: number; name: string }>);
      } catch (e) {
        console.error('Failed to fetch regions:', e);
        setError('Failed to load regions. Please try again.');
      } finally {
        setLoadingRegions(false);
      }
    }
  };

  const handleRegionChange = async (regionId: string) => {
    console.log('Region changed:', regionId);
    setFormData(prev => ({
      ...prev,
      region_id: regionId,
      district_id: ""
    }));
    
    // Clear districts when region changes
    setDistricts([]);
    
    if (regionId) {
      setLoadingDistricts(true);
      try {
        console.log('Fetching districts for region:', regionId);
        const districtsRes = await apiService.getDistricts(parseInt(regionId));
        console.log('Districts response:', districtsRes);
        setDistricts(districtsRes as Array<{ id: number; name: string }>);
      } catch (e) {
        console.error('Failed to fetch districts:', e);
        setError('Failed to load districts. Please try again.');
      } finally {
        setLoadingDistricts(false);
      }
    }
  };

  const handleViewEvent = (eventItem: any) => {
    navigate(`/events/${eventItem.id}`);
  };

  const handleEditEvent = (eventItem: any) => {
    // TODO: Implement edit event functionality
    console.log('Edit event:', eventItem);
    // You can navigate to an edit page or show an edit modal
  };

  if (!user) return null;

  const tabConfig = [
    { key: "all" as EventTab, label: "All Events", count: 0 },
    { key: "initiated" as EventTab, label: "Initiated", count: 0 },
    { key: "inprogress" as EventTab, label: "In Progress", count: 0 },
    { key: "notified" as EventTab, label: "Notified", count: 0 },
    { key: "scanned" as EventTab, label: "Scanned", count: 0 },
    { key: "completed" as EventTab, label: "Completed", count: 0 },
    { key: "cancelled" as EventTab, label: "Cancelled", count: 0 },
  ];

  return (
    <>
      <PageMeta title="Events | Admin" description="Manage events" />
      <PageBreadcrumb pageTitle="Manage Events" />
      
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Events</h1>
          <button
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            Create Event
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search events by name, customer, event type, or package..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            {tabConfig.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
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

        {/* Events Table */}
        <ComponentCard title={`${tabConfig.find(t => t.key === activeTab)?.label}`}>
          {/* Search Results Indicator */}
          {searchTerm && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Search results for "<span className="font-semibold">{searchTerm}</span>"
                  {!loading && (
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

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-4">{error}</div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No {activeTab} events found.
            </div>
          ) : (
            <>
              <EventsTable 
                events={events} 
                onView={handleViewEvent}
                onEdit={handleEditEvent}
              />
              
              {/* Pagination */}
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            </>
          )}
        </ComponentCard>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[999999]">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Event</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
            
            {loadingOptions && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                Loading options...
              </div>
            )}
            
            <form onSubmit={handleCreate} className="space-y-6">
              {/* Event Details Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Event Details
                </h4>
                
                {/* Event Name - Full Width */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Enter event name"
                  />
                </div>
                
                {/* Event Date, Time, Location - 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <DatePicker
                      id="event-date"
                      label="Event Date *"
                      placeholder="Select event date"
                      defaultDate={formData.event_date ? new Date(formData.event_date) : undefined}
                      onChange={(_, dateStr) => {
                        setFormData({ ...formData, event_date: dateStr });
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event Time * (24-hour format)
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.event_time}
                      onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      placeholder="Enter event location"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Details Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Customer Details
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Customer
                    </label>
                    <select
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      disabled={loadingOptions}
                    >
                      <option value="">Select Customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event Type
                    </label>
                    <select
                      value={formData.event_type_id}
                      onChange={(e) => setFormData({ ...formData, event_type_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      disabled={loadingOptions}
                    >
                      <option value="">Select Event Type</option>
                      {eventTypes.map((eventType) => (
                        <option key={eventType.id} value={eventType.id}>
                          {eventType.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Card Type
                    </label>
                    <select
                      value={formData.card_type_id}
                      onChange={(e) => setFormData({ ...formData, card_type_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      disabled={loadingOptions}
                    >
                      <option value="">Select Card Type</option>
                      {cardTypes.map((cardType) => (
                        <option key={cardType.id} value={cardType.id}>
                          {cardType.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Package
                    </label>
                    <select
                      value={formData.package_id}
                      onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      disabled={loadingOptions}
                    >
                      <option value="">Select Package</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} - {pkg.currency} {pkg.amount.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Location Details Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Location Details
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country
                    </label>
                    <select
                      value={formData.country_id}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      disabled={loadingOptions}
                    >
                      <option value="">Select Country</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name} ({country.shortform})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Region
                    </label>
                    <select
                      value={formData.region_id}
                      onChange={(e) => handleRegionChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      disabled={!formData.country_id || loadingOptions || loadingRegions}
                    >
                      <option value="">
                        {loadingRegions ? 'Loading regions...' : 'Select Region'}
                      </option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      District
                    </label>
                    <select
                      value={formData.district_id}
                      onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      disabled={!formData.region_id || loadingOptions || loadingDistricts}
                    >
                      <option value="">
                        {loadingDistricts ? 'Loading districts...' : 'Select District'}
                      </option>
                      {districts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Schedules Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Schedules
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <DatePicker
                      id="notification-date"
                      label="Notification Date"
                      placeholder="Select notification date"
                      defaultDate={formData.notification_date ? new Date(formData.notification_date) : undefined}
                      onChange={(_, dateStr) => {
                        setFormData({ ...formData, notification_date: dateStr });
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notification Time (24-hour format)
                    </label>
                    <input
                      type="time"
                      value={formData.notification_time}
                      onChange={(e) => setFormData({ ...formData, notification_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Events; 