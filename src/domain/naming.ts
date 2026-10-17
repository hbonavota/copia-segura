/** Nombres de archivo de salida (RF-10): `<nombre>-<etiqueta>-copia-segura.<ext>`. */

const SUFFIX = 'copia-segura';

/** Nombre base de un archivo sin extensión ni caracteres problemáticos. */
export function baseName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^.]+$/, '');
  const cleaned = withoutExt
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return cleaned.length > 0 ? cleaned : 'documento';
}

export function outputFileName(
  sourceName: string,
  label: string | null,
  ext: 'jpg' | 'pdf' | 'zip',
): string {
  const parts = [sourceName, label, SUFFIX].filter((p): p is string => !!p && p.length > 0);
  return `${parts.join('-')}.${ext}`;
}

/** Etiqueta `p1`, `p2`… para páginas de PDF; `foto-1`… para imágenes; `camara-1`… para capturas. */
export function pageLabel(kind: 'pdf' | 'image' | 'camera', index: number): string {
  switch (kind) {
    case 'pdf':
      return `p${index}`;
    case 'image':
      return `foto-${index}`;
    case 'camera':
      return `camara-${index}`;
  }
}
