import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, BUCKET } from "./config.js";
import { toast } from "./toast.js";
import { i18nInit } from "./i18n.js";

const USER_ROLE = localStorage.getItem("bc_upload_role_v1");
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LS_KEY = "bc_album_uploader_settings_v1";

// DOM
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const listEl = document.getElementById("list");
const btnUpload = document.getElementById("btnUpload");
const btnClear = document.getElementById("btnClear");

const optFormat = document.getElementById("optFormat");

const optTargetMB = document.getElementById("optTargetMB");
const optTargetMBRange = document.getElementById("optTargetMBRange");

const optQualityStart = document.getElementById("optQualityStart");
const optQualityStartRange = document.getElementById("optQualityStartRange");

const optQualityMin = document.getElementById("optQualityMin");
const optQualityMinRange = document.getElementById("optQualityMinRange");

const optQualityStep = document.getElementById("optQualityStep");
const optQualityStepRange = document.getElementById("optQualityStepRange");

// presets
const btnPresetSafe = document.getElementById("btnPresetSafe");
const btnPresetSmall = document.getElementById("btnPresetSmall");
const btnReset = document.getElementById("btnReset");

// state per file
// { id, file, previewUrl, w,h, skipCompress, status, beforeBytes, afterBytes, qUsed, outExt, outMime, timeMs, publicUrl, filePath, photoId }
let items = [];

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function toNum(v, fallback){ const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function round2(n){ return Math.round(n * 100) / 100; }

function bytes(n){
  const u = ["B","KB","MB","GB"];
  let i=0; let v=n;
  while(v>=1024 && i<u.length-1){ v/=1024; i++; }
  return `${v.toFixed(i?1:0)} ${u[i]}`;
}
function pct(before, after){
  if(!before || !after) return "";
  const r = after / before;
  return `${Math.round(r * 100)}%`;
}

function saveSettings(){
  const s = {
    format: optFormat.value,
    targetMB: optTargetMB.value,
    qStart: optQualityStart.value,
    qMin: optQualityMin.value,
    qStep: optQualityStep.value
  };
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}
function loadSettings(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch{ return null; }
}

function setFieldPair(numberEl, rangeEl, v){
  numberEl.value = String(v);
  rangeEl.value = String(v);
}
function bindPair(numberEl, rangeEl, {min, max}){
  const syncFromNumber = () => {
    const v = clamp(toNum(numberEl.value, toNum(rangeEl.value, min)), min, max);
    numberEl.value = String(v);
    rangeEl.value = String(v);
    saveSettings();
  };
  const syncFromRange = () => {
    const v = clamp(toNum(rangeEl.value, toNum(numberEl.value, min)), min, max);
    numberEl.value = String(v);
    rangeEl.value = String(v);
    saveSettings();
  };
  numberEl.addEventListener("input", syncFromNumber);
  numberEl.addEventListener("change", syncFromNumber);
  rangeEl.addEventListener("input", syncFromRange);
}

function initSettings(){
  const saved = loadSettings();
  if(saved){
    optFormat.value = saved.format ?? "jpeg";
    setFieldPair(optTargetMB, optTargetMBRange, saved.targetMB ?? 1.2);
    setFieldPair(optQualityStart, optQualityStartRange, saved.qStart ?? 0.86);
    setFieldPair(optQualityMin, optQualityMinRange, saved.qMin ?? 0.7);
    setFieldPair(optQualityStep, optQualityStepRange, saved.qStep ?? 0.04);
  }else{
    optFormat.value = "jpeg";
    setFieldPair(optTargetMB, optTargetMBRange, 1.2);
    setFieldPair(optQualityStart, optQualityStartRange, 0.86);
    setFieldPair(optQualityMin, optQualityMinRange, 0.7);
    setFieldPair(optQualityStep, optQualityStepRange, 0.04);
  }
}

bindPair(optTargetMB, optTargetMBRange, {min:0.2, max:20});
bindPair(optQualityStart, optQualityStartRange, {min:0.5, max:0.95});
bindPair(optQualityMin, optQualityMinRange, {min:0.3, max:0.9});
bindPair(optQualityStep, optQualityStepRange, {min:0.01, max:0.1});
optFormat.addEventListener("change", saveSettings);

// presets
btnPresetSafe?.addEventListener("click", () => {
  optFormat.value = "jpeg";
  setFieldPair(optTargetMB, optTargetMBRange, 1.2);
  setFieldPair(optQualityStart, optQualityStartRange, 0.86);
  setFieldPair(optQualityMin, optQualityMinRange, 0.70);
  setFieldPair(optQualityStep, optQualityStepRange, 0.04);
  saveSettings();
  toast("Preset: 質感穩");
});
btnPresetSmall?.addEventListener("click", () => {
  optFormat.value = "jpeg";
  setFieldPair(optTargetMB, optTargetMBRange, 0.8);
  setFieldPair(optQualityStart, optQualityStartRange, 0.80);
  setFieldPair(optQualityMin, optQualityMinRange, 0.60);
  setFieldPair(optQualityStep, optQualityStepRange, 0.05);
  saveSettings();
  toast("Preset: 超省");
});
btnReset?.addEventListener("click", () => {
  localStorage.removeItem(LS_KEY);
  initSettings();
  saveSettings();
  toast("已重置");
});

function getOptions(){
  const format = optFormat.value || "jpeg";
  const targetMB = clamp(toNum(optTargetMB.value, 1.2), 0.2, 20);
  const qStart = clamp(toNum(optQualityStart.value, 0.86), 0.5, 0.95);
  const qMin = clamp(toNum(optQualityMin.value, 0.7), 0.3, 0.9);
  const qStep = clamp(toNum(optQualityStep.value, 0.04), 0.01, 0.1);
  const start = Math.max(qStart, qMin);

  return {
    format,
    targetBytes: targetMB * 1024 * 1024,
    qStart: round2(start),
    qMin: round2(qMin),
    qStep: round2(qStep),
  };
}

function esc(s=""){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function render(){
  listEl.innerHTML = items.map((it) => {
    const dimText = (it.w && it.h) ? `${it.w}×${it.h}px` : "…px";
    const before = it.beforeBytes ? bytes(it.beforeBytes) : bytes(it.file.size);
    const after  = it.afterBytes ? bytes(it.afterBytes) : "—";
    const ratio  = (it.afterBytes && it.beforeBytes) ? pct(it.beforeBytes, it.afterBytes) : "";
    const qText  = it.qUsed != null ? `q=${it.qUsed}` : "";
    const fmt    = it.outExt ? it.outExt.toUpperCase() : "";
    const time   = it.timeMs != null ? `${Math.max(1, Math.round(it.timeMs))}ms` : "";

    const linkBlock = it.publicUrl ? `
      <div class="row-link">
        <a class="mini-link" href="${it.publicUrl}" target="_blank" rel="noopener">Open</a>
        <button class="mini-btn" data-act="copyUrl" data-id="${it.id}" type="button">Copy URL</button>
      </div>
    ` : "";

    const adminBlock = (it.photoId || it.filePath) ? `
    <div class="admin-box">
        <div class="admin-row">
        <span class="admin-label">photo_id</span>
        <code class="admin-code">${esc(it.photoId || "")}</code>
        </div>
        <div class="admin-row">
        <span class="admin-label">file_path</span>
        <code class="admin-code">${esc(it.filePath || "")}</code>
        </div>
        <div class="admin-row">
        ${USER_ROLE === "admin" ? `
  <button class="mini-btn danger" data-act="deleteRemote" data-id="${it.id}" type="button">
    Delete from Supabase
  </button>
` : ""}

        </div>
    </div>
    ` : "";


    return `
      <div class="file-rowX" data-id="${it.id}">
        <div class="file-thumb"><img src="${it.previewUrl}" alt=""></div>

        <div class="file-main">
          <div class="file-top">
            <div class="file-name">${esc(it.file.name)}</div>
            <div class="file-actions">
              <button class="mini-btn" data-act="toggle" data-id="${it.id}" type="button">
                ${it.skipCompress ? "Keep" : "Compress"}
              </button>
              <button class="mini-btn danger" data-act="remove" data-id="${it.id}" type="button">Remove</button>
            </div>
          </div>

          <div class="file-meta">
            <span class="pill">${dimText}</span>
            <span class="pill">${before} → ${after} ${ratio ? `(${ratio})` : ""}</span>
            ${qText ? `<span class="pill">${qText}</span>` : ""}
            ${fmt ? `<span class="pill">${fmt}</span>` : ""}
            ${time ? `<span class="pill">${time}</span>` : ""}
          </div>

          <div class="file-status">
            <span class="status-dot ${it.statusClass || "idle"}"></span>
            <span>${esc(it.status || "Ready")}</span>
          </div>

          ${linkBlock}
          ${adminBlock}
        </div>
      </div>
    `;
  }).join("");

  btnUpload.disabled = items.length === 0;
}

function addFiles(fileList){
  const incoming = Array.from(fileList || []).filter(f => f.type.startsWith("image/"));
  for(const f of incoming){
    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(f);
    items.push({
      id,
      file: f,
      previewUrl,
      w: null, h: null,
      skipCompress: false,
      status: "Ready",
      statusClass: "idle",
      beforeBytes: f.size,
      photoId: null,
      filePath: null
    });
    loadDims(id, f);
  }
  render();
}

function loadImageFromFile(file){
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
async function loadDims(id, file){
  try{
    const img = await loadImageFromFile(file);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const it = items.find(x => x.id === id);
    if(it){ it.w = w; it.h = h; render(); }
  }catch{}
}

function getExt(file){
  const seg = (file.name.split(".").pop() || "").toLowerCase();
  return seg || "jpg";
}
function toBlob(canvas, mime, quality){
  return new Promise((resolve) => canvas.toBlob((b)=>resolve(b), mime, quality));
}

async function compressNoResize(file, opts, forceKeep=false){
  if(file.name.toLowerCase().endsWith(".gif")){
    return { blob: file, mime: "image/gif", ext: "gif", qUsed: null, mode: "skip-gif" };
  }
  const keep = forceKeep || opts.format === "keep";
  if(keep){
    return { blob: file, mime: file.type || "application/octet-stream", ext: getExt(file), qUsed: null, mode: "keep" };
  }

  const img = await loadImageFromFile(file);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { alpha:false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  const mime = (opts.format === "webp") ? "image/webp" : "image/jpeg";
  const ext  = (mime === "image/webp") ? "webp" : "jpg";

  let q = opts.qStart;
  let blob = await toBlob(canvas, mime, q);

  while(blob && blob.size > opts.targetBytes && (q - opts.qStep) >= opts.qMin){
    q = round2(q - opts.qStep);
    blob = await toBlob(canvas, mime, q);
  }

  if(!blob){
    return { blob: file, mime: file.type || "application/octet-stream", ext: getExt(file), qUsed: null, mode: "fallback" };
  }
  return { blob, mime, ext, qUsed: q, mode: "compressed" };
}

async function uploadOne(it, opts){
  const t0 = performance.now();
  it.status = "Compressing...";
  it.statusClass = "work";
  render();

  const packed = await compressNoResize(it.file, opts, it.skipCompress);
  it.afterBytes = packed.blob.size;
  it.qUsed = packed.qUsed;
  it.outExt = packed.ext;
  it.outMime = packed.mime;

  it.status = `Uploading... (${bytes(it.beforeBytes)} → ${bytes(it.afterBytes)})`;
  it.statusClass = "work";
  render();

  const d = new Date();
  const ym = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}`;
  const name = `${crypto.randomUUID()}.${packed.ext}`;
  const file_path = `${ym}/${name}`;
  it.filePath = file_path; // <-- 立刻记录，方便你去 storage 找

  const up = await supabase.storage.from(BUCKET).upload(file_path, packed.blob, {
    cacheControl: "31536000",
    upsert: false,
    contentType: packed.mime
  });
  if(up.error) throw up.error;

  // insert and return id
  const ins = await supabase
    .from("photos")
    .insert({
      file_path,
      is_public: true,
      sort: Date.now()
    })
    .select("id")
    .single();

  if(ins.error) throw ins.error;
  it.photoId = ins.data?.id || null;

  // public url
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(file_path);
  it.publicUrl = data.publicUrl;

  it.timeMs = performance.now() - t0;
  it.status = "Done";
  it.statusClass = "ok";
  render();
}

function removeItem(id){
  const idx = items.findIndex(x => x.id === id);
  if(idx >= 0){
    URL.revokeObjectURL(items[idx].previewUrl);
    items.splice(idx, 1);
    render();
  }
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    toast("Copied");
  }catch{
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    toast("Copied");
  }
}

// list actions (delegate)
listEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if(!btn) return;
  const act = btn.dataset.act;
  const id = btn.dataset.id;
  const it = items.find(x => x.id === id);
  if(!it) return;

  if(act === "remove") removeItem(id);
  if(act === "deleteRemote"){
  if(!confirm("確定要刪除這張圖片？這會從 Supabase 永久刪除。")) return;

  try{
    // 1️⃣ 刪 table
    if(it.photoId){
      const delRow = await supabase
        .from("photos")
        .delete()
        .eq("id", it.photoId);
      if(delRow.error) throw delRow.error;
    }

    // 2️⃣ 刪 storage
    if(it.filePath){
      const delFile = await supabase
        .storage
        .from(BUCKET)
        .remove([it.filePath]);
      if(delFile.error) throw delFile.error;
    }

    // 3️⃣ 移除 UI
    removeItem(id);
    toast("Deleted");

  }catch(err){
    console.error(err);
    toast("Delete failed");
  }
}

  if(act === "toggle"){ it.skipCompress = !it.skipCompress; render(); }

  if(act === "copyUrl" && it.publicUrl) await copyText(it.publicUrl);
  if(act === "copyId" && it.photoId) await copyText(it.photoId);
  if(act === "copyPath" && it.filePath) await copyText(it.filePath);
});

// DnD / file input
dropZone.addEventListener("dragover", (e) => { e.preventDefault(); });
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  addFiles(e.dataTransfer.files);
});
fileInput.addEventListener("change", (e) => {
  addFiles(e.target.files);
  fileInput.value = "";
});

btnClear.addEventListener("click", () => {
  for(const it of items) URL.revokeObjectURL(it.previewUrl);
  items = [];
  render();
});

btnUpload.addEventListener("click", async () => {
  if(items.length === 0) return;
  btnUpload.disabled = true;

  const opts = getOptions();

  for(const it of items){
    if(it.statusClass === "ok") continue;
    try{
      await uploadOne(it, opts);
    }catch(err){
      console.error(err);
      it.status = "Failed (check console)";
      it.statusClass = "bad";
      render();
      toast("Upload failed. Check console.");
    }
  }

  btnUpload.disabled = false;
});

// boot
(async () => {
  await i18nInit();
  initSettings();
  saveSettings();
  render();
})();
