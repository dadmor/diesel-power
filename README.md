# Multi-Vendor Application Generator

Aplikacja do automatycznego generowania kompletnych aplikacji CRUD dla różnych vendorów/klientów poprzez konwersację z AI.

## 🚀 Jak to działa

1. **Opisujesz potrzeby** w prosty sposób: *"Potrzebuję sklep online"*
2. **AI analizuje** i generuje schemat aplikacji
3. **System automatycznie tworzy** tabele w bazie danych i interfejs CRUD
4. **Gotowa aplikacja** jest dostępna pod unikalnym URL-em

## 🛠️ Stack techniczny

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Google Gemini AI
- **Database**: Supabase (PostgreSQL)
- **Routing**: React Router v6

## 📋 Wymagania

- Node.js 18+
- Konto Supabase (darmowe)
- Google AI Studio API key (darmowy)

## ⚙️ Instalacja i konfiguracja

### 1. Sklonuj repozytorium
```bash
git clone <repository-url>
cd multi-vendor-generator
```

### 2. Zainstaluj dependencje
```bash
# Frontend
npm install

# Backend (w osobnym terminalu)
cd backend  # lub gdzie masz server.js
npm install express cors @google/generative-ai dotenv
```

### 3. Konfiguracja Supabase

#### A. Utwórz projekt w Supabase
1. Wejdź na [supabase.com](https://supabase.com)
2. Utwórz nowy projekt
3. Skopiuj `URL` i `anon key` z Settings → API

#### B. Wykonaj setup bazy danych
W Supabase Dashboard → SQL Editor wykonaj:

```sql
-- Funkcja do dynamicznego tworzenia tabel
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$ 
BEGIN 
  EXECUTE sql; 
  RETURN 'OK';
EXCEPTION 
  WHEN OTHERS THEN 
    RETURN SQLERRM; 
END; 
$$;

-- Tabela vendorów
CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  schema JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### C. Skonfiguruj zmienne środowiskowe
Utwórz `.env` w root folderze:
```env
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=twoj-anon-key
```

### 4. Konfiguracja Google AI

#### A. Pobierz API key
1. Wejdź na [aistudio.google.com](https://aistudio.google.com)
2. Utwórz nowy API key
3. Skopiuj klucz

#### B. Konfiguracja backend
Utwórz `.env` w folderze backend:
```env
GEMINI_API_KEY=twoj-google-ai-key
PORT=3001
```

## 🚀 Uruchomienie

### 1. Uruchom backend (terminal 1)
```bash
cd backend
node server.js
```
Powinno pokazać:
```
🚀 Server running on http://localhost:3001
📡 CORS enabled for http://localhost:5173
🤖 Gemini API ✅ configured
```

### 2. Uruchom frontend (terminal 2)
```bash
npm run dev
```
Aplikacja będzie dostępna na `http://localhost:5173`

## 📖 Użytkowanie

### 1. Generowanie aplikacji
1. Otwórz `http://localhost:5173`
2. W chat wpisz opis potrzeb, np.:
   - *"Potrzebuję sklep online z produktami i zamówieniami"*
   - *"CRM do zarządzania klientami i kontaktami"*
   - *"System zarządzania projektami i zadaniami"*

### 2. AI wygeneruje aplikację
System automatycznie:
- Przeanalizuje Twoje potrzeby
- Wygeneruje schemat bazy danych
- Utworzy tabele w Supabase
- Udostępni aplikację pod unikalnym URL

### 3. Dostęp do aplikacji
Po utworzeniu aplikacja będzie dostępna pod:
```
http://localhost:5173/nazwa-aplikacji
```

## 🎯 Przykłady użycia

### E-commerce
```
Input: "Potrzebuję sklep internetowy"
Output: Aplikacja z produktami, kategoriami, zamówieniami
URL: /ecommerce
```

### CRM
```
Input: "System CRM dla mojej firmy"
Output: Aplikacja z klientami, kontaktami, notatkami
URL: /crm-system
```

### Zarządzanie projektami
```
Input: "Narzędzie do projektów i zadań"
Output: Aplikacja z projektami, zadaniami, statusami
URL: /project-manager
```

## 🔧 Schemat pól

System obsługuje następujące typy pól:

- `string` - krótki tekst
- `text` - długi tekst (textarea)
- `number` - liczby
- `date` - daty
- `boolean` - true/false
- `select:opcja1,opcja2` - lista wyboru

## 📁 Struktura projektu

```
src/
├── components/
│   ├── Chat.tsx              # Interface chatu z AI
│   ├── ConnectionChecker.tsx  # Sprawdzanie połączenia z bazą
│   └── vendor/
│       ├── VendorApp.tsx     # Layout aplikacji vendora
│       ├── VendorList.tsx    # Lista rekordów (CRUD)
│       └── VendorForm.tsx    # Formularz dodawania/edycji
├── lib/
│   ├── generator.ts          # Parser schema i generator tabel
│   └── supabase.ts          # Klient Supabase
├── types/
│   └── index.ts             # Definicje TypeScript
└── App.tsx                  # Routing i layout główny
```

## 🛡️ Bezpieczeństwo

- Tabele są prefiksowane slug-iem vendora (`vendor_products`)
- Brak RLS - proste prefiksowanie dla izolacji
- Funkcja `exec_sql` ma `SECURITY DEFINER` - wykonuje się z uprawnieniami właściciela

## 🐛 Troubleshooting

### Problem: "Could not find function exec_sql"
**Rozwiązanie**: Wykonaj SQL setup w Supabase Dashboard (punkt 3.B)

### Problem: "404 Not Found" na vendors table
**Rozwiązanie**: Wykonaj CREATE TABLE vendors (punkt 3.B)

### Problem: Backend niedostępny
**Rozwiązanie**: 
1. Sprawdź czy backend działa na porcie 3001
2. Sprawdź zmienną `GEMINI_API_KEY` w .env
3. Sprawdź logi backend w terminalu

### Problem: CORS errors
**Rozwiązanie**: Upewnij się że frontend działa na porcie 5173

## 📄 Licencja

MIT

## 🤝 Contributing

1. Fork repository
2. Utwórz feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

**Pytania?** Utwórz issue w repozytorium!