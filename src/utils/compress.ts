import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: false,
      fileType: file.type,
    });
  } catch {
    // 压缩失败时直接返回原文件，不阻塞上传流程
    return file;
  }
}
