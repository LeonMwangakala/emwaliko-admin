import React from "react";

interface Event {
  id: number;
  event_name: string;
  title?: string; // Keep for backward compatibility
  description?: string;
  event_date: string;
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

interface EventsTableProps {
  events: Event[];
  onEdit?: (event: Event) => void;
  onView?: (event: Event) => void;
}

const EventsTable: React.FC<EventsTableProps> = ({ 
  events, 
  onEdit, 
  onView 
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    // Extract YYYY-MM-DD from ISO string
    const [datePart] = dateString.split('T');
    if (!datePart) return 'Invalid Date';
    const [year, month, day] = datePart.split('-');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    // Extract HH:MM from ISO string
    const timePart = dateString.split('T')[1];
    if (!timePart) return '';
    const [hour, minute] = timePart.split(':');
    return `${hour}:${minute}`;
  };

  const formatPackage = (packageData?: { name: string; amount: number; currency: string }) => {
    if (!packageData) return "Not specified";
    return packageData.name;
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

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              S.No
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Event Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Customer Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Package
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Guests
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {events.map((event, index) => (
            <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {index + 1}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {event.event_name || event.title}
                  </div>
                  {event.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {event.description}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {event.customer?.name || "Not specified"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(event.event_date)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatTime(event.event_date)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatPackage(event.package)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {event.guests_count || 0}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${formatStatus(event.status)}`}>
                  {event.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  {onView && (
                    <button
                      onClick={() => onView(event)}
                      className="inline-flex items-center justify-center w-8 h-8 text-brand-600 bg-brand-50 border border-brand-200 rounded-md hover:bg-brand-100 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-800 dark:hover:bg-brand-900/30"
                      title="View Event"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(event)}
                      className="inline-flex items-center justify-center w-8 h-8 text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30"
                      title="Edit Event"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default EventsTable; 