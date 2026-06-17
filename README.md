# Interval 2.0

Interval 2.0 is a spaced repetition scheduler, 455-problem DSA tracker (based on Striver A2Z DSA sheet), and daily habit logging dashboard. It is built as a lightweight, zero-framework Vanilla JS single-page layout powered by Vite and Supabase.

## Features
- **Spaced Repetition Scheduler**: Adapts review intervals (1, 3, 7, 14, 30 days) dynamically.
- **Striver A2Z DSA Tracker**: Built-in search, tutorial links, and tracking for all 455 problems.
- **Daily Habit Tracking**: Log workouts (Push/Pull/Legs) and consistency heatmaps.
- **Supabase Cloud Sync**: Secure Single Sign-on using Google Auth to sync progress across devices.

---

## Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

3. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5175/landing.html` in your browser.

---

## Deployment on Vercel

Interval is fully compatible with Vercel out of the box. Follow these steps to deploy:

### Step 1: Create a Git Repository
If you haven't already, initialize a Git repository and commit your files:
```bash
git init
git add .
git commit -m "Initial commit"
```
*(Make sure to push this repository to GitHub, GitLab, or Bitbucket)*

### Step 2: Deploy to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import your Git repository.
4. Vercel will automatically detect **Vite** as the framework preset.
5. Expand the **Environment Variables** section and add:
   - `VITE_SUPABASE_URL` (Your Supabase URL)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (Your Supabase Publishable / Anon Key)
6. Click **Deploy**.

### Step 3: Configure Supabase Redirect URLs
In your Supabase dashboard:
1. Go to **Authentication** > **URL Configuration**.
2. Add your Vercel deployment URL (e.g. `https://your-project-name.vercel.app/index.html`) to the **Redirect URLs** list.
3. Make sure Google OAuth is enabled in your Supabase Auth provider settings.
