import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import NotAuthorized from "../OtherPage/NotAuthorized";
import { apiService } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PackagesTable from "../../components/tables/Settings/PackagesTable";

interface Package {
  id: number;
  name: string;
  amount: number;
  currency: string;
  status: "Active" | "Inactive";
}

const Packages: React.FC = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCurrency, setNewCurrency] = useState("TZS");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.role_id !== 1) {
      // Not admin
      return;
    }
    fetchPackages();
  }, [user]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await apiService.getPackages();
      setPackages(res as Package[]);
    } catch (e) {
      setError("Failed to fetch packages");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await apiService.createPackage({ 
        name: newName, 
        amount: parseFloat(newAmount),
        currency: newCurrency
      });
      setShowCreateModal(false);
      setNewName("");
      setNewAmount("");
      setNewCurrency("TZS");
      fetchPackages();
    } catch (e) {
      setError("Failed to create package");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    setError("");
    try {
      await apiService.updatePackage(selectedPackage.id, { 
        name: newName, 
        amount: parseFloat(newAmount),
        currency: newCurrency
      });
      setShowEditModal(false);
      setSelectedPackage(null);
      setNewName("");
      setNewAmount("");
      setNewCurrency("TZS");
      fetchPackages();
    } catch (e) {
      setError("Failed to update package");
    }
  };

  const handleToggleStatus = async (pkg: Package) => {
    setError("");
    try {
      await apiService.togglePackageStatus(pkg.id);
      fetchPackages();
    } catch (e) {
      setError("Failed to update status");
    }
  };

  if (!user) return null;
  if (user.role_id !== 1) return <NotAuthorized />;

  return (
    <>
      <PageMeta title="Packages | Admin" description="Manage packages" />
      <PageBreadcrumb pageTitle="Manage Packages" />
      <div className="space-y-6">
        <ComponentCard
          title="List of Packages"
          action={
            <button
              className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
              onClick={() => setShowCreateModal(true)}
            >
              Create Package
            </button>
          }
        >
          {loading ? (
            <div>Loading...</div>
          ) : (
            <PackagesTable
              packages={packages}
              onEdit={(pkg) => {
                setSelectedPackage(pkg);
                setNewName(pkg.name);
                setNewAmount(pkg.amount.toString());
                setNewCurrency(pkg.currency);
                setShowEditModal(true);
              }}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </ComponentCard>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create Package</h3>
            {error && <div className="mb-2 text-red-600">{error}</div>}
            <form onSubmit={handleCreate}>
              <input
                className="w-full mb-4 px-3 py-2 border rounded"
                placeholder="Package Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <input
                type="number"
                step="0.01"
                className="w-full mb-4 px-3 py-2 border rounded"
                placeholder="Amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                min="0"
                required
              />
              <select
                className="w-full mb-4 px-3 py-2 border rounded"
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value)}
                required
              >
                <option value="TZS">TZS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPackage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Package</h3>
            {error && <div className="mb-2 text-red-600">{error}</div>}
            <form onSubmit={handleEdit}>
              <input
                className="w-full mb-4 px-3 py-2 border rounded"
                placeholder="Package Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <input
                type="number"
                step="0.01"
                className="w-full mb-4 px-3 py-2 border rounded"
                placeholder="Amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                min="0"
                required
              />
              <select
                className="w-full mb-4 px-3 py-2 border rounded"
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value)}
                required
              >
                <option value="TZS">TZS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Packages; 