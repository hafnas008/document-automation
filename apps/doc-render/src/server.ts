// apps/doc-render/src/server.ts
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import { writeFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { timingSafeEqual } from 'node:crypto';

/** Per-process FIFO so only one LibreOffice render runs at a time.
 *  Spec Section 9: "Express queue (single-worker) for v1".
 *  If we later need parallelism, swap this for a Bull queue with workers. */
function makeRenderQueue() {
  let chain: Promise<unknown> = Promise.resolve();
  return <T>(fn: () => Promise<T>): Promise<T> => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => {});
    return next;
  };
}

export interface BuildOpts {
  secret: string;
  libreOfficeBin: string;
}

export function buildApp(opts: BuildOpts): Express {
  const app = express();
  app.use(express.raw({ type: '*/*', limit: '20mb' }));

  const renderQueue = makeRenderQueue();

  app.get('/health', (_req, res) => {
    res.json({ ok: true, libreOffice: Boolean(opts.libreOfficeBin) });
  });

  const expectedSecret = Buffer.from(opts.secret);
  const requireSecret = (req: Request, res: Response, next: NextFunction) => {
    const provided = Buffer.from(req.header('x-render-secret') ?? '');
    if (provided.length !== expectedSecret.length ||
        !timingSafeEqual(provided, expectedSecret)) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    next();
  };

  app.post('/xlsx-to-pdf', requireSecret, async (req: Request, res: Response) => {
    return renderQueue(async () => {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'empty body' });
      }
      let tmp: string | null = null;
      try {
        tmp = await mkdtemp(path.join(os.tmpdir(), 'docrender-'));
        const xlsxPath = path.join(tmp, 'in.xlsx');
        await writeFile(xlsxPath, req.body);

        await new Promise<void>((resolve, reject) => {
          const p = spawn(opts.libreOfficeBin, [
            '--headless', '--convert-to', 'pdf', '--outdir', tmp!, xlsxPath
          ], { signal: AbortSignal.timeout(60_000) });
          let stderr = '';
          p.stderr.on('data', d => { stderr += d.toString(); });
          p.on('exit', code => code === 0 ? resolve() : reject(new Error(`libreoffice exit ${code}: ${stderr}`)));
          p.on('error', reject);
        });

        const pdf = await readFile(path.join(tmp, 'in.pdf'));
        res.setHeader('content-type', 'application/pdf');
        res.send(pdf);
      } catch (e: any) {
        res.status(500).json({ error: e.message ?? 'render failed' });
      } finally {
        if (tmp) await rm(tmp, { recursive: true, force: true });
      }
    });
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.DOC_RENDER_PORT ?? 3017);
  const secret = process.env.DOC_RENDER_SECRET;
  if (!secret) {
    console.error('DOC_RENDER_SECRET is required');
    process.exit(1);
  }
  const libreOfficeBin = process.env.LIBREOFFICE_BIN ?? 'libreoffice';
  buildApp({ secret, libreOfficeBin }).listen(port, () => {
    console.log(`doc-render listening on :${port}`);
  });
}
