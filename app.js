/* ═══════════════════════════════════════════════
   AIGNITE — Vanilla JS port of the React app
   ═══════════════════════════════════════════════ */

const ASSETS = 'assets/';

/* ─────────────────────────────
   PARTICLES BACKGROUND
   ───────────────────────────── */
function initParticles() {
  const container = document.getElementById('particlesBg');
  const count = 30;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = Math.random() * 8;
    const size = 1 + Math.random() * 2;
    const duration = 6 + Math.random() * 6;
    p.style.left = `${left}%`;
    p.style.top = `${top}%`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.animationDelay = `${delay}s`;
    p.style.animationDuration = `${duration}s`;
    container.appendChild(p);
  }
}

/* ─────────────────────────────
   SCROLL PROGRESS BAR
   ───────────────────────────── */
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    bar.style.transform = `scaleX(${progress})`;
    bar.setAttribute('aria-valuenow', Math.round(progress * 100));
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ─────────────────────────────
   COUNTDOWN TIMER
   ───────────────────────────── */
function initCountdown(targetDateStr) {
  const mount = document.getElementById('countdownTimer');

  // targetDateStr should include an explicit UTC offset (e.g. "+05:30" for IST)
  // so the countdown reads the same for every visitor, regardless of their
  // own device timezone. If no offset is present, fall back to treating it
  // as IST (the event's local timezone) instead of the browser's timezone.
  const hasOffset = /Z$|[+-]\d{2}:?\d{2}$/.test(targetDateStr.trim());
  const normalized = hasOffset ? targetDateStr : `${targetDateStr}+05:30`;
  const target = new Date(normalized).getTime();

  const padZero = (n) => String(n).padStart(2, '0');

  function calc() {
    const difference = target - Date.now();
    if (difference > 0) {
      return {
        days: Math.floor(difference / 86400000),
        hours: Math.floor((difference / 3600000) % 24),
        minutes: Math.floor((difference / 60000) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return null;
  }

  // Build the DOM once — ticking only ever touches text content afterwards,
  // so there's no flicker/re-flow every second like a full innerHTML replace.
  mount.innerHTML = `
    <div class="countdown-container">
      <div class="countdown-title">TIME REMAINING</div>
      <div class="countdown-grid">
        <div class="countdown-item">
          <span class="countdown-value" id="cdDays">00</span>
          <span class="countdown-label">DAYS</span>
        </div>
        <span class="countdown-separator">:</span>
        <div class="countdown-item">
          <span class="countdown-value" id="cdHours">00</span>
          <span class="countdown-label">HRS</span>
        </div>
        <span class="countdown-separator">:</span>
        <div class="countdown-item">
          <span class="countdown-value" id="cdMinutes">00</span>
          <span class="countdown-label">MINS</span>
        </div>
        <span class="countdown-separator">:</span>
        <div class="countdown-item">
          <span class="countdown-value" id="cdSeconds">00</span>
          <span class="countdown-label">SECS</span>
        </div>
      </div>
    </div>`;

  const els = {
    days: document.getElementById('cdDays'),
    hours: document.getElementById('cdHours'),
    minutes: document.getElementById('cdMinutes'),
    seconds: document.getElementById('cdSeconds'),
  };

  let timerId = null;

  function renderCompleted() {
    if (timerId) clearInterval(timerId);
    mount.innerHTML = `
      <div class="countdown-completed">
        <span class="completed-dot"></span>
        EVENT IS LIVE / IN PROGRESS
      </div>`;
  }

  function tick() {
    const t = calc();
    if (!t) {
      renderCompleted();
      return;
    }
    els.days.textContent = padZero(t.days);
    els.hours.textContent = padZero(t.hours);
    els.minutes.textContent = padZero(t.minutes);
    els.seconds.textContent = padZero(t.seconds);
  }

  tick();
  // Align subsequent ticks to the actual second boundary instead of just
  // firing setInterval(1000) from whenever the page happened to load —
  // this keeps it accurate and prevents visible drift over time.
  const msIntoSecond = Date.now() % 1000;
  setTimeout(() => {
    tick();
    timerId = setInterval(tick, 1000);
  }, 1000 - msIntoSecond);
}

/* ─────────────────────────────
   SCROLL-DRIVEN RING CAROUSEL
   ───────────────────────────── */
function initCarousel(items, onSelect) {
  const wrapper = document.getElementById('scrollRingWrapper');
  const ring = document.getElementById('ring');
  const roleEl = document.getElementById('ringRole');
  const nameEl = document.getElementById('ringName');
  const btnEl = document.getElementById('ringBtn');

  const count = items.length;
  const spacingAngle = 45;
  const FRONT_ANGLE = 180;

  wrapper.style.height = `${count * 55 + 50}vh`;

  // Build ring item DOM nodes once
  const itemEls = items.map((item, i) => {
    const div = document.createElement('div');
    div.className = 'ring-item';

    const img = document.createElement('img');
    img.src = ASSETS + item.imageSrc;
    img.alt = item.name;
    img.onerror = () => {
      img.style.display = 'none';
      fallback.style.display = 'flex';
    };

    const fallback = document.createElement('div');
    fallback.className = 'ring-fallback';
    fallback.style.display = 'none';
    fallback.textContent = item.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    div.appendChild(img);
    div.appendChild(fallback);
    ring.appendChild(div);
    return div;
  });

  let rotation = 180;
  let currentRot = 180;
  let targetRot = 180;
  let frontIndex = 0;

  function handleScroll() {
    const rect = wrapper.getBoundingClientRect();
    const viewH = window.innerHeight;
    const scrollDist = rect.height - viewH;
    let progress = 0;
    if (scrollDist > 0) {
      progress = -rect.top / scrollDist;
    }
    progress = Math.max(0, Math.min(1, progress));
    targetRot = 180 - progress * ((count - 1) * spacingAngle);
  }

  function renderRing() {
    let minDiff = Infinity;
    let newFrontIndex = 0;

    items.forEach((item, i) => {
      const angle = i * spacingAngle;
      const posAngle = angle + currentRot;
      const linearDiff = Math.abs(posAngle - FRONT_ANGLE);

      if (linearDiff < minDiff) {
        minDiff = linearDiff;
        newFrontIndex = i;
      }

      const stepsAway = linearDiff / spacingAngle;
      const maxStepsVisible = 3.0;

      let opacity = 0;
      let scale = 0.5;
      let zIndex = 0;

      if (stepsAway <= maxStepsVisible) {
        const t = Math.max(0, 1 - (stepsAway / maxStepsVisible));
        opacity = Math.pow(t, 1.3);
        scale = 0.5 + 0.5 * t;
        zIndex = Math.round(opacity * 100);
      }

      const el = itemEls[i];
      el.style.opacity = opacity;
      el.style.zIndex = zIndex;
      el.style.visibility = opacity > 0 ? 'visible' : 'hidden';
      el.style.transform = `rotate(${posAngle}deg) translate(var(--ring-radius)) rotate(${-posAngle}deg) scale(${scale})`;
    });

    if (newFrontIndex !== frontIndex) {
      frontIndex = newFrontIndex;
      itemEls.forEach((el, i) => el.classList.toggle('ring-item--active', i === frontIndex));
      roleEl.textContent = items[frontIndex].title;
      nameEl.textContent = items[frontIndex].name;
    }
  }

  function update() {
    currentRot += (targetRot - currentRot) * 0.08;
    if (Math.abs(targetRot - currentRot) > 0.01) {
      renderRing();
    }
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // initial paint
  roleEl.textContent = items[frontIndex].title;
  nameEl.textContent = items[frontIndex].name;
  itemEls[frontIndex].classList.add('ring-item--active');
  renderRing();
  update();

  btnEl.addEventListener('click', () => onSelect(items[frontIndex]));
}

/* ─────────────────────────────
   TYPEWRITER helper
   ───────────────────────────── */
function typeDuration(text, startDelay, wordDelay = 70) {
  return startDelay + text.split(' ').length * wordDelay + 200;
}

function renderTypewriterSpans(container, text) {
  const words = text.split(' ');
  container.innerHTML = '';
  words.forEach((word) => {
    const span = document.createElement('span');
    span.textContent = word;
    span.style.display = 'inline-block';
    span.style.marginRight = '0.28em';
    span.style.opacity = '0';
    span.style.transform = 'translateY(6px)';
    span.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    container.appendChild(span);
  });
  return container.children;
}

function startTypewriter(container, text, startDelay, wordDelay = 70) {
  const spans = renderTypewriterSpans(container, text);
  setTimeout(() => {
    let count = 0;
    const interval = setInterval(() => {
      if (spans[count]) {
        spans[count].style.opacity = '1';
        spans[count].style.transform = 'translateY(0)';
      }
      count++;
      if (count >= spans.length) clearInterval(interval);
    }, wordDelay);
  }, startDelay);
}

/* ─────────────────────────────
   ENVELOPE INTRO ANIMATION
   Plays before the invitation card opens: envelope drops in,
   wax seal cracks, flap folds open, letter slides out — then
   hands off to the named invitation card.
   ───────────────────────────── */
function playEnvelopeIntro(invitation, onDone) {
  const root = document.getElementById('invitationPortalRoot');
  document.body.style.overflow = 'hidden';

  const displayName = invitation.name.replace(/^Hon'ble\.\s*/i, '');

  const overlay = document.createElement('div');
  overlay.className = 'envelope-overlay';
  overlay.setAttribute('role', 'button');
  overlay.setAttribute('aria-label', 'Open invitation');

  overlay.innerHTML = `
    <div class="envelope-glow"></div>
    <div class="envelope-scene">
      <p class="envelope-tag">A SPECIAL INVITATION FOR</p>
      <p class="envelope-tag-name">${displayName}</p>

      <div class="envelope" id="envelopeEl">
        <div class="envelope-letter">
          <div class="envelope-letter-inner">
            <img src="${ASSETS}logo.png" class="envelope-letter-logo" alt="" onerror="this.style.display='none'" />
            <p class="envelope-letter-title">INNOVATEX</p>
            <p class="envelope-letter-sub">FOR STUDENTS · TGPCET</p>
          </div>
        </div>
        <div class="envelope-back"></div>
        <div class="envelope-front"></div>
        <div class="envelope-flap" id="envelopeFlap">
          <span class="envelope-seal">✦</span>
        </div>
      </div>

      <p class="envelope-hint" id="envelopeHint">Opening invitation…</p>
    </div>
  `;

  root.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('envelope-overlay--in'));

  const envelopeEl = overlay.querySelector('#envelopeEl');
  const flap = overlay.querySelector('#envelopeFlap');
  const hint = overlay.querySelector('#envelopeHint');

  let finished = false;
  const timeouts = [];

  function finish() {
    if (finished) return;
    finished = true;
    timeouts.forEach(clearTimeout);
    overlay.classList.add('envelope-overlay--out');
    setTimeout(() => {
      overlay.remove();
      onDone();
    }, 450);
  }

  // Animation sequence
  timeouts.push(setTimeout(() => envelopeEl.classList.add('envelope--dropped'), 150));
  timeouts.push(setTimeout(() => flap.classList.add('envelope-flap--open'), 950));
  timeouts.push(setTimeout(() => envelopeEl.classList.add('envelope--letter-out'), 1600));
  timeouts.push(setTimeout(() => { hint.textContent = 'Tap to continue'; }, 2500));
  timeouts.push(setTimeout(finish, 3100));

  // Let people skip ahead with a tap/click anywhere on the overlay
  overlay.addEventListener('click', finish);
}

/* ─────────────────────────────
   INVITATION PORTAL
   ───────────────────────────── */
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyZfRCLejc0ir6WmG6P6P2y2P5doSrlMIUql3o60qxfamm--Ftg0FLTQb4sy2QOxU8x/exec';
const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
const WEB3FORMS_KEY = '5b563a3f-cd3d-4b17-8f01-8b2dd99813ae';

function logResponse(invitation, status) {
  fetch(SHEET_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: invitation.name,
      title: invitation.title,
      status,
      time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
    }),
  }).catch((e) => console.error('Sheet logging failed:', e));

  fetch(WEB3FORMS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      subject: `INNOVATEX Invitation ${status}: ${invitation.name}`,
      from_name: 'INNOVATEX Portal',
      message: `Dear Team,\n\n${invitation.name} (${invitation.title}) has ${status === 'Accepted' ? 'accepted' : 'closed/declined'} the invitation to INNOVATEX FOR STUDENTS 2026.`,
    }),
  }).catch((e) => console.error(`Error sending ${status} email:`, e));
}

