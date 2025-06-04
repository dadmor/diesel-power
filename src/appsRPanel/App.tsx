// src/appsRPanel/App.tsx

import React, { useState } from "react";
import { Refine, useList, useCreate, useDelete } from "@refinedev/core";
import {
  Card,
  Table,
  Button,
  Modal,
  Input,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Form,
  message,
} from "antd";
import {
  Plus,
  Edit,
  Trash2,
  Database,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const { Title, Text } = Typography;

// ▸ Inicjalizacja Supabase (tylko do odczytu danych)
// W Vite pobieramy z import.meta.env.VITE_…
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * DataProvider oparty o Supabase (Refine)
 */
const dataProvider = {
  getList: async ({ resource }: { resource: string }) => {
    if (resource === "vendors") {
      const { data, error } = await supabase
        .from("vendors")
        .select("id,slug,name,schema")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { data: data || [], total: data.length };
    }
    // resource = "<slug>_<tableName>"
    const { data, error } = await supabase.from(resource).select("*");
    if (error) throw error;
    return { data: data || [], total: data.length };
  },

  getOne: async ({ resource, id }: { resource: string; id: string }) => {
    const { data, error } = await supabase
      .from(resource)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return { data };
  },

  create: async ({
    resource,
    variables,
  }: {
    resource: string;
    variables: any;
  }) => {
    const { data, error } = await supabase
      .from(resource)
      .insert(variables)
      .select()
      .single();
    if (error) throw error;
    return { data };
  },

  update: async ({
    resource,
    id,
    variables,
  }: {
    resource: string;
    id: string;
    variables: any;
  }) => {
    const { data, error } = await supabase
      .from(resource)
      .update(variables)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { data };
  },

  deleteOne: async ({ resource, id }: { resource: string; id: string }) => {
    const { data, error } = await supabase
      .from(resource)
      .delete()
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { data };
  },
};

/**
 * ▸ Komponent DynamicTable – odpowiedzialny za wyświetlanie i operacje CRUD na jednej tabeli danej aplikacji
 */
const DynamicTable: React.FC<{
  vendor: any;
  tableName: string;
}> = ({ vendor, tableName }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const tableDef = vendor.schema.tables.find((t: any) => t.name === tableName);

  // Sanitizacja: zamieniamy myślnik → podkreślnik
  const sanitizedSlug = vendor.slug.replace(/-/g, "_");
  const resource = `${sanitizedSlug}_${tableName}`;

  const { data, isLoading, refetch } = useList({ resource });
  const { mutate: create } = useCreate();
  const { mutate: deleteRecord } = useDelete();

  const columns = [
    ...tableDef.fields.map((field: any) => ({
      title: field.name,
      dataIndex: field.name,
      key: field.name,
      render: (value: any) =>
        field.relation ? <Text type="warning">→ {value}</Text> : value || "-",
    })),
    {
      title: "Akcje",
      key: "actions",
      width: 100,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<Edit size={14} />}
            onClick={() => {
              setFormData(record);
              setShowCreateModal(true);
            }}
          />
          <Button
            size="small"
            danger
            icon={<Trash2 size={14} />}
            onClick={() =>
              deleteRecord(
                { resource, id: record.id },
                { onSuccess: () => refetch() }
              )
            }
          />
        </Space>
      ),
    },
  ];

  const handleCreateOrUpdate = () => {
    if (formData.id) {
      // aktualizacja
      create(
        {
          resource,
          id: formData.id,
          variables: formData,
        },
        {
          onSuccess: () => {
            setShowCreateModal(false);
            setFormData({});
            refetch();
          },
        }
      );
    } else {
      // tworzenie nowego
      create(
        {
          resource,
          variables: formData,
        },
        {
          onSuccess: () => {
            setShowCreateModal(false);
            setFormData({});
            refetch();
          },
        }
      );
    }
  };

  const renderField = (field: any) => {
    if (field.relation?.type === "belongsTo") {
      const relatedResource = `${sanitizedSlug}_${field.relation.table}`;
      const { data: optsData } = useList({ resource: relatedResource });
      return (
        <Select
          key={field.name}
          placeholder={`Wybierz ${field.relation.table}`}
          style={{ width: "100%", marginBottom: 8 }}
          value={formData[field.name]}
          onChange={(val) => setFormData({ ...formData, [field.name]: val })}
        >
          {optsData?.data?.map((opt: any) => (
            <Select.Option key={opt.id} value={opt.id}>
              {opt.name || opt.id}
            </Select.Option>
          ))}
        </Select>
      );
    }
    return (
      <Input
        key={field.name}
        placeholder={field.name}
        style={{ marginBottom: 8 }}
        value={formData[field.name] || ""}
        onChange={(e) =>
          setFormData({ ...formData, [field.name]: e.target.value })
        }
      />
    );
  };

  return (
    <Card
      title={tableDef.displayName}
      extra={
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            setFormData({});
            setShowCreateModal(true);
          }}
        >
          Dodaj
        </Button>
      }
    >
      <Table
        dataSource={data?.data}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={
          formData.id
            ? `Edytuj ${tableDef.displayName}`
            : `Nowy ${tableDef.displayName}`
        }
        open={showCreateModal}
        onOk={handleCreateOrUpdate}
        onCancel={() => {
          setShowCreateModal(false);
          setFormData({});
        }}
        width={400}
      >
        <div style={{ padding: "16px 0" }}>
          {tableDef.fields
            .filter((f: any) =>
              ["id", "created_at", "updated_at"].includes(f.name) ? false : true
            )
            .map(renderField)}
        </div>
      </Modal>
    </Card>
  );
};

