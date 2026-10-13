/* 本地进度与用户信息的存取（原型阶段使用 localStorage） */

const STORE_KEYS = {
  user: "philosophy_mbti_user",
  progress: "philosophy_mbti_progress"
};

const Store = {
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEYS.user)) || null;
    } catch (e) {
      return null;
    }
  },

  saveUser(user) {
    localStorage.setItem(STORE_KEYS.user, JSON.stringify(user));
  },

  clearUser() {
    localStorage.removeItem(STORE_KEYS.user);
  },

  defaultProgress() {
    return {
      unlocked: 1, // 已解锁到第几章（1 起）
      completedChapters: [], // 已完成章节 id 列表
      answers: {}, // { 章节id: [玩家发言...] }
      finished: false
    };
  },

  getProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEYS.progress));
      if (raw && typeof raw.unlocked === "number" && Array.isArray(raw.completedChapters)) {
        return raw;
      }
    } catch (e) {
      /* 数据损坏时回退默认 */
    }
    return this.defaultProgress();
  },

  saveProgress(progress) {
    localStorage.setItem(STORE_KEYS.progress, JSON.stringify(progress));
  },

  resetProgress() {
    localStorage.removeItem(STORE_KEYS.progress);
  }
};
