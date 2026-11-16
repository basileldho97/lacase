# La Casa Properties

## Product

La Casa Properties is a private property workspace. Admins provision user accounts; each user manages only their own rental listings.

## Core behavior

- Anonymous visitors are redirected to login; there is no public site or self-sign-up.
- Users can create, edit, delete, search, and view only their own listings.
- Admins manage users only and never access property rows or contacts.
- The app is mobile-first and uses a dark, high-contrast visual system.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/Database/Storage. Framework and deployment choice are confirmed by the brief.

## Durable constraints

- UI copy is English.
- Supabase secret keys stay server-only.
- Photos are limited to five per listing, 5 MB each, jpeg/png/webp.
- Brand colors: charcoal cards #171717, forest background #06110C, crimson action #A31C1B.
- Typography: Bricolage Grotesque headings and Instrument Sans body.
