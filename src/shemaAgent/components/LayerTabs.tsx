// LayerTabs.tsx - Uproszczony bez ikon
import React from "react";
import { Layer, LayerType, SchemaState } from "../types";

interface LayerTabsProps {
  layers: Layer[];
  currentLayer: LayerType;
  setCurrentLayer: (layer: LayerType) => void;
  schema: SchemaState;
}

const LayerTabs: React.FC<LayerTabsProps> = ({
  layers,
  currentLayer,
  setCurrentLayer,
  schema,
}) => {
  return (
    <div className="flex gap-1 rounded-lg overflow-hidden bg-gray-100 p-1 shadow-inner">
      {layers.map((layer) => {
        const isActive = currentLayer === layer.id;
        const isCompleted = !!schema[layer.id];
        
        return (
          <button
            key={layer.id}
            onClick={() => setCurrentLayer(layer.id)}
            className={`px-4 py-2 text-sm rounded-md transition-all duration-200 flex items-center gap-2 ${
              isActive
                ? "bg-white text-blue-600 shadow-sm font-medium"
                : isCompleted
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{layer.name}</span>
            {isCompleted && <span className="text-green-500">✓</span>}
          </button>
        );
      })}
    </div>
  );
};

export default LayerTabs;