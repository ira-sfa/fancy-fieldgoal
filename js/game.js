const CONFIG = {
  startingKicks: 3,
  pointsPerFieldGoal: 3,
  foodBonusPoints: 100,
  enableFoodBonuses: true,
  goalX: 78,
  goalY: 34,
  bonusChance: 0.72,
  windMax: 12,
  distanceScale: 0.5,
  minimumSwipePixels: 24,
  maximumSwipePixels: 120,
  minimumFlightDistance: 30,
  maximumFlightDistance: 70,
  maximumHorizontalAim: 20,
  windInfluence: 0.3,
  flightDuration: 900,
  arcHeight: 24,
  keyboardSwipePixels: 84,
  ballSpawnX: 20,
  ballSpawnY: 76,
  playerBestKey: 'wff-field-goal-best-score',
  gamesPlayedKey: 'wff-field-goal-games-played'
};

const state = {
  score: 0,
  kicksLeft: CONFIG.startingKicks,
  totalKicksTaken: 0,
  foodBonuses: 0,
  longest: 0,
  currentWind: 0,
  inFlight: false,
  activeBonus: null,
  personalBest: getStoredValue(CONFIG.playerBestKey, 0),
  gamesPlayed: getStoredValue(CONFIG.gamesPlayedKey, 0),
  resultLock: false
};

const elements = {
  startScreen: document.getElementById('start-screen'),
  gameScreen: document.getElementById('game-screen'),
  gameOverScreen: document.getElementById('game-over-screen'),
  playBtn: document.getElementById('play-btn'),
  howToPlayBtn: document.getElementById('how-to-play-btn'),
  closeHowToPlay: document.getElementById('close-how-to-play'),
  howToPlayModal: document.getElementById('how-to-play-modal'),
  scoreValue: document.getElementById('score-value'),
  kicksLeftValue: document.getElementById('kicks-left-value'),
  windValue: document.getElementById('wind-value'),
  fieldContainer: document.getElementById('field-container'),
  football: document.getElementById('football'),
  kickInstructions: document.getElementById('kick-instructions'),
  resultBanner: document.getElementById('result-banner'),
  nextKickBtn: document.getElementById('next-kick-btn'),
  playAgainBtn: document.getElementById('play-again-btn'),
  finalScore: document.getElementById('final-score'),
  totalKicksValue: document.getElementById('total-kicks-value'),
  longestValue: document.getElementById('longest-value'),
  foodBonusesValue: document.getElementById('food-bonuses-value'),
  personalBestTag: document.getElementById('personal-best-tag'),
  bonusItem: document.getElementById('bonus-item'),
  windIndicator: document.getElementById('wind-indicator'),
  windArrow: document.querySelector('.wind-arrow')
};

const pointerState = {
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function getStoredValue(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? fallback : Number(stored) || fallback;
  } catch (error) {
    return fallback;
  }
}

function setStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch (error) {
    // Local storage can fail in private browsing or restricted environments.
  }
}

function showScreen(screenName) {
  elements.startScreen.hidden = screenName !== 'start';
  elements.gameScreen.hidden = screenName !== 'game';
  elements.gameOverScreen.hidden = screenName !== 'game-over';
  document.querySelector('.page-shell').classList.toggle('is-playing', screenName === 'game');
}

function updateHud() {
  elements.scoreValue.textContent = String(state.score);
  elements.kicksLeftValue.textContent = String(Math.max(0, state.kicksLeft));
  const windLabel = Math.abs(state.currentWind) < 1 ? '0' : `${Math.round(state.currentWind)}`;
  elements.windValue.textContent = `${windLabel} ${state.currentWind >= 0 ? 'R' : 'L'}`;
  elements.windArrow.style.transform = `rotate(${state.currentWind * 7.5}deg)`;
}

function updateBallPosition(xPercent, yPercent) {
  elements.football.style.left = `${xPercent}%`;
  elements.football.style.top = `${yPercent}%`;
}

