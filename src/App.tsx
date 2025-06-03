// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { Chat } from './components/Chat';
import { Dashboard } from './components/Dashboard';
import { SchemaManager } from './components/SchemaManager';
import { VendorApp } from './components/vendor/VendorApp';
import { ConnectionChecker } from './components/ConnectionChecker';
import { getVendorBySlug, getVendorById } from './lib/supabase';
import { Vendor } from './types';

// Wrapper for vendor app by slug
const VendorWrapper: React.FC = () => {
  const { vendorSlug } = useParams<{ vendorSlug: string }>();
  const [vendor, setVendor] = React.useState<Vendor | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!vendorSlug) return;
    getVendorBySlug(vendorSlug)
      .then(setVendor)
      .catch(() => setVendor(null))
      .finally(() => setLoading(false));
  }, [vendorSlug]);

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Ładowanie...</div>;
  if (!vendor) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Aplikacja nie znaleziona</div>;
  
  return <VendorApp vendor={vendor} />;
};

// Wrapper for editing vendor by ID
const EditVendorWrapper: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [vendor, setVendor] = React.useState<Vendor | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!vendorId) return;
    getVendorById(vendorId)
      .then(setVendor)
      .catch(() => setVendor(null))
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Ładowanie...</div>;
  if (!vendor) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Aplikacja nie znaleziona</div>;
  
  return (
    <SchemaManager 
      vendor={vendor}
      onSave={() => window.location.href = '/dashboard'}
      onCancel={() => window.location.href = '/dashboard'}
    />
  );
};

const App: React.FC = () => (
  <ConnectionChecker>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard onCreateNew={() => window.location.href = '/new-by-chat'} onEditApp={(vendor) => window.location.href = `/edit/${vendor.id}`} />} />
        <Route path="/dashboard" element={<Dashboard onCreateNew={() => window.location.href = '/new-by-chat'} onEditApp={(vendor) => window.location.href = `/edit/${vendor.id}`} />} />
        <Route path="/new-by-chat" element={<Chat />} />
        <Route path="/edit/:vendorId" element={<EditVendorWrapper />} />
        <Route path="/:vendorSlug/*" element={<VendorWrapper />} />
      </Routes>
    </BrowserRouter>
  </ConnectionChecker>
);

export default App;