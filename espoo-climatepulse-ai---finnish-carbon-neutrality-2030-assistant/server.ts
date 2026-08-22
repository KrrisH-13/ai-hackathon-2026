import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  chatWithClimateAssistantWithAI,
  classifyWasteWithAI,
  optimizeDailyEnergyWithAI,
  compareCommuteEmissionsWithAI,
  generatePersonalizedRoadmapPlanWithAI,
} from './src/server/geminiService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// 1. AI Climate Assistant Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { chatHistory, userMessage, userProfile, currentSeason } = req.body;
    const result = await chatWithClimateAssistantWithAI(
      chatHistory || [],
      userMessage,
      userProfile,
      currentSeason
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Chat API error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to generate response' });
  }
});

// 2. HSY & Espoo Waste / Recycling Classifier
app.post('/api/ai/classify-waste', async (req, res) => {
  try {
    const { query, imageBase64 } = req.body;
    const result = await classifyWasteWithAI(query, imageBase64);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Classify waste error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to classify waste' });
  }
});

// 3. Nord Pool Spot Energy & Sauna Optimizer
app.post('/api/ai/optimize-energy', async (req, res) => {
  try {
    const { userProfile, currentSeason, outdoorTemp, spotPrices } = req.body;
    const result = await optimizeDailyEnergyWithAI(
      userProfile,
      currentSeason,
      outdoorTemp,
      spotPrices
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Optimize energy error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to optimize energy' });
  }
});

// 4. HSL Commute & Journey Carbon Comparison
app.post('/api/ai/compare-commute', async (req, res) => {
  try {
    const { origin, destination } = req.body;
    const result = await compareCommuteEmissionsWithAI(origin, destination);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Compare commute error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to compare commute' });
  }
});

// 5. Personalized Espoo 2030 Roadmap 7-Day Sprint Generator
app.post('/api/ai/generate-roadmap-plan', async (req, res) => {
  try {
    const { userProfile, season } = req.body;
    const result = await generatePersonalizedRoadmapPlanWithAI(userProfile, season);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Generate roadmap plan error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to generate plan' });
  }
});

// Production static file serving
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export { app };

if (process.env.NODE_ENV === 'production' || process.env.RUN_SERVER === 'true') {
  app.listen(PORT, () => {
    console.log(`Espoo ClimatePulse Server running on port ${PORT}`);
  });
}
