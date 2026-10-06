// Central place where we wire up Socket.IO event handlers for
// connections coming FROM the client (most of our real-time traffic
// is server -> client, but this is where client -> server events,
// like "join a room" or "request a manual refresh", would go).
function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = registerSocketHandlers;
