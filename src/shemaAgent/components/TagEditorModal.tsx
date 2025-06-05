// src/shemaAgent/components/TagEditorModal.tsx
import React, { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { LayerType, ParsedTag } from "../types";
import { LAYERS_CONFIG } from "../LAYERS";
import { Input } from "@/themes/default/components/Form";
import { Button } from "@/themes/default/components/Button";


interface TagEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: ParsedTag | null;
  layer: LayerType;
  onSave: (updatedTag: ParsedTag) => void;
  onDelete?: () => void;
}

export const TagEditorModal: React.FC<TagEditorModalProps> = ({
  isOpen,
  onClose,
  tag,
  layer,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [tagName, setTagName] = useState("");

  useEffect(() => {
    if (tag) {
      setFormData({ ...tag.params });
      setTagName(tag.tag);
    } else {
      setFormData({});
      setTagName("");
    }
  }, [tag]);

  if (!isOpen || !tag) return null;

  const layerConfig = LAYERS_CONFIG[layer];
  const tagConfig = layerConfig?.tags.find(t => t.name === tag.tag);

  if (!tagConfig) {
    return null;
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    const updatedTag: ParsedTag = {
      tag: tagName,
      params: { ...formData }
    };
    onSave(updatedTag);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Edytuj Tag: <span className="text-blue-600">{tag.tag}</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Warstwa: {layerConfig.name}
            </p>
            {tagConfig.description && (
              <p className="text-sm text-gray-500 mt-1">
                {tagConfig.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Tag Name (readonly) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nazwa tagu
            </label>
            <input
              type="text"
              value={tagName}
              disabled
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          {/* Dynamic form fields based on tag parameters */}
          {tagConfig.params.map((paramName) => {
            const isTextarea = paramName.includes('description') || 
                              paramName.includes('content') || 
                              paramName.includes('fields') ||
                              paramName.includes('rules') ||
                              formData[paramName]?.length > 50;

            return (
              <Input
                key={paramName}
                label={paramName.charAt(0).toUpperCase() + paramName.slice(1)}
                value={formData[paramName] || ""}
                onChange={(value) => handleInputChange(paramName, value)}
                type={isTextarea ? "textarea" : "text"}
                rows={isTextarea ? 4 : undefined}
              />
            );
          })}

          {/* Example section */}
          {tagConfig.example && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Przykład:</h4>
              <pre className="text-xs text-gray-600 font-mono bg-white p-3 rounded border overflow-x-auto">
                {tagConfig.example}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div>
            {onDelete && (
              <Button
                variant="danger"
                onClick={handleDelete}
              >
                <Trash2 size={16} className="mr-2" />
                Usuń
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Anuluj
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
            >
              <Save size={16} className="mr-2" />
              Zapisz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};