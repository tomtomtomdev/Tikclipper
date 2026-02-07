# TikClipper

AI-powered video clipper for Shopee affiliate marketers. Automatically turns long-form product review and unboxing videos into TikTok-ready short clips with AI-generated captions, hashtags, and affiliate link placeholders.

## Features

- **AI Video Analysis** — Extracts keyframes and uses Claude Vision to detect products, actions, emotions, and clip-worthy moments
- **Smart Clip Detection** — AI suggests optimal 15–60s clips with confidence scores and category labels (product showcase, unboxing, reaction, before/after, CTA)
- **Auto Captions & Hashtags** — Generates TikTok-optimized captions, 15–20 hashtags, and CTA text in multiple tones (casual, hype, professional, educational)
- **Product Link Management** — Add Shopee affiliate links and auto-match them to scenes where products appear
- **Video Processing** — Crops to 9:16, rescales to 1080x1920, optional caption burning. Supports TikTok, Reels, Shorts, and raw formats
- **Scene Timeline** — Interactive color-coded timeline showing all analyzed scenes with timestamps
- **Batch Export** — Download all clips as a ZIP with metadata

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI:** Radix UI components
- **AI:** Anthropic Claude API (vision analysis + text generation)
- **Video:** FFmpeg (fluent-ffmpeg), Sharp
- **Database:** SQLite via Drizzle ORM
- **Queue:** BullMQ + Redis for background job processing

## Prerequisites

- Node.js 18+
- Redis server
- FFmpeg installed (`brew install ffmpeg` on macOS)
- Anthropic API key

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables** — create `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   ```

3. **Set up the database:**
   ```bash
   npm run db:push
   ```

4. **Start Redis:**
   ```bash
   redis-server
   ```

5. **Start the background workers** (separate terminal):
   ```bash
   npm run workers
   ```

6. **Start the dev server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to get started.

## How It Works

1. Create a project and upload a raw video
2. Run AI analysis — keyframes are extracted and sent to Claude Vision
3. Review the scene timeline and AI-suggested clips
4. Add Shopee affiliate product links
5. Generate clips (background workers handle cutting, cropping, captioning)
6. Export all clips as a ZIP

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run workers` | Start background job workers |
| `npm run db:push` | Apply database migrations |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```
src/
├── app/                  # Next.js pages & API routes
│   ├── dashboard/        # Projects dashboard
│   ├── projects/[id]/    # Project detail, clips, timeline, export
│   └── api/              # REST API (projects, upload, analyze, clips, products, export)
├── components/ui/        # Radix UI components
├── db/                   # Drizzle schema & connection
├── lib/                  # Claude API, FFmpeg, queue, storage utilities
├── workers/              # BullMQ workers (analysis, clip generation)
└── hooks/                # React hooks
data/                     # Runtime data (db, uploads, keyframes, clips, exports)
```

## License

Private
