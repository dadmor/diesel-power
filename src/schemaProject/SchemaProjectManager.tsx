// src/schemaProject/SchemaProjectManager.tsx - UPROSZCZONA WERSJA
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save, Trash2, FolderOpen, Plus } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Wczytaj listę projektów przy otwarciu
  useEffect(() => {
    if (isOpen) {
      loadProjects();
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

  const saveProject = async () => {
    if (!projectName.trim()) {
      alert('Podaj nazwę projektu');
      return;
    }

    setSaveLoading(true);
    try {
      // MAKSYMALNIE UPROSZCZONE - bez walidacji typów
      const projectData = {
        name: projectName,
        description: projectDescription || 'Nowy projekt',
        category: 'other', // Stała wartość
        status: 'draft', // Stała wartość
        schema: schema || {} // Jeśli brak schema, użyj pustego obiektu
      };

      console.log('Zapisuję projekt:', projectData); // Debug

      const savedProject = await SchemaDatabase.createSchemaProject(projectData);
      
      // Odśwież listę projektów
      await loadProjects();
      
      // Reset formularza
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
      // Wczytaj pełne dane projektu
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
      // Użyj bezpośrednio Supabase do usunięcia
      const { supabase } = await import('./schemaDatabase');
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      // Odśwież listę
      await loadProjects();
      alert(`Projekt "${project.name}" został usunięty`);
    } catch (error) {
      console.error('Błąd usuwania:', error);
      alert('Błąd usuwania: ' + (error as Error).message);
    }
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
        <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header z opcjami */}
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Zarządzanie projektami</h3>
              <div className="flex gap-2">
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

          {/* Lista projektów */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <div className="mt-2 text-sm">Wczytywanie...</div>
              </div>
            ) : projects.length === 0 ? (
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
                            project.status === 'complete' ? 'bg-green-100 text-green-700' :
                            project.status === 'deployed' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {project.status}
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
                      </div>
                      <div className="flex gap-1 ml-2">
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
                    </div>
                    
                    {/* Podgląd warstw - uproszczony */}
                    <div className="flex gap-1 mt-2">
                      {project.schema && typeof project.schema === 'object' && (
                        <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                          dane: {Object.keys(project.schema).length}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 text-center">
            Kliknij projekt aby go wczytać
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemaProjectManager;