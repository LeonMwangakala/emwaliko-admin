import { useState, type FC } from 'react';
import { apiService } from '../services/api';

interface RegenerateQrCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: number;
  eventName: string;
  totalGuests: number;
}

const RegenerateQrCodesModal: FC<RegenerateQrCodesModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  eventName,
  totalGuests
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const resetProgress = () => {
    setIsLoading(false);
    setProgress(0);
    setCurrentStep('');
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setProgress(0);
    setError('');
    setResult(null);
    setCurrentStep('Starting QR code regeneration...');

    const intervalId = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const response = await apiService.regenerateAllQrCodes(eventId);

      window.clearInterval(intervalId);
      setProgress(100);
      setCurrentStep('QR codes regenerated successfully!');
      setResult(response);

      setTimeout(() => {
        onSuccess();
        onClose();
        resetProgress();
        setResult(null);
        setError('');
      }, 2000);
    } catch (err: any) {
      window.clearInterval(intervalId);
      setError(err.message || 'Failed to regenerate QR codes');
      resetProgress();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[999999]">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4 p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Regenerate QR Codes
          </h2>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {!isLoading && !result && (
            <>
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Confirm QR Code Regeneration
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This will regenerate QR codes for all {totalGuests} guests in "{eventName}"
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Important Notice
                      </h4>
                      <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                        <ul className="list-disc list-inside space-y-1">
                          <li>All existing QR codes will be replaced</li>
                          <li>Previous QR codes will no longer work</li>
                          <li>Guest invite codes will remain the same</li>
                          <li>This action cannot be undone</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Regenerate All QR Codes
                </button>
              </div>
            </>
          )}

          {isLoading && (
            <div className="text-center">
              <div className="mb-4">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">
                  Regenerating QR Codes
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {currentStep}
                </p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">
                  QR Codes Regenerated Successfully!
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {result.message}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-4 dark:bg-green-900/20 dark:border-green-800">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-800 dark:text-green-200 font-medium">Total Guests:</span>
                    <span className="ml-2 text-green-700 dark:text-green-300">{result.total_guests}</span>
                  </div>
                  <div>
                    <span className="text-green-800 dark:text-green-200 font-medium">Successfully Regenerated:</span>
                    <span className="ml-2 text-green-700 dark:text-green-300">{result.success_count}</span>
                  </div>
                  {result.failed_count > 0 && (
                    <div className="col-span-2">
                      <span className="text-red-800 dark:text-red-200 font-medium">Failed:</span>
                      <span className="ml-2 text-red-700 dark:text-red-300">{result.failed_count}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegenerateQrCodesModal; 