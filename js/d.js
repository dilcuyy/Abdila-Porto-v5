document.addEventListener("DOMContentLoaded", () => {
  let dataBase = null;
  let activePageId = "ho";
  let activeRoute = "/";
  let isTransitioning = false;
  let shouldScrollToContactOnLoad = false;

  // Scroll variables
  let currentScroll = 0;
  let targetScroll = 0;
  let maxScroll = 0;
  const ease = 0.08;

  // Cached DOM elements for smooth 60fps scrolling
  let cachedPEl = null;
  let cachedArEl = null;
  let cachedTopBtn = null;
  let cachedF0Ic = null;

  // Track mouse coordinates for hover effects
  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Timezone clock — Abdila's local time: Bekasi, Indonesia (WIB, GMT+7)
  function updateAbdilaTime() {
    const d = new Date();
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const localTime = new Date(utc + (3600000 * 7));
    
    let hours = localTime.getHours();
    const minutes = localTime.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    
    const hEl = document.getElementById("_ti-h");
    const mEl = document.getElementById("_ti-m");
    const aEl = document.getElementById("_ti-a");
    
    const mhEl = document.getElementById("m-nav-h");
    const mmEl = document.getElementById("m-nav-m");
    const maEl = document.getElementById("m-nav-a");
    
    if (hEl && mEl && aEl) {
      hEl.textContent = hours;
      mEl.textContent = minutesStr;
      aEl.textContent = ampm;
    }
    
    if (mhEl && mmEl && maEl) {
      mhEl.textContent = hours;
      mmEl.textContent = minutesStr;
      maEl.textContent = ampm;
    }
  }
  updateAbdilaTime();
  setInterval(updateAbdilaTime, 60000);

  // Theme Manager
  const body = document.body;
  const thL = document.getElementById("th-l");
  const thD = document.getElementById("th-d");
  
  function applyTheme(theme) {
    if (theme === "_d") {
      body.classList.remove("_l");
      body.classList.add("_d");
      thD.classList.add("o");
      thL.classList.remove("o");
      localStorage.setItem("th", "_d");
    } else {
      body.classList.remove("_d");
      body.classList.add("_l");
      thL.classList.add("o");
      thD.classList.remove("o");
      localStorage.setItem("th", "_l");
    }
  }

  // Load theme preference
  const savedTheme = localStorage.getItem("th") || "_l";
  applyTheme(savedTheme);

  thL.addEventListener("click", () => applyTheme("_l"));
  thD.addEventListener("click", () => applyTheme("_d"));

  // Fetch data.json cache and bootstrap application with cache-busting
  fetch("/data.json?v=" + Date.now())
    .then(res => res.json())
    .then(data => {
      dataBase = data;
      initPreloader();
    })
    .catch(err => {
      console.error("Error loading application database:", err);
      // Fallback in case fetch fails
      document.getElementById("lo").classList.add("loaded");
    });

  // Preloader Logic
  function initPreloader() {
    const lo = document.getElementById("lo");
    const loPrDiv = document.querySelector("#lo-pr > div");
    const loPrText = document.getElementById("lo-co-pr");
    const loImgs = document.querySelectorAll("#lo-me > img");
    let progress = 0;
    let imgIndex = 0;

    // Cycle preloader images every 200ms
    const imgInterval = setInterval(() => {
      loImgs[imgIndex].classList.remove("o");
      imgIndex = (imgIndex + 1) % loImgs.length;
      loImgs[imgIndex].classList.add("o");
    }, 200);

    // Progress counter
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        clearInterval(imgInterval);
        
        // Let it display 100% briefly, then animate out
        setTimeout(() => {
          loPrDiv.style.transform = `translate3d(0, 0, 0)`;
          loPrText.textContent = "100%";
          
          setTimeout(() => {
            lo.classList.add("loaded");
            bootstrapRouter();
          }, 400);
        }, 200);
      } else {
        const paddedProgress = progress < 10 ? `00${progress}` : (progress < 100 ? `0${progress}` : progress);
        loPrText.textContent = `${paddedProgress}%`;
        loPrDiv.style.transform = `translate3d(-${100 - progress}%, 0, 0)`;
      }
    }, 40);
  }

  // Router and View Manager
  function bootstrapRouter() {
    // Read starting route
    const path = window.location.pathname;
    navigate(path, false);

    // Capture popstate (back/forward clicks)
    window.addEventListener("popstate", (e) => {
      const path = window.location.pathname;
      navigate(path, true);
    });

    // Intercept clicks on links
    document.addEventListener("click", (e) => {
      let target = e.target;
      while (target && target.tagName !== "A") {
        target = target.parentNode;
      }
      
      if (target && target.getAttribute("href") && target.getAttribute("href").startsWith("/")) {
        const targetHref = target.getAttribute("href");
        if (target.hasAttribute("target") || targetHref.startsWith("mailto:") || targetHref.startsWith("tel:")) {
          return;
        }
        e.preventDefault();
        if (targetHref !== activeRoute && !isTransitioning) {
          navigate(targetHref, false);
        }
      }
    });

    // Inertia physics scroll loop
    function scrollLoop() {
      // Lerp logic
      currentScroll += (targetScroll - currentScroll) * ease;
      if (Math.abs(targetScroll - currentScroll) < 0.05) {
        currentScroll = targetScroll;
      }

      // Apply transform to scrollable page
      if (cachedPEl) {
        cachedPEl.style.transform = `translate3d(0, ${-currentScroll}px, 0)`;
        if (cachedArEl) {
          cachedArEl.style.transform = "translate3d(0, 0, 0)";
        }
      }

      // Highlight footer arrow rotation on home scroll
      if (cachedTopBtn) {
        const rotateVal = Math.min(180, (currentScroll / maxScroll) * 180);
        if (cachedF0Ic) {
          cachedF0Ic.style.transform = `rotate(${rotateVal}deg)`;
        }
      }

      requestAnimationFrame(scrollLoop);
    }
    requestAnimationFrame(scrollLoop);
  }

  // Top progress bar manager
  const tbPr = document.getElementById("tb-pr");
  let prInterval = null;

  function updateProgressBar(progress) {
    if (tbPr) {
      tbPr.style.opacity = "1";
      tbPr.style.width = `${progress}%`;
    }
  }

  function startProgressBar() {
    if (prInterval) clearInterval(prInterval);
    updateProgressBar(0);
    
    let progress = 0;
    prInterval = setInterval(() => {
      if (progress < 40) {
        progress += Math.floor(Math.random() * 8) + 4;
        updateProgressBar(progress);
      } else {
        clearInterval(prInterval);
      }
    }, 60);
  }

  function completeProgressBar() {
    if (prInterval) clearInterval(prInterval);
    updateProgressBar(100);
    setTimeout(() => {
      if (tbPr) {
        tbPr.style.opacity = "0";
        setTimeout(() => {
          tbPr.style.width = "0%";
        }, 200);
      }
    }, 150);
  }

  // Router transitions
  function navigate(path, isPopstate) {
    if (!dataBase) return;
    
    // Reset/hide all persistent archive hover texts and classes when navigating away
    const archiveTexts = document.querySelectorAll("#ar-co > div");
    archiveTexts.forEach(t => t.classList.remove("o"));
    const archiveContainer = document.getElementById("ar_");
    if (archiveContainer) {
      archiveContainer.classList.remove("has-hover");
    }
    const archiveCards = document.querySelectorAll("#ar_ ._me");
    archiveCards.forEach(c => c.classList.remove("hover"));
    
    // Close mobile nav overlay on navigate if open
    const mNav = document.getElementById("m-nav");
    const mNavToggleOpen = document.getElementById("m-nav-toggle-open");
    if (mNav && mNav.classList.contains("fx")) {
      mNav.classList.remove("fx");
      if (mNavToggleOpen && window.innerWidth <= 768) {
        mNavToggleOpen.classList.remove("hidden");
      }
    }
    
    // Start top progress bar loading animation
    startProgressBar();
    
    // Find valid route or fallback to "/"
    let routeKey = path;
    if (!dataBase.cache[routeKey]) {
      routeKey = "/";
    }

    isTransitioning = true;
    const pageData = dataBase.cache[routeKey];
    activeRoute = routeKey;
    activePageId = pageData.id;

    // Update Browser history if not popstate
    if (!isPopstate) {
      window.history.pushState(null, pageData.title, routeKey);
    }
    document.title = pageData.title;

    // Navigation indicator updates
    const navLinks = document.querySelectorAll("#n-me a");
    navLinks.forEach(link => {
      const linkRoute = link.getAttribute("data-route");
      if (linkRoute === routeKey || (linkRoute === "/work" && routeKey.startsWith("/work")) || (linkRoute === "/archive" && routeKey.startsWith("/archive"))) {
        link.classList.add("o");
      } else {
        link.classList.remove("o");
      }
    });

    // Dynamic views swaps
    const mainContainer = document.getElementById("m");
    const oldPage = mainContainer.querySelector(".p_");
    
    if (oldPage) {
      // 1. Smoothly fade out the old page using custom easeOutExpo
      oldPage.style.transition = "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
      oldPage.style.pointerEvents = "none";
      oldPage.style.opacity = 0;
      oldPage.style.transform = "translate3d(0, -30px, 0)";
      
      // 2. Inject and transition in the new page simultaneously
      injectNewPage(mainContainer, pageData, oldPage);
    } else {
      injectNewPage(mainContainer, pageData, null);
    }
  }

  function injectNewPage(container, pageData, oldPage) {
    container.insertAdjacentHTML("beforeend", pageData.html);
    const newPage = container.querySelector(".p_:last-child");
    
    // In transition state reset
    newPage.style.opacity = 0;
    newPage.style.transform = "translate3d(0, 40px, 0)";
    newPage.style.pointerEvents = "none";
    
    // Force browser layout pass
    newPage.offsetHeight;
    
    // Smoothly fade in the new page with custom easeOutExpo
    newPage.style.transition = "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)";
    newPage.style.opacity = 1;
    newPage.style.transform = "translate3d(0, 0, 0)";

    // Scroll calculations reset
    currentScroll = 0;
    targetScroll = 0;
    
    // Cache references for high performance scrolling
    cachedPEl = newPage.querySelector(".p");
    cachedArEl = newPage.querySelector("#ar_");
    cachedTopBtn = newPage.querySelector("#top");
    cachedF0Ic = newPage.querySelector("#f0-ic");
    
    // Image loading progression tracking for realistic progress bar
    const images = newPage.querySelectorAll("img");
    const totalImages = images.length;

    // Performance: lazy-load below-fold images, eagerly load first 3 (above fold)
    images.forEach((img, idx) => {
      if (idx === 0) {
        img.setAttribute("fetchpriority", "high");
        img.setAttribute("loading", "eager");
      } else if (idx < 3) {
        img.setAttribute("loading", "eager");
        img.setAttribute("decoding", "async");
      } else {
        img.setAttribute("loading", "lazy");
        img.setAttribute("decoding", "async");
      }
    });

    if (totalImages > 0) {
      let loadedImages = 0;
      let prFake = 40;
      
      const fakeLoadInterval = setInterval(() => {
        if (prFake < 90) {
          prFake += (90 - prFake) * 0.12;
          updateProgressBar(prFake);
        }
      }, 100);

      const checkAllImages = () => {
        loadedImages++;
        if (loadedImages >= totalImages) {
          clearInterval(fakeLoadInterval);
          completeProgressBar();
        }
      };

      images.forEach(img => {
        if (img.complete) {
          checkAllImages();
        } else {
          img.addEventListener("load", checkAllImages);
          img.addEventListener("error", checkAllImages);
        }
      });
    } else {
      completeProgressBar();
    }

    // Trigger features bind, garbage collect the old page and reset transition flag
    setTimeout(() => {
      if (oldPage) oldPage.remove();
      newPage.style.pointerEvents = "all";
      
      recalculateScrollLimit();
      bindPageInteractions();
      isTransitioning = false;
      
      // Hide MENU button on archive detail pages (id="ad"), show on all others
      const mNavBtn = document.getElementById("m-nav-toggle-open");
      if (mNavBtn && window.innerWidth <= 1024) {
        if (activePageId === "ad") {
          mNavBtn.classList.add("hidden");
        } else {
          mNavBtn.classList.remove("hidden");
        }
      }
      
      // If redirecting to contact
      if (shouldScrollToContactOnLoad) {
        shouldScrollToContactOnLoad = false;
        setTimeout(() => {
          const f0CoEl = document.getElementById("f0-co");
          if (f0CoEl) {
            const f0CoRect = f0CoEl.getBoundingClientRect();
            const desiredScroll = (currentScroll + f0CoRect.top + f0CoRect.height / 2) - (window.innerHeight / 2);
            targetScroll = Math.max(0, Math.min(maxScroll, desiredScroll));
          }
        }, 150);
      }
    }, 600);
  }

  // Recalculate scrolling bounds depending on actual elements height
  function recalculateScrollLimit() {
    if (cachedPEl) {
      const update = () => {
        const height = cachedPEl.getBoundingClientRect().height;
        maxScroll = Math.max(0, height - window.innerHeight);
      };
      
      // Multi-pass bounds calculation to handle lazy image layout shifts
      update();
      setTimeout(update, 100);
      setTimeout(update, 300);
      setTimeout(update, 800);
      setTimeout(update, 1500);
    }
  }

  // Physics scroll trigger binds
  window.addEventListener("wheel", (e) => {
    if (isTransitioning) return;
    targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + e.deltaY));
  }, { passive: true });

  // Touch drag trigger binds for mobile devices
  let touchStart = 0;
  window.addEventListener("touchstart", (e) => {
    touchStart = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (isTransitioning) return;
    const touchDelta = touchStart - e.touches[0].clientY;
    touchStart = e.touches[0].clientY;
    targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + touchDelta * 1.5));
  }, { passive: true });

  // Scroll back to top trigger
  document.addEventListener("click", (e) => {
    if (e.target.id === "top") {
      targetScroll = 0;
    }
    // "Contact" button dynamic scroll to center contact card or redirect to index first
    if (e.target.id === "n-co") {
      const f0CoEl = document.getElementById("f0-co");
      if (f0CoEl) {
        // Scroll to center contact card in viewport
        const f0CoRect = f0CoEl.getBoundingClientRect();
        const desiredScroll = (currentScroll + f0CoRect.top + f0CoRect.height / 2) - (window.innerHeight / 2);
        targetScroll = Math.max(0, Math.min(maxScroll, desiredScroll));
      } else {
        // Redirect to "/" (index page) and set flag to scroll on load
        shouldScrollToContactOnLoad = true;
        navigate("/", false);
      }
    }
  });

  // Re-calculate bounds on window resize
  window.addEventListener("resize", recalculateScrollLimit);

  // Dynamic Page Binds: Lightboxes, Hovers, Controls
  function bindPageInteractions() {
    // Auto play all HTML5 video elements safely with browser autoplay overrides
    const videos = document.querySelectorAll("video");
    videos.forEach(v => {
      v.muted = true;
      v.setAttribute("playsinline", "");
      v.setAttribute("autoplay", "autoplay");
      v.setAttribute("loop", "loop");
      v.play().catch(err => console.log("Video auto play bypassed:", err));
    });

    // 1. Homepage Portfolio & Archives hover tab swapper
    const tabProjects = document.getElementById("ho-se-co0-0");
    const tabArchive = document.getElementById("ho-se-co0-1");
    const containerProjects = document.getElementById("ho-se-co1");
    const containerArchive = document.getElementById("ho-se-co2");
    const previewImgs = document.querySelectorAll("#ho-se-me > ._me");
    const hoverLinks = document.querySelectorAll(".y_ > div a");
    
    if (tabProjects && tabArchive && containerProjects && containerArchive && previewImgs.length > 0) {
      const selectDefaultProject = () => {
        previewImgs.forEach(img => img.classList.remove("o"));
        hoverLinks.forEach(link => link.classList.remove("o"));
        if (previewImgs[0]) previewImgs[0].classList.add("o");
        const firstProjLink = containerProjects.querySelector("a");
        if (firstProjLink) firstProjLink.classList.add("o");
      };

      const selectDefaultArchive = () => {
        previewImgs.forEach(img => img.classList.remove("o"));
        hoverLinks.forEach(link => link.classList.remove("o"));
        // Archive first item Adrián Lahreche is index 10 in previewImgs
        if (previewImgs[10]) previewImgs[10].classList.add("o");
        const firstArchLink = containerArchive.querySelector("a");
        if (firstArchLink) firstArchLink.classList.add("o");
      };

      // Select default on startup
      selectDefaultProject();

      tabProjects.addEventListener("click", () => {
        tabProjects.classList.add("o");
        tabArchive.classList.remove("o");
        containerProjects.classList.add("fx");
        containerArchive.classList.remove("fx");
        selectDefaultProject();
        recalculateScrollLimit();
      });

      tabArchive.addEventListener("click", () => {
        tabArchive.classList.add("o");
        tabProjects.classList.remove("o");
        containerArchive.classList.add("fx");
        containerProjects.classList.remove("fx");
        selectDefaultArchive();
        recalculateScrollLimit();
      });
    }

    // Homepage portfolio hover preview
    hoverLinks.forEach((link, idx) => {
      link.addEventListener("mouseenter", () => {
        const parentContainer = link.closest("#ho-se-co1, #ho-se-co2");
        if (parentContainer) {
          parentContainer.querySelectorAll("a").forEach(l => l.classList.remove("o"));
        }
        link.classList.add("o");

        previewImgs.forEach(img => img.classList.remove("o"));
        if (previewImgs[idx]) {
          previewImgs[idx].classList.add("o");
        }
      });
    });

    // 2. Works list hover preview image
    const workLinks = document.querySelectorAll("#wo-l > a");
    const workPreviews = document.querySelectorAll("#wo-m ._me");
    
    // Set first project preview active by default on load
    if (workLinks.length > 0 && workPreviews.length > 0) {
      workLinks.forEach(l => l.classList.remove("o"));
      workPreviews.forEach(p => p.classList.remove("o"));
      workLinks[0].classList.add("o");
      workPreviews[0].classList.add("o");
    }

    workLinks.forEach((link, idx) => {
      link.addEventListener("mouseenter", () => {
        workLinks.forEach(l => l.classList.remove("o"));
        link.classList.add("o");
        
        workPreviews.forEach(p => p.classList.remove("o"));
        if (workPreviews[idx]) {
          workPreviews[idx].classList.add("o");
        }
      });
    });

    // 3. Archives list text reveals and precise class-based hovers
    const archiveContainer = document.getElementById("ar_");
    const archiveCards = document.querySelectorAll("#ar_ ._me");
    const archiveTexts = document.querySelectorAll("#ar-co > div");

    if (archiveContainer && archiveCards.length > 0) {
      archiveCards.forEach((card, idx) => {
        // Desktop hover in
        card.addEventListener("mouseenter", () => {
          archiveContainer.classList.add("has-hover");
          card.classList.add("hover");
          
          archiveTexts.forEach(t => t.classList.remove("o"));
          if (archiveTexts[idx]) {
            archiveTexts[idx].classList.add("o");
          }
        });
        
        // Desktop hover out
        card.addEventListener("mouseleave", () => {
          archiveContainer.classList.remove("has-hover");
          card.classList.remove("hover");
          
          if (archiveTexts[idx]) {
            archiveTexts[idx].classList.remove("o");
          }
        });
        
        // Mobile tap show text
        card.addEventListener("touchstart", () => {
          archiveContainer.classList.add("has-hover");
          archiveCards.forEach(c => c.classList.remove("hover"));
          card.classList.add("hover");
          
          archiveTexts.forEach(t => t.classList.remove("o"));
          if (archiveTexts[idx]) {
            archiveTexts[idx].classList.add("o");
          }
        }, { passive: true });
      });

      // Reset hover when mouse leaves the archive grid completely
      archiveContainer.addEventListener("mouseleave", () => {
        archiveContainer.classList.remove("has-hover");
        archiveCards.forEach(c => c.classList.remove("hover"));
      });

      // Move #ar-co INSIDE the #ar section so hover text scrolls with the page
      // (not fixed to viewport). Works for both desktop and mobile.
      const arSection = document.getElementById("ar");
      const arCo = document.getElementById("ar-co");
      if (arSection && arCo && !arSection.contains(arCo)) {
        arSection.appendChild(arCo);
        // Override positioning: fill the entire #ar section absolutely
        arCo.style.position = "absolute";
        arCo.style.inset = "0";
        arCo.style.top = "0";
        arCo.style.left = "0";
        arCo.style.width = "100%";
        arCo.style.height = "100%";
        arCo.style.zIndex = "50";
        arCo.style.pointerEvents = "none";
      }
    }

    // 4. Project Detail Lightbox Modal (popup grid slider)
    const detailCards = document.querySelectorAll(".wd-li");
    const pop = document.getElementById("wd-pop");
    const popMe = document.getElementById("wd-pop-me");
    const popCl = document.getElementById("wd-pop-cl");
    const popNe = document.getElementById("wd-pop-ne");
    const popPr = document.getElementById("wd-pop-pr");
    const popCuText = document.getElementById("wd-pop-cu");

    if (detailCards.length > 0 && pop) {
      let activeIndex = 0;
      const imagesList = Array.from(detailCards).map(card => {
        const imgEl = card.querySelector("img");
        return imgEl ? imgEl.getAttribute("src") : "/image.jpeg";
      });

      // Clear existing previews in popup and inject images list
      if (popMe) {
        popMe.innerHTML = "";
        imagesList.forEach((src, idx) => {
          const aspect = detailCards[idx].querySelector("._me").getAttribute("style") || "aspect-ratio: 3/4";
          popMe.insertAdjacentHTML("beforeend", `<img class="_pme ${idx === 0 ? 'o' : ''}" src="${src}" alt="Slide ${idx}" style="${aspect}; width: 100%; height:100%; object-fit:contain;" />`);
        });
      }

      function showSlide(index) {
        activeIndex = index;
        const popImgs = popMe.querySelectorAll("._pme");
        popImgs.forEach((img, idx) => {
          if (idx === index) {
            img.classList.add("o");
          } else {
            img.classList.remove("o");
          }
        });
        
        // Update digit indicator
        if (popCuText) {
          const displayIdx = index + 1;
          popCuText.textContent = displayIdx < 10 ? `0${displayIdx}` : displayIdx;
        }
      }

      // Bind opening triggers
      detailCards.forEach((card, idx) => {
        card.addEventListener("click", () => {
          showSlide(idx);
          pop.classList.add("fx");
          if (popMe) popMe.classList.add("fx");
          // Hide standard navbar on fullscreen lightbox
          document.getElementById("n").classList.add("h");
          
          // Hide mobile menu button on fullscreen lightbox
          const mNavOpen = document.getElementById("m-nav-toggle-open");
          if (mNavOpen) mNavOpen.classList.add("hidden");
        });
      });

      // Next / Prev control clicks
      if (popNe) {
        popNe.addEventListener("click", (e) => {
          e.stopPropagation();
          const nextIdx = (activeIndex + 1) % imagesList.length;
          showSlide(nextIdx);
        });
      }

      if (popPr) {
        popPr.addEventListener("click", (e) => {
          e.stopPropagation();
          const prevIdx = (activeIndex - 1 + imagesList.length) % imagesList.length;
          showSlide(prevIdx);
        });
      }

      // Close pop click trigger
      if (popCl) {
        popCl.addEventListener("click", () => {
          pop.classList.remove("fx");
          if (popMe) popMe.classList.remove("fx");
          document.getElementById("n").classList.remove("h");
          
          // Show mobile menu button on fullscreen lightbox close if on mobile viewport
          const mNavOpen = document.getElementById("m-nav-toggle-open");
          if (mNavOpen && window.innerWidth <= 768) {
            mNavOpen.classList.remove("hidden");
          }
        });
      }
    }

    // 5. Scroll Reveal Elements intersection trigger class
    const reveals = document.querySelectorAll(".fx-target, [id^='ho-ab'], .wd-li, #ho-se-co1, #ho-se-co2, #wd-n");
    
    // Initial scroll reveal observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fx");
        }
      });
    }, { threshold: 0.1 });
    
    reveals.forEach(el => observer.observe(el));

    // 6. Archive Detail Page Slider (ad page ID)
    const adCo = document.getElementById("ad-co");
    const adPr = document.getElementById("ad-pr");
    const adNe = document.getElementById("ad-ne");
    const adCuText = document.getElementById("ad-no");
    const adMe = document.getElementById("ad-me");

    if (adCo && adMe) {
      const adImgs = adMe.querySelectorAll("._me");
      if (adImgs.length > 0) {
        let activeIdx = 0;
        
        adImgs.forEach((img, idx) => {
          if (idx === 0) img.classList.add("o");
          else img.classList.remove("o");
        });

        const total = adImgs.length;
        
        function showAdSlide(index) {
          activeIdx = index;
          adImgs.forEach((img, idx) => {
            if (idx === index) img.classList.add("o");
            else img.classList.remove("o");
          });
          if (adCuText) {
            const displayIdx = index + 1;
            const padIdx = displayIdx < 10 ? `0${displayIdx}` : displayIdx;
            const padTot = total < 10 ? `0${total}` : total;
            adCuText.textContent = `${padIdx} — ${padTot}`;
          }
        }

        if (adCuText) {
          const padTot = total < 10 ? `0${total}` : total;
          adCuText.textContent = `01 — ${padTot}`;
        }

        if (adNe) {
          adNe.addEventListener("click", () => {
            const nextIdx = (activeIdx + 1) % total;
            showAdSlide(nextIdx);
          });
        }

        if (adPr) {
          adPr.addEventListener("click", () => {
            const prevIdx = (activeIdx - 1 + total) % total;
            showAdSlide(prevIdx);
          });
        }
      }
    }

    // Force layouts checks
    recalculateScrollLimit();
  }

  // 7. Mobile Navigation Toggle Controls
  const mNavToggleOpen = document.getElementById("m-nav-toggle-open");
  const mNav = document.getElementById("m-nav");
  const mNavToggleClose = document.getElementById("m-nav-toggle-close");
  const mNavCoBtn = document.getElementById("m-nav-co-btn");

  if (mNavToggleOpen && mNav) {
    mNavToggleOpen.addEventListener("click", () => {
      mNav.classList.add("fx");
      mNavToggleOpen.classList.add("hidden");
    });
  }

  if (mNavToggleClose && mNav) {
    mNavToggleClose.addEventListener("click", () => {
      mNav.classList.remove("fx");
      if (window.innerWidth <= 768) {
        mNavToggleOpen.classList.remove("hidden");
      }
    });
  }

  if (mNavCoBtn && mNav) {
    mNavCoBtn.addEventListener("click", () => {
      mNav.classList.remove("fx");
      if (window.innerWidth <= 768) {
        mNavToggleOpen.classList.remove("hidden");
      }
      
      // Centering contact card scroll logic
      const f0CoEl = document.getElementById("f0-co");
      if (f0CoEl) {
        const f0CoRect = f0CoEl.getBoundingClientRect();
        const desiredScroll = (currentScroll + f0CoRect.top + f0CoRect.height / 2) - (window.innerHeight / 2);
        targetScroll = Math.max(0, Math.min(maxScroll, desiredScroll));
      } else {
        shouldScrollToContactOnLoad = true;
        navigate("/", false);
      }
    });
  }
});
