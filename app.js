// Game state
const gameState = {
    // Game information
    gameId: Date.now().toString(),
    gameDate: new Date().toISOString(),
    homeTeam: "Home Team",
    awayTeam: "Away Team",
    
    // Game settings
    settings: {
        periodLength: 12 * 60, // in seconds
        numPeriods: 4,
        overtimeEnabled: true
    },
    
    // Current game state
    isRunning: false,
    period: 1,
    timeRemaining: 12 * 60,
    homeScore: 0,
    awayScore: 0,
    timerInterval: null,
    
    // Players and stats
    homeTeamPlayers: [],
    awayTeamPlayers: [],
    lastPassPlayer: null,
    selectedPlayer: null,
    
    // Game log
    gameEvents: []
};

// DOM elements
const startStopBtn = document.getElementById("start-stop");
const resetPeriodBtn = document.getElementById("reset-period");
const homeScoreBtn = document.getElementById("home-score-btn");
const awayScoreBtn = document.getElementById("away-score-btn");
const gameClockEl = document.getElementById("game-clock");
const periodEl = document.getElementById("period");
const homeScoreEl = document.getElementById("home-score");
const awayScoreEl = document.getElementById("away-score");

// Player class
class Player {
  constructor(number, firstName, lastName, position) {
    this.number = number;
    this.firstName = firstName;
    this.lastName = lastName;
    this.position = position;
    this.stats = {
      goals: 0,
      assists: 0,
      shots: 0,
      shotsOnGoal: 0,
      groundBalls: 0,
      turnovers: 0,
      causedTurnovers: 0,
      saves: 0,
      goalsAllowed: 0,
      penalties: 0,
      penaltyTime: 0,
    };
    this.activePenalties = [];
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  get displayName() {
    return `#${this.number} ${this.lastName}`;
  }

  addPenalty(seconds) {
    this.stats.penalties++;
    this.stats.penaltyTime += seconds;
    this.activePenalties.push({
      totalDuration: seconds,
      remainingTime: seconds,
      startGameTime: gameState.timeRemaining,
      isExpiring: false,
    });
  }

  updatePenalties(currentGameTime) {
    this.activePenalties = this.activePenalties
      .map((penalty) => {
        const elapsed = penalty.startGameTime - currentGameTime;
        const remaining = Math.max(0, penalty.totalDuration - elapsed);

        return {
          ...penalty,
          remainingTime: remaining,
          isExpiring: remaining <= 10,
        };
      })
      .filter((penalty) => penalty.remainingTime > 0);
  }

  get hasActivePenalties() {
    return this.activePenalties.length > 0;
  }
}

// Initialize the game
function initGame() {
  // Initialize sample players
  gameState.homeTeamPlayers = [
    new Player(1, "Cristian", "Apostolakis", "defense"),
    new Player(2, "Donovan", "Castro", "defense"),
    new Player(3, "Ethan", "Jung", "attack"),
    new Player(4, "Jude", "Engle", "midfield"),
    new Player(7, "Ian", "Theriot", "midfield"),
    new Player(8, "Brogan", "Blum", "midfield"),
    new Player(9, "Luis", "Padilla", "defense"),
    new Player(10, "Reagan", "Vega", "midfield"),
    new Player(11, "Daven", "Huete", "midfield"),
    new Player(12, "Pat", "Smith", "midfield"),
    new Player(13, "Diego", "Hallner", "midfield"),
    new Player(15, "Grayson", "Guidry", "midfield"),
    new Player(16, "Aden", "Peart", "midfield"),
    new Player(17, "Chet", "Krzenski", "midfield"),
    new Player(18, "Zack", "Boyce", "midfield"),
    new Player(19, "Erick", "Gomez", "midfield"),
    new Player(20, "Parker", "Greco", "midfield"),
    new Player(21, "Dekyren", "Richardson", "midfield"),
    new Player(22, "Josh", "DuMars", "attack"),
    new Player(24, "Ethan", "Young", "goalie"),
    new Player(26, "Keith", "Cunningham", "midfield"),
    new Player(34, "Connor", "Tran", "midfield"),
    new Player(35, "Arthur", "Jackson", "attack"),
    new Player(49, "Sledge", "Margavio", "midfield")
  ];

  gameState.awayTeamPlayers = [
    new Player("0", "Player", "Player", "goalie")
  ];

  gameState.players = [
    ...gameState.homeTeamPlayers,
    ...gameState.awayTeamPlayers,
  ];

  // Render initial UI
  renderTeamPlayers();
  updateClockDisplay();
  updateGlobalPenaltyDisplay();

  // Select first home player by default
  if (gameState.homeTeamPlayers.length > 0) {
    selectPlayer(gameState.homeTeamPlayers[0].number);
  }
}

// Render player pills for both teams
function renderTeamPlayers() {
  const homeTeamContainer = document.getElementById("home-team-players");
  const awayTeamContainer = document.getElementById("away-team-players");

  homeTeamContainer.innerHTML = "";
  awayTeamContainer.innerHTML = "";

  gameState.homeTeamPlayers.forEach((player) => {
    const pill = createPlayerPill(player, "home");
    homeTeamContainer.appendChild(pill);
  });

  gameState.awayTeamPlayers.forEach((player) => {
    const pill = createPlayerPill(player, "away");
    awayTeamContainer.appendChild(pill);
  });
}

// Create a player pill element
function createPlayerPill(player, team) {
  const pill = document.createElement("div");
  pill.className = `player-pill badge rounded-pill p-2 d-flex align-items-center ${
    team === "home"
      ? "bg-primary bg-opacity-10 text-primary"
      : "bg-danger bg-opacity-10 text-danger"
  }`;
  pill.dataset.playerId = player.number;
  pill.innerHTML = `
        <span class="fw-bold">#${player.number}</span>
        <span class="ms-1 text-truncate" style="max-width: 80px;">${player.lastName}</span>
    `;

  // Use proper click handler
  pill.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent any parent event handlers
    selectPlayer(player.number);
  });

  return pill;
}

