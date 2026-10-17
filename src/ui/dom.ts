/** Ayudas mínimas para construir DOM sin plantillas ni framework (ADR-0003). */

type Child = Node | string | number | null | undefined | false;

/** Propiedades asignables del elemento (sin métodos) más atajos de clase, datos y eventos. */
type Props<T extends HTMLElement> = {
  [K in keyof T as T[K] extends (...args: never[]) => unknown ? never : K]?: T[K];
} & {
  class?: string;
  dataset?: Record<string, string>;
  attrs?: Record<string, string>;
  on?: { [E in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[E]) => void };
};

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props<HTMLElementTagNameMap[K]> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  const { class: className, dataset, attrs, on, ...rest } = props;
  if (className) element.className = className;
  if (dataset) for (const [k, v] of Object.entries(dataset)) element.dataset[k] = v;
  if (attrs) for (const [k, v] of Object.entries(attrs)) element.setAttribute(k, v);
  if (on) {
    for (const [event, handler] of Object.entries(on)) {
      element.addEventListener(event, handler as EventListener);
    }
  }
  Object.assign(element, rest);
  append(element, children);
  return element;
}

export function append(parent: Node, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }
}

export function replaceChildren(parent: Element, ...children: Child[]): void {
  parent.replaceChildren();
  append(parent, children);
}

/** Icono SVG en línea (sin peticiones de red). `path` es el atributo `d`. */
export function icon(path: string, label?: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', label ? 'false' : 'true');
  if (label) {
    svg.setAttribute('role', 'img');
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = label;
    svg.appendChild(title);
  }
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', path);
  svg.appendChild(p);
  return svg;
}

export const ICONS = {
  rotateLeft: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5',
  rotateRight: 'M21 12a9 9 0 1 1-3-6.7M21 4v5h-5',
  undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  file: 'M14 3H6v18h12V7zM14 3v4h4',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z',
  download: 'M12 4v12m0 0 5-5m-5 5-5-5M4 20h16',
} as const;

/** Descarga un valor de `<input type="range">` o `number` como número finito. */
export function numberValue(input: HTMLInputElement, fallback: number): number {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}
