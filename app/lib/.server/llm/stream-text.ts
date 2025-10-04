import type { Messages, StreamingOptions } from './types';

const PUTER_API_URL = 'https://api.puter.com/drivers/call';
const PUTER_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiYXUiLCJ2IjoiMC4wLjAiLCJ1dSI6ImhBL2lzV09FVGd5S2E0aUgybElPUmc9PSIsImF1IjoiWVk0a2xSSktUQ0NHNlh1cHQwa3RFdz09IiwicyI6IitKWmRrVUtod1ZlaDl0NEZsT1dZcWc9PSIsImlhdCI6MTc1ODk4MTI5Nn0.Q0fAI35LUONd7JqMDuFZbqtwZQ4c4zZdZF9EWhgpLoI';

export async function streamText(
  messages: Messages,
  env: Env,
  options: StreamingOptions = {}
) {
  try {
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(PUTER_API_URL, {
            method: 'POST',
            headers: {
              'accept': '*/*',
              'accept-language': 'en-US,en;q=0.9',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              interface: 'puter-chat-completion',
              driver: 'claude',
              test_mode: false,
              method: 'complete',
              args: {
                messages: formattedMessages,
                model: 'claude-sonnet-4-20250514',
                stream: false
              },
              auth_token: PUTER_AUTH_TOKEN
            })
          });

          if (!response.ok) {
            throw new Error(`Puter API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();

          let fullText = '';

          if (data.result && data.result.message && data.result.message.content) {
            fullText = data.result.message.content;
          } else if (typeof data === 'string') {
            fullText = data;
          } else {
            throw new Error('Unexpected response format from Puter API');
          }

          const words = fullText.split(' ');
          for (const word of words) {
            const formattedChunk = `data: ${JSON.stringify({
              type: 'text-delta',
              textDelta: word + ' '
            })}\n\n`;

            controller.enqueue(new TextEncoder().encode(formattedChunk));

            await new Promise(resolve => setTimeout(resolve, 30));
          }

          const finishChunk = `data: ${JSON.stringify({
            type: 'finish',
            finishReason: 'stop'
          })}\n\n`;

          controller.enqueue(new TextEncoder().encode(finishChunk));
          controller.close();

          if (options.onFinish) {
            await options.onFinish({
              text: fullText,
              finishReason: 'stop'
            });
          }

        } catch (error) {
          console.error('Puter API streaming error:', error);
          controller.error(error);
        }
      }
    });

    return {
      toAIStream: () => stream
    };

  } catch (error) {
    console.error('Puter API error:', error);
    throw error;
  }
}