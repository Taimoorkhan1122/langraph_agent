import * as fs from 'fs';
import * as path from 'path';

describe('Weaviate Docker Compose (US-001)', () => {
  const composePath = path.join(process.cwd(), 'docker-compose.yml');

  it('should have a docker-compose.yml at project root', () => {
    expect(fs.existsSync(composePath)).toBe(true);
  });

  it('should define a Weaviate service with image, port 8080, env, and volumes', () => {
    const content = fs.readFileSync(composePath, 'utf8');
    expect(content).toContain('weaviate');
    expect(content).toMatch(/8080:8080|8080:\s*['"]?8080/);
    expect(content).toMatch(/image:\s*[\w./:-]+/);
    expect(content).toContain('environment');
    expect(content).toContain('volumes');
  });
});
