import { useEffect, useState, type FC } from "react";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Pagination from "../components/common/Pagination";
import * as ExcelJS from 'exceljs';

interface ReportData {
  data: any[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary: any;
}

interface FilterOptions {
  event_statuses: string[];
  sales_statuses: string[];
  notification_types: string[];
  notification_statuses: string[];
  scan_statuses: string[];
  rsvp_statuses: string[];
  customers: Array<{ id: number; name: string }>;
  event_types: Array<{ id: number; name: string }>;
  packages: Array<{ id: number; name: string }>;
  events: Array<{ id: number; event_name: string; event_date: string }>;
}

type ReportType = "events" | "sales" | "guests" | "financial" | "notifications" | "scans";

const Reports: FC = () => {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState<ReportType>("events");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchFilterOptions();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchReportData();
  }, [user, activeReport, filters, currentPage, itemsPerPage, searchTerm]);

  const fetchFilterOptions = async () => {
    try {
      const options = await apiService.getReportFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
        search: searchTerm,
        ...filters,
      };

      let data: ReportData;
      
      switch (activeReport) {
        case "events":
          data = await apiService.getEventReports(params);
          break;
        case "sales":
          data = await apiService.getSalesReports(params);
          break;
        case "guests":
          data = await apiService.getGuestReports(params);
          break;
        case "financial":
          data = await apiService.getFinancialReports(params);
          break;
        case "notifications":
          data = await apiService.getNotificationReports(params);
          break;
        case "scans":
          data = await apiService.getScanReports(params);
          break;
        default:
          data = await apiService.getEventReports(params);
      }
      
      setReportData(data);
    } catch (error: any) {
      console.error("Failed to fetch report data:", error);
      setError(error.message || "Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleExportExcel = async () => {
    if (!reportData?.data || reportData.data.length === 0) {
      alert('No data to export');
      return;
    }

    setExportLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Add metadata
      workbook.creator = 'Kadirafiki Admin';
      workbook.lastModifiedBy = 'Kadirafiki Admin';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      const worksheet = workbook.addWorksheet(`${activeReport.charAt(0).toUpperCase() + activeReport.slice(1)} Report`);
      
      // Set up the worksheet
      worksheet.properties.defaultRowHeight = 20;
      worksheet.properties.defaultColWidth = 15;
      
      // Add title and metadata
      const titleRow = worksheet.addRow([]);
      titleRow.height = 30;
      const titleCell = titleRow.getCell(1);
      titleCell.value = `${activeReport.charAt(0).toUpperCase() + activeReport.slice(1)} Report`;
      titleCell.font = { bold: true, size: 16, color: { argb: 'FF2E5BBA' } };
      titleCell.alignment = { horizontal: 'center' };
      worksheet.mergeCells('A1:F1');
      
      // Add date
      const dateRow = worksheet.addRow([]);
      const dateCell = dateRow.getCell(1);
      dateCell.value = `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
      dateCell.font = { size: 10, color: { argb: 'FF666666' } };
      dateCell.alignment = { horizontal: 'center' };
      worksheet.mergeCells('A2:F2');
      
      // Add summary statistics
      if (reportData.summary) {
        worksheet.addRow([]); // Empty row
        const summaryRow = worksheet.addRow([]);
        const summaryCell = summaryRow.getCell(1);
        summaryCell.value = 'Summary Statistics';
        summaryCell.font = { bold: true, size: 14, color: { argb: 'FF2E5BBA' } };
        worksheet.mergeCells('A4:F4');
        
        // Add summary data
        const summaryData = Object.entries(reportData.summary);
        const summaryRows = [];
        for (let i = 0; i < summaryData.length; i += 2) {
          const row = [];
          row.push(summaryData[i][0].replace(/_/g, ' ').toUpperCase());
          row.push(summaryData[i][1]);
          if (summaryData[i + 1]) {
            row.push(summaryData[i + 1][0].replace(/_/g, ' ').toUpperCase());
            row.push(summaryData[i + 1][1]);
          }
          summaryRows.push(row);
        }
        
        summaryRows.forEach((row) => {
          const excelRow = worksheet.addRow(row);
          excelRow.height = 25;
          excelRow.getCell(1).font = { bold: true, size: 11 };
          excelRow.getCell(2).font = { size: 11 };
          if (row[2]) {
            excelRow.getCell(3).font = { bold: true, size: 11 };
            excelRow.getCell(4).font = { size: 11 };
          }
        });
        
        worksheet.addRow([]); // Empty row
      }
      
      // Add data section title
      const dataTitleRow = worksheet.addRow([]);
      const dataTitleCell = dataTitleRow.getCell(1);
      dataTitleCell.value = 'Detailed Data';
      dataTitleCell.font = { bold: true, size: 14, color: { argb: 'FF2E5BBA' } };
      worksheet.mergeCells(`A${worksheet.rowCount}:F${worksheet.rowCount}`);
      
      // Add headers
      const headers = getTableHeaders();
      const headerRow = worksheet.addRow(headers);
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2E5BBA' }
        };
        cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF2E5BBA' } },
          left: { style: 'thin', color: { argb: 'FF2E5BBA' } },
          bottom: { style: 'thin', color: { argb: 'FF2E5BBA' } },
          right: { style: 'thin', color: { argb: 'FF2E5BBA' } }
        };
      });
      
      // Add data rows
      reportData.data.forEach((item, index) => {
        const rowData = formatRowDataForExport(item);
        const row = worksheet.addRow(rowData);
        row.height = 22;
        
        // Style the row
        row.eachCell((cell, colNumber) => {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
          
          // Alternate row colors
          if (index % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8F9FA' }
            };
          }
          
          // Style specific columns
          if (colNumber === 1) {
            cell.font = { bold: true, size: 11 };
          }
          
          // Style currency columns
          if (activeReport === 'sales' && (colNumber === 4)) {
            cell.font = { bold: true, size: 11, color: { argb: 'FF28A745' } };
          }
          
          // Style status columns
          if (headers[colNumber - 1]?.toLowerCase().includes('status')) {
            const status = cell.value?.toString().toLowerCase();
            if (status === 'completed' || status === 'paid' || status === 'sent' || status === 'scanned') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD4EDDA' }
              };
              cell.font = { color: { argb: 'FF155724' } };
            } else if (status === 'pending' || status === 'not sent') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8D7DA' }
              };
              cell.font = { color: { argb: 'FF721C24' } };
            }
          }
        });
      });
      
      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        column.width = Math.max(15, Math.min(30, column.width || 15));
      });
      
      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeReport}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      setExportLoading(false);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Failed to export Excel file');
      setExportLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!reportData?.data || reportData.data.length === 0) {
      alert('No data to export');
      return;
    }

    setExportLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Set up fonts and colors
      doc.setFont('helvetica');
      const primaryColor: [number, number, number] = [46, 91, 186]; // #2E5BBA
      const secondaryColor: [number, number, number] = [102, 102, 102]; // #666666
      const successColor: [number, number, number] = [40, 167, 69]; // #28A745
      const dangerColor: [number, number, number] = [220, 53, 69]; // #DC3545
      
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Add header
      doc.setFontSize(24);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      const title = `${activeReport.charAt(0).toUpperCase() + activeReport.slice(1)} Report`;
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, yPosition);
      yPosition += 15;
      
      // Add date
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFont('helvetica', 'normal');
      const dateText = `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
      const dateWidth = doc.getTextWidth(dateText);
      doc.text(dateText, (pageWidth - dateWidth) / 2, yPosition);
      yPosition += 20;
      
      // Add summary statistics
      if (reportData.summary) {
        doc.setFontSize(16);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary Statistics', margin, yPosition);
        yPosition += 10;
        
        // Create summary table
        const summaryData = Object.entries(reportData.summary);
        const summaryRows = [];
        for (let i = 0; i < summaryData.length; i += 2) {
          const row = [];
          row.push(summaryData[i][0].replace(/_/g, ' ').toUpperCase());
          row.push(summaryData[i][1]);
          if (summaryData[i + 1]) {
            row.push(summaryData[i + 1][0].replace(/_/g, ' ').toUpperCase());
            row.push(summaryData[i + 1][1]);
          }
          summaryRows.push(row);
        }
        
        // Draw summary table
        const summaryColWidths = [60, 40, 60, 40];
        let summaryX = margin;
        
        summaryRows.forEach((row) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Draw row background
          doc.setFillColor(248, 249, 250);
          doc.rect(summaryX, yPosition - 5, contentWidth, 8, 'F');
          
          // Draw borders
          doc.setDrawColor(200, 200, 200);
          doc.rect(summaryX, yPosition - 5, contentWidth, 8);
          
          // Add text
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text(String(row[0] || ''), summaryX + 2, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(String(row[1] || ''), summaryX + summaryColWidths[0] + 2, yPosition);
          
          if (row[2]) {
            doc.setFont('helvetica', 'bold');
            doc.text(String(row[2] || ''), summaryX + summaryColWidths[0] + summaryColWidths[1] + 2, yPosition);
            doc.setFont('helvetica', 'normal');
            doc.text(String(row[3] || ''), summaryX + summaryColWidths[0] + summaryColWidths[1] + summaryColWidths[2] + 2, yPosition);
          }
          
          yPosition += 10;
        });
        
        yPosition += 15;
      }
      
      // Add data section title
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Data', margin, yPosition);
      yPosition += 10;
      
      // Add headers
      const headers = getTableHeaders();
      const colWidths = headers.map(() => contentWidth / headers.length);
      let headerX = margin;
      
      // Draw header background
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(headerX, yPosition - 5, contentWidth, 8, 'F');
      
      // Add header text
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      headers.forEach((header) => {
        doc.text(String(header || ''), headerX + 2, yPosition);
        headerX += colWidths[headers.indexOf(header)];
      });
      
      yPosition += 10;
      
      // Add data rows
      reportData.data.forEach((item, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        const rowData = formatRowDataForExport(item);
        let dataX = margin;
        
        // Draw row background (alternating)
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(dataX, yPosition - 5, contentWidth, 8, 'F');
        }
        
        // Draw borders
        doc.setDrawColor(200, 200, 200);
        doc.rect(dataX, yPosition - 5, contentWidth, 8);
        
        // Add row text
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        rowData.forEach((cellData, colIndex) => {
          doc.setFont('helvetica', colIndex === 0 ? 'bold' : 'normal');
          
          // Style specific columns
          if (activeReport === 'sales' && colIndex === 3) {
            doc.setTextColor(successColor[0], successColor[1], successColor[2]);
            doc.setFont('helvetica', 'bold');
          } else if (headers[colIndex]?.toLowerCase().includes('status')) {
            const status = String(cellData).toLowerCase();
            if (status === 'completed' || status === 'paid' || status === 'sent' || status === 'scanned') {
              doc.setTextColor(successColor[0], successColor[1], successColor[2]);
            } else if (status === 'pending' || status === 'not sent') {
              doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
            }
          }
          
          doc.text(String(cellData || ''), dataX + 2, yPosition);
          dataX += colWidths[colIndex];
        });
        
        yPosition += 10;
      });
      
      // Add footer
      doc.setFontSize(8);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFont('helvetica', 'normal');
      const footerText = `Page ${doc.getCurrentPageInfo().pageNumber} of ${doc.getNumberOfPages()}`;
      const footerWidth = doc.getTextWidth(footerText);
      doc.text(footerText, (pageWidth - footerWidth) / 2, 280);
      
      // Generate and download
      doc.save(`${activeReport}_report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setExportLoading(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF file');
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'TZS') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
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
      case 'active':
      case 'completed':
      case 'Paid':
      case 'Sent':
      case 'scanned':
      case 'Yes':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
      case 'cancelled':
      case 'Pending':
      case 'Not Sent':
      case 'not_scanned':
      case 'No':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'initiated':
      case 'inprogress':
      case 'notified':
      case 'Maybe':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTableHeaders = (): string[] => {
    switch (activeReport) {
      case 'events':
        return ['Event Name', 'Event Code', 'Customer', 'Event Type', 'Date', 'Status'];
      case 'sales':
        return ['Event', 'Package', 'Guest Count', 'Total Sale', 'Status'];
      case 'guests':
        return ['Name', 'Event', 'Phone', 'RSVP Status', 'Card Class'];
      case 'notifications':
        return ['Guest', 'Event', 'Type', 'Status', 'Message'];
      case 'scans':
        return ['Guest', 'Event', 'Quantity', 'Scan Count', 'Status', 'Scanned By'];
      case 'financial':
        return ['Event', 'Package', 'Guest Count', 'Total Sale', 'Status', 'Date'];
      default:
        return [];
    }
  };

  const formatRowDataForExport = (item: any): (string | number)[] => {
    switch (activeReport) {
      case 'events':
        return [
          item.event_name || 'N/A',
          item.event_code || 'N/A',
          item.customer?.name || 'N/A',
          item.event_type?.name || 'N/A',
          item.event_date ? formatDate(item.event_date) : 'N/A',
          item.status || 'N/A',
        ];
      case 'sales':
        return [
          item.event?.event_name || 'N/A',
          item.package?.name || 'N/A',
          item.guest_count || 0,
          formatCurrency(item.total_sale || 0),
          item.status || 'N/A',
        ];
      case 'guests':
        return [
          item.name || 'N/A',
          item.event?.event_name || 'N/A',
          item.phone_number || 'N/A',
          item.rsvp_status || 'N/A',
          item.card_class?.name || 'N/A',
        ];
      case 'notifications':
        return [
          item.guest?.name || 'N/A',
          item.guest?.event?.event_name || 'N/A',
          item.notification_type || 'N/A',
          item.status || 'N/A',
          item.message || 'N/A',
        ];
      case 'scans':
        return [
          item.guest?.name || 'N/A',
          item.guest?.event?.event_name || 'N/A',
          item.quantity || 0,
          item.scan_count || 0,
          item.status || 'N/A',
          item.scanned_by?.name || 'N/A',
        ];
      case 'financial':
        return [
          item.event?.event_name || 'N/A',
          item.package?.name || 'N/A',
          item.guest_count || 0,
          formatCurrency(item.total_sale || 0),
          item.status || 'N/A',
          item.created_at ? formatDate(item.created_at) : 'N/A',
        ];
      default:
        return [];
    }
  };

  const reportConfig = [
    { key: "events" as ReportType, label: "Event Reports", icon: "📊" },
    { key: "sales" as ReportType, label: "Sales Reports", icon: "💰" },
    { key: "guests" as ReportType, label: "Guest Reports", icon: "👥" },
    { key: "financial" as ReportType, label: "Financial Reports", icon: "📈" },
    { key: "notifications" as ReportType, label: "Notification Reports", icon: "📱" },
    { key: "scans" as ReportType, label: "Scan Reports", icon: "📱" },
  ];

  if (!user) return null;

  return (
    <>
      <PageMeta title="Reports | Kadirafiki Admin" description="Comprehensive reports and analytics" />
      <PageBreadcrumb pageTitle="Reports & Analytics" />
      
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
              <p className="text-brand-100 text-lg">Comprehensive insights and data analysis</p>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{reportData?.pagination?.total || 0}</div>
                  <div className="text-brand-100 text-sm">Total Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{activeReport}</div>
                  <div className="text-brand-100 text-sm">Active Report</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Type Selection */}
        <ComponentCard title="Select Report Type">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {reportConfig.map((report) => (
              <button
                key={report.key}
                onClick={() => setActiveReport(report.key)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                  activeReport === report.key
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-300 dark:hover:border-brand-600'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{report.icon}</div>
                  <div className="text-sm font-medium">{report.label}</div>
                </div>
              </button>
            ))}
          </div>
        </ComponentCard>

        {/* Filters Section */}
        <ComponentCard title="Filters & Search">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-4 py-3 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Filter Options */}
            {filterOptions && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                {activeReport === 'events' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Status
                    </label>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">All Statuses</option>
                      {filterOptions.event_statuses.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sales Status Filter */}
                {activeReport === 'sales' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sale Status
                    </label>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">All Statuses</option>
                      {filterOptions.sales_statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date Range Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Summary Statistics */}
        {reportData?.summary && (
          <ComponentCard 
            title="Summary Statistics" 
            action={
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportExcel}
                  disabled={exportLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exportLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  Export Excel
                </button>
                <button
                  onClick={handleExportPdf}
                  disabled={exportLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exportLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  Export PDF
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <div key={key} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brand-600 dark:text-brand-400 mb-1">
                      {typeof value === 'number' && key.includes('revenue') 
                        ? formatCurrency(value as number)
                        : typeof value === 'number' && key.includes('amount')
                        ? formatCurrency(value as number)
                        : String(value)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 capitalize font-medium">
                      {key.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ComponentCard>
        )}

        {/* Report Data */}
        <ComponentCard title={`${reportConfig.find(r => r.key === activeReport)?.label} Data`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading report data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Data</h3>
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : reportData?.data && reportData.data.length > 0 ? (
            <div className="space-y-4">
              {/* Data Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {activeReport === "events" && (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event Name</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event Code</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event Type</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        </>
                      )}
                      {activeReport === "sales" && (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Package</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guest Count</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Sale</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        </>
                      )}
                      {activeReport === "guests" && (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RSVP Status</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Card Class</th>
                        </>
                      )}
                      {activeReport === "notifications" && (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guest</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</th>
                        </>
                      )}
                      {activeReport === "scans" && (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guest</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scan Count</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scanned By</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.data.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        {activeReport === "events" && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                              {item.event_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                {item.event_code}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {item.customer?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {item.event_type?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatDate(item.event_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                          </>
                        )}
                        {activeReport === "sales" && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                              {item.event?.event_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {item.package?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                {item.guest_count || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">
                              {formatCurrency(item.total_sale || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                          </>
                        )}
                        {activeReport === "guests" && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {item.event?.event_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {item.phone_number || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(item.rsvp_status)}`}>
                                {item.rsvp_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {item.card_class?.name || 'N/A'}
                            </td>
                          </>
                        )}
                        {activeReport === "notifications" && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                              {item.guest?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {item.guest?.event?.event_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.notification_type === 'WhatsApp' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                              }`}>
                                {item.notification_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate" title={item.message}>
                              {item.message}
                            </td>
                          </>
                        )}
                        {activeReport === "scans" && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                              {item.guest?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {item.guest?.event?.event_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                {item.quantity || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                {item.scan_count || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {item.scanned_by?.name || 'N/A'}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {reportData.pagination && reportData.pagination.last_page > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((reportData.pagination.current_page - 1) * reportData.pagination.per_page) + 1} to{' '}
                    {Math.min(reportData.pagination.current_page * reportData.pagination.per_page, reportData.pagination.total)} of{' '}
                    {reportData.pagination.total} results
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={reportData.pagination.last_page}
                    totalItems={reportData.pagination.total}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Data Found</h3>
              <p className="text-gray-500 dark:text-gray-400">No records match your current filters.</p>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default Reports; 