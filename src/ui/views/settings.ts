import {
  NAMED_COLORS,
  PRESETS,
  STYLE_LIMITS,
  TEMPLATE_IDS,
  parseHexColor,
  toHexColor,
  type NormalizedRect,
  type PresetName,
  type Redaction,
  type WatermarkStyle,
} from '../../domain';
import type { View } from '../context';
import type { MessageKey } from '../i18n';
import { h, numberValue, replaceChildren } from '../dom';
import { actions, currentStyle, viewToPage } from '../store';

const MAX_SIDES = [800, 1000, 1200, 1600, 2000] as const;
const SUGGESTIONS = [1, 2, 3, 4, 5] as const;

/** Franjas de un toque, en coordenadas de la vista previa (RF-06, RNF-04). */
const STRIP = 0.15;
const STRIPS: Record<'top' | 'bottom' | 'left' | 'right', NormalizedRect> = {
  top: { x: 0, y: 0, w: 1, h: STRIP },
  bottom: { x: 0, y: 1 - STRIP, w: 1, h: STRIP },
  left: { x: 0, y: 0, w: STRIP, h: 1 },
  right: { x: 1 - STRIP, y: 0, w: STRIP, h: 1 },
};

/**
 * Panel de ajustes (RF-24): marca de agua con sugerencias (RF-07, RF-26), intensidad como control
 * segmentado (RF-21), tapar datos (RF-06, RF-16, RF-28) y salida (RF-08, RF-15).
 */
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

  const suggestions = h(
    'div',
    { class: 'chips', attrs: { role: 'group', 'aria-label': t('mark.suggestions') } },
    ...SUGGESTIONS.map((n) =>
      h(
        'button',
        {
          type: 'button',
          class: 'chip',
          dataset: { testid: `suggest-${n}` },
          on: {
            click: () => {
              const purpose = t(`mark.suggest.${n}`);
              store.update(actions.setText({ purpose }));
              const input = root.querySelector<HTMLInputElement>('[data-testid="text-purpose"]');
              if (input) input.value = purpose;
            },
          },
        },
        t(`mark.suggest.${n}`),
      ),
    ),
  );

  // --------------------------------------------------------------------------- intensidad
  /** Una opción de un control segmentado: radio nativo (teclado y lector de pantalla gratis). */
  const segment = (
    group: string,
    value: string,
    checked: boolean,
    testid: string,
    onChange: () => void,
    ...content: (Node | string)[]
  ): HTMLLabelElement =>
    h(
      'label',
      { class: 'segment' },
      h('input', {
        type: 'radio',
        name: group,
        value,
        checked,
        class: 'segment-input',
        dataset: { testid },
        on: { change: onChange },
      }),
      ...content,
    );
  const presetOption = (name: PresetName): HTMLLabelElement =>
    segment(
      'preset',
      name,
      state.preset === name,
      `preset-${name}`,
      () => store.update(actions.setPreset(name)),
      h(
        'span',
        { class: `sample sample-${name}`, attrs: { 'aria-hidden': 'true' } },
        t('mark.sample'),
      ),
      h(
        'span',
        { class: 'segment-text' },
        h('span', { class: 'segment-name' }, t(`mark.preset.${name}`)),
        h('span', { class: 'segment-help' }, t(`mark.preset.${name}.help`)),
      ),
    );

  // --------------------------------------------------------------------------- tapar datos
  const redactionHelp = h('p', { class: 'muted small', dataset: { testid: 'redaction-help' } });
  const redactionOption = (kind: Redaction): HTMLLabelElement =>
    segment(
      'redaction',
      kind,
      (state.output.redaction ?? 'solid') === kind,
      `redaction-${kind}`,
      () => store.update(actions.setOutput({ redaction: kind })),
      h('span', { class: `swatch swatch-${kind}`, attrs: { 'aria-hidden': 'true' } }),
      h('span', { class: 'segment-name' }, t(`redact.${kind}`)),
    );
  const stripButtons = (Object.keys(STRIPS) as (keyof typeof STRIPS)[]).map((side) =>
    h(
      'button',
      {
        type: 'button',
        class: 'button small',
        dataset: { testid: `strip-${side}` },
        on: { click: () => store.update(actions.addMask(viewToPage(store.get(), STRIPS[side]))) },
      },
      t(`tool.strip.${side}`),
    ),
  );
  const templateSelect = h(
    'select',
    { dataset: { testid: 'template' }, attrs: { 'aria-label': t('template.label') } },
    ...TEMPLATE_IDS.map((id) => h('option', { value: id }, t(`template.${id}`))),
  );
  const templateButton = h(
    'button',
    {
      type: 'button',
      class: 'button small',
      dataset: { testid: 'apply-template' },
      on: {
        click: () => {
          const id = TEMPLATE_IDS.find((x) => x === templateSelect.value);
          if (id) store.update(actions.applyTemplate(id));
        },
      },
    },
    t('template.apply'),
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

  const section = (title: string, ...children: (Node | string | null)[]): HTMLElement =>
    h(
      'details',
      { class: 'panel-section', open: true },
      h('summary', { class: 'panel-title' }, title),
      h('div', { class: 'panel-body' }, ...children),
    );

  replaceChildren(
    root,
    section(
      t('mark.title'),
      textField('freeText', 'mark.freeText'),
      textField('recipient', 'mark.recipient', 'mark.recipient.placeholder'),
      textField('purpose', 'mark.purpose', 'mark.purpose.placeholder'),
      suggestions,
      h('label', { class: 'check switch' }, includeDate, h('span', {}, t('mark.includeDate'))),
      h(
        'div',
        { class: 'composed-card' },
        h('span', { class: 'composed-label' }, t('mark.preview')),
        composed,
      ),
      h('p', { class: 'field-label' }, t('mark.preset')),
      h(
        'div',
        { class: 'segmented', attrs: { role: 'radiogroup', 'aria-label': t('mark.preset') } },
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
        h('label', { class: 'check switch' }, outline, h('span', {}, t('mark.outline'))),
        resetButton,
      ),
    ),
    section(
      t('redact.title'),
      h('p', { class: 'field-label' }, t('redact.style')),
      h(
        'div',
        {
          class: 'segmented compact',
          attrs: { role: 'radiogroup', 'aria-label': t('redact.style') },
        },
        redactionOption('solid'),
        redactionOption('pixelate'),
      ),
      redactionHelp,
      h('p', { class: 'field-label' }, t('template.label')),
      h('div', { class: 'templates' }, templateSelect, templateButton),
      h('p', { class: 'muted small' }, t('template.help')),
      h('p', { class: 'field-label' }, t('tool.strips')),
      h('div', { class: 'strips' }, ...stripButtons),
    ),
    section(
      t('output.title'),
      h('label', { class: 'field inline' }, h('span', {}, t('output.maxSide')), maxSide),
      h('p', { class: 'muted small' }, t('output.maxSide.help')),
      h('label', { class: 'check switch' }, grayscale, h('span', {}, t('output.grayscale'))),
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
  const syncPreset = (): void => {
    for (const input of root.querySelectorAll<HTMLInputElement>('input[name="preset"]')) {
      input.checked = input.value === store.get().preset;
    }
  };
  const syncText = (): void => {
    composed.textContent = deps.renderPage.watermarkText(store.get().text) || '—';
  };
  const syncOutput = (): void => {
    const redaction = store.get().output.redaction ?? 'solid';
    redactionHelp.textContent = t(`redact.help.${redaction}`);
    for (const input of root.querySelectorAll<HTMLInputElement>('input[name="redaction"]')) {
      input.checked = input.value === redaction;
    }
    grayscale.checked = store.get().output.grayscale ?? false;
    qualityValue.textContent = `${Math.round(store.get().output.jpegQuality * 100)} %`;
  };
  syncStyle();
  syncText();
  syncOutput();

  const stop = [
    store.select((s) => s.preset, syncStyle),
    store.select((s) => s.preset, syncPreset),
    store.select((s) => s.overrides, syncStyle),
    store.select((s) => s.text, syncText),
    store.select((s) => s.output, syncOutput),
  ];
  return () => stop.forEach((fn) => fn());
};
