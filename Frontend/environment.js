let IS_PROD = true;
const server = IS_PROD
  ? "http://localhost:5002"
  : "http://localhost:5173";

export default server;