function resetBall() {
  elements.football.classList.remove('is-kicking');
  elements.football.style.setProperty('--depth-scale', '1');
  updateBallPosition(CONFIG.ballSpawnX, CONFIG.ballSpawnY);
}

function resetBonus() {
  state.activeBonus = null;
  elements.bonusItem.classList.add('hidden');
}

function buildBonus() {
  if (!CONFIG.enableFoodBonuses || Math.random() > CONFIG.bonusChance) {
    resetBonus();
    return;
  }

  const items = [
    { label: 'CHEESE BONUS!', emoji: '🧀', x: 60, y: 27 },
    { label: 'PRETZEL BONUS!', emoji: '🥨', x: 62, y: 28 },
    { label: 'POPCORN BONUS!', emoji: '🍿', x: 58, y: 28 },
    { label: 'COOKIE BONUS!', emoji: '🍪', x: 63, y: 29 },
    { label: 'CHOCOLATE BONUS!', emoji: '🍫', x: 60, y: 30 },
    { label: 'PEPPER BONUS!', emoji: '🌶️', x: 64, y: 29 }
  ];

  const chosen = items[Math.floor(Math.random() * items.length)];
  state.activeBonus = {
    ...chosen,
    collected: false
  };

  elements.bonusItem.textContent = chosen.emoji;
  elements.bonusItem.style.left = `${chosen.x}%`;
  elements.bonusItem.style.top = `${chosen.y}%`;
  elements.bonusItem.classList.remove('hidden');
}

function setWind() {
  const direction = Math.random() < 0.5 ? -1 : 1;
  const base = randomBetween(2, CONFIG.windMax);
  state.currentWind = Number((direction * base).toFixed(1));
}

function startGame() {
  state.score = 0;
  state.kicksLeft = CONFIG.startingKicks;
  state.totalKicksTaken = 0;
  state.foodBonuses = 0;
  state.longest = 0;
  state.resultLock = false;
  state.inFlight = false;
  elements.nextKickBtn.textContent = 'NEXT KICK';
  resetBanner();
  setWind();
  updateHud();
  resetBall();
  buildBonus();
  showScreen('game');
  elements.kickInstructions.classList.remove('hidden');
  elements.nextKickBtn.hidden = true;
}

function showBanner(message, variant = 'neutral') {
  elements.resultBanner.textContent = message;
  elements.resultBanner.classList.remove('hidden');
  elements.resultBanner.style.background = variant === 'success' ? 'rgba(223, 235, 223, 0.9)' : 'rgba(255,255,255,0.8)';
}

function resetBanner() {
  elements.resultBanner.textContent = '';
  elements.resultBanner.classList.add('hidden');
}

function revealNextKick() {
  elements.kickInstructions.classList.add('hidden');
  elements.nextKickBtn.hidden = false;
}

function endGame() {
  state.gamesPlayed += 1;
  setStoredValue(CONFIG.gamesPlayedKey, state.gamesPlayed);

  if (state.score > state.personalBest) {
    state.personalBest = state.score;
    setStoredValue(CONFIG.playerBestKey, state.personalBest);
    elements.personalBestTag.classList.remove('hidden');
  } else {
    elements.personalBestTag.classList.add('hidden');
  }

  elements.finalScore.textContent = String(state.score);
  elements.totalKicksValue.textContent = String(state.totalKicksTaken);
  elements.longestValue.textContent = `${state.longest} YARDS`;
  elements.foodBonusesValue.textContent = String(state.foodBonuses);
  showScreen('game-over');
}

function prepareNextKick() {
  if (state.totalKicksTaken >= CONFIG.startingKicks) {
    endGame();
    return;
  }

  state.resultLock = false;
  state.inFlight = false;
  resetBanner();
  elements.nextKickBtn.hidden = true;
  elements.kickInstructions.classList.remove('hidden');
  setWind();
  updateHud();
  resetBall();
  buildBonus();
}

