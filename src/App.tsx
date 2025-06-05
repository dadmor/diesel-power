// src/App.tsx
import React from 'react'
import { SupabaseProvider } from './vendor_app/context/SupabaseProvider'
import { AuthProvider } from './vendor_app/context/AuthContext'
import { VendorProvider } from './vendor_app/context/VendorContext'
import { AuthGuard } from './vendor_app/components/AuthGuard'
import { VendorForm } from './vendor_app/components/VendorForm'
import { VendorList } from './vendor_app/components/VendorList'
import { Layout } from './themes/default'
import TagBuilder from './shemaAgent/TagBuilder'

const App: React.FC = () => {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <AuthGuard>
          <VendorProvider>
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
          </VendorProvider>
        </AuthGuard>
      </AuthProvider>
    </SupabaseProvider>
  )
}

export default App