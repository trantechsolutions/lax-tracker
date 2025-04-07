// Game Clock Logic
let gameClock = 12 * 60;
let gameInterval;
let shotClockEnabled = true;
let penaltyInterval = null;
let teamAGoals = 0;
let teamBGoals = 0;

let playerStats = {
    "A": {}, // Team A players
    "B": {}  // Team B players
};

function updateGoals(team) {
    if (team === "A") {
        teamAGoals++;
        document.getElementById('teamAGoals').textContent = `${teamAGoals} Goals`;
    } else if (team === "B") {
        teamBGoals++;
        document.getElementById('teamBGoals').textContent = `${teamBGoals} Goals`;
    }
}

function updateGameClock() {
    const gameClockDisplay = document.getElementById('gameClockDisplay');
    let minutes = Math.floor(gameClock / 60);
    let seconds = gameClock % 60;
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    gameClockDisplay.textContent = `${minutes}:${seconds}`;
}

function startGameClock() {
    if (gameInterval) return;
    gameInterval = setInterval(() => {
        if (gameClock > 0) {
            gameClock--;
            updateGameClock();
        } else {
            pauseGameClock(); // auto stop
        }
    }, 1000);

    if (shotClockEnabled && !shotInterval) {
        shotInterval = setInterval(() => {
            if (shotClock > 0) {
                shotClock--;
                updateShotClock();
            }
        }, 1000);
    }
    if (penalties.some(p => !p.expired && p.timeLeft > 0) && !penaltyInterval) {
        startPenaltyTimer();
    }
}

function pauseGameClock() {
    clearInterval(gameInterval);
    clearInterval(shotInterval);
    clearInterval(penaltyInterval);
    gameInterval = null;
    shotInterval = null;
    penaltyInterval = null;
}

function resetGameClock() {
    pauseGameClock();
    gameClock = 12 * 60;
    updateGameClock();
}

updateGameClock();

// Shot Clock Logic
let shotClock = 80;
let shotInterval;

function updateShotClock() {
    const shotClockDisplay = document.getElementById('shotClockDisplay');
    
    // Only show seconds
    shotClockDisplay.textContent = shotClock;

    // Turn red when shot clock is <= 10 seconds
    if (shotClock <= 10) {
        shotClockDisplay.classList.add("red");
    } else {
        shotClockDisplay.classList.remove("red");
    }
}

function startShotClock() {
    clearInterval(shotInterval);
    shotClock = parseInt(document.getElementById('shotClockInput').value);
    updateShotClock();
    shotInterval = setInterval(() => {
        if (shotClock > 0) {
            shotClock--;
            updateShotClock();
        } else {
            clearInterval(shotInterval);
            alert("Shot clock expired!");
        }
    }, 1000);
}

function resetShotClock() {
    clearInterval(shotInterval);
    shotClock = parseInt(document.getElementById('shotClockInput').value); // Use seconds
    updateShotClock();

    // Only restart if the game clock is running or shot clock enabled
    if (gameInterval || shotClockEnabled) {
        shotInterval = setInterval(() => {
            if (shotClock > 0) {
                shotClock--;
                updateShotClock();
            }
        }, 1000);
    }
}


updateShotClock();

// Penalty Tracking
const penalties = [];

function addPenalty() {
    if (gameClockRunning) {
        alert("You can only add penalties when the game clock is paused.");
        return;
    }

    const playerNum = document.getElementById("playerNum").value;
    const penaltyDuration = parseInt(document.getElementById("penaltyDuration").value);
    const penaltyType = document.getElementById("penaltyType").value;
    const team = prompt("Enter Team (A/B):"); // Input team, A or B

    if (playerNum === "") {
        alert("Please enter a player number.");
        return;
    }

    // Update player stats with penalty information
    if (!playerStats[team][playerNum]) {
        playerStats[team][playerNum] = {
            goals: 0,
            penalties: []
        };
    }

    playerStats[team][playerNum].penalties.push({
        duration: penaltyDuration,
        type: penaltyType
    });

    // Create penalty item
    const penaltyItem = document.createElement("div");
    penaltyItem.classList.add("penalty-item");

    const penaltyText = document.createElement("p");
    penaltyText.textContent = `Player #${playerNum} - ${penaltyDuration} seconds (${penaltyType})`;

    penaltyItem.appendChild(penaltyText);
    document.getElementById("penalties").appendChild(penaltyItem);

    // Clear input fields
    document.getElementById("playerNum").value = "";

    updatePlayerStats();
}

function updatePlayerStats() {
    let statsHTML = "";
    for (let team in playerStats) {
        for (let player in playerStats[team]) {
            let stat = playerStats[team][player];
            statsHTML += `
                <div class="player-stat-card">
                    <h5>Player #${player} (Team ${team})</h5>
                    <p>Goals: ${stat.goals}</p>
                    <p>Penalties: ${stat.penalties.length}</p>
                </div>
            `;
        }
    }
    document.getElementById("playerStats").innerHTML = statsHTML;
}

function startPenaltyTimer() {
    clearInterval(penaltyInterval);
    penaltyInterval = setInterval(() => {
        penalties.forEach(p => {
            if (!p.expired && p.timeLeft > 0) {
                p.timeLeft--;
                if (p.timeLeft <= 0) {
                    p.expired = true;
                }
            }
        });
        renderPenalties();
    }, 1000);
}

function renderPenalties() {
    const list = document.getElementById('penalties');
    list.innerHTML = '';
    penalties.forEach(p => {
        const li = document.createElement('li');
        li.className = `list-group-item ${p.expired ? 'text-muted' : ''}`;
        li.textContent = `#${p.player} - ${p.type} - ${p.timeLeft}s ${p.expired ? '(Expired)' : ''}`;
        list.appendChild(li);
    });
}