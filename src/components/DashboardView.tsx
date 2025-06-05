import { Card } from "../themes/default";
import { Vendor } from "../vendor_apps";

// src/components/DashboardView.tsx
export const DashboardView: React.FC<{ vendor: Vendor; appData: any }> = ({ vendor, appData }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card hover>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              📊
            </div>
            <div>
              <h3 className="text-lg font-semibold">Tabele</h3>
              <p className="text-2xl font-bold text-blue-600">
                {appData.schema?.tables?.length || 0}
              </p>
            </div>
          </div>
        </Card>
  
        <Card hover>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              🔗
            </div>
            <div>
              <h3 className="text-lg font-semibold">Relacje</h3>
              <p className="text-2xl font-bold text-green-600">
                {appData.schema?.relations?.length || 0}
              </p>
            </div>
          </div>
        </Card>
  
        <Card hover>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              ⚙️
            </div>
            <div>
              <h3 className="text-lg font-semibold">Status</h3>
              <p className="text-sm font-medium text-green-600">Aktywna</p>
            </div>
          </div>
        </Card>
  
        <Card className="md:col-span-2 lg:col-span-3">
          <h3 className="text-lg font-semibold mb-4">Struktura aplikacji</h3>
          <div className="space-y-3">
            {appData.schema?.tables?.map((table: any, index: number) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">
                  {vendor.slug}_{table.name}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {table.fields?.map((field: any, fieldIndex: number) => (
                    <span
                      key={fieldIndex}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {field.name} ({field.type})
                    </span>
                  )) || table.columns?.map((col: any, colIndex: number) => (
                    <span
                      key={colIndex}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {col.name} ({col.type})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };
  