import React from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { Chat } from './components/Chat';
import { VendorApp } from './components/vendor/VendorApp';
import { ConnectionChecker } from './components/ConnectionChecker';
import { getVendor } from './lib/supabase';
import { Vendor } from './types';

const VendorWrapper: React.FC = () => {
  const { vendorSlug } = useParams<{ vendorSlug: string }>();
  const [vendor, setVendor] = React.useState<Vendor | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!vendorSlug) return;
    getVendor(vendorSlug)
      .then(setVendor)
      .catch(() => setVendor(null))
      .finally(() => setLoading(false));
  }, [vendorSlug]);

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Ładowanie...</div>;
  if (!vendor) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Aplikacja nie znaleziona</div>;
  
  return <VendorApp vendor={vendor} />;
};

const App: React.FC = () => (
  <ConnectionChecker>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/:vendorSlug/*" element={<VendorWrapper />} />
      </Routes>
    </BrowserRouter>
  </ConnectionChecker>
);

export default App;