const CONFIG = {
  startingKicks: 3,
  pointsPerFieldGoal: 3,
  foodBonusPoints: 100,
  enableFoodBonuses: true,
  goalX: 78,
  goalY: 42,
  bonusChance: 0.72,
  windMax: 12,
  distanceScale: 0.5,
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
    { label: 'CHEESE BONUS!', emoji: '🧀', x: 60, y: 36 },
    { label: 'PRETZEL BONUS!', emoji: '🥨', x: 62, y: 34 },
    { label: 'POPCORN BONUS!', emoji: '🍿', x: 58, y: 39 },
    { label: 'COOKIE BONUS!', emoji: '🍪', x: 63, y: 38 },
    { label: 'CHOCOLATE BONUS!', emoji: '🍫', x: 60, y: 42 },
    { label: 'PEPPER BONUS!', emoji: '🌶️', x: 64, y: 37 }
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
    lines.push(`${bonusLabel.toUpperCase()} BONUS!`);
    lines.push(`+${CONFIG.foodBonusPoints} FANCY POINTS`);
  }

  showBanner(lines.join('\n'), success ? 'success' : 'neutral');
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
  const stateBall = {
    x: CONFIG.ballSpawnX,
    y: CONFIG.ballSpawnY,
    vx,
    vy,
    gravity: 0.2
  };

  let bonusLabel = '';

  function tick() {
    stateBall.x += stateBall.vx * 0.17;
    stateBall.y += stateBall.vy * 0.17;
    stateBall.vy += stateBall.gravity;

    if (isBallWithinBonus(stateBall.x, stateBall.y)) {
      bonusLabel = markBonusCollected();
    }

    updateBallPosition(stateBall.x, stateBall.y);

    const goalReached = determineGoal(stateBall.x, stateBall.y);
    const outOfBounds = stateBall.y > 94 || stateBall.x < -8 || stateBall.x > 108;

    if (goalReached) {
      const distance = Math.max(15, Math.round(Math.abs(CONFIG.goalX - CONFIG.ballSpawnX) * CONFIG.distanceScale + Math.abs(stateBall.vx) * 0.7));
      state.longest = Math.max(state.longest, distance);
      completeKick(true, distance, bonusLabel);
      return;
    }

    if (outOfBounds) {
      const distance = Math.max(8, Math.round(Math.abs(CONFIG.goalX - CONFIG.ballSpawnX) * CONFIG.distanceScale + Math.abs(stateBall.vx) * 0.6));
      completeKick(false, distance, bonusLabel);
      return;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function handlePointerDown(event) {
  if (state.inFlight || state.resultLock) {
    return;
  }

  event.preventDefault();
  pointerState.active = true;
  pointerState.startX = event.clientX;
  pointerState.startY = event.clientY;
  pointerState.currentX = event.clientX;
  pointerState.currentY = event.clientY;
}

function handlePointerMove(event) {
  if (!pointerState.active) {
    return;
  }

  event.preventDefault();
  pointerState.currentX = event.clientX;
  pointerState.currentY = event.clientY;
}

function handlePointerUp() {
  if (!pointerState.active) {
    return;
  }

  const deltaX = pointerState.currentX - pointerState.startX;
  const deltaY = pointerState.currentY - pointerState.startY;
  pointerState.active = false;

  if (deltaY >= -18) {
    return;
  }

  const strength = clamp(Math.abs(deltaY) / 18, 0.7, 6.5);
  const horizontal = clamp(deltaX * 0.08, -18, 18);
  const velocityX = horizontal + state.currentWind * 0.8;
  const velocityY = -(9 + strength * 4.2);

  beginKick(velocityX, velocityY);
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
  elements.fieldContainer.addEventListener('pointerleave', handlePointerUp);
  elements.fieldContainer.addEventListener('pointercancel', handlePointerUp);
}

bindUI();
showScreen('start');
resetBall();
updateHud();
