import { TpaServer, TpaSession, ViewType } from '@augmentos/sdk';
import * as fs from 'fs';
import * as path from 'path';

const PACKAGE_NAME = process.env.PACKAGE_NAME ?? (() => { throw new Error('PACKAGE_NAME is not set in .env file'); })();
const AUGMENTOS_API_KEY = process.env.AUGMENTOS_API_KEY ?? (() => { throw new Error('AUGMENTOS_API_KEY is not set in .env file'); })();
const APPLICATION_PORT = parseInt(process.env.APPLICATION_PORT || '3000');
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '4000');

async function getAsciiArt(imagePath: string) {
  const formData = new FormData();
  formData.append('file', Bun.file(imagePath)); // Bun.file is required for file uploads

  const response = await fetch(`http://localhost:${SERVER_PORT}/ascii-art`, {
    method: 'POST',
    body: formData
    // Do NOT set headers manually; Bun handles them
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get ASCII art: ${response.status} ${response.statusText} - ${errorText}`);
  }
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
        // Check if file exists before processing
        if (!fs.existsSync(imagePath)) {
          console.warn('File does not exist, skipping:', imagePath);
          return;
        }
        const asciiArt = await getAsciiArt(imagePath);
        latestAsciiArt = asciiArt;
        // Display on glasses
        // You may want to call session.layouts.showTextWall(asciiArt) here
        // Then delete or move the file
        const maxAttempts = 5;
        let attempt = 0;
        function tryDelete() {
          fs.unlink(imagePath, (err) => {
            if (err && err.code === 'EPERM' && attempt < maxAttempts) {
              attempt++;
              setTimeout(tryDelete, 2000); // Retry after 2000ms
            } else if (err && err.code !== 'ENOENT') {
              // Only log errors that are not 'file not found'
              console.error('Error deleting file:', err);
            }
            // If ENOENT, do nothing (file already deleted)
          });
        }
        setTimeout(tryDelete, 2000); // Initial delay to ensure file is released
      } catch (err) {
        if (err.code === 'ENOENT') {
          // File was already deleted, ignore
          console.warn('File already deleted, skipping:', imagePath);
        } else {
          console.error('Error processing image:', err);
        }
      }
    }, 1000);
  }
});

let latestAsciiArt: string | null = null;

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

    // Show latest ASCII art if available
    if (latestAsciiArt) {
      session.layouts.showTextWall(latestAsciiArt);
    }

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