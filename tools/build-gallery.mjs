import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const galleryDir = path.join(ROOT, "assets", "gallery");
const outFile = path.join(ROOT, "data", "gallery.json");

const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function isImage(name){
  return exts.has(path.extname(name).toLowerCase());
}
function naturalSort(a, b){
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

if(!fs.existsSync(galleryDir)){
  console.error("Missing folder:", galleryDir);
  process.exit(1);
}

const files = fs.readdirSync(galleryDir)
  .filter((f) => !f.startsWith(".") && isImage(f))
  .sort(naturalSort);

const items = files.map((file, i) => ({ order: i + 1, file }));

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(items, null, 2), "utf-8");

console.log(`Generated ${outFile} with ${items.length} images.`);
