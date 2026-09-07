# Idea Garden

Idea Garden is a small, browser-local workspace for capturing ideas before they disappear. Ideas can stay as seeds, grow into sprouts, become blooms, or be marked as quick sparks.

## What it does

- Capture ideas with a title, notes, category, and status.
- Pin important ideas and mark evergreen ideas that should stay visible in the garden.
- Move ideas through `Seed`, `Growing`, `Bloomed`, `Spark`, and `Archived`.
- Add outcome notes and multiple outputs to a developed idea.
- Search, filter, sort, archive, trash, restore, and permanently delete ideas.
- View completed ideas as a visual garden and collection.
- Export the garden to JSON and import it on another browser or device.

## Product rules

An idea starts as a `Seed`. Editing its notes does not change its status; the person using the garden decides when it is `Growing`, `Bloomed`, or a quick `Spark`. Bloomed ideas can be placed in the garden, while sparks are shown as small completed moments. Archiving removes an idea from the active workspace without deleting it. Moving an idea to trash is reversible until it is permanently deleted.

All data is stored in the current browser's local storage. There is no account, server, analytics, Notion connection, or shared database. Different browsers and devices have separate gardens; use JSON export/import to move data between them.

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. For a production check:

```bash
npm run build
npm run lint
```

## Deploy

Import this folder as a Next.js project in Vercel. Use the repository root as the project root and keep the default build command (`npm run build`). No environment variables or database setup are required.

## Data and privacy

The browser-local design keeps each person's garden private to that browser profile. Clearing browser site data can remove the garden, so export a JSON backup when the data matters.

## License

This project is released under the MIT License. See [LICENSE](LICENSE).
