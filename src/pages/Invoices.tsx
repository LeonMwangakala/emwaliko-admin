import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import NotAuthorized from "./OtherPage/NotAuthorized";
import { apiService } from "../services/api";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Pagination from "../components/common/Pagination";
import { FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Invoice {
  id: number;
  invoice_number: string;
  sales_id: number;
  event_id: number;
  total_amount: number;
  currency: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  invoice_date: string;
  due_date?: string;
  notes?: string;
  invoice_items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  sales?: {
    id: number;
    guest_count: number;
    status: string;
    package?: {
      name: string;
      amount: number;
      currency: string;
    };
  };
  event?: {
    id: number;
    event_name: string;
    event_date: string;
    customer?: {
      name: string;
      address?: string;
      physical_location?: string;
    };
  };
}

interface InvoiceStatistics {
  total_invoices: number;
  total_amount: number;
  paid_invoices: number;
  paid_amount: number;
  pending_invoices: number;
  pending_amount: number;
  overdue_invoices: number;
  overdue_amount: number;
}

const Invoices: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statistics, setStatistics] = useState<InvoiceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<number | null>(null);
  const [vatRate, setVatRate] = useState<number | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchVatRate();
    fetchPaymentSettings();
    fetchInvoices();
    fetchStatistics();
  }, [user, currentPage, itemsPerPage, searchTerm, statusFilter]);

  const fetchVatRate = async () => {
    try {
      const rate = await apiService.getVatRate();
      setVatRate(rate);
    } catch (e) {
      setVatRate(0.18); // fallback
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const settings = await apiService.getPaymentSettings();
      setPaymentSettings(settings);
    } catch (e) {
      console.error("Failed to fetch payment settings:", e);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: itemsPerPage,
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (statusFilter) {
        params.status = statusFilter;
      }
      
      const res = await apiService.getInvoices(params);
      
      if (res && typeof res === 'object' && 'data' in res) {
        const invoiceData = (res as any).data;
        setInvoices(invoiceData);
        setTotalItems((res as any).total || 0);
        setTotalPages((res as any).last_page || 1);
        
        // Auto-select first invoice if none selected
        if (!selectedInvoice && invoiceData.length > 0) {
          setSelectedInvoice(invoiceData[0]);
        }
      } else {
        const invoiceData = res as Invoice[];
        setInvoices(invoiceData);
        setTotalItems(invoiceData.length);
        setTotalPages(1);
        
        // Auto-select first invoice if none selected
        if (!selectedInvoice && invoiceData.length > 0) {
          setSelectedInvoice(invoiceData[0]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch invoices:", e);
      setError("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await apiService.getInvoiceStatistics();
      setStatistics(stats as InvoiceStatistics);
    } catch (e) {
      console.error("Failed to fetch statistics:", e);
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

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const handleUpdateStatus = async (invoiceId: number, newStatus: string) => {
    setUpdatingInvoiceId(invoiceId);
    try {
      await apiService.updateInvoiceStatus(invoiceId, newStatus);
      setError("");
      setSuccess("Invoice status updated successfully!");
      fetchInvoices();
      fetchStatistics();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      console.error("Error updating invoice status:", e);
      setError(e.message || "Failed to update invoice status");
      setSuccess("");
    } finally {
      setUpdatingInvoiceId(null);
    }
  };

  const handleDownloadInvoice = async (invoiceId: number) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Set background color for header
    doc.setFillColor(59, 130, 246); // Blue color
    doc.rect(0, 0, pageWidth, 120, 'F');
    
    // Add logo to the top left
    const logoUrl = '/images/logo/logo-dark.svg';
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = logoUrl;
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });
      
      // Convert SVG to canvas
      const logoCanvas = document.createElement('canvas');
      const logoCtx = logoCanvas.getContext('2d');
      logoCanvas.width = logoImg.width;
      logoCanvas.height = logoImg.height;
      logoCtx?.drawImage(logoImg, 0, 0);
      
      const logoDataUrl = logoCanvas.toDataURL('image/png');
      const logoWidth = 120;
      const logoHeight = 40;
      doc.addImage(logoDataUrl, 'PNG', 40, 30, logoWidth, logoHeight);
    } catch (error) {
      console.warn('Failed to add logo to PDF:', error);
    }
    
    // Add "INVOICE" title in white
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const titleText = 'INVOICE';
    const titleWidth = doc.getTextWidth(titleText);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(titleText, titleX, 60);
    
    // Add invoice number in white
    doc.setFontSize(16);
    doc.text(`Invoice #: ${invoice.invoice_number}`, pageWidth - 200, 60);
    
    // Reset text color to black
    doc.setTextColor(0, 0, 0);
    
    // Add decorative line
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(2);
    doc.line(40, 140, pageWidth - 40, 140);
    
    // Set font for addresses and details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Add "From" address on the left
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('From:', 40, 170);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Kadirafiki Events', 40, 190);
    doc.text('Event Management Services', 40, 205);
    doc.text('Dar es Salaam, Tanzania', 40, 220);
    doc.text('Phone: +255 123 456 789', 40, 235);
    doc.text('Email: info@kadirafiki.com', 40, 250);
    doc.text(`Issued On: ${formatDate(invoice.invoice_date)}`, 40, 265);
    
    // Add "To" address on the right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Bill To:', pageWidth - 250, 170);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(invoice.event?.customer?.name || 'Event Customer', pageWidth - 250, 190);
    doc.text(invoice.event?.customer?.physical_location || 'Address not specified', pageWidth - 250, 205);
    doc.text(`Event: ${invoice.event?.event_name}`, pageWidth - 250, 220);
    if (invoice.due_date) {
      doc.text(`Due Date: ${formatDate(invoice.due_date)}`, pageWidth - 250, 235);
    }
    
    // Create a temporary div for items table and totals only
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '600px';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12px';
    
    // Add items table with better styling
    tempDiv.innerHTML = `
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #374151; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">Invoice Items</h3>
        <table style="width: 100%; border-collapse: collapse; border: 2px solid #3b82f6; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <thead style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
            <tr>
              <th style="border: 1px solid #3b82f6; padding: 12px; text-align: left; font-weight: bold; color: white; font-size: 13px;">#</th>
              <th style="border: 1px solid #3b82f6; padding: 12px; text-align: left; font-weight: bold; color: white; font-size: 13px;">Description</th>
              <th style="border: 1px solid #3b82f6; padding: 12px; text-align: center; font-weight: bold; color: white; font-size: 13px;">Quantity</th>
              <th style="border: 1px solid #3b82f6; padding: 12px; text-align: right; font-weight: bold; color: white; font-size: 13px;">Unit Price</th>
              <th style="border: 1px solid #3b82f6; padding: 12px; text-align: right; font-weight: bold; color: white; font-size: 13px;">Total</th>
            </tr>
          </thead>
          <tbody style="background-color: #ffffff;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center; font-weight: bold; color: #374151;">1</td>
              <td style="border: 1px solid #e5e7eb; padding: 12px; color: #374151; font-weight: 500;">${invoice.sales?.package?.name || 'Event Package'}</td>
              <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center; color: #374151;">${invoice.sales?.guest_count || 1}</td>
              <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right; color: #374151;">${formatCurrency(invoice.sales?.package?.amount || invoice.total_amount, invoice.currency)}</td>
              <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right; font-weight: bold; color: #059669;">${formatCurrency(invoice.total_amount, invoice.currency)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div style="text-align: right; margin-top: 30px;">
        <div style="width: 350px; margin-left: auto; background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
            <span style="color: #64748b;">Sub Total:</span>
            <span style="font-weight: bold; color: #374151;">${formatCurrency(invoice.total_amount, invoice.currency)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
            <span style="color: #64748b;">VAT (${Math.round((vatRate || 0.18) * 100)}%):</span>
            <span style="font-weight: bold; color: #374151;">${formatCurrency(invoice.total_amount * (vatRate || 0.18), invoice.currency)}</span>
          </div>
          <div style="border-top: 2px solid #3b82f6; padding-top: 12px; margin-top: 15px;">
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
              <span style="color: #1e293b;">Total Amount:</span>
              <span style="color: #059669; font-size: 20px;">${formatCurrency(invoice.total_amount * (1 + (vatRate || 0.18)), invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 40px; padding: 20px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 8px; border-left: 4px solid #f59e0b;">
        <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: bold;">Payment Terms</h4>
        <p style="margin: 0; color: #92400e; font-size: 12px; line-height: 1.4;">
          ${paymentSettings?.payment_terms || 'Payment is due within 30 days of invoice date. Please include invoice number with your payment.'}
        </p>
        ${paymentSettings?.bank_payment_enabled ? `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #f59e0b;">
          <strong style="color: #92400e; font-size: 12px;">Bank Payment:</strong><br>
          <span style="color: #92400e; font-size: 11px;">${paymentSettings.getFormattedBankDetails ? paymentSettings.getFormattedBankDetails() : 
            `${paymentSettings.bank_name ? `Bank: ${paymentSettings.bank_name}` : ''} ${paymentSettings.account_name ? `| Account: ${paymentSettings.account_name}` : ''} ${paymentSettings.account_number ? `| Number: ${paymentSettings.account_number}` : ''} ${paymentSettings.swift_code ? `| Swift: ${paymentSettings.swift_code}` : ''}`.trim()}</span>
        </div>
        ` : ''}
        ${paymentSettings?.mobile_money_enabled ? `
        <div style="margin-top: 8px;">
          <strong style="color: #92400e; font-size: 12px;">Mobile Money:</strong><br>
          <span style="color: #92400e; font-size: 11px;">${paymentSettings.getFormattedMobileMoneyDetails ? paymentSettings.getFormattedMobileMoneyDetails() : 
            `${paymentSettings.mobile_network ? `Network: ${paymentSettings.mobile_network}` : ''} ${paymentSettings.payment_name ? `| Name: ${paymentSettings.payment_name}` : ''} ${paymentSettings.payment_number ? `| Number: ${paymentSettings.payment_number}` : ''}`.trim()}</span>
        </div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(tempDiv);
    
    try {
      const canvas = await html2canvas(tempDiv, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions to fit the content properly
      const imgWidth = pageWidth - 80; // 40px margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add invoice content below addresses
      const contentY = 290; // Start content below addresses
      doc.addImage(imgData, 'PNG', 40, contentY, imgWidth, imgHeight, '', 'FAST');
    } finally {
      // Clean up the temporary div
      document.body.removeChild(tempDiv);
    }
    
    // Add footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128);
    doc.text('Thank you for choosing Kadirafiki Events!', pageWidth / 2, pageHeight - 40, { align: 'center' });
    
    // Save with invoice number as filename
    doc.save(`${invoice.invoice_number}.pdf`);
  };

  const formatCurrency = (amount: number, currency: string = 'TZS') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const [datePart] = dateString.split('T');
    if (!datePart) return 'Invalid Date';
    const [year, month, day] = datePart.split('-');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'text-gray-600';
      case 'Sent':
        return 'text-blue-600';
      case 'Paid':
        return 'text-green-600';
      case 'Overdue':
        return 'text-red-600';
      case 'Cancelled':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!user) return null;

  // Only admin can access this page
  if (user.role_id !== 1) {
    return <NotAuthorized />;
  }

  return (
    <>
      <PageMeta title="Invoices | Admin" description="View all invoices" />
      <PageBreadcrumb pageTitle="Invoices" />
      
      <div className="space-y-6">
        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ComponentCard title="Total Invoices">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.total_invoices}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatCurrency(statistics.total_amount)}
              </div>
            </ComponentCard>
            
            <ComponentCard title="Paid Invoices">
              <div className="text-2xl font-bold text-green-600">
                {statistics.paid_invoices}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatCurrency(statistics.paid_amount)}
              </div>
            </ComponentCard>
            
            <ComponentCard title="Pending Invoices">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.pending_invoices}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatCurrency(statistics.pending_amount)}
              </div>
            </ComponentCard>
            
            <ComponentCard title="Overdue Invoices">
              <div className="text-2xl font-bold text-red-600">
                {statistics.overdue_invoices}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatCurrency(statistics.overdue_amount)}
              </div>
            </ComponentCard>
          </div>
        )}

        {/* Main Content - Two Panel Layout */}
        {vatRate === null ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            <span className="ml-4 text-gray-600">Loading VAT rate...</span>
          </div>
        ) : (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-300px)]">
          {/* Left Sidebar - Invoice List */}
          <div className="lg:w-1/3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invoices</h2>
              
              {/* Search Bar */}
              <div className="mt-3 relative">
                <input
                  type="text"
                  placeholder="Search Invoice..."
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

              {/* Status Filter */}
              <div className="mt-3">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Invoice List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
                </div>
              ) : invoices.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {(searchTerm || statusFilter) ? 'No invoices found matching your criteria.' : 'No invoices found.'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      onClick={() => setSelectedInvoice(invoice)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedInvoice?.id === invoice.id
                          ? 'bg-gray-100 dark:bg-gray-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                            {invoice.event?.event_name?.charAt(0) || 'I'}
                          </span>
                        </div>
                        
                        {/* Invoice Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {invoice.event?.event_name || 'Unknown Event'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ID: #{invoice.invoice_number}
                          </p>
                          <p className={`text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            )}
          </div>

          {/* Right Panel - Invoice Details */}
          <div className="lg:w-2/3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
            {selectedInvoice ? (
              <>
                {/* Invoice Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice</h1>
                    <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                      ID: #{selectedInvoice.invoice_number}
                    </span>
                  </div>
                </div>

                {/* Invoice Content */}
                <div id={`invoice-pdf-${selectedInvoice.id}`} className="flex-1 p-6 overflow-y-auto">
                  {/* From and To Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* From Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">From</h3>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Kadirafiki Events
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Event Management Services
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Dar es Salaam, Tanzania
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Issued On: {formatDate(selectedInvoice.invoice_date)}
                        </p>
                      </div>
                    </div>

                    {/* To Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">To</h3>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedInvoice.event?.customer?.name || 'Event Customer'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedInvoice.event?.customer?.address || 'Address not specified'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Event: {selectedInvoice.event?.event_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Due On: {selectedInvoice.due_date ? formatDate(selectedInvoice.due_date) : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Items Table */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invoice Items</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit Cost</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">1</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {selectedInvoice.sales?.package?.name || 'Event Package'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {selectedInvoice.sales?.guest_count || 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatCurrency(selectedInvoice.sales?.package?.amount || selectedInvoice.total_amount, selectedInvoice.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Invoice Summary */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Sub Total amount:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Vat ({Math.round(vatRate * 100)}%):</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {formatCurrency(selectedInvoice.total_amount * vatRate, selectedInvoice.currency)}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-gray-900 dark:text-white">Total:</span>
                          <span className="text-gray-900 dark:text-white">
                            {formatCurrency(selectedInvoice.total_amount * (1 + vatRate), selectedInvoice.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => handleDownloadInvoice(selectedInvoice.id)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <FaDownload className="w-4 h-4" />
                      Download
                    </button>
                    {selectedInvoice.status === 'Sent' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedInvoice.id, 'Paid')}
                        disabled={updatingInvoiceId === selectedInvoice.id}
                        className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors disabled:opacity-50"
                      >
                        {updatingInvoiceId === selectedInvoice.id ? 'Processing...' : 'Proceed to payment'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Invoice Selected</h3>
                  <p className="text-gray-500 dark:text-gray-400">Select an invoice from the list to view its details.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Error and Success Messages */}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
      </div>
    </>
  );
};

export default Invoices; 