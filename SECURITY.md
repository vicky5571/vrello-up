# 🛡️ Security Policy & Sensitive Data Protection Rules

This document outlines security protocols and developer rules for **VrelloUp (ClickUp Clone)** to prevent leaking credentials, tokens, API keys, personal identifiable information (PII), or database secrets.

---

## 1. Secrets & Environment Variables Isolation

### 🚫 The Golden Rule: Client vs. Server Secrets

In Next.js, **never** prefix private keys with `NEXT_PUBLIC_`.

| Secret Type      | Allowed Location                         | Prefix         | Example                                                                            |
| :--------------- | :--------------------------------------- | :------------- | :--------------------------------------------------------------------------------- |
| **Public Keys**  | Client & Server                          | `NEXT_PUBLIC_` | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Private Keys** | Server-Only (API routes, Server Actions) | _No prefix_    | `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `OPENAI_API_KEY`        |

### Rules for Environment Variables:

1. **Never commit `.env`, `.env.local`, `.env.production`, or `.env.staging` to Git.**
2. Only commit `.env.example` containing placeholder dummy values.
3. If an API key or service secret is accidentally committed:
   - **Immediately invalidate and rotate the key** on the respective provider dashboard.
   - Do not simply delete the line in a new commit — Git history retains old commits.

---

## 2. Source Code & Git Hygiene

### Pre-Commit Checklist:

- [ ] No hardcoded passwords, tokens, or JWT strings in test fixtures or mock files.
- [ ] No personal emails, production phone numbers, or real customer data in seeds.
- [ ] `console.log()` calls do not log full authentication payloads, authorization tokens, or raw request headers.

---

## 3. Database & Backend Security (Row-Level Security)

### Row-Level Security (RLS) & Multi-Tenant Isolation

1. **Enable RLS on every table** in production databases.
2. Implement strict workspace-isolation policies:
   - A user can only `SELECT`, `INSERT`, `UPDATE`, `DELETE` tasks, lists, or workspaces where they are an active workspace member or owner.
3. Never bypass RLS in client-facing API endpoints by improperly exposing the `SERVICE_ROLE_KEY`.

---

## 4. Frontend & Input Sanitization

### XSS Prevention in Rich Text / Task Notes

1. Sanitize all HTML generated from rich text editors (e.g. Tiptap) before rendering using `DOMPurify`.
2. Do not use `dangerouslySetInnerHTML` with untrusted user input without strict sanitization.

### Data Exposure Boundaries

1. **User Profiles**: Only return public user fields (`id`, `name`, `avatar_url`) to the frontend. Never return password hashes or recovery tokens.
2. **State Management**: Use HTTP-only, secure, `SameSite=Lax` cookies for auth session persistence.
