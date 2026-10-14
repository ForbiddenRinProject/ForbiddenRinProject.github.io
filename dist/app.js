'use strict';

(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const KEYS = { draft: 'forbidden.content.v1', prefs: 'forbidden.preferences.v1', progress: 'forbidden.progress.v1' };
  const fallback = { title: 'Forbidden', author: 'Rin', tagline: 'A world within the pages.', description: 'Open the book. Discover its characters. Explore the world beyond the words.', chapters: [], characters: [], map: { image: '', title: 'The world of Forbidden', description: '', locations: [] } };
  let data = structuredClone(fallback), activeChapter = null, activeCharacter = null, activeLocation = null;
  let route = 'home', entered = false, entering = false, flashTimer, entranceHideTimer, toastTimer;
  const introTimers = new Set();
  let pendingPortrait = '', pendingMap = '', storageWarning = false;
  const uid = () => globalThis.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  function readStore(key, defaultValue) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : defaultValue; } catch { return defaultValue; } }
  function writeStore(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
  const storedPrefs = readStore(KEYS.prefs, {});
  const prefs = { font: 18, night: false, paused: false, motionOverride: false, musicMuted: false, musicVolume: .45, ...(storedPrefs && typeof storedPrefs === 'object' && !Array.isArray(storedPrefs) ? storedPrefs : {}) };
  const reducedSceneMotion = matchMedia('(prefers-reduced-motion: reduce)');
  prefs.font = Math.max(14, Math.min(26, Number(prefs.font) || 18));
  prefs.musicVolume = Number.isFinite(Number(prefs.musicVolume)) ? Math.max(0, Math.min(1, Number(prefs.musicVolume))) : .45;
  let progress = readStore(KEYS.progress, {});
  if (!progress || typeof progress !== 'object') progress = {};

  function textNode(tag, text, className) { const node = document.createElement(tag); node.textContent = text; if (className) node.className = className; return node; }
  function icon(name, className = 'icon') { const ns = 'http://www.w3.org/2000/svg'; const el = document.createElementNS(ns, 'svg'); el.setAttribute('class', className); const use = document.createElementNS(ns, 'use'); use.setAttribute('href', `#i-${name}`); el.append(use); return el; }
  function notice(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4500); }
  const music = $('#background-music');
  const introAudio = $('#intro-sound');
  let musicStarted = false, introSoundActive = false, introSoundVersion = 0;
  function applySoundVolumes() {
    introAudio.muted = !!prefs.musicMuted;
    introAudio.volume = prefs.musicVolume * .85;
    const release = Math.max(0, Math.min(1, ((Number(introAudio.currentTime) || 0) - 5.35) / 1.25));
    const restored = .62 + .38 * release * release * (3 - 2 * release);
    music.volume = prefs.musicVolume * (introSoundActive && !introAudio.muted ? restored : 1);
  }
  function soundIsPlaying() {
    return !prefs.musicMuted && prefs.musicVolume > 0 && ((musicStarted && !music.paused) || (introSoundActive && !introAudio.paused));
  }
  function stopIntroSound() {
    introSoundVersion++; introSoundActive = false;
    introAudio.pause();
    try { introAudio.currentTime = 0; } catch {}
    applySoundVolumes(); updateMusicControls();
  }
  function playIntroSound() {
    stopIntroSound();
    const version = ++introSoundVersion;
    introSoundActive = true; applySoundVolumes();
    // Unlock this preloaded track directly from the same book click as the music.
    const playing = introAudio.play();
    if (playing && typeof playing.catch === 'function') playing.catch(() => {
      if (version !== introSoundVersion) return;
      introSoundActive = false; applySoundVolumes(); updateMusicControls();
    });
    updateMusicControls();
  }
  applySoundVolumes();
  $('#music-volume').value = Math.round(prefs.musicVolume * 100);
  function updateMusicControls() {
    const playing = soundIsPlaying();
    $$('[data-music-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', playing ? 'Mute music and sound effects' : 'Play music and sound effects');
      button.title = playing ? 'Mute music and sound effects' : 'Play music and sound effects';
      $('.music-state', button).textContent = playing ? 'Sound on' : musicStarted || prefs.musicMuted ? 'Sound off' : 'Sound';
    });
  }
  function playMusic(force = false) {
    if (prefs.musicMuted && !force) return;
    musicStarted = true;
    applySoundVolumes();
    // Called directly inside a click handler, so browsers can unlock audio.
    const playing = music.play();
    if (playing && typeof playing.catch === 'function') playing.catch(() => {
      updateMusicControls(); notice('Tap the sound button to start the background music.');
    });
    updateMusicControls();
  }
  $$('[data-music-toggle]').forEach(button => button.addEventListener('click', () => {
    if (!soundIsPlaying()) {
      prefs.musicMuted = false;
      if (prefs.musicVolume === 0) { prefs.musicVolume = .45; $('#music-volume').value = 45; }
      playMusic(true);
    } else { prefs.musicMuted = true; applySoundVolumes(); music.pause(); updateMusicControls(); }
    writeStore(KEYS.prefs, prefs);
  }));
  $('#music-volume').addEventListener('input', e => {
    prefs.musicVolume = Math.max(0, Math.min(1, Number(e.target.value) / 100));
    applySoundVolumes(); updateMusicControls(); writeStore(KEYS.prefs, prefs);
  });
  ['play', 'pause'].forEach(type => music.addEventListener(type, updateMusicControls));
  introAudio.addEventListener('play', updateMusicControls);
  introAudio.addEventListener('timeupdate', applySoundVolumes);
  ['ended', 'pause'].forEach(type => introAudio.addEventListener(type, () => {
    if (type === 'pause' && !introAudio.paused) return;
    introSoundActive = false; applySoundVolumes(); updateMusicControls();
  }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopIntroSound();
    if (!musicStarted || prefs.musicMuted) return;
    if (document.hidden) music.pause(); else playMusic();
  });
  updateMusicControls();
  function sizeEntranceBook() {
    const entrance = $('#entrance');
    const width = window.innerWidth || entrance.clientWidth || 1;
    const height = window.innerHeight || entrance.clientHeight || 1;
    const closedScale = Math.max(.25, Math.min(1.2, (width - 70) / 320, (height - 155) / 420));
    const openScale = Math.max(.25, Math.min(1.1, (width - 44) / 575, (height - 155) / 415));
    entrance.style.setProperty('--closed-book-scale', String(closedScale));
    entrance.style.setProperty('--open-book-scale', String(openScale));
  }
  sizeEntranceBook();
  window.addEventListener('resize', sizeEntranceBook);
  function environmentalMotionPaused() { return !!prefs.paused || (reducedSceneMotion.matches && !prefs.motionOverride); }
  function syncSceneMotion() {
    const paused = environmentalMotionPaused() || document.hidden;
    const scene = $('.garden-scene');
    const entrance = $('#entrance');
    const roomRunning = !paused && !entered && entrance.classList.contains('in-room') && !entrance.classList.contains('scene-transition');
    const method = roomRunning ? 'unpauseAnimations' : 'pauseAnimations';
    if (scene && typeof scene[method] === 'function') scene[method]();
    window.ForbiddenAtmosphere?.setMotionEnabled(!paused && !entering);
  }
  document.addEventListener('visibilitychange', syncSceneMotion);
  if (typeof reducedSceneMotion.addEventListener === 'function') reducedSceneMotion.addEventListener('change', applyPrefs);
  function safeImage(value) {
    if (typeof value !== 'string' || value.length > 5_000_000) return '';
    if (/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(value)) return value;
    if (/^https:\/\//i.test(value)) { try { return new URL(value).href; } catch { return ''; } }
    if (value && !value.startsWith('//') && !/[\\\x00-\x1f]/.test(value)) {
      try { const url = new URL(value, location.href); return url.origin === location.origin ? value : ''; } catch { return ''; }
    }
    return '';
  }
  function cleanText(value, limit = 1000000) { return typeof value === 'string' ? value.slice(0, limit) : ''; }
  function validateContent(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Please import a book content JSON object.');
    if (typeof raw.title !== 'string' || !raw.title.trim() || !Array.isArray(raw.chapters) || !Array.isArray(raw.characters)) throw new Error('The file needs a title, chapters, and characters. Export a file here to see the format.');
    const unique = (list, prepare) => { const used = new Set(); return list.filter(x => x && typeof x === 'object').slice(0, 500).map(x => { let id = cleanText(x.id, 100); if (!id || used.has(id)) id = uid(); used.add(id); return { id, ...prepare(x) }; }); };
    return {
      title: cleanText(raw.title, 80).trim(), author: cleanText(raw.author, 80) || 'Rin', tagline: cleanText(raw.tagline, 180), description: cleanText(raw.description, 2000),
      chapters: unique(raw.chapters, x => ({ title: cleanText(x.title, 200) || 'Untitled chapter', subtitle: cleanText(x.subtitle, 300), text: cleanText(x.text) })),
      characters: unique(raw.characters, x => ({ name: cleanText(x.name, 100) || 'Unnamed character', role: cleanText(x.role, 180), quote: cleanText(x.quote, 600), description: cleanText(x.description, 100000), image: safeImage(x.image) })),
      map: { image: safeImage(raw.map?.image), title: cleanText(raw.map?.title, 180) || `The world of ${cleanText(raw.title, 80)}`, description: cleanText(raw.map?.description, 10000), locations: unique(Array.isArray(raw.map?.locations) ? raw.map.locations : [], x => ({ name: cleanText(x.name, 120) || 'Unnamed place', description: cleanText(x.description, 10000), x: Math.max(0, Math.min(100, Number(x.x) || 0)), y: Math.max(0, Math.min(100, Number(x.y) || 0)) })) }
    };
  }
  function updateBrand() {
    $$('[data-title]').forEach(el => { el.textContent = data.title; });
    $$('[data-author]').forEach(el => { el.textContent = data.author; });
    $$('.wordmark small').forEach(el => { el.textContent = data.author.toUpperCase(); });
    $('#home-tagline').textContent = data.tagline || 'A world within the pages.';
    $('#home-description').textContent = data.description;
    $('#footer-credit').textContent = `A STORY BY ${data.author.toUpperCase()}`;
    document.title = `${data.title} — A World Within the Pages`;
    $('meta[name="description"]').content = `${data.title} by ${data.author}. ${data.tagline}`;
    $$('.author-note').forEach(el => { el.hidden = data.chapters.length > 0 && data.characters.length > 0 && !!data.map.image; });
  }
  function applyPrefs() {
    const motionPaused = environmentalMotionPaused();
    document.body.classList.toggle('motion-paused', motionPaused);
    $('.reader-container').classList.toggle('night', !!prefs.night);
    $('#reader-page').style.setProperty('--reader-font', `${prefs.font}px`);
    $('#reader-theme').textContent = prefs.night ? '☀' : '☾';
    $('#reader-theme').setAttribute('aria-label', prefs.night ? 'Switch to parchment reading' : 'Switch to night reading');
    $$('[data-motion-toggle]').forEach(button => {
      button.setAttribute('aria-label', motionPaused ? 'Resume environmental motion' : 'Pause environmental motion');
      button.title = motionPaused ? 'Resume environmental motion' : 'Pause environmental motion';
      button.setAttribute('aria-pressed', String(!motionPaused));
      $('span', button).textContent = motionPaused ? '▷' : 'Ⅱ';
    });
    syncSceneMotion();
    $('#font-smaller').disabled = prefs.font <= 14; $('#font-larger').disabled = prefs.font >= 26;
  }
  $$('[data-motion-toggle]').forEach(button => button.addEventListener('click', () => {
    const resume = environmentalMotionPaused();
    prefs.paused = !resume; prefs.motionOverride = resume;
    applyPrefs(); writeStore(KEYS.prefs, prefs);
  }));
  $('#reader-theme').addEventListener('click', () => { prefs.night = !prefs.night; applyPrefs(); writeStore(KEYS.prefs, prefs); });
  for (const [selector, amount] of [['#font-smaller', -1], ['#font-larger', 1]]) $(selector).addEventListener('click', () => { prefs.font = Math.max(14, Math.min(26, prefs.font + amount)); applyPrefs(); writeStore(KEYS.prefs, prefs); });
  $$('.particles').forEach((container, c) => { for (let i = 0; i < 28; i++) { const p = textNode('span', '', 'particle'); p.style.setProperty('--x', `${(i * 37.7 + c * 15) % 100}%`); p.style.setProperty('--y', `${(i * 23.3) % 100}%`); p.style.setProperty('--duration', `${9 + (i % 9)}s`); p.style.setProperty('--delay', `${-(i % 14)}s`); container.append(p); } });
  const leafNamespace = 'http://www.w3.org/2000/svg';
  const leafColors = ['#8e9e42', '#baa45b', '#a4ad52', '#d2b56d'];
  for (let i = 0; i < 34; i++) {
    const origin = document.createElementNS(leafNamespace, 'g');
    origin.setAttribute('transform', `translate(${691 + (i * 43.3) % 351},${231 - (i % 4) * 11})`);
    const falling = document.createElementNS(leafNamespace, 'g'); falling.setAttribute('class', 'garden-leaf-fall');
    falling.style.setProperty('--fall-duration', `${9.5 + (i % 9) * .95}s`);
    falling.style.setProperty('--fall-delay', `${-(i * 3.17) % 25}s`);
    falling.style.setProperty('--leaf-drift', `${(i % 2 ? -1 : 1) * (20 + (i % 5) * 9)}px`);
    const sway = document.createElementNS(leafNamespace, 'g'); sway.setAttribute('class', 'garden-leaf-sway');
    sway.style.setProperty('--sway-duration', `${2.8 + (i % 5) * .45}s`);
    sway.style.setProperty('--sway-delay', `${-(i % 5)}s`);
    const leaf = document.createElementNS(leafNamespace, 'path');
    leaf.setAttribute('d', 'M0 0 C7 -7 17 -4 12 3 C6 9 2 6 0 0 Z M1 1 L11 -1');
    leaf.setAttribute('fill', leafColors[i % leafColors.length]);
    leaf.setAttribute('stroke', '#697238'); leaf.setAttribute('stroke-width', '.6');
    sway.append(leaf); falling.append(sway); origin.append(falling); $('#falling-leaves').append(origin);
  }
  for (let i = 0; i < 13; i++) {
    const origin = document.createElementNS(leafNamespace, 'g');
    origin.setAttribute('transform', `translate(${614 + (i * 77) % 530},${430 + (i * 43) % 412})`);
    const mote = document.createElementNS(leafNamespace, 'circle'); mote.setAttribute('class', 'room-dust-mote');
    mote.setAttribute('r', String(.9 + (i % 4) * .35)); mote.setAttribute('fill', '#fff5cf');
    mote.style.setProperty('--dust-duration', `${18 + (i % 6) * 2.2}s`);
    mote.style.setProperty('--dust-delay', `${-(i * 3.7) % 24}s`);
    origin.append(mote); $('#room-dust').append(origin);
  }

  function cancelIntroSequence() {
    introTimers.forEach(clearTimeout); introTimers.clear();
  }
  function introStep(delay, action) {
    const timer = setTimeout(() => {
      introTimers.delete(timer);
      if (entering && !entered) action();
    }, delay);
    introTimers.add(timer);
  }
  function resetFlash() {
    clearTimeout(flashTimer); $('#chapter-flash').classList.remove('is-lit', 'is-fading');
    $('#site').classList.remove('flash-reveal'); $('#entrance').classList.remove('flash-covered');
  }
  function revealSite(target = 'home', fromFlash = false) {
    cancelIntroSequence();
    window.ForbiddenAtmosphere?.setVisible(false);
    entered = true; entering = false;
    clearTimeout(entranceHideTimer);
    if (fromFlash) { $('#site').classList.add('flash-reveal'); $('#entrance').classList.add('flash-covered'); }
    else { resetFlash(); stopIntroSound(); }
    $('#site').inert = false; $('#site').removeAttribute('aria-hidden'); $('#site').classList.add('ready');
    $('#entrance').classList.add('departing'); $('#entrance').inert = true; $('#entrance').setAttribute('aria-hidden', 'true');
    document.body.classList.remove('intro-active');
    syncSceneMotion();
    showRoute(target, true); entranceHideTimer = setTimeout(() => { $('#entrance').hidden = true; }, 900);
  }
  function flashIntoHome() {
    const flash = $('#chapter-flash');
    flash.classList.remove('is-fading'); flash.classList.add('is-lit');
    flashTimer = setTimeout(() => {
      // Change scenes only after the whole screen is solid white.
      if (location.hash !== '#home') history.replaceState(null, '', '#home');
      revealSite('home', true);
      flashTimer = setTimeout(() => {
        flash.classList.add('is-fading'); flash.classList.remove('is-lit');
        flashTimer = setTimeout(resetFlash, 1300);
      }, 200);
    }, 480);
  }
  function openBook() {
    if (entering || entered) return;
    playMusic(); entering = true;
    $('#book').setAttribute('aria-disabled', 'true'); $('#book').tabIndex = -1;
    $('#book-hint').textContent = 'THE STORY IS OPENING…';
    if (reducedSceneMotion.matches) {
      introStep(80, () => { history.replaceState(null, '', '#home'); revealSite('home'); });
      return;
    }
    const entrance = $('#entrance');
    playIntroSound();
    entrance.classList.add('lifting', 'scene-transition');
    syncSceneMotion();
    introStep(650, () => entrance.classList.add('in-room'));
    introStep(2050, () => {
      entrance.classList.add('unsealing', 'overhead-retired');
      entrance.classList.remove('scene-transition');
      window.ForbiddenAtmosphere?.setVisible(false); syncSceneMotion();
    });
    introStep(3150, () => entrance.classList.add('pages-turning'));
    // The flash reaches white while the final sheets are still turning.
    introStep(4450, flashIntoHome);
  }
  $('#book').addEventListener('click', openBook);
  $('#book').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); openBook(); }
  });
  $$('[data-skip]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); playMusic(); history.replaceState(null, '', '#home'); revealSite('home'); }));
  $('#replay-intro').addEventListener('click', () => {
    stopIntroSound();
    cancelIntroSequence();
    clearTimeout(entranceHideTimer); resetFlash();
    entered = false; entering = false; history.replaceState(null, '', location.pathname + location.search); $('#entrance').hidden = false;
    $('#entrance').classList.remove('departing', 'lifting', 'in-room', 'unsealing', 'pages-turning', 'scene-transition', 'overhead-retired'); $('#entrance').inert = false; $('#entrance').removeAttribute('aria-hidden');
    $('#site').inert = true; $('#site').setAttribute('aria-hidden', 'true'); $('#site').classList.remove('ready');
    document.body.classList.add('intro-active');
    window.ForbiddenAtmosphere?.setVisible(true); syncSceneMotion();
    $('#book').setAttribute('aria-disabled', 'false'); $('#book').tabIndex = 0; $('#book-hint').replaceChildren(textNode('span', ''), document.createTextNode(' CLICK TO OPEN '), textNode('span', '')); sizeEntranceBook(); window.scrollTo(0, 0); $('#book').focus();
  });
  function showRoute(next, focus = false) {
    if (!['home', 'story', 'characters', 'world'].includes(next)) next = 'home';
    const changed = route !== next;
    route = next;
    $$('.view.route-enter').forEach(view => view.classList.remove('route-enter'));
    ['home', 'story', 'characters', 'world'].forEach(r => { $(`#${r}-view`).hidden = r !== route; });
    $$('[data-route]').forEach(el => { const active = el.dataset.route === route; el.classList.toggle('active', active); if (active) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (changed && entered && !reducedSceneMotion.matches) $(`#${next}-view`).classList.add('route-enter');
    if (next === 'world') requestAnimationFrame(sizePins);
    if (focus) { const heading = $(`#${next}-view h1`); heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  }
  window.addEventListener('hashchange', () => { const target = location.hash.slice(1); if (target === 'discover') return; if (!entered) revealSite(target); else showRoute(target, true); });
  $$('a[href^="#"]').filter(el => !el.hasAttribute('data-skip')).forEach(el => el.addEventListener('click', () => { const dest = el.getAttribute('href').slice(1); if (entered && dest === route) showRoute(dest, true); }));

  function renderStory() {
    const list = $('#chapter-list'); list.replaceChildren();
    $('#chapter-empty-label').hidden = data.chapters.length > 0;
    $('#chapter-controls').hidden = data.chapters.length === 0;
    $('#bookmark').disabled = data.chapters.length === 0;
    if (!data.chapters.some(x => x.id === activeChapter)) activeChapter = data.chapters.find(x => x.id === progress.chapterId)?.id || data.chapters[0]?.id || null;
    data.chapters.forEach((chapter, i) => {
      const button = textNode('button', '', 'chapter-button'); button.type = 'button'; button.classList.toggle('active', chapter.id === activeChapter);
      button.append(textNode('small', `CHAPTER ${String(i + 1).padStart(2, '0')}`), textNode('span', chapter.title));
      if (chapter.id === activeChapter) button.setAttribute('aria-current', 'true');
      button.addEventListener('click', () => selectChapter(chapter.id)); list.append(button);
    });
    const article = $('#reader-page'); article.replaceChildren();
    const chapter = data.chapters.find(x => x.id === activeChapter);
    if (!chapter) {
      $('#chapter-indicator').textContent = 'THE OPENING PAGE';
      const empty = textNode('div', '', 'empty-reader'); empty.append(icon('book', 'empty-icon'), textNode('span', 'A STORY IN THE MAKING', 'empty-kicker'), textNode('h2', 'The first page awaits.'), textNode('p', 'Your manuscript will appear here, one chapter at a time. Add your opening chapter in the Author’s Desk.'));
      const add = textNode('button', 'Add the first chapter ↗', 'text-button'); add.addEventListener('click', () => openDesk('chapters')); empty.append(add); article.append(empty); $('#reading-progress-bar').style.width = '0%'; return;
    }
    const index = data.chapters.indexOf(chapter);
    $('#chapter-indicator').textContent = `CHAPTER ${index + 1} OF ${data.chapters.length}`;
    article.append(textNode('div', `CHAPTER ${String(index + 1).padStart(2, '0')}`, 'chapter-number'), textNode('h2', chapter.title));
    if (chapter.subtitle) article.append(textNode('p', chapter.subtitle, 'chapter-subtitle'));
    if (progress.chapterId === chapter.id && progress.ratio > .03) {
      const resume = textNode('button', 'Resume from your saved place ↗', 'text-button'); resume.style.marginBottom = '20px'; resume.addEventListener('click', () => {
        const top = article.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, top - 160 + Math.max(0, article.offsetHeight - window.innerHeight + 160) * Math.min(1, progress.ratio)), behavior: prefs.paused ? 'instant' : 'smooth' });
      }); article.append(resume);
    }
    const prose = textNode('div', '', 'chapter-prose');
    chapter.text.split(/\n\s*\n/).filter(p => p.trim()).forEach(p => prose.append(textNode('p', p.trim())));
    if (!chapter.text.trim()) prose.append(textNode('p', 'This chapter has no text yet.'));
    article.append(prose, textNode('div', '✧ ✧ ✧', 'chapter-ending'));
    $('#prev-chapter').disabled = index === 0; $('#next-chapter').disabled = index === data.chapters.length - 1;
    applyPrefs(); $('#reading-progress-bar').style.width = '0%';
  }
  function selectChapter(id) { activeChapter = id; renderStory(); const top = $('#reader-page').getBoundingClientRect().top + window.scrollY - 100; window.scrollTo({ top: Math.max(0, top), behavior: 'instant' }); }
  function chapterStep(amount) { const index = data.chapters.findIndex(x => x.id === activeChapter); if (data.chapters[index + amount]) selectChapter(data.chapters[index + amount].id); }
  $('#prev-chapter').addEventListener('click', () => chapterStep(-1)); $('#next-chapter').addEventListener('click', () => chapterStep(1));
  function saveProgress(manual = false) {
    if (route !== 'story' || !activeChapter || !entered || $('#author-desk').open) return;
    const page = $('#reader-page'); const rect = page.getBoundingClientRect();
    if (!manual && rect.top > 160) return;
    const denominator = Math.max(1, page.offsetHeight - window.innerHeight + 160);
    const ratio = Math.max(0, Math.min(1, (160 - rect.top) / denominator));
    progress = { chapterId: activeChapter, ratio, updatedAt: new Date().toISOString() };
    writeStore(KEYS.progress, progress); $('#reading-progress-bar').style.width = `${Math.round(ratio * 100)}%`;
    if (manual) notice('Your place is saved in this browser.');
  }
  $('#bookmark').addEventListener('click', () => saveProgress(true));
  let scrollQueued = false;
  window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(() => { saveProgress(); scrollQueued = false; }); } }, { passive: true });

  function renderCharacters() {
    const root = $('#character-content'); root.replaceChildren();
    if (!data.characters.length) {
      const empty = textNode('div', '', 'character-empty'); const stage = textNode('div', '', 'silhouette-stage'); stage.append(textNode('span', '', 'silhouette-ring'), icon('person', '')); empty.append(stage, textNode('span', 'THE CAST IS STILL TAKING SHAPE', 'empty-kicker'), textNode('h2', 'Their stories are yet to unfold.'), textNode('p', 'Add your characters, their portraits, and the details that make them unforgettable.'));
      const button = textNode('button', 'Introduce your characters ↗', 'outline-button'); button.addEventListener('click', () => openDesk('characters')); empty.append(button); root.append(empty); return;
    }
    if (!data.characters.some(x => x.id === activeCharacter)) activeCharacter = data.characters[0].id;
    const character = data.characters.find(x => x.id === activeCharacter);
    const feature = textNode('div', '', 'character-feature'); const portrait = textNode('div', '', 'character-portrait');
    if (character.image) { const img = document.createElement('img'); img.src = safeImage(character.image); img.alt = `Portrait of ${character.name}`; img.addEventListener('error', () => { portrait.replaceChildren(icon('person', '')); }); portrait.append(img); } else portrait.append(icon('person', ''));
    const bio = textNode('div', '', 'character-bio'); bio.append(textNode('div', character.role || 'FROM THE PAGES OF ' + data.title.toUpperCase(), 'eyebrow'), textNode('h2', character.name));
    if (character.quote) bio.append(textNode('blockquote', `“${character.quote}”`, 'character-quote'));
    bio.append(textNode('p', character.description, 'character-description')); feature.append(portrait, bio); root.append(feature);
    const selector = textNode('div', '', 'character-selector'); selector.setAttribute('aria-label', 'Choose a character');
    data.characters.forEach(c => { const button = textNode('button', c.name, 'character-chip'); button.classList.toggle('active', c.id === activeCharacter); button.setAttribute('aria-pressed', String(c.id === activeCharacter)); button.addEventListener('click', () => { activeCharacter = c.id; renderCharacters(); }); selector.append(button); }); root.append(selector);
  }

  let zoom = 1, panX = 0, panY = 0, pointer = null;
  const mapViewport = $('#map-viewport');
  function mapTransform() { const maxX = mapViewport.clientWidth * (zoom - 1) / 2, maxY = mapViewport.clientHeight * (zoom - 1) / 2; panX = Math.max(-maxX, Math.min(maxX, panX)); panY = Math.max(-maxY, Math.min(maxY, panY)); $('#map-transform').style.transform = `translate(${panX}px,${panY}px) scale(${zoom})`; $('#zoom-reset').textContent = `${Math.round(zoom * 100)}%`; $('#zoom-out').disabled = !data.map.image || zoom <= 1; $('#zoom-in').disabled = !data.map.image || zoom >= 3; $('#zoom-reset').disabled = !data.map.image; }
  function sizePins() {
    const img = $('#map-image'); if (!img.naturalWidth || !mapViewport.clientWidth) return;
    const w = mapViewport.clientWidth, h = mapViewport.clientHeight; const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const actualW = img.naturalWidth * scale, actualH = img.naturalHeight * scale;
    Object.assign($('#map-pins').style, { position: 'absolute', width: `${actualW}px`, height: `${actualH}px`, left: `${(w - actualW) / 2}px`, top: `${(h - actualH) / 2}px` });
  }
  function selectLocation(id) {
    activeLocation = id; const place = data.map.locations.find(x => x.id === id);
    $('#location-name').textContent = place?.name || data.map.title || 'A world of possibilities.';
    $('#location-description').textContent = place?.description || data.map.description || 'The places and regions of your story will live here. Select a location on the map to learn more about it.';
    $$('[data-location]').forEach(el => { const selected = el.dataset.location === id; el.classList.toggle('active', selected); el.setAttribute('aria-pressed', String(selected)); });
  }
  function renderMap() {
    $('#map-name').textContent = data.map.title;
    $('#map-empty').hidden = !!data.map.image; $('#map-transform').hidden = !data.map.image;
    const img = $('#map-image'); img.alt = data.map.title || `World map for ${data.title}`;
    if (data.map.image) img.src = safeImage(data.map.image); else img.removeAttribute('src');
    $('#map-instructions').textContent = data.map.image ? 'DRAG TO EXPLORE · SELECT A PLACE' : 'THE MAP HAS YET TO BE DRAWN';
    $('#map-pins').replaceChildren(); $('#location-list').replaceChildren();
    data.map.locations.forEach(loc => {
      const pin = textNode('button', '✧', 'map-pin'); pin.title = loc.name; pin.setAttribute('aria-label', loc.name); pin.dataset.location = loc.id; pin.style.left = `${loc.x}%`; pin.style.top = `${loc.y}%`; pin.addEventListener('click', () => selectLocation(loc.id)); $('#map-pins').append(pin);
      const button = textNode('button', loc.name + ' ↗', 'location-button'); button.dataset.location = loc.id; button.addEventListener('click', () => selectLocation(loc.id)); $('#location-list').append(button);
    });
    if (!data.map.locations.some(x => x.id === activeLocation)) activeLocation = null;
    selectLocation(activeLocation); zoom = 1; panX = 0; panY = 0; mapTransform(); requestAnimationFrame(sizePins);
  }
  $('#map-image').addEventListener('load', sizePins);
  $('#map-image').addEventListener('error', () => { if (data.map.image) { notice('This map image could not be loaded. Choose another image in the Author’s Desk.'); $('#map-transform').hidden = true; $('#map-empty').hidden = false; } });
  window.addEventListener('resize', () => { sizePins(); mapTransform(); });
  $('#zoom-in').addEventListener('click', () => { zoom = Math.min(3, zoom + .25); mapTransform(); });
  $('#zoom-out').addEventListener('click', () => { zoom = Math.max(1, zoom - .25); mapTransform(); });
  $('#zoom-reset').addEventListener('click', () => { zoom = 1; panX = 0; panY = 0; mapTransform(); });
  mapViewport.addEventListener('pointerdown', e => { if (!data.map.image || e.target.closest('button')) return; pointer = { x: e.clientX, y: e.clientY, startX: panX, startY: panY }; mapViewport.setPointerCapture(e.pointerId); });
  mapViewport.addEventListener('pointermove', e => { if (!pointer) return; panX = pointer.startX + e.clientX - pointer.x; panY = pointer.startY + e.clientY - pointer.y; mapTransform(); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => mapViewport.addEventListener(type, () => { pointer = null; }));
  mapViewport.addEventListener('keydown', e => { if (!data.map.image) return; if (['+', '=', '-'].includes(e.key)) { e.preventDefault(); zoom = Math.max(1, Math.min(3, zoom + (e.key === '-' ? -.25 : .25))); } else if (e.key.startsWith('Arrow')) { e.preventDefault(); if (e.key === 'ArrowLeft') panX += 30; if (e.key === 'ArrowRight') panX -= 30; if (e.key === 'ArrowUp') panY += 30; if (e.key === 'ArrowDown') panY -= 30; } mapTransform(); });

  const desk = $('#author-desk');
  function setDeskTab(name) {
    const tab = ['book', 'chapters', 'characters', 'map'].includes(name) ? name : 'book';
    $$('[data-desk-tab]').forEach(el => { const active = el.dataset.deskTab === tab; el.setAttribute('aria-selected', String(active)); el.tabIndex = active ? 0 : -1; });
    $$('.desk-section').forEach(el => { el.hidden = el.id !== `desk-${tab}`; });
  }
  function syncDesk() {
    const form = $('#book-form'); for (const field of ['title', 'author', 'tagline', 'description']) form.elements[field].value = data[field];
    const mf = $('#map-form'); mf.elements.title.value = data.map.title; mf.elements.description.value = data.map.description; pendingMap = data.map.image; updateImagePreview('#map-preview', pendingMap);
    renderDraftLists();
  }
  function openDesk(tab = 'book') { if (!entered) revealSite('home'); syncDesk(); setDeskTab(tab === 'map' ? 'map' : tab); if (!desk.open) desk.showModal(); document.body.classList.add('desk-open'); }
  $$('[data-desk]').forEach(el => el.addEventListener('click', () => openDesk(el.dataset.desk || 'book')));
  $('#close-desk').addEventListener('click', () => desk.close());
  desk.addEventListener('close', () => document.body.classList.remove('desk-open'));
  desk.addEventListener('click', e => { if (e.target === desk) { const rect = desk.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) desk.close(); } });
  $$('[data-desk-tab]').forEach(el => {
    el.addEventListener('click', () => setDeskTab(el.dataset.deskTab));
    el.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault(); const tabs = $$('[data-desk-tab]'); const i = tabs.indexOf(el); const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; setDeskTab(tabs[next].dataset.deskTab); tabs[next].focus(); });
  });
  function updateImagePreview(selector, image) { const el = $(selector); el.hidden = !image; if (image) el.src = image; else el.removeAttribute('src'); }
  function saveDraft(message) {
    updateBrand(); renderStory(); renderCharacters(); renderMap(); renderDraftLists();
    const saved = writeStore(KEYS.draft, data); $('#draft-status').textContent = saved ? 'Draft saved in this browser' : 'Unsaved changes — export to keep them';
    notice(saved ? message + ' Saved in this browser.' : 'Your browser could not save this draft. Export your content now to keep these changes.'); storageWarning = !saved;
  }
  $('#book-form').addEventListener('submit', e => { e.preventDefault(); const f = e.currentTarget.elements; data.title = f.title.value.trim(); data.author = f.author.value.trim() || 'Rin'; data.tagline = f.tagline.value.trim(); data.description = f.description.value.trim(); saveDraft('Book details updated.'); });
  function resetChapter() { $('#chapter-form').reset(); $('#chapter-form').elements.id.value = ''; }
  $('#new-chapter').addEventListener('click', resetChapter);
  $('#chapter-form').addEventListener('submit', e => {
    e.preventDefault(); const f = e.currentTarget.elements; const chapter = { id: f.id.value || uid(), title: f.title.value.trim(), subtitle: f.subtitle.value.trim(), text: f.text.value.trim() };
    const i = data.chapters.findIndex(x => x.id === chapter.id); if (i >= 0) data.chapters[i] = chapter; else data.chapters.push(chapter); activeChapter = chapter.id; resetChapter(); saveDraft('Chapter added to the story.');
  });
  function resetCharacter() { $('#character-form').reset(); $('#character-form').elements.id.value = ''; pendingPortrait = ''; updateImagePreview('#portrait-preview', ''); }
  $('#new-character').addEventListener('click', resetCharacter);
  $('#remove-portrait').addEventListener('click', () => { pendingPortrait = ''; $('#portrait-input').value = ''; updateImagePreview('#portrait-preview', ''); });
  $('#character-form').addEventListener('submit', e => {
    e.preventDefault(); const f = e.currentTarget.elements; const character = { id: f.id.value || uid(), name: f.name.value.trim(), role: f.role.value.trim(), quote: f.quote.value.trim(), description: f.description.value.trim(), image: pendingPortrait };
    const i = data.characters.findIndex(x => x.id === character.id); if (i >= 0) data.characters[i] = character; else data.characters.push(character); activeCharacter = character.id; resetCharacter(); saveDraft('Character profile added.');
  });
  $('#map-form').addEventListener('submit', e => { e.preventDefault(); const f = e.currentTarget.elements; data.map.title = f.title.value.trim(); data.map.description = f.description.value.trim(); data.map.image = pendingMap; saveDraft('World map updated.'); });
  $('#remove-map').addEventListener('click', () => { pendingMap = ''; $('#map-input').value = ''; updateImagePreview('#map-preview', ''); notice('Artwork removed from the form. Save map to apply the change.'); });
  function resetLocation() { $('#location-form').reset(); $('#location-form').elements.id.value = ''; }
  $('#new-location').addEventListener('click', resetLocation);
  $('#location-form').addEventListener('submit', e => { e.preventDefault(); const f = e.currentTarget.elements; const place = { id: f.id.value || uid(), name: f.name.value.trim(), description: f.description.value.trim(), x: Number(f.x.value), y: Number(f.y.value) }; const i = data.map.locations.findIndex(x => x.id === place.id); if (i >= 0) data.map.locations[i] = place; else data.map.locations.push(place); resetLocation(); saveDraft('Location added to your atlas.'); });
  function draftList(selector, items, field, edit, remove) {
    const root = $(selector); root.replaceChildren();
    if (!items.length) { root.append(textNode('p', 'No entries yet. Add your first one below.', 'draft-empty')); return; }
    items.forEach((item, i) => { const row = textNode('div', '', 'draft-item'); const name = textNode('button', `${String(i + 1).padStart(2, '0')} · ${item[field]}`); name.type = 'button'; name.title = 'Edit ' + item[field]; name.addEventListener('click', () => edit(item)); const del = textNode('button', 'Delete'); del.type = 'button'; del.setAttribute('aria-label', 'Delete ' + item[field]); del.addEventListener('click', () => { if (!confirm(`Delete “${item[field]}” from this browser draft? Export your content first if you want a backup.`)) return; remove(item); }); row.append(name, del); root.append(row); });
  }
  function renderDraftLists() {
    draftList('#desk-chapter-list', data.chapters, 'title', item => { for (const key of ['id', 'title', 'subtitle', 'text']) $('#chapter-form').elements[key].value = item[key]; }, item => { data.chapters = data.chapters.filter(x => x.id !== item.id); resetChapter(); saveDraft('Chapter removed.'); });
    draftList('#desk-character-list', data.characters, 'name', item => { const form = $('#character-form'); for (const key of ['id', 'name', 'role', 'quote', 'description']) form.elements[key].value = item[key]; pendingPortrait = item.image; $('#portrait-input').value = ''; updateImagePreview('#portrait-preview', pendingPortrait); }, item => { data.characters = data.characters.filter(x => x.id !== item.id); resetCharacter(); saveDraft('Character removed.'); });
    draftList('#desk-location-list', data.map.locations, 'name', item => { for (const key of ['id', 'name', 'description', 'x', 'y']) $('#location-form').elements[key].value = item[key]; }, item => { data.map.locations = data.map.locations.filter(x => x.id !== item.id); resetLocation(); saveDraft('Location removed.'); });
  }
  async function prepareImage(file, maxEdge) {
    if (!file) return '';
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG, or WebP image.');
    if (file.size > 20 * 1024 * 1024) throw new Error('Choose an image smaller than 20 MB.');
    const url = URL.createObjectURL(file);
    try {
      const img = new Image(); img.src = url; await img.decode();
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/webp', .86);
    } finally { URL.revokeObjectURL(url); }
  }
  for (const [input, preview, type, edge] of [['#portrait-input', '#portrait-preview', 'portrait', 1100], ['#map-input', '#map-preview', 'map', 2000]]) {
    $(input).addEventListener('change', async e => { const save = type === 'map' ? $('#map-form button[type="submit"]') : $('#character-form button[type="submit"]'); save.disabled = true; try { const image = await prepareImage(e.target.files[0], edge); if (!image) return; if (type === 'map') pendingMap = image; else pendingPortrait = image; updateImagePreview(preview, image); notice('Artwork ready. Save the entry to add it to your draft.'); } catch (error) { notice(error.message); } finally { save.disabled = false; } });
  }
  $('#export-content').addEventListener('click', () => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'forbidden-book-content.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice('Content exported. Send this file back when you want it published.'); });
  $('#import-content').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    try { if (file.size > 15 * 1024 * 1024) throw new Error('Choose a content file smaller than 15 MB.'); const imported = validateContent(JSON.parse(await file.text())); if (data.chapters.length || data.characters.length || data.map.image) { if (!confirm('Replace the current browser draft with this content? Export first if you want to keep both.')) return; } data = imported; activeChapter = null; activeCharacter = null; activeLocation = null; resetChapter(); resetCharacter(); resetLocation(); syncDesk(); saveDraft('Book content imported.'); } catch (error) { notice(error instanceof SyntaxError ? 'This file is not valid JSON. Import an exported book content file.' : error.message); } finally { e.target.value = ''; }
  });
  window.addEventListener('beforeunload', e => { if (storageWarning) { e.preventDefault(); e.returnValue = ''; } });

  async function initialize() {
    try { const response = await fetch('book.json'); if (!response.ok) throw new Error('Content unavailable'); data = validateContent(await response.json()); } catch { data = structuredClone(fallback); }
    const draft = readStore(KEYS.draft, null); if (draft) { try { data = validateContent(draft); $('#draft-status').textContent = 'Browser draft loaded'; } catch { notice('The saved draft could not be read. Your published book content is loaded.'); } }
    updateBrand(); renderStory(); renderCharacters(); renderMap(); applyPrefs(); syncDesk();
    if (entered && route === 'world') sizePins();
  }
  ['assets/overhead-desk.webp', 'assets/reading-room-v2.webp', 'assets/starlit-world.webp'].forEach(src => { const image = new Image(); image.src = src; image.decode().catch(() => {}); });
  applyPrefs(); initialize();
  const initialRoute = location.hash.slice(1);
  if (['home', 'story', 'characters', 'world', 'discover'].includes(initialRoute)) { revealSite(initialRoute === 'discover' ? 'home' : initialRoute); if (initialRoute === 'discover') requestAnimationFrame(() => $('#discover').scrollIntoView()); }
})();
