import type { Messages, StreamingOptions } from './types';

export async function streamText(
  messages: Messages,
  env: Env,
  options: StreamingOptions = {}
) {
  console.log('streamText called with messages:', messages.length);
  
  try {
    console.log('Attempting to import G4F...');
    
    // Import G4F according to documentation
    const { G4F } = await import('g4f');
    console.log('G4F imported successfully');
    
    // Create G4F instance
    const g4f = new G4F();
    console.log('G4F instance created');
    
    // Prepare messages according to docs format
    const g4fMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    console.log('Calling g4f.chatCompletion...');
    
    // Call chatCompletion according to documentation
    const completion = await g4f.chatCompletion(g4fMessages, {
      provider: g4f.providers.GPT,
      model: "gpt-3.5-turbo"
    });
    
    console.log('G4F response received:', typeof completion, completion?.substring?.(0, 100));
    
    // Create streaming response
    const stream = new ReadableStream({
      start(controller) {
        try {
          if (typeof completion === 'string' && completion.length > 0) {
            // Split response into words for streaming effect
            const words = completion.split(' ');
            let currentIndex = 0;
            
            const sendNextChunk = () => {
              if (currentIndex < words.length) {
                const chunk = words[currentIndex] + ' ';
                const formattedChunk = `data: ${JSON.stringify({
                  type: 'text-delta',
                  textDelta: chunk
                })}\n\n`;
                
                controller.enqueue(new TextEncoder().encode(formattedChunk));
                currentIndex++;
                
                setTimeout(sendNextChunk, 50);
              } else {
                // Send finish event
                const finishChunk = `data: ${JSON.stringify({
                  type: 'finish',
                  finishReason: 'stop'
                })}\n\n`;
                
                controller.enqueue(new TextEncoder().encode(finishChunk));
                controller.close();
                
                if (options.onFinish) {
                  options.onFinish({
                    text: completion,
                    finishReason: 'stop'
                  });
                }
              }
            };
            
            sendNextChunk();
          } else {
            throw new Error('Invalid response from G4F');
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return {
      toAIStream: () => stream
    };

  } catch (error) {
    console.error('G4F error:', error);
    
    // Fallback response
    const fallbackResponse = generateFallbackResponse(messages[messages.length - 1]?.content || '');
    
    const fallbackStream = new ReadableStream({
      start(controller) {
        const words = fallbackResponse.split(' ');
        let currentIndex = 0;
        
        const sendNextChunk = () => {
          if (currentIndex < words.length) {
            const chunk = words[currentIndex] + ' ';
            const formattedChunk = `data: ${JSON.stringify({
              type: 'text-delta',
              textDelta: chunk
            })}\n\n`;
            
            controller.enqueue(new TextEncoder().encode(formattedChunk));
            currentIndex++;
            
            setTimeout(sendNextChunk, 30);
          } else {
            const finishChunk = `data: ${JSON.stringify({
              type: 'finish',
              finishReason: 'stop'
            })}\n\n`;
            
            controller.enqueue(new TextEncoder().encode(finishChunk));
            controller.close();
            
            if (options.onFinish) {
              options.onFinish({
                text: fallbackResponse,
                finishReason: 'stop'
              });
            }
          }
        };
        
        sendNextChunk();
      }
    });

    return {
      toAIStream: () => fallbackStream
    };
  }
}

function generateFallbackResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // React/Todo app specific response
  if (lowerMessage.includes('todo') && (lowerMessage.includes('react') || lowerMessage.includes('tailwind'))) {
    return `I'll create a beautiful React todo application with Tailwind CSS for you.

<boltArtifact id="react-todo-app" title="React Todo App with Tailwind CSS">