import Redis from "ioredis";

let redisClient;
try {
  redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redisClient.on("error", (err) => {
    console.error("❌ Redis connection error:", err.message);
  });
} catch (err) {
  console.error("❌ Redis initialization failed:", err.message);
}
export default redisClient;
