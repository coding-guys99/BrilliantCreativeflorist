const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const closeBtn = document.getElementById("close");

// 自動嘗試載入 1~200 張圖片
for (let i = 1; i <= 200; i++) {
  const num = String(i).padStart(3, "0");
  const img = new Image();
  img.src = `gallery/${num}.jpg`;

  img.onload = () => {
    gallery.appendChild(img);

    img.onclick = () => {
      lightbox.classList.remove("hidden");
      lightboxImg.src = img.src;
    };
  };
}

// 關閉
closeBtn.onclick = () => {
  lightbox.classList.add("hidden");
};

lightbox.onclick = (e) => {
  if (e.target === lightbox) {
    lightbox.classList.add("hidden");
  }
};
