(() => {
  const $ = (id) => document.getElementById(id);

  const progress = Store.getProgress();
  const user = Store.getUser() || {
    name: "玩家",
    loginType: "guest",
    avatar: null
  };

  /* 从 URL 参数进入指定章节（仅允许已解锁章节） */
  let chapterIndex = 0;
  const queryChapter = Number(new URLSearchParams(location.search).get("chapter"));
  if (
    Number.isInteger(queryChapter) &&
    queryChapter >= 1 &&
    queryChapter <= CHAPTERS.length &&
    queryChapter <= progress.unlocked
  ) {
    chapterIndex = queryChapter - 1;
  }

  const state = {
    phase: "story", // story | discussion | completed
    watched: false,
    simulating: false,
    queue: [],
    queueIndex: -1,
    answers: [],
    transcript: [],
    busy: false,
    soundOn: true,
    timer: null,
    simTimer: null
  };

  const seatEls = {};

  /* ---------- 通用 ---------- */
  let toastTimer = null;
  function showToast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function openModal(modal) {
    modal.classList.add("open");
  }

  function closeModal(modal) {
    modal.classList.remove("open");
  }

  function addTranscript(type, text, name) {
    state.transcript.push({ type, text, name });
    if ($("transcriptModal").classList.contains("open")) {
      renderTranscript();
    }
  }

  function renderTranscript() {
    const list = $("transcriptList");
    list.innerHTML = "";
    state.transcript.forEach((item) => {
      const el = document.createElement("div");
      el.className = `transcript-item ${item.type}`;
      if (item.type === "philosopher" || item.type === "player") {
        el.innerHTML = `<p class="transcript-name">${item.name}</p><p>${item.text}</p>`;
      } else {
        el.textContent = item.text;
      }
      list.appendChild(el);
    });
    list.scrollTop = list.scrollHeight;
  }

  /* ---------- 渲染章节 ---------- */
  function renderChapter() {
    const c = getChapter(chapterIndex);

    $("chapterTitle").textContent = `第${c.no}章 · ${c.title}`;
    $("chapterStatus").textContent = `第 ${chapterIndex + 1} / ${CHAPTERS.length} 章`;
    $("storyQuote").textContent = `“${c.quote}”`;
    $("storySource").textContent = c.source;
    $("storySynopsis").textContent = c.synopsis;
    $("storyQuestion").textContent = `思辨问题：${c.question}`;
    $("videoChapterNo").textContent = c.no;
    $("btnPlayVideo").disabled = false;
    $("btnPlayVideo").textContent = "";
    $("btnPlayVideo").innerHTML = '<span class="play-triangle">▶</span>';
    $("videoProgressFill").style.width = "0%";

    $("videoPlaceholder").classList.remove("hidden");
    $("videoHint").classList.remove("hidden");
    $("storyVideo").classList.add("hidden");
    $("storyVideo").removeAttribute("src");
    $("storyPanel").classList.remove("hidden");
    $("discussionStage").classList.remove("hidden");
    $("discussionStage").classList.add("pre-story");
    $("playerInputBar").classList.add("hidden");
    $("speechLayer").classList.add("hidden");
    $("turnBadge").classList.add("hidden");

    state.phase = "story";
    state.watched = false;
    state.answers = [];
    state.transcript = [];
    state.queue = [];
    state.queueIndex = -1;
    state.busy = false;
    clearTimeout(state.timer);
    clearInterval(state.simTimer);
    state.simTimer = null;
    state.simulating = false;

    renderSeats();

    /* 探测真实视频素材；没有则保持演示模式 */
    Asset.videoExists([ASSETS.videos[chapterIndex]], (src) => {
      const video = $("storyVideo");
      if (src) {
        video.src = src;
        video.controls = true;
        video.classList.remove("hidden");
        $("videoPlaceholder").classList.add("hidden");
      }
    });
  }

  function renderUserSeat() {
    $("userName").textContent = user.name;
    Asset.setImage(
      $("userAvatar"),
      user.avatar || ASSETS.userAvatar,
      Asset.placeholderAvatar(user.name, 42)
    );
  }

  /* ---------- 视频阶段 ---------- */
  function simulateStory() {
    if (state.simulating || state.watched) return;
    state.simulating = true;
    $("btnPlayVideo").disabled = true;
    $("btnPlayVideo").innerHTML = "…";
    let t = 0;
    const DURATION = 6000;
    state.simTimer = setInterval(() => {
      t += 100;
      $("videoProgressFill").style.width = `${Math.min(100, (t / DURATION) * 100)}%`;
      if (t >= DURATION) {
        clearInterval(state.simTimer);
        state.simTimer = null;
        state.simulating = false;
        finishStory();
      }
    }, 100);
  }

  function finishStory() {
    if (state.watched) return;
    state.watched = true;
    $("btnPlayVideo").innerHTML = '<span class="play-triangle">▶</span>';
    $("btnPlayVideo").disabled = false;
    showToast("小故事已看完，开始思辨");
    startDiscussion();
  }

  /* ---------- 思辨阶段 ---------- */
  function buildQueue() {
    const c = getChapter(chapterIndex);
    const ids = Object.keys(c.debate)
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
    const queue = [];
    ids.forEach((id, i) => {
      if (i === 1) queue.push({ type: "player" });
      queue.push({ type: "philosopher", id, text: c.debate[id] });
      if (i === 4) queue.push({ type: "player" });
    });
    return queue;
  }

  function renderSeats() {
    const left = $("leftCol");
    const right = $("rightCol");
    const half = Math.ceil(PHILOSOPHERS.length / 2);
    left.innerHTML = "";
    right.innerHTML = "";
    Object.keys(seatEls).forEach((k) => delete seatEls[k]);

    PHILOSOPHERS.forEach((ph, i) => {
      const el = document.createElement("div");
      el.className = "seat";
      el.id = `seat-${ph.id}`;
      el.innerHTML = `
        <div class="seat-avatar-wrap">
          <img class="seat-avatar" alt="${ph.name}" loading="lazy">
          <span class="seat-ring"></span>
        </div>
        <p class="seat-name">${ph.name}</p>
        <p class="seat-school">${ph.school}</p>`;
      (i < half ? left : right).appendChild(el);
      seatEls[ph.id] = el;
      Asset.setImage(
        el.querySelector("img"),
        ASSETS.philosophers[ph.id].avatar,
        Asset.placeholderAvatar(ph.name, ph.hue)
      );
    });
  }

  function setSpeaking(id, on) {
    const el = seatEls[id];
    if (el) el.classList.toggle("speaking", on);
  }

  function startDiscussion() {
    const c = getChapter(chapterIndex);
    state.phase = "discussion";
    $("storyPanel").classList.add("hidden");
    $("discussionStage").classList.remove("hidden");
    $("discussionStage").classList.remove("pre-story");
    renderSeats();
    state.queue = buildQueue();
    state.queueIndex = -1;
    addTranscript("chapter", `第${c.no}章 · ${c.title}：思辨开始`);
    advanceQueue();
  }

  function advanceQueue() {
    clearTimeout(state.timer);
    state.queueIndex += 1;
    if (state.queueIndex >= state.queue.length) {
      completeChapter();
      return;
    }
    const entry = state.queue[state.queueIndex];
    if (entry.type === "player") {
      showPlayerTurn();
    } else {
      speakPhilosopher(entry);
    }
  }

  function speakPhilosopher(entry) {
    const ph = getPhilosopher(entry.id);
    setSpeaking(entry.id, true);
    $("speechName").textContent = ph.name;
    $("speechText").textContent = entry.text;
    $("speechLayer").classList.remove("hidden");
    Asset.setImage(
      $("speechAvatar"),
      ASSETS.philosophers[ph.id].avatar,
      Asset.placeholderAvatar(ph.name, ph.hue)
    );
    addTranscript("philosopher", entry.text, `${ph.name}（${ph.school}）`);
    state.busy = true;
    const delay = Math.max(2600, Math.min(4800, entry.text.length * 95));
    state.timer = setTimeout(() => {
      setSpeaking(entry.id, false);
      $("speechLayer").classList.add("hidden");
      state.busy = false;
      advanceQueue();
    }, delay);
  }

  function showPlayerTurn() {
    $("turnBadge").classList.remove("hidden");
    $("playerInputBar").classList.remove("hidden");
    $("speechLayer").classList.add("hidden");
    addTranscript("system", "轮到你发言了");
    setTimeout(() => $("playerReply").focus(), 300);
  }

  function submitReply() {
    const text = $("playerReply").value.trim();
    if (!text) {
      showToast("先写下你的观点吧");
      return;
    }
    if (state.busy) return;
    state.answers.push(text);
    addTranscript("player", text, user.name);
    $("playerReply").value = "";
    $("playerInputBar").classList.add("hidden");
    $("turnBadge").classList.add("hidden");
    state.busy = true;
    setTimeout(() => {
      state.busy = false;
      advanceQueue();
    }, 700);
  }

  /* ---------- 章节完成 ---------- */
  function completeChapter() {
    const c = getChapter(chapterIndex);
    state.phase = "completed";
    if (!progress.completedChapters.includes(c.id)) {
      progress.completedChapters.push(c.id);
    }
    progress.answers[c.id] = state.answers;

    if (chapterIndex + 1 < CHAPTERS.length) {
      progress.unlocked = Math.max(progress.unlocked, chapterIndex + 2);
    } else {
      progress.finished = true;
    }
    Store.saveProgress(progress);
    renderDots();

    $("completeTitle").textContent = `第${c.no}章 · ${c.title} 完成`;
    const btn = $("btnCompleteNext");
    if (progress.finished) {
      $("completeText").textContent = "10 章思辨全部完成，你的哲学人格报告已经生成。";
      btn.textContent = "查看人格报告";
      btn.dataset.go = "report";
    } else {
      const next = getChapter(chapterIndex + 1);
      $("completeText").textContent = `下一章：第${next.no}章 · ${next.title}`;
      btn.textContent = "进入下一章";
      btn.dataset.go = "next";
    }
    openModal($("completeModal"));
  }

  function goChapter(i) {
    if (i < 0 || i >= CHAPTERS.length || i >= progress.unlocked) return;
    chapterIndex = i;
    try {
      history.replaceState(null, "", `game.html?chapter=${i + 1}`);
    } catch (e) {
      /* file:// 等环境下 URL 更新失败也不影响游戏 */
    }
    closeModal($("chapterModal"));
    closeModal($("completeModal"));
    renderDots();
    renderChapter();
  }

  /* ---------- 章节进度 ---------- */
  function renderDots() {
    const dots = $("chapterDots");
    dots.innerHTML = "";
    CHAPTERS.forEach((c, i) => {
      const dot = document.createElement("button");
      dot.className = "chapter-dot";
      dot.dataset.index = i;
      dot.setAttribute("aria-label", `第${c.no}章 ${c.title}`);
      if (progress.completedChapters.includes(c.id)) dot.classList.add("done");
      if (i === chapterIndex) dot.classList.add("current");
      if (i >= progress.unlocked) dot.classList.add("locked");
      dot.addEventListener("click", () => openModal($("chapterModal")));
      dots.appendChild(dot);
    });
  }

  function renderChapterList() {
    const list = $("chapterList");
    list.innerHTML = "";
    CHAPTERS.forEach((c, i) => {
      const done = progress.completedChapters.includes(c.id);
      const unlocked = i < progress.unlocked;
      const current = i === chapterIndex;
      const btn = document.createElement("button");
      btn.className = "chapter-item";
      if (done) btn.classList.add("done");
      if (current) btn.classList.add("current");
      if (!unlocked) btn.classList.add("locked");
      btn.innerHTML = `
        <span class="chapter-no">${String(i + 1).padStart(2, "0")}</span>
        <span class="chapter-name">${c.title}</span>
        <span class="chapter-state">${done ? "已完成" : current ? "进行中" : unlocked ? "已解锁" : "未解锁"}</span>`;
      if (unlocked) btn.addEventListener("click", () => goChapter(i));
      list.appendChild(btn);
    });
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    $("btnBack").addEventListener("click", () => openModal($("restartModal")));
    $("btnCloseRestart").addEventListener("click", () => closeModal($("restartModal")));
    $("btnRestartCancel").addEventListener("click", () => closeModal($("restartModal")));
    $("btnRestartConfirm").addEventListener("click", () => {
      Store.resetProgress();
      location.href = "index.html";
    });
    $("restartModal").addEventListener("click", (e) => {
      if (e.target === $("restartModal")) closeModal($("restartModal"));
    });

    $("btnChapters").addEventListener("click", () => {
      renderChapterList();
      openModal($("chapterModal"));
    });
    $("btnCloseChapters").addEventListener("click", () => closeModal($("chapterModal")));
    $("chapterModal").addEventListener("click", (e) => {
      if (e.target === $("chapterModal")) closeModal($("chapterModal"));
    });

    $("btnPlayVideo").addEventListener("click", () => {
      $("videoHint").classList.add("hidden");
      const video = $("storyVideo");
      if (video.src && !video.classList.contains("hidden")) {
        video.play();
      } else {
        simulateStory();
      }
    });
    $("storyVideo").addEventListener("ended", finishStory);
    $("storyVideo").addEventListener("play", () => {
      $("videoHint").classList.add("hidden");
    });

    $("btnSpeak").addEventListener("click", submitReply);
    $("playerReply").addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submitReply();
      }
    });
    $("btnVoice").addEventListener("click", () => {
      showToast("语音发言将在接入语音能力后开放");
    });

    $("btnTranscript").addEventListener("click", () => {
      renderTranscript();
      openModal($("transcriptModal"));
    });
    $("btnCloseTranscript").addEventListener("click", () => closeModal($("transcriptModal")));
    $("transcriptModal").addEventListener("click", (e) => {
      if (e.target === $("transcriptModal")) closeModal($("transcriptModal"));
    });

    $("btnCompleteNext").addEventListener("click", () => {
      if ($("btnCompleteNext").dataset.go === "report") {
        location.href = "report.html";
      } else {
        goChapter(chapterIndex + 1);
      }
    });

    $("btnSound").addEventListener("click", () => {
      state.soundOn = !state.soundOn;
      $("btnSound").textContent = state.soundOn ? "🔊" : "🔇";
      showToast(state.soundOn ? "音效：开（原型占位）" : "音效：关（原型占位）");
    });
  }

  /* ---------- 初始化 ---------- */
  const roomBgFallback = "radial-gradient(120% 90% at 50% 0%, #2b221a 0%, #171310 70%)";
  const roomBgQuery = window.matchMedia("(max-width: 768px)");
  const applyRoomBg = () => {
    Asset.setBgAny(
      $("gameBg"),
      roomBgQuery.matches
        ? [ASSETS.voiceRoomBgMobile, ASSETS.voiceRoomBgDesktop]
        : [ASSETS.voiceRoomBgDesktop, ASSETS.voiceRoomBgMobile],
      roomBgFallback
    );
  };
  applyRoomBg();
  if (roomBgQuery.addEventListener) {
    roomBgQuery.addEventListener("change", applyRoomBg);
  } else if (roomBgQuery.addListener) {
    roomBgQuery.addListener(applyRoomBg);
  }
  renderUserSeat();
  renderChapter();
  renderDots();
  bindEvents();
})();
