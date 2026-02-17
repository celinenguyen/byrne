import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const OUT_DIR = join(process.cwd(), 'public', 'decks');

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
  const manifest = [];

  for (const file of files) {
    const raw = await readFile(join(DATA_DIR, file), 'utf-8');
    const deck = JSON.parse(raw);

    if (deck.meta?.status !== 'published') continue;

    const slug = file.replace(/\.json$/, '');

    // Copy deck JSON to public/decks/
    await writeFile(join(OUT_DIR, `${slug}.json`), raw);

    manifest.push({
      id: deck.meta.id,
      title: deck.meta.title,
      filename: slug,
      updatedAt: deck.meta.updatedAt,
      slideCount: deck.slides?.length ?? 0,
      status: deck.meta.status,
      publishedAt: deck.meta.publishedAt,
    });
  }

  await writeFile(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Prepared ${manifest.length} published deck(s) in public/decks/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
