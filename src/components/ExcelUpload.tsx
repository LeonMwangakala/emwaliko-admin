import React, { useState, useRef } from 'react';
import { apiService } from '../services/api';

interface ExcelUploadProps {
  eventId: number;
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface GuestData {
  name: string;
  title?: string;
  card_type_id: number;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ eventId, onSuccess, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!validTypes.includes(file.type)) {
      onError('Please select a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Import xlsx dynamically to avoid SSR issues
      const XLSX = await import('xlsx');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Skip header row and process data
          const guests: GuestData[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row && row.length >= 1 && row[0]) {
              guests.push({
                name: row[0]?.toString() || '',
                title: row[1]?.toString() || '',
                card_type_id: parseInt(row[2]) || 1, // Default to card type ID 1
              });
            }
          }

          if (guests.length === 0) {
            throw new Error('No valid guest data found in the Excel file');
          }

          setUploadProgress(50);

          // Upload to backend
          await apiService.bulkCreateGuests(eventId, guests);
          
          setUploadProgress(100);
          onSuccess();
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          console.error('Error processing Excel file:', error);
          onError('Error processing Excel file. Please check the file format and try again.');
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      };

      reader.onerror = () => {
        onError('Error reading file');
        setIsUploading(false);
        setUploadProgress(0);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing xlsx:', error);
      onError('Error loading Excel processing library. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <button
        onClick={handleButtonClick}
        disabled={isUploading}
        className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        {isUploading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Excel
          </>
        )}
      </button>

      {isUploading && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>Supported formats: .xlsx, .xls, .csv</p>
        <p>Expected columns: Name, Title (optional), Card Type ID</p>
        <p>First row should be headers</p>
      </div>
    </div>
  );
};

export default ExcelUpload; 