// src/vendor_app/components/VendorPreview.tsx
import React, { useEffect, useState } from 'react'
import { useVendors } from '../context/VendorContext'
import { Vendor } from '../types/vendor.types'

export const VendorPreview: React.FC<{ id: string }> = ({ id }) => {
  const { getVendorById } = useVendors()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      const data = await getVendorById(id)
      if (!data) setError('Nie udało się załadować danych')
      else setVendor(data)
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <p>Wczytywanie szczegółów vendora...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>
  if (!vendor) return null

  return (
    <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f7fafc', borderRadius: 4 }}>
      <p>
        <strong>ID:</strong> {vendor.id}
      </p>
      <p>
        <strong>Nazwa:</strong> {vendor.name}
      </p>
      <p>
        <strong>Slug:</strong> {vendor.slug}
      </p>
      <p>
        <strong>Utworzono:</strong> {new Date(vendor.created_at).toLocaleString('pl-PL')}
      </p>
      {/* Tutaj można wypisać dane relacyjne, np. kontakty:
          vendor.contacts?.map(c => <p key={c.id}>{c.email}</p>) */}
    </div>
  )
}