/**
 * ▸ Komponent VendorApp: wyświetla sidebar z listą tabel i w zależności od wyboru pokazuje DynamicTable
 */
const VendorApp: React.FC<{
  vendor: any;
  onBack: () => void;
}> = ({ vendor, onBack }) => {
  const [activeTable, setActiveTable] = useState(vendor.schema.tables[0]?.name);

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button
              icon={<ArrowLeft size={16} />}
              onClick={onBack}
              style={{ marginRight: 16 }}
            >
              Powrót
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              {vendor.name}
            </Title>
            <Text type="secondary" style={{ marginLeft: 16 }}>
              /{vendor.slug}
            </Text>
          </div>
          <Button icon={<Settings size={16} />}>Konfiguracja</Button>
        </div>
      </Card>

      <Row gutter={16}>
        <Col span={6}>
          <Card title="Tabele" styles={{ body: { padding: 12 } }}>
            {vendor.schema.tables.map((table: any) => (
              <Button
                key={table.name}
                block
                type={activeTable === table.name ? "primary" : "default"}
                style={{ marginBottom: 8, textAlign: "left" }}
                onClick={() => setActiveTable(table.name)}
                icon={<Database size={14} />}
              >
                {table.displayName}
              </Button>
            ))}
          </Card>
        </Col>

        <Col span={18}>
          {activeTable && (
            <DynamicTable vendor={vendor} tableName={activeTable} />
          )}
        </Col>
      </Row>
    </div>
  );
};

/**
 * ▸ Komponent VendorList: lista vendorów oraz możliwość dodawania nowej aplikacji
 */
