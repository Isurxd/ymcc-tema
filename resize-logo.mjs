import sharp from 'sharp';
import fs from 'fs';

async function resize() {
  try {
    await sharp('public/LOGO YMCC RASIO 1X1.png')
      .resize(600, 600, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .jpeg({ quality: 80 })
      .toFile('src/app/opengraph-image.jpg');
    console.log('Successfully created opengraph-image.jpg');
  } catch (error) {
    console.error('Error:', error);
  }
}
resize();
