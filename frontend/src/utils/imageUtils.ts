/**
 * Checks if a file is an HEIC image and converts it to JPEG.
 * If it's not an HEIC image, returns the original file.
 *
 * @param file The file to check and convert
 * @returns The converted JPEG file or the original file
 */
export const processHeicFile = async (file: File): Promise<File> => {
  if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
    try {
      // Loaded on demand — heic2any bundles a ~1.3MB WASM decoder that only
      // matters for the rare HEIC upload, not every page that imports this file.
      const { default: heic2any } = await import('heic2any');
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      });
      const blobArray = Array.isArray(converted) ? converted[0] : converted;
      return new File([blobArray], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
    } catch (err) {
      console.error('Error converting HEIC to JPEG:', err);
      throw new Error('Falha ao converter formato do iPhone (HEIC)');
    }
  }
  
  return file;
};