function isBallWithinBonus(x, y) {
  if (!state.activeBonus || state.activeBonus.collected) {
    return false;
  }

  const dx = Math.abs(x - state.activeBonus.x);
  const dy = Math.abs(y - state.activeBonus.y);
  return dx < 7 && dy < 7;
}

function markBonusCollected() {
  if (!state.activeBonus || state.activeBonus.collected) {
    return false;
  }

  state.activeBonus.collected = true;
  state.foodBonuses += 1;
  state.score += CONFIG.foodBonusPoints;
  elements.bonusItem.classList.add('hidden');
  return state.activeBonus.label;
}

function completeKick(success, distance, bonusLabel) {
  if (state.resultLock) {
    return;
  }

  state.resultLock = true;
  state.totalKicksTaken += 1;
  state.kicksLeft = Math.max(0, CONFIG.startingKicks - state.totalKicksTaken);
  state.longest = Math.max(state.longest, distance);

  const lines = [];

  if (success) {
    state.score += CONFIG.pointsPerFieldGoal;
    lines.push(`IT'S GOOD!`);
    lines.push(`+${CONFIG.pointsPerFieldGoal} POINTS`);
    lines.push(`${distance} YARDS`);
  } else {
    lines.push('NO GOOD');
    lines.push(`${distance} YARDS`);
  }

  if (bonusLabel) {
    lines.push(bonusLabel.toUpperCase());
    lines.push(`+${CONFIG.foodBonusPoints} FANCY POINTS`);
  }

  showBanner(lines.join('\n'), success || bonusLabel ? 'success' : 'neutral');
  if (success || bonusLabel) {
    elements.fieldContainer.classList.add('is-scoring');
    window.setTimeout(() => elements.fieldContainer.classList.remove('is-scoring'), 700);
  }
  updateHud();
  revealNextKick();

  if (state.totalKicksTaken >= CONFIG.startingKicks) {
    elements.nextKickBtn.textContent = 'VIEW RESULTS';
  }
}

function determineGoal(successX, successY) {
  return successX >= CONFIG.goalX - 6 && successX <= CONFIG.goalX + 6 && successY >= CONFIG.goalY - 8 && successY <= CONFIG.goalY + 8;
}