/* ─────────────────────────────
   3D TILT — real pointer/touch/gyroscope-driven card tilt
   Sets --rx / --ry / --tz / --glare-x / --glare-y / --glare-o custom
   properties on the card element; the CSS in .inv-card consumes them.
   Works with mouse movement on desktop and touch-drag + device
   orientation on mobile, and degrades to a static card when neither
   is available or the user prefers reduced motion.
   ───────────────────────────── */
function initCardTilt(card) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return () => {};

  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const MAX_TILT = isCoarsePointer ? 10 : 14; // degrees
  const MAX_TZ = 22; // px lift toward viewer
  const EASE = 0.14; // smoothing factor per animation frame

  let currentRx = 0, currentRy = 0, currentTz = 0;
  let targetRx = 0, targetRy = 0, targetTz = 0;
  let glareX = 50, glareY = 50, glareO = 0;
  let rafId = null;
  let active = true;

  function apply() {
    currentRx += (targetRx - currentRx) * EASE;
    currentRy += (targetRy - currentRy) * EASE;
    currentTz += (targetTz - currentTz) * EASE;
    card.style.setProperty('--rx', `${currentRx.toFixed(2)}deg`);
    card.style.setProperty('--ry', `${currentRy.toFixed(2)}deg`);
    card.style.setProperty('--tz', `${currentTz.toFixed(1)}px`);
    card.style.setProperty('--glare-x', `${glareX}%`);
    card.style.setProperty('--glare-y', `${glareY}%`);
    card.style.setProperty('--glare-o', glareO);

    if (active) {
      rafId = requestAnimationFrame(apply);
    }
  }
  rafId = requestAnimationFrame(apply);

  function updateFromPoint(clientX, clientY) {
    const rect = card.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;  // 0..1
    const py = (clientY - rect.top) / rect.height;  // 0..1
    const nx = px * 2 - 1; // -1..1
    const ny = py * 2 - 1;

    // Tilt away from the pointer position — pointer top-left tilts the
    // top-left corner toward the viewer, like a real reflective card.
    targetRy = nx * MAX_TILT;
    targetRx = -ny * MAX_TILT;
    targetTz = MAX_TZ;

    glareX = px * 100;
    glareY = py * 100;
    glareO = 1;
  }

  function reset() {
    targetRx = 0;
    targetRy = 0;
    targetTz = 0;
    glareO = 0;
  }

  // ── Desktop: mouse movement over the card ──
  function onMouseMove(e) {
    updateFromPoint(e.clientX, e.clientY);
  }
  function onMouseLeave() {
    reset();
  }

  // ── Mobile: touch-drag across the card (works everywhere, no
  //    permission prompt needed) ──
  function onTouchMove(e) {
    if (!e.touches || !e.touches[0]) return;
    updateFromPoint(e.touches[0].clientX, e.touches[0].clientY);
  }
  function onTouchEnd() {
    reset();
  }

  // ── Mobile: device orientation (gyroscope) tilt, layered on top when
  //    available and permitted — lets the card react to physically
  //    tilting the phone, not just dragging a finger ──
  let orientationBase = null;
  function onDeviceOrientation(e) {
    if (e.beta === null || e.gamma === null) return;
    // beta: front-back tilt (-180..180), gamma: left-right tilt (-90..90)
    if (orientationBase === null) {
      orientationBase = { beta: e.beta, gamma: e.gamma };
    }
    const dBeta = e.beta - orientationBase.beta;
    const dGamma = e.gamma - orientationBase.gamma;
    targetRx = Math.max(-MAX_TILT, Math.min(MAX_TILT, dBeta * 0.6));
    targetRy = Math.max(-MAX_TILT, Math.min(MAX_TILT, dGamma * 0.6));
    targetTz = MAX_TZ * 0.6;
    glareX = 50 + (dGamma / 45) * 50;
    glareY = 50 + (dBeta / 45) * 50;
    glareO = 0.6;
  }

  function enableOrientation() {
    if (typeof DeviceOrientationEvent === 'undefined') return;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ requires an explicit user gesture to grant this, which
      // we get from the touchstart handler below.
      DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', onDeviceOrientation);
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener('deviceorientation', onDeviceOrientation);
    }
  }

  function onFirstTouch() {
    enableOrientation();
    card.removeEventListener('touchstart', onFirstTouch);
  }

  card.addEventListener('mousemove', onMouseMove);
  card.addEventListener('mouseleave', onMouseLeave);
  card.addEventListener('touchmove', onTouchMove, { passive: true });
  card.addEventListener('touchend', onTouchEnd);
  card.addEventListener('touchcancel', onTouchEnd);
  card.addEventListener('touchstart', onFirstTouch, { passive: true });

  return function destroy() {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    card.removeEventListener('mousemove', onMouseMove);
    card.removeEventListener('mouseleave', onMouseLeave);
    card.removeEventListener('touchmove', onTouchMove);
    card.removeEventListener('touchend', onTouchEnd);
    card.removeEventListener('touchcancel', onTouchEnd);
    card.removeEventListener('touchstart', onFirstTouch);
    window.removeEventListener('deviceorientation', onDeviceOrientation);
  };
}

