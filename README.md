Dear You

Is a personalized keepsake web app, to create and share a custom message page for someone, with real user accounts behind it.

Live demo → https://dear-you-xi.vercel.app/

What it does is

Users sign up, create a personalized page, and share it with the recipient. Built to handle real accounts rather than a static template, including per-user data access control.

Tech stacks are
React (Vite) — frontend
Supabase — authentication and database, with Row-Level Security policies controlling data access per user
Vercel — deployment

What I built are
User authentication flow (sign up, log in, session handling)
Row-Level Security policies in Supabase so users can only access their own data
Mobile-responsive layout, including fixing viewport bugs on smaller screens
Deployment pipeline via GitHub → Vercel
