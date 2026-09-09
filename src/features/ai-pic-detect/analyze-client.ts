import type { ReviewResponse } from './types';

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export async function analyzeRealImage(
  file: File,
  fetcher: Fetcher = fetch
): Promise<ReviewResponse> {
  const formData = new FormData();
  formData.append('image', file);

  let response: Response;
  try {
    response = await fetcher('/api/ai-pic-detect/analyze', {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error('analysis_failed');
  }

  if (!response.ok) {
    if (response.status === 415 || response.status === 400) {
      throw new Error('unsupported');
    }
    if (response.status === 504) {
      throw new Error('analysis_timeout');
    }
    throw new Error('analysis_failed');
  }

  try {
    return (await response.json()) as ReviewResponse;
  } catch {
    throw new Error('analysis_failed');
  }
}
