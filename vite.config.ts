import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// 개발 전용: 브라우저에서 캔버스 스냅샷/녹화 파일을 POST하면 ./captures 에 저장
function captureSink(): Plugin {
  return {
    name: 'capture-sink',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__capture', (req, res) => {
        const name = String(new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? `cap_${Date.now()}.png`).replace(/[^\w.-]/g, '_');
        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          const dir = path.resolve(__dirname, 'captures');
          fs.mkdirSync(dir, { recursive: true });
          const u = new URL(req.url ?? '', 'http://x');
          if (u.searchParams.has('append')) fs.appendFileSync(path.join(dir, name), Buffer.concat(chunks));
          else fs.writeFileSync(path.join(dir, name), Buffer.concat(chunks));
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig({
  base: './',
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
  plugins: [captureSink()],
});
