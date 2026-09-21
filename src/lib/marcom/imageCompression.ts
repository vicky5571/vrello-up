/**
 * Utilitas kompresi foto sisi klien (client-side image compression).
 * Mengoptimalkan foto kamera smartphone (8-15 MB) menjadi ~500 KB - 1 MB
 * sebelum dikirim ke server, menghemat 90% penyimpanan disk server dan kuota internet sales.
 */

export interface ImageCompressionOptions {
  maxDimension?: number; // Maksimal lebar atau tinggi dalam pixel (default: 1920px Full HD)
  quality?: number; // Kualitas kompresi JPEG 0.0 - 1.0 (default: 0.8)
  minSizeToCompressBytes?: number; // Batas minimal ukuran berkas untuk dikompres (default: 350 KB)
}

const COMPRESSIBLE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const COMPRESSIBLE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

/**
 * Menghitung dimensi proporsional baru agar tidak melebihi maxDimension.
 * Fungsi murni (pure) yang dapat diuji pada lingkungan Node.js maupun browser.
 */
export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  maxDimension = 1920,
): { width: number; height: number; wasResized: boolean } {
  if (origWidth <= 0 || origHeight <= 0) {
    return {
      width: Math.max(1, maxDimension),
      height: Math.max(1, maxDimension),
      wasResized: false,
    };
  }

  if (origWidth <= maxDimension && origHeight <= maxDimension) {
    return { width: origWidth, height: origHeight, wasResized: false };
  }

  if (origWidth >= origHeight) {
    const width = maxDimension;
    const height = Math.max(1, Math.round((origHeight * maxDimension) / origWidth));
    return { width, height, wasResized: true };
  } else {
    const height = maxDimension;
    const width = Math.max(1, Math.round((origWidth * maxDimension) / origHeight));
    return { width, height, wasResized: true };
  }
}

/**
 * Memeriksa apakah berkas merupakan tipe gambar yang aman untuk dikompresi.
 */
export function isCompressibleImage(file: {
  type?: string;
  name?: string;
}): boolean {
  if (file.type && COMPRESSIBLE_MIME_TYPES.has(file.type.toLowerCase())) {
    return true;
  }
  if (file.name) {
    const dotIndex = file.name.lastIndexOf(".");
    if (dotIndex !== -1) {
      const ext = file.name.slice(dotIndex + 1).toLowerCase();
      return COMPRESSIBLE_EXTENSIONS.has(ext);
    }
  }
  return false;
}

/**
 * Mengompresi file gambar menggunakan Canvas API browser.
 * Jika berkas bukan gambar atau lingkungan bukan browser, mengembalikan berkas asli.
 */
export async function compressImageFile(
  file: File,
  options: ImageCompressionOptions = {},
): Promise<File> {
  const maxDimension = options.maxDimension ?? 1920;
  const quality = options.quality ?? 0.8;
  const minSizeToCompress = options.minSizeToCompressBytes ?? 350 * 1024; // 350 KB

  // Jika bukan browser atau bukan gambar atau ukuran sudah sangat kecil, lewati
  if (typeof window === "undefined" || !isCompressibleImage(file)) {
    return file;
  }

  if (file.size <= minSizeToCompress) {
    return file;
  }

  return new Promise<File>((resolve) => {
    let objectUrl = "";
    try {
      objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl);
          const { width, height, wasResized } = calculateTargetDimensions(
            img.naturalWidth || img.width,
            img.naturalHeight || img.height,
            maxDimension,
          );

          // Jika gambar tidak perlu di-resize dan format sudah terkompresi, kembalikan asli
          if (!wasResized && file.size < 800 * 1024) {
            resolve(file);
            return;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }

          // Render halus dengan image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Export sebagai JPEG terkompresi
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) {
                // Jika hasil kompresi malah lebih besar dari file asli, gunakan file asli
                resolve(file);
                return;
              }

              // Buat nama file baru dengan ekstensi .jpg yang bersih
              const baseName = file.name.replace(/\.[^/.]+$/, "");
              const compressedFile = new File([blob], `${baseName}.jpg`, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            "image/jpeg",
            quality,
          );
        } catch (err) {
          console.warn("[ImageCompressor] Canvas processing failed, using original:", err);
          resolve(file);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    } catch {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(file);
    }
  });
}
