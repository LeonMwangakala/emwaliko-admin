import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import NotAuthorized from "../OtherPage/NotAuthorized";
import { apiService } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import CustomersTable from "../../components/tables/Settings/CustomersTable";
import PhoneInput from "../../components/form/input/PhoneInput";
import { PhoneValidationResult } from "../../utils/phoneValidation";

interface Customer {
  id: number;
  name: string;
  phone_number: string;
  title?: string;
  physical_location?: string;
  status: "Active" | "Inactive";
}

const Customers: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newPhysicalLocation, setNewPhysicalLocation] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [phoneValidation, setPhoneValidation] = useState<PhoneValidationResult>({
    isValid: false,
    normalized: null,
    error: null,
    country: null,
    type: null
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchCustomers();
  }, [user, isAdmin, currentPage, itemsPerPage, searchTerm]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== "") {
        setCurrentPage(1); // Reset to first page when searching
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiService.getCustomers(currentPage, itemsPerPage, searchTerm);
      
      // Handle paginated response
      if (res && typeof res === 'object' && 'data' in res) {
        setCustomers((res as any).data);
        setTotalItems((res as any).total || 0);
        setTotalPages((res as any).last_page || 1);
      } else {
        // Fallback for non-paginated response
        setCustomers(res as Customer[]);
        setTotalItems((res as Customer[]).length);
        setTotalPages(1);
      }
    } catch (e) {
      setError("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!phoneValidation.isValid) {
      setError("Please enter a valid phone number");
      return;
    }
    
    try {
      await apiService.createCustomer({
        name: newName,
        phone_number: newPhoneNumber,
        title: newTitle || undefined,
        physical_location: newPhysicalLocation || undefined,
      });
      setShowCreateModal(false);
      setNewName("");
      setNewPhoneNumber("");
      setNewTitle("");
      setNewPhysicalLocation("");
      fetchCustomers();
    } catch (e) {
      setError("Failed to create customer");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setError("");
    
    if (!phoneValidation.isValid) {
      setError("Please enter a valid phone number");
      return;
    }
    
    try {
      await apiService.updateCustomer(selectedCustomer.id, {
        name: newName,
        phone_number: newPhoneNumber,
        title: newTitle || undefined,
        physical_location: newPhysicalLocation || undefined,
      });
      setShowEditModal(false);
      setSelectedCustomer(null);
      setNewName("");
      setNewPhoneNumber("");
      setNewTitle("");
      setNewPhysicalLocation("");
      fetchCustomers();
    } catch (e) {
      setError("Failed to update customer");
    }
  };

  const handleActivate = async (customer: Customer) => {
    setError("");
    try {
      await apiService.activateCustomer(customer.id);
      fetchCustomers();
    } catch (e) {
      setError("Failed to activate customer");
    }
  };

  const handleDeactivate = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeactivateModal(true);
  };

  const confirmDeactivate = async () => {
    if (!selectedCustomer) return;
    setError("");
    try {
      await apiService.deactivateCustomer(selectedCustomer.id);
      setShowDeactivateModal(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (e) {
      setError("Failed to deactivate customer");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  if (!user) return null;
  if (!isAdmin) return <NotAuthorized />;

  return (
    <>
      <PageMeta title="Customers | Admin" description="Manage customers" />
      <PageBreadcrumb pageTitle="Manage Customers" />
      <div className="space-y-6">
        <div className="flex justify-end mb-4">
          <button
            className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
            onClick={() => setShowCreateModal(true)}
          >
            Create Customer
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
            placeholder="Search customers by name, phone, title, or location..."
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

        <ComponentCard
          title="List of Customers"
        >
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
            <div>Loading...</div>
          ) : (
            <CustomersTable
              customers={customers}
              onEdit={(customer: Customer) => {
                setSelectedCustomer(customer);
                setNewName(customer.name);
                setNewPhoneNumber(customer.phone_number);
                setNewTitle(customer.title || "");
                setNewPhysicalLocation(customer.physical_location || "");
                setShowEditModal(true);
              }}
              onActivate={handleActivate}
              onDeactivate={handleDeactivate}
              pagination={{
                currentPage,
                totalPages,
                totalItems,
                itemsPerPage,
                onPageChange: handlePageChange,
                onItemsPerPageChange: handleItemsPerPageChange,
              }}
            />
          )}
        </ComponentCard>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create Customer</h3>
            {error && <div className="mb-2 text-red-600">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <input
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Customer Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
                <PhoneInput
                  value={newPhoneNumber}
                  onChange={(val) => setNewPhoneNumber(val)}
                  onValidationChange={(_, validation) => setPhoneValidation(validation)}
                  placeholder="Phone Number"
                  required
                  label="Phone Number *"
                />
                <input
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Title (Optional)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <input
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Physical Location (Optional)"
                  value={newPhysicalLocation}
                  onChange={(e) => setNewPhysicalLocation(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Customer</h3>
            {error && <div className="mb-2 text-red-600">{error}</div>}
            <form onSubmit={handleEdit}>
              <div className="space-y-4">
                <input
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Customer Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
                <PhoneInput
                  value={newPhoneNumber}
                  onChange={(val) => setNewPhoneNumber(val)}
                  onValidationChange={(_, validation) => setPhoneValidation(validation)}
                  placeholder="Phone Number"
                  required
                  label="Phone Number *"
                />
                <input
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Title (Optional)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <input
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Physical Location (Optional)"
                  value={newPhysicalLocation}
                  onChange={(e) => setNewPhysicalLocation(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && selectedCustomer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-red-600">Confirm Deactivation</h3>
            {error && <div className="mb-2 text-red-600">{error}</div>}
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Are you sure you want to deactivate <strong>{selectedCustomer.name}</strong>? 
              This action can be undone by activating the customer later.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => {
                  setShowDeactivateModal(false);
                  setSelectedCustomer(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={confirmDeactivate}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Customers; 