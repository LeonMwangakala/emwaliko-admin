import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import NotAuthorized from "../OtherPage/NotAuthorized";
import { apiService } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import CardTypesTable from "../../components/tables/Settings/CardTypesTable";

interface CardType {
  id: number;
  name: string;
  status: "Active" | "Inactive";
}

const CardTypes: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState<CardType | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchCardTypes();
  }, [user, isAdmin]);

  const fetchCardTypes = async () => {
    setLoading(true);
    try {
      const res = await apiService.getCardTypes();
      setCardTypes(res as CardType[]);
    } catch (e) {
      setError("Failed to fetch card types");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await apiService.createCardType({ name: newName });
      setShowCreateModal(false);
      setNewName("");
      fetchCardTypes();
    } catch (e) {
      setError("Failed to create card type");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardType) return;
    setError("");
    try {
      await apiService.updateCardType(selectedCardType.id, { name: newName });
      setShowEditModal(false);
      setSelectedCardType(null);
      setNewName("");
      fetchCardTypes();
    } catch (e) {
      setError("Failed to update card type");
    }
  };

  const handleToggleStatus = async (ct: CardType) => {
    setError("");
    try {
      await apiService.toggleCardTypeStatus(ct.id);
      fetchCardTypes();
    } catch (e) {
      setError("Failed to update status");
    }
  };

  if (!user) return null;
  if (!isAdmin) return <NotAuthorized />;

  return (
    <>
      <PageMeta title="Card Types | Admin" description="Manage card types" />
      <PageBreadcrumb pageTitle="Manage Card Types" />
      <div className="space-y-6">
        <ComponentCard
          title="List of Card Types"
          action={
            <button
              className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
              onClick={() => setShowCreateModal(true)}
            >
              Create Card Type
            </button>
          }
        >
          {loading ? (
            <div>Loading...</div>
          ) : (
            <CardTypesTable
              cardTypes={cardTypes}
              onEdit={(ct) => {
                setSelectedCardType(ct);
                setNewName(ct.name);
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
            <h3 className="text-xl font-bold mb-4">Create Card Type</h3>
            {error && <div className="mb-2 text-red-600">{error}</div>}
            <form onSubmit={handleCreate}>
              <input
                className="w-full mb-4 px-3 py-2 border rounded"
                placeholder="Card Type Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
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
      {showEditModal && selectedCardType && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Card Type</h3>
            {error && <div className="mb-2 text-red-600">{error}</div>}
            <form onSubmit={handleEdit}>
              <input
                className="w-full mb-4 px-3 py-2 border rounded"
                placeholder="Card Type Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
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

export default CardTypes; 