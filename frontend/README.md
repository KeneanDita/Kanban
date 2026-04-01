# KanFlow — Frontend

Next.js 15 (App Router) frontend for KanFlow. See the root [README](../README.md) for full setup instructions.

## Development

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

## Build

```bash
npm run build
npm start
```
