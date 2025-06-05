// src/vendor_app/context/VendorContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useSupabase } from './SupabaseProvider'
import { Vendor } from '../types/vendor.types'

interface VendorContextType {
  vendors: Array<Pick<Vendor, 'id' | 'name' | 'slug'>>
  loading: boolean
  error: string | null
  fetchVendors: () => Promise<void>
  addVendor: (data: { name: string; slug: string; schema: Record<string, any> }) => Promise<void>
  updateVendor: (id: string, data: { name: string; slug: string; schema: Record<string, any> }) => Promise<void>
  getVendorById: (id: string) => Promise<Vendor | null>
}

const VendorContext = createContext<VendorContextType | null>(null)

export const VendorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const supabase = useSupabase()
  const [vendors, setVendors] = useState<Array<Pick<Vendor, 'id' | 'name' | 'slug'>>>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVendors = async () => {
    setLoading(true)
    setError(null)
    try {
      // Usunięto typ generyczny - Supabase automatycznie wywnioskuje typ
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, slug')
        .order('created_at', { ascending: false })
      if (error) {
        setError(error.message)
      } else {
        setVendors(data || [])
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const addVendor = async (data: { name: string; slug: string; schema: Record<string, any> }) => {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        schema: data.schema || {},
      }
      const { error } = await supabase
        .from('vendors')
        .insert([payload])
        .select()
        .single()
      if (error) {
        setError(error.message)
      } else {
        await fetchVendors()
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const updateVendor = async (id: string, data: { name: string; slug: string; schema: Record<string, any> }) => {
    setLoading(true)
    setError(null)
    try {
      const payload: Partial<Vendor> = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        schema: data.schema,
      }
      const { error } = await supabase
        .from('vendors')
        .update(payload)
        .eq('id', id)
      if (error) {
        setError(error.message)
      } else {
        await fetchVendors()
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const getVendorById = async (id: string): Promise<Vendor | null> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single()
      if (error) {
        setError(error.message)
        return null
      }
      return data
    } catch (e) {
      setError((e as Error).message)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  return (
    <VendorContext.Provider
      value={{ vendors, loading, error, fetchVendors, addVendor, updateVendor, getVendorById }}
    >
      {children}
    </VendorContext.Provider>
  )
}

export const useVendors = (): VendorContextType => {
  const ctx = useContext(VendorContext)
  if (!ctx) throw new Error('useVendors musi być użyte wewnątrz VendorProvider')
  return ctx
}