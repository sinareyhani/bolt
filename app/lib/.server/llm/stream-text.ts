import { G4F } from '@gpt4free/g4f.dev';
import type { Messages, StreamingOptions } from './types';

const g4f = new G4F();

export async function streamText(
  messages: Messages,
  env: Env,
  options: StreamingOptions = {}
) {
  try {
    // Convert messages to the format expected by g4f
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await g4f.chatCompletion({
            messages: formattedMessages,
            model: 'gpt-4',
            provider: 'Bing',
            stream: true
          });

          if (response && typeof response === 'object' && Symbol.asyncIterator in response) {
            // Handle streaming response
            for await (const chunk of response as AsyncIterable<any>) {
              if (chunk && chunk.choices && chunk.choices[0] && chunk.choices[0].delta) {
                const content = chunk.choices[0].delta.content;
                if (content) {
                  const formattedChunk = `data: ${JSON.stringify({
                    type: 'text-delta',
                    textDelta: content
                  })}\n\n`;
                  
                  controller.enqueue(new TextEncoder().encode(formattedChunk));
                }
              }
            }
          } else if (typeof response === 'string') {
            // Handle non-streaming response
            const words = response.split(' ');
            for (const word of words) {
              const formattedChunk = `data: ${JSON.stringify({
                type: 'text-delta',
                textDelta: word + ' '
              })}\n\n`;
              
              controller.enqueue(new TextEncoder().encode(formattedChunk));
              
              // Add small delay to simulate streaming
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }

          // Send finish event
          const finishChunk = `data: ${JSON.stringify({
            type: 'finish',
            finishReason: 'stop'
          })}\n\n`;
          
          controller.enqueue(new TextEncoder().encode(finishChunk));
          controller.close();

          // Call onFinish callback if provided
          if (options.onFinish) {
            const fullText = typeof response === 'string' ? response : '';
            await options.onFinish({
              text: fullText,
              finishReason: 'stop'
            });
          }

        } catch (error) {
          console.error('G4F streaming error:', error);
          controller.error(error);
        }
      }
    });

    return {
      toAIStream: () => stream
    };

  } catch (error) {
    console.error('G4F error:', error);
    throw error;
  }
}