function openInvitationPortal(invitation, onClose) {
  const root = document.getElementById('invitationPortalRoot');
  document.body.style.overflow = 'hidden';

  const displayName = invitation.name.replace(/^Hon'ble\.\s*/i, '');
  const greetText = 'Dear Respected,';
  const bodyText = `You are cordially invited to INNOVATEX FOR STUDENTS — Organised by the Student Innovation Council at TGPCET, Nagpur.`;
  const regardsText = 'With warm regards & respect, Student Innovation Council, TGPCET, Nagpur · Innovate | Collaborate | Create Impact.';

  const t0 = 350;
  const t1 = t0 + 400;
  const t2 = typeDuration(greetText, t1, 80);
  const t3 = typeDuration(displayName, t2, 90);
  const t4 = typeDuration(bodyText, t3, 65);
  const t5 = typeDuration(regardsText, t4, 55);

  let accepted = false;
  let closed = false;

  const overlay = document.createElement('div');
  overlay.className = 'inv-overlay';
  overlay.id = 'invitationPortal';

  overlay.innerHTML = `
    <div class="inv-bg-glow"></div>
    <div class="inv-particles">
      ${Array.from({ length: 18 }, (_, i) => `<div class="inv-particle" style="--i:${i}"></div>`).join('')}
    </div>
    <button class="portal-close-btn" aria-label="Close">&times;</button>

    <div class="inv-card" id="invCard">
      <div class="inv-card-glare" aria-hidden="true"></div>
      <div class="inv-header" id="invHeader">
        <img src="${ASSETS}logo.png" alt="INNOVATEX" class="inv-logo" onerror="this.style.display='none'" />
        <div class="inv-event-info">
          <span class="inv-event-name">INNOVATEX</span>
          <span class="inv-event-sub">FOR STUDENTS · TGPCET</span>
        </div>
      </div>

      <div class="inv-portrait-frame-wrapper" id="invPortraitWrapper">
        <div class="inv-portrait-ring-glow"></div>
        <div class="inv-portrait-circular-frame">
          <img id="invPortraitImg" src="${ASSETS}${invitation.imageSrc}" alt="${invitation.name}" />
        </div>
      </div>

      <div class="inv-tw-body">
        <div class="inv-tw-greeting-container">
          <p class="inv-tw-greeting" id="invGreeting"></p>
        </div>
        <div class="inv-tw-name-container">
          <h2 class="inv-tw-name" id="invName"></h2>
        </div>
        <div class="inv-tw-message-container">
          <p class="inv-tw-message" id="invMessage"></p>
        </div>

        <div class="inv-details-grid" id="invDetails" style="opacity:0; transform:translateY(10px); transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);">
          <div class="inv-detail">
            <span class="inv-detail-label">📅 DATE</span>
            <span class="inv-detail-value">THIS SATURDAY</span>
          </div>
          <div class="inv-detail">
            <span class="inv-detail-label">⏰ TIME</span>
            <span class="inv-detail-value">4:30 PM – 6:30 PM</span>
          </div>
          <div class="inv-detail">
            <span class="inv-detail-label">📍 VENUE</span>
            <span class="inv-detail-value">TGPCET Campus</span>
          </div>
          <div class="inv-detail">
            <span class="inv-detail-label">🪙 ENTRY FEE</span>
            <span class="inv-detail-value">₹50/- Per Person</span>
          </div>
        </div>

        <div class="inv-tw-regards-container">
          <p class="inv-tw-regards" id="invRegards"></p>
        </div>
      </div>

      <div class="inv-actions" id="invActions" style="opacity:0; transform:translateY(12px); transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s; margin-top:2rem;">
        <button class="inv-btn-accept" id="invAcceptBtn">
          <span class="inv-btn-icon">✓</span>
          Accept Invitation
        </button>
        <button class="inv-btn-decline" id="invDeclineBtn">
          Close
        </button>
      </div>
    </div>
  `;

  root.appendChild(overlay);

  const invPortraitImg = overlay.querySelector('#invPortraitImg');
  invPortraitImg.onerror = () => { invPortraitImg.src = `${ASSETS}difault.jpg`; };

  const invCard = overlay.querySelector('#invCard');
  const invHeader = overlay.querySelector('#invHeader');
  const invPortraitWrapper = overlay.querySelector('#invPortraitWrapper');
  const invDetails = overlay.querySelector('#invDetails');
  const invActions = overlay.querySelector('#invActions');
  const closeBtn = overlay.querySelector('.portal-close-btn');
  const acceptBtn = overlay.querySelector('#invAcceptBtn');
  const declineBtn = overlay.querySelector('#invDeclineBtn');

  // Real 3D tilt: mouse on desktop, touch-drag + gyroscope on mobile
  const destroyTilt = initCardTilt(invCard);

  // card enters
  setTimeout(() => {
    invCard.classList.add('inv-card--in');
    invHeader.classList.add('inv-el--in');
    invPortraitWrapper.classList.add('inv-portrait-frame--in');
  }, t0);

  // typewriters
  startTypewriter(overlay.querySelector('#invGreeting'), greetText, t1, 80);
  startTypewriter(overlay.querySelector('#invName'), displayName, t2, 90);
  startTypewriter(overlay.querySelector('#invMessage'), bodyText, t3, 65);
  startTypewriter(overlay.querySelector('#invRegards'), regardsText, t4, 55);

  // buttons & details reveal
  const btnTimeout = setTimeout(() => {
    invDetails.style.opacity = '1';
    invDetails.style.transform = 'translateY(0)';
    invActions.style.opacity = '1';
    invActions.style.transform = 'translateY(0)';
  }, t5);

  function cleanup(wasAccepted) {
    if (closed) return;
    closed = true;
    clearTimeout(btnTimeout);
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeyDown);
    destroyTilt();
    overlay.remove();
    onClose(wasAccepted);
  }

  function handleDecline() {
    if (!accepted) {
      logResponse(invitation, 'Declined');
    }
    cleanup(false);
  }

  function spawnSparkles() {
    const burst = document.createElement('div');
    burst.className = 'inv-sparkles';
    const rect = invCard.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    burst.innerHTML = Array.from({ length: 14 }, (_, i) =>
      `<div class="inv-sparkle" style="--i:${i}; left:${cx}px; top:${cy}px;"></div>`
    ).join('');
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 1400);
  }

  function showThankYou() {
    // Freeze the tilt in place so the thank-you content doesn't jitter,
    // then swap the card's body for a dedicated thank-you view.
    destroyTilt();
    invCard.classList.add('inv-card--accepted');
    spawnSparkles();

    const displayNameLocal = invitation.name.replace(/^Hon'ble\.\s*/i, '');

    invCard.innerHTML = `
      <div class="inv-card-glare" aria-hidden="true"></div>
      <div class="inv-thankyou" id="invThankYou">
        <div class="inv-thankyou-check">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <p class="inv-thankyou-eyebrow">RSVP Confirmed</p>
        <h2 class="inv-thankyou-title">Thank You!</h2>
        <p class="inv-thankyou-name">${displayNameLocal}</p>
        <p class="inv-thankyou-body">
          Your acceptance has been recorded. We're honoured to have you join us
          for <strong>INNOVATEX FOR STUDENTS</strong>.
        </p>
        <div class="inv-thankyou-details">
          <div class="inv-detail">
            <span class="inv-detail-label">📅 DATE</span>
            <span class="inv-detail-value">THIS SATURDAY</span>
          </div>
          <div class="inv-detail">
            <span class="inv-detail-label">⏰ TIME</span>
            <span class="inv-detail-value">4:30 PM – 6:30 PM</span>
          </div>
          <div class="inv-detail">
            <span class="inv-detail-label">📍 VENUE</span>
            <span class="inv-detail-value">TGPCET Campus</span>
          </div>
          <div class="inv-detail">
            <span class="inv-detail-label">🪙 ENTRY FEE</span>
            <span class="inv-detail-value">₹50/- Per Person</span>
          </div>
        </div>
        <p class="inv-thankyou-footer">
          See you there! — Student Innovation Council, TGPCET Nagpur
        </p>
        <button class="inv-btn-accept inv-thankyou-close" id="invThankYouClose">
          Done
        </button>
      </div>
    `;

    requestAnimationFrame(() => {
      invCard.querySelector('#invThankYou').classList.add('inv-thankyou--in');
    });

    invCard.querySelector('#invThankYouClose').addEventListener('click', () => cleanup(true));
  }

  function handleAccept() {
    accepted = true;
    logResponse(invitation, 'Accepted');
    showThankYou();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (accepted) cleanup(true);
      else handleDecline();
    }
  }

  document.addEventListener('keydown', onKeyDown);
  closeBtn.addEventListener('click', () => {
    if (accepted) cleanup(true);
    else handleDecline();
  });
  declineBtn.addEventListener('click', handleDecline);
  acceptBtn.addEventListener('click', handleAccept);
}

