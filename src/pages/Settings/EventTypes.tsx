import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import NotAuthorized from "../OtherPage/NotAuthorized";
import { apiService } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import EventTypesTable from "../../components/tables/Settings/EventTypesTable";

interface EventType {
  id: number;
  name: string;
  status: "Active" | "Inactive";
  sms_template?: string;
  whatsapp_template?: string;
}

const EventTypes: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.role_id !== 1) {
      // Not admin
      return;
    }
    fetchEventTypes();
  }, [user]);

  const fetchEventTypes = async () => {
    setLoading(true);
    try {
      const res = await apiService.getEventTypes();
      setEventTypes(res as EventType[]);
    } catch (e) {
      setError("Failed to fetch event types");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await apiService.createEventType({ name: newName });
      setShowCreateModal(false);
      setNewName("");
      fetchEventTypes();
    } catch (e) {
      setError("Failed to create event type");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventType) return;
    setError("");
    try {
      await apiService.updateEventType(selectedEventType.id, { name: newName });
      setShowEditModal(false);
      setSelectedEventType(null);
      setNewName("");
      fetchEventTypes();
    } catch (e) {
      setError("Failed to update event type");
    }
  };

  const handleToggleStatus = async (et: EventType) => {
    setError("");
    try {
      await apiService.toggleEventTypeStatus(et.id);
      fetchEventTypes();
    } catch (e) {
      setError("Failed to update status");
    }
  };

  if (!user) return null;
  if (user.role_id !== 1) return <NotAuthorized />;

  return (
    <>
      <PageMeta title="Event Types | Admin" description="Manage event types" />
      <PageBreadcrumb pageTitle="Manage Event Types" />
      <div className="space-y-6">
        <ComponentCard
          title="List of Event Types"
          action={
            <button
              className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
              onClick={() => setShowCreateModal(true)}
            >
              Create Event Type
            </button>
          }
        >
          {loading ? (
            <div>Loading...</div>
          ) : (
            <EventTypesTable
              eventTypes={eventTypes}
              onEdit={(et) => {
                setSelectedEventType(et);
                setNewName(et.name);
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
            <h3 className="text-xl font-bold mb-4">Create Event Type</h3>
            {error && <div className="mb-2 text-red-600">{error}</div>}
            <form onSubmit={handleCreate}>
              <input
                className="w-full mb-4 px-3 py-2 border rounded"
                placeholder="Event Type Name"
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
      {showEditModal && selectedEventType && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Event Type</h3>
            {error && <div className="mb-2 text-red-600">{error}</div>}
            <form onSubmit={handleEdit}>
              <input
                className="w-full mb-4 px-3 py-2 border rounded"
                placeholder="Event Type Name"
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

export default EventTypes; 