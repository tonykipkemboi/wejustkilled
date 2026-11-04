/* Runs before first paint (blocking, in <head>) so the page never flashes the wrong theme.
   Stored choice wins; otherwise follow the OS. No inline script needed, so the CSP stays strict. */
(() => {
  let t = null;
  try {
    t = localStorage.getItem('wjk-theme');
  } catch {
    /* storage blocked: follow the OS */
  }
  if (t !== 'light' && t !== 'dark') t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
})();
