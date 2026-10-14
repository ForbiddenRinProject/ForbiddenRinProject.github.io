'use strict';

(() => {
  const canvas = document.querySelector('#desk-atmosphere');
  const context = canvas?.getContext('2d');
  if (!context) return;
  const scene = { width: 1672, height: 941, teaX: 430, teaY: 272 };
  let width = 1, height = 1, density = 1;
  let time = 2.4, lastFrame = null, lastPaint = null, frame = null;
  let enabled = false, visible = true;
  const tau = Math.PI * 2;
  const fraction = value => value - Math.floor(value);

  function rays(t) {
    const beams = [
      { x: 1440, end: 790, width: 84, phase: .3, strength: .29 },
      { x: 1150, end: 385, width: 44, phase: 1.5, strength: .19 },
      { x: 816, end: 135, width: 35, phase: 2.9, strength: .15 },
      { x: 1336, end: 648, width: 25, phase: 4.2, strength: .16 }
    ];
    for (const beam of beams) {
      const drift = Math.sin(t * .36 + beam.phase) * 78;
      const start = { x: beam.x + drift, y: -80 };
      const end = { x: beam.end + drift * 1.3, y: 1030 };
      const dx = end.x - start.x, dy = end.y - start.y;
      const length = Math.hypot(dx, dy), nx = dy / length, ny = -dx / length;
      const spread = beam.width * 1.5;
      const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
      const light = context.createLinearGradient(middle.x - nx * spread, middle.y - ny * spread, middle.x + nx * spread, middle.y + ny * spread);
      const glow = beam.strength * (.8 + .2 * Math.sin(t * .73 + beam.phase));
      light.addColorStop(0, 'rgba(255,242,198,0)');
      light.addColorStop(.32, `rgba(255,244,205,${glow * .42})`);
      light.addColorStop(.5, `rgba(255,249,221,${glow})`);
      light.addColorStop(.68, `rgba(255,244,205,${glow * .42})`);
      light.addColorStop(1, 'rgba(255,242,198,0)');
      context.fillStyle = light;
      context.beginPath();
      context.moveTo(start.x - nx * spread, start.y - ny * spread);
      context.lineTo(start.x + nx * spread, start.y + ny * spread);
      context.lineTo(end.x + nx * spread, end.y + ny * spread);
      context.lineTo(end.x - nx * spread, end.y - ny * spread);
      context.closePath(); context.fill();
    }
    // A few slow motes make movement legible even over the baked-in sunlight.
    for (let i = 0; i < 18; i++) {
      const age = fraction(t / (14 + i % 5) + i * .137);
      const x = 1000 + (i * 69) % 430 + Math.sin(t * .55 + i) * 13;
      const y = 800 - age * 730;
      context.fillStyle = `rgba(255,251,223,${Math.sin(age * Math.PI) * .55})`;
      context.beginPath(); context.arc(x, y, 1.1 + (i % 3) * .55, 0, tau); context.fill();
    }
  }

  function steam(t) {
    const x = scene.teaX, y = scene.teaY;
    // New soft puffs expand and drift away from the tea; each has its own age.
    for (let i = 0; i < 24; i++) {
      const age = fraction(t / (6 + i % 4 * .55) + i * .173);
      const drift = Math.sin(age * 5.5 - t * .8 + i * 1.9) * age * 23;
      const px = x + Math.sin(i * 2.6) * 10 + drift;
      const py = y - age * 165;
      const alpha = Math.sin(age * Math.PI) ** 1.4 * .07;
      context.save(); context.translate(px, py); context.scale(7 + age * 17, 10 + age * 20);
      const cloud = context.createRadialGradient(0, 0, 0, 0, 0, 1);
      cloud.addColorStop(0, `rgba(255,253,243,${alpha})`);
      cloud.addColorStop(.45, `rgba(255,250,235,${alpha * .7})`);
      cloud.addColorStop(1, 'rgba(255,250,235,0)');
      context.fillStyle = cloud; context.beginPath(); context.arc(0, 0, 1, 0, tau); context.fill(); context.restore();
    }
    // The curves deform every frame, rather than translating a fixed silhouette.
    context.lineCap = 'round'; context.lineJoin = 'round';
    for (let i = 0; i < 5; i++) {
      const age = fraction(t / (5.8 + i * .4) + i * .219);
      const reach = 25 + age * 145;
      const fade = Math.sin(age * Math.PI) ** .8;
      const points = [];
      for (let j = 0; j <= 14; j++) {
        const p = j / 14;
        const bend = Math.sin(p * 8 - t * 1.25 + i * 2.1) * (3 + p * 15);
        points.push({ x: x + (i - 2) * 5 + bend + Math.sin(t * .6 + i) * p * 14, y: y - p * reach });
      }
      const vapor = context.createLinearGradient(x, y, x, y - reach);
      vapor.addColorStop(0, `rgba(255,251,236,${.04 * fade})`);
      vapor.addColorStop(.3, `rgba(255,253,243,${.23 * fade})`);
      vapor.addColorStop(.68, `rgba(255,253,243,${.15 * fade})`);
      vapor.addColorStop(1, 'rgba(255,253,243,0)');
      context.strokeStyle = vapor; context.lineWidth = 4 + age * 6; context.filter = 'none';
      context.beginPath(); context.moveTo(points[0].x, points[0].y);
      for (let j = 1; j < points.length - 1; j++) {
        const point = points[j], next = points[j + 1];
        context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
      }
      context.lineTo(points.at(-1).x, points.at(-1).y); context.stroke();
    }
    context.filter = 'none';
  }

  function draw() {
    context.setTransform(density, 0, 0, density, 0, 0);
    context.clearRect(0, 0, width, height);
    const scale = Math.max(width / scene.width, height / scene.height);
    context.save();
    context.translate((width - scene.width * scale) / 2, (height - scene.height * scale) / 2);
    context.scale(scale, scale);
    rays(time); steam(time); context.restore();
  }
  function animate(timestamp) {
    frame = null;
    if (!enabled || !visible || document.hidden) { lastFrame = null; return; }
    if (lastFrame !== null) time += Math.min(.07, Math.max(0, (timestamp - lastFrame) / 1000));
    lastFrame = timestamp;
    // Slow steam and sunlight need 30 paints per second, not a full redraw at 120Hz.
    if (lastPaint === null || timestamp - lastPaint >= 1000 / 30) { draw(); lastPaint = timestamp; }
    frame = requestAnimationFrame(animate);
  }
  function synchronize() {
    const running = enabled && visible && !document.hidden;
    if (!running && frame !== null) { cancelAnimationFrame(frame); frame = null; lastFrame = null; lastPaint = null; }
    if (running && frame === null) frame = requestAnimationFrame(animate);
  }
  function resize() {
    width = window.innerWidth || canvas.clientWidth || 1;
    height = window.innerHeight || canvas.clientHeight || 1;
    density = Math.min(window.devicePixelRatio || 1, 1.35, 1600 / width, 1100 / height);
    canvas.width = Math.round(width * density); canvas.height = Math.round(height * density); draw();
  }
  window.ForbiddenAtmosphere = {
    setMotionEnabled(value) { enabled = !!value; synchronize(); },
    setVisible(value) { visible = !!value; synchronize(); }
  };
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', synchronize);
  resize();
})();
