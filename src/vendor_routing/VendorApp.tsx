// src/vendor_routing/VendorApp.tsx
import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useVendors } from '../vendor_app/context/VendorContext'
import { Vendor } from '../vendor_app/types/vendor.types'
import { Layout } from '../themes/default/components/Layout'
import { JsonViewer } from '../themes/default/components/JsonViewer'
import { LoadingSpinner } from '../themes/default/components/ChatInterface'

interface VendorPage {
  name: string
  slug: string
  type: string
  table?: string
  components?: string[]
}

const VendorApp: React.FC = () => {
  const { vendorSlug, pageSlug } = useParams<{ vendorSlug: string; pageSlug?: string }>()
  const { vendors, getVendorById, loading: vendorsLoading } = useVendors()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [currentPage, setCurrentPage] = useState<VendorPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)

  // Memoize vendor from list to prevent unnecessary re-renders
  const vendorFromList = useMemo(() => {
    return vendors.find(v => v.slug === vendorSlug)
  }, [vendors, vendorSlug])

  useEffect(() => {
    // Don't start loading until vendors are loaded and we haven't attempted yet
    if (vendorsLoading || hasAttemptedLoad) {
      return
    }

    const loadVendor = async () => {
      console.log('Loading vendor:', vendorSlug, 'pageSlug:', pageSlug)
      if (!vendorSlug) {
        setError('Brak slug vendora')
        setLoading(false)
        setHasAttemptedLoad(true)
        return
      }

      setLoading(true)
      setError(null)
      setHasAttemptedLoad(true)

      try {
        // Use memoized vendor
        if (!vendorFromList) {
          setError(`Vendor o slug "${vendorSlug}" nie został znaleziony`)
          setLoading(false)
          return
        }

        // Pobierz pełne dane vendora
        const fullVendor = await getVendorById(vendorFromList.id)
        if (!fullVendor) {
          setError('Nie udało się pobrać danych vendora')
          setLoading(false)
          return
        }

        setVendor(fullVendor)

        // Pobierz strony z schema vendora
        const pages = fullVendor.schema?.ux?.pages as VendorPage[] || []
        
        if (pages.length === 0) {
          setError('Vendor nie ma zdefiniowanych stron')
          setLoading(false)
          return
        }

        // Znajdź odpowiednią stronę
        if (pageSlug) {
          // Szukaj konkretnej strony
          const targetPage = pages.find(page => page.slug === pageSlug)
          if (!targetPage) {
            setError(`Strona o slug "${pageSlug}" nie została znaleziona`)
            setLoading(false)
            return
          }
          setCurrentPage(targetPage)
        } else {
          // Dla /:vendorSlug bez pageSlug - ustaw pierwszą stronę
          setCurrentPage(pages[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Wystąpił błąd')
      } finally {
        setLoading(false)
      }
    }

    loadVendor()
  }, [vendorSlug, pageSlug, vendorFromList, getVendorById, vendorsLoading, hasAttemptedLoad])

  // Reset hasAttemptedLoad when route changes
  useEffect(() => {
    setHasAttemptedLoad(false)
    setVendor(null)
    setCurrentPage(null)
    setError(null)
  }, [vendorSlug, pageSlug])

  // Redirect logic: tylko gdy nie ma pageSlug, vendor jest załadowany i nie ma błędu
  if (!loading && !error && !pageSlug && vendor && currentPage && !vendorsLoading) {
    console.log('Redirecting to:', `/${vendorSlug}/${currentPage.slug}`)
    return <Navigate to={`/${vendorSlug}/${currentPage.slug}`} replace />
  }

  // Show loading while vendors are being fetched or while we're loading vendor details
  if (vendorsLoading || loading) {
    return (
      <Layout title="Ładowanie..." subtitle="Pobieranie danych vendora">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Błąd" subtitle="Wystąpił problem">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </Layout>
    )
  }

  if (!vendor || !currentPage) {
    return (
      <Layout title="Nie znaleziono" subtitle="Strona nie istnieje">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded">
            Nie znaleziono żądanej strony
          </div>
        </div>
      </Layout>
    )
  }

  // Pobierz wszystkie strony do nawigacji
  const allPages = vendor.schema?.ux?.pages as VendorPage[] || []

  return (
    <Layout 
      title={vendor.name} 
      subtitle={currentPage.name}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Nawigacja między stronami */}
        {allPages.length > 1 && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Strony:</h3>
            <div className="flex flex-wrap gap-2">
              {allPages.map((page) => (
                <a
                  key={page.slug}
                  href={`/${vendorSlug}/${page.slug}`}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    page.slug === currentPage.slug
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Informacje o stronie */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">{currentPage.name}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>Typ: <strong>{currentPage.type}</strong></span>
              {currentPage.table && (
                <span>Tabela: <strong>{currentPage.table}</strong></span>
              )}
              <span>Slug: <strong>{currentPage.slug}</strong></span>
            </div>
          </div>

          {currentPage.components && currentPage.components.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Komponenty:</h3>
              <div className="flex flex-wrap gap-2">
                {currentPage.components.map((component, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-md"
                  >
                    {component}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* JSON Schema strony */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Schema strony (JSON)</h3>
            <p className="text-sm text-gray-600 mt-1">
              Pełna definicja strony z vendor schema
            </p>
          </div>
          <div className="p-4">
            <JsonViewer data={currentPage} />
          </div>
        </div>

        {/* Pełne schema vendora */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Pełne schema vendora</h3>
            <p className="text-sm text-gray-600 mt-1">
              Kompletne schema vendora "{vendor.name}"
            </p>
          </div>
          <div className="p-4" style={{ maxHeight: '60vh', overflow: 'auto' }}>
            <JsonViewer data={vendor.schema} />
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default VendorApp