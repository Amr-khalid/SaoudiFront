// ============================================
// SAOUDI WEAR - Client-Side Image Compression
// Reduces file size before uploading to Cloudinary / REST API
// ============================================

export const compressImage = (
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.90
): Promise<File> => {
  return new Promise((resolve) => {
    // If file is already small (< 500KB) and in webp/png, return as is
    if (file.size < 500 * 1024 && (file.type === 'image/webp' || file.type === 'image/png')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.webp',
              {
                type: 'image/webp',
                lastModified: Date.now(),
              }
            );
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export const compressMultipleImages = async (files: File[]): Promise<File[]> => {
  const compressedPromises = files.map((file) => compressImage(file));
  return Promise.all(compressedPromises);
};
