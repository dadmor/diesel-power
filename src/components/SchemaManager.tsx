// ===== src/components/SchemaManager.tsx ===== (Updated Style)
import React, { useState } from "react";
import { Vendor, Field } from "../types";
import { updateVendorSchema, createTables } from "../lib/supabase";
import { SimpleSchemaPreview } from "./SimpleSchemaPreview";
import {
  Save,
  Plus,
  Trash2,
  Database,
  Edit3,
  Eye,
  MessageSquare,
} from "lucide-react";
import { Button, Input, Select } from "./shared";
import { useSchemaEditor } from "../hooks";

interface SchemaManagerProps {
  vendor: Vendor;
  onSave: (vendor: Vendor) => void;
  onCancel: () => void;
}

const fieldTypes: Field["type"][] = [
  "string",
  "text",
  "number",
  "date",
  "boolean",
  "select",
];

export const SchemaManager: React.FC<SchemaManagerProps> = ({
  vendor,
  onSave,
  onCancel,
}) => {
  const {
    schema,
    addTable,
    updateTable,
    deleteTable,
    addField,
    updateField,
    deleteField,
  } = useSchemaEditor(vendor.schema);
  const [selectedTableIndex, setSelectedTableIndex] = useState<number | null>(
    null
  );
  const [mode, setMode] = useState<"edit" | "view">("view");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const selectedTable =
    selectedTableIndex !== null ? schema.tables[selectedTableIndex] : null;

  const validate = () => {
    const errs: string[] = [];
    if (schema.tables.length === 0)
      errs.push("Wymagana przynajmniej jedna tabela");
    schema.tables.forEach((table, i) => {
      if (!table.name.trim()) errs.push(`Tabela ${i + 1}: brak nazwy`);
      if (table.fields.length === 0)
        errs.push(`Tabela "${table.name}": brak pól`);
      table.fields.forEach((field, j) => {
        if (!field.name.trim())
          errs.push(`Tabela "${table.name}", pole ${j + 1}: brak nazwy`);
        if (field.type === "select" && !field.options?.length)
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
      setErrors([error.message || "Błąd zapisywania"]);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTable = () => {
    const newIndex = addTable();
    setSelectedTableIndex(newIndex);
    setMode("edit");
  };

  const handleDeleteTable = (index: number) => {
    if (confirm("Usunąć tabelę?")) {
      deleteTable(index);
      if (selectedTableIndex === index) setSelectedTableIndex(null);
      else if (selectedTableIndex !== null && selectedTableIndex > index) {
        setSelectedTableIndex(selectedTableIndex - 1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - same style as Dashboard/Chat */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-slate-900">{vendor.name}</h1>
          <p className="text-xs text-slate-500">
            /{vendor.slug} • Edycja schema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            icon={MessageSquare}
            onClick={() => (window.location.href = `/edit-chat/${vendor.id}`)}
          >
            Chat
          </Button>
          <Button
            variant={mode === "edit" ? "primary" : "secondary"}
            size="sm"
            icon={mode === "edit" ? Eye : Edit3}
            onClick={() => setMode(mode === "edit" ? "view" : "edit")}
          >
            {mode === "edit" ? "Podgląd" : "Edytuj"}
          </Button>
          {mode === "edit" && (
            <Button size="sm" icon={Save} onClick={handleSave} loading={saving}>
              Zapisz
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onCancel}>
            ← Panel
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="text-red-800 font-medium mb-2 text-sm">Błędy:</h3>
            <ul className="text-red-700 text-xs space-y-1">
              {errors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Tables Navigation */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-900">
                Tabele ({schema.tables.length})
              </h2>
              {mode === "edit" && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Plus}
                  onClick={handleAddTable}
                />
              )}
            </div>

            <div className="divide-y divide-slate-200">
              {schema.tables.map((table, index) => (
                <TableItem
                  key={index}
                  table={table}
                  index={index}
                  isSelected={selectedTableIndex === index}
                  isEditable={mode === "edit"}
                  onClick={() => setSelectedTableIndex(index)}
                  onDelete={() => handleDeleteTable(index)}
                />
              ))}

              {schema.tables.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <Database className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm">Brak tabel</p>
                  {mode === "edit" && (
                    <Button
                      className="mt-3"
                      size="sm"
                      icon={Plus}
                      onClick={handleAddTable}
                    >
                      Dodaj tabelę
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {mode === "view" ? (
              <div className="bg-white rounded-lg border border-slate-200">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h3 className="text-sm font-medium text-slate-900">
                    Podgląd Schema
                  </h3>
                </div>
                <div className="p-4">
                  <SimpleSchemaPreview
                    schema={schema}
                    vendorName={vendor.name}
                  />
                </div>
              </div>
            ) : selectedTable ? (
              <TableEditor
                table={selectedTable}
                tableIndex={selectedTableIndex!}
                onUpdateTable={updateTable}
                onAddField={() => addField(selectedTableIndex!)}
                onUpdateField={(fieldIndex, updates) =>
                  updateField(selectedTableIndex!, fieldIndex, updates)
                }
                onDeleteField={(fieldIndex) =>
                  deleteField(selectedTableIndex!, fieldIndex)
                }
              />
            ) : (
              <div className="bg-white rounded-lg border border-slate-200">
                <div className="p-12 text-center">
                  <Eye className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Wybierz tabelę
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Kliknij tabelę z lewej strony aby ją edytować
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
      isSelected ? "bg-slate-50 border-r-2 border-slate-900" : ""
    }`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Database className="h-4 w-4 text-slate-400" />
        <div>
          <p className="font-medium text-slate-900 text-sm">{table.name}</p>
          <p className="text-xs text-slate-500">{table.fields.length} pól</p>
        </div>
      </div>

      {isEditable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-red-500 hover:text-red-700 transition-colors"
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
}> = ({
  table,
  tableIndex,
  onUpdateTable,
  onAddField,
  onUpdateField,
  onDeleteField,
}) => (
  <div className="bg-white rounded-lg border border-slate-200">
    <div className="px-4 py-3 border-b border-slate-200">
      <h3 className="text-sm font-medium text-slate-900">
        Edytuj: {table.name}
      </h3>
    </div>
    <div className="p-4 space-y-6">
      <Input
        label="Nazwa tabeli"
        value={table.name}
        onChange={(e) => onUpdateTable(tableIndex, { name: e.target.value })}
      />

      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-900">Pola</h4>
        <Button icon={Plus} size="sm" onClick={onAddField}>
          Pole
        </Button>
      </div>

      <div className="space-y-4">
        {table.fields.map((field: Field, i: number) => (
          <FieldEditor
            key={i}
            field={field}
            fieldIndex={i}
            onUpdate={(updates) => onUpdateField(i, updates)}
            onDelete={() => {
              if (confirm("Usunąć pole?")) {
                onDeleteField(i);
              }
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

const FieldEditor: React.FC<{
  field: Field;
  fieldIndex: number;
  onUpdate: (updates: Partial<Field>) => void;
  onDelete: () => void;
}> = ({ field, onUpdate, onDelete }) => (
  <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
    <div className="grid grid-cols-3 gap-3">
      <Input
        value={field.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Nazwa pola"
      />
      <Select
        value={field.type}
        onChange={(e) =>
          onUpdate({
            type: e.target.value as Field["type"],
            options:
              e.target.value === "select" ? ["opcja1", "opcja2"] : undefined,
          })
        }
        options={fieldTypes.map((type) => ({ value: type, label: type }))}
      />
      <Button variant="danger" size="sm" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>

    {field.type === "select" && (
      <Input
        value={field.options?.join(", ") || ""}
        onChange={(e) =>
          onUpdate({
            options: e.target.value
              .split(",")
              .map((opt) => opt.trim())
              .filter(Boolean),
          })
        }
        placeholder="opcja1, opcja2, opcja3"
      />
    )}
  </div>
);
