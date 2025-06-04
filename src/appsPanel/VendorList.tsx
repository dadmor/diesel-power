// src/appsPanel/VendorList.tsx - ZOPTYMALIZOWANY
import React from "react";

export const VendorList = ({
  vendors,
  onSelectVendor,
  onAddVendor,
  onEditVendor,
  onDeleteVendor,
  onRefresh,
}: any) => (
  <div className="p-6">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">
        🚀 Multi-Vendor Apps ({vendors.length})
      </h1>
      <div className="space-x-2">
        <button
          onClick={onRefresh}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          🔄 Odśwież
        </button>
        <button
          onClick={onAddVendor}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          ➕ Dodaj aplikację
        </button>
      </div>
    </div>

    {vendors.length === 0 ? (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏗️</div>
        <h2 className="text-xl font-bold mb-2">Brak aplikacji</h2>
        <p className="text-gray-600 mb-4">Utwórz swoją pierwszą aplikację z relacjami</p>
        <button
          onClick={onAddVendor}
          className="bg-blue-500 text-white px-6 py-3 rounded"
        >
          ➕ Rozpocznij budowanie
        </button>
      </div>
    ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor: any) => (
          <div
            key={vendor.id}
            className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-2xl">🚀</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{vendor.name}</h3>
                <p className="text-gray-500 text-sm">/{vendor.slug}</p>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-4 space-y-1">
              <p>📊 Tabele: {vendor.schema?.tables?.length || 0}</p>
              <p>🔗 Relacje: {
                vendor.schema?.tables?.reduce((count: number, table: any) => 
                  count + (table.fields?.filter((f: any) => f.relation)?.length || 0), 0
                ) || 0
              }</p>
              <p className="text-xs">
                Utworzono: {new Date(vendor.created_at).toLocaleString("pl-PL")}
              </p>
            </div>

            {/* Preview tabel */}
            {vendor.schema?.tables && vendor.schema.tables.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="text-xs font-medium text-gray-700 mb-2">Tabele:</div>
                <div className="flex flex-wrap gap-1">
                  {vendor.schema.tables.slice(0, 3).map((table: any, index: number) => (
                    <span key={index} className="text-xs bg-white px-2 py-1 rounded border">
                      {table.displayName || table.name}
                    </span>
                  ))}
                  {vendor.schema.tables.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{vendor.schema.tables.length - 3} więcej
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => onSelectVendor(vendor)}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
              >
                🚀 Uruchom
              </button>
              <button
                onClick={() => onEditVendor(vendor)}
                className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600"
              >
                ✏️ Edytuj
              </button>
              <button
                onClick={() => onDeleteVendor(vendor)}
                className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);