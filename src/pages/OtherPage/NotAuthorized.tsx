import React from "react";
import { Link } from "react-router";

const NotAuthorized: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <h1 className="text-4xl font-bold text-red-600 mb-4">403 - Not Authorized</h1>
    <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">You do not have permission to view this page.</p>
    <Link
      to="/dashboard"
      className="px-6 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 transition"
    >
      Go to Dashboard
    </Link>
  </div>
);

export default NotAuthorized; 