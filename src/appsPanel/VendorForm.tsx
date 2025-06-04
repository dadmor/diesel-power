// src/appsPanel/VendorForm.tsx - ZOPTYMALIZOWANY z relacjami
import { useState } from "react";
import { api } from "./api";
import { validateSchema, Notification } from "./utils";

export const VendorForm = ({ vendor, onSave, onCancel, mode = "add" }: any) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    slug: vendor?.slug || "",
    name: vendor?.name || "",
    schema: vendor?.schema || {
      tables: [
        {
          name: "users",
          displayName: "Użytkownicy",
          fields: [
            { name: "name", type: "string", required: true },
            { name: "email", type: "string", required: true, unique: true },
          ],
        },
      ],
    },
  });

  const updateTable = (index: number, table: any) => {
    const updatedTables = [...formData.schema.tables];
    updatedTables[index] = table;
    setFormData({
      ...formData,
      schema: { ...formData.schema, tables: updatedTables },
    });
  };

  const addTable = () => {
    const newTable = {
      name: "",
      displayName: "",
      fields: [{ name: "name", type: "string", required: true }],
    };
    setFormData({
      ...formData,
      schema: {
        ...formData.schema,
        tables: [...formData.schema.tables, newTable],
      },
    });
  };

  const removeTable = (index: number) => {
    const updatedTables = formData.schema.tables.filter(
      (_: any, i: number) => i !== index
    );
    setFormData({
      ...formData,
      schema: { ...formData.schema, tables: updatedTables },
    });
  };

  const addField = (tableIndex: number) => {
    const newField = { name: "", type: "string", required: false };
    const updatedTable = { ...formData.schema.tables[tableIndex] };
    updatedTable.fields = [...updatedTable.fields, newField];
    updateTable(tableIndex, updatedTable);
  };

  const updateField = (tableIndex: number, fieldIndex: number, field: any) => {
    const updatedTable = { ...formData.schema.tables[tableIndex] };
    updatedTable.fields[fieldIndex] = field;
    updateTable(tableIndex, updatedTable);
  };

  const removeField = (tableIndex: number, fieldIndex: number) => {
    const updatedTable = { ...formData.schema.tables[tableIndex] };
    updatedTable.fields = updatedTable.fields.filter(
      (_: any, i: number) => i !== fieldIndex
    );
    updateTable(tableIndex, updatedTable);
  };

  const handleSave = async () => {
    if (!formData.slug || !formData.name)
      return setError("Slug i nazwa wymagane!");

    // Walidacja podstawowa
    if (formData.schema.tables.length === 0)
      return setError("Dodaj przynajmniej jedną tabelę!");

    setLoading(true);
    try {
      const result =
        mode === "edit"
          ? await api.updateVendor(vendor.id, formData)
          : await api.addVendor(formData);
      onSave(Array.isArray(result) ? result[0] : result);
    } catch (err: any) {
      setError(`Błąd: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTables = (currentTableIndex: number) => {
    return formData.schema.tables
      .filter((_: any, index: number) => index !== currentTableIndex)
      .map((table: any) => table.name)
      .filter((name: string) => name.trim() !== "");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={onCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded mr-4"
        >
          ← Anuluj
        </button>
        <h1 className="text-2xl font-bold">
          {mode === "edit" ? "✏️ Edytuj" : "➕ Dodaj"} aplikację vendora
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {error && (
          <Notification
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {/* Podstawowe */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
              disabled={mode === "edit"}
              placeholder="np. crm-app"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nazwa *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
              placeholder="np. System CRM"
            />
          </div>
        </div>

        {/* Tabele */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Tabele ({formData.schema.tables.length})
            </h3>
            <button
              onClick={addTable}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              ➕ Dodaj tabelę
            </button>
          </div>

          {formData.schema.tables.map((table: any, tableIndex: number) => (
            <div key={tableIndex} className="border rounded-lg p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  value={table.name}
                  onChange={(e) =>
                    updateTable(tableIndex, { ...table, name: e.target.value })
                  }
                  placeholder="nazwa_tabeli"
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  value={table.displayName || ""}
                  onChange={(e) =>
                    updateTable(tableIndex, {
                      ...table,
                      displayName: e.target.value,
                    })
                  }
                  placeholder="Wyświetlana nazwa"
                  className="px-3 py-2 border rounded"
                />
                <button
                  onClick={() => removeTable(tableIndex)}
                  className="bg-red-500 text-white px-3 py-2 rounded"
                >
                  🗑️ Usuń tabelę
                </button>
              </div>

              {/* Pola */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Pola ({table.fields.length})</h4>
                  <button
                    onClick={() => addField(tableIndex)}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                  >
                    ➕ Pole
                  </button>
                </div>

                {table.fields.map((field: any, fieldIndex: number) => (
                  <div
                    key={fieldIndex}
                    className="flex gap-2 items-center  justify-between bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) =>
                        updateField(tableIndex, fieldIndex, {
                          ...field,
                          name: e.target.value,
                        })
                      }
                      placeholder="nazwa_pola"
                      className="col-span-2 px-2 py-1 border rounded text-sm"
                    />

                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateField(tableIndex, fieldIndex, {
                          ...field,
                          type: e.target.value,
                        })
                      }
                      className="col-span-2 px-2 py-1 border rounded text-sm"
                    >
                      <option value="string">String</option>
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                      <option value="uuid">UUID</option>
                    </select>

                    <label className="col-span-1 flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={field.required || false}
                        onChange={(e) =>
                          updateField(tableIndex, fieldIndex, {
                            ...field,
                            required: e.target.checked,
                          })
                        }
                        className="mr-1"
                      />
                      Wymagane
                    </label>

                    {/* NOWE: Relacje */}
                    <select
                      value={field.relation?.type || ""}
                      onChange={(e) => {
                        const relationType = e.target.value;
                        if (relationType) {
                          updateField(tableIndex, fieldIndex, {
                            ...field,
                            relation: {
                              type: relationType,
                              table: "",
                              foreignKey: "id",
                            },
                          });
                        } else {
                          const { relation, ...fieldWithoutRelation } = field;
                          updateField(
                            tableIndex,
                            fieldIndex,
                            fieldWithoutRelation
                          );
                        }
                      }}
                      className="col-span-2 px-2 py-1 border rounded text-sm"
                    >
                      <option value="">Brak relacji</option>
                      <option value="belongsTo">Należy do</option>
                      <option value="hasMany">Ma wiele</option>
                    </select>

                    {field.relation && (
                      <select
                        value={field.relation.table || ""}
                        onChange={(e) =>
                          updateField(tableIndex, fieldIndex, {
                            ...field,
                            relation: {
                              ...field.relation,
                              table: e.target.value,
                            },
                          })
                        }
                        className="col-span-2 px-2 py-1 border rounded text-sm"
                      >
                        <option value="">Wybierz tabelę</option>
                        {getAvailableTables(tableIndex).map((tableName) => (
                          <option key={tableName} value={tableName}>
                            {tableName}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={() => removeField(tableIndex, fieldIndex)}
                      className="col-span-1 bg-red-500 text-white px-2 py-1 rounded text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {loading ? "⏳ Zapisuję..." : "💾 Zapisz aplikację"}
        </button>
      </div>
    </div>
  );
};
