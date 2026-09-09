import Replicate from 'replicate';

import { getUuid } from '@/shared/lib/hash';

import { saveFiles } from '.';
import {
  AIConfigs,
  AIFile,
  AIGenerateParams,
  AIImage,
  AIMediaType,
  AIProvider,
  AISong,
  AITaskResult,
  AITaskStatus,
  AIVideo,
} from './types';

/**
 * Replicate configs
 * @docs https://replicate.com/
 */
export interface ReplicateConfigs extends AIConfigs {
  baseUrl?: string;
  apiToken: string;
  customStorage?: boolean; // use custom storage to save files
}

/**
 * Replicate provider
 * @docs https://replicate.com/
 */
export class ReplicateProvider implements AIProvider {
  // provider name
  readonly name = 'replicate';
  // provider configs
  configs: ReplicateConfigs;

  client: Replicate;

  // init provider
  constructor(configs: ReplicateConfigs) {
    this.configs = configs;
    this.client = new Replicate({
      auth: this.configs.apiToken,
    });
  }

  // generate task
  async generate({
    params,
  }: {
    params: AIGenerateParams;
  }): Promise<AITaskResult> {
    const { mediaType, model, prompt, options, async, callbackUrl } = params;

    if (!mediaType) {
      throw new Error('mediaType is required');
    }

    if (!model) {
      throw new Error('model is required');
    }

    if (!prompt) {
      throw new Error('prompt is required');
    }

    // build request params
    const input: any = this.formatInput({
      mediaType,
      model,
      prompt,
      options,
    });

    const isValidCallbackUrl =
      callbackUrl &&
      callbackUrl.startsWith('http') &&
      !callbackUrl.includes('localhost') &&
      !callbackUrl.includes('127.0.0.1');

    console.log('replicate input', input);

    const output = await this.client.predictions.create({
      model,
      input,
      webhook: isValidCallbackUrl ? callbackUrl : undefined,
      webhook_events_filter: isValidCallbackUrl ? ['completed'] : undefined,
    });

    return {
      taskStatus: AITaskStatus.PENDING,
      taskId: output.id,
      taskInfo: {},
      taskResult: output,
    };
  }

  // query task
  async query({
    taskId,
    mediaType,
  }: {
    taskId: string;
    mediaType?: AIMediaType;
  }): Promise<AITaskResult> {
    const data = await this.client.predictions.get(taskId);

    let images: AIImage[] | undefined = undefined;
    let videos: AIVideo[] | undefined = undefined;

    if (data.output) {
      if (mediaType === AIMediaType.VIDEO) {
        // handle video output
        if (Array.isArray(data.output)) {
          videos = data.output.map((video: any) => ({
            id: '',
            createTime: new Date(data.created_at),
            videoUrl: video,
          }));
        } else if (typeof data.output === 'string') {
          videos = [
            {
              id: '',
              createTime: new Date(data.created_at),
              videoUrl: data.output,
            },
          ];
        }
      } else {
        // handle image output (default)
        if (Array.isArray(data.output)) {
          images = data.output.map((image: any) => ({
            id: '',
            createTime: new Date(data.created_at),
            imageUrl: image,
          }));
        } else if (typeof data.output === 'string') {
          images = [
            {
              id: '',
              createTime: new Date(data.created_at),
              imageUrl: data.output,
            },
          ];
        }
      }
    }

    const taskStatus = this.mapStatus(data.status);

    // save files to custom storage
    if (taskStatus === AITaskStatus.SUCCESS && this.configs.customStorage) {
      // save images
      if (images && images.length > 0) {
        const filesToSave: AIFile[] = [];
        images.forEach((image, index) => {
          if (image.imageUrl) {
            filesToSave.push({
              url: image.imageUrl,
              contentType: 'image/png',
              key: `replicate/image/${getUuid()}.png`,
              index: index,
              type: 'image',
            });
          }
        });

        if (filesToSave.length > 0) {
          const uploadedFiles = await saveFiles(filesToSave);
          if (uploadedFiles) {
            uploadedFiles.forEach((file: AIFile) => {
              if (file && file.url && images && file.index !== undefined) {
                const image = images[file.index];
                if (image) {
                  image.imageUrl = file.url;
                }
              }
            });
          }
        }
      }

      // save videos
      if (videos && videos.length > 0) {
        const filesToSave: AIFile[] = [];
        videos.forEach((video, index) => {
          if (video.videoUrl) {
            filesToSave.push({
              url: video.videoUrl,
              contentType: 'video/mp4',
              key: `replicate/video/${getUuid()}.mp4`,
              index: index,
              type: 'video',
            });
          }
        });

        if (filesToSave.length > 0) {
          const uploadedFiles = await saveFiles(filesToSave);
          if (uploadedFiles) {
            uploadedFiles.forEach((file: AIFile) => {
              if (file && file.url && videos && file.index !== undefined) {
                const video = videos[file.index];
                if (video) {
                  video.videoUrl = file.url;
                }
              }
            });
          }
        }
      }
    }

    return {
      taskId,
      taskStatus,
      taskInfo: {
        images,
        videos,
        status: data.status,
        errorCode: '',
        errorMessage: data.error as string,
        createTime: new Date(data.created_at),
      },
      taskResult: data,
    };
  }

  // map status
  private mapStatus(status: string): AITaskStatus {
    switch (status) {
      case 'starting':
        return AITaskStatus.PENDING;
      case 'processing':
        return AITaskStatus.PROCESSING;
      case 'succeeded':
        return AITaskStatus.SUCCESS;
      case 'failed':
        return AITaskStatus.FAILED;
      case 'canceled':
        return AITaskStatus.CANCELED;
      default:
        throw new Error(`unknown status: ${status}`);
    }
  }

  private formatInput({
    mediaType,
    model,
    prompt,
    options,
  }: {
    mediaType: AIMediaType;
    model: string;
    prompt: string;
    options: any;
  }): any {
    let input: any = {
      prompt,
    };

    if (!options) {
      return input;
    }

    // input with all custom options
    input = {
      ...input,
      ...options,
    };

    // default options
    // image_input
    // duration
    // aspect_ratio

    // image_input transform
    if (options.image_input && Array.isArray(options.image_input)) {
      if (['black-forest-labs/flux-2-pro'].includes(model)) {
        input.input_images = options.image_input;
        delete input.image_input;
      } else if (['google/veo-3.1'].includes(model)) {
        input.reference_images = input.image_input;
        delete input.image_input;
      } else if (['openai/sora-2'].includes(model)) {
        input.input_reference = options.image_input[0];
        delete input.image_input;
      }
    }

    // duration transform
    if (options.duration) {
      if (['openai/sora-2'].includes(model)) {
        input.seconds = Number(options.duration);
        delete input.duration;
      }
    }

    return input;
  }
}
