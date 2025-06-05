// src/app-templates/README.md
/*
# System Dynamicznych Aplikacji Vendorów

## Struktura folderów:

```
src/app-templates/
├── index.ts                    # Główny eksport
├── DynamicVendorApp.tsx       # Główny komponent aplikacji
├── AppRouter.tsx              # Router aplikacji
├── auth/
│   └── LoginScreen.tsx        # Ekran logowania
├── layout/
│   ├── AppLayout.tsx          # Layout aplikacji
│   ├── AppHeader.tsx          # Header
│   └── AppSidebar.tsx         # Sidebar z nawigacją
├── pages/
│   ├── HomePage.tsx           # Strona główna/dashboard
│   └── TablePage.tsx          # Strona tabeli z CRUD
├── widgets/
│   ├── StatsWidget.tsx        # Widget statystyk
│   ├── RecentItemsWidget.tsx  # Widget ostatnich elementów
│   ├── DataTable.tsx          # Tabela danych
│   ├── TableActions.tsx       # Akcje dla tabeli
│   └── TableFilters.tsx       # Filtry tabeli
├── services/
│   └── VendorAppService.ts    # Serwis komunikacji z bazą
├── hooks/
│   └── useVendorApp.ts        # Hook zarządzania stanem
├── utils/
│   ├── routeGenerator.ts      # Generowanie ścieżek
│   └── permissions.ts         # Zarządzanie uprawnieniami
└── ui/
    ├── LoadingScreen.tsx      # Ekran ładowania
    └── ErrorScreen.tsx        # Ekran błędu
```

## Jak używać:

### 1. Podstawowe użycie:
```tsx
import { DynamicVendorApp } from './app-templates';

// W głównej aplikacji
<DynamicVendorApp 
  vendorSlug="helpdesk"
  initialPath="/home"
/>
```

### 2. Routing URL:
```tsx
// Automatyczne wykrycie z URL
const vendorSlug = window.location.pathname.split('/')[1];
const currentPath = window.location.pathname.replace(`/${vendorSlug}`, '') || '/home';

<DynamicVendorApp 
  vendorSlug={vendorSlug}
  initialPath={currentPath}
/>
```

### 3. Przykładowe ścieżki:
- `/helpdesk/home` - Dashboard aplikacji helpdesk
- `/helpdesk/tickets` - Lista zgłoszeń
- `/helpdesk/users` - Lista użytkowników  
- `/helpdesk/admin/tickets` - Widok administratora zgłoszeń
- `/helpdesk/supervisor/users` - Widok supervisora użytkowników

## Automatyczne generowanie:

### Ścieżki na podstawie schematu:
```typescript
// Dla każdej tabeli w schemacie automatycznie tworzone są:
- /{table_name}           # Standardowy widok
- /admin/{table_name}     # Widok administratora  
- /supervisor/{table_name} # Widok supervisora
```

### Uprawnienia na podstawie ról:
- **customer**: może tworzyć i widzieć tylko swoje rekordy
- **agent**: może tworzyć, edytować i przypisywać
- **supervisor**: dodatkowo może zatwierdzać i eksportować
- **admin**: pełne uprawnienia + import/bulk edit

### Automatyczne wykrycie pól:
- Pola typu `boolean` → checkbox'y i ikony ✅/❌
- Pola typu `timestamp` → formatowanie dat
- Pola z `enum` → selecty w filtrach
- Pola `*_id` → automatyczne wykrycie relacji

## Integracja z bazą danych:

System automatycznie używa `execVendorSQL()` do bezpiecznego wykonywania zapytań z prefixem vendora.

Wszystkie tabele mają automatycznie dodawane:
- `vendor_slug` - identyfikator vendora
- `created_at` - data utworzenia  
- `updated_at` - data aktualizacji
- RLS policies ograniczające dostęp do danych vendora
*/