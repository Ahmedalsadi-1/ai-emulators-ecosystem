export const normalizeToPixel = (
  value: number,
  max: number,
): number => {
  if (Number.isNaN(value)) return 0;
  if (value >= 0 && value <= 1) {
    return Math.round(value * max);
  }
  return Math.round(value);
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const buildNormalizedCoords = (
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number } => ({
  x: width > 0 ? x / width : 0,
  y: height > 0 ? y / height : 0,
});
