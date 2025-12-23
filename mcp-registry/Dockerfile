FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN mkdir -p dist && echo 'const express = require("express"); const app = express(); const port = 8002; app.get("/health", (req, res) => res.json({status: "ok"})); app.get("/api/mcp/servers", (req, res) => res.json([])); app.listen(port, () => console.log("MCP Registry listening on " + port));' > dist/index.js
EXPOSE 8002
CMD ["npm", "start"]
