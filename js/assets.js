/* ============================================================
 * 素材统一入口
 * 后期填充素材时，只需要按下面的命名规范，把文件放进
 * 游戏美术素材/ 目录即可，代码会自动加载真实素材；
 * 找不到素材时会自动降级为程序生成的占位图/占位背景。
 * ============================================================ */

const ASSET_ROOT = "../游戏美术素材";

/* 分享海报上展示的测试网址：上线后替换为正式链接 */
const SITE_URL = "https://your-test-site.example/philosophy-mbti";

const ASSETS = {
  /* 首页背景：桌面端与移动端分别加载，尺寸建议见 README */
  homeBgDesktop: `${ASSET_ROOT}/背景图/首页背景-桌面端.png`,
  homeBgMobile: `${ASSET_ROOT}/背景图/首页背景-手机端.png`,
  homeBg: `${ASSET_ROOT}/背景图/游戏首页（需要加入游戏规则和开始游戏button）.png`,
  voiceRoomBgDesktop: `${ASSET_ROOT}/背景图/语音房背景-桌面端.png`,
  voiceRoomBgMobile: `${ASSET_ROOT}/背景图/语音房背景-手机端.png`,
  voiceRoomBg: `${ASSET_ROOT}/背景图/语音房背景-手机端.png`,
  reportBg: `${ASSET_ROOT}/背景图/测评报告背景.png`,
  userAvatar: `${ASSET_ROOT}/用户头像.png`,
  philosophers: {
    confucius: {
      avatar: `${ASSET_ROOT}/哲学家/孔子/头像.png`,
      portrait: `${ASSET_ROOT}/哲学家/孔子/立绘.png`,
      bg: `${ASSET_ROOT}/哲学家/孔子/背景.png`
    },
    laozi: {
      avatar: `${ASSET_ROOT}/哲学家/老子/头像.png`,
      portrait: `${ASSET_ROOT}/哲学家/老子/立绘.png`,
      bg: `${ASSET_ROOT}/哲学家/老子/背景.png`
    },
    mozi: {
      avatar: `${ASSET_ROOT}/哲学家/墨子/头像.png`,
      portrait: `${ASSET_ROOT}/哲学家/墨子/立绘.png`,
      bg: `${ASSET_ROOT}/哲学家/墨子/背景.png`
    },
    hanfeizi: {
      avatar: `${ASSET_ROOT}/哲学家/韩非子/头像.png`,
      portrait: `${ASSET_ROOT}/哲学家/韩非子/立绘.png`,
      bg: `${ASSET_ROOT}/哲学家/韩非子/背景.png`
    },
    zhuangzi: {
      avatar: `${ASSET_ROOT}/哲学家/庄子/头像.png`,
      portrait: `${ASSET_ROOT}/哲学家/庄子/立绘.png`,
      bg: `${ASSET_ROOT}/哲学家/庄子/背景.png`
    },
    wangyangming: {
      avatar: `${ASSET_ROOT}/哲学家/王阳明/头像.png`,
      portrait: `${ASSET_ROOT}/哲学家/王阳明/立绘.png`,
      bg: `${ASSET_ROOT}/哲学家/王阳明/背景.png`
    },
    socrates: {
      avatar: `${ASSET_ROOT}/哲学家/苏格拉底/头像.png`,
      portrait: `${ASSET_ROOT}/哲学家/苏格拉底/立绘.png`,
      bg: `${ASSET_ROOT}/哲学家/苏格拉底/背景.png`
    },
    plato: {
      avatar: `${ASSET_ROOT}/哲学家/柏拉图/头像.png`,
      portrait: `${ASSET_ROOT}/哲学家/柏拉图/立绘.png`,
      bg: `${ASSET_ROOT}/哲学家/柏拉图/背景.png`
    },
    aristotle: {
      avatar: `${ASSET_ROOT}/哲学家/亚里士多德/头像.png`,
      portrait: `${ASSET_ROOT}/哲学家/亚里士多德/立绘.png`,
      bg: `${ASSET_ROOT}/哲学家/亚里士多德/背景.png`
    },
    kant: {
      avatar: `${ASSET_ROOT}/哲学家/康德/头像.png`,
      portrait: `${ASSET_ROOT}/哲学家/康德/立绘.png`,
      bg: `${ASSET_ROOT}/哲学家/康德/背景.png`
    },
    nietzsche: {
      avatar: `${ASSET_ROOT}/哲学家/尼采/头像.png`,
      portrait: `${ASSET_ROOT}/哲学家/尼采/立绘.png`,
      bg: `${ASSET_ROOT}/哲学家/尼采/背景.png`
    },
    sartre: {
      avatar: `${ASSET_ROOT}/哲学家/萨特/头像.png`,
      portrait: `${ASSET_ROOT}/哲学家/萨特/立绘.png`,
      bg: `${ASSET_ROOT}/哲学家/萨特/背景.png`
    }
  },
  videos: [
    `${ASSET_ROOT}/视频/故事1_己欲立而立人.mp4`,
    `${ASSET_ROOT}/视频/故事2_颜回陋巷安贫乐道.mp4`,
    `${ASSET_ROOT}/视频/第03章-以直报怨.mp4`,
    `${ASSET_ROOT}/视频/第04章-阳货之避.mp4`,
    `${ASSET_ROOT}/视频/第05章-陈蔡绝粮.mp4`,
    `${ASSET_ROOT}/视频/第06章-宰予昼寝.mp4`,
    `${ASSET_ROOT}/视频/第07章-父为子隐.mp4`,
    `${ASSET_ROOT}/视频/第08章-孔子见南子.mp4`,
    `${ASSET_ROOT}/视频/第09章-三人行必有我师.mp4`,
    `${ASSET_ROOT}/视频/第10章-道不行乘桴浮于海.mp4`
  ]
};

