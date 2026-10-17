import type { MessageKey } from './es';

export const en: Record<MessageKey, string> = {
  'app.title': 'copia segura',
  'app.tagline': 'Prepare a limited copy of your ID document without it ever leaving your browser.',
  'app.local': 'Everything happens in your browser. Nothing is sent anywhere.',
  'app.language': 'Language',

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
  'mark.recipient.placeholder': 'Acme Telecom',
  'mark.purpose': 'Purpose',
  'mark.purpose.placeholder': 'account ownership change',
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

  'notice.close': 'Dismiss',
  'footer.source': 'Source code',
  'footer.docs': 'How it is built',
};
