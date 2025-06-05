// src/vendor_app/context/SupabaseProvider.tsx
import React, { ReactNode, createContext, useContext } from 'react'
import { supabase } from '../supabaseClient'

// Context będzie przekazywał instancję Supabase w aplikacji.
const SupabaseContext = createContext<typeof supabase | null>(null)

export const SupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = (): typeof supabase => {
  const ctx = useContext(SupabaseContext)
  if (!ctx) throw new Error('useSupabase musi być użyty wewnątrz SupabaseProvider')
  return ctx
}
