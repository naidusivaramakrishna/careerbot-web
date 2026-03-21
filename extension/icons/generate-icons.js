const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'logo.png');
const sizes = [16, 48, 128];

async function generate() {
  for (const size of sizes) {
    await sharp(inputPath)
      .trim({ threshold: 20 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(__dirname, `icon${size}.png`));
    console.log(`✓ icon${size}.png generated`);
  }
  console.log('All icons generated!');
}

generate().catch(console.error);
