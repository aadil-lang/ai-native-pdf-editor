import { BoundingBox } from '@/types/pdf';

export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function pdfToScreenRect(bbox: BoundingBox, scale: number): ScreenRect {
  return {
    left: bbox.x0 * scale,
    top: bbox.y0 * scale,
    width: Math.max(2, (bbox.x1 - bbox.x0) * scale),
    height: Math.max(2, (bbox.y1 - bbox.y0) * scale),
  };
}

export function screenToPdfRect(
  left: number,
  top: number,
  width: number,
  height: number,
  scale: number
): BoundingBox {
  const safeScale = scale || 1.0;
  return {
    x0: left / safeScale,
    y0: top / safeScale,
    x1: (left + width) / safeScale,
    y1: (top + height) / safeScale,
  };
}

export function screenToPdfPoint(x: number, y: number, scale: number): { x: number; y: number } {
  const safeScale = scale || 1.0;
  return {
    x: x / safeScale,
    y: y / safeScale,
  };
}
