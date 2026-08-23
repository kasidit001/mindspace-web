# mindspace-web

Frontend for **Mindspace** — a course/lesson viewer with an AI tutor chat panel,
built with Nuxt 3, Tailwind CSS, and Pinia. Talks to the [`mindspace-api`](../mindspace-api)
backend for course content and AI-assisted Q&A.

## Features

- **Course layout & sidebar** (`/courses`) — browse courses and lessons via a
  left-hand navigation sidebar.
- **Markdown rendering** — lesson content is rendered with [`@nuxtjs/mdc`](https://github.com/nuxt-modules/mdc),
  including syntax-highlighted TypeScript code blocks (via Shiki, light/dark themes).
- **AI Chat Panel** — a slide-in drawer for asking questions about course content,
  backed by `POST /api/chat/ask`, with answers grounded in cited lesson references.

## Setup

Install dependencies:

```bash
npm install
```

Copy the example env file and point it at your running `mindspace-api` instance:

```bash
cp .env.example .env
```

```env
# .env
NUXT_PUBLIC_API_BASE=http://localhost:8080
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

Make sure `mindspace-api` is running on port `8080` (see that project's README) so
the courses list, lesson content, and AI chat panel have data to work with.

## Production

Build the application for production:

```bash
npm run build
```

Locally preview the production build:

```bash
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Branching workflow

- `develop` is the default/integration branch.
- New work happens on `feature/<short-description>` branches cut from `develop`.
- Open a PR back into `develop`; merge once reviewed.
