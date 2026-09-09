import {
  AnalysisOutputValidationError,
  sanitizeAnalysisOutput,
} from './contract';
import { ProviderAnalysisError } from './evolink-responses';
import { ImageInputError, validateImageInput } from './image-input';

type AnalyzeImage = (dataUrl: string) => Promise<unknown>;

type AnalyzeHandlerDependencies = {
  analyze: AnalyzeImage;
};

type AnalyzeRequest = Pick<Request, 'formData'>;

function errorResponse(
  error: 'unsupported' | 'timeout' | 'analysis_failed',
  status: number
) {
  return Response.json({ error }, { status });
}

export function createAnalyzeHandler({
  analyze,
}: AnalyzeHandlerDependencies): (request: AnalyzeRequest) => Promise<Response> {
  return async (request) => {
    try {
      const formData = await request.formData();
      const image = formData.get('image');

      if (!(image instanceof File)) {
        return errorResponse('unsupported', 400);
      }

      const imageBytes = await image.arrayBuffer();
      const mimeType = await validateImageInput({
        type: image.type,
        size: image.size,
        arrayBuffer: async () => imageBytes,
      });
      const dataUrl = `data:${mimeType};base64,${Buffer.from(imageBytes).toString('base64')}`;
      const providerOutput = await analyze(dataUrl);
      const result = sanitizeAnalysisOutput(providerOutput);

      return Response.json(result);
    } catch (error) {
      if (error instanceof ImageInputError) {
        return errorResponse('unsupported', 415);
      }

      if (error instanceof ProviderAnalysisError && error.code === 'timeout') {
        return errorResponse('timeout', 504);
      }

      if (
        error instanceof ProviderAnalysisError ||
        error instanceof AnalysisOutputValidationError
      ) {
        return errorResponse('analysis_failed', 502);
      }

      return errorResponse('analysis_failed', 500);
    }
  };
}
