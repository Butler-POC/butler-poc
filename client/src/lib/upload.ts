// Created: 2026-05-31
/**
 * 업로드 크기 제한 — Claude 비전 API는 이미지를 base64로 전송하며,
 * base64 인코딩은 용량을 약 4/3배(≈1.33배)로 늘린다.
 * 따라서 원본 이미지는 (10MB 한도 × 3/4) = 7.5MB 이하여야 한다.
 */

/** Claude 비전 API의 이미지 base64 최대 크기 (10 MiB) */
export const VISION_BASE64_LIMIT = 10 * 1024 * 1024; // 10,485,760

/** 인코딩(×4/3) 후 한도를 넘지 않는 원본 이미지 최대 크기 = 한도 × 3/4 */
export const MAX_IMAGE_BYTES = Math.floor((VISION_BASE64_LIMIT * 3) / 4); // 7,864,320 (=7.5MB)

/** PDF 등 비이미지 첨부 최대 크기 (PDF는 base64 한도가 32MB로 넉넉함) */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** 안내 문구용 라벨 */
export const MAX_IMAGE_LABEL = '7.5MB';

/**
 * 업로드 파일 크기를 검사한다.
 * @returns 문제가 있으면 사용자 안내 메시지, 없으면 null
 */
export function checkUploadSize(file: File): string | null {
  const isImage = file.type.startsWith('image/');
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return `이미지가 너무 큽니다. 약 ${MAX_IMAGE_LABEL} 이하의 이미지를 첨부해 주세요. (전송 시 인코딩으로 용량이 약 1.33배 늘어 10MB 한도를 초과합니다.)`;
  }
  if (!isImage && file.size > MAX_FILE_BYTES) {
    return '파일이 너무 큽니다. (최대 20MB)';
  }
  return null;
}
