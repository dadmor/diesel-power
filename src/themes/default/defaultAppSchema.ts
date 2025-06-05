export const DEFAULT_APP_SCHEMA = {
    "id": "helpdesk-system",
    "name": "System Helpdesk",
    "slug": "helpdesk",
    "description": "Kompleksowy system zarządzania zgłoszeniami i obsługi klienta",
    "version": "1.0.0",
    "created_at": "2024-06-05T10:00:00Z",
    "navigation": {
        "main": [
            {
                "id": "dashboard",
                "label": "Dashboard",
                "icon": "📊",
                "path": "/"
            },
            {
                "id": "tickets",
                "label": "Zgłoszenia",
                "icon": "🎫",
                "path": "/tickets"
            },
            {
                "id": "users",
                "label": "Użytkownicy",
                "icon": "👥",
                "path": "/users"
            },
            {
                "id": "categories",
                "label": "Kategorie",
                "icon": "📂",
                "path": "/categories"
            },
            {
                "id": "reports",
                "label": "Raporty",
                "icon": "📈",
                "path": "/reports"
            }
        ]
    },
    "pages": {
        "dashboard": {
            "title": "Dashboard",
            "subtitle": "Przegląd systemu helpdesk",
            "widgets": [
                {
                    "type": "stats",
                    "title": "Statystyki",
                    "data": "tickets_stats"
                },
                {
                    "type": "chart",
                    "title": "Zgłoszenia w czasie",
                    "data": "tickets_timeline"
                },
                {
                    "type": "recent",
                    "title": "Ostatnie zgłoszenia",
                    "data": "recent_tickets"
                }
            ]
        },
        "tickets": {
            "title": "Zgłoszenia",
            "subtitle": "Zarządzanie zgłoszeniami klientów",
            "actions": [
                "create",
                "edit",
                "delete",
                "assign",
                "close"
            ],
            "filters": [
                "status",
                "priority",
                "category",
                "assigned_to"
            ],
            "columns": [
                "id",
                "title",
                "status",
                "priority",
                "assigned_to",
                "created_at"
            ]
        },
        "users": {
            "title": "Użytkownicy",
            "subtitle": "Zarządzanie użytkownikami systemu",
            "actions": [
                "create",
                "edit",
                "delete",
                "activate",
                "deactivate"
            ],
            "filters": [
                "role",
                "active",
                "department"
            ],
            "columns": [
                "id",
                "full_name",
                "email",
                "role",
                "active",
                "last_login"
            ]
        }
    },
    "schema": {
        "tables": [
            {
                "name": "users",
                "label": "Użytkownicy",
                "fields": [
                    {
                        "name": "email",
                        "type": "email",
                        "required": true,
                        "label": "Email"
                    },
                    {
                        "name": "full_name",
                        "type": "string",
                        "required": true,
                        "label": "Imię i nazwisko"
                    },
                    {
                        "name": "role",
                        "type": "select:admin,agent,customer",
                        "required": true,
                        "label": "Rola"
                    },
                    {
                        "name": "department",
                        "type": "string",
                        "label": "Dział"
                    },
                    {
                        "name": "phone",
                        "type": "string",
                        "label": "Telefon"
                    },
                    {
                        "name": "active",
                        "type": "boolean",
                        "default": true,
                        "label": "Aktywny"
                    },
                    {
                        "name": "last_login",
                        "type": "datetime",
                        "label": "Ostatnie logowanie"
                    }
                ]
            },
            {
                "name": "categories",
                "label": "Kategorie",
                "fields": [
                    {
                        "name": "name",
                        "type": "string",
                        "required": true,
                        "label": "Nazwa"
                    },
                    {
                        "name": "description",
                        "type": "text",
                        "label": "Opis"
                    },
                    {
                        "name": "color",
                        "type": "color",
                        "default": "#3B82F6",
                        "label": "Kolor"
                    },
                    {
                        "name": "active",
                        "type": "boolean",
                        "default": true,
                        "label": "Aktywna"
                    }
                ]
            },
            {
                "name": "tickets",
                "label": "Zgłoszenia",
                "fields": [
                    {
                        "name": "title",
                        "type": "string",
                        "required": true,
                        "label": "Tytuł"
                    },
                    {
                        "name": "description",
                        "type": "text",
                        "required": true,
                        "label": "Opis"
                    },
                    {
                        "name": "status",
                        "type": "select:open,in_progress,waiting,resolved,closed",
                        "default": "open",
                        "label": "Status"
                    },
                    {
                        "name": "priority",
                        "type": "select:low,normal,high,urgent",
                        "default": "normal",
                        "label": "Priorytet"
                    },
                    {
                        "name": "category_id",
                        "type": "relation",
                        "table": "categories",
                        "label": "Kategoria"
                    },
                    {
                        "name": "assigned_to",
                        "type": "relation",
                        "table": "users",
                        "label": "Przypisane do"
                    },
                    {
                        "name": "created_by",
                        "type": "relation",
                        "table": "users",
                        "required": true,
                        "label": "Utworzone przez"
                    },
                    {
                        "name": "due_date",
                        "type": "date",
                        "label": "Termin realizacji"
                    },
                    {
                        "name": "resolution",
                        "type": "text",
                        "label": "Rozwiązanie"
                    }
                ]
            },
            {
                "name": "comments",
                "label": "Komentarze",
                "fields": [
                    {
                        "name": "content",
                        "type": "text",
                        "required": true,
                        "label": "Treść"
                    },
                    {
                        "name": "ticket_id",
                        "type": "relation",
                        "table": "tickets",
                        "required": true,
                        "label": "Zgłoszenie"
                    },
                    {
                        "name": "author_id",
                        "type": "relation",
                        "table": "users",
                        "required": true,
                        "label": "Autor"
                    },
                    {
                        "name": "is_internal",
                        "type": "boolean",
                        "default": false,
                        "label": "Komentarz wewnętrzny"
                    },
                    {
                        "name": "attachments",
                        "type": "json",
                        "label": "Załączniki"
                    }
                ]
            },
            {
                "name": "attachments",
                "label": "Załączniki",
                "fields": [
                    {
                        "name": "filename",
                        "type": "string",
                        "required": true,
                        "label": "Nazwa pliku"
                    },
                    {
                        "name": "file_url",
                        "type": "url",
                        "required": true,
                        "label": "URL pliku"
                    },
                    {
                        "name": "file_size",
                        "type": "number",
                        "label": "Rozmiar pliku"
                    },
                    {
                        "name": "mime_type",
                        "type": "string",
                        "label": "Typ MIME"
                    },
                    {
                        "name": "ticket_id",
                        "type": "relation",
                        "table": "tickets",
                        "label": "Zgłoszenie"
                    },
                    {
                        "name": "uploaded_by",
                        "type": "relation",
                        "table": "users",
                        "required": true,
                        "label": "Przesłane przez"
                    }
                ]
            }
        ],
        "relations": [
            {
                "from": "tickets",
                "to": "categories",
                "type": "many-to-one",
                "field": "category_id"
            },
            {
                "from": "tickets",
                "to": "users",
                "type": "many-to-one",
                "field": "assigned_to"
            },
            {
                "from": "tickets",
                "to": "users",
                "type": "many-to-one",
                "field": "created_by"
            },
            {
                "from": "comments",
                "to": "tickets",
                "type": "many-to-one",
                "field": "ticket_id"
            },
            {
                "from": "comments",
                "to": "users",
                "type": "many-to-one",
                "field": "author_id"
            },
            {
                "from": "attachments",
                "to": "tickets",
                "type": "many-to-one",
                "field": "ticket_id"
            },
            {
                "from": "attachments",
                "to": "users",
                "type": "many-to-one",
                "field": "uploaded_by"
            }
        ]
    },
    "permissions": {
        "admin": {
            "tables": "*",
            "actions": "*"
        },
        "agent": {
            "tables": [
                "tickets",
                "comments",
                "attachments",
                "categories"
            ],
            "actions": [
                "read",
                "create",
                "update"
            ],
            "restrictions": {
                "users": {
                    "actions": [
                        "read"
                    ],
                    "filter": "role != 'admin'"
                }
            }
        },
        "customer": {
            "tables": [
                "tickets",
                "comments",
                "attachments"
            ],
            "actions": [
                "read",
                "create"
            ],
            "restrictions": {
                "tickets": {
                    "filter": "created_by = current_user.id"
                },
                "comments": {
                    "filter": "ticket.created_by = current_user.id"
                }
            }
        }
    },
    "settings": {
        "theme": {
            "primaryColor": "#3B82F6",
            "secondaryColor": "#6B7280",
            "accentColor": "#10B981"
        },
        "features": {
            "emailNotifications": true,
            "fileUploads": true,
            "timeTracking": false,
            "customFields": true
        },
        "limits": {
            "maxFileSize": "10MB",
            "maxAttachments": 5,
            "ticketAutoClose": 30
        }
    }
}