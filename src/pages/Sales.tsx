import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import NotAuthorized from "./OtherPage/NotAuthorized";
import { apiService } from "../services/api";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Pagination from "../components/common/Pagination";

interface Sales {
  id: number;
  event_id: number;
  guest_count: number;
  package_id: number;
  total_sale: number;
  status: 'Pending' | 'Invoiced' | 'Paid';
  event?: {
    id: number;
    event_name: string;
    status: 'initiated' | 'inprogress' | 'notified' | 'scanned' | 'completed' | 'cancelled';
  };
  package?: {
    id: number;
    name: string;
    amount: number;
    currency: string;
  };
}

const Sales: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [sales, setSales] = useState<Sales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [invoicingEventId, setInvoicingEventId] = useState<number | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchSales();
  }, [user, currentPage, itemsPerPage, searchTerm]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: itemsPerPage,
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const res = await apiService.getSales(params);
      
      if (res && typeof res === 'object' && 'data' in res) {
        setSales((res as any).data);
        setTotalItems((res as any).total || 0);
        setTotalPages((res as any).last_page || 1);
      } else {
        setSales(res as Sales[]);
        setTotalItems((res as Sales[]).length);
        setTotalPages(1);
      }
    } catch (e) {
      console.error("Failed to fetch sales:", e);
      setError("Failed to fetch sales");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setTimeout(() => {
      setCurrentPage(1);
    }, 100);
  };

  const handleInvoiceEvent = async (eventId: number) => {
    setInvoicingEventId(eventId);
    try {
      await apiService.markSalesAsInvoiced(eventId);
      setError("");
      setSuccess("Event invoiced successfully!");
      // Refresh the sales data
      fetchSales();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      console.error("Error invoicing event:", e);
      setError(e.message || "Failed to invoice event");
      setSuccess("");
    } finally {
      setInvoicingEventId(null);
    }
  };

  const handleMarkAsPaid = async (eventId: number) => {
    setInvoicingEventId(eventId);
    try {
      await apiService.markSalesAsPaid(eventId);
      setError("");
      setSuccess("Event marked as paid successfully!");
      // Refresh the sales data
      fetchSales();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      console.error("Error marking event as paid:", e);
      setError(e.message || "Failed to mark event as paid");
      setSuccess("");
    } finally {
      setInvoicingEventId(null);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'TZS') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Invoiced':
        return 'bg-blue-100 text-blue-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) return null;

  // Only admin can access this page
  if (!isAdmin) {
    return <NotAuthorized />;
  }

  return (
    <>
      <PageMeta title="Sales | Admin" description="View all event sales" />
      <PageBreadcrumb pageTitle="Sales" />
      
      <div className="space-y-6">
        <ComponentCard title="Sales Overview">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
          
          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search sales by event name, package, or status..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
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
          ) : sales.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {searchTerm ? 'No sales found matching your search.' : 'No sales records found.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      S.NO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Guests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {sales.map((sale, index) => (
                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                        {sale.event?.event_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {sale.guest_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {sale.package?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {sale.package ? formatCurrency(sale.package.amount, sale.package.currency) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">
                        {formatCurrency(sale.total_sale, sale.package?.currency || 'TZS')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(sale.status)}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {sale.event?.status === 'scanned' && sale.status === 'Pending' && (
                          <button
                            onClick={() => handleInvoiceEvent(sale.event_id)}
                            disabled={invoicingEventId === sale.event_id}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              invoicingEventId === sale.event_id
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                            title="Invoice this event"
                          >
                            {invoicingEventId === sale.event_id ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Invoicing...
                              </span>
                            ) : (
                              'Invoice'
                            )}
                          </button>
                        )}
                        {sale.status === 'Invoiced' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleMarkAsPaid(sale.event_id)}
                              disabled={invoicingEventId === sale.event_id}
                              className={`px-3 py-1 text-xs rounded transition-colors ${
                                invoicingEventId === sale.event_id
                                  ? 'bg-gray-400 text-white cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                              title="Mark as paid"
                            >
                              {invoicingEventId === sale.event_id ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Marking...
                                </span>
                              ) : (
                                'Mark as Paid'
                              )}
                            </button>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              Invoiced
                            </span>
                          </div>
                        )}
                        {sale.status === 'Paid' && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded">
                            Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default Sales; 