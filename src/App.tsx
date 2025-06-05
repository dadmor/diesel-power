// src/App.tsx
import React from 'react'
import { SupabaseProvider } from './vendor_app/context/SupabaseProvider'
import { VendorProvider } from './vendor_app/context/VendorContext'
import { VendorForm } from './vendor_app/components/VendorForm'
import { VendorList } from './vendor_app/components/VendorList'
import TagBuilder from './shemaAgent/TagBuilder'

const App: React.FC = () => {
  return (
    <SupabaseProvider>
      <VendorProvider>
        <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
          <h1>Panel Vendorów</h1>
          <VendorForm />
          <VendorList />
        </div>
        <TagBuilder/>
      </VendorProvider>
    </SupabaseProvider>
  )
}

export default App
