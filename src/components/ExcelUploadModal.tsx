import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { PhoneNumberValidator } from '../utils/phoneValidation';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
  eventId: number;
}

interface ParsedGuest {
  name: string;
  title?: string;
  phone_number: string;
  card_class_id: number;
  rowNumber: number;
  isValid: boolean;
  errors: string[];
}

const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  eventId
}) => {
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedGuest[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validating, setValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    // Create sample data for the template with the correct structure
    const templateData = [
      {
        Name: 'John Doe',
        Title: 'Mr.',
        'Phone Number': '0712345678',
        'Card Class': 1
      },
      {
        Name: 'Jane Smith',
        Title: 'Ms.',
        'Phone Number': '0612345678',
        'Card Class': 2
      },
      {
        Name: 'Bob Johnson',
        Title: 'Dr.',
        'Phone Number': '0812345678',
        'Card Class': 3
      },
      {
        Name: 'Alice Brown',
        Title: 'Mrs.',
        'Phone Number': '0712345678',
        'Card Class': 1
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Guests Template');

    // Generate and download the file
    XLSX.writeFile(wb, `guests_template_event_${eventId}.xlsx`);
  };

  const validateGuestData = (data: any, rowNumber: number, allPhoneNumbers: string[] = []): ParsedGuest => {
    const errors: string[] = [];
    
    // Validate name
    if (!data.Name || !data.Name.trim()) {
      errors.push('Name is required');
    }
    
    // Validate phone number
    if (!data['Phone Number'] || !data['Phone Number'].trim()) {
      errors.push('Phone number is required');
    } else {
      const phoneValidation = PhoneNumberValidator.validateAndNormalize(data['Phone Number'].trim());
      if (!phoneValidation.isValid) {
        errors.push(phoneValidation.error || 'Invalid phone number format');
      } else {
        // Check for duplicate phone numbers within uploaded data
        const phoneNumber = phoneValidation.normalized!;
        const phoneNumberCount = allPhoneNumbers.filter(p => p === phoneNumber).length;
        if (phoneNumberCount > 1) {
          errors.push('Duplicate phone number in uploaded data');
        }
      }
    }
    
    // Validate card class - convert to number and validate
    const cardClassStr = data['Card Class']?.trim() || '';
    const cardClass = parseInt(cardClassStr);
    if (isNaN(cardClass) || ![1, 2, 3].includes(cardClass)) {
      errors.push('Card Class must be 1, 2, or 3');
    }
    
    return {
      name: data.Name?.trim() || '',
      title: data.Title?.trim() || '',
      phone_number: data['Phone Number']?.trim() || '',
      card_class_id: cardClass,
      rowNumber,
      isValid: errors.length === 0,
      errors
    };
  };

  const checkExistingPhoneNumbers = async (): Promise<string[]> => {
    try {
      const response = await fetch(`/api/events/${eventId}/guests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data.map((guest: any) => guest.phone_number);
      }
    } catch (error) {
      console.error('Error fetching existing phone numbers:', error);
    }
    
    return [];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!validTypes.includes(file.type)) {
      onError('Please upload a valid Excel file (.xlsx, .xls) or CSV file (.csv)');
      return;
    }

    setValidating(true);

    try {
      // Fetch existing phone numbers for this event
      const existingPhoneNumbers = await checkExistingPhoneNumbers();
      
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      // Skip header row and parse data
      const dataRows = jsonData.slice(1);
      const parsedGuests: ParsedGuest[] = [];
      
      // Extract all phone numbers from uploaded data for duplicate checking
      const uploadedPhoneNumbers = dataRows.map((row: any) => String(row[2] || '').trim()).filter(p => p);

      dataRows.forEach((row: any, index: number) => {
        const rowData = {
          Name: String(row[0] || ''),
          Title: String(row[1] || ''),
          'Phone Number': String(row[2] || ''),
          'Card Class': String(row[3] || '')
        };
        
        const validatedGuest = validateGuestData(rowData, index + 2, uploadedPhoneNumbers);
        
        // Add check for existing phone numbers in the event
        if (validatedGuest.isValid && existingPhoneNumbers.includes(validatedGuest.phone_number)) {
          validatedGuest.errors.push('Phone number already exists in this event');
          validatedGuest.isValid = false;
        }
        
        parsedGuests.push(validatedGuest);
      });

      setParsedData(parsedGuests);
      setShowValidationModal(true);
    } catch (error) {
      console.error('File parsing error:', error);
      onError(error instanceof Error ? error.message : 'Failed to parse file');
    } finally {
      setValidating(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmitValidatedData = async () => {
    const validGuests = parsedData.filter(guest => guest.isValid);
    
    if (validGuests.length === 0) {
      onError('No valid guests found in the uploaded file');
      return;
    }

    setUploading(true);

    try {
      const guestsToUpload = validGuests.map(guest => ({
        name: guest.name,
        title: guest.title || null,
        phone_number: guest.phone_number,
        card_class_id: guest.card_class_id,
        event_id: eventId
      }));

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.GUESTS.BULK_CREATE(eventId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ guests: guestsToUpload }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      onSuccess();
      onClose();
      setShowValidationModal(false);
      setParsedData([]);
    } catch (error) {
      console.error('Upload error:', error);
      onError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getCardClassName = (cardClassId: number): string => {
    switch (cardClassId) {
      case 1: return 'SINGLE';
      case 2: return 'DOUBLE';
      case 3: return 'MULTIPLE';
      default: return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[999999]">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg mx-4">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upload Guests
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

          <div className="p-6 space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                File Requirements:
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Supported formats: .xlsx, .xls, .csv</li>
                <li>• Expected columns: Name, Title (optional), Phone Number, Card Class</li>
                <li>• First row should be headers</li>
                <li>• Keep the column structure exactly as shown in the template</li>
                <li>• Card Class values: 1 = SINGLE, 2 = DOUBLE, 3 = MULTIPLE</li>
                <li>• Phone Number should include country code (e.g., +255 123 456 789)</li>
                <li>• Title is optional and can be left empty</li>
              </ul>
            </div>

            {/* Template Download */}
            <div className="text-center">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Template
              </button>
            </div>

            {/* File Upload */}
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={validating}
                className="inline-flex items-center px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {validating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose File
                  </>
                )}
              </button>
            </div>

            {/* Note */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Download the template, fill it with your guest data, then upload it back.</p>
              <p className="mt-1">Make sure to keep the column headers exactly as shown in the template.</p>
              <p className="mt-1 text-amber-600 dark:text-amber-400">
                <strong>Important:</strong> Do NOT add the "+" sign to phone numbers in Excel. 
                Use format like "0712345678" for Tanzanian numbers.
              </p>
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[999999]">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review Uploaded Data
              </h3>
              <button
                onClick={() => {
                  setShowValidationModal(false);
                  setParsedData([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Summary */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {parsedData.filter(g => g.isValid).length}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">Valid Guests</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {parsedData.filter(g => !g.isValid).length}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">Invalid Guests</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {parsedData.length}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Total Rows</div>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Row
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Card Class
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Errors
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {parsedData.map((guest, index) => (
                      <tr key={index} className={guest.isValid ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : 'bg-red-50 dark:bg-red-900/20'}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {guest.rowNumber}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {guest.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {guest.title || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {guest.phone_number}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {guest.card_class_id} ({getCardClassName(guest.card_class_id)})
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            guest.isValid 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {guest.isValid ? 'Valid' : 'Invalid'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-red-600 dark:text-red-400">
                          {guest.errors.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {guest.errors.map((error, errorIndex) => (
                                <li key={errorIndex}>{error}</li>
                              ))}
                            </ul>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 space-x-3">
              <button
                onClick={() => {
                  setShowValidationModal(false);
                  setParsedData([]);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitValidatedData}
                disabled={uploading || parsedData.filter(g => g.isValid).length === 0}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  `Upload ${parsedData.filter(g => g.isValid).length} Valid Guests`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExcelUploadModal; 