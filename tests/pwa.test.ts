import { describe, expect, it } from 'vitest';
import {
  cacheName,
  isStartPage,
  selectPrecache,
  selectWarmup,
  staleCaches,
  strategyFor,
} from '../src/pwa/rules';

const SCOPE = 'https://hbonavota.github.io/copia-segura/';
const req = (url: string, mode = 'cors', method = 'GET') => ({ url, mode, method });

describe('RF-36 · qué guarda el service worker', () => {
  const build = [
    'index.html',
    'theme.js',
    'sw.js',
    'manifest.webmanifest',
    'icons/icon-192.png',
    'ejemplo/tarjeta-ficticia.jpg',
    'ejemplo/documento-ficticio.pdf',
    'assets/index-CLVCVN9E.js',
    'assets/index-Vh8sJQMx.css',
    'assets/inter-latin-wght-normal-Dx4kXJAl.woff2',
    'assets/inter-cyrillic-wght-normal-DqGufNeO.woff2',
    'assets/pdf-ynNGvD1F.js',
    'assets/pdf.worker.min-Dkey6ZUl.mjs',
    'pdfjs/wasm/openjpeg.wasm',
  ];

  it('precarga solo lo necesario para abrir la app con fotos', () => {
    expect(selectPrecache(build)).toEqual([
      './',
      'assets/index-CLVCVN9E.js',
      'assets/index-Vh8sJQMx.css',
      'assets/inter-latin-wght-normal-Dx4kXJAl.woff2',
      'ejemplo/tarjeta-ficticia.jpg',
      'icons/icon-192.png',
      'manifest.webmanifest',
      'theme.js',
    ]);
  });

  it('pdf.js, el PDF de ejemplo y las fuentes de otros alfabetos se guardan al usarlos', () => {
    const pre = selectPrecache(build);
    for (const lazy of [
      'assets/pdf-ynNGvD1F.js',
      'assets/pdf.worker.min-Dkey6ZUl.mjs',
      'pdfjs/wasm/openjpeg.wasm',
      'ejemplo/documento-ficticio.pdf',
      'assets/inter-cyrillic-wght-normal-DqGufNeO.woff2',
      'sw.js',
    ]) {
      expect(pre).not.toContain(lazy);
    }
  });
});

describe('RF-36 · segundo plano tras abrir el primer documento', () => {
  const build = [
    'index.html',
    'sw.js',
    'theme.js',
    'assets/index-A1.js',
    'assets/index-A1.js.map',
    'assets/pdf-B2.js',
    'assets/es-C3.js',
    'pdfjs/wasm/openjpeg.wasm',
    'ejemplo/documento-ficticio.pdf',
  ];

  it('guarda el resto de la app, sin repetir lo precargado, ni mapas, ni sw.js', () => {
    expect(selectWarmup(build)).toEqual([
      'assets/es-C3.js',
      'assets/pdf-B2.js',
      'ejemplo/documento-ficticio.pdf',
      'pdfjs/wasm/openjpeg.wasm',
    ]);
  });
});

describe('RF-36 · portada guardada para abrir sin conexión', () => {
  const html = { status: 200, redirected: false, contentType: 'text/html; charset=utf-8' };

  it('solo HTML de la propia portada', () => {
    expect(isStartPage(SCOPE, SCOPE, html)).toBe(true);
    expect(isStartPage(`${SCOPE}index.html`, SCOPE, html)).toBe(true);
    expect(isStartPage(`${SCOPE}?v=2`, SCOPE, html)).toBe(true);
  });

  it('nunca otra cosa que se abra en una pestaña: una imagen, el manifest, un 404', () => {
    expect(
      isStartPage(`${SCOPE}ejemplo/tarjeta-ficticia.jpg`, SCOPE, {
        ...html,
        contentType: 'image/jpeg',
      }),
    ).toBe(false);
    expect(isStartPage(SCOPE, SCOPE, { ...html, contentType: 'application/manifest+json' })).toBe(
      false,
    );
    expect(isStartPage(`${SCOPE}otra.html`, SCOPE, html)).toBe(false);
    expect(isStartPage(SCOPE, SCOPE, { ...html, status: 404 })).toBe(false);
    expect(isStartPage(SCOPE, SCOPE, { ...html, redirected: true })).toBe(false);
  });
});

describe('RF-36 · qué peticiones atiende', () => {
  it('páginas: primero la red, para estrenar cada versión publicada', () => {
    expect(strategyFor(req(SCOPE, 'navigate'), SCOPE)).toBe('network-first');
  });

  it('recursos de la app: primero la caché', () => {
    expect(strategyFor(req(`${SCOPE}assets/index-CLVCVN9E.js`), SCOPE)).toBe('cache-first');
  });

  it('no toca otros dominios, otras rutas del mismo dominio, ni nada que no sea GET', () => {
    expect(strategyFor(req('https://example.com/x.js'), SCOPE)).toBe('ignore');
    expect(strategyFor(req('https://hbonavota.github.io/otro-proyecto/x.js'), SCOPE)).toBe(
      'ignore',
    );
    expect(strategyFor(req(`${SCOPE}assets/x.js`, 'cors', 'POST'), SCOPE)).toBe('ignore');
    expect(strategyFor(req('blob:https://hbonavota.github.io/1234'), SCOPE)).toBe('ignore');
  });

  it('nunca sirve su propio script desde la caché', () => {
    expect(strategyFor(req(`${SCOPE}sw.js`), SCOPE)).toBe('ignore');
  });
});

describe('RF-36 · versiones', () => {
  it('al activar una versión borra solo las cachés anteriores de la app', () => {
    const current = cacheName('bbb');
    expect(
      staleCaches(['copia-segura-aaa', current, 'otra-app-cache', 'copia-segura-zzz'], current),
    ).toEqual(['copia-segura-aaa', 'copia-segura-zzz']);
  });
});
