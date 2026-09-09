import { AIFile, AIMediaType, AIProvider } from './types';

export * from './types';

/**
 * AI Manager to manage all AI providers
 */
export class AIManager {
  // ai providers
  private providers: AIProvider[] = [];
  // default ai provider
  private defaultProvider?: AIProvider;

  // add ai provider
  addProvider(provider: AIProvider, isDefault = false) {
    this.providers.push(provider);
    if (isDefault) {
      this.defaultProvider = provider;
    }
  }

  // get provider by name
  getProvider(name: string): AIProvider | undefined {
    return this.providers.find((p) => p.name === name);
  }

  // get all provider names
  getProviderNames(): string[] {
    return this.providers.map((p) => p.name);
  }

  // get all media types
  getMediaTypes(): string[] {
    return Object.values(AIMediaType);
  }

  getDefaultProvider(): AIProvider | undefined {
    // set default provider if not set
    if (!this.defaultProvider && this.providers.length > 0) {
      this.defaultProvider = this.providers[0];
    }

    return this.defaultProvider;
  }
}

// save files to custom storage
export async function saveFiles(files: AIFile[]) {
  try {
    const { getStorageService } = await import('@/shared/services/storage');
    const storageService = await getStorageService();

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const result = await storageService.downloadAndUpload({
          url: file.url,
          contentType: file.contentType,
          key: file.key,
        });
        return {
          ...file,
          url: result.url,
        } as AIFile;
      })
    );

    return uploadedFiles;
  } catch (error) {
    console.error('save files failed:', error);
    return undefined;
  }
}

// ai manager
export const aiManager = new AIManager();

export * from './kie';
export * from './replicate';
export * from './gemini';
export * from './fal';
