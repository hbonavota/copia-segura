import { en } from './en';
import { es, type MessageKey } from './es';

export type Locale = 'es' | 'en';
export type { MessageKey };

const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = { es, en };

/** Español si el idioma preferido del navegador es español; inglés en cualquier otro caso (RF-12). */
export function detectLocale(languages: readonly string[]): Locale {
  return languages[0]?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

/** Traduce `key` sustituyendo `{nombre}` por los valores indicados. */
export function translate(
  locale: Locale,
  key: MessageKey,
  params: Record<string, string | number> = {},
): string {
  const template = DICTIONARIES[locale][key];
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

export type Translator = (key: MessageKey, params?: Record<string, string | number>) => string;

export function translator(locale: Locale): Translator {
  return (key, params) => translate(locale, key, params);
}