// Select a player and show their stats
function selectPlayer(playerNumber) {
  // Remove active class from all pills
  document.querySelectorAll(".player-pill").forEach((pill) => {
    pill.classList.remove("active");
  });

  // Find the player
  const player = gameState.players.find((p) => p.number === playerNumber);
  if (!player) return;

  gameState.selectedPlayer = player;

  // Add active class to selected pill
  const activePill = document.querySelector(
    `.player-pill[data-player-id="${playerNumber}"]`
  );
  if (activePill) {
    activePill.classList.add("active");

    // Scroll the pill into view if needed
    activePill.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }

  // Determine which team tab to show
  const isHomeTeam = gameState.homeTeamPlayers.includes(player);
  const tabToShow = isHomeTeam ? "home" : "away";

  // Get the currently active tab
  const currentActiveTab = document.querySelector(".nav-tabs .nav-link.active");

  // Only switch tabs if we're not already on the correct one
  if (!currentActiveTab.id.includes(tabToShow)) {
    const tabElement = document.querySelector(`#${tabToShow}-tab`);
    if (tabElement) {
      // Use Bootstrap's Tab API to properly switch tabs
      const tab = new bootstrap.Tab(tabElement);
      tab.show();

      // Wait for tab transition to complete before updating stats
      setTimeout(() => {
        updatePlayerStatsDisplay(player, tabToShow);
      }, 150);
      return;
    }
  }

  // If already on correct tab, just update stats
  updatePlayerStatsDisplay(player, tabToShow);
}

