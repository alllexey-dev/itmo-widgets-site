// Applies the saved theme before the first paint so a manual choice does not flash.
(function () {
  try {
    var theme = localStorage.getItem('iw-theme');
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.dataset.theme = theme;
    }
  } catch (e) {
    // Storage is unavailable: the system scheme applies.
  }
})();
