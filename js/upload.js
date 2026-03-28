import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, BUCKET } from "./config.js";
import { toast } from "./toast.js";
import { i18nInit } from "./i18n.js";

const USER_ROLE = localStorage.getItem("bc_upload_role_v1");
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LS_KEY = "bc_album_uploader_settings_v1";

// DOM
const optCategory = document.getElementById("optCategory");
const newCategoryName = document.getElementById("newCategoryName");
const btnAddCategory = document.getElementById("btnAddCategory");
const categoryManageList = document.getElementById("categoryManageList");

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

// state
let items = [];
let categories = [];

// -------------------- utils --------------------
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
function esc(s=""){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

// 把中文/空白名稱轉成 slug
function slugify(name=""){
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// -------------------- settings --------------------
function saveSettings(){
  const s = {
    format: optFormat.value,
    category: optCategory?.value || "",
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
  }catch{
    return null;
  }
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
    setFieldPair(optQualityMin, optQualityMinRange