/* ─────────────────────────────
   UPCOMING SATURDAY HELPER
   ───────────────────────────── */
function getUpcomingSaturday() {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
  const day = istNow.getDay(); // 0 = Sun, 6 = Sat
  let diff = (6 - day + 7) % 7;
  // If today is Saturday and after 18:30 IST, target next Saturday
  if (diff === 0 && (istNow.getHours() > 18 || (istNow.getHours() === 18 && istNow.getMinutes() > 30))) {
    diff = 7;
  }
  const target = new Date(istNow);
  target.setDate(istNow.getDate() + diff);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedStr = `Saturday, ${target.getDate()} ${monthNames[target.getMonth()]}`;

  return {
    iso: `${y}-${m}-${d}T16:30:00+05:30`,
    formatted: formattedStr,
  };
}

/* ─────────────────────────────
   MODALS CONTROLLER
   ───────────────────────────── */
function initModals() {
  // Poster Lightbox Modal
  const posterModal = document.getElementById('posterModal');
  const closePosterBtn = document.getElementById('closePosterModal');
  const openPosterBtns = [document.getElementById('heroPosterBtn'), document.getElementById('cardPosterBtn')];

  function openPoster() {
    if (posterModal) posterModal.classList.add('active');
  }
  function closePoster() {
    if (posterModal) posterModal.classList.remove('active');
  }

  openPosterBtns.forEach((btn) => {
    if (btn) btn.addEventListener('click', openPoster);
  });
  if (closePosterBtn) closePosterBtn.addEventListener('click', closePoster);
  if (posterModal) {
    posterModal.addEventListener('click', (e) => {
      if (e.target === posterModal) closePoster();
    });
  }

  // Registration Modal
  const regModal = document.getElementById('regModal');
  const closeRegBtn = document.getElementById('closeRegModal');
  const openRegBtns = [
    document.getElementById('headerRegBtn'),
    document.getElementById('heroRegBtn'),
    document.getElementById('cardRegBtn'),
  ];

  function openReg() {
    if (regModal) regModal.classList.add('active');
  }
  function closeReg() {
    if (regModal) regModal.classList.remove('active');
  }

  openRegBtns.forEach((btn) => {
    if (btn) btn.addEventListener('click', openReg);
  });
  if (closeRegBtn) closeRegBtn.addEventListener('click', closeReg);
  if (regModal) {
    regModal.addEventListener('click', (e) => {
      if (e.target === regModal) closeReg();
    });
  }

  // Registration Form Submission
  const regForm = document.getElementById('regForm');
  const regModalContent = document.getElementById('regModalContent');
  if (regForm && regModalContent) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName')?.value || 'Student';
      const email = document.getElementById('regEmail')?.value || '';
      const phone = document.getElementById('regPhone')?.value || '';
      const branch = document.getElementById('regBranch')?.value || '';
      const year = document.getElementById('regYear')?.value || '';

      // Save registration locally
      try {
        const registrations = JSON.parse(localStorage.getItem('innovatex_regs') || '[]');
        registrations.push({ name, email, phone, branch, year, timestamp: new Date().toISOString() });
        localStorage.setItem('innovatex_regs', JSON.stringify(registrations));
      } catch (err) {
        console.warn('Local storage error:', err);
      }

      // Display success confirmation card
      regModalContent.innerHTML = `
        <div class="reg-success-card">
          <div class="reg-success-icon">✓</div>
          <span style="font-family:var(--font-mono); font-size:0.75rem; color:#6ee7b7; letter-spacing:2px; text-transform:uppercase;">
            Registration Confirmed
          </span>
          <h2 style="font-family:var(--font-title); font-size:1.8rem; color:#ffffff; margin:0;">
            Welcome, ${name}!
          </h2>
          <p style="font-family:var(--font-body); font-size:0.9rem; color:var(--text-muted); max-width:40ch; line-height:1.5;">
            You are officially registered for <strong style="color:#ffffff;">INNOVATEX FOR STUDENTS</strong>.
          </p>
          <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:1.2rem; width:100%; text-align:left; margin-top:0.5rem;">
            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">REGISTRATION DETAILS</div>
            <div style="font-size:0.9rem; color:#fff;"><strong>Department:</strong> ${branch} &bull; ${year}</div>
            <div style="font-size:0.85rem; color:#fff; margin-top:0.2rem;"><strong>Entry Fee:</strong> ₹50/- (Pay via QR or at Helpdesk)</div>
            <div style="font-size:0.85rem; color:var(--accent-gold-light); margin-top:0.2rem;"><strong>Time:</strong> This Saturday &bull; 4:30 PM &bull; TGPCET Campus</div>
          </div>
          <button class="btn-primary-action" id="doneRegBtn" style="margin-top:1rem; width:100%; justify-content:center;">
            Done &bull; See You at INNOVATEX
          </button>
        </div>
      `;

      document.getElementById('doneRegBtn')?.addEventListener('click', closeReg);
    });
  }

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePoster();
      closeReg();
    }
  });
}

