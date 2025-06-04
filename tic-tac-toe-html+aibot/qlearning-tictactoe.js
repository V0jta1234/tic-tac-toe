class QLearningTicTacToe {
    constructor(alpha=0.1, gamma=0.9, epsilon=0.2) {
        this.q = {}; // Q-table
        this.alpha = alpha;
        this.gamma = gamma;
        this.epsilon = epsilon;
        this.lastState = null;
        this.lastAction = null;
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
    }
}

// --- Herní logika propojení s HTML --- //

const agent = new QLearningTicTacToe();
let board = Array(9).fill(0); // 0=prázdné, 1=hráč, 2=AI
let playerTurn = true; // true=hráč, false=AI

function renderBoard() {
    for (let i = 0; i < 9; i++) {
        const cell = document.getElementById('cell'+i);
        cell.innerText = board[i] === 1 ? 'X' : board[i] === 2 ? 'O' : '';
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