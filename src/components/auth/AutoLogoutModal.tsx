import { useEffect, useState, type FC } from 'react';

interface AutoLogoutModalProps {
  isOpen: boolean;
  onStayLoggedIn: () => void;
  onLogout: () => void;
  timeRemaining: number;
}

const AutoLogoutModal: FC<AutoLogoutModalProps> = ({
  isOpen,
  onStayLoggedIn,
  onLogout,
  timeRemaining
}) => {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (isOpen && countdown === 0) {
      onLogout();
    }
  }, [isOpen, countdown, onLogout]);

  // Reset countdown when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCountdown(timeRemaining);
    }
  }, [isOpen, timeRemaining]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(timeRemaining);
    }
  }, [isOpen, timeRemaining]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
            <svg
              className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Session Timeout Warning
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You have been inactive for 10 minutes. You will be automatically logged out in{' '}
            <span className="font-semibold text-red-600 dark:text-red-400">
              {countdown} seconds
            </span>
            .
          </p>
          
          <div className="flex justify-center space-x-3">
            <button
              onClick={onStayLoggedIn}
              className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
            >
              Stay Logged In
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Logout Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoLogoutModal; 