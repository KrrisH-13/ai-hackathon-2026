import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  chatWithClimateAssistantWithAI,
  classifyWasteWithAI,
  optimizeDailyEnergyWithAI,
  compareCommuteEmissionsWithAI,
  generatePersonalizedRoadmapPlanWithAI,
  generateEcoPilotRecommendationsWithAI,
  extractPreferencesWithGemini,
  reasonRecommendationWithGemini,
  generateExplanationWithGemini,
  learnFeedbackWithGemini,
  generateDailyPlanWithGemini,
  askEcoPilotWithGemini,
} from './src/server/geminiService';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'EcoPilot API' });
  });

  // Public Data: Fingrid Grid Status
  app.get('/api/data/fingrid', async (req, res) => {
    try {
      const now = new Date();
      const hour = now.getHours();
      const isNight = hour >= 23 || hour <= 5;
      const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
      const baseConsumption = isNight ? 7850 : isPeak ? 11100 : 9650;
      const nuclearMW = 4380;
      const windMW = 2400 + Math.round(Math.sin(hour / 3) * 550);
      const hydroMW = 2100 + (isPeak ? 650 : 0);
      const solarMW = hour >= 6 && hour <= 19 ? Math.max(0, Math.round(Math.sin(((hour - 6) / 13) * Math.PI) * 420)) : 0;
      const chpMW = 1150;
      const totalProd = nuclearMW + windMW + hydroMW + solarMW + chpMW;
      const netBalance = totalProd - baseConsumption;
      const cleanShare = Math.min(99, Math.round(((nuclearMW + windMW + hydroMW + solarMW) / totalProd) * 100));
      const emissionFactor = Math.round(36 + (100 - cleanShare) * 1.1);

      res.json({
        success: true,
        data: {
          timestamp: now.toISOString(),
          consumptionMW: baseConsumption,
          productionMW: totalProd,
          windProductionMW: windMW,
          nuclearProductionMW: nuclearMW,
          hydroProductionMW: hydroMW,
          solarProductionMW: solarMW,
          netExportImportMW: netBalance,
          emissionFactorGCO2PerKWh: emissionFactor,
          systemStatus: {
            timestamp: now.toISOString(),
            state: 'NORMAL',
            stateDescription: 'Kantaverkon käyttötila normaali (Fingrid Grid Balance Normal)',
            surplusDeficitMW: netBalance,
            freshness: 'demo',
            source: 'Fingrid Open Data Baseline Model',
          },
          cleanEnergySharePercent: cleanShare,
          source: 'Fingrid Open Data (data.fingrid.fi)',
          freshness: 'demo',
          lastUpdated: now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Public Data: Spot Prices
  app.get('/api/data/electricity-prices', async (req, res) => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const hourlyBaseCents = [
        3.2, 2.8, 2.4, 2.1, 2.5, 4.8, 8.9, 14.2, 16.5, 12.1,
        9.4, 8.6, 7.8, 6.9, 8.2, 11.4, 15.8, 19.4, 17.2, 11.5,
        6.8, 4.2, 3.8, 3.4,
      ];
      const hourlyPrices = hourlyBaseCents.map((cents, h) => ({
        timestamp: `${dateStr}T${String(h).padStart(2, '0')}:00:00.000Z`,
        hour: h,
        priceCentsPerKWh: cents,
        priceEurPerKWh: Number((cents / 100).toFixed(4)),
        area: 'FI',
        source: 'Nordic Electricity Spot Baseline Model',
        freshness: 'demo' as const,
        isCleanPeak: h >= 21 || h <= 5,
        isPriceValley: cents <= 4.5,
      }));
      const currentHour = now.getHours();
      const currentPrice = hourlyPrices[currentHour]?.priceCentsPerKWh ?? 8.5;
      const avg = Number((hourlyBaseCents.reduce((a, b) => a + b, 0) / hourlyBaseCents.length).toFixed(2));
      const min = Math.min(...hourlyBaseCents);
      const max = Math.max(...hourlyBaseCents);

      res.json({
        success: true,
        data: {
          currentHourPriceCents: currentPrice,
          averagePriceCents: avg,
          minPriceCents: min,
          maxPriceCents: max,
          bestSaunaWindow: '21:30 - 23:30 (Yön halvat tuulitunnit)',
          bestSaunaPriceCents: 3.2,
          hourlyPrices,
          source: 'Nordic Day-Ahead Spot API',
          freshness: 'demo',
          lastUpdated: now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // FUNCTION 1: Extract Preferences
  app.post('/api/ai/extract-preferences', async (req, res) => {
    try {
      const { userInput, currentProfile } = req.body;
      const result = await extractPreferencesWithGemini(userInput || '', currentProfile);
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('API /api/ai/extract-preferences error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // FUNCTION 2: Recommendation Reasoning
  app.post('/api/ai/reason-recommendation', async (req, res) => {
    try {
      const { userProfile, candidateActions, observation, previousFeedback } = req.body;
      const result = await reasonRecommendationWithGemini({
        userProfile,
        candidateActions: candidateActions || [],
        observation,
        previousFeedback,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('API /api/ai/reason-recommendation error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // FUNCTION 3: Generate Explanation ("Why am I seeing this?")
  app.post('/api/ai/generate-explanation', async (req, res) => {
    try {
      const { actionId, actionTitle, userProfile, observation, candidateActions } = req.body;
      const result = await generateExplanationWithGemini({
        actionId,
        actionTitle,
        userProfile,
        observation,
        candidateActions,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('API /api/ai/generate-explanation error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // FUNCTION 4: Feedback Learning
  app.post('/api/ai/learn-feedback', async (req, res) => {
    try {
      const { actionId, actionTitle, userFeedback, userProfile } = req.body;
      const result = await learnFeedbackWithGemini({
        actionId,
        actionTitle,
        userFeedback: userFeedback || '',
        userProfile,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('API /api/ai/learn-feedback error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // FUNCTION 5: Daily Plan
  app.post('/api/ai/daily-plan', async (req, res) => {
    try {
      const { userProfile, observation, candidateActions } = req.body;
      const result = await generateDailyPlanWithGemini(
        userProfile,
        observation,
        candidateActions || []
      );
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('API /api/ai/daily-plan error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // FUNCTION 6: Natural Language Assistant ("Ask EcoPilot")
  app.post('/api/ai/ask-ecopilot', async (req, res) => {
    try {
      const { query, userProfile, observation, candidateActions } = req.body;
      const result = await askEcoPilotWithGemini({
        query: query || '',
        userProfile,
        observation,
        candidateActions,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('API /api/ai/ask-ecopilot error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // General Chat
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { chatHistory, userMessage, userProfile, currentSeason } = req.body;
      const result = await chatWithClimateAssistantWithAI(
        chatHistory || [],
        userMessage || '',
        userProfile,
        currentSeason || 'winter'
      );
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('API /api/ai/chat error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Legacy endpoints for specialized sub-views
  app.post('/api/ai/classify-waste', async (req, res) => {
    try {
      const { query, imageBase64 } = req.body;
      const result = await classifyWasteWithAI(query, imageBase64);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/ai/optimize-energy', async (req, res) => {
    try {
      const { userProfile, currentSeason, outdoorTemp, spotPrices } = req.body;
      const result = await optimizeDailyEnergyWithAI(userProfile, currentSeason, outdoorTemp, spotPrices || []);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/ai/compare-commute', async (req, res) => {
    try {
      const { origin, destination } = req.body;
      const result = await compareCommuteEmissionsWithAI(origin, destination);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/ai/generate-roadmap-plan', async (req, res) => {
    try {
      const { userProfile, season } = req.body;
      const result = await generatePersonalizedRoadmapPlanWithAI(userProfile, season);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/ai/ecopilot-recommendations', async (req, res) => {
    try {
      const { userProfile, observation, candidateActions } = req.body;
      const result = await generateEcoPilotRecommendationsWithAI(
        userProfile,
        observation,
        candidateActions || []
      );
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development / Static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoPilot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
