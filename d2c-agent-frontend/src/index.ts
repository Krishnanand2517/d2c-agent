import { serve } from "bun";
import index from "./index.html";

const API_TARGET = "https://d2c-agent.onrender.com";

const server = serve({
  port: 5173,

  routes: {
    // Proxy all /api requests
    "/api/*": async (req) => {
      const url = new URL(req.url);

      const proxyUrl = API_TARGET + url.pathname + url.search;

      return fetch(proxyUrl, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
    },

    // Serve index.html for all unmatched routes.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
