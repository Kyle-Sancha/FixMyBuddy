// Apply the saved choice before the app paints, including on slow connections.
(() => {
  let preference = 'system';
  try { preference = localStorage.getItem('fixmybuddy-theme') || 'system'; } catch { /* Follow the device when storage is blocked. */ }
  const theme = ['light', 'dark'].includes(preference) ? preference : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
