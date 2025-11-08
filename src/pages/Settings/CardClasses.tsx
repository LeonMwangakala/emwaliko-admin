import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import NotAuthorized from "../OtherPage/NotAuthorized";
import { apiService } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import CardClassesTable from "../../components/tables/Settings/CardClassesTable";

interface CardClass {
  id: number;
  name: string;
  max_guests: number;
  status: "Active" | "Inactive";
}

const CardClasses: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [cardClasses, setCardClasses] = useState<CardClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCardClass, setSelectedCardClass] = useState<CardClass | null>(null);
  const [newName, setNewName] = useState("");
  const [newMaxGuests, setNewMaxGuests] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchCardClasses();
  }, [user, isAdmin]);

  const fetchCardClasses = async () => {
    setLoading(true);
    try {
      const res = await apiService.getCardClasses();
      setCardClasses(res as CardClass[]);
    } catch (e) {
      setError("Failed to fetch card classes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await apiService.createCardClass({ 
        name: newName, 
        max_guests: parseInt(newMaxGuests) 
      });
      setShowCreateModal(false);
      setNewName("");
      setNewMaxGuests("");
      fetchCardClasses();
    } catch (e) {
      setError("Failed to create card class");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardClass) return;
    setError("");
    try {
      await apiService.updateCardClass(selectedCardClass.id, { 
        name: newName, 
        max_guests: parseInt(newMaxGuests) 
      });
      setShowEditModal(false);
      setSelectedCardClass(null);
      setNewName("");
      setNewMaxGuests("");
      fetchCardClasses();
    } catch (e) {
      setError("Failed to update card class");
    }
  };

  const handleToggleStatus = async (cc: CardClass) => {
    setError("");
    try {
      await apiService.toggleCardClassStatus(cc.id);
      fetchCardClasses();
    } catch (e) {
      setError("Failed to update status");
    }
  };

  if (!user) return null;
  if (!isAdmin) return <NotAuthorized />;

  return (
    <>
      <PageMeta title="Card Classes | Admin" description="Manage card classes" />
      <PageBreadcrumb pageTitle="Manage Card Classes" />
      <div className="space-y-6">
        <ComponentCard
          title="List of Card Classes"
          action={
            <button
              className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
              onClick={() => setShowCreateModal(true)}
            >
              Create Card Class
            </button>
          }
        >
          {loading ? (
            <div>Loading...</div>
          ) : (
            <CardClassesTable
              cardClasses={cardClasses}
              onEdit={(cc) => {
                setSelectedCardClass(cc);
                setNewName(cc.name);
                setNewMaxGuests(cc.max_guests.toString());
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
            <h3 className="text-xl font-bold mb-4">Create Card Class</h3>
            {error && <div className="mb-2 text-red-600">{error}</div>}
            <form onSubmit={handleCreate}>
              <input
                className="w-full mb-4 px-3 py-2 border rounded"
                placeholder="Card Class Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <input
                type="number"
                className="w-full mb-4 px-3 py-2 border rounded"
                placeholder="Max Guests"
                value={newMaxGuests}
                onChange={(e) => setNewMaxGuests(e.target.value)}
                min="1"
                required
              />
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
      {showEditModal && selectedCardClass && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Card Class</h3>
            {error && <div className="mb-2 text-red-600">{error}</div>}
            <form onSubmit={handleEdit}>
              <input
                className="w-full mb-4 px-3 py-2 border rounded"
                placeholder="Card Class Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <input
                type="number"
                className="w-full mb-4 px-3 py-2 border rounded"
                placeholder="Max Guests"
                value={newMaxGuests}
                onChange={(e) => setNewMaxGuests(e.target.value)}
                min="1"
                required
              />
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

export default CardClasses; 