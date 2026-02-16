/**
 * Image processing utilities for the vision pipeline.
 * Grayscale conversion and Sobel edge detection.
 */

/** Grayscale coefficients (luminance) */
const R_COEF = 0.299;
const G_COEF = 0.587;
const B_COEF = 0.114;

/**
 * Convert RGBA ImageData to grayscale.
 * Output is a Uint8Array of luminance values (0-255).
 */
export function grayscale(imageData: ImageData): Uint8Array {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = Math.round(R_COEF * r + G_COEF * g + B_COEF * b);
  }

  return gray;
}

/**
 * Sobel edge detection on grayscale image.
 * Returns edge magnitude (0-255) per pixel.
 */
export function sobelEdgeDetect(
  gray: Uint8Array,
  width: number,
  height: number,
  threshold = 50
): Uint8Array {
  const edges = new Uint8Array(width * height);
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          gx += gray[idx] * sobelX[kernelIdx];
          gy += gray[idx] * sobelY[kernelIdx];
        }
      }

      const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      const idx = y * width + x;
      edges[idx] = magnitude > threshold ? magnitude : 0;
    }
  }

  return edges;
}

/**
 * Convert edge magnitude array to ImageData (for canvas display).
 */
export function edgesToImageData(
  edges: Uint8Array,
  width: number,
  height: number
): ImageData {
  const imageData = new ImageData(width, height);

  for (let i = 0; i < width * height; i++) {
    const v = edges[i];
    imageData.data[i * 4] = v;
    imageData.data[i * 4 + 1] = v;
    imageData.data[i * 4 + 2] = v;
    imageData.data[i * 4 + 3] = 255;
  }

  return imageData;
}
