import { TpaServer, TpaSession, ViewType } from '@augmentos/sdk';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

const PACKAGE_NAME = process.env.PACKAGE_NAME ?? (() => { throw new Error('PACKAGE_NAME is not set in .env file'); })();
const AUGMENTOS_API_KEY = process.env.AUGMENTOS_API_KEY ?? (() => { throw new Error('AUGMENTOS_API_KEY is not set in .env file'); })();
const APPLICATION_PORT = parseInt(process.env.APPLICATION_PORT || '3000');
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '4000');

async function getAsciiArt(imagePath: string) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(imagePath));

  const response = await fetch(`http://localhost:${SERVER_PORT}/ascii-art`, {
    method: 'POST',
    body: formData as any,
    headers: formData.getHeaders(),
  });

  if (!response.ok) throw new Error('Failed to get ASCII art');
  const asciiArt = await response.text();
  return asciiArt;
}



const uploadFolder = 'c:/image_uploads';

fs.watch(uploadFolder, (eventType, filename) => {
  if (filename && /\.(jpg|jpeg|png)$/i.test(filename)) {
    const imagePath = path.join(uploadFolder, filename);
    // Wait a moment to ensure the file is fully written
    setTimeout(async () => {
      try {
        const asciiArt = await getAsciiArt(imagePath);
        // Display on glasses
        // You may want to call session.layouts.showTextWall(asciiArt) here
        // Then delete or move the file
        fs.unlinkSync(imagePath);
      } catch (err) {
        console.error('Error processing image:', err);
      }
    }, 1000);
  }
});

class ExampleAugmentOSApp extends TpaServer {

  constructor() {
    
    super({
      packageName: PACKAGE_NAME,
      apiKey: AUGMENTOS_API_KEY,
      port: APPLICATION_PORT,
    });
  }

  protected async onSession(session: TpaSession, sessionId: string, userId: string): Promise<void> {

    // Show welcome message
    session.layouts.showTextWall("Hologram App is ready.");

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