import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import {
  chatWithClimateAssistantWithAI,
  classifyWasteWithAI,
  optimizeDailyEnergyWithAI,
  compareCommuteEmissionsWithAI,
  generatePersonalizedRoadmapPlanWithAI,
} from './src/server/geminiService.ts';

dotenv.config();

function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const readBody = () =>
          new Promise<any>((resolve, reject) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch (e) {
                reject(e);
              }
            });
            req.on('error', reject);
          });

        res.setHeader('Content-Type', 'application/json');

        try {
          const body = await readBody();
          const url = req.url.split('?')[0];

          if (url === '/api/ai/chat') {
            const result = await chatWithClimateAssistantWithAI(
              body.chatHistory || [],
              body.userMessage,
              body.userProfile,
              body.currentSeason
            );
            res.end(JSON.stringify({ success: true, data: result }));
            return;
          }

          if (url === '/api/ai/classify-waste') {
            const result = await classifyWasteWithAI(body.query, body.imageBase64);
            res.end(JSON.stringify({ success: true, data: result }));
            return;
          }

          if (url === '/api/ai/optimize-energy') {
            const result = await optimizeDailyEnergyWithAI(
              body.userProfile,
              body.currentSeason,
              body.outdoorTemp,
              body.spotPrices
            );
            res.end(JSON.stringify({ success: true, data: result }));
            return;
          }

          if (url === '/api/ai/compare-commute') {
            const result = await compareCommuteEmissionsWithAI(
              body.origin,
              body.destination
            );
            res.end(JSON.stringify({ success: true, data: result }));
            return;
          }

          if (url === '/api/ai/generate-roadmap-plan') {
            const result = await generatePersonalizedRoadmapPlanWithAI(
              body.userProfile,
              body.season
            );
            res.end(JSON.stringify({ success: true, data: result }));
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
        } catch (error: any) {
          console.error('API Middleware error:', error);
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              success: false,
              error: error?.message || 'Internal server error',
            })
          );
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiDevMiddleware()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
