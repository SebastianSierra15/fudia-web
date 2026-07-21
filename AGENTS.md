# AGENTS.md - Fudia Web App (DEPRECATED)

`fudia-web` is deprecated and is not used by the current Fudia project.

Do not implement new product, web, or admin work in this folder. Active admin
work belongs in `fudia-admin`. Use this folder only when the user explicitly
requests archival, comparison, or migration cleanup.

These instructions apply to any developer or AI agent working on the **Fudia web application**.

---

## 1. Web App Purpose

Fudia's web application is:

> An **additional frontend for the same Fudia system**, not an independent system.

It must:
- Share the backend with the mobile app (Appwrite)
- Use the same collections and business logic
- Maintain full consistency in data and flows

---

## 2. Tech Stack

### Web Frontend
- Next.js (App Router)
- TypeScript
- Server Components + Server Actions
- Tailwind CSS

### Backend
- Appwrite (Auth, Database, Storage, Functions)
- Billing provider to be defined

---

## 3. General Architecture

Recommended structure:

```text
app/
|-- (marketing)/
|   |-- page.tsx
|   |-- producto/
|   |-- como-funciona/
|   |-- precios/
|
|-- (auth)/
|   |-- login/
|   |-- register/
|
|-- (private)/
|   |-- dashboard/
|   |-- historial/
|   |-- perfil/
|   |-- billing/
|
|-- api/
|   |-- auth/
|
lib/
|-- appwrite/
```

---

## 3.1. Component Structure (Atomic Design)

- Use the **Atomic Design** pattern for components: `atoms`, `molecules`, `organisms`, `templates`
- All layers must live inside `src/`
- Inside `src/components/` there must be:
  - One folder per page
  - One `shared` folder for shared components
- In each page folder and in `shared/`, these subfolders must exist:
  - `atoms/`
  - `molecules/`
  - `organisms/`
  - `templates/`
- If a component can or should be used in more than one page, move it to `shared/` and generalize it

---

## 3.2. SEO (MANDATORY)

- The title must be between 30 and 65 characters
- The description must be between 120 and 300 characters
- Each page must have one `h1` and a correct heading hierarchy
- Add keywords
- All images must have `alt` and `title`
- Every link must have a `title`
- Social metadata must be correct
- Each page must have its own Open Graph image

---

## 4. Development Principles (MANDATORY)

- Follow **SOLID** principles
- Do not duplicate existing logic
- Maintain separation of concerns
- Write clear and maintainable code
- Avoid unnecessary "clever" solutions

---

## 5. Security Rules

- Never store tokens in `localStorage`
- Use secure cookies (`httpOnly`)
- Validate authentication on the server
- Protect private routes from the backend
- Never trust frontend data

---

## 6. Authentication

- Use Appwrite Auth
- Handle login from the server (Server Actions or API Routes)
- Get the user from the active session
- Logout must remove the current session

---

## 7. Payments

- Keep billing provider decisions abstract until a real provider is defined
- If billing is implemented later, document the provider and server-side flow first

---

## 8. Separation of Responsibilities

### Frontend
- UI / UX
- Navigation
- Interface state
- Backend calls

### Backend (Appwrite / API Routes)
- Business logic
- Data validation
- Payment handling
- Persistence

---

## 9. Code and Typing

- Use TypeScript strictly
- Avoid `any`
- Reuse existing types
- Keep interfaces consistent

---

## 10. Comments

- Write comments in Spanish
- Only when they add value
- Explain complex decisions
- Do not comment obvious code

---

## 11. Conventions

- Descriptive names
- Reusable components
- Hooks for shared logic
- Separate logic from presentation

---

## 12. Middleware and Protection

- Middleware for basic redirects
- Real validation on the server
- Do not rely only on the frontend

---

## 13. Philosophy

Fudia prioritizes:
- Security
- Scalability
- Clarity
- Maintainable code

---

## 14. Mockup Copy Fidelity (MANDATORY)

- Use the exact text from approved mockups by default.
- Do not rewrite, summarize, or replace mockup copy unless the user explicitly asks for a text change.

---

This file is the main guide for the web application.

---

# Project Token Budget Rules

Use the global Codex skills:

- `token-budget` for PDFs, images, Office files, logs, transcripts, and other large files.
- `code-token-budget` for implementation, debugging, review, refactoring, test, and code explanation tasks.

## Coding Defaults

- Search before reading large files.
- Use `rg`/file lists/diffs to locate relevant code first.
- Read only targeted files or line ranges when possible.
- Avoid generated, vendored, build, cache, coverage, and dependency folders unless directly relevant.
- Broaden to repository-wide analysis only when the task requires it, and state why.
- For long tasks, keep a compact `.codex-token-worklog.md` to avoid rereading the same context.

## Large File Defaults

- Do not read a large binary/document directly when a preflight artifact can answer the task.
- Prefer `C:\Users\sebsi\Documents\Codex\token-budget\preflight.ps1` before sending full content to the model.
- Use `summary.md` and `index.md` first; open `content.md`/`content.txt` only for relevant sections.
- Read the original PDF/image/Office file only when reduced artifacts are insufficient.

## Shared Paths

- Inbox: `C:\Users\sebsi\Documents\Codex\file-inbox`
- Cache: `C:\Users\sebsi\Documents\Codex\file-cache`
- Tools: `C:\Users\sebsi\Documents\Codex\token-budget`

## Subagent Policy

- Do not create subagents by default.
- Use direct local inspection first.
- Only use subagents when the user explicitly asks for parallel review or when a complex task clearly benefits from independent analysis.
- If subagents are needed, state why before creating them.

