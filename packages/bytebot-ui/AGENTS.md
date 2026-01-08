# bytebot-ui - Next.js Frontend

## OVERVIEW

Next.js 14+ frontend on port 9992. Provides UI for desktop control, VNC viewing, and task management.

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Pages | `app/` (App Router) |
| Components | `components/` |
| API calls | `lib/api.ts` or `hooks/` |
| VNC viewer | `components/vnc/` |
| Desktop panel | `components/local-screen/` |

## CONVENTIONS

- **React**: Functional components + hooks
- **Client components**: `"use client"` directive
- **Styling**: Tailwind CSS or CSS modules
- **State**: React Query or Zustand

## ANTI-PATTERNS

- ❌ NO class components - use hooks
- ❌ NO direct `fetch` in components - use custom hooks
- ❌ NO hardcoded API URLs - use env vars
