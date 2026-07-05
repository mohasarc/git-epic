import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const flyConfig = readFileSync('fly.toml', 'utf8');
const dockerfile = readFileSync('Dockerfile', 'utf8');

describe('fly deploy config', () => {
  it('pins a single always-running instance', () => {
    expect(flyConfig).toMatch(/min_machines_running\s*=\s*1/);
    expect(flyConfig).toMatch(/auto_stop_machines\s*=\s*false/);
  });

  it('declares no horizontal autoscale', () => {
    expect(flyConfig).not.toMatch(/max_machines_running/);
    expect(flyConfig).not.toMatch(/\[http_service\.concurrency\]/);
  });

  it('routes to the port the server listens on', () => {
    expect(flyConfig).toMatch(/internal_port\s*=\s*8080/);
    expect(dockerfile).toMatch(/PORT=8080/);
  });

  it('boots the server through the start script', () => {
    expect(dockerfile).toMatch(/CMD \["pnpm", "start"\]/);
  });
});