// Update player stats display
function updatePlayerStatsDisplay(player, team) {
  const containerId = `${team}-player-stats`;
  const container = document.getElementById(containerId);

  if (!container) return;

  container.innerHTML = `
        <div class="player-stats-container">
            <h4 class="mb-3">${player.displayName} <small class="text-muted">${
    player.position
  }</small></h4>
            
            <div class="row">
                <div class="col-md-6">
                    <h5 class="text-success">Offensive Stats</h5>
                    <ul class="list-group list-group-flush mb-3">
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            Goals <span class="badge bg-success rounded-pill">${
                              player.stats.goals
                            }</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            Assists <span class="badge bg-success rounded-pill">${
                              player.stats.assists
                            }</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            Shots <span class="badge bg-success rounded-pill">${
                              player.stats.shots
                            }</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            Shots on Goal <span class="badge bg-success rounded-pill">${
                              player.stats.shotsOnGoal
                            }</span>
                        </li>
                    </ul>
                </div>
                
                <div class="col-md-6">
                    <h5 class="text-primary">Defensive Stats</h5>
                    <ul class="list-group list-group-flush mb-3">
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            Ground Balls <span class="badge bg-primary rounded-pill">${
                              player.stats.groundBalls
                            }</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            Turnovers <span class="badge bg-primary rounded-pill">${
                              player.stats.turnovers
                            }</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            Caused Turnovers <span class="badge bg-primary rounded-pill">${
                              player.stats.causedTurnovers
                            }</span>
                        </li>
                    </ul>
                    
                    ${
                      player.position === "goalie"
                        ? `
                    <h5 class="text-info">Goalie Stats</h5>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            Saves <span class="badge bg-info rounded-pill">${player.stats.saves}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            Goals Allowed <span class="badge bg-info rounded-pill">${player.stats.goalsAllowed}</span>
                        </li>
                    </ul>
                    `
                        : ""
                    }
                </div>
            </div>
            
            <!-- Active Penalties -->
            <div id="active-penalties-container" class="mt-3 ${
              player.activePenalties.length > 0 ? "" : "d-none"
            }">
                <h5 class="text-danger">Active Penalties</h5>
                <ul id="active-penalties-list" class="list-group list-group-flush">
                    ${player.activePenalties
                      .map((penalty, index) => {
                        const minutes = Math.floor(penalty.remainingTime / 60);
                        const seconds = penalty.remainingTime % 60;
                        return `
                        <li class="list-group-item d-flex justify-content-between align-items-center ${
                          penalty.isExpiring ? "penalty-expiring" : ""
                        }">
                            Penalty #${index + 1}
                            <span class="badge bg-danger rounded-pill">
                                ${minutes}:${seconds < 10 ? "0" : ""}${seconds}
                            </span>
                            <div class="penalty-progress">
                                <div class="penalty-progress-bar" style="width: ${
                                  (penalty.remainingTime /
                                    penalty.totalDuration) *
                                  100
                                }%"></div>
                            </div>
                        </li>
                        `;
                      })
                      .join("")}
                </ul>
            </div>
            
            <!-- Stat Buttons -->
            <div class="mt-4">
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header bg-success bg-opacity-10">
                                <h6 class="mb-0">Offensive Stats</h6>
                            </div>
                            <div class="card-body">
                                <div class="d-grid gap-2">
                                    <button class="stat-btn btn btn-outline-success" data-stat="goals">
                                        <i class="bi bi-bullseye"></i> Goal
                                    </button>
                                    <button class="stat-btn btn btn-outline-success" data-stat="assists">
                                        <i class="bi bi-send"></i> Assist
                                    </button>
                                    <button class="stat-btn btn btn-outline-success" data-stat="shots">
                                        <i class="bi bi-bullseye"></i> Shot
                                    </button>
                                    <button class="stat-btn btn btn-outline-success" data-stat="shotsOnGoal">
                                        <i class="bi bi-bullseye"></i> Shot on Goal
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header bg-primary bg-opacity-10">
                                <h6 class="mb-0">Defensive Stats</h6>
                            </div>
                            <div class="card-body">
                                <div class="d-grid gap-2">
                                    <button class="stat-btn btn btn-outline-primary" data-stat="groundBalls">
                                        <i class="bi bi-circle"></i> Ground Ball
                                    </button>
                                    <button class="stat-btn btn btn-outline-primary" data-stat="turnovers">
                                        <i class="bi bi-arrow-left-right"></i> Turnover
                                    </button>
                                    <button class="stat-btn btn btn-outline-primary" data-stat="causedTurnovers">
                                        <i class="bi bi-shield"></i> Caused Turnover
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${
                      player.position === "goalie"
                        ? `
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header bg-info bg-opacity-10">
                                <h6 class="mb-0">Goalie Stats</h6>
                            </div>
                            <div class="card-body">
                                <div class="d-grid gap-2">
                                    <button class="stat-btn btn btn-outline-info" data-stat="saves">
                                        <i class="bi bi-hand-thumbs-up"></i> Save
                                    </button>
                                    <button class="stat-btn btn btn-outline-info" data-stat="goalsAllowed">
                                        <i class="bi bi-hand-thumbs-down"></i> Goal Allowed
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    `
                        : ""
                    }
                    
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header bg-danger bg-opacity-10">
                                <h6 class="mb-0">Penalties</h6>
                            </div>
                            <div class="card-body">
                                <div class="d-grid gap-2">
                                    <button class="penalty-btn btn btn-outline-danger" data-duration="30">
                                        <i class="bi bi-clock"></i> 30-Second Penalty
                                    </button>
                                    <button class="penalty-btn btn btn-outline-danger" data-duration="60">
                                        <i class="bi bi-clock"></i> 1-Minute Penalty
                                    </button>
                                    <button class="penalty-btn btn btn-outline-danger" data-duration="120">
                                        <i class="bi bi-clock"></i> 2-Minute Penalty
                                    </button>
                                    <button class="btn btn-outline-secondary btn-sm" id="custom-penalty-btn">
                                        <i class="bi bi-gear"></i> Custom Penalty
                                    </button>
                                    <div id="custom-penalty-input" class="d-none mt-2">
                                        <label class="form-label">Custom Duration (seconds):</label>
                                        <input type="number" id="penalty-seconds" class="form-control" value="30" min="5" max="300">
                                        <button id="confirm-custom-penalty" class="btn btn-danger btn-sm mt-2 w-100">
                                            <i class="bi bi-check"></i> Add Custom Penalty
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Add event listeners to stat buttons
  document.querySelectorAll(".stat-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const stat = this.dataset.stat;

      if (!gameState.selectedPlayer) return;

      if (stat === "penalties") {
        document.getElementById("penalty-time").classList.toggle("d-none");
        return;
      }

      recordStat(gameState.selectedPlayer, stat);
      updatePlayerStatsDisplay(gameState.selectedPlayer, team);
    });
  });

  // Add event listener to confirm penalty button
  const confirmPenaltyBtn = document.getElementById("confirm-penalty");
  if (confirmPenaltyBtn) {
    confirmPenaltyBtn.addEventListener("click", function () {
      const seconds =
        parseInt(document.getElementById("penalty-seconds").value) || 30;
      gameState.selectedPlayer.addPenalty(seconds);
      document.getElementById("penalty-time").classList.add("d-none");
      updatePlayerStatsDisplay(gameState.selectedPlayer, team);
      updateGlobalPenaltyDisplay();
    });
  }
}

// Record a statistic for a player
// Modify recordStat to track events
function recordStat(player, stat, value = 1) {
    player.stats[stat] += value;
    
    // Record game event
    const event = {
        type: 'stat',
        timestamp: new Date().toISOString(),
        period: gameState.period,
        gameTime: gameState.settings.periodLength - gameState.timeRemaining,
        player: player.number,
        stat,
        value,
        team: gameState.homeTeamPlayers.includes(player) ? 'home' : 'away'
    };
    
    gameState.gameEvents.push(event);
    
    // Special cases
    if (stat === 'shotsOnGoal') {
        player.stats.shots++;
    }
    
    if (stat === 'goals') {
        // Update team score
        const isHomeTeam = gameState.homeTeamPlayers.includes(player);
        if (isHomeTeam) {
            gameState.homeScore++;
            homeScoreEl.textContent = gameState.homeScore;
        } else {
            gameState.awayScore++;
            awayScoreEl.textContent = gameState.awayScore;
        }
        
        // Record goal event
        gameState.gameEvents.push({
            type: 'goal',
            timestamp: new Date().toISOString(),
            period: gameState.period,
            gameTime: gameState.settings.periodLength - gameState.timeRemaining,
            player: player.number,
            team: isHomeTeam ? 'home' : 'away',
            score: `${gameState.homeScore}-${gameState.awayScore}`
        });
        
        // Check for assist
        if (gameState.lastPassPlayer) {
            gameState.lastPassPlayer.stats.assists++;
            gameState.gameEvents.push({
                type: 'assist',
                timestamp: new Date().toISOString(),
                period: gameState.period,
                gameTime: gameState.settings.periodLength - gameState.timeRemaining,
                player: gameState.lastPassPlayer.number,
                team: gameState.homeTeamPlayers.includes(gameState.lastPassPlayer) ? 'home' : 'away',
                goalScorer: player.number
            });
            gameState.lastPassPlayer = null;
        }
    }
    
    if (stat === 'shots' || stat === 'shotsOnGoal') {
        gameState.lastPassPlayer = player;
    }
    
    // Save changes
    saveGameData();
    
    // Update UI
    const team = gameState.homeTeamPlayers.includes(player) ? 'home' : 'away';
    updatePlayerStatsDisplay(player, team);
}

// Game clock functions
function toggleGameClock() {
  if (gameState.isRunning) {
    clearInterval(gameState.timerInterval);
    startStopBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
  } else {
    gameState.timerInterval = setInterval(updateGameClock, 1000);
    startStopBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Stop';
  }
  gameState.isRunning = !gameState.isRunning;
}

function updateGameClock() {
  if (gameState.timeRemaining > 0) {
    gameState.timeRemaining--;
    updateClockDisplay();

    // Update all players' penalty clocks
    gameState.players.forEach((player) => {
      player.updatePenalties(gameState.timeRemaining);
    });

    // Update the penalty display if viewing a player with active penalties
    if (gameState.selectedPlayer) {
      const team = gameState.homeTeamPlayers.includes(gameState.selectedPlayer)
        ? "home"
        : "away";
      updatePlayerStatsDisplay(gameState.selectedPlayer, team);
    }

    updateGlobalPenaltyDisplay();
  } else {
    // Period ended
    clearInterval(gameState.timerInterval);
    gameState.isRunning = false;
    startStopBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
    alert(`Period ${gameState.period} ended!`);
  }
}

function updateClockDisplay() {
  const minutes = Math.floor(gameState.timeRemaining / 60);
  const seconds = gameState.timeRemaining % 60;
  gameClockEl.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function resetPeriod() {
  clearInterval(gameState.timerInterval);
  gameState.isRunning = false;
  startStopBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
  gameState.timeRemaining = 12 * 60;
  gameState.period = 1;
  updateClockDisplay();
  periodEl.textContent = gameState.period;
}

function updateScore(team) {
  if (team === "home") {
    gameState.homeScore++;
    homeScoreEl.textContent = gameState.homeScore;
  } else {
    gameState.awayScore++;
    awayScoreEl.textContent = gameState.awayScore;
  }

  // Add animation
  const scoreEl = team === "home" ? homeScoreEl : awayScoreEl;
  scoreEl.classList.add("score-change");
  setTimeout(() => {
    scoreEl.classList.remove("score-change");
  }, 500);
}

// Global penalty display
function updateGlobalPenaltyDisplay() {
  const globalPenaltyList = document.getElementById("global-penalty-list");
  const noPenaltiesMsg = document.getElementById("no-active-penalties");
  const penaltyCountBadge = document.getElementById("active-penalty-count");

  let allActivePenalties = [];

  gameState.players.forEach((player) => {
    player.activePenalties.forEach((penalty) => {
      allActivePenalties.push({
        player,
        penalty,
        team: gameState.homeTeamPlayers.includes(player) ? "home" : "away",
      });
    });
  });

  penaltyCountBadge.textContent = allActivePenalties.length;
  globalPenaltyList.innerHTML = "";

  if (allActivePenalties.length === 0) {
    globalPenaltyList.appendChild(noPenaltiesMsg);
    return;
  }

  allActivePenalties.sort(
    (a, b) => a.penalty.remainingTime - b.penalty.remainingTime
  );

  allActivePenalties.forEach(({ player, penalty, team }) => {
    const minutes = Math.floor(penalty.remainingTime / 60);
    const seconds = penalty.remainingTime % 60;
    const timeString = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    const item = document.createElement("div");
    item.className = `list-group-item d-flex justify-content-between align-items-center penalty-team-${team} ${
      penalty.isExpiring ? "penalty-item-expiring" : ""
    }`;

    item.innerHTML = `
            <div class="w-100">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="penalty-player">${
                          player.displayName
                        }</span>
                        <small class="text-muted ms-2">${
                          team === "home" ? "Home" : "Away"
                        } • ${player.position}</small>
                    </div>
                    <div>
                        <span class="penalty-time me-2">${timeString}</span>
                        <button class="btn btn-sm btn-outline-danger penalty-clear-btn" data-player="${
                          player.number
                        }" data-penalty-index="${player.activePenalties.indexOf(
      penalty
    )}">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
                <div class="penalty-progress">
                    <div class="penalty-progress-bar" style="width: ${
                      (penalty.remainingTime / penalty.totalDuration) * 100
                    }%"></div>
                </div>
            </div>
        `;

    globalPenaltyList.appendChild(item);
  });

  document.querySelectorAll(".penalty-clear-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const playerNumber = this.dataset.player;
      const penaltyIndex = parseInt(this.dataset.penaltyIndex);

      const player = gameState.players.find((p) => p.number === playerNumber);
      if (player && player.activePenalties[penaltyIndex]) {
        player.activePenalties.splice(penaltyIndex, 1);
        updateGlobalPenaltyDisplay();

        if (
          gameState.selectedPlayer &&
          gameState.selectedPlayer.number === playerNumber
        ) {
          const team = gameState.homeTeamPlayers.includes(player)
            ? "home"
            : "away";
          updatePlayerStatsDisplay(player, team);
        }
      }
    });
  });
}

// Event listeners
startStopBtn.addEventListener("click", toggleGameClock);
resetPeriodBtn.addEventListener("click", resetPeriod);

// Add event listeners for penalty buttons
document.addEventListener("click", function (e) {
  // Handle quick-select penalty buttons
  if (e.target.classList.contains("penalty-btn")) {
    const duration = parseInt(e.target.dataset.duration);
    if (gameState.selectedPlayer) {
      addPenaltyToPlayer(gameState.selectedPlayer, duration);
    }
  }

  // Handle custom penalty toggle
  if (e.target.id === "custom-penalty-btn") {
    document.getElementById("custom-penalty-input").classList.toggle("d-none");
  }

  // Handle custom penalty confirmation
  if (e.target.id === "confirm-custom-penalty") {
    const duration =
      parseInt(document.getElementById("penalty-seconds").value) || 30;
    if (gameState.selectedPlayer) {
      addPenaltyToPlayer(gameState.selectedPlayer, duration);
      document.getElementById("custom-penalty-input").classList.add("d-none");
    }
  }
});

// Unified function to add penalties
function addPenaltyToPlayer(player, duration) {
  if (!player || !duration) return;

  // Ensure duration is within reasonable bounds
  duration = Math.max(5, Math.min(300, duration));

  player.addPenalty(duration);

  // Update displays
  const team = gameState.homeTeamPlayers.includes(player) ? "home" : "away";
  updatePlayerStatsDisplay(player, team);
  updateGlobalPenaltyDisplay();

  // Show confirmation toast
  showToast(
    `Added ${formatPenaltyDuration(duration)} penalty to ${player.displayName}`
  );
}

// Helper function to format penalty duration
function formatPenaltyDuration(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds === 60) return "1 minute";
  return `${Math.floor(seconds / 60)} minutes`;
}

// Optional: Add toast notifications
function showToast(message) {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) return;

  const toastId = `toast-${Date.now()}`;
  const toast = document.createElement("div");
  toast.className = "toast show align-items-center text-white bg-success";
  toast.role = "alert";
  toast.id = toastId;
  toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

  toastContainer.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    const bsToast = bootstrap.Toast.getOrCreateInstance(toast);
    bsToast.hide();
    toast.addEventListener("hidden.bs.toast", () => {
      toast.remove();
    });
  }, 3000);
}

// Initialize the game when DOM is loaded
document.addEventListener("DOMContentLoaded", initGame);
// Add tab change event listener
document.querySelectorAll("#teamTabs .nav-link").forEach((tab) => {
  tab.addEventListener("shown.bs.tab", (event) => {
    const team = event.target.id.split("-")[0]; // 'home' or 'away'

    // Find first player in this team and select them
    const players =
      team === "home" ? gameState.homeTeamPlayers : gameState.awayTeamPlayers;
    if (players.length > 0) {
      selectPlayer(players[0].number);
    }
  });
});

// Game Settings Management
function initGameSettings() {
    // Load saved settings or use defaults
    const savedSettings = JSON.parse(localStorage.getItem('laxGameSettings')) || {
        periodLength: 12,
        numPeriods: 4,
        overtimeEnabled: true
    };

    // Apply settings to game state
    gameState.periodLength = savedSettings.periodLength * 60; // Convert to seconds
    gameState.numPeriods = savedSettings.numPeriods;
    gameState.overtimeEnabled = savedSettings.overtimeEnabled;
    gameState.timeRemaining = gameState.periodLength;

    // Set form values
    document.getElementById('periodLength').value = savedSettings.periodLength;
    document.getElementById('numPeriods').value = savedSettings.numPeriods;
    document.getElementById('overtimeEnabled').checked = savedSettings.overtimeEnabled;

    // Update clock display
    updateClockDisplay();
}

function saveGameSettings() {
    const settings = {
        periodLength: parseInt(document.getElementById('periodLength').value) || 12,
        numPeriods: parseInt(document.getElementById('numPeriods').value) || 4,
        overtimeEnabled: document.getElementById('overtimeEnabled').checked
    };

    // Validate inputs
    if (settings.periodLength < 1 || settings.periodLength > 30) {
        alert('Period length must be between 1 and 30 minutes');
        return;
    }

    if (settings.numPeriods < 1 || settings.numPeriods > 6) {
        alert('Number of periods must be between 1 and 6');
        return;
    }

    // Save to localStorage
    localStorage.setItem('laxGameSettings', JSON.stringify(settings));

    // Update game state
    gameState.periodLength = settings.periodLength * 60;
    gameState.numPeriods = settings.numPeriods;
    gameState.overtimeEnabled = settings.overtimeEnabled;
    gameState.timeRemaining = gameState.periodLength;
    gameState.period = 1;

    // Update displays
    updateClockDisplay();
    periodEl.textContent = gameState.period;

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
    modal.hide();

    // Show confirmation
    showToast('Game settings saved successfully');
}

// Event Listeners for Settings
document.getElementById('saveSettings').addEventListener('click', saveGameSettings);

// Initialize settings when game loads
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    initGameSettings();
});

// Save game data to localStorage
function saveGameData() {
    const gameData = {
        metadata: {
            gameId: gameState.gameId,
            gameDate: gameState.gameDate,
            homeTeam: gameState.homeTeam,
            awayTeam: gameState.awayTeam,
            lastUpdated: new Date().toISOString()
        },
        settings: gameState.settings,
        score: {
            home: gameState.homeScore,
            away: gameState.awayScore
        },
        period: gameState.period,
        players: {
            home: gameState.homeTeamPlayers.map(player => ({
                ...player,
                stats: player.stats,
                activePenalties: player.activePenalties
            })),
            away: gameState.awayTeamPlayers.map(player => ({
                ...player,
                stats: player.stats,
                activePenalties: player.activePenalties
            }))
        },
        events: gameState.gameEvents
    };

    // Save to localStorage
    localStorage.setItem(`laxGame_${gameState.gameId}`, JSON.stringify(gameData));
    
    // Also save to IndexedDB for larger datasets
    saveToIndexedDB(gameData);
}

// Load game data from storage
function loadGameData(gameId) {
    const savedData = localStorage.getItem(`laxGame_${gameId}`);
    if (savedData) {
        const gameData = JSON.parse(savedData);
        
        // Restore game state
        gameState.gameId = gameData.metadata.gameId;
        gameState.gameDate = gameData.metadata.gameDate;
        gameState.homeTeam = gameData.metadata.homeTeam;
        gameState.awayTeam = gameData.metadata.awayTeam;
        
        gameState.settings = gameData.settings;
        gameState.homeScore = gameData.score.home;
        gameState.awayScore = gameData.score.away;
        gameState.period = gameData.period;
        
        // Restore players
        gameState.homeTeamPlayers = gameData.players.home.map(p => {
            const player = new Player(p.number, p.firstName, p.lastName, p.position);
            player.stats = p.stats;
            player.activePenalties = p.activePenalties;
            return player;
        });
        
        gameState.awayTeamPlayers = gameData.players.away.map(p => {
            const player = new Player(p.number, p.firstName, p.lastName, p.position);
            player.stats = p.stats;
            player.activePenalties = p.activePenalties;
            return player;
        });
        
        gameState.players = [...gameState.homeTeamPlayers, ...gameState.awayTeamPlayers];
        gameState.gameEvents = gameData.events;
        
        // Update UI
        updateUIAfterLoad();
        return true;
    }
    return false;
}

// Initialize IndexedDB
function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('LacrosseStatsDB', 1);
        
        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.error);
            resolve(false); // Fall back to localStorage
        };
        
        request.onsuccess = (event) => {
            gameState.db = event.target.result;
            resolve(true);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('games')) {
                const store = db.createObjectStore('games', { keyPath: 'metadata.gameId' });
                store.createIndex('gameDate', 'metadata.gameDate', { unique: false });
            }
        };
    });
}

// Save to IndexedDB
function saveToIndexedDB(gameData) {
    if (!gameState.db) return;
    
    const transaction = gameState.db.transaction(['games'], 'readwrite');
    const store = transaction.objectStore('games');
    
    const request = store.put(gameData);
    
    request.onerror = (event) => {
        console.error("Error saving to IndexedDB:", event.target.error);
    };
}

// Update UI after loading game data
function updateUIAfterLoad() {
    // Update scores
    homeScoreEl.textContent = gameState.homeScore;
    awayScoreEl.textContent = gameState.awayScore;
    periodEl.textContent = gameState.period;
    
    // Update clock
    gameState.timeRemaining = gameState.settings.periodLength;
    updateClockDisplay();
    
    // Update players
    renderTeamPlayers();
    
    // Select first player
    if (gameState.homeTeamPlayers.length > 0) {
        selectPlayer(gameState.homeTeamPlayers[0].number);
    }
    
    showToast('Game loaded successfully');
}

// Start a new game
function newGame() {
    if (confirm('Start a new game? Current game data will be saved.')) {
        saveGameData();
        
        // Reset game state
        gameState.gameId = Date.now().toString();
        gameState.gameDate = new Date().toISOString();
        gameState.homeScore = 0;
        gameState.awayScore = 0;
        gameState.period = 1;
        gameState.timeRemaining = gameState.settings.periodLength;
        gameState.gameEvents = [];
        
        // Reset player stats
        gameState.players.forEach(player => {
            for (const stat in player.stats) {
                player.stats[stat] = 0;
            }
            player.activePenalties = [];
        });
        
        // Update UI
        updateUIAfterLoad();
        showToast('New game started');
    }
}

// Export game data as JSON file
function exportGameData() {
    saveGameData(); // Ensure latest data is saved
    
    const gameData = JSON.parse(localStorage.getItem(`laxGame_${gameState.gameId}`));
    const dataStr = JSON.stringify(gameData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportName = `lacrosse_game_${gameState.gameDate.replace(/[:.]/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
}

// Import game data from JSON file
function importGameData(file) {
    const reader = new FileReader();
    
    reader.onload = (event) => {
        try {
            const gameData = JSON.parse(event.target.result);
            
            if (gameData.metadata && gameData.metadata.gameId) {
                localStorage.setItem(`laxGame_${gameData.metadata.gameId}`, JSON.stringify(gameData));
                
                // Load the imported game
                if (loadGameData(gameData.metadata.gameId)) {
                    showToast('Game imported successfully');
                } else {
                    showToast('Error loading imported game', 'danger');
                }
            } else {
                showToast('Invalid game file format', 'danger');
            }
        } catch (e) {
            console.error("Error importing game:", e);
            showToast('Error parsing game file', 'danger');
        }
    };
    
    reader.readAsText(file);
}

document.getElementById('newGameBtn').addEventListener('click', newGame);
document.getElementById('exportGameBtn').addEventListener('click', exportGameData);
document.getElementById('importGameBtn').addEventListener('click', () => {
    document.getElementById('importGameInput').click();
});
document.getElementById('importGameInput').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        importGameData(e.target.files[0]);
    }
});

// Auto-save every 30 seconds
setInterval(saveGameData, 30000);

// Save when window is closing
window.addEventListener('beforeunload', (e) => {
    saveGameData();
    // Note: Modern browsers may not show custom messages
    e.preventDefault();
    e.returnValue = '';
});