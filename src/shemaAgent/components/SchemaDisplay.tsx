// src/shemaAgent/components/SchemaDisplay.tsx
import React, { useState } from "react";
import { Layer, LayerType, SchemaState } from "../types";
import { LAYERS_CONFIG } from "../LAYERS";
import { SchemaCard } from "@/themes/default";
import { Copy } from "lucide-react";

interface SchemaDisplayProps {
  schema: SchemaState;
  currentLayer: LayerType;
  layers: Layer[];
}

const SchemaDisplay: React.FC<SchemaDisplayProps> = ({
  schema,
  currentLayer,
}) => {
  const currentLayerConfig = LAYERS_CONFIG[currentLayer];
  const [copied, setCopied] = useState(false);

  const handleCopyFull = () => {
    const textToCopy = JSON.stringify(schema, null, 2);
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      })
      .catch((err) => {
        console.error("Błąd podczas kopiowania pełnej schemy:", err);
      });
  };

  return (
    <div className="flex-1 space-y-6 flex flex-col">
      <SchemaCard
        title={`Schema - ${currentLayerConfig.name}`}
        description={currentLayerConfig.description}
        data={schema[currentLayer]}
        isCompleted={!!schema[currentLayer]}
        className="flex-1"
        maxHeight="50vh"
      />

      <SchemaCard
        title={
          <div className="flex items-center justify-between w-full">
            <div>Pełna Schema</div>
            <button
              onClick={handleCopyFull}
              className={`p-2 rounded hover:bg-gray-100 flex items-center gap-2 text-xs ${copied ? "text-green-500" : ""}`}
              title="Kopiuj pełną schemę"
            >
              <Copy size={20} /><>{copied ? "copied" : ""}</>
            </button>
          </div>
        }
        data={schema}
        maxHeight="16rem"
      />
    </div>
  );
};

export default SchemaDisplay;
