/**
 * Converts marketing PNGs to WebP for faster mobile delivery.
 * Usage: npm run marketing:webp
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const INPUTS = [
  path.join(ROOT, "public", "marketing"),
  path.join(ROOT, "public", "brand-logo.png"),
];

async function convertFile(input) {
  const output = input.replace(/\.png$/i, ".webp");
  await sharp(input).webp({ quality: 82, effort: 4 }).toFile(output);
  const before = fs.statSync(input).size;
  const after = fs.statSync(output).size;
  console.log(
    `${path.basename(input)} → ${path.basename(output)} (${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB)`,
  );
}

async function main() {
  const pngs = [];

  for (const entry of INPUTS) {
    if (fs.statSync(entry).isDirectory()) {
      pngs.push(
        ...fs
          .readdirSync(entry)
          .filter((name) => name.endsWith(".png"))
          .map((name) => path.join(entry, name)),
      );
    } else if (entry.endsWith(".png") && fs.existsSync(entry)) {
      pngs.push(entry);
    }
  }

  if (pngs.length === 0) {
    console.log("No PNG files to convert");
    return;
  }

  for (const input of pngs) {
    await convertFile(input);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
