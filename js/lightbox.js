import { t } from "./i18n.js";
import { toast } from "./toast.js";

export function initLightbox(){
  const el = document.getElementById("lightbox");
  const img = document.getElementById("lbImg");
  const cap = document.getElementById("lbCaption");

  const btnClose = document.getElementById("lbClose");
  const btnPrev = document.getElementById("lbPrev");
  const btnNext = document.getElementById("lbNext");

  let items = [];
  let index = 0;

  const show = () => {
    const it = items[index];
    if(!it) return;
    img.src = it.url;
    img.alt = it.file_path || "";
    if(cap) cap.textContent = t("swipeTip");
  };

  const open = (newItems, idx) => {
    items = newItems || [];
    index = Math.max(0, Math.min(idx ?? 0, items.length - 1));
    el.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    show();
  };

  const close = () => {
    el.classList.add("hidden");
    document.body.style.overflow = "";
    img.src = "";
  };

  const prev = () => { if(items.length){ index = (index - 1 + items.length) % items.length; show(); } };
  const next = () => { if(items.length){ index = (index + 1) % items.length; show(); } };

  btnClose.onclick = close;
  btnPrev.onclick = prev;
  btnNext.onclick = next;

  el.addEventListener("click", (e) => {
    const stage = document.getElementById("lbStage");
    if(stage && !stage.contains(e.target)) close();
  });

  window.addEventListener("keydown", (e) => {
    if(el.classList.contains("hidden")) return;
    if(e.key === "Escape") close();
    if(e.key === "ArrowLeft") prev();
    if(e.key === "ArrowRight") next();
  });

  let sx=0, sy=0, st=0;
  el.addEventListener("touchstart", (e) => {
    if(el.classList.contains("hidden")) return;
    const p = e.touches[0];
    sx=p.clientX; sy=p.clientY; st=Date.now();
  }, { passive:true });

  el.addEventListener("touchend", (e) => {
    if(el.classList.contains("hidden")) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - sx;
    const dy = p.clientY - sy;
    const dt = Date.now() - st;
    if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && dt < 600){
      dx > 0 ? prev() : next();
    }
  });

  img.addEventListener("error", () => toast("Image load failed"));
  return { open };
}
