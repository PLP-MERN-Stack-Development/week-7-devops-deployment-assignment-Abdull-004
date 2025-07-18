# Monitoring Setup

This directory contains examples and documentation for monitoring the MERN stack application.

## Backend
- Health check endpoint: `/api/health`
- Uptime monitoring: Use UptimeRobot or similar to monitor `/api/health` endpoint
- Error tracking: Integrate Sentry (see monitoring-sentry-example.js)
- Performance monitoring: Use Render metrics or external tools

## Frontend
- Performance monitoring: Use Vercel Analytics or Lighthouse
- Error tracking: Integrate Sentry (see monitoring-sentry-example.jsx)

## Sentry Setup
- Create a Sentry account and project for both backend and frontend
- Add DSN to your environment variables (`SENTRY_DSN` for backend, `VITE_SENTRY_DSN` for frontend)
- See example integration files in this directory

---

Add monitoring configuration files or scripts to this directory as needed. 