// ===== src/App.tsx =====
import React from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { Chat } from './Chat';
import { VendorApp } from './VendorTemplate';
import { getVendor } from './supabaseClient';
import { Vendor } from './types';

const VendorWrapper: React.FC = () => {
  const { vendorSlug } = useParams<{ vendorSlug: string }>();
  const [vendor, setVendor] = React.useState<Vendor | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchVendor = async () => {
      if (!vendorSlug) return;
      
      try {
        const vendorData = await getVendor(vendorSlug);
        setVendor(vendorData);
      } catch (err) {
        setError('Vendor not found');
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [vendorSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Ładowanie...</div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Vendor nie znaleziony</h1>
          <p className="text-gray-600 mb-4">Vendor o nazwie "{vendorSlug}" nie istnieje.</p>
          <a href="/" className="text-blue-600 hover:text-blue-800">
            Powrót do generatora
          </a>
        </div>
      </div>
    );
  }

  return <VendorApp vendor={vendor} />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/:vendorSlug/*" element={<VendorWrapper />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
