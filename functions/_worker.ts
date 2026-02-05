interface Env {
  OPENAI_API_KEY: string;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

interface RequestBody {
  photo: string;
  height: string;
  weight: string;
}

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

async function handleConsult(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: RequestBody = await request.json();
    const { photo, height, weight } = body;

    if (!photo || !height || !weight) {
      return new Response(
        JSON.stringify({ error: '모든 필드를 입력해주세요.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Generate style report using Responses API
    const reportResponse = await fetch(
      'https://api.openai.com/v1/responses',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
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
      return new Response(
        JSON.stringify({ error: 'AI 분석 중 오류가 발생했습니다.', details: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
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

    // Convert base64 to blob
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const imageBlob = new Blob([bytes], { type: 'image/png' });

    // 2. Generate K-pop style outfit images using Images Edit API (3 parallel requests, 1x2 grid each)
    const basePrompt = `CRITICAL: Create a WIDE HORIZONTAL image with LEFT and RIGHT sections side-by-side (like a book spread). DO NOT stack vertically.
LEFT HALF: Person styled as K-pop idol, same face, bold outfit (faux fur/sequins/leather), full body, solid RED background.
RIGHT HALF: WHITE background, bold title "K-POP SINGER STYLING", 3-4 English sentences describing the style.
Layout: [PHOTO | TEXT] horizontally. Height: ${height}cm, Weight: ${weight}kg.`;

    const outfitPrompts = [
      basePrompt + ' Style variation 1: Vibrant colorful faux fur jacket with leather pants.',
      basePrompt + ' Style variation 2: Sequined blazer with fitted black trousers.',
      basePrompt + ' Style variation 3: Edgy crop top with high-waisted statement pants.',
    ];

    const outfitPromises = outfitPrompts.map(async (prompt) => {
      try {
        const formData = new FormData();
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
              'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
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

    return new Response(
      JSON.stringify({ report, outfitImages }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle API routes
    if (url.pathname === '/api/consult') {
      return handleConsult(request, env);
    }

    // Serve static assets
    return env.ASSETS.fetch(request);
  },
};
