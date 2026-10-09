import { UnderlineType } from 'docx';
import { TextDecorationStyle } from '../dataset/enum/Text';

// Shared DOCX helpers; the exporter itself lives in docxLayout.ts

interface IImagePayload {
  data: ArrayBuffer;
  type: 'jpg' | 'png' | 'gif' | 'bmp' | 'svg';
  fallbackPng?: ArrayBuffer;
}

const DEFAULT_DOCX_FILE_NAME = 'document.docx';
const DEFAULT_IMAGE_WIDTH = 320;
const DEFAULT_IMAGE_HEIGHT = 180;
export async function loadImagePayload(src: string): Promise<IImagePayload> {
  const source = src.trim();
  if (source.startsWith('data:')) {
    return getImagePayloadFromDataUrl(source);
  }
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Image request failed: ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || '';
  const data = await response.arrayBuffer();
  return normalizeImagePayload(data, contentType);
}

async function getImagePayloadFromDataUrl(src: string): Promise<IImagePayload> {
  const [, meta = '', encoded = ''] = src.match(/^data:([^,]*),(.*)$/) || [];
  const mime = meta.split(';')[0] || '';
  const isBase64 = meta.includes(';base64');
  const text = isBase64 ? atob(encoded) : decodeURIComponent(encoded);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i);
  }
  return normalizeImagePayload(bytes.buffer, mime);
}

async function normalizeImagePayload(
  data: ArrayBuffer,
  mime: string
): Promise<IImagePayload> {
  const type = getRegularImageType(mime);
  if (type) {
    return {
      type,
      data
    };
  }
  if (mime.includes('svg')) {
    return {
      type: 'svg',
      data,
      fallbackPng: await rasterizeSvgToPng(data)
    };
  }
  const fallbackPng = await rasterizeImageToPng(data, mime);
  return {
    type: 'png',
    data: fallbackPng
  };
}

async function rasterizeSvgToPng(data: ArrayBuffer) {
  return rasterizeImageToPng(data, 'image/svg+xml');
}

async function rasterizeImageToPng(data: ArrayBuffer, mime: string) {
  const blob = new Blob([data], {
    type: mime || 'image/png'
  });
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadHtmlImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || DEFAULT_IMAGE_WIDTH;
    canvas.height = image.naturalHeight || DEFAULT_IMAGE_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context is unavailable');
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(output => {
        if (output) {
          resolve(output);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png');
    });
    return await pngBlob.arrayBuffer();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadHtmlImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });
}

export function mapUnderlineType(style?: TextDecorationStyle) {
  switch (style) {
    case TextDecorationStyle.DOUBLE:
      return UnderlineType.DOUBLE;
    case TextDecorationStyle.DASHED:
      return UnderlineType.DASH;
    case TextDecorationStyle.DOTTED:
      return UnderlineType.DOTTED;
    case TextDecorationStyle.WAVY:
      return UnderlineType.WAVE;
    default:
      return UnderlineType.SINGLE;
  }
}

export function normalizeHexColor(color: string, fallback?: string) {
  const normalized =
    normalizeHexLiteral(color) ||
    normalizeRgbColor(color) ||
    normalizeBrowserColor(color);
  if (normalized) {
    return normalized;
  }
  return fallback ? normalizeHexLiteral(fallback) || undefined : undefined;
}

function normalizeHexLiteral(color: string) {
  const value = color.trim().replace(/^#/, '');
  if (/^[\da-f]{3}$/i.test(value)) {
    return value
      .split('')
      .map(part => `${part}${part}`)
      .join('')
      .toUpperCase();
  }
  if (/^[\da-f]{4}$/i.test(value)) {
    return value
      .slice(0, 3)
      .split('')
      .map(part => `${part}${part}`)
      .join('')
      .toUpperCase();
  }
  if (/^[\da-f]{6}$/i.test(value)) {
    return value.toUpperCase();
  }
  if (/^[\da-f]{8}$/i.test(value)) {
    return value.slice(0, 6).toUpperCase();
  }
  return undefined;
}

function normalizeRgbColor(color: string) {
  const match = color.trim().match(/^rgba?\((.+)\)$/i);
  if (!match) {
    return undefined;
  }
  const parts = match[1]
    .replace(/\s*\/\s*/g, ',')
    .split(/\s*,\s*|\s+/)
    .filter(Boolean);
  if (parts.length < 3) {
    return undefined;
  }
  const red = parseRgbChannel(parts[0]);
  const green = parseRgbChannel(parts[1]);
  const blue = parseRgbChannel(parts[2]);
  if (red === null || green === null || blue === null) {
    return undefined;
  }
  const alpha = parts[3] !== undefined ? parseAlphaChannel(parts[3]) : 1;
  if (alpha === null || alpha <= 0) {
    return undefined;
  }
  const flattened =
    alpha >= 1
      ? [red, green, blue]
      : [
          flattenChannel(red, alpha),
          flattenChannel(green, alpha),
          flattenChannel(blue, alpha)
        ];
  return flattened.map(toHexChannel).join('');
}

function normalizeBrowserColor(color: string) {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return undefined;
  }
  context.fillStyle = '#000000';
  context.fillStyle = color;
  const normalized = context.fillStyle;
  if (typeof normalized !== 'string') {
    return undefined;
  }
  return normalizeHexLiteral(normalized) || normalizeRgbColor(normalized);
}

function parseRgbChannel(value: string) {
  if (value.endsWith('%')) {
    const percent = Number(value.slice(0, -1));
    if (!Number.isFinite(percent)) {
      return null;
    }
    return clampColorChannel(Math.round((percent / 100) * 255));
  }
  const channel = Number(value);
  if (!Number.isFinite(channel)) {
    return null;
  }
  return clampColorChannel(Math.round(channel));
}

function parseAlphaChannel(value: string) {
  if (value.endsWith('%')) {
    const percent = Number(value.slice(0, -1));
    if (!Number.isFinite(percent)) {
      return null;
    }
    return Math.min(Math.max(percent / 100, 0), 1);
  }
  const alpha = Number(value);
  if (!Number.isFinite(alpha)) {
    return null;
  }
  return Math.min(Math.max(alpha, 0), 1);
}

function clampColorChannel(value: number) {
  return Math.min(Math.max(value, 0), 255);
}

function flattenChannel(value: number, alpha: number) {
  return clampColorChannel(Math.round(255 * (1 - alpha) + value * alpha));
}

function toHexChannel(value: number) {
  return value.toString(16).padStart(2, '0').toUpperCase();
}

function getRegularImageType(mime: string) {
  if (mime.includes('png')) return 'png' as const;
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg' as const;
  if (mime.includes('gif')) return 'gif' as const;
  if (mime.includes('bmp')) return 'bmp' as const;
  return null;
}

export function normalizeDocxFileName(fileName?: string) {
  const trimmed = fileName?.trim();
  if (!trimmed) {
    return DEFAULT_DOCX_FILE_NAME;
  }
  return trimmed.toLowerCase().endsWith('.docx') ? trimmed : `${trimmed}.docx`;
}
