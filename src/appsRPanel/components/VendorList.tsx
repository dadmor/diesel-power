// components/VendorList.tsx
import { type Vendor } from '../services/vendorService';

interface VendorListProps {
  vendors: Vendor[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: string) => void;
  onViewData: (vendor: Vendor) => void;
  onSignOut: () => void;
  userEmail?: string;
}

export const VendorList = ({ 
  vendors, 
  loading, 
  onAdd, 
  onEdit, 
  onDelete, 
  onViewData, 
  onSignOut,
  userEmail 
}: VendorListProps) => {
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete vendor "${name}"?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Vendor Management</h1>
            {userEmail && <p className="text-sm text-gray-500">Welcome, {userEmail}</p>}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onAdd}
              className="bg-gray-900 text-white px-4 py-2 text-sm rounded-md hover:bg-gray-800"
              disabled={loading}
            >
              Add Vendor
            </button>
            <button 
              onClick={onSignOut}
              className="border px-4 py-2 text-sm rounded-md hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading vendors...</p>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No vendors found</p>
              <button 
                onClick={onAdd} 
                className="bg-gray-900 text-white px-4 py-2 text-sm rounded-md hover:bg-gray-800"
              >
                Create your first vendor
              </button>
            </div>
          ) : (
            vendors.map((vendor) => (
              <div key={vendor.id} className="bg-white border rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{vendor.name}</h3>
                    <p className="text-gray-600 text-sm">/{vendor.slug}</p>
                    <p className="text-gray-500 text-sm mt-1">{vendor.description}</p>
                    <div className="mt-3 text-xs text-gray-500">
                      {vendor.schema?.tables?.length || 0} tables • {new Date(vendor.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onViewData(vendor)}
                      className="bg-blue-100 text-blue-700 border border-blue-300 px-3 py-1 text-xs rounded-md hover:bg-blue-200"
                      disabled={loading}
                    >
                      View Data
                    </button>
                    <button 
                      onClick={() => onEdit(vendor)}
                      className="border px-3 py-1 text-xs rounded-md hover:bg-gray-50"
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(vendor.id, vendor.name)}
                      className="text-red-600 border border-red-300 px-3 py-1 text-xs rounded-md hover:bg-red-50"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};