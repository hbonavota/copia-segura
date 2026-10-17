import {
  NAMED_COLORS,
  PRESETS,
  STYLE_LIMITS,
  parseHexColor,
  toHexColor,
  type PresetName,
  type WatermarkStyle,
} from '../../domain';
import type { View } from '../context';
import type { MessageKey } from '../i18n';
import { h, numberValue, replaceChildren } from '../dom';
import { actions, currentStyle } from '../store';

const MAX_SIDES = [800, 1000, 1200, 1600, 2000] as const;

/** Panel de ajustes: texto de la marca, intensidad, ajuste fino y salida (RF-07, RF-08). */
export const settings: View = (root, { store, deps, t }) => {
  const state = store.get();

  // --------------------------------------------------------------------------- texto
  const textField = (
    key: 'freeText' | 'recipient' | 'purpose',
    label: MessageKey,
    placeholder?: MessageKey,
  ): HTMLLabelElement =>
    h(
      'label',
      { class: 'field' },
      h('span', {}, t(label)),
      h('input', {
        type: 'text',
        value: state.text[key],
        placeholder: placeholder ? t(placeholder) : '',
        dataset: { testid: `text-${key}` },
        autocomplete: 'off',
        on: {
          input: (event) =>
            store.update(
              actions.setText({ [key]: (event.currentTarget as HTMLInputElement).value }),
            ),
        },
      }),
    );
  const includeDate = h('input', {
    type: 'checkbox',
    checked: state.text.includeDate,
    dataset: { testid: 'include-date' },
    on: {
      change: (event) =>
        store.update(
          actions.setText({ includeDate: (event.currentTarget as HTMLInputElement).checked }),
        ),
    },
  });
  const composed = h('output', { class: 'composed', dataset: { testid: 'composed-text' } });

  // --------------------------------------------------------------------------- preset
  const presetOption = (name: PresetName): HTMLLabelElement =>
    h(
      'label',
      { class: 'preset' },
      h('input', {
        type: 'radio',
        name: 'preset',
        value: name,
        checked: state.preset === name,
        dataset: { testid: `preset-${name}` },
        on: { change: () => store.update(actions.setPreset(name)) },
      }),
      h('span', { class: 'preset-name' }, t(`mark.preset.${name}`)),
      h('span', { class: 'muted' }, t(`mark.preset.${name}.help`)),
    );

  // --------------------------------------------------------------------------- ajuste fino
  const range = (
    key: 'opacity' | 'sizePct' | 'spacing' | 'angleDeg',
    label: MessageKey,
    step: number,
    format: (v: number) => string,
  ): { row: HTMLElement; sync: (style: WatermarkStyle) => void } => {
    const limits = STYLE_LIMITS[key];
    const value = h('output', {});
    const input = h('input', {
      type: 'range',
      min: String(limits.min),
      max: String(limits.max),
      step: String(step),
      dataset: { testid: `range-${key}` },
      on: {
        input: (event) => {
          const el = event.currentTarget as HTMLInputElement;
          store.update(actions.setOverride(key, numberValue(el, PRESETS.normal[key])));
        },
      },
    });
    const row = h('label', { class: 'field range' }, h('span', {}, t(label)), input, value);
    return {
      row,
      sync: (style) => {
        input.value = String(style[key]);
        value.textContent = format(style[key]);
      },
    };
  };
  const ranges = [
    range('opacity', 'mark.opacity', 1, (v) => `${Math.round(v)} %`),
    range('sizePct', 'mark.size', 0.5, (v) => `${v.toFixed(1)} %`),
    range('spacing', 'mark.spacing', 0.1, (v) => `×${v.toFixed(1)}`),
    range('angleDeg', 'mark.angle', 5, (v) => `${Math.round(v)}°`),
  ];

  const colorNames = Object.keys(NAMED_COLORS) as (keyof typeof NAMED_COLORS)[];
  const colorPicker = h('input', {
    type: 'color',
    dataset: { testid: 'color-custom' },
    attrs: { 'aria-label': t('mark.color.custom') },
    on: {
      input: (event) => {
        const rgb = parseHexColor((event.currentTarget as HTMLInputElement).value);
        if (rgb) store.update(actions.setOverride('color', rgb));
      },
    },
  });
  const colorSelect = h(
    'select',
    {
      dataset: { testid: 'color' },
      on: {
        change: (event) => {
          const value = (event.currentTarget as HTMLSelectElement).value;
          const named = colorNames.find((n) => n === value);
          if (named) store.update(actions.setOverride('color', NAMED_COLORS[named]));
          else colorPicker.click(); // "Otro…": abre el selector de color del navegador
        },
      },
    },
    ...colorNames.map((name) => h('option', { value: name }, t(`mark.color.${name}`))),
    h('option', { value: 'custom' }, t('mark.color.custom')),
  );
  const outline = h('input', {
    type: 'checkbox',
    dataset: { testid: 'outline' },
    on: {
      change: (event) =>
        store.update(
          actions.setOverride('outline', (event.currentTarget as HTMLInputElement).checked),
        ),
    },
  });
  const resetButton = h(
    'button',
    {
      type: 'button',
      class: 'link-button',
      on: { click: () => store.update(actions.resetOverrides()) },
    },
    t('mark.reset'),
  );

  // --------------------------------------------------------------------------- salida
  const maxSide = h(
    'select',
    {
      dataset: { testid: 'max-side' },
      on: {
        change: (event) =>
          store.update(
            actions.setOutput({
              maxSide: numberValue(event.currentTarget as HTMLInputElement, 1200),
            }),
          ),
      },
    },
    ...MAX_SIDES.map((px) =>
      h('option', { value: String(px), selected: px === state.output.maxSide }, `${px} px`),
    ),
  );
  const grayscale = h('input', {
    type: 'checkbox',
    checked: state.output.grayscale ?? false,
    dataset: { testid: 'grayscale' },
    on: {
      change: (event) =>
        store.update(
          actions.setOutput({ grayscale: (event.currentTarget as HTMLInputElement).checked }),
        ),
    },
  });
  const qualityValue = h('output', {});
  const quality = h('input', {
    type: 'range',
    min: '0.5',
    max: '0.95',
    step: '0.01',
    value: String(state.output.jpegQuality),
    dataset: { testid: 'quality' },
    on: {
      input: (event) =>
        store.update(
          actions.setOutput({
            jpegQuality: numberValue(event.currentTarget as HTMLInputElement, 0.82),
          }),
        ),
    },
  });

  replaceChildren(
    root,
    h(
      'section',
      { class: 'panel-section' },
      h('h2', { class: 'panel-title' }, t('mark.title')),
      textField('freeText', 'mark.freeText'),
      textField('recipient', 'mark.recipient', 'mark.recipient.placeholder'),
      textField('purpose', 'mark.purpose', 'mark.purpose.placeholder'),
      h('label', { class: 'check' }, includeDate, h('span', {}, t('mark.includeDate'))),
      h(
        'p',
        { class: 'composed-wrap' },
        h('span', { class: 'muted' }, t('mark.preview')),
        composed,
      ),
    ),
    h(
      'section',
      { class: 'panel-section' },
      h('h2', { class: 'panel-title' }, t('mark.preset')),
      h(
        'div',
        { class: 'presets', attrs: { role: 'radiogroup' } },
        presetOption('normal'),
        presetOption('suave'),
      ),
      h(
        'details',
        { class: 'advanced' },
        h('summary', {}, t('mark.advanced')),
        ...ranges.map((r) => r.row),
        h(
          'label',
          { class: 'field inline' },
          h('span', {}, t('mark.color')),
          colorSelect,
          colorPicker,
        ),
        h('label', { class: 'check' }, outline, h('span', {}, t('mark.outline'))),
        resetButton,
      ),
    ),
    h(
      'section',
      { class: 'panel-section' },
      h('h2', { class: 'panel-title' }, t('output.title')),
      h('label', { class: 'field inline' }, h('span', {}, t('output.maxSide')), maxSide),
      h('p', { class: 'muted small' }, t('output.maxSide.help')),
      h('label', { class: 'check' }, grayscale, h('span', {}, t('output.grayscale'))),
      h('p', { class: 'muted small' }, t('output.grayscale.help')),
      h(
        'label',
        { class: 'field range' },
        h('span', {}, t('output.quality')),
        quality,
        qualityValue,
      ),
    ),
  );

  const syncStyle = (): void => {
    const style = currentStyle(store.get());
    ranges.forEach((r) => r.sync(style));
    const hex = toHexColor(style.color);
    const named = colorNames.find((n) => toHexColor(NAMED_COLORS[n]) === hex);
    colorSelect.value = named ?? 'custom';
    colorPicker.value = hex;
    outline.checked = style.outline;
    resetButton.hidden = Object.keys(store.get().overrides).length === 0;
  };
  const syncText = (): void => {
    composed.textContent = deps.renderPage.watermarkText(store.get().text) || '—';
  };
  const syncOutput = (): void => {
    grayscale.checked = store.get().output.grayscale ?? false;
    qualityValue.textContent = `${Math.round(store.get().output.jpegQuality * 100)} %`;
  };
  syncStyle();
  syncText();
  syncOutput();

  const stop = [
    store.select((s) => s.preset, syncStyle),
    store.select((s) => s.overrides, syncStyle),
    store.select((s) => s.text, syncText),
    store.select((s) => s.output, syncOutput),
  ];
  return () => stop.forEach((fn) => fn());
};
