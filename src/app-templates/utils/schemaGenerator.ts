// src/app-templates/utils/schemaGenerator.ts
// Generator schematów aplikacji do zapisu w bazie danych

export interface AppSchema {
    version: string;
    template: string;
    navigation: {
      main: NavigationItem[];
      admin?: NavigationItem[];
      supervisor?: NavigationItem[];
    };
    pages: Record<string, PageDefinition>;
    permissions: Record<string, RolePermissions>;
    settings: AppSettings;
    tables: TableDefinition[];
  }
  
  export interface NavigationItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    roles: string[];
    category?: string;
  }
  
  export interface PageDefinition {
    title: string;
    subtitle?: string;
    type: 'dashboard' | 'table' | 'form' | 'custom';
    table?: string;
    layout: 'default' | 'wide' | 'narrow';
    widgets?: WidgetDefinition[];
    actions?: string[];
    filters?: FilterDefinition[];
  }
  
  export interface WidgetDefinition {
    id: string;
    type: 'stats' | 'chart' | 'table' | 'recent' | 'custom';
    title: string;
    size: 'sm' | 'md' | 'lg' | 'full';
    config: Record<string, any>;
    dataSource?: string;
    refreshInterval?: number;
  }
  
  export interface FilterDefinition {
    field: string;
    type: 'text' | 'select' | 'date' | 'boolean' | 'number';
    label: string;
    options?: string[];
    defaultValue?: any;
  }
  
  export interface RolePermissions {
    tables: string[] | '*';
    actions: string[] | '*';
    restrictions?: Record<string, any>;
    customPermissions?: string[];
  }
  
  export interface AppSettings {
    theme: {
      primaryColor: string;
      secondaryColor: string;
      logoUrl?: string;
    };
    features: {
      notifications: boolean;
      fileUpload: boolean;
      export: boolean;
      audit: boolean;
    };
    limits: {
      recordsPerPage: number;
      maxFileSize: string;
      sessionTimeout: number;
    };
  }
  
  export interface TableDefinition {
    name: string;
    label: string;
    icon: string;
    description?: string;
    columns: ColumnDefinition[];
    relations?: RelationDefinition[];
    indexes?: IndexDefinition[];
    triggers?: TriggerDefinition[];
  }
  
  export interface ColumnDefinition {
    name: string;
    type: 'text' | 'integer' | 'boolean' | 'timestamp' | 'json';
    label: string;
    required: boolean;
    unique?: boolean;
    defaultValue?: any;
    enum?: string[];
    validation?: ValidationRule[];
    display?: DisplayOptions;
  }
  
  export interface RelationDefinition {
    type: 'one-to-many' | 'many-to-one' | 'many-to-many';
    table: string;
    column: string;
    foreignKey: string;
    onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  }
  
  export interface IndexDefinition {
    name: string;
    columns: string[];
    unique: boolean;
    type?: 'btree' | 'hash' | 'gin' | 'gist';
  }
  
  export interface TriggerDefinition {
    name: string;
    event: 'INSERT' | 'UPDATE' | 'DELETE';
    timing: 'BEFORE' | 'AFTER';
    function: string;
  }
  
  export interface ValidationRule {
    type: 'minLength' | 'maxLength' | 'pattern' | 'range' | 'custom';
    value: any;
    message: string;
  }
  
  export interface DisplayOptions {
    widget: 'input' | 'textarea' | 'select' | 'checkbox' | 'date' | 'file';
    placeholder?: string;
    helpText?: string;
    hidden?: boolean;
    readonly?: boolean;
  }
  
  // Predefiniowane szablony aplikacji
  export const APP_TEMPLATES = {
    helpdesk: generateHelpdeskSchema,
    crm: generateCRMSchema,
    ecommerce: generateECommerceSchema,
    blog: generateBlogSchema,
    inventory: generateInventorySchema
  };
  
  // Generator schematu Helpdesk
  export function generateHelpdeskSchema(): AppSchema {
    return {
      version: '1.0.0',
      template: 'helpdesk',
      navigation: {
        main: [
          { id: 'home', label: 'Dashboard', icon: '🏠', path: '/home', roles: ['admin', 'agent', 'customer'] },
          { id: 'tickets', label: 'Zgłoszenia', icon: '🎫', path: '/tickets', roles: ['admin', 'agent', 'customer'] },
          { id: 'users', label: 'Użytkownicy', icon: '👥', path: '/users', roles: ['admin', 'agent'] },
          { id: 'categories', label: 'Kategorie', icon: '📂', path: '/categories', roles: ['admin', 'agent'] }
        ],
        admin: [
          { id: 'admin-tickets', label: 'Zarządzanie zgłoszeniami', icon: '⚙️', path: '/admin/tickets', roles: ['admin'] },
          { id: 'admin-users', label: 'Zarządzanie użytkownikami', icon: '👨‍💼', path: '/admin/users', roles: ['admin'] }
        ]
      },
      pages: {
        '/home': {
          title: 'Dashboard Helpdesk',
          subtitle: 'Przegląd systemu wsparcia',
          type: 'dashboard',
          layout: 'default',
          widgets: [
            {
              id: 'stats-overview',
              type: 'stats',
              title: 'Statystyki',
              size: 'full',
              config: {
                metrics: ['total_tickets', 'open_tickets', 'resolved_tickets', 'avg_resolution_time']
              }
            },
            {
              id: 'recent-tickets',
              type: 'recent',
              title: 'Ostatnie zgłoszenia',
              size: 'lg',
              config: { table: 'tickets', limit: 10 },
              dataSource: 'tickets'
            },
            {
              id: 'tickets-chart',
              type: 'chart',
              title: 'Zgłoszenia w czasie',
              size: 'md',
              config: { type: 'line', period: '30d' }
            }
          ]
        },
        '/tickets': {
          title: 'Zgłoszenia',
          subtitle: 'Zarządzanie zgłoszeniami klientów',
          type: 'table',
          table: 'tickets',
          layout: 'default',
          actions: ['create', 'edit', 'assign', 'close'],
          filters: [
            { field: 'status', type: 'select', label: 'Status', options: ['open', 'in_progress', 'resolved', 'closed'] },
            { field: 'priority', type: 'select', label: 'Priorytet', options: ['low', 'normal', 'high', 'urgent'] },
            { field: 'title', type: 'text', label: 'Tytuł' }
          ]
        },
        '/users': {
          title: 'Użytkownicy',
          subtitle: 'Zarządzanie użytkownikami systemu',
          type: 'table',
          table: 'users',
          layout: 'default',
          actions: ['create', 'edit', 'activate', 'deactivate'],
          filters: [
            { field: 'role', type: 'select', label: 'Rola', options: ['admin', 'agent', 'customer'] },
            { field: 'active', type: 'boolean', label: 'Aktywny' }
          ]
        }
      },
      permissions: {
        admin: {
          tables: '*',
          actions: '*'
        },
        agent: {
          tables: ['tickets', 'comments', 'categories'],
          actions: ['read', 'create', 'update', 'assign'],
          restrictions: {
            users: { actions: ['read'], filter: 'role != \'admin\'' }
          }
        },
        customer: {
          tables: ['tickets', 'comments'],
          actions: ['read', 'create'],
          restrictions: {
            tickets: { filter: 'created_by = current_user.id' },
            comments: { filter: 'ticket.created_by = current_user.id' }
          }
        }
      },
      settings: {
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#6B7280'
        },
        features: {
          notifications: true,
          fileUpload: true,
          export: true,
          audit: true
        },
        limits: {
          recordsPerPage: 25,
          maxFileSize: '10MB',
          sessionTimeout: 3600
        }
      },
      tables: [
        {
          name: 'users',
          label: 'Użytkownicy',
          icon: '👥',
          description: 'Użytkownicy systemu helpdesk',
          columns: [
            {
              name: 'email',
              type: 'text',
              label: 'Email',
              required: true,
              unique: true,
              validation: [
                { type: 'pattern', value: '^[^@]+@[^@]+\\.[^@]+$', message: 'Nieprawidłowy format email' }
              ],
              display: { widget: 'input', placeholder: 'Wpisz adres email' }
            },
            {
              name: 'full_name',
              type: 'text',
              label: 'Imię i nazwisko',
              required: true,
              validation: [
                { type: 'minLength', value: 2, message: 'Minimum 2 znaki' }
              ],
              display: { widget: 'input', placeholder: 'Imię i nazwisko' }
            },
            {
              name: 'role',
              type: 'text',
              label: 'Rola',
              required: true,
              enum: ['admin', 'agent', 'customer'],
              defaultValue: 'customer',
              display: { widget: 'select' }
            },
            {
              name: 'department',
              type: 'text',
              label: 'Dział',
              required: false,
              display: { widget: 'input', placeholder: 'Nazwa działu' }
            },
            {
              name: 'active',
              type: 'boolean',
              label: 'Aktywny',
              required: true,
              defaultValue: true,
              display: { widget: 'checkbox' }
            },
            {
              name: 'last_login',
              type: 'timestamp',
              label: 'Ostatnie logowanie',
              required: false,
              display: { widget: 'date', readonly: true }
            }
          ]
        },
        {
          name: 'categories',
          label: 'Kategorie',
          icon: '📂',
          description: 'Kategorie zgłoszeń',
          columns: [
            {
              name: 'name',
              type: 'text',
              label: 'Nazwa',
              required: true,
              unique: true,
              display: { widget: 'input', placeholder: 'Nazwa kategorii' }
            },
            {
              name: 'description',
              type: 'text',
              label: 'Opis',
              required: false,
              display: { widget: 'textarea', placeholder: 'Opis kategorii' }
            },
            {
              name: 'color',
              type: 'text',
              label: 'Kolor',
              required: false,
              defaultValue: '#3B82F6',
              validation: [
                { type: 'pattern', value: '^#[0-9A-Fa-f]{6}$', message: 'Nieprawidłowy format koloru' }
              ],
              display: { widget: 'input', placeholder: '#FFFFFF' }
            },
            {
              name: 'active',
              type: 'boolean',
              label: 'Aktywna',
              required: true,
              defaultValue: true,
              display: { widget: 'checkbox' }
            }
          ]
        },
        {
          name: 'tickets',
          label: 'Zgłoszenia',
          icon: '🎫',
          description: 'Zgłoszenia użytkowników',
          columns: [
            {
              name: 'title',
              type: 'text',
              label: 'Tytuł',
              required: true,
              validation: [
                { type: 'minLength', value: 5, message: 'Minimum 5 znaków' },
                { type: 'maxLength', value: 200, message: 'Maksimum 200 znaków' }
              ],
              display: { widget: 'input', placeholder: 'Tytuł zgłoszenia' }
            },
            {
              name: 'description',
              type: 'text',
              label: 'Opis',
              required: true,
              validation: [
                { type: 'minLength', value: 10, message: 'Minimum 10 znaków' }
              ],
              display: { widget: 'textarea', placeholder: 'Szczegółowy opis problemu' }
            },
            {
              name: 'status',
              type: 'text',
              label: 'Status',
              required: true,
              enum: ['open', 'in_progress', 'waiting', 'resolved', 'closed'],
              defaultValue: 'open',
              display: { widget: 'select' }
            },
            {
              name: 'priority',
              type: 'text',
              label: 'Priorytet',
              required: true,
              enum: ['low', 'normal', 'high', 'urgent'],
              defaultValue: 'normal',
              display: { widget: 'select' }
            },
            {
              name: 'category_id',
              type: 'integer',
              label: 'Kategoria',
              required: false,
              display: { widget: 'select' }
            },
            {
              name: 'assigned_to',
              type: 'integer',
              label: 'Przypisane do',
              required: false,
              display: { widget: 'select' }
            },
            {
              name: 'created_by',
              type: 'integer',
              label: 'Utworzone przez',
              required: true,
              display: { widget: 'select', readonly: true }
            },
            {
              name: 'due_date',
              type: 'timestamp',
              label: 'Termin realizacji',
              required: false,
              display: { widget: 'date' }
            },
            {
              name: 'resolution',
              type: 'text',
              label: 'Rozwiązanie',
              required: false,
              display: { widget: 'textarea', placeholder: 'Opis rozwiązania' }
            }
          ],
          relations: [
            {
              type: 'many-to-one',
              table: 'categories',
              column: 'category_id',
              foreignKey: 'id',
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE'
            },
            {
              type: 'many-to-one',
              table: 'users',
              column: 'assigned_to',
              foreignKey: 'id',
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE'
            },
            {
              type: 'many-to-one',
              table: 'users',
              column: 'created_by',
              foreignKey: 'id',
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            }
          ],
          indexes: [
            { name: 'idx_tickets_status', columns: ['status'], unique: false },
            { name: 'idx_tickets_priority', columns: ['priority'], unique: false },
            { name: 'idx_tickets_created_by', columns: ['created_by'], unique: false }
          ]
        },
        {
          name: 'comments',
          label: 'Komentarze',
          icon: '💬',
          description: 'Komentarze do zgłoszeń',
          columns: [
            {
              name: 'content',
              type: 'text',
              label: 'Treść',
              required: true,
              validation: [
                { type: 'minLength', value: 1, message: 'Komentarz nie może być pusty' }
              ],
              display: { widget: 'textarea', placeholder: 'Treść komentarza' }
            },
            {
              name: 'ticket_id',
              type: 'integer',
              label: 'Zgłoszenie',
              required: true,
              display: { widget: 'select', readonly: true }
            },
            {
              name: 'author_id',
              type: 'integer',
              label: 'Autor',
              required: true,
              display: { widget: 'select', readonly: true }
            },
            {
              name: 'is_internal',
              type: 'boolean',
              label: 'Komentarz wewnętrzny',
              required: true,
              defaultValue: false,
              display: { widget: 'checkbox', helpText: 'Niewidoczny dla klientów' }
            }
          ],
          relations: [
            {
              type: 'many-to-one',
              table: 'tickets',
              column: 'ticket_id',
              foreignKey: 'id',
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            },
            {
              type: 'many-to-one',
              table: 'users',
              column: 'author_id',
              foreignKey: 'id',
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            }
          ]
        }
      ]
    };
  }
  
  // Generator schematu CRM
  export function generateCRMSchema(): AppSchema {
    return {
      version: '1.0.0',
      template: 'crm',
      navigation: {
        main: [
          { id: 'home', label: 'Dashboard', icon: '🏠', path: '/home', roles: ['admin', 'sales', 'manager'] },
          { id: 'customers', label: 'Klienci', icon: '🏢', path: '/customers', roles: ['admin', 'sales', 'manager'] },
          { id: 'deals', label: 'Okazje', icon: '💰', path: '/deals', roles: ['admin', 'sales', 'manager'] },
          { id: 'activities', label: 'Aktywności', icon: '📅', path: '/activities', roles: ['admin', 'sales', 'manager'] }
        ]
      },
      pages: {
        '/home': {
          title: 'CRM Dashboard',
          subtitle: 'Przegląd sprzedaży',
          type: 'dashboard',
          layout: 'default',
          widgets: [
            {
              id: 'sales-stats',
              type: 'stats',
              title: 'Statystyki sprzedaży',
              size: 'full',
              config: { metrics: ['total_deals', 'won_deals', 'revenue', 'conversion_rate'] }
            }
          ]
        }
      },
      permissions: {
        admin: { tables: '*', actions: '*' },
        manager: { tables: ['customers', 'deals', 'activities'], actions: ['read', 'create', 'update', 'delete'] },
        sales: { tables: ['customers', 'deals', 'activities'], actions: ['read', 'create', 'update'] }
      },
      settings: {
        theme: { primaryColor: '#10B981', secondaryColor: '#6B7280' },
        features: { notifications: true, fileUpload: true, export: true, audit: false },
        limits: { recordsPerPage: 20, maxFileSize: '5MB', sessionTimeout: 7200 }
      },
      tables: [
        {
          name: 'customers',
          label: 'Klienci',
          icon: '🏢',
          columns: [
            { name: 'name', type: 'text', label: 'Nazwa', required: true, display: { widget: 'input' } },
            { name: 'email', type: 'text', label: 'Email', required: true, display: { widget: 'input' } },
            { name: 'phone', type: 'text', label: 'Telefon', required: false, display: { widget: 'input' } },
            { name: 'company', type: 'text', label: 'Firma', required: false, display: { widget: 'input' } },
            { name: 'industry', type: 'text', label: 'Branża', required: false, enum: ['IT', 'Finance', 'Healthcare', 'Manufacturing', 'Other'], display: { widget: 'select' } }
          ]
        },
        {
          name: 'deals',
          label: 'Okazje',
          icon: '💰',
          columns: [
            { name: 'title', type: 'text', label: 'Tytuł', required: true, display: { widget: 'input' } },
            { name: 'amount', type: 'integer', label: 'Wartość', required: true, display: { widget: 'input' } },
            { name: 'stage', type: 'text', label: 'Etap', required: true, enum: ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'], display: { widget: 'select' } },
            { name: 'probability', type: 'integer', label: 'Prawdopodobieństwo (%)', required: false, display: { widget: 'input' } },
            { name: 'customer_id', type: 'integer', label: 'Klient', required: true, display: { widget: 'select' } },
            { name: 'owner_id', type: 'integer', label: 'Właściciel', required: true, display: { widget: 'select' } },
            { name: 'close_date', type: 'timestamp', label: 'Data zamknięcia', required: false, display: { widget: 'date' } }
          ],
          relations: [
            { type: 'many-to-one', table: 'customers', column: 'customer_id', foreignKey: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }
          ]
        }
      ]
    };
  }
  
  // Pozostałe generatory (szkielety)
  export function generateECommerceSchema(): AppSchema {
    return {
      version: '1.0.0',
      template: 'ecommerce',
      navigation: { main: [] },
      pages: {},
      permissions: {},
      settings: {
        theme: { primaryColor: '#8B5CF6', secondaryColor: '#6B7280' },
        features: { notifications: true, fileUpload: true, export: true, audit: true },
        limits: { recordsPerPage: 24, maxFileSize: '20MB', sessionTimeout: 3600 }
      },
      tables: []
    };
  }
  
  export function generateBlogSchema(): AppSchema {
    return {
      version: '1.0.0',
      template: 'blog',
      navigation: { main: [] },
      pages: {},
      permissions: {},
      settings: {
        theme: { primaryColor: '#F59E0B', secondaryColor: '#6B7280' },
        features: { notifications: false, fileUpload: true, export: true, audit: false },
        limits: { recordsPerPage: 10, maxFileSize: '50MB', sessionTimeout: 7200 }
      },
      tables: []
    };
  }
  
  export function generateInventorySchema(): AppSchema {
    return {
      version: '1.0.0',
      template: 'inventory',
      navigation: { main: [] },
      pages: {},
      permissions: {},
      settings: {
        theme: { primaryColor: '#EF4444', secondaryColor: '#6B7280' },
        features: { notifications: true, fileUpload: false, export: true, audit: true },
        limits: { recordsPerPage: 50, maxFileSize: '1MB', sessionTimeout: 1800 }
      },
      tables: []
    };
  }
  
  // Funkcja główna do generowania schematu
  export function generateAppFromSchema(templateName: string, customConfig?: Partial<AppSchema>): AppSchema {
    const generator = APP_TEMPLATES[templateName as keyof typeof APP_TEMPLATES];
    
    if (!generator) {
      throw new Error(`Nieznany szablon: ${templateName}`);
    }
    
    const baseSchema = generator();
    
    // Merge z custom config jeśli podano
    if (customConfig) {
      return {
        ...baseSchema,
        ...customConfig,
        settings: { ...baseSchema.settings, ...customConfig.settings },
        permissions: { ...baseSchema.permissions, ...customConfig.permissions }
      };
    }
    
    return baseSchema;
  }
  
  // Funkcja do konwersji ze starego formatu (vendor_apps) do nowego
  export function convertLegacySchema(legacySchema: any): AppSchema {
    const template = detectTemplate(legacySchema.tables);
    const baseSchema = generateAppFromSchema(template);
    
    // Konwertuj tabele ze starego formatu
    baseSchema.tables = legacySchema.tables.map((table: any) => ({
      name: table.name,
      label: table.name.charAt(0).toUpperCase() + table.name.slice(1),
      icon: getTableIcon(table.name),
      columns: table.columns.map((col: any) => ({
        name: col.name,
        type: mapColumnType(col.type),
        label: col.name.charAt(0).toUpperCase() + col.name.slice(1),
        required: col.required || false,
        enum: col.enum,
        display: { widget: getWidgetType(col.type, col.enum) }
      }))
    }));
    
    return baseSchema;
  }
  
  // Funkcje pomocnicze
  function detectTemplate(tables: any[]): string {
    const tableNames = tables.map(t => t.name.toLowerCase());
    
    if (tableNames.includes('tickets') && tableNames.includes('users')) return 'helpdesk';
    if (tableNames.includes('customers') && tableNames.includes('deals')) return 'crm';
    if (tableNames.includes('products') && tableNames.includes('orders')) return 'ecommerce';
    
    return 'helpdesk'; // domyślny
  }
  
  function mapColumnType(oldType: string): 'text' | 'integer' | 'boolean' | 'timestamp' | 'json' {
    switch (oldType) {
      case 'text': return 'text';
      case 'integer': return 'integer';
      case 'boolean': return 'boolean';
      case 'timestamp': return 'timestamp';
      default: return 'text';
    }
  }
  
  function getWidgetType(type: string, hasEnum?: string[]): string {
    if (hasEnum) return 'select';
    switch (type) {
      case 'boolean': return 'checkbox';
      case 'timestamp': return 'date';
      case 'text': return 'textarea';
      default: return 'input';
    }
  }
  
  function getTableIcon(tableName: string): string {
    const iconMap: Record<string, string> = {
      'users': '👥', 'tickets': '🎫', 'comments': '💬', 'categories': '📂',
      'customers': '🏢', 'deals': '💰', 'products': '📦', 'orders': '🛒'
    };
    return iconMap[tableName] || '📋';
  }