/* ─────────────────────────────
   HOLOGRAPHIC VIP PASS HUD & DIRECTORY
   ───────────────────────────── */
function initHoloDirectory(tiers) {
  const grid = document.getElementById('holoCardsGrid');
  const searchInput = document.getElementById('dignitarySearch');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const filterBtns = document.querySelectorAll('.holo-filter-btn');
  const countAll = document.getElementById('countAll');

  if (!grid) return;

  // Flatten items with metadata
  let passCounter = 1;
  const flatItems = [];
  tiers.forEach((tier, tierIdx) => {
    tier.items.forEach((item) => {
      const padId = String(passCounter).padStart(2, '0');
      flatItems.push({
        ...item,
        tierIdx,
        tierTitle: tier.title,
        passId: `INX-VIP-${padId}`,
      });
      passCounter++;
    });
  });

  if (countAll) countAll.textContent = flatItems.length;

  let currentTier = 'all';
  let currentSearch = '';

  function renderCards() {
    grid.innerHTML = '';

    const filtered = flatItems.filter((item) => {
      const matchTier = currentTier === 'all' || String(item.tierIdx) === currentTier;
      const q = currentSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.tierTitle.toLowerCase().includes(q);
      return matchTier && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="holo-empty-state">
          <p style="font-size:1.8rem; margin-bottom:0.5rem;">🔍</p>
          <p style="font-family:var(--font-title); font-size:1.15rem; color:#fff;">No dignitaries found</p>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.3rem;">Try adjusting your search terms or category filter.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'holo-badge-card';

      const cleanName = item.name.replace(/^Hon'ble\.\s*/i, '');

      let tierShort = 'VIP PATRON';
      if (item.tierIdx === 0) tierShort = 'GOVERNANCE';
      else if (item.tierIdx === 1) tierShort = 'ACADEMIC DEAN';
      else if (item.tierIdx === 2) tierShort = 'DIRECTOR';
      else if (item.tierIdx === 3) tierShort = 'FACULTY / HOD';

      card.innerHTML = `
        <div class="badge-top-bar">
          <span class="badge-tier-tag">${tierShort}</span>
          <span class="badge-id">${item.passId}</span>
        </div>

        <div class="badge-avatar-wrap">
          <div class="badge-avatar-glow"></div>
          <div class="badge-avatar-frame">
            <img src="${ASSETS}${item.imageSrc}" alt="${cleanName}" class="badge-avatar-img" onerror="this.src='${ASSETS}difault.jpg'" />
            <div class="badge-avatar-scanline"></div>
          </div>
        </div>

        <div class="badge-info">
          <span class="badge-role">${item.title}</span>
          <h3 class="badge-name">${cleanName}</h3>
        </div>

        <button class="badge-launch-btn">
          <span>Decipher VIP Pass</span>
          <span style="font-size:0.9rem;">→</span>
        </button>
      `;

      card.querySelector('.badge-launch-btn').addEventListener('click', () => {
        openHoloPassModal(item);
      });

      grid.appendChild(card);
    });
  }

  // Filter Buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentTier = btn.dataset.tier;
      renderCards();
    });
  });

  // Search Input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = currentSearch ? 'block' : 'none';
      }
      renderCards();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      currentSearch = '';
      clearSearchBtn.style.display = 'none';
      renderCards();
    });
  }

  // Initial render
  renderCards();
}

