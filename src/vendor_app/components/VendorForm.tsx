// src/vendor_app/components/VendorForm.tsx
import React, { useState } from 'react'
import { useVendors } from '../context/VendorContext'

export const VendorForm: React.FC = () => {
  const { addVendor, loading } = useVendors()
  const [name, setName] = useState<string>('')
  const [slug, setSlug] = useState<string>('')
  const [schemaText, setSchemaText] = useState<string>('{}')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      setError('Oba pola są wymagane')
      return
    }
    let parsedSchema: Record<string, any> = {}
    try {
      parsedSchema = JSON.parse(schemaText)
    } catch {
      setError('Nieprawidłowy JSON w polu schema')
      return
    }
    setError(null)
    await addVendor({ name, slug, schema: parsedSchema })
    setName('')
    setSlug('')
    setSchemaText('{}')
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
      <h2>Dodaj Nowego Vendora</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="name">Nazwa:</label>
        <br />
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
          required
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="slug">Slug:</label>
        <br />
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={e => setSlug(e.target.value)}
          style={{ width: '100%', padding: 6, boxSizing: 'border-box' }}
          required
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="schema">Schema (JSON):</label>
        <br />
        <textarea
          id="schema"
          rows={4}
          value={schemaText}
          onChange={e => setSchemaText(e.target.value)}
          style={{ width: '100%', padding: 6, boxSizing: 'border-box', fontFamily: 'monospace' }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{
          backgroundColor: '#2b6cb0',
          color: '#fff',
          border: 'none',
          padding: '8px 16px',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Proszę czekać...' : 'Dodaj Vendora'}
      </button>
    </form>
  )
}
