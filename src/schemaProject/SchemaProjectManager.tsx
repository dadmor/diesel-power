// src/schemaProject/SchemaProjectManager.tsx - Z VENDOR APP LINKAMI
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Save, Trash2, FolderOpen, Plus, ExternalLink, Rocket } from 'lucide-react';
import { SchemaDatabase } from './schemaDatabase';

interface SchemaProject {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  schema: any;
  created_at: string;
  updated_at: string;
}

interface SchemaProjectManagerProps {
  schema: any;
  currentLayer?: string;
  onProjectLoad: (projectData: any) => void;
  onReset: () => void;
}

const SchemaProjectManager: React.FC<SchemaProjectManagerProps> = ({
  schema,
  currentLayer,
  onProjectLoad,
  onReset
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<SchemaProject[]>([]);
  const [vendorApps, setVendorApps] = useState<any[]>([]); // ⭐ NOWA LISTA
  const [showVendorApps, setShowVendorApps] = useState(false); // ⭐ TOGGLE
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deployLoading, setDeployLoading] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Wczytaj listę projektów przy otwarciu
  useEffect(() => {
    if (isOpen) {
      loadProjects();
      loadVendorApps(); // ⭐ DODAJ
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectList = await SchemaDatabase.listSchemaProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Błąd wczytywania projektów:', error);
      alert('Błąd wczytywania projektów: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ NOWA FUNKCJA - Wczytaj vendor apps
  const loadVendorApps = async () => {
    try {
      const { supabase } = await import('./schemaDatabase');
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('*')
        .not('schema->>type', 'eq', 'schema_project') // NIE schema projects
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setVendorApps(vendors || []);
    } catch (error) {
      console.error('Błąd wczytywania vendor apps:', error);
    }
  };

  const saveProject = async () => {
    if (!projectName.trim()) {
      alert('Podaj nazwę projektu');
      return;
    }

    setSaveLoading(true);
    try {
      const projectData = {
        name: projectName,
        description: projectDescription || 'Nowy projekt',
        category: 'other',
        status: 'draft',
        schema: schema || {}
      };

      console.log('Zapisuję projekt:', projectData);

      const savedProject = await SchemaDatabase.createSchemaProject(projectData);
      
      await loadProjects();
      
      setProjectName('');
      setProjectDescription('');
      setShowSaveForm(false);
      
      alert(`Projekt "${savedProject.name}" został zapisany!`);
    } catch (error) {
      console.error('Błąd zapisywania:', error);
      alert('Błąd zapisywania: ' + (error as Error).message);
    } finally {
      setSaveLoading(false);
    }
  };

  const loadProject = async (project: SchemaProject) => {
    try {
      const fullProject = await SchemaDatabase.getSchemaProject(project.id);
      if (fullProject) {
        onProjectLoad(fullProject.schema);
        setIsOpen(false);
        alert(`Wczytano projekt: ${fullProject.name}`);
      }
    } catch (error) {
      console.error('Błąd wczytywania projektu:', error);
      alert('Błąd wczytywania projektu: ' + (error as Error).message);
    }
  };

  const deleteProject = async (project: SchemaProject) => {
    if (!confirm(`Czy na pewno chcesz usunąć projekt "${project.name}"?`)) {
      return;
    }

    try {
      const { supabase } = await import('./schemaDatabase');
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      await loadProjects();
      alert(`Projekt "${project.name}" został usunięty`);
    } catch (error) {
      console.error('Błąd usuwania:', error);
      alert('Błąd usuwania: ' + (error as Error).message);
    }
  };

  // ⭐ NOWA FUNKCJA - Deploy do Vendor App
  const deployToVendorApp = async (project: SchemaProject) => {
    setDeployLoading(project.id);
    
    try {
      // 1. Sprawdź czy projekt ma database schema
      if (!project.schema?.database?.tables || project.schema.database.tables.length === 0) {
        alert('Projekt nie ma zdefiniowanej struktury bazy danych. Przejdź do warstwy "Baza" i dodaj tabele.');
        return;
      }

      // 2. Stwórz slug dla vendor app
      const vendorSlug = project.name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);

      // 3. Sprawdź czy vendor app już istnieje
      const { supabase } = await import('./schemaDatabase');
      const { data: existingVendor } = await supabase
        .from('vendors')
        .select('id, slug')
        .eq('slug', vendorSlug)
        .neq('schema->>type', 'schema_project')
        .single();

      if (existingVendor) {
        // Vendor app już istnieje
        alert(`Vendor app już istnieje pod adresem: /${vendorSlug}`);
        return;
      }

      // 4. Konwertuj schema project na vendor app
      const vendorAppSchema = {
        tables: project.schema.database.tables.map((table: any) => ({
          name: table.name,
          fields: table.fields.map((field: any) => ({
            name: field.name,
            type: mapSchemaTypeToVendorType(field.type),
            ...(field.options && { options: field.options })
          }))
        }))
      };

      // 5. Stwórz vendor app w bazie
      const { data: newVendor, error: createError } = await supabase
        .from('vendors')
        .insert([{
          slug: vendorSlug,
          name: project.name,
          schema: vendorAppSchema
        }])
        .select()
        .single();

      if (createError) throw createError;

      // 6. Aktualizuj status projektu (ZACHOWAJ typ schema_project!)
      await supabase
        .from('vendors')
        .update({
          schema: {
            ...project.schema,
            type: 'schema_project', // ⭐ WAŻNE - zachowaj typ!
            status: 'deployed',
            deployed_at: new Date().toISOString(),
            vendor_app_id: newVendor.id,
            vendor_slug: vendorSlug
          }
        })
        .eq('id', project.id);

      // 7. Odśwież listę projektów
      await loadProjects();

      // 8. Sukces - vendor app utworzony
      alert(`✅ Vendor App został utworzony pod adresem: /${vendorSlug}`)

    } catch (error) {
      console.error('Błąd deployment:', error);
      alert('Błąd deployment: ' + (error as Error).message);
    } finally {
      setDeployLoading(null);
    }
  };

  // Helper - mapowanie typów pól
  const mapSchemaTypeToVendorType = (schemaType: string): string => {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'text': 'text',
      'number': 'number',
      'integer': 'number',
      'boolean': 'boolean',
      'date': 'date',
      'datetime': 'date',
      'email': 'email',
      'select': 'select'
    };
    
    return typeMap[schemaType] || 'string';
  };

  // Helper - sprawdź czy projekt można deployować
  const canDeploy = (project: SchemaProject): boolean => {
    return !!(project.schema?.database?.tables && project.schema.database.tables.length > 0);
  };

  // Helper - sprawdź czy projekt jest już deployed
  const isDeployed = (project: SchemaProject): boolean => {
    // Sprawdź w głównym schema oraz w layers
    return !!(
      project.schema?.status === 'deployed' || 
      project.schema?.vendor_slug ||
      project.schema?.layers?.status === 'deployed' ||
      project.schema?.layers?.vendor_slug
    );
  };

  // Helper - pobierz vendor URL
  const getVendorUrl = (project: SchemaProject): string | null => {
    // Sprawdź w różnych miejscach gdzie może być vendor_slug
    const vendorSlug = 
      project.schema?.vendor_slug || 
      project.schema?.layers?.vendor_slug;
    
    if (vendorSlug) {
      return `/${vendorSlug}`;
    }
    
    // Fallback - wygeneruj slug z nazwy
    const fallbackSlug = project.name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);
    
    return `/${fallbackSlug}`;
  };

  return (
    <div className="relative">
      {/* Przycisk otwierający */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
      >
        <FolderOpen size={14} />
        Projekty
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Panel rozwijany */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[420px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header z opcjami */}
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Zarządzanie projektami</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowVendorApps(!showVendorApps)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                    showVendorApps 
                      ? 'bg-purple-500 text-white hover:bg-purple-600' 
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  <Rocket size={12} />
                  {showVendorApps ? 'Schema Projects' : `Vendor Apps (${vendorApps.length})`}
                </button>
                <button
                  onClick={() => setShowSaveForm(!showSaveForm)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  <Save size={12} />
                  Zapisz
                </button>
                <button
                  onClick={onReset}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  <Plus size={12} />
                  Reset
                </button>
              </div>
            </div>

            {/* Formularz zapisu */}
            {showSaveForm && (
              <div className="space-y-2 p-2 bg-white rounded border">
                <input
                  type="text"
                  placeholder="Nazwa projektu"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Opis (opcjonalny)"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-16 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveProject}
                    disabled={saveLoading || !projectName.trim()}
                    className="flex-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {saveLoading ? 'Zapisuję...' : 'Zapisz projekt'}
                  </button>
                  <button
                    onClick={() => setShowSaveForm(false)}
                    className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lista projektów LUB vendor apps */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <div className="mt-2 text-sm">Wczytywanie...</div>
              </div>
            ) : showVendorApps ? (
              // ⭐ VENDOR APPS LIST
              vendorApps.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Brak deployed vendor apps
                </div>
              ) : (
                <div className="divide-y">
                  {vendorApps.map((vendor) => (
                    <div key={vendor.id} className="p-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {vendor.name}
                            </h4>
                            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 text-xs rounded-full">
                              deployed
                            </span>
                          </div>
                          
                          <div className="mt-2">
                            <Link
                              to={`/${vendor.slug}`}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                            >
                              <ExternalLink size={10} />
                              /{vendor.slug}
                            </Link>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>Vendor App</span>
                            <span>•</span>
                            <span>{new Date(vendor.created_at).toLocaleDateString('pl-PL')}</span>
                            <span>•</span>
                            <span>{vendor.schema?.tables?.length || 0} tables</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={async () => {
                              if (confirm(`Czy na pewno chcesz usunąć vendor app "${vendor.name}"?`)) {
                                try {
                                  const { supabase } = await import('./schemaDatabase');
                                  const { error } = await supabase
                                    .from('vendors')
                                    .delete()
                                    .eq('id', vendor.id);
                                  
                                  if (error) throw error;
                                  await loadVendorApps();
                                  alert(`Vendor app "${vendor.name}" został usunięty`);
                                } catch (error) {
                                  alert('Błąd usuwania: ' + (error as Error).message);
                                }
                              }
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Usuń vendor app"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // ⭐ SCHEMA PROJECTS LIST (oryginalna lista)
              projects.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Brak zapisanych projektów
                </div>
              ) : (
                <div className="divide-y">
                  {projects.map((project) => (
                  <div key={project.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {project.name}
                          </h4>
                          <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                            isDeployed(project) ? 'bg-green-100 text-green-700' :
                            project.status === 'complete' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {isDeployed(project) ? 'deployed' : project.status}
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{project.category}</span>
                          <span>•</span>
                          <span>{new Date(project.created_at).toLocaleDateString('pl-PL')}</span>
                        </div>
                        
                        {/* Vendor App URL jeśli deployed */}
                        {isDeployed(project) && (
                          <div className="mt-2">
                            <Link
                              to={getVendorUrl(project)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                            >
                              <ExternalLink size={10} />
                              {getVendorUrl(project)}
                            </Link>
                          </div>
                        )}
                      </div>
                      
                      {/* Akcje */}
                      <div className="flex flex-col gap-1 ml-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => loadProject(project)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Wczytaj projekt"
                          >
                            <FolderOpen size={14} />
                          </button>
                          <button
                            onClick={() => deleteProject(project)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Usuń projekt"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        {/* Deploy button */}
                        {canDeploy(project) && (
                          <button
                            onClick={() => deployToVendorApp(project)}
                            disabled={deployLoading === project.id}
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                              isDeployed(project)
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            } disabled:opacity-50`}
                            title={isDeployed(project) ? 'Otwórz Vendor App' : 'Deploy do Vendor App'}
                          >
                            {deployLoading === project.id ? (
                              <>
                                <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
                                Deploy...
                              </>
                            ) : (
                              <>
                                <Rocket size={12} />
                                {isDeployed(project) ? 'Open' : 'Deploy'}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                        {/* Podgląd warstw */}
                        <div className="flex gap-1 mt-2">
                          {project.schema && typeof project.schema === 'object' && (
                            <>
                              {(project.schema.concept || project.schema.layers?.concept) && (
                                <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                  concept
                                </span>
                              )}
                              {(project.schema.database || project.schema.layers?.database) && (
                                <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                  database ({(project.schema.database?.tables || project.schema.layers?.database?.tables)?.length || 0} tables)
                                </span>
                              )}
                              {(project.schema.ui || project.schema.layers?.ui) && (
                                <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                  ui
                                </span>
                              )}
                              {(project.schema.refine || project.schema.layers?.refine) && (
                                <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                                  refine
                                </span>
                              )}
                            </>
                          )}
                        </div>
                  </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 text-center">
            {showVendorApps 
              ? 'Deployed Vendor Apps - gotowe aplikacje CRUD'
              : 'Schema Projects - projekty w budowie • Deploy tworzy Vendor App'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemaProjectManager;