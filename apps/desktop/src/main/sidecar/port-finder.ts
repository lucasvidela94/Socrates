import * as net from "net";

export const findFreePort = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const addr = server.address();
      if (addr === null || typeof addr === "string") {
        reject(new Error("Could not determine port"));
        return;
      }
      const { port } = addr;
      server.close(() => resolve(port));
    });
  });
};