function openHoloPassModal(item) {
  const backdrop = document.getElementById('holoPortalBackdrop');
  const card3d = document.getElementById('holoCard3d');
  const actionsBar = document.getElementById('holoActionsBar');
  const closeBtn = document.getElementById('closeHoloPortal');

  if (!backdrop || !card3d || !actionsBar) return;

  document.body.style.overflow = 'hidden';
  card3d.classList.remove('flipped');

  const cleanName = item.name.replace(/^Hon'ble\.\s*/i, '');
  const satInfo = getUpcomingSaturday();

  let isAccepted = false;

  // Build Front and Back Faces
  card3d.innerHTML = `
    <!-- FRONT FACE -->
    <div class="holo-face holo-face-front">
      <div class="holo-circuit-bg"></div>
      <div class="holo-foil-layer"></div>

      <!-- Header -->
      <div class="pass-header">
        <div class="pass-college-tag">
          <img src="${ASSETS}logo.png" alt="TGPCET" class="pass-college-logo" onerror="this.style.display='none'" />
          <div>
            <div class="pass-event-title-text">INNOVATEX</div>
            <div class="pass-event-sub-text">FOR STUDENTS &bull; TGPCET NAGPUR</div>
          </div>
        </div>
        <div class="pass-vip-badge">
          <span class="pass-vip-pill">VIP ACCESS</span>
          <span class="pass-code">${item.passId}</span>
        </div>
      </div>

      <!-- Portrait -->
      <div class="pass-portrait-section">
        <div class="pass-avatar-box">
          <img src="${ASSETS}${item.imageSrc}" alt="${cleanName}" class="pass-avatar-img" onerror="this.src='${ASSETS}difault.jpg'" />
        </div>
      </div>

      <!-- Salutation & Message -->
      <div class="pass-invitation-body">
        <div class="pass-salutation">HONOURED INVITATION</div>
        <h2 class="pass-dignitary-name">${cleanName}</h2>
        <div class="pass-dignitary-title">${item.title}</div>
        <p class="pass-invitation-text">
          You are cordially invited to <strong>INNOVATEX FOR STUDENTS</strong> — A flagship symposium on R&amp;D Innovation, Expert Talks &amp; Research Collaboration organized by the <strong>Student Innovation Council</strong> at TGPCET.
        </p>
      </div>

      <!-- Specs Grid -->
      <div class="pass-specs-grid">
        <div class="pass-spec-item">
          <span class="pass-spec-label">📅 DATE</span>
          <span class="pass-spec-val">${satInfo.formatted}</span>
        </div>
        <div class="pass-spec-item">
          <span class="pass-spec-label">⏰ TIME</span>
          <span class="pass-spec-val">4:30 PM – 6:30 PM</span>
        </div>
        <div class="pass-spec-item">
          <span class="pass-spec-label">📍 VENUE</span>
          <span class="pass-spec-val">TGPCET Campus</span>
        </div>
        <div class="pass-spec-item">
          <span class="pass-spec-label">🪙 PASS TIER</span>
          <span class="pass-spec-val" style="color:var(--accent-gold-light)">VIP HONOURED GUEST</span>
        </div>
      </div>

      <!-- Footer Bar -->
      <div class="pass-footer-bar">
        <span class="pass-council-stamp">✦ STUDENT INNOVATION COUNCIL ✦</span>
        <span class="pass-barcode-graphic">|||| | || ||||| | |||</span>
      </div>
    </div>

    <!-- BACK FACE -->
    <div class="holo-face holo-face-back">
      <div class="holo-circuit-bg"></div>
      <div class="holo-foil-layer"></div>

      <div class="pass-back-content">
        <div class="back-header">
          <div class="pass-vip-pill" style="display:inline-block; margin-bottom:0.4rem;">PROGRAMME ITINERARY</div>
          <h3 class="back-header-title">INNOVATEX &bull; EVENT AGENDA</h3>
        </div>

        <div class="back-schedule-box">
          <div class="back-schedule-row">
            <span class="back-schedule-time">4:30 PM</span>
            <span class="back-schedule-event"><strong>Inauguration &amp; Welcome Address</strong> by Council dignitaries</span>
          </div>
          <div class="back-schedule-row">
            <span class="back-schedule-time">4:45 PM</span>
            <span class="back-schedule-event"><strong>Expert Keynote Talk</strong> on modern R&amp;D breakthroughs</span>
          </div>
          <div class="back-schedule-row">
            <span class="back-schedule-time">5:30 PM</span>
            <span class="back-schedule-event"><strong>High-Impact Panel Discussion</strong> with seniors &amp; faculty</span>
          </div>
          <div class="back-schedule-row">
            <span class="back-schedule-time">6:00 PM</span>
            <span class="back-schedule-event"><strong>Research &amp; Developments Roadmap</strong> &amp; Networking</span>
          </div>
        </div>

        <div class="back-security-panel">
          <img src="assets/qr_code.png" alt="Pass QR" class="back-qr-small" />
          <div class="back-security-text">
            <strong>OFFICIAL CREDENTIAL VERIFICATION</strong><br>
            Autonomous Institute &bull; NAAC A+ &bull; AICTE IDEA Lab<br>
            TGPCET Campus, Mohgaon, Wardha Road, Nagpur
          </div>
        </div>

        <div class="pass-footer-bar" style="margin-top:1rem;">
          <span class="pass-council-stamp">INNOVATE &bull; COLLABORATE &bull; CREATE IMPACT</span>
          <span class="pass-barcode-graphic">${item.passId}</span>
        </div>
      </div>
    </div>
  `;


/* ─────────────────────────────
   NATIVE WEB AUDIO SYNTHESIZER
   Plays futuristic laser chime without external audio files
   ───────────────────────────── */
function playSciFiChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Arpeggio notes: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.001, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.6);
    });

    // Sub-bass cyber pulse
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(160, now);
    subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.35);

    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 0.35);
  } catch (err) {
    console.warn('Audio synthesis bypassed:', err);
  }
}

