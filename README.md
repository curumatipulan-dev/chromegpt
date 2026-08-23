# AI Coding Assistant

An AI-powered coding assistant built with Expo (React Native) and Supabase. Generate, modify, debug, and test code across multiple services.

## Features

- **AI Chat** — Generate code, debug, refactor, explain, and write tests in 18+ languages
- **File Manager** — Create, edit, search, and filter files by service
- **Service Connections** — GitHub, Gmail, Google Drive, Dropbox, and Local Storage
- **Settings** — Local/cloud AI models, dark mode, auto-save, destructive action confirmation

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Expo (React Native) |
| Backend | Supabase (PostgreSQL + RLS) |
| Navigation | Expo Router (Tabs) |
| Icons | lucide-react-native |
| Fonts | Inter + JetBrains Mono |

## Getting Started

```bash
npm install
npm run dev
```

### Environment Variables

Create a `.env` file with:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database

The Supabase migration is in `supabase/migrations/`. It creates:
- `chat_sessions` — Conversation history
- `chat_messages` — Individual messages with code detection
- `files` — File records with service attribution
- `service_connections` — OAuth connection status

All tables have RLS enabled with anon+authenticated access (single-tenant, no auth).

## Scripts

- `npm run dev` — Start the dev server
- `npm run build:web` — Export for web
- `npm run typecheck` — TypeScript type checking
- `npm run lint` — ESLint

## License

MIT
