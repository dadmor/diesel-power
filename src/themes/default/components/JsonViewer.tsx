// src/themes/default/components/JsonViewer.tsx
import React from 'react';

interface JsonViewerProps {
  data: any;
  className?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, className = "" }) => {
  if (!data) return <div className="text-gray-400 italic">Brak danych</div>;

  const formatValue = (value: any, indent = 0): JSX.Element[] => {
    const spaces = "  ".repeat(indent);

    if (value === null) return [<span className="text-gray-500">null</span>];
    if (typeof value === "string")
      return [<span className="text-emerald-700">"{value}"</span>];
    if (typeof value === "number")
      return [<span className="text-blue-700">{value}</span>];
    if (typeof value === "boolean")
      return [<span className="text-violet-700">{value.toString()}</span>];

    if (Array.isArray(value)) {
      if (value.length === 0) return [<span>[]</span>];
      const items: JSX.Element[] = [
        <span>
          [<br />
        </span>,
      ];
      value.forEach((item, i) => {
        items.push(<span>{spaces} </span>);
        items.push(...formatValue(item, indent + 1));
        if (i < value.length - 1) items.push(<span>,</span>);
        items.push(<br />);
      });
      items.push(<span>{spaces}]</span>);
      return items;
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      if (keys.length === 0) return [<span>{"{}"}</span>];
      const items: JSX.Element[] = [
        <span>
          {"{"}
          <br />
        </span>,
      ];
      keys.forEach((key, i) => {
        items.push(<span>{spaces} </span>);
        items.push(
          <span className="inline-block text-rose-600 bg-rose-50 px-1 p-0.5 border border-rose-200 rounded m-px">
            "{key}"
          </span>
        );
        items.push(<span>: </span>);
        items.push(...formatValue(value[key], indent + 1));
        if (i < keys.length - 1) items.push(<span>,</span>);
        items.push(<br />);
      });
      items.push(
        <span>
          {spaces}
          {"}"}
        </span>
      );
      return items;
    }

    return [<span>{String(value)}</span>];
  };

  return (
    <div className={`bg-slate-50 text-slate-800 p-4 rounded-lg font-mono text-sm overflow-auto border ${className}`}>
      <pre className="whitespace-pre-wrap">
        {formatValue(data).map((element, i) => (
          <span key={i}>{element}</span>
        ))}
      </pre>
    </div>
  );
};  