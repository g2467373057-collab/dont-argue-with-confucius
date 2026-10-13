(() => {
  const $ = (id) => document.getElementById(id);

  const homeBg = $("homeBg");
  const userStatus = $("userStatus");
  const loginModal = $("loginModal");
  const rulesModal = $("rulesModal");
  const toast = $("toast");

  let toastTimer = null;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function openModal(modal) {
    modal.classList.add("open");
  }

  function closeModal(modal) {
    modal.classList.remove("open");
  }

  function renderUser() {
    const user = Store.getUser();
    if (user) {
      userStatus.textContent = `已登录：${user.name}`;
    } else {
      userStatus.textContent = "登录后可保存游戏进度";
    }
  }

  function startGame() {
    const user = Store.getUser();
    if (!user) {
      openModal(loginModal);
      return;
    }
    location.href = "game.html";
  }

  function mockLogin(user) {
    Store.saveUser(user);
    closeModal(loginModal);
    renderUser();
    showToast("登录成功");
    setTimeout(() => {
      location.href = "game.html";
    }, 400);
  }

  /* ---------- 登录 ---------- */
  $("btnWechatLogin").addEventListener("click", () => {
    $("tabWechat").classList.add("active");
    $("tabPhone").classList.remove("active");
    $("wechatPanel").classList.remove("hidden");
    $("phonePanel").classList.add("hidden");
    openModal(loginModal);
  });

  $("btnPhoneLogin").addEventListener("click", () => {
    $("tabPhone").classList.add("active");
    $("tabWechat").classList.remove("active");
    $("phonePanel").classList.remove("hidden");
    $("wechatPanel").classList.add("hidden");
    openModal(loginModal);
  });

  $("tabWechat").addEventListener("click", () => {
    $("tabWechat").classList.add("active");
    $("tabPhone").classList.remove("active");
    $("wechatPanel").classList.remove("hidden");
    $("phonePanel").classList.add("hidden");
  });

  $("tabPhone").addEventListener("click", () => {
    $("tabPhone").classList.add("active");
    $("tabWechat").classList.remove("active");
    $("phonePanel").classList.remove("hidden");
    $("wechatPanel").classList.add("hidden");
  });

  $("btnCloseLogin").addEventListener("click", () => closeModal(loginModal));
  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) closeModal(loginModal);
  });

  $("btnWechatMock").addEventListener("click", () => {
    mockLogin({
      name: "微信用户",
      loginType: "wechat",
      avatar: null
    });
  });

  let codeCountdown = 0;
  $("btnSendCode").addEventListener("click", function () {
    const phone = $("phoneInput").value.trim();
    if (!/^1\d{10}$/.test(phone)) {
      showToast("请输入正确的 11 位手机号");
      return;
    }
    $("codeInput").value = "123456";
    showToast("验证码已发送（原型固定为 123456）");
    this.disabled = true;
    codeCountdown = 60;
    this.textContent = "60s";
    const timer = setInterval(() => {
      codeCountdown -= 1;
      this.textContent = `${codeCountdown}s`;
      if (codeCountdown <= 0) {
        clearInterval(timer);
        this.disabled = false;
        this.textContent = "获取验证码";
      }
    }, 1000);
  });

  $("btnPhoneSubmit").addEventListener("click", () => {
    const phone = $("phoneInput").value.trim();
    const code = $("codeInput").value.trim();
    if (!/^1\d{10}$/.test(phone)) {
      showToast("请输入正确的 11 位手机号");
      return;
    }
    if (code !== "123456") {
      showToast("验证码错误");
      return;
    }
    mockLogin({
      name: phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2"),
      loginType: "phone",
      phone,
      avatar: null
    });
  });

  $("btnGuest").addEventListener("click", () => {
    mockLogin({
      name: "游客",
      loginType: "guest",
      avatar: null
    });
  });

  /* ---------- 规则 ---------- */
  $("btnRules").addEventListener("click", () => openModal(rulesModal));
  $("btnCloseRules").addEventListener("click", () => closeModal(rulesModal));
  $("btnRulesOk").addEventListener("click", () => closeModal(rulesModal));
  rulesModal.addEventListener("click", (e) => {
    if (e.target === rulesModal) closeModal(rulesModal);
  });

  /* ---------- 开始游戏 ---------- */
  $("btnStart").addEventListener("click", startGame);

  /* ---------- 背景 ---------- */
  const bgFallback = "linear-gradient(165deg, #2a2118 0%, #171210 100%)";
  const bgQuery = window.matchMedia("(max-width: 768px)");
  const applyBackground = () => {
    Asset.setBgAny(
      homeBg,
      bgQuery.matches
        ? [ASSETS.homeBgMobile, ASSETS.homeBgDesktop]
        : [ASSETS.homeBgDesktop, ASSETS.homeBgMobile],
      bgFallback
    );
  };
  applyBackground();
  if (bgQuery.addEventListener) {
    bgQuery.addEventListener("change", applyBackground);
  } else if (bgQuery.addListener) {
    bgQuery.addListener(applyBackground);
  }

  renderUser();
})();
