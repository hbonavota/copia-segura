import type { MessageKey } from './es';

export const en: Record<MessageKey, string> = {
  'app.title': 'copia segura',
  'app.tagline': 'Your documents, only for whoever you choose.',
  'app.local': 'Everything happens in your browser. Your document is never sent anywhere.',
  'app.language': 'Language',
  'app.theme.dark': 'Dark mode',

  'drop.title': 'Drop your document here',
  'drop.hint': 'Single or multi-page PDF, or photos (JPG, PNG, WebP).',
  'drop.choose': 'Choose files',
  'drop.camera': 'Use the camera',
  'drop.example': 'See how it works with a sample ID',

  'pages.title': 'Pages',
  'pages.add': 'Add',
  'pages.camera': 'Camera',
  'pages.remove': 'Remove page',
  'pages.autocrop': 'Automatically cropped to the image inside the PDF',

  'tool.mask': 'Redact',
  'tool.crop': 'Crop',
  'tool.rotateLeft': 'Rotate left',
  'tool.rotateRight': 'Rotate right',
  'tool.undo': 'Undo last area',
  'tool.clearMasks': 'Remove all areas',
  'tool.clearCrop': 'Remove crop',
  'tool.hint.mask':
    "Draw a rectangle over what the recipient doesn't need. Drag an area to move it, or its corner to resize it; with the keyboard: arrows to move, Alt + arrows to resize, Delete to remove it.",
  'tool.hint.crop': 'Draw the rectangle you want to keep. Nothing outside it is exported.',
  'tool.strips': 'Redact a strip',
  'tool.strip.top': 'Top',
  'tool.strip.bottom': 'Bottom',
  'tool.strip.left': 'Left',
  'tool.strip.right': 'Right',
  'editor.preview': 'Preview of the copy that will be exported',
  'editor.rendering': 'Preparing the preview…',

  'mark.title': 'Watermark',
  'mark.freeText': 'Text',
  'mark.recipient': 'Who is it for?',
  'mark.recipient.placeholder': 'e.g. company name',
  'mark.purpose': 'What is it for?',
  'mark.purpose.placeholder': 'e.g. opening an account',
  'mark.includeDate': "Add today's date",
  'mark.preview': 'Watermark preview',
  'mark.preset': 'Intensity',
  'mark.preset.normal': 'Visible',
  'mark.preset.normal.help': 'Recommended',
  'mark.preset.suave': 'Discreet',
  'mark.preset.suave.help': 'If it gets rejected',
  'mark.advanced': 'Fine tuning',
  'mark.opacity': 'Opacity',
  'mark.size': 'Text size',
  'mark.spacing': 'Spacing',
  'mark.angle': 'Angle',
  'mark.color': 'Colour',
  'mark.color.rojo': 'Red',
  'mark.color.gris': 'Grey',
  'mark.color.negro': 'Black',
  'mark.color.azul': 'Blue',
  'mark.color.custom': 'Other…',
  'mark.outline': 'White outline',
  'mark.reset': 'Back to preset',

  'output.title': 'Output',
  'output.maxSide': 'Longest side',
  'output.maxSide.help': 'Enough to be legible; not enough to forge.',
  'output.quality': 'JPEG quality',

  'export.jpg': 'Download copy',
  'export.zip': 'ZIP',
  'export.pdf': 'PDF',
  'export.working': 'Generating…',
  'export.done': 'Copy ready: {files}. Nothing left your device.',
  'export.none': 'Add at least one page to export.',

  'camera.title': 'Take a photo holding your document',
  'camera.help':
    'Face the light, hold the document next to your face and tilt it slightly to avoid glare. The photo is saved un-mirrored: the text will read correctly.',
  'camera.shoot': 'Take photo',
  'camera.cancel': 'Cancel',
  'camera.starting': 'Starting the camera…',
  'camera.error.denied':
    'The browser did not grant camera access. Allow it from the address bar, or pick a photo from disk.',
  'camera.error.unavailable': 'No camera was found. Pick a photo from disk.',
  'camera.error.unknown': 'The camera could not be used: {message}',

  'import.error.encrypted':
    '{file}: the PDF is password-protected. Remove the password or export the pages as images.',
  'import.error.corrupt': '{file}: the file is not a valid PDF.',
  'import.error.unsupported':
    '{file}: the browser cannot open this format. Convert it to JPG or PNG (on iPhone: Settings › Camera › Formats › Most Compatible).',
  'import.error.unknown': '{file}: could not be opened ({message}).',
  'import.error.example':
    'The sample document could not be loaded. If you are offline, try a photo from disk instead.',
  'import.working': 'Opening {n} file(s)…',
  'import.done': '{n} page(s) added.',
  'import.autocrop':
    'Automatically cropped to the image found inside the PDF. You can remove the crop in the editor.',

  'about.title': 'What a watermark does and does not do',
  'about.does.title': 'What it achieves',
  'about.does.1':
    'It records who you gave the copy to, for what and when. If it shows up elsewhere, its origin is known.',
  'about.does.2':
    'It makes reuse expensive: a dense mark crossing the photo, number and signature does not come off with one click.',
  'about.does.3':
    'Together with redacting what the recipient does not need and lowering the resolution, it limits what a third party can do with it.',
  'about.doesnt.title': 'What it does not achieve',
  'about.doesnt.1':
    'It does not stop someone from using it. Inpainting tools can try to erase it; the denser it is and the more it crosses the data, the worse the result, but it is not impossible.',
  'about.doesnt.2':
    'It does not know who you are sending it to. A request for an ID photo together with an ownership change is exactly the material of a SIM-swap fraud: use only the official app, website or email, never the WhatsApp of "an agent".',
  'about.privacy.title': 'About this tool',
  'about.privacy.1':
    'There is no server. The document is processed in your browser and stored nowhere: close the tab and it is gone.',
  'about.privacy.2':
    'The page cannot make requests to other domains (its security policy forbids it) and the code is open source. You can verify it in the Network tab of the developer tools.',

  'demo.recipient': 'EXAMPLE CO.',
  'demo.purpose': 'account opening',
  'demo.title': 'What a copy looks like, step by step (fictional ID)',
  'demo.alt': 'Fictional card processed by copia segura',
  'demo.tab.original': 'Original',
  'demo.tab.masked': 'Redacted',
  'demo.tab.marked': 'Watermark',
  'demo.tab.gray': 'B/W',
  'demo.caption.original': 'The photo as is: every detail visible.',
  'demo.caption.masked': 'Signature, document number and barcode covered with opaque black.',
  'demo.caption.marked': 'A mark with recipient, purpose and date crossing the whole document.',
  'demo.caption.gray':
    'In black and white the copy is even less useful for forgery; the mark stays in colour.',

  'template.label': 'Typical areas',
  'template.apply': 'Apply',
  'template.help': 'Approximate: crop to the card first and check them.',
  'template.dni-es-frente': 'Spanish DNI · front',
  'template.dni-es-dorso': 'Spanish DNI · back',
  'template.dni-ar-frente': 'Argentine DNI · front',
  'template.dni-ar-dorso': 'Argentine DNI · back',

  'output.grayscale': 'Black and white',
  'output.grayscale.help': 'The document in greyscale; the watermark keeps its colour.',

  'export.share': 'Share',
  'export.shared': 'Copy shared: {files}. It was generated on your device.',
  'export.share.retry': 'Your copies are ready. Tap Share again to open the menu.',
  'export.share.failed': 'This browser could not open the share menu. Use Download instead.',
  'export.failed': 'The copy could not be generated ({message}). Try a smaller longest side.',

  'verify.title': 'Check it yourself',
  'verify.lead': 'You do not have to trust what this page says. You can verify it in a minute:',
  'verify.step.1':
    'Open the browser developer tools (F12 or Cmd+Option+I), Network tab, and prepare a copy: there is no request to any other domain. No analytics, no external fonts, no server.',
  'verify.step.2':
    'Look at the page source: its Content-Security-Policy stops the page from fetching data or loading resources from any other site, even if someone tried.',
  'verify.step.3':
    'The code is open source, and every change runs a test that records every request of a full flow and fails if any leaves the origin:',
  'verify.step.3.link': 'see it here',

  'distinct.title': 'What makes it different',
  'distinct.1.title': 'No third parties',
  'distinct.1.text':
    'No analytics, no Google Fonts, no CDN. The page only talks to the server that hosts it, and only to load itself.',
  'distinct.2.title': 'Verifiable, not promised',
  'distinct.2.text':
    'The security policy enforces it and a test checks it on every change. The code is public.',
  'distinct.3.title': 'Any document',
  'distinct.3.text':
    'ID card, passport, payslip, contract or any PDF or image. Open the PDF from your scanner or phone, single or multi-page, and export it all together as PDF or ZIP.',
  'distinct.4.title': 'No metadata, just enough resolution',
  'distinct.4.text':
    'Removes location, phone model and date from the photo, and caps the size so it is good for reading, not for forging.',
  'distinct.5.title': 'Typical areas in one click',
  'distinct.5.text':
    'Templates for Spanish and Argentine IDs with the details a process usually does not need.',
  'distinct.6.title': 'Honest about its limits',
  'distinct.6.text':
    'It tells you what a watermark achieves and what it does not, instead of promising security that does not exist.',

  'notice.close': 'Dismiss',
  'footer.source': 'Source code',
  'footer.docs': 'How it is built',
  'hero.title': 'Your documents, only for whoever you choose.',
  'hero.sub':
    "ID card, passport, payslips, contracts or any PDF or image: watermark it, cover what isn't needed and download a limited copy. Nothing is uploaded: it all happens on this device.",
  'trust.local': 'Processed on this device',
  'trust.noTracking': 'No analytics, no cookies',
  'trust.open': 'Open source',
  'trust.counter.one': 'resource from another domain',
  'trust.counter.many': 'resources from other domains',
  'trust.counter.title':
    'Resources from other domains that the browser has recorded on this page, live. Click to see how to check it thoroughly.',
  'steps.label': 'Steps',
  'steps.upload': 'Upload',
  'steps.adjust': 'Adjust',
  'steps.download': 'Download',
  'drop.release': 'Drop to open · processed on this device',
  'pages.back': 'Add the back',
  'mask.item': 'Area {n}',
  'mask.resize': 'Resize area {n}',
  'mark.suggestions': 'Suggestions',
  'mark.suggest.1': 'opening an account',
  'mark.suggest.2': 'rental agreement',
  'mark.suggest.3': 'new phone line',
  'mark.suggest.4': 'identity check',
  'mark.suggest.5': 'job application',
  'mark.sample': 'COPY',
  'redact.title': 'Redact data',
  'redact.style': 'Style',
  'redact.solid': 'Black',
  'redact.pixelate': 'Pixelated',
  'redact.help.solid': 'Irreversible: the original pixels are gone. Recommended.',
  'redact.help.pixelate':
    "Subtler, but don't use it on numbers or text: some techniques can recover pixelated text.",
  'export.zip.many': 'Download {n} copies (ZIP)',
  'export.jpg.short': 'JPG',
  'export.more': 'Also as',
  'import.error.heic':
    '{file}: this browser can\'t open iPhone HEIC photos. Open it in Safari, share it as JPG, or set the camera to "Most Compatible" (Settings › Camera › Formats).',
  'faq.title': 'Frequently asked questions',
  'faq.1.q': 'Is my document uploaded to a server?',
  'faq.1.a':
    'No. The document is opened and processed in your browser: the page has no server to send it to, and its security policy stops it from requesting data from other domains. "Check it yourself" explains how to verify this with the browser\'s own tools.',
  'faq.2.q': 'What text should the watermark say?',
  'faq.2.a':
    'Who it is for, what it is for and the date. The more specific, the less the copy is worth for anything else: "COPY ONLY VALID FOR Example Bank · opening an account · 17/10/2026".',
  'faq.3.q': 'Which details should I cover?',
  'faq.3.a':
    "Whatever the recipient doesn't need. Name, photo and number are usually enough; the signature, barcode, address or machine-readable zone (the lines with <<<) are rarely required. If in doubt, ask which details they need.",
  'faq.4.q': 'Does it work on a phone? And with iPhone photos?',
  'faq.4.a':
    'Yes, in current versions of Safari, Chrome, Firefox and Edge, and you can use the camera. iPhone HEIC photos open in Safari; in other browsers, share them as JPG or set the camera to "Most Compatible" (Settings › Camera › Formats).',
  'faq.5.q': 'Does it work offline?',
  'faq.5.a':
    'With photos, yes, once the page has loaded. Opening a PDF or exporting to PDF or ZIP downloads the required modules the first time, always from this same site.',
  'faq.6.q': 'Does it work for passports, driving licences or other documents?',
  'faq.6.a':
    'Yes: it works with any image or PDF. The templates of typical areas are only for Spanish and Argentine IDs.',
  'faq.7.q': 'Can AI remove the watermark?',
  'faq.7.a':
    "It can try. A dense mark that crosses the photo, number and signature gives a worse, noticeable result, but it is not impossible. That is why you should also cover what isn't needed and not send more resolution than necessary.",
  'faq.8.q': 'Why not pixelate numbers or text?',
  'faq.8.a':
    'Because some techniques can recover pixelated text when the blocks are small. Black redaction replaces the pixels and leaves nothing to recover. If you choose pixelated, use it on photos or backgrounds.',
  'faq.9.q': 'Can they ask me for a copy of my ID?',
  'faq.9.a':
    "It depends on the procedure. You can ask what it is for and hand over only what is essential. For specific questions, your country's data protection authority publishes guidance. This is not legal advice.",
  'mask.selected': 'selected',
  'steps.done': 'done',
  'export.as': 'Download {format}',
  'hero.kinds': 'Works with',
  'kind.1': 'ID card',
  'kind.2': 'Passport',
  'kind.3': 'Payslip',
  'kind.4': 'Contract',
  'kind.5': 'Invoice',
  'kind.6': 'Any PDF or image',
};
