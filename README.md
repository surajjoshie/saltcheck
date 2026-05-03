# SaltCheck India — AI Generic Medicine Finder

Find the cheapest generic alternative for **any Indian branded medicine** — powered by Claude AI.
Covers every medicine sold in India: common, rare, OTC, prescription, Ayurvedic combinations.

---

## How it works

```
Browser → POST /api/lookup (your server) → Claude AI → structured JSON
```

Your **API key lives only on the server** — never in the browser. The frontend calls your own `/api/lookup` endpoint.

---

## Get your Anthropic API key (free to start)

1. Go to **https://console.anthropic.com**
2. Sign up → Dashboard → **API Keys** → **Create Key**
3. Copy it — looks like `sk-ant-api03-xxxxx`

---

## Run locally

```bash
# 1. Install
npm install

# 2. Add your key
cp .env.example .env
# Open .env and paste your key:  ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# 3. Start
npm start
# → http://localhost:3000
```

---

## Deploy to Railway (FREE — recommended, 2 minutes)

Railway gives you a live HTTPS URL for free.

```
1. Push this folder to a GitHub repo
   git init
   git add .
   git commit -m "init"
   # Create repo on github.com, then:
   git remote add origin https://github.com/YOUR_NAME/saltcheck.git
   git push -u origin main

2. Go to https://railway.app → sign up with GitHub

3. Click "New Project" → "Deploy from GitHub repo" → select your repo

4. Click your service → "Variables" tab → Add:
   ANTHROPIC_API_KEY = sk-ant-api03-xxxxx

5. Click "Deploy" → Railway gives you a URL like:
   https://saltcheck-production.up.railway.app
```

Done. Your app is live.

---

## Deploy to Render (FREE tier)

```
1. Push to GitHub (same as above)

2. Go to https://render.com → "New Web Service" → connect repo

3. Settings:
   Build command:  npm install
   Start command:  node server.js

4. Environment Variables:
   ANTHROPIC_API_KEY = sk-ant-api03-xxxxx

5. Click "Create Web Service" → live in ~2 minutes
```

---

## Deploy to Vercel (FREE — serverless, no sleep)

Vercel needs a small adapter since it uses serverless functions:

```bash
npm install -g vercel

# Add to your project root: vercel.json
cat > vercel.json << 'EOF'
{
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
EOF

vercel --prod
# It will ask for your ANTHROPIC_API_KEY — paste it
```

---

## Custom domain (optional)

All three platforms (Railway, Render, Vercel) let you add a custom domain free:
- Railway: Settings → Custom Domain
- Render: Settings → Custom Domains
- Vercel: Settings → Domains

---

## Cost estimate

Claude Sonnet 4 pricing (as of 2025):
- Input: $3 / 1M tokens · Output: $15 / 1M tokens
- Each medicine lookup uses ~500 tokens input + ~400 tokens output
- **Cost per search: ~$0.0015 (≈ 10 paise)**
- 1,000 searches/day ≈ $1.50/day

Set spend limits at https://console.anthropic.com/settings/limits

---

## File structure

```
saltcheck/
├── server.js          ← Express backend + Claude API proxy
├── package.json
├── .env.example       ← Copy to .env, add your key
├── .gitignore         ← .env is excluded from git
├── Procfile           ← For Railway/Heroku
└── public/
    └── index.html     ← Complete frontend (no build step)
```

---

## Legal

Prices are AI-estimated MRPs based on NPPA data, Jan Aushadhi lists, and Indian e-pharmacy pricing.
This tool is for informational purposes only — not medical advice.
Always consult a doctor or pharmacist before switching medicines.
