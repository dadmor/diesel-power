// src/appsPanel/panel.tsx - GŁÓWNY PLIK ZOPTYMALIZOWANY
import { useState, useEffect } from "react";
import { api } from "./api"; // ✅ POPRAWIONY IMPORT
import { ConfirmDialog, Notification } from "./utils";
import { VendorForm } from "./VendorForm";
import { VendorList } from "./VendorList";
import { VendorApp } from "./VendorApp"; // NOWY komponent

function PanelApp() {
  const [currentView, setCurrentView] = useState("vendors");
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    vendor: null,
  });

  const showNotification = (type: string, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadVendors = async () => {
    setLoading(true);
    try {
      const data = await api.getVendors();
      setVendors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showNotification("error", `Błąd: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleSaveVendor = (savedVendor: any) => {
    if (currentView === "edit-vendor") {
      setVendors((prev: any) =>
        prev.map((v: any) => (v.id === savedVendor.id ? savedVendor : v))
      );
      showNotification("success", "Aplikacja zaktualizowana!");
    } else {
      setVendors((prev: any) => [savedVendor, ...prev]);
      showNotification("success", "Aplikacja utworzona!");
    }
    setCurrentView("vendors");
  };

  const handleSelectVendor = (vendor: any) => {
    setSelectedVendor(vendor);
    setCurrentView("vendor-app");
  };

  const handleEditVendor = (vendor: any) => {
    setSelectedVendor(vendor);
    setCurrentView("edit-vendor");
  };

  const handleDeleteVendor = (vendor: any) => {
    setConfirmDialog({ isOpen: true, vendor });
  };

  const confirmDeleteVendor = async () => {
    const vendor = (confirmDialog as any).vendor;
    try {
      await api.deleteVendor(vendor.id);
      setVendors((prev: any) => prev.filter((v: any) => v.id !== vendor.id));
      showNotification("success", "Aplikacja usunięta!");
    } catch (error: any) {
      showNotification("error", `Błąd: ${error.message}`);
    } finally {
      setConfirmDialog({ isOpen: false, vendor: null });
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p>Ładowanie aplikacji...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">
            🚀 MULTI-VENDOR REFINE GENERATOR
          </h1>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-green-100 px-2 py-1 rounded">
              ✅ CRUD
            </span>
            <span className="text-xs bg-blue-100 px-2 py-1 rounded">
              ✅ RELATIONS
            </span>
            <span className="text-xs bg-purple-100 px-2 py-1 rounded">
              ✅ FILTERS
            </span>
            <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
              ✅ REFINE
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        {notification && (
          <div className="p-4">
            <Notification
              {...notification}
              onClose={() => setNotification(null)}
            />
          </div>
        )}

        {currentView === "vendors" && (
          <VendorList
            vendors={vendors}
            onSelectVendor={handleSelectVendor}
            onAddVendor={() => setCurrentView("add-vendor")}
            onEditVendor={handleEditVendor}
            onDeleteVendor={handleDeleteVendor}
            onRefresh={loadVendors}
          />
        )}

        {currentView === "add-vendor" && (
          <VendorForm
            onSave={handleSaveVendor}
            onCancel={() => setCurrentView("vendors")}
            mode="add"
          />
        )}

        {currentView === "edit-vendor" && (
          <VendorForm
            vendor={selectedVendor}
            onSave={handleSaveVendor}
            onCancel={() => {
              setCurrentView("vendors");
              setSelectedVendor(null);
            }}
            mode="edit"
          />
        )}

        {currentView === "vendor-app" && selectedVendor && (
          <VendorApp
            vendor={selectedVendor}
            onBack={() => {
              setCurrentView("vendors");
              setSelectedVendor(null);
            }}
          />
        )}
      </main>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Usuń aplikację"
        message={`Usunąć aplikację "${(confirmDialog as any).vendor?.name}"?`}
        onConfirm={confirmDeleteVendor}
        onCancel={() => setConfirmDialog({ isOpen: false, vendor: null })}
      />
    </div>
  );
}

export default PanelApp;
