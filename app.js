
(() => {
  const STORAGE_KEY = "diamond_sutra_daily_v1";
  const sections = window.SUTRA_SECTIONS || [];
  const main = document.getElementById("main");
  const headerDate = document.getElementById("headerDate");
  const toast = document.getElementById("toast");
  const roundModal = document.getElementById("roundModal");
  const roundModalTitle = document.getElementById("roundModalTitle");
  const navButtons = [...document.querySelectorAll(".nav-button")];
  let currentView = "today";
  let readerIndex = 0;
  let toastTimer = null;

  const pad = n => String(n).padStart(2, "0");
  const localDateKey = (date = new Date()) =>
    `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;

  function formatDate(date = new Date()) {
    return new Intl.DateTimeFormat("zh-Hant", {
      year: "numeric", month: "long", day: "numeric", weekday: "short"
    }).format(date);
  }

  function shortDate(date) {
    return new Intl.DateTimeFormat("zh-Hant", { month:"numeric", day:"numeric", weekday:"short" }).format(date);
  }

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function getCounts(dateKey = localDateKey()) {
    const store = loadStore();
    const raw = store[dateKey];
    if (!raw || !Array.isArray(raw.counts)) return Array(32).fill(0);
    const counts = raw.counts.slice(0, 32).map(v => Math.max(0, Number(v) || 0));
    while (counts.length < 32) counts.push(0);
    return counts;
  }

  function setCounts(counts, dateKey = localDateKey()) {
    const store = loadStore();
    store[dateKey] = { counts: counts.slice(0,32), updatedAt: Date.now() };
    saveStore(store);
  }

  function stats(counts) {
    const full = Math.min(...counts);
    const currentDone = counts.filter(v => v > full).length;
    const touched = counts.filter(v => v > 0).length;
    return { full, currentDone, touched, round: full + 1 };
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function setNav(view) {
    navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  }

  function renderToday() {
    currentView = "today";
    setNav("today");
    const counts = getCounts();
    const s = stats(counts);
    const pct = Math.round((s.currentDone / 32) * 100);
    const firstIncomplete = counts.findIndex(v => v === s.full);
    readerIndex = firstIncomplete === -1 ? 0 : firstIncomplete;

    const cells = counts.map((count, i) => {
      const classes = [
        "section-cell",
        count > 0 ? "read-today" : "",
        count > s.full ? "current-round" : ""
      ].filter(Boolean).join(" ");
      return `<button class="${classes}" data-section="${i}" aria-label="第${i+1}分">
        ${i+1}${count > 0 ? `<span class="times">×${count}</span>` : ""}
      </button>`;
    }).join("");

    const history = [];
    for (let d=0; d<7; d++) {
      const date = new Date();
      date.setHours(12,0,0,0);
      date.setDate(date.getDate() - d);
      const key = localDateKey(date);
      const c = getCounts(key);
      const hs = stats(c);
      const label = d===0 ? "今天" : d===1 ? "昨天" : shortDate(date);
      const note = hs.currentDone ? `另讀 ${hs.currentDone}/32 分` : (hs.full ? "已完成整部" : "尚未讀誦");
      history.push(`
        <div class="history-row">
          <div>
            <div class="history-date">${label}</div>
            <div class="history-note">${note}</div>
          </div>
          <div class="history-value">${hs.full} 遍</div>
        </div>`);
    }

    main.innerHTML = `
      <section class="hero">
        <div class="hero-label">今日已完成</div>
        <div class="hero-count"><strong>${s.full}</strong><span>遍</span></div>
        <div class="hero-sub">第 ${s.round} 遍 · 已讀 ${s.currentDone}/32 分</div>
      </section>

      <section class="section-card">
        <div class="card-head">
          <h2>今日讀誦</h2>
          <div class="small">第 ${s.round} 遍</div>
        </div>
        <div class="progress-line"><span style="width:${pct}%"></span></div>
        <div class="section-grid">${cells}</div>
        <div class="legend">
          <span><i class="l1"></i>本遍已讀</span>
          <span><i class="l2"></i>今日曾讀</span>
          <span>右上角 ×N = 今日累計</span>
        </div>
        <button class="button primary full" id="continueBtn">${s.currentDone ? "繼續讀誦" : "開始今日讀誦"}</button>
      </section>

      <section class="history">
        <h2>最近 7 天</h2>
        ${history.join("")}
      </section>
    `;

    document.getElementById("continueBtn").addEventListener("click", () => openReader(readerIndex));
    document.querySelectorAll(".section-cell").forEach(btn => {
      btn.addEventListener("click", () => openReader(Number(btn.dataset.section)));
    });
  }

  function renderReader(startIndex = readerIndex) {
    currentView = "reader";
    setNav("reader");
    readerIndex = Math.min(31, Math.max(0, startIndex));
    const pages = sections.map((sec, i) => `
      <article class="sutra-page" data-index="${i}">
        <div class="sutra-num">第 ${i+1} 分</div>
        <h2 class="sutra-title">${sec.title}</h2>
        <div class="sutra-text">${sec.text.replaceAll("•", "•")}</div>
        <div class="swipe-hint">左右滑動翻頁</div>
      </article>
    `).join("");

    main.innerHTML = `
      <section class="reader-wrap">
        <div class="reader-meta">
          <button id="chapterPicker">第 <span id="readerSectionNum">${readerIndex+1}</span> / 32 分 ▾</button>
          <div class="reader-progress" id="readerRoundProgress"></div>
        </div>
        <div class="reader-track" id="readerTrack">${pages}</div>
        <div class="reader-action">
          <button class="button primary" id="markBtn">本分讀完 +1</button>
          <button class="undo-btn" id="undoBtn">撤銷</button>
        </div>
      </section>
      <div class="chapter-sheet hidden" id="chapterSheet">
        <div class="chapter-panel">
          <div class="sheet-handle"></div>
          <div class="chapter-list">
            ${sections.map((sec,i) => `<button class="chapter-row" data-jump="${i}"><strong>${i+1}</strong><span>${sec.title}</span></button>`).join("")}
          </div>
        </div>
      </div>
    `;

    const track = document.getElementById("readerTrack");
    requestAnimationFrame(() => {
      track.scrollLeft = readerIndex * track.clientWidth;
      updateReaderAction();
    });

    let raf = null;
    track.addEventListener("scroll", () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const idx = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        if (idx !== readerIndex && idx >= 0 && idx < 32) {
          readerIndex = idx;
          document.getElementById("readerSectionNum").textContent = readerIndex + 1;
          updateReaderAction();
        }
      });
    }, { passive:true });

    document.getElementById("markBtn").addEventListener("click", markCurrentSection);
    document.getElementById("undoBtn").addEventListener("click", undoCurrentSection);

    const sheet = document.getElementById("chapterSheet");
    document.getElementById("chapterPicker").addEventListener("click", () => sheet.classList.remove("hidden"));
    sheet.addEventListener("click", e => {
      if (e.target === sheet) sheet.classList.add("hidden");
    });
    document.querySelectorAll("[data-jump]").forEach(btn => {
      btn.addEventListener("click", () => {
        readerIndex = Number(btn.dataset.jump);
        sheet.classList.add("hidden");
        track.scrollTo({ left: readerIndex * track.clientWidth, behavior:"smooth" });
        document.getElementById("readerSectionNum").textContent = readerIndex + 1;
        updateReaderAction();
      });
    });
  }

  function openReader(index) {
    readerIndex = index;
    renderReader(index);
  }

  function updateReaderAction() {
    const counts = getCounts();
    const s = stats(counts);
    const markBtn = document.getElementById("markBtn");
    const undoBtn = document.getElementById("undoBtn");
    const progress = document.getElementById("readerRoundProgress");
    if (!markBtn || !undoBtn || !progress) return;

    const doneThisRound = counts[readerIndex] > s.full;
    progress.textContent = `第 ${s.round} 遍 · ${s.currentDone}/32`;

    if (doneThisRound) {
      markBtn.textContent = "本遍已讀 ✓";
      markBtn.disabled = true;
      undoBtn.style.visibility = "visible";
    } else {
      markBtn.textContent = "本分讀完 +1";
      markBtn.disabled = false;
      undoBtn.style.visibility = "hidden";
    }
  }

  function markCurrentSection() {
    const counts = getCounts();
    const before = stats(counts);
    if (counts[readerIndex] > before.full) return;
    counts[readerIndex] += 1;
    setCounts(counts);
    const after = stats(counts);

    if (after.full > before.full) {
      roundModalTitle.textContent = `今日第 ${after.full} 遍完成`;
      roundModal.classList.remove("hidden");
    } else {
      showToast(`第 ${readerIndex+1} 分已記錄`);
    }
    updateReaderAction();
  }

  function undoCurrentSection() {
    const counts = getCounts();
    const s = stats(counts);
    if (counts[readerIndex] > s.full) {
      counts[readerIndex] -= 1;
      setCounts(counts);
      showToast(`已撤銷第 ${readerIndex+1} 分`);
      updateReaderAction();
    }
  }

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.view === "today") renderToday();
      else renderReader(readerIndex);
    });
  });

  document.getElementById("roundLaterBtn").addEventListener("click", () => {
    roundModal.classList.add("hidden");
    renderToday();
  });

  document.getElementById("roundContinueBtn").addEventListener("click", () => {
    roundModal.classList.add("hidden");
    readerIndex = 0;
    renderReader(0);
  });

  document.getElementById("shareBtn").addEventListener("click", async () => {
    const data = {
      title: "金剛經每日讀誦",
      text: "一起每日讀誦《金剛經》",
      url: location.href
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(location.href);
        showToast("連結已複製，可貼到微信分享");
      }
    } catch (e) {
      if (e && e.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(location.href);
          showToast("連結已複製");
        } catch {}
      }
    }
  });

  headerDate.textContent = formatDate();

  window.addEventListener("resize", () => {
    if (currentView === "reader") {
      const track = document.getElementById("readerTrack");
      if (track) track.scrollLeft = readerIndex * track.clientWidth;
    }
  });

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }

  renderToday();
})();
