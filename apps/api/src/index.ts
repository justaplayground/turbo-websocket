import { createHttpServerWithWebSocket } from "./server";
import { log } from "@repo/logger";

const port = process.env.PORT || 3001;
const { server } = createHttpServerWithWebSocket();

server.listen(port, () => {
  log(`api running on ${port}`);
  log(`WebSocket server ready for connections`);
});
