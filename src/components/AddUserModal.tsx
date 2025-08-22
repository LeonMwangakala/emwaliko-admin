import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";

interface User {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  role_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  role?: Role;
}

interface Role {
  id: number;
  name: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
  user?: User | null;
  roles: Role[];
}

interface UserFormData {
  name: string;
  email: string;
  phone_number: string;
  password: string;
  role_id: string;
  status: string;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  user,
  roles
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phone_number: "",
    password: "",
    role_id: "",
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        password: "", // Password is not editable
        role_id: user.role_id.toString(),
        status: user.status,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone_number: "",
        password: "",
        role_id: "",
        status: "active",
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    }

    if (!isEditing && !formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    if (!isEditing && formData.password.trim() && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.role_id) {
      newErrors.role_id = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        role_id: parseInt(formData.role_id),
        status: formData.status,
      };

      // Only include password if provided (for editing) or required (for creating)
      if (formData.password.trim()) {
        (submitData as any).password = formData.password.trim();
      }

      if (isEditing) {
        await apiService.updateUser(user!.id, submitData);
      } else {
        await apiService.createUser(submitData);
      }

      onSuccess();
    } catch (e: any) {
      if (e.errors) {
        setErrors(e.errors);
      } else {
        onError(e.message || "Failed to save user");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[999999]">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? "Edit User" : "Add New User"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Email address"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.phone_number ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Phone number"
            />
            {errors.phone_number && (
              <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={isEditing ? "Leave blank to keep current password" : "Password"}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
            {isEditing && (
              <p className="text-gray-500 text-xs mt-1">Leave blank to keep current password</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role *
            </label>
            <select
              value={formData.role_id}
              onChange={(e) => handleInputChange('role_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.role_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.role_id && (
              <p className="text-red-500 text-xs mt-1">{errors.role_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                isEditing ? 'Update User' : 'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal; 