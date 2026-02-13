let timer = null;
export function toast(text){
  const el = document.getElementById("toast");
  if(!el) return;
  el.textContent = text;
  el.classList.remove("hidden");
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.add("hidden"), 1600);
}
