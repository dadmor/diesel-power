// src/vendor_app/components/VendorList.tsx
import React, { useState } from 'react'
import { useVendors } from '../context/VendorContext'
import { Vendor } from '../types/vendor.types'

export const VendorList: React.FC = () => {
  const { vendors, loading, error, getVendorById, updateVendor } = useVendors()
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [newName, setNewName] = useState<string>('')
  const [newSlug, setNewSlug] = useState<string>('')
  const [newSchema, setNewSchema] = useState<string>('{}')
  const [localError, setLocalError] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState<boolean>(false)

  if (loading) return <p>Ładowanie vendorów…</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>
  if (vendors.length === 0) return <p>Brak vendorów.</p>

  const startEdit = async (id: string) => {
    setIsFetching(true)
    setLocalError(null)
    const fullVendor = await getVendorById(id)
    setIsFetching(false)
    if (fullVendor) {
      setEditing(fullVendor)
      setNewName(fullVendor.name)
      setNewSlug(fullVendor.slug)
      setNewSchema(JSON.stringify(fullVendor.schema || {}, null, 2))
      setLocalError(null)
    } else {
      setLocalError('Nie udało się pobrać danych vendora')
    }
  }

  const cancelEdit = () => {
    setEditing(null)
    setLocalError(null)
  }

  const saveEdit = async () => {
    if (!newName.trim() || !newSlug.trim()) {
      setLocalError('Oba pola są wymagane')
      return
    }
    let parsed: Record<string, any> = {}
    try {
      parsed = JSON.parse(newSchema)
    } catch {
      setLocalError('Nieprawidłowy JSON w polu schema')
      return
    }
    setLocalError(null)
    if (editing) {
      await updateVendor(editing.id, { name: newName, slug: newSlug, schema: parsed })
      setEditing(null)
    }
  }

  return (
    <div>
      <h2>Lista Vendorów</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {vendors.map((v) => (
          <li
            key={v.id}
            style={{
              marginBottom: 10,
              padding: 10,
              border: '1px solid #ccc',
              borderRadius: 4,
              backgroundColor: editing?.id === v.id ? '#f0faff' : '#fff',
            }}
          >
            {editing?.id === v.id ? (
              <div>
                {localError && <p style={{ color: 'red' }}>{localError}</p>}
                <div style={{ marginBottom: 10 }}>
                  <label htmlFor="edit-name">Nazwa:</label>
                  <br />
                  <input
                    id="edit-name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label htmlFor="edit-slug">Slug:</label>
                  <br />
                  <input
                    id="edit-slug"
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label htmlFor="edit-schema">Schema (JSON):</label>
                  <br />
                  <textarea
                    id="edit-schema"
                    rows={4}
                    value={newSchema}
                    onChange={(e) => setNewSchema(e.target.value)}
                    style={{ width: '100%', padding: 6, boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>
                <button
                  onClick={saveEdit}
                  style={{
                    marginRight: 8,
                    backgroundColor: '#2b6cb0',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  Zapisz
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    backgroundColor: '#e53e3e',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  Anuluj
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{v.name}</strong> (<em>{v.slug}</em>)
                </div>
                <button
                  onClick={() => startEdit(v.id)}
                  disabled={isFetching}
                  style={{
                    backgroundColor: '#38a169',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: isFetching ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isFetching ? 'Ładowanie…' : 'Edytuj'}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
