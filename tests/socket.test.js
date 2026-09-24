import "dotenv/config";
import { createServer } from "http";
import { io as Client } from "socket.io-client";
import { setupSocket } from "../src/socket/socket.js";
import jwt from "jsonwebtoken";

describe("Socket.io Real-time Chat", () => {
  let io, senderSocket, receiverSocket;
  const PORT = 5005;

  beforeAll((done) => {
    const httpServer = createServer();
    setupSocket(httpServer);

    // Create two separate tokens for two different users
    const senderToken = jwt.sign(
      { id: "user_1_sender" },
      process.env.JWT_ACCESS_SECRET,
    );
    const receiverToken = jwt.sign(
      { id: "user_2_receiver" },
      process.env.JWT_ACCESS_SECRET,
    );

    httpServer.listen(PORT, () => {
      // Connect both clients
      senderSocket = Client(`http://localhost:${PORT}`, {
        auth: { token: senderToken },
      });
      receiverSocket = Client(`http://localhost:${PORT}`, {
        auth: { token: receiverToken },
      });

      let connectedCount = 0;
      const checkDone = () => {
        connectedCount++;
        if (connectedCount === 2) done();
      };

      senderSocket.on("connect", checkDone);
      receiverSocket.on("connect", checkDone);

      senderSocket.on("connect_error", (err) => done(err));
      receiverSocket.on("connect_error", (err) => done(err));
    });

    io = httpServer;
  });

  afterAll(() => {
    io.close();
    senderSocket.disconnect();
    receiverSocket.disconnect();
  });

  it("should broadcast typing_start to other users in the room", (done) => {
    const testRoom = "room_123";

    // 1. BOTH users join the same room
    senderSocket.emit("join_room", testRoom);
    receiverSocket.emit("join_room", testRoom);

    // 2. The RECEIVER listens for the typing event
    receiverSocket.on("typing_start", (data) => {
      expect(data.conversationId).toBe(testRoom);
      expect(data.userId).toBe("user_1_sender");
      done();
    });

    // 3. The SENDER emits the typing event (slight delay ensures both joined first)
    setTimeout(() => {
      senderSocket.emit("typing_start", testRoom);
    }, 100);
  });
});
