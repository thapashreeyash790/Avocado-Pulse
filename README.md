<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Avocado Project manager

This contains everything you need to run the app locally.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Start the backend server:
   ```bash
   cd server
   npm install
   npm run start
   ```
3. In a separate terminal start the frontend:
   ```bash
   cd ..
   npm install
   npm run dev
   ```

Deployment
- Frontend: GitHub Actions workflow builds and deploys the frontend to GitHub Pages (branch `gh-pages`).
- Backend: the lightweight Express+lowdb server in `server/` should be hosted separately.
