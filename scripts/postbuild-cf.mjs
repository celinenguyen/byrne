import { rm } from 'fs/promises';
import { join } from 'path';

const CLIENT_DIR = join(process.cwd(), 'dist', 'client');

/**
 * Clean up two things the static Cloudflare build leaves behind.
 *
 * 1. `api/` — the deck endpoints read from `data/` on the filesystem, which
 *    doesn't exist in the build sandbox. Astro prerenders every endpoint in a
 *    static build, so each one gets written out as a 200 whose body is the
 *    caught error ("no such file or directory, readdir '/bundle/data'").
 *    Vercel serves a plain 404 at these paths today, and a 200 containing a
 *    build-sandbox path is both a behavior change and a small information
 *    leak. Deleting the files restores the 404.
 *
 *    This step is temporary: phase 3 replaces these routes with R2-backed
 *    ones that run on demand and belong in the deployed build. Delete this
 *    script then.
 *
 * 2. `.DS_Store` — copied out of `public/` by the asset pipeline.
 */
async function main() {
  for (const path of ['api', '.DS_Store']) {
    await rm(join(CLIENT_DIR, path), { recursive: true, force: true });
  }
  console.log('Removed prerendered api/ and .DS_Store from dist/client/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
