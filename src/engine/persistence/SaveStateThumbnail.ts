import { validateThumbnail } from './SaveState';

export function captureSaveThumbnail(source: HTMLCanvasElement, width = 160, height = 120) {
  try {
    const output = source.ownerDocument.createElement('canvas');
    output.width = width;
    output.height = height;
    const context = output.getContext('2d');
    if (!context) return undefined;
    context.imageSmoothingEnabled = false;
    context.drawImage(source, 0, 0, width, height);
    return validateThumbnail(output.toDataURL('image/webp', 0.72));
  } catch {
    return undefined;
  }
}
