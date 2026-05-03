require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 }
});

const API_KEYS = process.env.GEMINI_API_KEYS
  ? process.env.GEMINI_API_KEYS.split(",").map(k => k.trim()).filter(Boolean)
  : [];

let currentKeyIndex = 0;
const medicineCache = new Map();

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function getActiveKey() {
  return API_KEYS[currentKeyIndex];
}

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
}

function cleanJsonText(text) {
  return text.replace(/```json|```/g, "").trim();
}

async function runGeminiText(prompt) {
  if (!API_KEYS.length) throw new Error("No Gemini API keys found in .env");

  let retryDelay = 1500;

  for (let i = 0; i < API_KEYS.length; i++) {
    const key = getActiveKey();

    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { temperature: 0.1 }
      });

      const result = await model.generateContent(prompt);
      return cleanJsonText(result.response.text());

    } catch (err) {
      const msg = err.message || "";

      if (err.status === 503 || msg.includes("503") || msg.includes("overloaded")) {
        await wait(retryDelay);
        retryDelay *= 2;
        i--;
        continue;
      }

      if (err.status === 429 || msg.includes("429") || msg.toLowerCase().includes("quota")) {
        console.warn(`Key ${currentKeyIndex} quota hit. Rotating...`);
        rotateKey();
        continue;
      }

      console.error("Gemini text error:", msg);
      rotateKey();
    }
  }

  throw new Error("All Gemini keys failed");
}

async function runGeminiImage(prompt, file) {
  if (!API_KEYS.length) throw new Error("No Gemini API keys found in .env");

  for (let i = 0; i < API_KEYS.length; i++) {
    const key = getActiveKey();

    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { temperature: 0.1 }
      });

      const imagePart = {
        inlineData: {
          data: file.buffer.toString("base64"),
          mimeType: file.mimetype
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      return cleanJsonText(result.response.text());

    } catch (err) {
      const msg = err.message || "";

      if (err.status === 429 || msg.includes("429") || msg.toLowerCase().includes("quota")) {
        console.warn(`Key ${currentKeyIndex} quota hit. Rotating...`);
        rotateKey();
        continue;
      }

      console.error("Gemini image error:", msg);
      rotateKey();
    }
  }

  throw new Error("Image analysis failed");
}

async function getMedicineDetails(medicineName) {
  const prompt = `
You are an expert Indian pharmacist.

Provide details for the Indian medicine "${medicineName}" in strict JSON only.

Return this exact JSON shape:

{
  "salt": "string",
  "class": "string",
  "description": "string",
  "avgBrandedMRP": number,
  "janAushadhiMRP": number,
  "unitSize": "string",
  "warnings": ["string", "string", "string"]
}

Rules:
- Return ONLY valid JSON.
- No markdown.
- No explanation.
- Prices must be approximate INR MRP for India.
`;

  const text = await runGeminiText(prompt);
  return JSON.parse(text);
}

app.post("/api/lookup", async (req, res) => {
  try {
    const { medicine } = req.body;

    if (!medicine) {
      return res.status(400).json({ error: "Medicine name required" });
    }

    const cacheKey = medicine.toLowerCase().trim();

    if (medicineCache.has(cacheKey)) {
      return res.json(medicineCache.get(cacheKey));
    }

    const aiData = await getMedicineDetails(medicine);

    if (!aiData || !aiData.salt) {
      return res.status(503).json({
        error: "Could not find medicine details. Please try again."
      });
    }

    const cleanSalt = aiData.salt.replace(/\s+/g, "+");

    const response = {
      found: true,
      brandName: medicine,
      activeSalt: aiData.salt,
      therapeuticClass: aiData.class,
      saltDescription: aiData.description,
      perUnit: aiData.unitSize || "10 Tablets",
      warnings: aiData.warnings || [],
      buyLink: `https://janaushadhistore.online/search?q=${cleanSalt}`,
      tiers: {
        brand: {
          name: medicine,
          mrp: Number(aiData.avgBrandedMRP) || 0,
          manufacturer: "Branded Manufacturer"
        },
        trueGeneric: {
          label: "Jan Aushadhi Equivalent",
          mrp: Number(aiData.janAushadhiMRP) || 0
        }
      }
    };

    medicineCache.set(cacheKey, response);
    res.json(response);

  } catch (err) {
    console.error("Lookup error:", err.message);
    res.status(500).json({
      error: "Medicine lookup failed. Please try again."
    });
  }
});

app.post("/api/upload-image", upload.single("medicinePhoto"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const prompt = `
Look carefully at this image.

Extract ALL visible Indian medicine brand names from packages, strips, bottles, boxes, prescriptions, or labels.

Return ONLY valid JSON in this exact format:

{
  "detectedMedicines": ["medicine 1", "medicine 2", "medicine 3"]
}

Rules:
- Extract ALL medicines visible, not just one.
- Include strength if visible. Example: "Dolo 650", "Telma 40", "Augmentin 625".
- Do not include manufacturer unless it is part of the medicine name.
- Remove duplicates.
- Maximum 8 medicines.
- Prefer clearly readable printed names over unclear handwritten text.
- If no medicine is visible, return:
{
  "detectedMedicines": []
}
`;

    const text = await runGeminiImage(prompt, req.file);
    const data = JSON.parse(text);

    const detectedMedicines = Array.isArray(data.detectedMedicines)
      ? [...new Set(data.detectedMedicines.map(m => String(m).trim()).filter(Boolean))]
      : [];

    if (!detectedMedicines.length) {
      return res.status(422).json({
        error: "Could not detect any medicine names from this image."
      });
    }

    res.json({ detectedMedicines });

  } catch (err) {
    console.error("Upload image error:", err.message);
    res.status(500).json({
      error: "Image upload failed. Please try another clearer image."
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    status: "SaltCheck API running",
    routes: ["/api/lookup", "/api/upload-image"]
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 SaltCheck Server live on port ${PORT}`);
  console.log(`✨ Gemini keys loaded: ${API_KEYS.length}`);
});