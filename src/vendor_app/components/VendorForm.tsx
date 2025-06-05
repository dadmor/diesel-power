// src/vendor_app/components/VendorForm.tsx
import React, { useState } from 'react'
import { useVendors } from '../context/VendorContext'
import { Button, Input } from '../../themes/default'

export const VendorForm: React.FC = () => {
  const { addVendor, loading } = useVendors()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [schemaText, setSchemaText] = useState('{}')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      setError('Oba pola są wymagane')
      return
    }
    try {
      const schema = JSON.parse(schemaText)
      setError(null)
      await addVendor({ name, slug, schema })
      setName('')
      setSlug('')
      setSchemaText('{}')
    } catch {
      setError('Nieprawidłowy JSON w polu schema')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-5">
      <h2 className="text-xl font-bold mb-4">Dodaj Nowego Vendora</h2>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      
      <Input label="Nazwa" value={name} onChange={setName} />
      <Input label="Slug" value={slug} onChange={setSlug} />
      <Input label="Schema (JSON)" value={schemaText} onChange={setSchemaText} type="textarea" />
      
      <Button type="submit" disabled={loading}>
        {loading ? 'Proszę czekać...' : 'Dodaj Vendora'}
      </Button>
    </form>
  )
}