/* ─────────────────────────────
   CYBER CELEBRATION PARTICLES CANNON
   ───────────────────────────── */
function playCyberCelebration(sourceEl) {
  playSciFiChime();

  const container = document.createElement('div');
  container.className = 'cyber-confetti-container';
  document.body.appendChild(container);

  const colors = ['#f59e0b', '#fbbf24', '#22d3ee', '#38bdf8', '#34d399', '#ffffff', '#a855f7'];
  const symbols = ['✦', '◆', '★', '●', '▲', '■', '⚡'];

  const count = 55;
  const rect = sourceEl ? sourceEl.getBoundingClientRect() : null;
  const startX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const startY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'cyber-particle';
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 140 + Math.random() * 320;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 60;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const size = 10 + Math.random() * 16;
    const dur = (1.2 + Math.random() * 0.7).toFixed(2);

    p.textContent = symbol;
    p.style.color = color;
    p.style.fontSize = `${size}px`;
    p.style.textShadow = `0 0 14px ${color}`;
    p.style.left = `${startX}px`;
    p.style.top = `${startY}px`;
    p.style.setProperty('--vx', `${vx}px`);
    p.style.setProperty('--vy', `${vy}px`);
    p.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    p.style.setProperty('--dur', `${dur}s`);

    container.appendChild(p);
  }

  setTimeout(() => {
    container.remove();
  }, 2200);
}

/* ─────────────────────────────
   CANVAS VIP PASS IMAGE GENERATOR
   Renders and downloads official high-res VIP Pass image
   ───────────────────────────── */
