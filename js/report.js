(() => {
  const $ = (id) => document.getElementById(id);

  const progress = Store.getProgress();
  const user = Store.getUser() || { name: "玩家", loginType: "guest", avatar: null };
  const answers = progress.answers || {};

  let toastTimer = null;
  function showToast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function openModal(modal) {
    modal.classList.add("open");
  }

  function closeModal(modal) {
    modal.classList.remove("open");
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      if (/^https?:/i.test(src)) img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = String(text).split("");
    let line = "";
    let currentY = y;
    for (const ch of chars) {
      const test = line + ch;
      if (line && ctx.measureText(test).width > maxWidth) {
        ctx.fillText(line, x, currentY);
        line = ch;
        currentY += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, currentY);
    return currentY;
  }

  /* ---------- 12 维评分（每题 0–10，满分 = 答题章数 × 10） ---------- */
  function computeScores() {
    const total = {};
    PHILOSOPHERS.forEach((p) => (total[p.id] = 0));
    let answeredCount = 0;
    let keywordHits = 0;

    CHAPTERS.forEach((c) => {
      const list = answers[c.id] || [];
      if (!list.length) return;
      answeredCount += 1;
      const text = list.join(" ").toLowerCase();
      const raw = {};

      PHILOSOPHERS.forEach((p) => {
        let hits = 0;
        SCORING_KEYWORDS[p.id].forEach((kw) => {
          if (text.includes(kw)) hits += kw.length >= 2 ? 2 : 1;
        });
        const boost = (c.scoring && c.scoring[p.id] && c.scoring[p.id].boost) || 1;
        raw[p.id] = hits * boost;
        keywordHits += hits;
      });

      const maxRaw = Math.max(...Object.values(raw));
      PHILOSOPHERS.forEach((p) => {
        total[p.id] +=
          maxRaw > 0 ? Math.min(10, Math.round((raw[p.id] / maxRaw) * 10)) : 5;
      });
    });

    return { total, answeredCount, keywordHits };
  }

  /* 同分优先级：颠覆 > 本心 > 思辨 > 秩序 */
  function pickTopPersona(scores) {
    const max = Math.max(...Object.values(scores));
    const topIds = PHILOSOPHERS.filter((p) => scores[p.id] === max).map((p) => p.id);
    for (const id of TIE_BREAKER) {
      if (topIds.includes(id)) return getPhilosopher(id);
    }
    return getPhilosopher(topIds[0]);
  }

  const { total: scores, answeredCount, keywordHits } = computeScores();
  const maxPossible = answeredCount * 10;
  const percentOf = (id) =>
    maxPossible > 0 ? Math.round((scores[id] / maxPossible) * 100) : 0;
  const top = pickTopPersona(scores);
  const topPersona = getPersona(top.id);

  /* ---------- 渲染 ---------- */
  function renderHero() {
    const assets = ASSETS.philosophers[top.id];
    $("heroName").textContent = top.name;
    $("heroMeta").textContent = `${topPersona.title} · ${top.camp}`;
    Asset.setBg(
      $("reportHero"),
      assets.bg,
      `linear-gradient(165deg, hsl(${top.hue}, 38%, 30%) 0%, #17120d 100%)`
    );
    Asset.setImage(
      $("reportPortrait"),
      assets.portrait,
      Asset.placeholderPortrait(top.name, top.hue, topPersona.dimension)
    );
  }

  function renderResultCard() {
    $("resultName").textContent = top.name;
    $("resultTitle").textContent = `${topPersona.title} · ${topPersona.dimension}`;
    $("resultFit").textContent = `人格契合度 ${percentOf(top.id)}%`;
    $("resultUserName").textContent = user.name;
    Asset.setImage(
      $("reportAvatar"),
      user.avatar || ASSETS.userAvatar,
      Asset.placeholderAvatar(user.name, 42)
    );

    const hint = $("stageHint");
    const notes = [];
    if (!progress.finished) {
      notes.push(`阶段性结果：已完成 ${answeredCount} / ${CHAPTERS.length} 章，全部完成后报告将更新。`);
    }
    if (keywordHits === 0) {
      notes.push("未检测到明显关键词倾向，按中性分计算；发言观点越鲜明，报告越准确。");
    }
    if (notes.length) {
      hint.textContent = notes.join(" ");
      hint.classList.remove("hidden");
    }
  }

  function renderBars() {
    const container = $("scoreBars");
    const sorted = PHILOSOPHERS.slice().sort(
      (a, b) => scores[b.id] - scores[a.id]
    );
    container.innerHTML = "";

    sorted.forEach((p, i) => {
      const persona = getPersona(p.id);
      const row = document.createElement("div");
      row.className = `bar-row${i === 0 ? " top" : ""}`;
      const color = `hsl(${p.hue}, 48%, 42%)`;
      row.innerHTML = `
        <div class="bar-head">
          <span class="bar-name">${p.name}<small>${persona.dimension}</small></span>
          <span class="bar-value">${percentOf(p.id)}%</span>
        </div>
        <span class="bar-track"><i class="bar-fill" style="background:${color}"></i></span>`;
      container.appendChild(row);
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.querySelectorAll(".bar-fill").forEach((fill, i) => {
          fill.style.width = `${Math.max(2, percentOf(sorted[i].id))}%`;
        });
      });
    });
  }

  function renderDetail() {
    const assets = ASSETS.philosophers[top.id];
    const box = $("reportDetail");
    box.innerHTML = `
      <div class="detail-head">
        <img class="detail-portrait" alt="${top.name}">
        <div>
          <h3 class="detail-name">${top.name} · ${topPersona.title}</h3>
          <p class="detail-school">${top.camp} · ${topPersona.dimension} · 契合度 ${percentOf(top.id)}%</p>
        </div>
      </div>
      <p class="detail-core"><b>核心本源</b>：${topPersona.core}</p>
      <p class="detail-position"><b>人物定位</b>：${topPersona.position}</p>
      <blockquote class="detail-quote">“${topPersona.quote}”</blockquote>
      <p class="detail-summary">${topPersona.description}</p>
      <div class="trait-list">
        ${topPersona.traits.map((t) => `<span class="trait-chip">${t}</span>`).join("")}
      </div>
      <div class="detail-talent">
        <p class="talent-title">专属天赋 · ${topPersona.talent.name}</p>
        <p>${topPersona.talent.desc}</p>
      </div>
      <p class="detail-weakness"><b>人格弱点</b>：${topPersona.weakness}</p>`;
    Asset.setImage(
      box.querySelector(".detail-portrait"),
      assets.avatar,
      Asset.placeholderAvatar(top.name, top.hue)
    );
  }

  /* ---------- 分享 ---------- */
  async function buildPoster() {
    const W = 1080;
    const H = 1560;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const assets = ASSETS.philosophers[top.id];

    /* 背景 */
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `hsl(${top.hue}, 42%, 32%)`);
    grad.addColorStop(0.5, `hsl(${top.hue}, 38%, 21%)`);
    grad.addColorStop(1, "#14100c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#fff";
    circle(ctx, W - 110, 260, 340);
    circle(ctx, -150, H - 240, 320);
    ctx.globalAlpha = 1;

    /* 人物立绘水印 */
    const portrait =
      (await loadImage(assets.portrait)) ||
      (await loadImage(
        Asset.placeholderPortrait(top.name, top.hue, topPersona.dimension)
      ));
    if (portrait) {
      ctx.globalAlpha = 0.28;
      ctx.drawImage(portrait, W - 390, 30, 360, 504);
      ctx.globalAlpha = 1;
    }

    /* 顶部游戏名 */
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.font = '600 32px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("别和孔子抬杠 · 哲学思辨语音房", 72, 96);
    ctx.fillStyle = "rgba(232,207,127,.75)";
    ctx.fillRect(72, 122, 120, 6);

    /* 用户信息 */
    const avatar =
      (await loadImage(user.avatar || ASSETS.userAvatar)) ||
      (await loadImage(Asset.placeholderAvatar(user.name, 42)));
    if (avatar) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(120, 240, 64, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, 56, 176, 128, 128);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,.6)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(120, 240, 64, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    ctx.font = '600 40px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(user.name, 216, 228);
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.font = '28px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(`已完成 ${answeredCount}/10 章测评 · 本命哲学人格`, 216, 274);

    /* 结果区 */
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8cf7f";
    ctx.font = '600 34px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("我的本命哲学人格", W / 2, 470);

    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "#fff";
    ctx.font = '900 150px "Kaiti SC", "STKaiti", serif';
    ctx.fillText(top.name, W / 2, 640);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.font = '40px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(`${topPersona.title} · ${topPersona.dimension}`, W / 2, 710);

    /* 语录 */
    ctx.fillStyle = "rgba(255,255,255,.88)";
    ctx.font = '34px "Kaiti SC", "STKaiti", serif';
    ctx.fillText(`“${topPersona.quote}”`, W / 2, 880);

    /* 人格解析 */
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(232,207,127,.9)";
    ctx.font = '600 32px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("人格解析", W / 2, 968);
    ctx.fillStyle = "rgba(255,255,255,.88)";
    ctx.font = '30px "PingFang SC", "Microsoft YaHei", sans-serif';
    wrapText(ctx, topPersona.description, W / 2, 1024, 900, 52);

    /* 底部网址 */
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,.62)";
    ctx.font = '28px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("打开链接，测出你的哲学人格", W / 2, H - 128);
    ctx.fillStyle = "#e8cf7f";
    ctx.font = '600 32px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(SITE_URL, W / 2, H - 72);

    return canvas;
  }

  let posterDataUrl = null;
  async function openShareModal() {
    const btn = $("btnShare");
    btn.disabled = true;
    showToast("正在生成报告图…");
    try {
      const canvas = await buildPoster();
      posterDataUrl = canvas.toDataURL("image/png");
      $("posterImage").src = posterDataUrl;
      openModal($("shareModal"));
    } catch (e) {
      showToast("报告图生成失败，请重试");
    }
    btn.disabled = false;
  }

  /* ---------- 入口 ---------- */
  if (answeredCount === 0) {
    location.replace("index.html");
  } else {
    renderHero();
    renderResultCard();
    renderBars();
    renderDetail();

    $("btnShare").addEventListener("click", openShareModal);
    $("btnCloseShare").addEventListener("click", () => closeModal($("shareModal")));
    $("shareModal").addEventListener("click", (e) => {
      if (e.target === $("shareModal")) closeModal($("shareModal"));
    });
    $("btnDownloadPoster").addEventListener("click", () => {
      if (!posterDataUrl) return;
      const a = document.createElement("a");
      a.href = posterDataUrl;
      a.download = `我的哲学人格-${top.name}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("报告图已保存");
    });
    $("btnHomeTop").addEventListener("click", () => {
      location.href = "index.html";
    });
    $("btnHome").addEventListener("click", () => {
      location.href = "index.html";
    });
    $("btnReplay").addEventListener("click", () => openModal($("replayModal")));
    $("btnCloseReplay").addEventListener("click", () => closeModal($("replayModal")));
    $("btnReplayCancel").addEventListener("click", () => closeModal($("replayModal")));
    $("replayModal").addEventListener("click", (e) => {
      if (e.target === $("replayModal")) closeModal($("replayModal"));
    });
    $("btnReplayConfirm").addEventListener("click", () => {
      Store.resetProgress();
      location.href = "index.html";
    });
  }
})();
