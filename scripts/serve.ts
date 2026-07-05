import { createServer } from 'node:http';
import { githubApiTransport } from '../src/github/github-api-transport.js';
import { createInMemoryEpicCache } from '../src/service/in-memory-epic-cache.js';
import { routeServiceRequest } from '../src/service/route-service-request.js';

const DEFAULT_PORT = 8080;
const port = Number(process.env.PORT ?? DEFAULT_PORT);
const cache = createInMemoryEpicCache();
const transport = githubApiTransport(process.env.GITHUB_TOKEN);

const server = createServer((request, response) => {
  void (async () => {
    const result = await routeServiceRequest(
      { method: request.method, url: request.url },
      { transport, cache, nowIso: new Date().toISOString() },
    );
    response.writeHead(result.status, result.headers);
    response.end(result.body);
  })();
});

server.listen(port, () => {
  console.log(`git-epic image endpoint listening on http://localhost:${port}`);
});
