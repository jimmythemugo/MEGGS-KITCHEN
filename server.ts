import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. AI Copilot Endpoint (Admin Dashboard & Owner AI)
app.post('/api/ai/copilot', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        answer: "### 📊 Executive Telemetry Analysis (Offline Mode)\n- **Top Revenue Driver**: Commercial Cooking Equipment (45% share)\n- **Margin Recommendation**: High margin priority on Electric Deep Fryers & Bakery Spiral Mixers\n- **Inventory Alert**: 12 SKUs below safety stock threshold\n- **Supplier Insight**: Top performing vendor is Kenya Stainless Steel Fabricators (98% fill rate).",
        fallback: true,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `You are the MEGGS KITCHEN Enterprise AI Copilot for the business owner and operational executive team.
Current System Context (Real Live ERP State):
${JSON.stringify(context || {}, null, 2)}

User Question: "${prompt}"

Provide a concise, highly professional, numerical, and data-backed response with bullet points and clear actionable takeaways. Use Kenyan Shillings (KES) context where applicable. Format nicely in markdown.`,
    });

    res.json({ answer: response.text });
  } catch (err: any) {
    console.error('AI Copilot Error:', err);
    res.status(500).json({ error: 'AI Copilot temporary issue', details: err?.message });
  }
});

// 2. AI Shopping Assistant Endpoint (Storefront Natural Language Search & Smart Advisor)
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { userQuery, productsSample } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        explanation: `Based on your request "${userQuery}", here are our top commercial-grade equipment recommendations optimized for durability and heavy usage.`,
        recommendedProductIds: (productsSample || []).slice(0, 3).map((p: any) => p.id),
        buyingAdvice: [
          'Verify your electrical voltage requirements (3-phase vs single phase) for commercial units.',
          'Consider stainless steel 304 food-grade material for maximum hygiene and longevity.',
        ],
        fallback: true,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `You are the MEGGS KITCHEN Smart Culinary Advisor assisting a customer on our e-commerce platform.
Customer query: "${userQuery}"
Available Catalog Sample: ${JSON.stringify(productsSample || [])}

Analyze the user's intent and match with available products.
Return a valid JSON object matching this schema:
{
  "explanation": "Friendly, professional 1-2 sentence culinary advice on what equipment fits their exact need.",
  "recommendedProductIds": ["id1", "id2"],
  "buyingAdvice": ["Tip 1 regarding commercial specs, capacity, or warranty", "Tip 2"]
}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let result = {};
    try {
      result = JSON.parse(response.text || '{}');
    } catch {
      result = { explanation: response.text };
    }
    res.json(result);
  } catch (err: any) {
    console.error('AI Assistant Error:', err);
    res.status(500).json({ error: 'AI Assistant temporary issue', details: err?.message });
  }
});

// 3. AI Content & Marketing Endpoint
app.post('/api/ai/content', async (req, res) => {
  try {
    const { type, payload } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        content: "Draft Preview: Premium commercial equipment constructed with 304 food-grade stainless steel. Engineered for high-volume commercial kitchens across East Africa.",
        fallback: true,
      });
    }

    let prompt = "";
    if (type === 'product_seo') {
      prompt = `Generate an SEO Title, Meta Description (150 chars), 5 Keywords, and 3 Bullet Highlights for this product: ${JSON.stringify(payload)}`;
    } else if (type === 'campaign') {
      prompt = `Draft a high-conversion marketing message (Email subject + body, WhatsApp broadcast, and SMS text) for MEGGS KITCHEN campaign: ${JSON.stringify(payload)}`;
    } else {
      prompt = `Write a compelling commercial product description for: ${JSON.stringify(payload)}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ content: response.text });
  } catch (err: any) {
    console.error('AI Content Error:', err);
    res.status(500).json({ error: 'AI content service error', details: err?.message });
  }
});

// Vite middleware / static serve
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MEGGS KITCHEN Enterprise Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
