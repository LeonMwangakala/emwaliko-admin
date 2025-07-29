import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import NotAuthorized from "../OtherPage/NotAuthorized";
import { apiService } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";

interface PaymentSettings {
  id: number;
  payment_terms: string;
  bank_payment_enabled: boolean;
  bank_name: string;
  account_name: string;
  account_number: string;
  swift_code: string;
  mobile_money_enabled: boolean;
  mobile_network: string;
  payment_number: string;
  payment_name: string;
}

const PaymentSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState<PaymentSettings>({
    id: 0,
    payment_terms: "Payment is due within 30 days of invoice date.",
    bank_payment_enabled: true,
    bank_name: "",
    account_name: "",
    account_number: "",
    swift_code: "",
    mobile_money_enabled: true,
    mobile_network: "",
    payment_number: "",
    payment_name: "",
  });

  useEffect(() => {
    if (!user) return;
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      const data = await apiService.getPaymentSettings();
      setSettings(data);
    } catch (e) {
      setError("Failed to fetch payment settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiService.updatePaymentSettings(settings);
      setSuccess("Payment settings updated successfully!");
    } catch (e: any) {
      setError(e.message || "Failed to update payment settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof PaymentSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!user) return null;

  // Only admin can access this page
  if (user.role_id !== 1) {
    return <NotAuthorized />;
  }

  return (
    <>
      <PageMeta title="Payment Settings | Admin" description="Manage payment settings" />
      <PageBreadcrumb pageTitle="Payment Settings" />
      
      <div className="space-y-6">
        <ComponentCard title="Payment Settings">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success/Error Messages */}
              {success && (
                <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  {success}
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              {/* Payment Terms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Terms
                </label>
                <textarea
                  value={settings.payment_terms}
                  onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder="Enter payment terms..."
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This text will appear on all invoices.
                </p>
              </div>

              {/* Bank Payment Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="bank_payment_enabled"
                    checked={settings.bank_payment_enabled}
                    onChange={(e) => handleInputChange('bank_payment_enabled', e.target.checked)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                  />
                  <label htmlFor="bank_payment_enabled" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Bank Payment
                  </label>
                </div>

                {settings.bank_payment_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={settings.bank_name}
                        onChange={(e) => handleInputChange('bank_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="e.g., Kadirafiki Bank"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={settings.account_name}
                        onChange={(e) => handleInputChange('account_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="e.g., Kadirafiki Events Ltd"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={settings.account_number}
                        onChange={(e) => handleInputChange('account_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="e.g., 1234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Swift Code
                      </label>
                      <input
                        type="text"
                        value={settings.swift_code}
                        onChange={(e) => handleInputChange('swift_code', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="e.g., KADITZTZ"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Money Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="mobile_money_enabled"
                    checked={settings.mobile_money_enabled}
                    onChange={(e) => handleInputChange('mobile_money_enabled', e.target.checked)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                  />
                  <label htmlFor="mobile_money_enabled" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Mobile Money Payment
                  </label>
                </div>

                {settings.mobile_money_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mobile Network
                      </label>
                      <input
                        type="text"
                        value={settings.mobile_network}
                        onChange={(e) => handleInputChange('mobile_network', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="e.g., M-Pesa, Airtel Money"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Payment Name
                      </label>
                      <input
                        type="text"
                        value={settings.payment_name}
                        onChange={(e) => handleInputChange('payment_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="e.g., Kadirafiki Events"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Payment Number
                      </label>
                      <input
                        type="text"
                        value={settings.payment_number}
                        onChange={(e) => handleInputChange('payment_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="e.g., +255 123 456 789"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default PaymentSettings; 