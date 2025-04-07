

// Player data structure
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
            penaltyTime: 0
        };
        this.activePenalties = []; // Array to track active penalties
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
            timeRemaining: seconds,
            startTime: gameState.timeRemaining,
            endTime: gameState.timeRemaining - seconds
        });
    }
    
    updatePenalties(currentGameTime) {
        // Update all active penalties
        this.activePenalties = this.activePenalties.map(penalty => {
            const timeRemaining = Math.max(0, penalty.endTime - currentGameTime);
            return {
                ...penalty,
                timeRemaining: timeRemaining,
                isExpiring: timeRemaining <= 10 // Last 10 seconds
            };
        }).filter(penalty => penalty.timeRemaining > 0);
    }
    
    get hasActivePenalties() {
        return this.activePenalties.length > 0;
    }
}

// Game state
const gameState = {
    isRunning: false,
    period: 1,
    timeRemaining: 12 * 60, // 12 minutes in seconds
    homeScore: 0,
    awayScore: 0,
    timerInterval: null,
    players: [],
    lastPassPlayer: null, // To track potential assists
    selectedPlayer: null,
    homeTeamPlayers: [],
    awayTeamPlayers: []
};

// DOM elements
const startStopBtn = document.getElementById('start-stop');
const resetPeriodBtn = document.getElementById('reset-period');
const homeScoreBtn = document.getElementById('home-score-btn');
const awayScoreBtn = document.getElementById('away-score-btn');
const gameClockEl = document.getElementById('game-clock');
const periodEl = document.getElementById('period');
const homeScoreEl = document.getElementById('home-score');
const awayScoreEl = document.getElementById('away-score');
const playerSelect = document.getElementById('player-select');
const addPlayerBtn = document.getElementById('add-player');
const playerForm = document.getElementById('player-form');
const playerNameDisplay = document.getElementById('player-name-display');
const statButtons = document.querySelectorAll('.stat-btn');
const playerStatsList = document.getElementById('player-stats-list');
const addPlayerModal = document.getElementById('add-player-modal');
const closeModal = document.querySelector('.close');
const newPlayerForm = document.getElementById('new-player-form');
const penaltyTimeDiv = document.getElementById('penalty-time');
const penaltySeconds = document.getElementById('penalty-seconds');

// Event listeners
startStopBtn.addEventListener('click', toggleGameClock);
resetPeriodBtn.addEventListener('click', resetPeriod);
homeScoreBtn.addEventListener('click', () => updateScore('home'));
awayScoreBtn.addEventListener('click', () => updateScore('away'));
newPlayerForm.addEventListener('submit', addNewPlayer);
playerSelect.addEventListener('change', updatePlayerFormDisplay);
addPlayerBtn.addEventListener('click', () => addPlayerModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => addPlayerModal.classList.add('hidden'));
window.addEventListener('click', (e) => {
    if (e.target === addPlayerModal) {
        addPlayerModal.classList.add('hidden');
    }
});

document.getElementById('confirm-penalty').addEventListener('click', function() {
    const selectedPlayerId = playerSelect.value;
    if (!selectedPlayerId) return;
    
    const player = gameState.players.find(p => p.number === selectedPlayerId);
    const seconds = parseInt(penaltySeconds.value) || 30;
    
    recordStat(player, 'penalties', seconds);
    updatePlayerStatsDisplay(player);
    penaltyTimeDiv.classList.add('d-none');
});

// Add event listeners to all stat buttons
statButtons.forEach(button => {
    button.addEventListener('click', function() {
        const stat = this.dataset.stat;
        const selectedPlayerId = playerSelect.value;
        
        if (!selectedPlayerId) return;
        
        const player = gameState.players.find(p => p.number === selectedPlayerId);
        
        if (stat === 'penalties') {
            // Toggle penalty time input
            penaltyTimeDiv.classList.toggle('d-none');
            return;
        }
        
        recordStat(player, stat);
        updatePlayerStatsDisplay(player);
    });
});

// Functions
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
        
        gameState.players.forEach(player => {
            player.updatePenalties(gameState.timeRemaining);
        });
        
        updateActivePenaltyDisplay();
        updateGlobalPenaltyDisplay(); // Add this line
    } else {
        clearInterval(gameState.timerInterval);
        gameState.isRunning = false;
        startStopBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
        alert(`Period ${gameState.period} ended!`);
    }
}

