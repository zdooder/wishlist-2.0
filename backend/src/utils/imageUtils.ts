import axios from 'axios';
import sharp from 'sharp';

export async function processImageUrl(imageUrl: string): Promise<string | null> {
  try {
    // Download the image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      maxContentLength: 10 * 1024 * 1024, // 10MB limit
    });

    // Process the image with sharp
    const processedImageBuffer = await sharp(response.data)
      .resize(800, 800, { // Resize to max dimensions while maintaining aspect ratio
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
      .toBuffer();

    // Convert to base64
    return `data:image/jpeg;base64,${processedImageBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error processing image URL:', error);
    return null;
  }
} 