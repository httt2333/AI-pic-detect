import { describe, expect, it } from 'vitest';

import { getContainedImageFrame } from './bbox';

describe('getContainedImageFrame', () => {
  it('centers a landscape image inside a portrait review stage', () => {
    expect(getContainedImageFrame(400, 500, 1600, 900)).toEqual({
      left: 0,
      top: 137.5,
      width: 400,
      height: 225,
    });
  });

  it('centers a square image inside a portrait review stage', () => {
    expect(getContainedImageFrame(400, 500, 1000, 1000)).toEqual({
      left: 0,
      top: 50,
      width: 400,
      height: 400,
    });
  });

  it('uses the complete review stage when the image aspect ratio matches', () => {
    expect(getContainedImageFrame(400, 500, 800, 1000)).toEqual({
      left: 0,
      top: 0,
      width: 400,
      height: 500,
    });
  });
});
