// src/vendor_routing/VendorApp.tsx
import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useVendors } from '../vendor_app/context/VendorContext'
import { Vendor } from '../vendor_app/types/vendor.types'
import { Layout } from '../themes/default/components/Layout'
import { JsonViewer } from '../themes/default/components/JsonViewer'
import { LoadingSpinner } from '../themes/default/components/ChatInterface'
import { Button } from '../themes/default/components/Button'
import { ListTable } from '../vendor_app/components/ListTable'
import { ListFilter, FilterParams } from '../vendor_app/components/ListFilter'
import { DbForm } from '../vendor_app/components/DbForm'
import { useVendorDatabase } from '../vendor_app/hooks/useVendorDatabase'

interface VendorPage {
  name: string
  slug: string
  type: string
  table?: string
  components?: string[]
}

interface TableField {
  name: string
  type: string
  unique?: boolean
  required?: boolean
  format?: string
  options?: string[]
  validation?: any
  placeholder?: string
  label?: string
}

interface TableSchema {
  name: string
  fields: TableField[]
}

const VendorApp: React.FC = () => {
  const { vendorSlug, pageSlug } = useParams<{ vendorSlug: string; pageSlug?: string }>()
  const { vendors, getVendorById, loading: vendorsLoading } = useVendors()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [currentPage, setCurrentPage] = useState<VendorPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)

  // Nowe state dla działających komponentów
  const [tableData, setTableData] = useState<any[]>([])
  const [filters, setFilters] = useState<FilterParams>({})
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Hook do bazy danych
  const {
    loading: dbLoading,
    error: dbError,
    fetchTableDataWithRelations,
    insertRecord,
    updateRecord,
  } = useVendorDatabase(vendorSlug || '')

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

  // Załaduj dane tabeli gdy strona się zmieni lub filtry
  useEffect(() => {
    if (currentPage && currentPage.table && (currentPage.type === 'table' || currentPage.type === 'list')) {
      loadTableData()
    }
  }, [currentPage, filters])

  // Reset hasAttemptedLoad when route changes
  useEffect(() => {
    setHasAttemptedLoad(false)
    setVendor(null)
    setCurrentPage(null)
    setError(null)
    setTableData([])
    setFilters({})
    setShowForm(false)
    setEditingRecord(null)
  }, [vendorSlug, pageSlug])

  const loadTableData = async () => {
    if (!currentPage?.table) return
    
    try {
      const result = await fetchTableDataWithRelations(currentPage.table, filters)
      if (result) {
        setTableData(result)
      }
    } catch (err) {
      console.error('Błąd podczas ładowania danych tabeli:', err)
    }
  }

  // Pobierz schema tabeli
  const getTableSchema = (): TableSchema | null => {
    if (!vendor?.schema?.database?.tables || !currentPage?.table) return null
    return vendor.schema.database.tables.find((t: any) => t.name === currentPage.table) || null
  }

  // Pobierz konfigurację filtrów
  const getFilterConfigs = (): any[] => {
    if (!vendor?.schema?.database?.filters || !currentPage?.table) return []
    return vendor.schema.database.filters[currentPage.table] || []
  }

  // Obsługa filtrów
  const handleFilter = (newFilters: FilterParams) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  // Obsługa formularza
  const handleRowClick = (row: any) => {
    setEditingRecord(row)
    setShowForm(true)
  }

  const handleFormSubmit = async (formData: Record<string, any>) => {
    if (!currentPage?.table) return

    try {
      if (editingRecord) {
        // Aktualizuj istniejący rekord
        await updateRecord(currentPage.table, editingRecord.id, formData)
      } else {
        // Dodaj nowy rekord
        await insertRecord(currentPage.table, formData)
      }
      
      // Odśwież dane
      await loadTableData()
      
      // Zamknij formularz
      setShowForm(false)
      setEditingRecord(null)
    } catch (err) {
      console.error('Błąd podczas zapisywania:', err)
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingRecord(null)
  }

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
  const tableSchema = getTableSchema()
  const filterConfigs = getFilterConfigs()

  // Sprawdź czy jest błąd bazy danych
  if (dbError) {
    return (
      <Layout title={vendor.name} subtitle={currentPage.name}>
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

          {/* Error bazy danych */}
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            <h3 className="font-semibold mb-2">Błąd bazy danych</h3>
            <p>{dbError}</p>
            <p className="text-sm mt-2">
              Sprawdź czy tabela <code>{vendorSlug}_{currentPage.table}</code> istnieje w bazie danych.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={vendor.name} subtitle={currentPage.name}>
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
                  {page.table === currentPage.table && (
                    <span className="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                      {tableData.length}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Header z informacjami i akcjami */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{currentPage.name}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Typ: <strong>{currentPage.type}</strong></span>
                {currentPage.table && (
                  <span>Tabela: <strong>{vendorSlug}_{currentPage.table}</strong></span>
                )}
                <span>Slug: <strong>{currentPage.slug}</strong></span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {/* Przycisk dodaj nowy - tylko dla table type */}
              {currentPage.type === 'table' && tableSchema && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditingRecord(null)
                    setShowForm(true)
                  }}
                >
                  + Dodaj {currentPage.table?.slice(0, -1)}
                </Button>
              )}
              
              {/* Debug toggle */}
              <Button
                variant="secondary"
                onClick={() => setShowDebug(!showDebug)}
              >
                {showDebug ? 'Ukryj debug' : 'Pokaż debug'}
              </Button>
            </div>
          </div>

          {currentPage.components && currentPage.components.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Aktywne komponenty:</h3>
              <div className="flex flex-wrap gap-2">
                {currentPage.components.map((component, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-3 py-1 text-sm rounded-full"
                  >
                    ✓ {component}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal formularz */}
        {showForm && tableSchema && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <DbForm
                tableSchema={tableSchema}
                onSubmit={handleFormSubmit}
                initialData={editingRecord}
                loading={dbLoading}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}

        {/* Renderowanie rzeczywistych komponentów */}
        {(currentPage.type === 'table' || currentPage.type === 'list') && tableSchema && (
          <>
            {/* Filtry - jeśli są skonfigurowane i komponent ma ListFilter */}
            {filterConfigs.length > 0 && currentPage.components?.includes('ListFilter') && (
              <ListFilter
                filterConfigs={filterConfigs}
                onFilter={handleFilter}
                onClear={handleClearFilters}
                loading={dbLoading}
                title={`Filtrowanie - ${currentPage.table}`}
              />
            )}

            {/* Tabela - jeśli komponent ma ListTable */}
            {currentPage.components?.includes('ListTable') && (
              <ListTable
                data={tableData}
                tableSchema={tableSchema}
                onRowClick={currentPage.type === 'table' ? handleRowClick : undefined}
                loading={dbLoading}
                title={`${currentPage.name} (${tableData.length})`}
                relationColumns={currentPage.table === 'faktury' ? [
                  {
                    key: 'klient_nazwa',
                    label: 'Nazwa klienta',
                    render: (value, row) => value || `ID: ${row.klient_id || 'Brak'}`
                  }
                ] : []}
              />
            )}
          </>
        )}

        {/* Formularz standalone - dla type === 'form' */}
        {currentPage.type === 'form' && tableSchema && currentPage.components?.includes('DbForm') && (
          <DbForm
            tableSchema={tableSchema}
            onSubmit={handleFormSubmit}
            loading={dbLoading}
            title={currentPage.name}
          />
        )}

        {/* Debug sekcja - gdy włączona */}
        {showDebug && (
          <>
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

            {/* Schema tabeli */}
            {tableSchema && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Schema tabeli</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Definicja pól tabeli {currentPage.table}
                  </p>
                </div>
                <div className="p-4">
                  <JsonViewer data={tableSchema} />
                </div>
              </div>
            )}

            {/* Debug info */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Debug Info</h3>
              </div>
              <div className="p-4">
                <div className="text-sm space-y-1">
                  <p><strong>Vendor:</strong> {vendorSlug}</p>
                  <p><strong>Page:</strong> {pageSlug}</p>
                  <p><strong>Table:</strong> {currentPage.table}</p>
                  <p><strong>Data count:</strong> {tableData.length}</p>
                  <p><strong>Loading:</strong> {dbLoading ? 'Yes' : 'No'}</p>
                  <p><strong>Error:</strong> {dbError || 'None'}</p>
                  <p><strong>Filters:</strong> {JSON.stringify(filters)}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default VendorApp