const CONFIG = {
  startingKicks: 3,
  pointsPerFieldGoal: 3,
  bullseyeBonusPoints: 5,
  foodBonusPoints: 100,
  enableFoodBonuses: true,
  goalX: 50,
  goalY: 25,
  goalWindowTopY: 17,
  goalWindowBottomY: 32.5,
  bonusChance: 0.72,
  windMaxByKick: [6, 9, 12],
  goalHalfWidthByKick: [9, 7, 5],
  goalPostWidthByKick: [18, 14, 10],
  aimSweepSpeedByKick: [23, 30, 38],
  aimTargetSizeByKick: [58, 50, 44],
  aimWindInfluence: 0.45,
  aimSweepMin: 29,
  aimSweepMax: 71,
  automaticKickPower: 68,
  distanceBaseYards: 18,
  distancePerPower: 0.35,
  flightDuration: 900,
  arcHeight: 24,
  ballSpawnX: 50,
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
  aimPosition: 50,
  aimDirection: 1,
  aimTargetX: 50,
  aimLastFrame: 0,
  aimFrame: null,
  aimRunning: false,
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
  goalPosts: document.querySelector('.goal-posts'),
  aimTarget: document.getElementById('aim-target'),
  football: document.getElementById('football'),
  kickBtn: document.getElementById('kick-btn'),
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

function getKickDifficultyValue(values) {
  return values[Math.min(state.totalKicksTaken, values.length - 1)];
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

function setWind() {
  const direction = Math.random() < 0.5 ? -1 : 1;
  const base = randomBetween(2, getKickDifficultyValue(CONFIG.windMaxByKick));
  state.currentWind = Number((direction * base).toFixed(1));
}

function updateDifficultyVisuals() {
  const index = Math.min(state.totalKicksTaken, CONFIG.goalHalfWidthByKick.length - 1);
  elements.goalPosts.style.width = `${CONFIG.goalPostWidthByKick[index]}%`;
  elements.aimTarget.style.setProperty('--aim-target-size', `${getKickDifficultyValue(CONFIG.aimTargetSizeByKick)}px`);
}

function updateAimTargetPosition() {
  state.aimTargetX = clamp(
    state.aimPosition + state.currentWind * CONFIG.aimWindInfluence,
    23,
    77
  );
  elements.aimTarget.style.left = `${state.aimTargetX}%`;
  const halfWidth = getKickDifficultyValue(CONFIG.goalHalfWidthByKick);
  elements.aimTarget.classList.toggle(
    'is-aligned',
    Math.abs(state.aimTargetX - CONFIG.goalX) <= halfWidth
  );
}

function animateAimTarget(timestamp) {
  if (!state.aimRunning) {
    return;
  }

  if (state.aimLastFrame) {
    const elapsed = Math.min((timestamp - state.aimLastFrame) / 1000, 0.08);
    const speed = getKickDifficultyValue(CONFIG.aimSweepSpeedByKick);
    state.aimPosition += state.aimDirection * speed * elapsed;

    if (state.aimPosition >= CONFIG.aimSweepMax || state.aimPosition <= CONFIG.aimSweepMin) {
      state.aimPosition = clamp(state.aimPosition, CONFIG.aimSweepMin, CONFIG.aimSweepMax);
      state.aimDirection *= -1;
    }
  }

  state.aimLastFrame = timestamp;
  updateAimTargetPosition();
  state.aimFrame = window.requestAnimationFrame(animateAimTarget);
}

function startAimTarget() {
  stopAimTarget();
  state.aimPosition = randomBetween(CONFIG.aimSweepMin, CONFIG.aimSweepMax);
  state.aimDirection = Math.random() < 0.5 ? -1 : 1;
  state.aimLastFrame = 0;
  state.aimRunning = true;
  updateAimTargetPosition();
  state.aimFrame = window.requestAnimationFrame(animateAimTarget);
}

function stopAimTarget() {
  state.aimRunning = false;
  state.aimLastFrame = 0;
  if (state.aimFrame !== null) {
    window.cancelAnimationFrame(state.aimFrame);
    state.aimFrame = null;
  }
}

function updateBallPosition(xPercent, yPercent) {
  elements.football.style.left = `${xPercent}%`;
  elements.football.style.top = `${yPercent}%`;
}

function resetBall() {
  elements.football.classList.remove('is-kicking');
  elements.football.style.removeProperty('transform');
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
    { label: 'CHEESE BONUS!', emoji: '🧀', x: 45, y: 31 },
    { label: 'PRETZEL BONUS!', emoji: '🥨', x: 55, y: 30 },
    { label: 'POPCORN BONUS!', emoji: '🍿', x: 46, y: 31 },
    { label: 'COOKIE BONUS!', emoji: '🍪', x: 54, y: 29 },
    { label: 'CHOCOLATE BONUS!', emoji: '🍫', x: 45, y: 30 },
    { label: 'PEPPER BONUS!', emoji: '🌶️', x: 55, y: 31 }
  ];

  const chosen = items[Math.floor(Math.random() * items.length)];
  state.activeBonus = { ...chosen, collected: false };
  elements.bonusItem.textContent = chosen.emoji;
  elements.bonusItem.style.left = `${chosen.x}%`;
  elements.bonusItem.style.top = `${chosen.y}%`;
  elements.bonusItem.classList.remove('hidden');
}

function startGame() {
  stopAimTarget();
  state.score = 0;
  state.kicksLeft = CONFIG.startingKicks;
  state.totalKicksTaken = 0;
  state.foodBonuses = 0;
  state.longest = 0;
  state.resultLock = false;
  state.inFlight = false;
  elements.nextKickBtn.textContent = 'NEXT KICK';
  elements.kickBtn.textContent = 'KICK';
  elements.kickBtn.disabled = false;
  resetBanner();
  setWind();
  updateHud();
  updateDifficultyVisuals();
  resetBall();
  buildBonus();
  showScreen('game');
  elements.kickInstructions.textContent = 'TAP KICK WHEN THE TARGET CROSSES THE UPRIGHTS';
  elements.kickInstructions.classList.remove('hidden');
  elements.nextKickBtn.hidden = true;
  startAimTarget();
}

function showBanner(message, variant = 'neutral') {
  elements.resultBanner.textContent = message;
  elements.resultBanner.classList.remove('hidden');
  elements.resultBanner.style.background = variant === 'success'
    ? 'rgba(223, 235, 223, 0.9)'
    : 'rgba(255,255,255,0.8)';
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
  stopAimTarget();
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
  elements.kickBtn.disabled = false;
  elements.kickBtn.textContent = 'KICK';
  resetBanner();
  elements.nextKickBtn.hidden = true;
  elements.kickInstructions.classList.remove('hidden');
  setWind();
  updateDifficultyVisuals();
  updateHud();
  resetBall();
  buildBonus();
  startAimTarget();
}

function isBallWithinBonus(x, y) {
  if (!state.activeBonus || state.activeBonus.collected) {
    return false;
  }

  return Math.abs(x - state.activeBonus.x) < 7 && Math.abs(y - state.activeBonus.y) < 7;
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

function completeKick(success, distance, bonusLabel, accuracy) {
  if (state.resultLock) {
    return;
  }

  state.resultLock = true;
  state.totalKicksTaken += 1;
  state.kicksLeft = Math.max(0, CONFIG.startingKicks - state.totalKicksTaken);
  state.longest = Math.max(state.longest, distance);
  elements.kickBtn.disabled = true;

  const lines = [];
  if (success) {
    state.score += CONFIG.pointsPerFieldGoal;
    lines.push("IT'S GOOD!");
    lines.push(`+${CONFIG.pointsPerFieldGoal} POINTS`);
    lines.push(`${distance} YARDS`);

    const bullseyeTolerance = Math.max(
      1.4,
      getKickDifficultyValue(CONFIG.goalHalfWidthByKick) * 0.3
    );
    if (accuracy <= bullseyeTolerance) {
      state.score += CONFIG.bullseyeBonusPoints;
      lines.push(`+${CONFIG.bullseyeBonusPoints} BULLSEYE BONUS`);
    }
  } else {
    lines.push('NO GOOD');
    lines.push(accuracy < 0 ? 'WIDE LEFT' : 'WIDE RIGHT');
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
  const halfWidth = getKickDifficultyValue(CONFIG.goalHalfWidthByKick);
  return (
    Math.abs(successX - CONFIG.goalX) <= halfWidth &&
    successY >= CONFIG.goalWindowTopY &&
    successY <= CONFIG.goalWindowBottomY
  );
}

function beginKick() {
  if (state.inFlight || state.resultLock || !state.aimRunning) {
    return;
  }

  const targetX = state.aimTargetX;
  const power = CONFIG.automaticKickPower;
  const accuracy = targetX - CONFIG.goalX;
  const targetY = CONFIG.goalY;
  state.inFlight = true;
  stopAimTarget();
  elements.kickBtn.disabled = true;
  elements.football.classList.add('is-kicking');

  const startTime = performance.now();
  const ball = { x: CONFIG.ballSpawnX, y: CONFIG.ballSpawnY };
  let bonusLabel = '';

  function tick(now) {
    const progress = clamp((now - startTime) / CONFIG.flightDuration, 0, 1);
    ball.x = CONFIG.ballSpawnX + (targetX - CONFIG.ballSpawnX) * progress;
    ball.y =
      CONFIG.ballSpawnY +
      (targetY - CONFIG.ballSpawnY) * progress -
      CONFIG.arcHeight * 4 * progress * (1 - progress);
    elements.football.style.transform =
      `translate(-50%, -50%) rotate(${progress * 360}deg) scale(${1 - progress * 0.62})`;

    if (isBallWithinBonus(ball.x, ball.y)) {
      bonusLabel = markBonusCollected() || bonusLabel;
    }
    updateBallPosition(ball.x, ball.y);

    if (progress >= 1 || ball.y > 94) {
      const success = progress >= 1 && determineGoal(ball.x, ball.y);
      const distance = Math.max(
        8,
        Math.round(CONFIG.distanceBaseYards + power * CONFIG.distancePerPower)
      );
      state.inFlight = false;
      elements.football.classList.remove('is-kicking');
      completeKick(success, distance, bonusLabel, accuracy);
      return;
    }
    window.requestAnimationFrame(tick);
  }

  window.requestAnimationFrame(tick);
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
  elements.kickBtn.addEventListener('click', beginKick);
}

bindUI();
showScreen('start');
resetBall();
updateHud();
