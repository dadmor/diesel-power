// ===== src/components/vendor/VendorApp.tsx =====
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Vendor } from '../../types';
import { VendorList } from './VendorList';
import { VendorForm } from './VendorForm';

interface VendorAppProps {
  vendor: Vendor;
}

export const VendorApp: React.FC<VendorAppProps> = ({ vendor }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">{vendor.name}</h2>
            <p className="text-gray-600 text-sm">Panel administracyjny</p>
          </div>
          
          <nav className="mt-6">
            {vendor.schema.tables.map(table => (
              <Link
                key={table.name}
                to={`/${vendor.slug}/${table.name}`}
                className="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
              >
                {table.name.charAt(0).toUpperCase() + table.name.slice(1)}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={
              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  Witaj w {vendor.name}
                </h1>
                <p className="text-gray-600 mb-6">
                  Wybierz sekcję z menu po lewej stronie.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vendor.schema.tables.map(table => (
                    <Link
                      key={table.name}
                      to={`/${vendor.slug}/${table.name}`}
                      className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
                    >
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {table.name.charAt(0).toUpperCase() + table.name.slice(1)}
                      </h3>
                      <p className="text-gray-600">
                        Zarządzaj {table.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            } />
            
            {vendor.schema.tables.map(table => {
              const tableName = `${vendor.slug}_${table.name}`;
              return (
                <React.Fragment key={table.name}>
                  <Route 
                    path={`/${table.name}`} 
                    element={<VendorList tableName={tableName} fields={table.fields} displayName={table.name} />} 
                  />
                  <Route 
                    path={`/${table.name}/create`} 
                    element={<VendorForm tableName={tableName} fields={table.fields} displayName={table.name} />} 
                  />
                  <Route 
                    path={`/${table.name}/:id/edit`} 
                    element={<VendorForm tableName={tableName} fields={table.fields} displayName={table.name} isEdit />} 
                  />
                </React.Fragment>
              );
            })}
          </Routes>
        </div>
      </div>
    </div>
  );
};
