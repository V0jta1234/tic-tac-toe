let socket;
let room;

function onlineMultiplayer() {
    room = prompt("Zadejte název místnosti:");
    if (!room) return;

    document.getElementById("gameSelector").style.display = "none";
    document.getElementById("gameContainer").style.display = "flex";
    gamemode = "onlineMultiplayer";

    socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'join', room }));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'start') {
            turn = data.turn;
        }

        if (data.type === 'move') {
            const cellElement = document.getElementById(data.cell);
            cellElement.innerText = data.turn;
            freeCells.splice(freeCells.indexOf(data.cell), 1);

            if (data.turn === player1) {
                player1cells.push(data.cell);
                cellElement.classList.add("player1");
            } else {
                player2cells.push(data.cell);
                cellElement.classList.add("player2");
            }

            if (checkWin()) {
                playerWinner();
            } else if (freeCells.length === 0) {
                drawGame();
            } else {
                turn = (turn === player1) ? player2 : player1;
            }
        }
    };
}

function cellClicked(cell) {
    if (gamemode === "onlineMultiplayer") {
        const cellElement = document.getElementById("cell" + cell);
        if (cellElement.innerText === "" && turn === player1) {
            cellElement.innerText = turn;
            freeCells.splice(freeCells.indexOf("cell" + cell), 1);
            player1cells.push("cell" + cell);
            cellElement.classList.add("player1");

            if (checkWin()) {
                playerWinner();
            } else if (freeCells.length === 0) {
                drawGame();
            } else {
                turn = player2;
                socket.send(JSON.stringify({ type: 'move', room, cell: "cell" + cell, turn: player1 }));
            }
        }
    } else {
        // Původní logika pro singleplayer a localMultiplayer
    }
}
//proměné
var gamemode ="";
var turn = "";
var player1 = "X";
var player2 = "O";
var player1cells = [];
var player2cells = [];
var freeCells = ["cell0", "cell1", "cell2", "cell3", "cell4", "cell5", "cell6", "cell7", "cell8"];
//funkce
function singleplayer(){
    document.getElementById("gameSelector").style.display = "none";
    document.getElementById("gameContainer").style.display = "flex";
    gamemode = "singleplayer";
    turn = player1;
}
function localMultiplayer(){
    document.getElementById("gameSelector").style.display = "none";
    document.getElementById("gameContainer").style.display = "flex";
    gamemode = "localMultiplayer";
    turn = player1;
}
function resetGame(){
    window.location.reload();
}
function cellClicked(cell){
    const cellElement = document.getElementById("cell" + cell);
    if(gamemode==="singleplayer") {
        if (cellElement.innerText === "") {
            cellElement.innerText = turn;
            freeCells.splice(freeCells.indexOf("cell" + cell), 1);
            if (turn === player1) {
                player1cells.push("cell" + cell);
                cellElement.classList.add("player1");
            } else {
                player2cells.push("cell" + cell);
                cellElement.classList.add("player2");
            }
            if(checkWin()){
                playerWinner();
            }
            else if (freeCells.length === 0) {
                drawGame();
            }
            else {
                turn = (turn === player1) ? player2 : player1;
                computerMove();
            }
        }
    }
    else if(gamemode === "localMultiplayer") {
        if (cellElement.innerText === "") {
            cellElement.innerText = turn;
            freeCells.splice(freeCells.indexOf("cell" + cell), 1);
            if (turn === player1) {
                player1cells.push("cell" + cell);
                cellElement.classList.add("player1");
            } else {
                player2cells.push("cell" + cell);
                cellElement.classList.add("player2");
            }
            if(checkWin()){
                playerWinner();
            }
            else if (freeCells.length === 0) {
                drawGame();
            }
            else {
                turn = (turn === player1) ? player2 : player1;
            }
        }
    }
}
function computerMove() {
    if (gamemode === "singleplayer" && turn === player2) {
        // Speciální případ: pokud je to druhý tah hry a hráč začal rohem, počítač zvolí střed
        if (player1cells.length === 1 && player2cells.length === 0) {
            const corners = ["cell0", "cell2", "cell6", "cell8"];
            if (corners.includes(player1cells[0]) && freeCells.includes("cell4")) {
                const cellElement = document.getElementById("cell4");
                cellElement.innerText = turn;
                freeCells.splice(freeCells.indexOf("cell4"), 1);
                player2cells.push("cell4");
                cellElement.classList.add("player2");
                if (checkWin()) {
                    playerWinner();
                } else {
                    turn = player1;
                }
                return;
            }
            // Hráč začal středem
            if (player1cells[0] === "cell4") {
                // Vyber náhodný roh
                const availableCorners = corners.filter(corner => freeCells.includes(corner));
                if (availableCorners.length > 0) {
                    const randomCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
                    const cellElement = document.getElementById(randomCorner);
                    cellElement.innerText = turn;
                    freeCells.splice(freeCells.indexOf(randomCorner), 1);
                    player2cells.push(randomCorner);
                    cellElement.classList.add("player2");
                    if (checkWin()) {
                        playerWinner();
                    } else {
                        turn = player1;
                    }
                    return;
                }
            }
        }
        // 1. Pokus o výhru
        for (const combination of [
            ["cell0", "cell1", "cell2"],
            ["cell3", "cell4", "cell5"],
            ["cell6", "cell7", "cell8"],
            ["cell0", "cell3", "cell6"],
            ["cell1", "cell4", "cell7"],
            ["cell2", "cell5", "cell8"],
            ["cell0", "cell4", "cell8"],
            ["cell2", "cell4", "cell6"]
        ]) {
            const cells = combination.filter(cell => freeCells.includes(cell));
            const owned = combination.filter(cell => player2cells.includes(cell));
            if (owned.length === 2 && cells.length === 1) {
                // Dokonči výherní kombinaci
                const cell = cells[0];
                const cellElement = document.getElementById(cell);
                cellElement.innerText = turn;
                freeCells.splice(freeCells.indexOf(cell), 1);
                player2cells.push(cell);
                cellElement.classList.add("player2");
                if (checkWin()) {
                    playerWinner();
                } else {
                    turn = player1;
                }
                return;
            }
        }
        // 2. Zabránit výhře hráče
        for (const combination of [
            ["cell0", "cell1", "cell2"],
            ["cell3", "cell4", "cell5"],
            ["cell6", "cell7", "cell8"],
            ["cell0", "cell3", "cell6"],
            ["cell1", "cell4", "cell7"],
            ["cell2", "cell5", "cell8"],
            ["cell0", "cell4", "cell8"],
            ["cell2", "cell4", "cell6"]
        ]) {
            const cells = combination.filter(cell => freeCells.includes(cell));
            const owned = combination.filter(cell => player1cells.includes(cell));
            if (owned.length === 2 && cells.length === 1) {
                // Zabránit výhře hráče
                const cell = cells[0];
                const cellElement = document.getElementById(cell);
                cellElement.innerText = turn;
                freeCells.splice(freeCells.indexOf(cell), 1);
                player2cells.push(cell);
                cellElement.classList.add("player2");
                if (checkWin()) {
                    playerWinner();
                } else {
                    turn = player1;
                }
                return;
            }
        }
        // 3. Jinak náhodný tah
        const randomIndex = Math.floor(Math.random() * freeCells.length);
        const cell = freeCells[randomIndex];
        const cellElement = document.getElementById(cell);
        cellElement.innerText = turn;
        freeCells.splice(randomIndex, 1);
        player2cells.push(cell);
        cellElement.classList.add("player2");
        // Po každém tahu počítače přidejte kontrolu remízy:
        if (checkWin()) {
            playerWinner();
        } else if (freeCells.length === 0) {
            drawGame();
        } else {
            turn = player1;
        }
    }
}
function checkWin() {
    const winningCombinations = [
        ["cell0", "cell1", "cell2"],
        ["cell3", "cell4", "cell5"],
        ["cell6", "cell7", "cell8"],
        ["cell0", "cell3", "cell6"],
        ["cell1", "cell4", "cell7"],
        ["cell2", "cell5", "cell8"],
        ["cell0", "cell4", "cell8"],
        ["cell2", "cell4", "cell6"]
    ];

    for (const combination of winningCombinations) {
        if (player1cells.includes(combination[0]) && player1cells.includes(combination[1]) && player1cells.includes(combination[2])) {
            return true;
        }
        if (player2cells.includes(combination[0]) && player2cells.includes(combination[1]) && player2cells.includes(combination[2])) {
            return true;
        }
    }
    return false;
}
function playerWinner() {
    if(gamemode === "singleplayer") {
        if (turn === player1) {
            alert("Player 1 wins (X)!");
        } else {
            alert("Computer wins (O)!");
        }
    }
    else if(gamemode === "localMultiplayer") {
        if (turn === player1) {
            alert("Player 1 wins (X)!");
        } else {
            alert("Player 2 wins (O)!");
        }
    }
    resetGame();
}
function drawGame() {
    alert("Draw!");
    resetGame();
}
