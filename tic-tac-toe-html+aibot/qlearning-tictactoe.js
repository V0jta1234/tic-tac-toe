class QLearningTicTacToe {
    constructor(alpha=0.1, gamma=0.9, epsilon=0.2) {
        this.q = {}; // Q-table
        this.alpha = alpha;
        this.gamma = gamma;
        this.epsilon = epsilon;
        this.lastState = null;
        this.lastAction = null;
        this.loadQ(); // načti Q-tabuli při vytvoření
    }

    getState(board) {
        return board.join('');
    }

    chooseAction(board) {
        const available = board.map((v,i) => v===0 ? i : null).filter(v=>v!==null);
        if (Math.random() < this.epsilon) {
            return available[Math.floor(Math.random()*available.length)];
        }
        const state = this.getState(board);
        let maxQ = -Infinity, best = [];
        for (let a of available) {
            const qv = this.q[[state,a]] ?? 0;
            if (qv > maxQ) { maxQ = qv; best = [a]; }
            else if (qv === maxQ) best.push(a);
        }
        return best.length ? best[Math.floor(Math.random()*best.length)] : available[0];
    }

    updateQ(prevBoard, action, reward, nextBoard, done) {
        const prevState = this.getState(prevBoard);
        const nextState = this.getState(nextBoard);
        const prevQ = this.q[[prevState, action]] ?? 0;
        let maxNextQ = 0;
        if (!done) {
            const available = nextBoard.map((v,i) => v===0 ? i : null).filter(v=>v!==null);
            maxNextQ = Math.max(...available.map(a => this.q[[nextState,a]] ?? 0));
        }
        this.q[[prevState, action]] = prevQ + this.alpha * (reward + this.gamma * maxNextQ - prevQ);
        this.saveQ(); // ulož Q-tabuli po každé aktualizaci
    }

    saveQ() {
        try {
            localStorage.setItem('qtable', JSON.stringify(this.q));
        } catch (e) {
            console.warn('Nepodařilo se uložit Q-tabuli:', e);
        }
    }

    loadQ() {
        try {
            const data = localStorage.getItem('qtable');
            if (data) this.q = JSON.parse(data);
        } catch (e) {
            console.warn('Nepodařilo se načíst Q-tabuli:', e);
        }
    }
}

// --- Herní logika propojení s HTML --- //

const agent = new QLearningTicTacToe();
let board = Array(9).fill(0); // 0=prázdné, 1=hráč, 2=AI
let playerTurn = true; // true=hráč, false=AI
let moveCount = 0; // Přidat globální počítadlo tahů

// --- AUTOTRAINING: Učení hraním sám proti sobě --- //
function selfPlayTrain(episodes = 1000, delay = 0) {
    let episode = 0;
    let stats = {draw: 0, p1: 0, p2: 0};

    function playOneGame(callback) {
        let b = Array(9).fill(0);
        let turn = 1; // 1 nebo 2
        let history = [];
        let winner = null;
        let moves = 0;

        function step() {
            if ((winner = checkWinner(b)) !== null) {
                // Statistika výsledků
                if (winner === 0) stats.draw++;
                else if (winner === 1) stats.p1++;
                else if (winner === 2) stats.p2++;

                // Zpětné učení pro oba hráče
                for (let i = history.length - 1; i >= 0; i--) {
                    const {prevBoard, action, turn} = history[i];
                    let reward = 0;
                    if (winner === 0) reward = 0.5; // remíza
                    else if (winner === turn) reward = 1;
                    else reward = -1;
                    agent.updateQ(prevBoard, action, reward, b, true);
                    b = prevBoard.slice();
                    winner = 3 - turn; // pro druhého hráče
                }
                if (callback) callback(moves);
                return;
            }
            const prevBoard = b.slice();
            const action = agent.chooseAction(b);
            b[action] = turn;
            history.push({prevBoard: prevBoard.slice(), action, turn});
            renderBoardCustom(b); // Zobraz tah na herní ploše
            turn = 3 - turn;
            moves++;
            if (delay > 0) {
                setTimeout(step, delay);
            } else {
                step();
            }
        }
        step();
    }

    function updateStatsDisplay(lastMoves = null) {
        let statsDiv = document.getElementById('selfplay-stats');
        if (!statsDiv) {
            statsDiv = document.createElement('div');
            statsDiv.id = 'selfplay-stats';
            statsDiv.style.margin = '10px 0';
            document.body.appendChild(statsDiv);
        }
        statsDiv.innerHTML = `
            <b>Výsledky autotréninku:</b><br>
            Hráč 1 výher: ${stats.p1}<br>
            Hráč 2 výher: ${stats.p2}<br>
            Remíz: ${stats.draw}<br>
            Odehráno: ${episode} / ${episodes}<br>
            ${lastMoves !== null ? `Tahů v poslední hře: ${lastMoves}` : ""}
        `;
    }

    function nextEpisode() {
        playOneGame(function(moves) {
            episode++;
            if (episode % 10 === 0 || episode === episodes) updateStatsDisplay(moves);
            if (episode < episodes) {
                if (delay > 0) setTimeout(nextEpisode, delay);
                else nextEpisode();
            } else {
                updateStatsDisplay();
            }
        });
    }

    updateStatsDisplay();
    nextEpisode();
}

