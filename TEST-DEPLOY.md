# Idea Garden Test

This is an independent test copy of Idea Garden. It has no Notion, database,
account, or server-side data dependency. Each tester's garden stays in that
browser's local storage.

## What Testers Can Do

- Create and manage ideas locally
- Move ideas to trash and restore or permanently delete them
- Export their garden as JSON
- Import a JSON export into the current browser
- Install the site as a basic PWA from a supported mobile browser

## Deploy To Vercel

Deploy this folder as a new Vercel project. Vercel detects the project from
`package.json`; leave the build command as `npm run build` and the output
directory empty so it uses the framework defaults.

From a terminal in this folder, the equivalent CLI flow is:

```powershell
npx vercel
```

Choose a new project, then run `npx vercel --prod` only when the test URL is
ready to share. The local data of one tester is never visible to another unless
they export JSON and send that file themselves.
