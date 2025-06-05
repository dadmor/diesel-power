// src/App.tsx
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { SupabaseProvider } from './vendor_app/context/SupabaseProvider'
import { AuthProvider } from './vendor_app/context/AuthContext'
import { VendorProvider } from './vendor_app/context/VendorContext'
import { AuthGuard } from './vendor_app/components/AuthGuard'
import { VendorForm } from './vendor_app/components/VendorForm'
import { VendorList } from './vendor_app/components/VendorList'
import TagBuilder from './shemaAgent/TagBuilder'
import { Layout } from './themes/default/components/Layout'
import VendorApp from './vendor_routing/VendorApp'

const AdminPanel: React.FC = () => {
  return (
    <Layout title="Panel Vendorów" subtitle="Zarządzaj vendorami i ich schematami">
      <div className="max-w-4xl mx-auto space-y-6">
        <VendorForm />
        <VendorList />
        <div className="border-t pt-6">
          <h2 className="text-xl font-bold mb-4">Tag Builder</h2>
          <TagBuilder />
        </div>
      </div>
    </Layout>
  )
}

const App: React.FC = () => {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <AuthGuard>
          <VendorProvider>
            <Routes>
              {/* Panel administracyjny */}
              <Route path="/admin" element={<AdminPanel />} />
              
              {/* Routing vendorów */}
              <Route path="/:vendorSlug" element={<VendorApp />} />
              <Route path="/:vendorSlug/:pageSlug" element={<VendorApp />} />
              
              {/* Domyślna strona przekierowuje do admin */}
              <Route path="/" element={<AdminPanel />} />
            </Routes>
          </VendorProvider>
        </AuthGuard>
      </AuthProvider>
    </SupabaseProvider>
  )
}

export default App