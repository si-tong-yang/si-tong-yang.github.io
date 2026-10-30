(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const menu = $('.menu-toggle');
  const nav = $('#site-nav');
  function setMenu(open) {
    menu.setAttribute('aria-expanded', String(open));
    menu.lastElementChild.textContent = open ? '−' : '＋';
    nav.classList.toggle('is-open', open);
  }
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
  });
  const dialog = $('#credits-dialog');
  $('#open-credits').addEventListener('click', () => { dialog.showModal(); document.body.classList.add('dialog-open'); });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });

  const video = $('#hero-video');
  if (!video) return;
  // Reserve the opening scene's space while its single video contracts above it.
  const hero = $('.hero');
  const stage = $('.hero-stage');
  const header = $('.site-header');
  const copy = $('.hero-content');
  let sceneHeight = 0;
  let headerHeight = 0;
  let framePending = false;
  function paintScene() {
    framePending = false;
    const ribbonHeight = innerWidth <= 560 ? 72 : 88;
    const distance = Math.max(1, sceneHeight - ribbonHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / distance));
    hero.style.height = `${Math.max(ribbonHeight, sceneHeight - window.scrollY) + headerHeight}px`;
    hero.style.setProperty('--scene-fade', String(Math.max(0, 1 - progress * 2)));
    hero.classList.toggle('is-ribbon', progress > .92);
    $('.home-research').style.setProperty('--research-reveal', String(Math.min(1, Math.max(0, window.scrollY / 220))));
    const control = $('#video-toggle');
    const start = headerHeight + sceneHeight - 36;
    const end = headerHeight / 2;
    const blend = progress * progress * (3 - 2 * progress);
    control.style.top = `${start + (end - start) * blend}px`;
    control.style.setProperty('--control-border', String(1 - progress));
    control.classList.toggle('is-integrated', progress > .8);
    header.classList.toggle('film-integrated', progress > .8);
    copy.inert = progress > .55;
  }
  function sizeScene() {
    headerHeight = header.getBoundingClientRect().height;
    sceneHeight = Math.max(1, innerHeight - headerHeight);
    stage.style.height = `${sceneHeight}px`;
    hero.style.top = '0px';
    document.documentElement.style.setProperty('--scene-header', `${headerHeight}px`);
    paintScene();
  }
  sizeScene();
  document.body.classList.add('scroll-scene-ready');
  window.addEventListener('resize', sizeScene);
  window.addEventListener('scroll', () => {
    if (!framePending) { framePending = true; requestAnimationFrame(paintScene); }
  }, {passive: true});
  const toggle = $('#video-toggle');
  document.body.append(toggle); // Keep the moving control above the transparent navigation.
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection?.saveData);
  let manualPause = motion.matches || saveData;
  let visible = true;
  function syncButton() {
    const playing = !video.paused;
    $('#video-icon').textContent = playing ? 'Ⅱ' : '▷';
    $('#video-label').textContent = playing ? 'Pause film' : 'Play film';
    toggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} background video`);
  }
  function load() {
    const source = video.querySelector('source[data-src]');
    if (source) { source.src = source.dataset.src; delete source.dataset.src; video.load(); }
  }
  async function play() {
    load();
    try { await video.play(); } catch (_) { syncButton(); }
  }
  toggle.addEventListener('click', () => {
    if (video.paused) { manualPause = false; play(); }
    else { manualPause = true; video.pause(); }
  });
  video.addEventListener('playing', () => { video.classList.add('is-ready'); syncButton(); });
  video.addEventListener('pause', syncButton);
  video.addEventListener('error', () => { video.classList.remove('is-ready'); syncButton(); });
  motion.addEventListener('change', event => {
    manualPause = event.matches || saveData;
    if (manualPause) video.pause(); else if (visible && !document.hidden && !dialog.open) play();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) video.pause(); else if (!manualPause && !document.hidden && !dialog.open) play();
  }, {threshold: .05}).observe($('.hero'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause(); else if (visible && !manualPause && !dialog.open) play();
  });
  $('#open-credits').addEventListener('click', () => video.pause());
  dialog.addEventListener('close', () => { if (visible && !manualPause && !motion.matches && !document.hidden) play(); });
  if (!manualPause) play();
})();
