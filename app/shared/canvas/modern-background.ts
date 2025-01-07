interface ModernBackgroundOptions {
  width?: number;
  height?: number;
  primaryColor: string;
  secondaryColor: string;
  disablePattern?: boolean;
  opacity?: number;
}

async function genModernBackground(
  options: ModernBackgroundOptions = {} as ModernBackgroundOptions
) {
  const {
    width = 1920,
    height = 1080,
    primaryColor,
    secondaryColor,
    disablePattern = false,
    opacity = 1,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.filter = 'blur(300px)';
  ctx.globalAlpha = opacity;

  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.ellipse(
    100,
    200,
    width * 0.208,
    height * 0.278,
    (-45 * Math.PI) / 180,
    0,
    2 * Math.PI
  );
  ctx.fill();

  ctx.fillStyle = secondaryColor;
  ctx.beginPath();
  ctx.ellipse(
    1600,
    600,
    width * 0.208,
    height * 0.139,
    (45 * Math.PI) / 180,
    0,
    2 * Math.PI
  );
  ctx.fill();

  const finishedCanvas = await moreBlur(
    canvas,
    width,
    height,
    primaryColor,
    secondaryColor,
    disablePattern
  );

  return finishedCanvas;
}

async function moreBlur(
  canvasToEdit: HTMLCanvasElement,
  width: number,
  height: number,
  primaryColor: string,
  secondaryColor: string,
  disablePattern: boolean
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!disablePattern) {
    const pattern = await genPattern(
      width,
      height,
      primaryColor,
      secondaryColor
    );
    ctx.drawImage(pattern, 0, 0);
  }

  ctx.filter = 'blur(50px)';
  ctx.drawImage(
    canvasToEdit,
    -width * 0.052,
    -height * 0.185,
    width * 1.146,
    height * 1.296
  );

  return canvas.toDataURL();
}

async function genPattern(
  width: number,
  height: number,
  primary: string,
  secondary: string
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, primary);
  gradient.addColorStop(1, secondary);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'destination-in';

  const patternScale = 1.1;

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
    });
  }

  const pattern = await loadImage('canvas/pattern_mask.png');

  ctx.drawImage(pattern, 200, 400, 1604 * patternScale, 830 * patternScale);

  const bitmap = await createImageBitmap(canvas);

  return bitmap;
}

export { genModernBackground, genPattern, moreBlur };