// Přidejte tlačítko do HTML pro spuštění autotréninku, např.:
// <button onclick="selfPlayTrain(1000, 0)">Autotrénink (1000 her)</button>

function renderBoard() {
    for (let i = 0; i < 9; i++) {
        const cell = document.getElementById('cell'+i);
        cell.innerText = board[i] === 1 ? 'X' : board[i] === 2 ? 'O' : '';
    }
}

function renderBoardCustom(b) {
    // Pomocná funkce pro vykreslení libovolného boardu na plátno
    for (let i = 0; i < 9; i++) {
        const cell = document.getElementById('cell'+i);
        cell.innerText = b[i] === 1 ? 'X' : b[i] === 2 ? 'O' : '';
    }
}

function checkWinner(b) {
    const wins = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];
    for (let w of wins) {
        if (b[w[0]] && b[w[0]] === b[w[1]] && b[w[1]] === b[w[2]]) return b[w[0]];
    }
    if (b.every(x=>x!==0)) return 0; // remíza
    return null;
}

function playerMove(i) {
    if (!playerTurn || board[i] !== 0) return;
    board[i] = 1;
    moveCount++; // Zvýšit počet tahů
    renderBoard();
    const winner = checkWinner(board);
    if (winner !== null) {
        endGame(winner);
        return;
    }
    playerTurn = false;
    setTimeout(aiMove, 300);
}

function aiMove() {
    const prevBoard = board.slice();
    const action = agent.chooseAction(board);
    board[action] = 2;
    moveCount++; // Zvýšit počet tahů
    renderBoard();
    const winner = checkWinner(board);
    agent.updateQ(prevBoard, action, winner === 2 ? 1 : winner === 1 ? -1 : winner === 0 ? 0.5 : 0, board, winner !== null);
    if (winner !== null) {
        endGame(winner);
        return;
    }
    playerTurn = true;
}

function endGame(winner) {
    let msg = winner === 1 ? "Vyhrál jsi!" : winner === 2 ? "AI vyhrála!" : "Remíza!";
    msg += `\nPočet tahů: ${moveCount}`;
    setTimeout(() => alert(msg), 100);
    // Učení z posledního tahu
    if (!playerTurn) { // pokud AI hrála poslední
        agent.updateQ(board, null, winner === 2 ? 1 : winner === 1 ? -1 : 0.5, board, true);
    }
    setTimeout(resetGame, 500);
}

function resetGame() {
    board = Array(9).fill(0);
    playerTurn = true;
    moveCount = 0; // Resetovat počítadlo tahů
    renderBoard();
}

// --- Propojení s HTML tlačítky --- //
window.onload = function() {
    for (let i = 0; i < 9; i++) {
        document.getElementById('cell'+i).onclick = () => playerMove(i);
    }
    renderBoard();
};

function cellClicked(i) {
    playerMove(i);
}

function downloadQTable() {
    const dataStr = JSON.stringify(agent.q, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "qtable.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function uploadQTable(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            agent.q = data;
            agent.saveQ();
            alert("Q-tabule byla úspěšně nahrána.");
        } catch (err) {
            alert("Chyba při načítání Q-tabule: " + err);
        }
    };
    reader.readAsText(file);
}