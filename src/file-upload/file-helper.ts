import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Compresses an image file to under 1MB if it exceeds that size.
 * Keeps the original extension but optimizes resolution and compression quality.
 * Supports .jpg, .jpeg, .png, and .webp formats.
 * 
 * @param filePath Absolute or relative path to the image file.
 */
export async function compressImageIfNeeded(filePath: string): Promise<void> {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!imageExtensions.includes(ext)) {
      return;
    }

    let stats = await fs.promises.stat(filePath);
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (stats.size <= maxSize) {
      return;
    }

    const maxPasses = 3;
    let currentPass = 1;
    let currentFilePath = filePath;
    let targetQuality = 85;
    let targetDimension = 3840; // Chuẩn độ phân giải 4K

    while (stats.size > maxSize && currentPass <= maxPasses) {
      const tempPath = `${filePath}.pass${currentPass}.tmp`;
      let image = sharp(currentFilePath);
      const metadata = await image.metadata();

      // Resize if dimensions are larger than targetDimension
      if (
        (metadata.width && metadata.width > targetDimension) ||
        (metadata.height && metadata.height > targetDimension)
      ) {
        image = image.resize(targetDimension, targetDimension, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Apply compression settings based on file format
      if (ext === '.jpg' || ext === '.jpeg') {
        await image.jpeg({ quality: targetQuality, progressive: true }).toFile(tempPath);
      } else if (ext === '.png') {
        // pngquant-like behavior via palette compression
        await image.png({ quality: targetQuality, compressionLevel: 9, palette: true }).toFile(tempPath);
      } else if (ext === '.webp') {
        await image.webp({ quality: targetQuality }).toFile(tempPath);
      } else {
        break;
      }

      const tempStats = await fs.promises.stat(tempPath);
      if (tempStats.size < stats.size) {
        // If this pass successfully reduced size, keep it
        if (currentFilePath !== filePath) {
          await fs.promises.unlink(currentFilePath).catch(() => {});
        }
        currentFilePath = tempPath;
        stats = tempStats;
      } else {
        // If size didn't reduce, discard this pass
        await fs.promises.unlink(tempPath).catch(() => {});
        break;
      }

      // Next pass configurations
      currentPass++;
      targetQuality -= 15; // 85 -> 70 -> 55
      targetDimension = Math.floor(targetDimension * 0.7); // 3840 -> 2688 -> 1881
    }

    // Replace the original file with the compressed version
    if (currentFilePath !== filePath) {
      await fs.promises.unlink(filePath).catch(() => {});
      await fs.promises.rename(currentFilePath, filePath);
    }
    console.log(`Successfully compressed image ${filePath} to ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
  } catch (error) {
    console.error(`Error compressing image ${filePath}:`, error);
    // Cleanup any temporary files left behind
    try {
      const dir = path.dirname(filePath);
      const basename = path.basename(filePath);
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.startsWith(basename) && file.endsWith('.tmp')) {
          fs.unlinkSync(path.join(dir, file));
        }
      }
    } catch (cleanupError) {
      console.error('Failed to clean up temporary compression files:', cleanupError);
    }
  }
}
