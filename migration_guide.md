# ROCO 4x4 Catalogue Portal - System Migration Guide

This guide details the services and steps required to move, manage, and build the **ROCO 4x4 Catalogue Portal** on your new computer.

---

## ☁️ 1. Project Services Directory

The portal relies on three main cloud-based platforms. You can log into all of them using your primary credentials or connected developer accounts:

1. **GitHub (Source Code & Version Control):**
   * **Account:** `pgerardijr007`
   * **Repository:** `https://github.com/pgerardijr007/Roco4x4`
   * **Role:** Holds the full codebase. Any commit pushed to the `main` branch automatically triggers a production deploy.

2. **Vercel (Hosting & Automated CI/CD Deployment):**
   * **Project Portal:** `https://vercel.com/pgerardijr007/roco4x4-portal`
   * **Live Application URL:** `https://roco4x4-portal.vercel.app`
   * **Role:** Hosts the serverless Next.js web application and compiles page routing.

3. **Supabase (Asset Storage & Database):**
   * **Project URL:** `https://supabase.com/dashboard/project/ijtkbisxyoondehvcqza`
   * **Assets Bucket:** `roco-assets` (holds the PDF catalogue `OME_Catalogue.pdf` and inventory dump `master_database.json`).
   * **Role:** Stores the 14,000+ row raw inventory database loaded by the app.

---

## ⚙️ 2. Environmental Keys (`.env.local`)

To run the app locally or build updates, you must configure a `.env.local` file in the root of the `/web` directory on your new machine. Here is the configuration from your current workspace:

```env
GEMINI_API_KEY=<REPLACE_WITH_YOUR_GEMINI_API_KEY_FROM_LOCAL_ENV_FILE>
GEMINI_API_KEYS=<REPLACE_WITH_YOUR_GEMINI_API_KEYS_FROM_LOCAL_ENV_FILE>

NEXT_PUBLIC_SUPABASE_URL=https://ijtkbisxyoondehvcqza.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<REPLACE_WITH_YOUR_SUPABASE_ANON_KEY_FROM_LOCAL_ENV_FILE>
SUPABASE_SERVICE_ROLE_KEY=<REPLACE_WITH_YOUR_SUPABASE_SERVICE_ROLE_KEY_FROM_LOCAL_ENV_FILE>

GEMINI_PDF_URI=https://generativelanguage.googleapis.com/v1beta/files/zu6yiqhoqjjn
```

---

## 🚀 3. Step-by-Step Setup on New Computer

Follow these steps once you receive your new computer:

### Step 1: Install Prerequisites
1. **Node.js:** Download and install Node.js (v20+ recommended) from [nodejs.org](https://nodejs.org/).
2. **Git:** Download and install Git from [git-scm.com](https://git-scm.com/).

### Step 2: Clone Codebase
Open your terminal (PowerShell or Command Prompt) and run:
```bash
git clone https://github.com/pgerardijr007/Roco4x4.git
cd Roco4x4/web
```

### Step 3: Configure Environment
1. Create a new file in the `/web` folder named `.env.local`.
2. Copy the block of keys shown in **Section 2** above into this file and save.

### Step 4: Install Dependencies
Run the package manager to install the frontend dependencies:
```bash
npm install
```

### Step 5: Start Local Development
Start the dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser. You can log in using passcode **`roco2026`** to test your changes.

---

## 🛠️ 4. Managing Updates & Deployments

* **Deploying Web Changes:**
  Commit your local code changes and push them to your GitHub repository:
  ```bash
  git add .
  git commit -m "Branding updates"
  git push origin main
  ```
  Vercel will detect the push to `main` and redeploy the live website at `https://roco4x4-portal.vercel.app` automatically.

* **Managing Storage / Database:**
  To upload a new database JSON file or replacement catalogue PDF, log into the [Supabase Dashboard](https://supabase.com/dashboard/project/ijtkbisxyoondehvcqza) and go to the **Storage > roco-assets** bucket to upload files directly.
