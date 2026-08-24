import sharp from 'sharp';
import { log } from '../logger';
import { config } from '../config';

const logger = log('watermark');

export interface WatermarkOptions {
  text?: string;
  imagePath?: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile';
  opacity: number;
}

export async function applyWatermark(buffer: Buffer, options: WatermarkOptions): Promise<Buffer> {
  if (!config.features.watermark.enabled) return buffer;

  const { text, imagePath, position, opacity } = options;

  try {
    let pipeline = sharp(buffer);

    if (text) {
      const svgText = `
        <svg width="100%" height="100%">
          <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="white" fill-opacity="${opacity / 100}" text-anchor="middle" dominant-baseline="middle" transform="rotate(-25 500 500)">
            ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </text>
        </svg>
      `;

      pipeline = pipeline.composite([
        {
          input: Buffer.from(svgText),
          gravity: positionToGravity(position),
        },
      ]);
    } else if (imagePath) {
      try {
        const watermarkBuffer = await sharp(imagePath).resize(200).toBuffer();
        pipeline = pipeline.composite([
          {
            input: watermarkBuffer,
            gravity: positionToGravity(position),
          },
        ]);
      } catch {
        logger.warn('failed to load watermark image', { imagePath });
        return buffer;
      }
    }

    return pipeline.toBuffer();
  } catch {
    logger.warn('failed to apply watermark');
    return buffer;
  }
}

function positionToGravity(
  position: WatermarkOptions['position'],
): sharp.Gravity | undefined {
  switch (position) {
    case 'top-left':
      return 'northwest';
    case 'top-right':
      return 'northeast';
    case 'bottom-left':
      return 'southwest';
    case 'bottom-right':
      return 'southeast';
    case 'tile':
      return undefined;
    default:
      return 'center';
  }
}
