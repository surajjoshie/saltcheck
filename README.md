# SaltCheck India — AI Generic Medicine Finder

Find the cheapest generic alternative for **any Indian branded medicine**. This tool is designed to help consumers navigate the pharmaceutical market by identifying active salts and suggesting affordable Jan Aushadhi alternatives.

Covers every medicine sold in India: common, rare, OTC, prescription, and Ayurvedic combinations.

---

## How it works

```text
Browser → POST /api/lookup (your server) → Gemini AI → structured JSON
```

1.  **Request**: The user enters a medicine name on the frontend.
2.  **Cache Check**: The server immediately checks if this medicine has been searched before to provide instant results.
3.  **AI Processing**: If the data is not in the cache, the server selects an available Gemini API key and requests a pharmaceutical breakdown.
4.  **Response**: The server sends a clean, structured result back to the user, including links to purchase equivalents.

---

## Key Features

*   **Multi-Key Round-Robin**: The system rotates through multiple API keys to maintain uptime and maximize free-tier limits, preventing service interruptions due to quota blocks.
*   **Intelligent Server-Side Caching**: Common medicines are served instantly from memory to ensure fast performance and save on API usage.
*   **Resilient Logic**: The backend includes automatic exponential backoff. If the AI servers are busy during peak hours, the application will wait and retry automatically.
*   **Privacy and Security**: All sensitive logic, including API keys and prompt instructions, remains on the server—never exposed to the browser.

---

## Get your Gemini API keys (Free)

1.  Go to **[https://aistudio.google.com](https://aistudio.google.com)**
2.  Sign up → **Get API key** → **Create API key in new project**
3.  Copy the key (it starts with `AIzaSy...`).
4.  Repeat this process to get multiple keys for rotation.

---

## Run locally

```bash
# 1. Install
npm install

# 2. Add your keys
cp .env.example .env
# Open .env and paste your keys (comma-separated): 
# GEMINI_API_KEYS=key1,key2,key3

# 3. Start
npm start
# → http://localhost:3000
```


---

## Deploy to Railway (FREE — recommended)

1.  Push this folder to a GitHub repository.
2.  Go to **[https://railway.app](https://railway.app)** and connect your repo.
3.  In the **Variables** tab, add: `GEMINI_API_KEYS` = `key1,key2,key3`
4.  Click **Deploy**. Railway will provide a live HTTPS URL automatically.

---

## Cost and Performance

*   **Cost**: Operating on the Google Gemini free tier allows this tool to run at zero cost.
*   **Capacity**: By rotating keys, the application can handle thousands of unique searches per day.
*   **Efficiency**: Results for new medicines typically arrive in under 3 seconds, while cached results are delivered in milliseconds.

---

## File structure

```text
saltcheck/
├── server.js          ← Express backend + Key Rotation + Cache logic
├── package.json
├── .env.example       ← Template for your API keys
├── .gitignore         ← Ensures .env is excluded from git
├── Procfile           ← For Railway/Heroku deployment
└── index.html     ← Complete frontend UI
```


---

## Medical Disclaimer

The information provided by SaltCheck India is for informational purposes only and is based on AI-estimated data and public price lists. This tool does not provide medical advice.

Pharmaceutical prices and salt compositions can change. Always consult with a registered medical practitioner or a certified pharmacist before switching from a prescribed branded medicine to a generic alternative. Ensure that any generic substitute matches the exact dosage and form prescribed by your doctor.
