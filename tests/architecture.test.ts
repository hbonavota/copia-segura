/**
 * Regla de dependencia entre capas (ADR-0002, RNF-05):
 *   domain      → nada fuera de domain
 *   application → domain
 *   infrastructure → application, domain
 *   ui          → application, domain (nunca infrastructure: los adaptadores llegan por main.ts)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '..', 'src');
type Layer = 'domain' | 'application' | 'infrastructure' | 'ui';

const ALLOWED: Record<Layer, readonly Layer[]> = {
  domain: ['domain'],
  application: ['application', 'domain'],
  infrastructure: ['infrastructure', 'application', 'domain'],
  ui: ['ui', 'application', 'domain'],
};

/** Paquetes externos que cada capa puede importar. */
const ALLOWED_PACKAGES: Record<Layer, readonly string[]> = {
  domain: [],
  application: [],
  infrastructure: ['pdfjs-dist', 'pdf-lib', 'jszip'],
  ui: [],
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : [];
  });
}

function layerOf(file: string): Layer | null {
  const [first] = relative(SRC, file).split('/');
  return first === 'domain' ||
    first === 'application' ||
    first === 'infrastructure' ||
    first === 'ui'
    ? first
    : null;
}

function importsOf(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  const specifiers: string[] = [];
  const pattern =
    /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(pattern)) {
    const spec = match[1] ?? match[2] ?? match[3];
    if (spec) specifiers.push(spec);
  }
  return specifiers;
}

describe('arquitectura · regla de dependencia', () => {
  const files = walk(SRC).filter((f) => !f.endsWith('main.ts') && !f.endsWith('.d.ts'));

  it('encuentra las cuatro capas', () => {
    const layers = new Set(files.map(layerOf));
    expect([...layers].filter(Boolean).sort()).toEqual([
      'application',
      'domain',
      'infrastructure',
      'ui',
    ]);
  });

  it.each(files.map((f) => [relative(SRC, f), f] as const))(
    '%s solo importa capas permitidas',
    (_, file) => {
      const layer = layerOf(file);
      expect(layer).not.toBeNull();
      if (!layer) return;
      for (const spec of importsOf(file)) {
        if (spec.startsWith('.')) {
          const target = layerOf(resolve(file, '..', spec));
          expect(target, `${relative(SRC, file)} importa ${spec}`).not.toBeNull();
          if (target) expect(ALLOWED[layer], `${layer} → ${target} (${spec})`).toContain(target);
        } else if (!spec.startsWith('node:')) {
          const pkg = spec.startsWith('@')
            ? spec.split('/').slice(0, 2).join('/')
            : spec.split('/')[0];
          expect(ALLOWED_PACKAGES[layer], `${layer} importa el paquete ${spec}`).toContain(pkg);
        }
      }
    },
  );
});
