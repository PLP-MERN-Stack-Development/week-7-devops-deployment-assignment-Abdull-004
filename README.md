# MERN Stack WebSockets App – Deployment & DevOps

## 🚀 Deployed Application
- **Frontend (Vercel):** [https://deployment-website-sooty.vercel.app/]
- **Backend (Render):** [https://week-7-devops-deployment-assignment-ddr5.onrender.com/]

## 📦 Deployment Instructions
See [`deployment/README.md`](deployment/README.md) for detailed deployment steps for both backend (Render) and frontend (Vercel).

## ⚙️ CI/CD
- GitHub Actions workflows for CI and CD are in `.github/workflows/`:
  - `frontend-ci.yml` / `backend-ci.yml`: Lint, test, build
  - `frontend-cd.yml`: Deploys frontend to Vercel
  - `backend-cd.yml`: Deploys backend to Render
- Set required secrets in your GitHub repo for deployment (see workflow files for details).

## 🔐 Environment Variables
- See `client/env.example.txt` and `server/env.example.txt` for required variables.
- Set these in Vercel (frontend) and Render (backend) dashboards.

## 🩺 Monitoring & Maintenance
See [`monitoring/README.md`](monitoring/README.md) for:
- Health check endpoints
- Uptime monitoring (e.g., UptimeRobot)
- Error tracking (Sentry integration examples)
- Performance monitoring
- Maintenance plan (backups, updates, rollback)

## 🖼️ CI/CD Pipeline Screenshots
- _Add screenshots of your GitHub Actions runs here_

## 📝 Additional Notes
- For local development, copy the example env files to `.env` in each directory and fill in your values.
- For any issues, see the assignment instructions or contact your instructor. 