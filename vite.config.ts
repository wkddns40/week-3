import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { config } from 'dotenv'

// Load .env for local development
config({ path: '.env' })

interface ReportData {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

interface ImageData {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
}

function apiPlugin(): Plugin {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/consult', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const { photo, height, weight } = JSON.parse(body);

            if (!photo || !height || !weight) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '모든 필드를 입력해주세요.' }));
              return;
            }

            const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
            if (!OPENAI_API_KEY) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'API 키가 설정되지 않았습니다.' }));
              return;
            }

            // 1. Generate style report using Responses API
            const reportResponse = await fetch(
              'https://api.openai.com/v1/responses',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                  prompt: {
                    id: 'pmpt_69746eac15448194bb554248a6918b2202f145b5e23338b6',
                    version: '3',
                  },
                  input: [
                    {
                      type: 'message',
                      role: 'user',
                      content: [
                        {
                          type: 'input_image',
                          image_url: photo,
                        },
                        {
                          type: 'input_text',
                          text: `키: ${height}cm, 몸무게: ${weight}kg`,
                        },
                      ],
                    },
                  ],
                }),
              }
            );

            if (!reportResponse.ok) {
              const errorText = await reportResponse.text();
              console.error('OpenAI Report API Error:', errorText);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI 분석 중 오류가 발생했습니다.', details: errorText }));
              return;
            }

            const reportData = await reportResponse.json() as ReportData;

            // Extract text from response
            let report = '보고서를 생성할 수 없습니다.';
            if (reportData.output && Array.isArray(reportData.output)) {
              const messageOutput = reportData.output.find((item) => item.type === 'message');
              if (messageOutput?.content && Array.isArray(messageOutput.content)) {
                const textContent = messageOutput.content.find((c) => c.type === 'output_text');
                if (textContent?.text) {
                  report = textContent.text;
                }
              }
            }

            // 2. Generate K-pop style outfit images using Images Edit API (3 parallel requests, 1x2 grid each)
            const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');

            const basePrompt = `CRITICAL: Create a WIDE HORIZONTAL image with LEFT and RIGHT sections side-by-side (like a book spread). DO NOT stack vertically.
LEFT HALF: Person styled as K-pop idol, same face, bold outfit (faux fur/sequins/leather), a full-body to knee, solid RED background.
RIGHT HALF: WHITE background, bold title "K-POP SINGER STYLING", 3-4 English sentences describing the style.
Layout: [PHOTO | TEXT] horizontally. Height: ${height}cm, Weight: ${weight}kg.`;

            const outfitPrompts = [
              basePrompt + ' Style variation 1: fancy leather jacket with leather skirt.',
              basePrompt + ' Style variation 2: Sequined jacket with fitted trousers.',
              basePrompt + ' Style variation 3: grammy awards dress',
            ];

            const outfitPromises = outfitPrompts.map(async (prompt) => {
              try {
                const formData = new FormData();
                const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
                formData.append('image', imageBlob, 'photo.png');
                formData.append('prompt', prompt);
                formData.append('model', 'gpt-image-1');
                formData.append('n', '1');
                formData.append('size', '1024x1024');

                const response = await fetch(
                  'https://api.openai.com/v1/images/edits',
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    },
                    body: formData,
                  }
                );

                if (response.ok) {
                  const data = await response.json() as ImageData;
                  if (data.data?.[0]?.b64_json) {
                    return `data:image/png;base64,${data.data[0].b64_json}`;
                  } else if (data.data?.[0]?.url) {
                    return data.data[0].url;
                  }
                } else {
                  const errorText = await response.text();
                  console.error('OpenAI Outfit API Error:', errorText);
                }
              } catch (err) {
                console.error('Outfit generation error:', err);
              }
              return null;
            });

            const outfitResults = await Promise.all(outfitPromises);

            // Collect all generated images into outfitImages array
            const outfitImages: string[] = [];
            for (const img of outfitResults) {
              if (img) {
                outfitImages.push(img);
              }
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ report, outfitImages }));
          } catch (error) {
            console.error('Error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: '서버 오류가 발생했습니다.' }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
  base: process.env.GITHUB_PAGES ? '/week-3/' : '/',
  server: {
    port: 9002,
    host: '0.0.0.0',
  },
})