const Asset = {
  /** 预加载一张图片：成功回调真实地址，失败回调 null */
  image(src, onReady) {
    if (!src) {
      onReady(null);
      return;
    }
    const img = new Image();
    img.onload = () => onReady(src);
    img.onerror = () => onReady(null);
    img.src = src;
  },

  /** 给元素设置背景：素材存在时用素材，否则使用 CSS 兜底 */
  setBg(el, src, fallbackCss) {
    el.style.background = fallbackCss;
    this.image(src, (ok) => {
      if (!ok) return;
      el.style.backgroundImage = `url("${ok}")`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    });
  },

  /** 从多个候选背景里选第一个能加载的，全部失败时保留 CSS 兜底 */
  setBgAny(el, srcs, fallbackCss) {
    el.style.background = fallbackCss;
    let i = 0;
    const tryNext = () => {
      if (i >= srcs.length) return;
      const src = srcs[i++];
      const img = new Image();
      img.onload = () => {
        el.style.backgroundImage = `url("${src}")`;
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
      };
      img.onerror = () => tryNext();
      img.src = src;
    };
    tryNext();
  },

  /** 给 img 设置头像/立绘：先显示占位，加载到真实素材后替换 */
  setImage(el, src, placeholder) {
    el.src = placeholder;
    this.image(src, (ok) => {
      if (ok) el.src = ok;
    });
  },

  /** 探测视频素材：从多个候选地址里找出第一个可用的 */
  videoExists(srcs, onResult) {
    let i = 0;
    let settled = false;
    const tryNext = () => {
      if (settled || i >= srcs.length) {
        if (!settled) onResult(null);
        return;
      }
      const src = srcs[i++];
      const v = document.createElement("video");
      const done = (ok) => {
        if (settled) return;
        settled = true;
        v.removeAttribute("src");
        v.load();
        onResult(ok ? src : null);
      };
      v.onloadeddata = () => done(true);
      v.onerror = () => done(false);
      v.preload = "metadata";
      v.src = src;
    };
    tryNext();
  },

  /** 生成圆形头像占位 SVG */
  placeholderAvatar(name, hue) {
    const ch = (name || "?").trim()[0] || "?";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="hsl(${hue}, 42%, 62%)"/>
        <stop offset="1" stop-color="hsl(${hue}, 48%, 34%)"/>
      </linearGradient></defs>
      <rect width="200" height="200" fill="url(#g)"/>
      <circle cx="100" cy="84" r="42" fill="rgba(255,255,255,.32)"/>
      <path d="M36 200c8-54 34-80 64-80s56 26 64 80z" fill="rgba(255,255,255,.38)"/>
      <text x="100" y="118" text-anchor="middle" font-size="48" fill="#fff" font-family="'Kaiti SC','STKaiti',serif">${ch}</text>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  },

  /** 生成立绘占位 SVG */
  placeholderPortrait(name, hue, label) {
    const ch = (name || "?").trim()[0] || "?";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="hsl(${hue}, 40%, 58%)"/>
        <stop offset="1" stop-color="hsl(${hue}, 50%, 30%)"/>
      </linearGradient></defs>
      <rect width="300" height="420" fill="url(#g)"/>
      <circle cx="150" cy="150" r="74" fill="rgba(255,255,255,.30)"/>
      <path d="M40 420c14-92 58-138 110-138s96 46 110 138z" fill="rgba(255,255,255,.36)"/>
      <text x="150" y="190" text-anchor="middle" font-size="92" fill="#fff" font-family="'Kaiti SC','STKaiti',serif">${ch}</text>
      <text x="150" y="392" text-anchor="middle" font-size="30" fill="rgba(255,255,255,.92)" font-family="'Kaiti SC','STKaiti',serif">${label || ""}</text>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
};
