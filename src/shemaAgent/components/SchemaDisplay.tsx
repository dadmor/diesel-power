// src/shemaAgent/components/SchemaDisplay.tsx - ZAKTUALIZOWANY z theme
import React from "react";
import { Layer, LayerType, SchemaState } from "../types";
import { LAYERS_CONFIG } from "../LAYERS";
import { SchemaCard } from "@/themes/default";


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
        title="Pełna Schema"
        data={schema}
        maxHeight="16rem"
      />
    </div>
  );
};

export default SchemaDisplay;