// ===== src/components/SchemaManager.tsx ===== (Updated)
import React, { useState } from 'react';
import { Vendor, Field } from '../types';
import { updateVendorSchema, createTables } from '../lib/supabase';
import { SimpleSchemaPreview } from './SimpleSchemaPreview';
import { Save, Plus, Trash2, Database, Edit3, Eye, MessageSquare } from 'lucide-react';
import { Layout, Button, Card, Input, Select } from './shared';
import { useSchemaEditor } from '../hooks';

interface SchemaManagerProps {
  vendor: Vendor;
  onSave: (vendor: Vendor) => void;
  onCancel: () => void;
}

const fieldTypes: Field['type'][] = ['string', 'text', 'number', 'date', 'boolean', 'select'];

export const SchemaManager: React.FC<SchemaManagerProps> = ({ vendor, onSave, onCancel }) => {
  const { schema, addTable, updateTable, deleteTable, addField, updateField, deleteField } = useSchemaEditor(vendor.schema);
  const [selectedTableIndex, setSelectedTableIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<'edit' | 'view'>('view');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const selectedTable = selectedTableIndex !== null ? schema.tables[selectedTableIndex] : null;

  const validate = () => {
    const errs: string[] = [];
    if (schema.tables.length === 0) errs.push('Wymagana przynajmniej jedna tabela');
    schema.tables.forEach((table, i) => {
      if (!table.name.trim()) errs.push(`Tabela ${i + 1}: brak nazwy`);
      if (table.fields.length === 0) errs.push(`Tabela "${table.name}": brak pól`);
      table.fields.forEach((field, j) => {
        if (!field.name.trim()) errs.push(`Tabela "${table.name}", pole ${j + 1}: brak nazwy`);
        if (field.type === 'select' && !field.options?.length) 
          errs.push(`Pole "${field.name}": select wymaga opcji`);
      });
    });
    return errs;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    setSaving(true);
    try {
      await updateVendorSchema(vendor.id, schema);
      await createTables(vendor.slug, schema.tables);
      onSave({ ...vendor, schema });
    } catch (error: any) {
      setErrors([error.message || 'Błąd zapisywania']);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTable = () => {
    const newIndex = addTable();
    setSelectedTableIndex(newIndex);
    setMode('edit');
  };

  const handleDeleteTable = (index: number) => {
    if (confirm('Usunąć tabelę?')) {
      deleteTable(index);
      if (selectedTableIndex === index) setSelectedTableIndex(null);
      else if (selectedTableIndex !== null && selectedTableIndex > index) {
        setSelectedTableIndex(selectedTableIndex - 1);
      }
    }
  };

  return (
    <Layout
      title={vendor.name}
      subtitle={`/${vendor.slug} • Edycja schema`}
      onBack={onCancel}
      actions={
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            icon={MessageSquare}
            onClick={() => window.location.href = `/edit-chat/${vendor.id}`}
          >
            Edytuj przez chat
          </Button>
          <Button
            variant={mode === 'edit' ? 'primary' : 'secondary'}
            icon={mode === 'edit' ? Eye : Edit3}
            onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
          >
            {mode === 'edit' ? 'Podgląd' : 'Edytuj'}
          </Button>
          {mode === 'edit' && (
            <Button icon={Save} onClick={handleSave} loading={saving}>
              Zapisz
            </Button>
          )}
        </div>
      }
    >
      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50/80 border border-red-200/60 rounded-2xl p-5 mb-8">
          <h3 className="text-red-800 font-medium mb-3 text-sm">Błędy:</h3>
          <ul className="text-red-700 text-xs space-y-1">
            {errors.map((error, i) => <li key={i}>• {error}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tables Navigation */}
        <Card 
          className="p-0"
          header={
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-light text-slate-900">Tabele ({schema.tables.length})</h2>
              {mode === 'edit' && (
                <Button variant="ghost" size="sm" icon={Plus} onClick={handleAddTable} />
              )}
            </div>
          }
        >
          <div className="divide-y divide-slate-200/60 -m-8">
            {schema.tables.map((table, index) => (
              <TableItem
                key={index}
                table={table}
                index={index}
                isSelected={selectedTableIndex === index}
                isEditable={mode === 'edit'}
                onClick={() => setSelectedTableIndex(index)}
                onDelete={() => handleDeleteTable(index)}
              />
            ))}
            
            {schema.tables.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                <Database className="h-12 w-12 mx-auto mb-3 text-slate-400 opacity-60" />
                <p className="text-sm">Brak tabel</p>
                {mode === 'edit' && (
                  <Button className="mt-4" size="sm" icon={Plus} onClick={handleAddTable}>
                    Dodaj pierwszą tabelę
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {mode === 'view' ? (
            <Card header={<h3 className="text-xl font-light text-slate-900">Podgląd Schema</h3>}>
              <SimpleSchemaPreview schema={schema} vendorName={vendor.name} />
            </Card>
          ) : selectedTable ? (
            <TableEditor
              table={selectedTable}
              tableIndex={selectedTableIndex!}
              onUpdateTable={updateTable}
              onAddField={() => addField(selectedTableIndex!)}
              onUpdateField={(fieldIndex, updates) => updateField(selectedTableIndex!, fieldIndex, updates)}
              onDeleteField={(fieldIndex) => deleteField(selectedTableIndex!, fieldIndex)}
            />
          ) : (
            <Card>
              <div className="text-center py-16">
                <Eye className="h-16 w-16 text-slate-400 mx-auto mb-6 opacity-60" />
                <h3 className="text-xl font-light text-slate-900 mb-3">Wybierz tabelę</h3>
                <p className="text-slate-500 text-sm">Kliknij tabelę z lewej strony aby ją edytować</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

const TableItem: React.FC<{
  table: any;
  index: number;
  isSelected: boolean;
  isEditable: boolean;
  onClick: () => void;
  onDelete: () => void;
}> = ({ table, isSelected, isEditable, onClick, onDelete }) => (
  <div 
    className={`p-5 cursor-pointer hover:bg-slate-50/50 transition-colors duration-150 ${
      isSelected ? 'bg-slate-50/50 border-r-2 border-slate-900' : ''
    }`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Database className="h-5 w-5 text-slate-400" />
        <div>
          <p className="font-medium text-slate-900 text-sm">{table.name}</p>
          <p className="text-xs text-slate-500">{table.fields.length} pól</p>
        </div>
      </div>
      
      {isEditable && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-red-500 hover:text-red-700 transition-colors duration-150"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  </div>
);

const TableEditor: React.FC<{
  table: any;
  tableIndex: number;
  onUpdateTable: (index: number, updates: any) => void;
  onAddField: () => void;
  onUpdateField: (fieldIndex: number, updates: any) => void;
  onDeleteField: (fieldIndex: number) => void;
}> = ({ table, tableIndex, onUpdateTable, onAddField, onUpdateField, onDeleteField }) => (
  <Card header={<h3 className="text-xl font-light text-slate-900">Edytuj: {table.name}</h3>}>
    <div className="space-y-8">
      <Input
        label="Nazwa tabeli"
        value={table.name}
        onChange={(e) => onUpdateTable(tableIndex, { name: e.target.value })}
      />

      <div className="flex items-center justify-between">
        <h4 className="text-lg font-light text-slate-900">Pola</h4>
        <Button icon={Plus} size="sm" onClick={onAddField}>
          Pole
        </Button>
      </div>

      <div className="space-y-5">
        {table.fields.map((field: Field, i: number) => (
          <FieldEditor
            key={i}
            field={field}
            fieldIndex={i}
            onUpdate={(updates) => onUpdateField(i, updates)}
            onDelete={() => {
              if (confirm('Usunąć pole?')) {
                onDeleteField(i);
              }
            }}
          />
        ))}
      </div>
    </div>
  </Card>
);

const FieldEditor: React.FC<{
  field: Field;
  fieldIndex: number;
  onUpdate: (updates: Partial<Field>) => void;
  onDelete: () => void;
}> = ({ field, onUpdate, onDelete }) => (
  <div className="p-6 border border-slate-200/60 rounded-2xl bg-white/40 space-y-4">
    <div className="grid grid-cols-3 gap-5">
      <Input
        value={field.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Nazwa pola"
      />
      <Select
        value={field.type}
        onChange={(e) => onUpdate({ 
          type: e.target.value as Field['type'],
          options: e.target.value === 'select' ? ['opcja1', 'opcja2'] : undefined
        })}
        options={fieldTypes.map(type => ({ value: type, label: type }))}
      />
      <Button variant="danger" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    
    {field.type === 'select' && (
      <Input
        value={field.options?.join(', ') || ''}
        onChange={(e) => onUpdate({
          options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean)
        })}
        placeholder="opcja1, opcja2, opcja3"
      />
    )}
  </div>
);