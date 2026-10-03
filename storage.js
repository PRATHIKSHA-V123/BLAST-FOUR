// ===== Saves scores in the browser (localStorage) =====

const Store = {
  get(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem('b4_' + key));
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem('b4_' + key, JSON.stringify(value));
    } catch (error) {
      // storage blocked: the game still works, scores just aren't saved
    }
  },
};

function todayKey() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}
