import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';

const GeneralSettings: React.FC = () => {
  const [vatRate, setVatRate] = useState<number | null>(null);
  const [newVatRate, setNewVatRate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchVatRate();
  }, []);

  const fetchVatRate = async () => {
    setLoading(true);
    setError('');
    try {
      const rate = await apiService.getVatRate();
      setVatRate(rate);
      setNewVatRate(rate.toString());
    } catch (e) {
      setError('Failed to load VAT rate');
    } finally {
      setLoading(false);
    }
  };

  const handleVatRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVatRate(e.target.value);
  };

  const handleVatRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const parsed = parseFloat(newVatRate);
    if (isNaN(parsed) || parsed < 0 || parsed > 1) {
      setError('VAT rate must be a number between 0 and 1 (e.g., 0.18 for 18%)');
      setSaving(false);
      return;
    }
    try {
      await apiService.setVatRate(parsed);
      setVatRate(parsed);
      setSuccess('VAT rate updated successfully!');
    } catch (e) {
      setError('Failed to update VAT rate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">General Settings</h2>
      <form onSubmit={handleVatRateSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            VAT Rate
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={newVatRate}
            onChange={handleVatRateChange}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            disabled={loading || saving}
          />
          <span className="ml-2 text-gray-600 dark:text-gray-400">({vatRate !== null ? Math.round(vatRate * 100) : '--'}%)</span>
        </div>
        {error && <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
        {success && <div className="p-2 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>}
        <button
          type="submit"
          className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors disabled:opacity-50"
          disabled={loading || saving}
        >
          {saving ? 'Saving...' : 'Update VAT Rate'}
        </button>
      </form>
    </div>
  );
};

export default GeneralSettings; 