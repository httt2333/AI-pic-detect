export type ContainedImageFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function getContainedImageFrame(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number
): ContainedImageFrame {
  const scale = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight
  );
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    left: (containerWidth - width) / 2,
    top: (containerHeight - height) / 2,
    width,
    height,
  };
}
