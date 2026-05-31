// Mobile Entry Fallback Script
import "./d.js";

document.addEventListener("DOMContentLoaded", () => {
  // Mobile specific touch enhancements
  let startX = 0;
  let startY = 0;

  window.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchend", (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = startX - endX;
    const diffY = startY - endY;

    // Swipe left/right on lightbox to slide photos
    const pop = document.getElementById("wd-pop");
    if (pop && pop.classList.contains("fx")) {
      if (Math.abs(diffX) > 50 && Math.abs(diffY) < 30) {
        if (diffX > 0) {
          // Swipe left -> Next
          const popNe = document.getElementById("wd-pop-ne");
          if (popNe) popNe.click();
        } else {
          // Swipe right -> Prev
          const popPr = document.getElementById("wd-pop-pr");
          if (popPr) popPr.click();
        }
      }
    }
  }, { passive: true });
});
