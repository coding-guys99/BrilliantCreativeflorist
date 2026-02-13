let LANG = "en";
const KEY = "album_lang_v2";

function normalize(v){
  v = String(v || "");
  if(v === "zh" || v === "zh-TW" || v === "zh-Hant") return "zh-TW";
  if(v === "zh-CN" || v === "zh-Hans") return "zh-CN";
  if(v.startsWith("zh")) return "zh-TW";
  if(v.startsWith("en")) return "en";
  return "en";
}

function detectLang(){
  const url = new URL(location.href);
  const qp = url.searchParams.get("lang");
  if(qp) return normalize(qp);

  const saved = localStorage.getItem(KEY);
  if(saved) return normalize(saved);

  return normalize(navigator.language || "en");
}

export async function i18nInit(){
  LANG = detectLang();
  localStorage.setItem(KEY, LANG);
}

export function i18nGetLang(){ return LANG; }

export async function i18nSetLang(lang){
  LANG = normalize(lang);
  localStorage.setItem(KEY, LANG);
}

const DICT = {
  subtitle: { "zh-TW":"線上相冊", "zh-CN":"线上相册", "en":"Online Album" },
  emptyTitle:{ "zh-TW":"目前還沒有圖片", "zh-CN":"目前还没有图片", "en":"No images yet" },
  emptyDesc:{ "zh-TW":"請稍後再來看看～", "zh-CN":"请稍后再来看看～", "en":"Please check back later." },
  swipeTip:{ "zh-TW":"手機可左右滑動切換", "zh-CN":"手机可左右滑动切换", "en":"Swipe left/right on mobile" },
  toastUploaded:{ "zh-TW":"上傳完成", "zh-CN":"上传完成", "en":"Upload done" }
};

export function t(key){
  return DICT[key]?.[LANG] || DICT[key]?.en || key;
}
