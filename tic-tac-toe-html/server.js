const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

let rooms = {};

server.on('connection', (socket) => {
    socket.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'join') {
            const room = data.room;
            if (!rooms[room]) {
                rooms[room] = [];
            }
            rooms[room].push(socket);

            if (rooms[room].length === 2) {
                rooms[room].forEach((player, index) => {
                    player.send(JSON.stringify({ type: 'start', turn: index === 0 ? 'X' : 'O' }));
                });
            }
        }

        if (data.type === 'move') {
            const room = data.room;
            rooms[room].forEach((player) => {
                if (player !== socket) {
                    player.send(JSON.stringify({ type: 'move', cell: data.cell, turn: data.turn }));
                }
            });
        }
    });

    socket.on('close', () => {
        for (const room in rooms) {
            rooms[room] = rooms[room].filter((player) => player !== socket);
        }
    });
});

console.log('WebSocket server running on ws://localhost:8080');