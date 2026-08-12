// 클라이언트에서 이미지를 리사이즈·압축한다.
// 업로드 전송량을 줄이기 위해 캔버스에서 재인코딩한다.

/**
 * 기본 압축 설정.
 *
 * 초대장은 열자마자 대표 사진이 화면을 채우는데, 사진이 늦게 오면 그동안
 * 빈 화면(사진 페이드 인트로에서는 어두운 화면)을 보게 된다. 그래서 화질이
 * 눈에 띄게 나빠지지 않는 선까지만 줄인다.
 *
 * 긴 변 1400px 은 요즘 폰(가로 390~430pt · DPR 3 → 1170~1290px)을 채우고도
 * 남는 크기다. 더 줄이면 세로 사진의 가로가 1000px 아래로 내려가 큰 화면에서
 * 티가 나기 시작한다.
 */
const MAX_DIM = 1400;
const QUALITY = 0.78;

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
  maxDim = MAX_DIM,
  quality = QUALITY
): Promise<string> {
  const canvas = await toResizedCanvas(file, maxDim);
  if (!canvas) return readDataUrl(file);
  return canvas.toDataURL("image/jpeg", quality);
}

// 업로드용 압축 Blob. 재인코딩 불가 타입이면 원본 파일을 그대로 반환.
export async function fileToCompressedBlob(
  file: File,
  maxDim = MAX_DIM,
  quality = QUALITY
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