function updateClockDisplay() {
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    gameClockEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function resetPeriod() {
    clearInterval(gameState.timerInterval);
    gameState.isRunning = false;
    startStopBtn.textContent = 'Start';
    gameState.timeRemaining = 12 * 60;
    gameState.period = 1;
    updateClockDisplay();
    periodEl.textContent = gameState.period;
}

function updateScore(team) {
    const scoreEl = team === 'home' ? homeScoreEl : awayScoreEl;
    
    if (team === 'home') {
        gameState.homeScore++;
        homeScoreEl.textContent = gameState.homeScore;
    } else {
        gameState.awayScore++;
        awayScoreEl.textContent = gameState.awayScore;
    }
    
    // Add animation
    scoreEl.classList.add('score-change');
    setTimeout(() => {
        scoreEl.classList.remove('score-change');
    }, 500);
}

// Functions
function addNewPlayer(e) {
    e.preventDefault();
    
    const number = document.getElementById('player-number').value;
    const firstName = document.getElementById('player-first-name').value;
    const lastName = document.getElementById('player-last-name').value;
    const position = document.getElementById('player-position').value;
    
    // Check if player number already exists
    if (gameState.players.some(p => p.number === number)) {
        alert('Player number already exists!');
        return;
    }
    
    const newPlayer = new Player(number, firstName, lastName, position);
    gameState.players.push(newPlayer);
    
    // Add to dropdown
    const option = document.createElement('option');
    option.value = newPlayer.number;
    option.textContent = newPlayer.displayName;
    playerSelect.appendChild(option);
    
    // Reset form
    newPlayerForm.reset();
    addPlayerModal.classList.add('hidden');
    
    // Select the new player
    playerSelect.value = number;
    updatePlayerFormDisplay();
}

function updatePlayerFormDisplay() {
    const selectedPlayerId = playerSelect.value;
    
    if (!selectedPlayerId) {
        playerForm.classList.add('d-none');
        return;
    }
    
    const player = gameState.players.find(p => p.number === selectedPlayerId);
    
    if (!player) return;
    
    playerNameDisplay.textContent = player.displayName;
    playerForm.classList.remove('d-none');
    
    // Show/hide goalie stats based on position
    const goalieStats = document.querySelector('.goalie-stats');
    if (player.position === 'goalie') {
        goalieStats.classList.remove('d-none');
    } else {
        goalieStats.classList.add('d-none');
    }
    
    updatePlayerStatsDisplay(player);
}

function updatePlayerStatsDisplay(player) {
    playerStatsList.innerHTML = '';
    
    for (const [stat, value] of Object.entries(player.stats)) {
        if (value > 0 || stat === 'goals' || stat === 'assists') {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            // Format stat name for display
            const statName = stat.replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase());
            
            li.innerHTML = `
                ${statName}
                <span class="badge bg-primary rounded-pill">${value}</span>
            `;
            playerStatsList.appendChild(li);
        }
    }
}

function recordStat(player, stat, value = 1) {
    if (stat === 'penalties' && value) {
        player.stats.penalties++;
        player.stats.penaltyTime += value;
    } else {
        player.stats[stat] += value;
    }
    
    // Special cases
    if (stat === 'shotsOnGoal') {
        player.stats.shots++; // A shot on goal is also a shot
    }
    
    // If this was a goal, check if we should record an assist
    if (stat === 'goals' && gameState.lastPassPlayer) {
        gameState.lastPassPlayer.stats.assists++;
        gameState.lastPassPlayer = null;
    }
    
    // If this was a pass that might become an assist, track it
    if (stat === 'shots' || stat === 'shotsOnGoal') {
        gameState.lastPassPlayer = player;
    }
}

function updateActivePenaltyDisplay() {
    const selectedPlayerId = playerSelect.value;
    const activePenaltiesContainer = document.getElementById('active-penalties-container');
    const activePenaltiesList = document.getElementById('active-penalties-list');
    
    if (!selectedPlayerId) {
        activePenaltiesContainer.classList.add('d-none');
        return;
    }
    
    const player = gameState.players.find(p => p.number === selectedPlayerId);
    
    if (!player || !player.hasActivePenalties) {
        activePenaltiesContainer.classList.add('d-none');
        return;
    }
    
    // Show the container
    activePenaltiesContainer.classList.remove('d-none');
    
    // Clear existing penalties
    activePenaltiesList.innerHTML = '';
    
    // Add current penalties
    player.activePenalties.forEach((penalty, index) => {
        const minutes = Math.floor(penalty.timeRemaining / 60);
        const seconds = penalty.timeRemaining % 60;
        
        const li = document.createElement('li');
        li.className = `list-group-item d-flex justify-content-between align-items-center ${penalty.isExpiring ? 'penalty-expiring' : ''}`;
        li.innerHTML = `
            Penalty #${index + 1}
            <span class="badge bg-danger rounded-pill">
                ${minutes}:${seconds < 10 ? '0' : ''}${seconds}
            </span>
        `;
        activePenaltiesList.appendChild(li);
    });
}

