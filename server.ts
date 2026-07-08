import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini SDK lazily to avoid crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다. AI Studio의 Settings > Secrets 패널에서 설정해주세요.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint for image editing
app.post("/api/edit-image", async (req, res) => {
  try {
    const { originalImage, referenceImage, prompt } = req.body;

    if (!originalImage || !originalImage.data || !originalImage.mimeType) {
      return res.status(400).json({ error: "원본 건축 이미지는 필수 입력 항목입니다." });
    }

    const ai = getGeminiClient();
    const parts: any[] = [];

    // 1. Add Original Image Part
    parts.push({
      inlineData: {
        data: originalImage.data.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: originalImage.mimeType,
      },
    });

    // 2. Add Reference Image Part if provided
    if (referenceImage && referenceImage.data && referenceImage.mimeType) {
      parts.push({
        inlineData: {
          data: referenceImage.data.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: referenceImage.mimeType,
        },
      });
    }

    // 3. Build detailed prompt with architectural preservation guidelines
    let finalPrompt = "";
    if (referenceImage && referenceImage.data) {
      finalPrompt = `Edit the uploaded original architectural image realistically.
We have provided two images:
- The first image is the ORIGINAL building/interior structure we want to edit.
- The second image is a REFERENCE style/mood image.

Your task is to modify the ORIGINAL image following the USER PROMPT, while borrowing styles/colors/textures from the REFERENCE image.

USER PROMPT: "${prompt || "Make it look professional and refined"}"

STRICT ARCHITECTURAL PRINCIPLES:
1. Preserve the core building structure, camera angle, perspective, height proportions, and positioning of doors/windows from the ORIGINAL image. Do not change the viewpoint.
2. Borrow the styling, materials (e.g., specific marble, concrete, timber, glass), colors, vegetation, lighting (e.g., golden hour, night scene with warm spot lighting, diffused daylight), and atmospheric mood from the REFERENCE image and apply them gracefully to the original structure.
3. Keep the layout natural and professional, suitable for presentation to architectural clients. No weird artifacts or chaotic shapes.
4. Output the modified architectural visualization image.`;
    } else {
      finalPrompt = `Edit the uploaded original architectural image realistically.
We have provided an ORIGINAL building/interior structure image.

Your task is to modify this ORIGINAL image according to the USER PROMPT.

USER PROMPT: "${prompt || "Make it look professional and refined"}"

STRICT ARCHITECTURAL PRINCIPLES:
1. Preserve the core building structure, camera angle, perspective, height proportions, and positioning of doors/windows from the ORIGINAL image. Do not change the viewpoint.
2. Apply only the requested design modifications (e.g., modifying facade materials, landscaping, adding lighting, turning day to night, changing wall paint or textures) naturally.
3. Keep the layout natural and professional, suitable for presentation to architectural clients. No weird artifacts or chaotic shapes.
4. Output the modified architectural visualization image.`;
    }

    parts.push({ text: finalPrompt });

    // Call gemini-3.1-flash-lite-image model
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1", // Standard square format for high quality editing outputs
        },
      },
    });

    let base64Output = "";
    let explanationText = "";

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Output = part.inlineData.data;
        } else if (part.text) {
          explanationText += part.text;
        }
      }
    }

    if (!base64Output) {
      return res.status(500).json({ error: "이미지 편집에 실패했습니다. 프롬프트를 조금 더 구체적으로 입력해주세요." });
    }

    res.json({
      success: true,
      image: `data:image/png;base64,${base64Output}`,
      explanation: explanationText || "이미지가 성공적으로 편집되었습니다.",
    });

  } catch (error: any) {
    console.error("Image Editing API Error:", error);
    res.status(500).json({
      error: error.message || "이미지 편집 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
