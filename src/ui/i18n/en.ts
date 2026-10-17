import type { MessageKey } from './es';

export const en: Record<MessageKey, string> = {
  'app.title': 'copia segura',
  'app.tagline': 'Prepare a limited copy of your ID document without it ever leaving your browser.',
  'app.local': 'Everything happens in your browser. Your document is never sent anywhere.',
  'app.language': 'Language',
  'app.theme.dark': 'Dark mode',

  'drop.title': 'Drop your ID here',
  'drop.hint': 'A PDF, or one or more photos (JPG, PNG, WebP).',
  'drop.choose': 'Choose files',
  'drop.camera': 'Take a photo with the camera',
  'drop.example': 'Try it with a sample document',
  'drop.or': 'or',

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
    'Draw a rectangle over what the recipient does not need: document number, barcode, address…',
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
  'mark.recipient': 'Recipient',
  'mark.recipient.placeholder': 'e.g. company name',
  'mark.purpose': 'Purpose',
  'mark.purpose.placeholder': 'e.g. opening an account',
  'mark.includeDate': "Add today's date",
  'mark.preview': 'The text will read',
  'mark.preset': 'Intensity',
  'mark.preset.normal': 'Normal',
  'mark.preset.normal.help': 'Clearly visible, red, outlined.',
  'mark.preset.suave': 'Subtle',
  'mark.preset.suave.help': 'Discreet but legible, grey.',
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

  'export.jpg': 'Download JPG',
  'export.jpg.many': 'Download {n} JPGs',
  'export.zip': 'Download ZIP',
  'export.pdf': 'Download PDF',
  'export.working': 'Generating…',
  'export.done': 'Download started: {files}',
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
  'demo.title': 'What a copy looks like, step by step (fictional document)',
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
  'export.shared': 'Shared: {files}',
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
  'distinct.3.title': 'PDFs and multiple pages',
  'distinct.3.text':
    'Open the PDF from your scanner or phone, crop just the card, and export front and back together as PDF or ZIP.',
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
};