function beginKick(vx, vy) {
  if (state.inFlight || state.resultLock) {
    return;
  }

  state.inFlight = true;
  elements.football.classList.add('is-kicking');
  const rect = elements.fieldContainer.getBoundingClientRect();
  const upwardSwipe = Math.abs(vy);
  const swipeStrength = clamp(
    (upwardSwipe - CONFIG.minimumSwipePixels) /
      (CONFIG.maximumSwipePixels - CONFIG.minimumSwipePixels),
    0,
    1
  );
  const flightDistance =
    CONFIG.minimumFlightDistance +
    swipeStrength * (CONFIG.maximumFlightDistance - CONFIG.minimumFlightDistance);
  const horizontalAim = clamp(
    (vx / Math.max(rect.width, 1)) * 100,
    -CONFIG.maximumHorizontalAim,
    CONFIG.maximumHorizontalAim
  );
  const targetX = clamp(
    CONFIG.ballSpawnX +
      flightDistance +
      horizontalAim +
      state.currentWind * CONFIG.windInfluence,
    -10,
    110
  );
  const startTime = performance.now();
  const stateBall = {
    x: CONFIG.ballSpawnX,
    y: CONFIG.ballSpawnY,
    targetX
  };

  let bonusLabel = '';

  function tick(now) {
    const progress = clamp((now - startTime) / CONFIG.flightDuration, 0, 1);
    stateBall.x = CONFIG.ballSpawnX + (stateBall.targetX - CONFIG.ballSpawnX) * progress;
    stateBall.y =
      CONFIG.ballSpawnY +
      (CONFIG.goalY - CONFIG.ballSpawnY) * progress -
      CONFIG.arcHeight * 4 * progress * (1 - progress);

    elements.football.style.setProperty('--depth-scale', String(1 - progress * 0.62));

    if (isBallWithinBonus(stateBall.x, stateBall.y)) {
      bonusLabel = markBonusCollected() || bonusLabel;
    }

    updateBallPosition(stateBall.x, stateBall.y);

    if (progress >= 1) {
      const success = determineGoal(stateBall.x, stateBall.y);
      const distance = Math.max(
        8,
        Math.round(Math.abs(stateBall.x - CONFIG.ballSpawnX) * CONFIG.distanceScale)
      );
      state.longest = Math.max(state.longest, distance);
      state.inFlight = false;
      elements.football.classList.remove('is-kicking');
      completeKick(success, distance, bonusLabel);
      return;
    }

    if (stateBall.y > 94) {
      const distance = Math.max(
        8,
        Math.round(Math.abs(stateBall.x - CONFIG.ballSpawnX) * CONFIG.distanceScale)
      );
      state.inFlight = false;
      elements.football.classList.remove('is-kicking');
      completeKick(false, distance, bonusLabel);
      return;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function kickFromGesture(deltaX, deltaY) {
  if (deltaY >= -18) {
    return;
  }

  const upwardSwipe = Math.abs(deltaY);
  beginKick(deltaX, -upwardSwipe);
}

function handlePointerDown(event) {
  if (state.inFlight || state.resultLock || !event.target.closest('#football')) {
    return;
  }

  event.preventDefault();
  pointerState.active = true;
  pointerState.pointerId = event.pointerId;
  pointerState.startX = event.clientX;
  pointerState.startY = event.clientY;
  pointerState.currentX = event.clientX;
  pointerState.currentY = event.clientY;
  elements.fieldContainer.setPointerCapture(event.pointerId);
}

function handlePointerMove(event) {
  if (!pointerState.active || event.pointerId !== pointerState.pointerId) {
    return;
  }

  event.preventDefault();
  pointerState.currentX = event.clientX;
  pointerState.currentY = event.clientY;
}

function handlePointerUp(event) {
  if (!pointerState.active || event.pointerId !== pointerState.pointerId) {
    return;
  }

  pointerState.currentX = event.clientX;
  pointerState.currentY = event.clientY;
  pointerState.active = false;
  pointerState.pointerId = null;

  kickFromGesture(
    pointerState.currentX - pointerState.startX,
    pointerState.currentY - pointerState.startY
  );
}

function handlePointerCancel(event) {
  if (event.pointerId === pointerState.pointerId) {
    pointerState.active = false;
    pointerState.pointerId = null;
  }
}

function handleKeyboardKick(event) {
  if (event.key !== ' ' && event.key !== 'Enter' && event.key !== 'ArrowUp') {
    return;
  }

  event.preventDefault();
  kickFromGesture(0, -CONFIG.keyboardSwipePixels);
}

function bindUI() {
  elements.playBtn.addEventListener('click', startGame);
  elements.playAgainBtn.addEventListener('click', startGame);
  elements.howToPlayBtn.addEventListener('click', () => {
    elements.howToPlayModal.classList.remove('hidden');
  });
  elements.closeHowToPlay.addEventListener('click', () => {
    elements.howToPlayModal.classList.add('hidden');
    if (elements.gameScreen.hidden) {
      startGame();
    }
  });

  elements.nextKickBtn.addEventListener('click', () => {
    if (state.totalKicksTaken >= CONFIG.startingKicks) {
      endGame();
      return;
    }
    prepareNextKick();
  });

  elements.fieldContainer.addEventListener('pointerdown', handlePointerDown);
  elements.fieldContainer.addEventListener('pointermove', handlePointerMove);
  elements.fieldContainer.addEventListener('pointerup', handlePointerUp);
  elements.fieldContainer.addEventListener('pointercancel', handlePointerCancel);
  elements.football.addEventListener('keydown', handleKeyboardKick);
}

bindUI();
showScreen('start');
resetBall();
updateHud();
