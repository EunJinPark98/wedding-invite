// 클라이언트에서 이미지를 리사이즈·압축한다.
// 업로드 전송량을 줄이기 위해 캔버스에서 재인코딩한다.

// SVG/GIF 등은 캔버스 재인코딩이 부적절 → 원본 그대로 사용
const RECODABLE = /^image\/(jpeg|png|webp)$/;

async function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    i.src = src;
  });
}

// 리사이즈된 캔버스를 만든다. 재인코딩이 불가한 타입이면 null.
async function toResizedCanvas(
  file: File,
  maxDim: number
): Promise<HTMLCanvasElement | null> {
  if (!RECODABLE.test(file.type)) return null;
  const dataUrl = await readDataUrl(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  const longest = Math.max(width, height);
  if (longest > maxDim) {
    const scale = maxDim / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

// 압축된 data URL (미리보기 등 인라인 용도)
export async function fileToCompressedDataUrl(
  file: File,
  maxDim = 1600,
  quality = 0.82
): Promise<string> {
  const canvas = await toResizedCanvas(file, maxDim);
  if (!canvas) return readDataUrl(file);
  return canvas.toDataURL("image/jpeg", quality);
}

// 업로드용 압축 Blob. 재인코딩 불가 타입이면 원본 파일을 그대로 반환.
export async function fileToCompressedBlob(
  file: File,
  maxDim = 1600,
  quality = 0.82
): Promise<Blob> {
  const canvas = await toResizedCanvas(file, maxDim);
  if (!canvas) return file;
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? file),
      "image/jpeg",
      quality
    );
  });
}
