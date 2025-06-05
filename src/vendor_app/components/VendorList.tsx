// src/vendor_app/components/VendorList.tsx
import React, { useState } from "react";
import { useVendors } from "../context/VendorContext";
import { Vendor } from "../types/vendor.types";
import { Link } from "react-router-dom";
import { Input } from "@/themes/default/components/Form";
import { Button } from "@/themes/default/components/Button";
import { Card } from "@/themes/default/components/Card";

export const VendorList: React.FC = () => {
  const { vendors, loading, error, getVendorById, updateVendor } = useVendors();
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newSchema, setNewSchema] = useState("{}");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  if (loading) return <p>Ładowanie vendorów…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (vendors.length === 0) return <p>Brak vendorów.</p>;

  const startEdit = async (id: string) => {
    setIsFetching(true);
    setLocalError(null);
    const fullVendor = await getVendorById(id);
    setIsFetching(false);
    if (fullVendor) {
      setEditing(fullVendor);
      setNewName(fullVendor.name);
      setNewSlug(fullVendor.slug);
      setNewSchema(JSON.stringify(fullVendor.schema || {}, null, 2));
    } else {
      setLocalError("Nie udało się pobrać danych vendora");
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setLocalError(null);
  };

  const saveEdit = async () => {
    if (!newName.trim() || !newSlug.trim()) {
      setLocalError("Oba pola są wymagane");
      return;
    }
    try {
      const schema = JSON.parse(newSchema);
      setLocalError(null);
      if (editing) {
        await updateVendor(editing.id, {
          name: newName,
          slug: newSlug,
          schema,
        });
        setEditing(null);
      }
    } catch {
      setLocalError("Nieprawidłowy JSON w polu schema");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Lista Vendorów</h2>
      {vendors.map((v) => (
        <Card key={v.id} editing={editing?.id === v.id}>
          {editing?.id === v.id ? (
            <div>
              {localError && <p className="text-red-600 mb-3">{localError}</p>}
              <Input label="Nazwa" value={newName} onChange={setNewName} />
              <Input label="Slug" value={newSlug} onChange={setNewSlug} />
              <Input
                label="Schema (JSON)"
                value={newSchema}
                onChange={setNewSchema}
                type="textarea"
              />
              <div className="flex gap-2">
                <Button onClick={saveEdit}>Zapisz</Button>
                <Button variant="danger" onClick={cancelEdit}>
                  Anuluj
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <strong>{v.name}</strong> <em>({v.slug})</em>
              </div>
              <div className="flex gap-2 items-center">
                <Link
                  className="text-blue-600 bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                  to={`/${v.slug}`}
                >
                  Otwórz
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => startEdit(v.id)}
                  disabled={isFetching}
                >
                  {isFetching ? "Ładowanie…" : "Edytuj"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