// Call this whenever we update the player display
function updatePlayerStatsDisplay(player) {
    playerStatsList.innerHTML = '';
    
    for (const [stat, value] of Object.entries(player.stats)) {
        if (value > 0 || stat === 'goals' || stat === 'assists') {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            // Format stat name for display
            const statName = stat.replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase());
            
            li.innerHTML = `
                ${statName}
                <span class="badge bg-primary rounded-pill">${value}</span>
            `;
            playerStatsList.appendChild(li);
        }
    }
    
    // Update penalty display
    updateActivePenaltyDisplay();
}

// Update player initialization to separate by team
function initSamplePlayers() {
    gameState.homeTeamPlayers = [
        new Player('1', 'John', 'Doe', 'attack'),
        new Player('2', 'Jane', 'Smith', 'midfield'),
        new Player('3', 'Mike', 'Johnson', 'defense'),
        new Player('4', 'Sarah', 'Williams', 'goalie')
    ];
    
    gameState.awayTeamPlayers = [
        new Player('8', 'Alex', 'Brown', 'attack'),
        new Player('15', 'Taylor', 'Davis', 'midfield'),
        new Player('3', 'Jordan', 'Miller', 'defense'),
        new Player('30', 'Casey', 'Wilson', 'goalie')
    ];
    
    gameState.players = [...gameState.homeTeamPlayers, ...gameState.awayTeamPlayers];
    
    // Populate player select dropdown
    gameState.players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.number;
        option.textContent = `${player.displayName} (${player.position})`;
        option.dataset.team = gameState.homeTeamPlayers.includes(player) ? 'home' : 'away';
        playerSelect.appendChild(option);
    });
}

// New function to update global penalty display
function updateGlobalPenaltyDisplay() {
    const globalPenaltyList = document.getElementById('global-penalty-list');
    const noPenaltiesMsg = document.getElementById('no-active-penalties');
    const penaltyCountBadge = document.getElementById('active-penalty-count');
    
    // Get all active penalties from all players
    let allActivePenalties = [];
    
    gameState.players.forEach(player => {
        player.activePenalties.forEach(penalty => {
            allActivePenalties.push({
                player,
                penalty,
                team: gameState.homeTeamPlayers.includes(player) ? 'home' : 'away'
            });
        });
    });
    
    // Update count badge
    penaltyCountBadge.textContent = allActivePenalties.length;
    
    // Clear existing display
    globalPenaltyList.innerHTML = '';
    
    if (allActivePenalties.length === 0) {
        // Show empty state
        globalPenaltyList.appendChild(noPenaltiesMsg);
        return;
    }
    
    // Sort by time remaining (soonest first)
    allActivePenalties.sort((a, b) => a.penalty.timeRemaining - b.penalty.timeRemaining);
    
    // Add each penalty to the display
    allActivePenalties.forEach(({player, penalty, team}) => {
        const minutes = Math.floor(penalty.timeRemaining / 60);
        const seconds = penalty.timeRemaining % 60;
        const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        const item = document.createElement('div');
        item.className = `list-group-item d-flex justify-content-between align-items-center penalty-team-${team} ${penalty.isExpiring ? 'penalty-item-expiring' : ''}`;
        
        item.innerHTML = `
            <div>
                <span class="penalty-player">${player.displayName}</span>
                <small class="text-muted ms-2">${team === 'home' ? 'Home' : 'Away'} • ${player.position}</small>
            </div>
            <div>
                <span class="penalty-time me-2">${timeString}</span>
                <button class="btn btn-sm btn-outline-danger penalty-clear-btn" data-player="${player.number}" data-penalty-index="${player.activePenalties.indexOf(penalty)}">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        `;
        
        globalPenaltyList.appendChild(item);
    });
    
    // Add event listeners to clear buttons
    document.querySelectorAll('.penalty-clear-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const playerNumber = this.dataset.player;
            const penaltyIndex = parseInt(this.dataset.penaltyIndex);
            
            const player = gameState.players.find(p => p.number === playerNumber);
            if (player && player.activePenalties[penaltyIndex]) {
                player.activePenalties.splice(penaltyIndex, 1);
                updateGlobalPenaltyDisplay();
                
                // If this player is currently selected, update their display too
                if (playerSelect.value === playerNumber) {
                    updateActivePenaltyDisplay();
                }
            }
        });
    });
}

// Update when adding new penalties
document.getElementById('confirm-penalty').addEventListener('click', function() {
    const selectedPlayerId = playerSelect.value;
    if (!selectedPlayerId) return;
    
    const player = gameState.players.find(p => p.number === selectedPlayerId);
    const seconds = parseInt(penaltySeconds.value) || 30;
    
    player.addPenalty(seconds);
    updatePlayerStatsDisplay(player);
    penaltyTimeDiv.classList.add('d-none');
    penaltySeconds.value = '30';
    
    updateGlobalPenaltyDisplay(); // Add this line
});

// Initialize the display when page loads
document.addEventListener('DOMContentLoaded', function() {
    initSamplePlayers();
    updateGlobalPenaltyDisplay(); // Add this line
});

// Initialize display
updateClockDisplay();