const VendorList: React.FC = () => {
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const { data: vendorsData, isLoading } = useList({ resource: "vendors" });
  const vendors = vendorsData?.data || [];

  // tryb tworzenia nowego vendora/schemy:
  const [showCreateVendor, setShowCreateVendor] = useState(false);
  const [vendorForm] = Form.useForm();

  const handleDeploy = async (values: any) => {
    try {
      const schemaObj = JSON.parse(values.schemaJSON);
      // najpierw dodajemy rekord do tabeli vendors
      const { data: createdVendor, error: errVendor } = await supabase
        .from("vendors")
        .insert({
          slug: values.slug,
          name: values.name,
          schema: schemaObj,
        })
        .select()
        .single();

      if (errVendor) throw errVendor;

      // następnie wywołujemy nasz customowy API-endpoint, żeby utworzyć fizyczne tabele:
      const resp = await fetch("/api/deployTables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: createdVendor.slug,
          schema: schemaObj,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Błąd deployTables");

      message.success("Aplikacja utworzona i tabele wdrożone");
      setShowCreateVendor(false);
      vendorForm.resetFields();
    } catch (e: any) {
      console.error(e);
      message.error(`Nie udało się stworzyć aplikacji: ${e.message}`);
    }
  };

  if (selectedVendor) {
    return (
      <VendorApp
        vendor={selectedVendor}
        onBack={() => setSelectedVendor(null)}
      />
    );
  }

  const columns = [
    {
      title: "Aplikacja",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <div>
          <Title level={5} style={{ margin: 0 }}>
            {text}
          </Title>
          <Text type="secondary">/{record.slug}</Text>
        </div>
      ),
    },
    {
      title: "Tabele",
      key: "tables",
      render: (_: any, record: any) => (
        <span>{record.schema?.tables?.length || 0} tabel</span>
      ),
    },
    {
      title: "Relacje",
      key: "relations",
      render: (_: any, record: any) => {
        const cnt =
          record.schema?.tables?.reduce(
            (acc: number, t: any) =>
              acc + (t.fields.filter((f: any) => f.relation).length || 0),
            0
          ) || 0;
        return <span>{cnt} relacji</span>;
      },
    },
    {
      title: "Akcje",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button type="primary" onClick={() => setSelectedVendor(record)}>
            Uruchom
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <Title level={2}>🚀 Multi-Vendor Apps</Title>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setShowCreateVendor(true)}
          >
            Nowa Aplikacja
          </Button>
        </div>

        <Table
          dataSource={vendors}
          columns={columns}
          loading={isLoading}
          rowKey="id"
        />
      </Card>

      <Modal
        title="Nowa Aplikacja (Vendor + Schema)"
        open={showCreateVendor}
        onCancel={() => setShowCreateVendor(false)}
        footer={null}
        width={600}
      >
        <Form form={vendorForm} layout="vertical" onFinish={handleDeploy}>
          <Form.Item
            label="Slug"
            name="slug"
            rules={[
              { required: true, message: "Podaj slug (np. crm_app)" },
              {
                pattern: /^[a-z0-9_]+$/,
                message: "Tylko małe litery, cyfry i podkreślenia",
              },
            ]}
          >
            <Input placeholder="np. panels_users" />
          </Form.Item>
          <Form.Item
            label="Nazwa aplikacji"
            name="name"
            rules={[{ required: true, message: "Podaj nazwę" }]}
          >
            <Input placeholder="np. CRM wewnętrzny" />
          </Form.Item>
          <Form.Item
            label="Schema JSON"
            name="schemaJSON"
            rules={[
              { required: true, message: "Podaj JSON schemy" },
              {
                validator: (_: any, value: string) => {
                  try {
                    const obj = JSON.parse(value);
                    if (
                      !obj.tables ||
                      !Array.isArray(obj.tables) ||
                      obj.tables.length === 0
                    ) {
                      return Promise.reject(
                        new Error(
                          "schema musi zawierać niepustą tablicę tables"
                        )
                      );
                    }
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error("Niepoprawny JSON"));
                  }
                },
              },
            ]}
          >
            <Input.TextArea
              rows={8}
              placeholder={`{
  "tables": [
    {
      "name": "users",
      "displayName": "Użytkownicy",
      "fields": [
        { "name": "name", "type": "string", "required": true },
        { "name": "email", "type": "string", "required": true, "unique": true }
      ]
    }
  ]
}`}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Utwórz i wdroż tabele
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/**
 * ▸ Główny komponent Refine
 */
const AppRPanel: React.FC = () => {
  return (
    <Refine
      dataProvider={dataProvider}
      resources={[{ name: "vendors", list: VendorList }]}
    >
      <VendorList />
    </Refine>
  );
};

export default AppRPanel;
