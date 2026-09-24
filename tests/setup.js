import { jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;
// // Mock the BullMQ queues and Redis so tests don't hang trying to connect to Upstash
// jest.unstable_mockModule("../src/queue/queues.js", () => ({
//   emailQueue: {
//     add: jest.fn(),
//   },
//   digestQueue: {
//     add: jest.fn(),
//   },
// }));
jest.unstable_mockModule("../src/queue/connection.js", () => ({
  connection: {
    get: jest.fn(),
    setex: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  },
}));

// Spin up the in-memory database before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000);

// Clear all data between tests to ensure perfect isolation
afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  }
});

// Drop the database and close connections when tests are done
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 60000);
