// Genera public/ejemplo/documento-ficticio.pdf a partir de las dos tarjetas ficticias de
// scripts/ejemplo/. Dos casos que la aplicación debe manejar (RF-01):
//   página 1: A4 vertical con la tarjeta dentro (como un escaneo o un "guardar como PDF") y un
//             logo pequeño que no debe confundirse con el documento;
//   página 2: página apaisada con /Rotate 90, como la producen algunos escáneres y móviles.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, degrees, rgb } from 'pdf-lib';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'public', 'ejemplo', 'documento-ficticio.pdf');

const doc = await PDFDocument.create();
doc.setTitle('Documento ficticio de ejemplo · copia-segura');
doc.setProducer('copia-segura');
doc.setCreator('scripts/build-example.mjs');

const frente = await doc.embedJpg(readFileSync(join(here, 'ejemplo', 'frente.jpg')));
const dorso = await doc.embedJpg(readFileSync(join(here, 'ejemplo', 'dorso.jpg')));

// Página 1: A4 (595×842 pt) con la tarjeta centrada y un "logo" en la esquina.
const p1 = doc.addPage([595, 842]);
p1.drawText('Documento de prueba generado por copia-segura. No es un documento real.', {
  x: 60,
  y: 780,
  size: 10,
  color: rgb(0.35, 0.35, 0.35),
});
p1.drawImage(frente, { x: 60, y: 342, width: 475, height: 300 });
p1.drawImage(frente, { x: 500, y: 790, width: 60, height: 38 }); // logo pequeño (< 5 % del área)

// Página 2: apaisada y girada 90°, con la tarjeta ocupando casi toda la página.
const p2 = doc.addPage([842, 595]);
p2.drawImage(dorso, { x: 40, y: 40, width: 762, height: 481 });
p2.setRotation(degrees(90));

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, await doc.save());
console.log(`Creado ${out}`);
