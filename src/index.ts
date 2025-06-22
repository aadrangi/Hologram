import { TpaServer, TpaSession, ViewType } from '@augmentos/sdk'; 
import fetch from 'node-fetch';
import FormData from 'form-data';
import * as fs from 'fs';

const PACKAGE_NAME = process.env.PACKAGE_NAME ?? (() => { throw new Error('PACKAGE_NAME is not set in .env file'); })();
const AUGMENTOS_API_KEY = process.env.AUGMENTOS_API_KEY ?? (() => { throw new Error('AUGMENTOS_API_KEY is not set in .env file'); })();
const PORT = parseInt(process.env.PORT || '3000');

async function getAsciiArt(imagePath: string) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(imagePath));
  // Optionally: formData.append('pad_color', '0');

  const response = await fetch('http://localhost:8080/ascii-art', {
    method: 'POST',
    body: formData as any,
  });

  if (!response.ok) throw new Error('Failed to get ASCII art');
  const asciiArt = await response.text();
  return asciiArt;
}

class ExampleAugmentOSApp extends TpaServer {

  constructor() {
    
    super({
      packageName: PACKAGE_NAME,
      apiKey: AUGMENTOS_API_KEY,
      port: PORT,
    });
  }

  protected async onSession(session: TpaSession, sessionId: string, userId: string): Promise<void> {

    // Show welcome message
    session.layouts.showTextWall("Example App is ready!");

    // Handle real-time transcription
    // requires microphone permission to be set in the developer console
    const eventHandlers = [
      session.events.onTranscription((data) => {
        if (data.isFinal) {
          session.layouts.showTextWall("You said: " + data.text, {
            view: ViewType.MAIN,
            durationMs: 3000
          });
        }
      }),

      session.events.onGlassesBattery((data) => {
        console.log('Glasses battery:', data);
      })
    ];

    // Add cleanup handlers
    eventHandlers.forEach(eventHandler => this.addCleanupHandler(eventHandler));
  }
  // Example function to send an image to FastAPI and get ASCII art


}

// Start the server
// DEV CONSOLE URL: https://console.augmentos.org/
// Get your webhook URL from ngrok (or whatever public URL you have)
const app = new ExampleAugmentOSApp();

app.start().catch(console.error);