function downloadVIPPassCanvas(item, satInfo) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 700);
  bgGrad.addColorStop(0, '#0a0d18');
  bgGrad.addColorStop(0.5, '#12182c');
  bgGrad.addColorStop(1, '#070912');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 700);

  // Outer Neon Cyber Borders
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, 1140, 640);

  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, 1120, 620);

  // College & Event Header
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 20px "IBM Plex Mono", monospace';
  ctx.fillText("TULSIRAMJI GAIKWAD-PATIL COLLEGE OF ENGINEERING & TECHNOLOGY (AUTONOMOUS)", 70, 95);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px "Space Grotesk", sans-serif';
  ctx.fillText("INNOVATEX FOR STUDENTS", 70, 160);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '700 22px "Space Grotesk", sans-serif';
  ctx.fillText("ORGANISED BY STUDENT INNOVATION COUNCIL • VIP ACCESS PASS", 70, 195);

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 220);
  ctx.lineTo(1130, 220);
  ctx.stroke();

  // Dignitary Name & Title
  const cleanName = item.name.replace(/^Hon'ble\s*/i, '');
  ctx.fillStyle = '#f59e0b';
  ctx.font = '600 20px "IBM Plex Mono", monospace';
  ctx.fillText("HONOURED VIP GUEST & PATRON", 70, 275);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 44px "Space Grotesk", sans-serif';
  ctx.fillText(cleanName, 70, 335);

  ctx.fillStyle = '#22d3ee';
  ctx.font = '600 24px "IBM Plex Mono", monospace';
  ctx.fillText(item.title, 70, 375);

  // Reserved Seating & Event Specs Box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(70, 415, 1060, 145);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.strokeRect(70, 415, 1060, 145);

  // Specs text
  ctx.fillStyle = '#fef08a';
  ctx.font = '600 18px "IBM Plex Mono", monospace';
  ctx.fillText("DATE", 100, 455);
  ctx.fillText("TIME", 400, 455);
  ctx.fillText("VENUE", 700, 455);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 22px "Space Grotesk", sans-serif';
  ctx.fillText(satInfo.formatted, 100, 495);
  ctx.fillText("4:30 PM – 6:30 PM", 400, 495);
  ctx.fillText("TGPCET Campus, Nagpur", 700, 495);

  ctx.fillStyle = '#6ee7b7';
  ctx.font = '700 18px "IBM Plex Mono", monospace';
  ctx.fillText(`VERIFIED PASS: ${item.passId} • SEATING: DIAS FRONT PAVILION (RESERVED)`, 100, 535);

  // Footer Tagline
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 18px "IBM Plex Mono", monospace';
  ctx.fillText("INNOVATE | COLLABORATE | CREATE IMPACT • LET'S INNOVATE TOGETHER", 70, 615);

  // Download link
  const link = document.createElement('a');
  link.download = `INNOVATEX_VIP_PASS_${cleanName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

  // Action Buttons
  actionsBar.innerHTML = `
    <button class="holo-action-btn btn-accept-vip" id="holoAcceptBtn">
      <span>⚡</span> CONFIRM VIP ATTENDANCE
    </button>
    <button class="holo-action-btn btn-flip-card" id="holoFlipBtn">
      <span>🔄</span> Flip Pass (Itinerary)
    </button>
    <button class="holo-action-btn btn-print-pass" id="holoPrintBtn">
      <span>🖨️</span> Print Pass
    </button>
  `;

  // 3D Tilt initialization
  const destroyTilt = initCardTilt(card3d);

  backdrop.classList.add('active');

  function closeHUD() {
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
    destroyTilt();
    document.removeEventListener('keydown', handleKey);
  }

  function handleKey(e) {
    if (e.key === 'Escape') closeHUD();
  }

  document.addEventListener('keydown', handleKey);
  if (closeBtn) closeBtn.onclick = closeHUD;
  backdrop.onclick = (e) => {
    if (e.target === backdrop) closeHUD();
  };

  // Flip Action
  const flipBtn = actionsBar.querySelector('#holoFlipBtn');
  if (flipBtn) {
    flipBtn.addEventListener('click', () => {
      card3d.classList.toggle('flipped');
      const isFlipped = card3d.classList.contains('flipped');
      flipBtn.innerHTML = isFlipped ? '<span>🔄</span> Flip to Front Face' : '<span>🔄</span> Flip Pass (Itinerary)';
    });
  }

  // Print Action
  const printBtn = actionsBar.querySelector('#holoPrintBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Accept VIP Invitation Action
  const acceptBtn = actionsBar.querySelector('#holoAcceptBtn');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      if (isAccepted) return;
      isAccepted = true;

      // Stage 1: Authenticating State
      acceptBtn.classList.add('authenticating');
      acceptBtn.innerHTML = '<span>⏳</span> AUTHENTICATING CREDENTIALS...';

      // Play Sound
      playSciFiChime();

      setTimeout(() => {
        // Stage 2: Celebration & Confirmation
        acceptBtn.classList.remove('authenticating');
        acceptBtn.classList.add('confirmed');
        acceptBtn.innerHTML = '<span>✓</span> VIP ACCESS CONFIRMED';

        // Trigger Epic Cyber Particle Cannon
        playCyberCelebration(acceptBtn);

        // Stamp Laser Holographic Seal onto Card
        const existingStamp = card3d.querySelector('.pass-accepted-stamp');
        if (!existingStamp) {
          const stamp = document.createElement('div');
          stamp.className = 'pass-accepted-stamp';
          stamp.innerHTML = `
            <span>VIP RSVP CONFIRMED</span>
            <span style="font-size:0.62rem; letter-spacing:1px; color:#a7f3d0; margin-top:2px;">
              DIAS FRONT PAVILION • ROW A RESERVED
            </span>
          `;
          card3d.querySelector('.holo-face-front').appendChild(stamp);
        }

        // Reveal Confirmed VIP Actions Toolbar
        const confirmedDiv = document.createElement('div');
        confirmedDiv.className = 'vip-confirmed-container';
        
        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("INNOVATEX FOR STUDENTS 2026 — TGPCET")}&details=${encodeURIComponent("VIP Access for Hon'ble " + cleanName + " at INNOVATEX FOR STUDENTS.\nTime: 4:30 PM - 6:30 PM\nVenue: TGPCET Campus, Nagpur")}&location=${encodeURIComponent("Tulsiramji Gaikwad-Patil College of Engineering and Technology, Nagpur")}`;
        
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent("Hon'ble " + cleanName + " has confirmed VIP attendance for INNOVATEX FOR STUDENTS at TGPCET Nagpur this Saturday (4:30 PM - 6:30 PM). 🎉")}`;

        confirmedDiv.innerHTML = `
          <div class="vip-confirmed-badge-pill">
            <span class="pill-dot"></span>
            SEATING: DIAS FRONT PAVILION (RESERVED)
          </div>
          <div class="vip-actions-toolbar">
            <button class="vip-tool-btn btn-dl-png" id="btnDownloadPassPng">
              <span>📸</span> Download VIP Pass (PNG)
            </button>
            <a href="${gcalUrl}" target="_blank" rel="noopener" class="vip-tool-btn btn-cal">
              <span>📅</span> Add to Google Calendar
            </a>
            <a href="${waUrl}" target="_blank" rel="noopener" class="vip-tool-btn btn-wa">
              <span>📲</span> Share on WhatsApp
            </a>
          </div>
        `;

        actionsBar.appendChild(confirmedDiv);

        // Bind PNG Download
        document.getElementById('btnDownloadPassPng')?.addEventListener('click', () => {
          downloadVIPPassCanvas(item, satInfo);
        });

        // Log response
        logResponse(item, 'Accepted');
      }, 500);
    });
  }
}

/* ─────────────────────────────
   APP INIT
   ───────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initParticles();

  // Upcoming Saturday setup
  const satInfo = getUpcomingSaturday();
  const heroDateDisplay = document.getElementById('heroDateDisplay');
  if (heroDateDisplay) {
    heroDateDisplay.textContent = `${satInfo.formatted} · 4:30 PM`;
  }
  initCountdown(satInfo.iso);

  // Initialize Modals & Forms
  initModals();

  // Holographic Dignitaries Directory & VIP Pass HUD
  initHoloDirectory(tiersData);
});