export const es = {
  'app.title': 'copia segura',
  'app.tagline': 'Tu DNI, solo para quien tú decidas.',
  'app.local': 'Todo ocurre en tu navegador. Tu documento no se envía a ningún sitio.',
  'app.language': 'Idioma',
  'app.theme.dark': 'Modo oscuro',

  'drop.title': 'Suelta tu DNI aquí',
  'drop.hint': 'PDF o fotos (JPG, PNG, WebP). Frente y dorso a la vez, si quieres.',
  'drop.choose': 'Elegir archivos',
  'drop.camera': 'Usar la cámara',
  'drop.example': 'Ver cómo funciona con un DNI de prueba',

  'pages.title': 'Páginas',
  'pages.add': 'Añadir',
  'pages.camera': 'Cámara',
  'pages.remove': 'Quitar página',
  'pages.autocrop': 'Recorte automático a la imagen del PDF',

  'tool.mask': 'Tapar',
  'tool.crop': 'Recortar',
  'tool.rotateLeft': 'Girar a la izquierda',
  'tool.rotateRight': 'Girar a la derecha',
  'tool.undo': 'Deshacer zona',
  'tool.clearMasks': 'Quitar todas las zonas',
  'tool.clearCrop': 'Quitar recorte',
  'tool.hint.mask':
    'Dibuja un rectángulo sobre lo que el trámite no necesita. Arrastra una zona para moverla o su esquina para cambiar el tamaño; con el teclado: flechas para mover, Alt + flechas para el tamaño, Supr para quitarla.',
  'tool.hint.crop': 'Dibuja el rectángulo que quieres conservar. Fuera de él no se exporta nada.',
  'tool.strips': 'Tapar una franja',
  'tool.strip.top': 'Arriba',
  'tool.strip.bottom': 'Abajo',
  'tool.strip.left': 'Izquierda',
  'tool.strip.right': 'Derecha',
  'editor.preview': 'Vista previa de la copia que se exportará',
  'editor.rendering': 'Preparando la vista previa…',

  'mark.title': 'Marca de agua',
  'mark.freeText': 'Texto',
  'mark.recipient': '¿Para quién es?',
  'mark.recipient.placeholder': 'Ej.: nombre de la empresa',
  'mark.purpose': '¿Para qué trámite?',
  'mark.purpose.placeholder': 'Ej.: alta de un servicio',
  'mark.includeDate': 'Añadir la fecha de hoy',
  'mark.preview': 'Vista previa de la marca',
  'mark.preset': 'Intensidad',
  'mark.preset.normal': 'Visible',
  'mark.preset.normal.help': 'Recomendada',
  'mark.preset.suave': 'Discreta',
  'mark.preset.suave.help': 'Si el trámite la rechaza',
  'mark.advanced': 'Ajuste fino',
  'mark.opacity': 'Opacidad',
  'mark.size': 'Tamaño del texto',
  'mark.spacing': 'Separación',
  'mark.angle': 'Ángulo',
  'mark.color': 'Color',
  'mark.color.rojo': 'Rojo',
  'mark.color.gris': 'Gris',
  'mark.color.negro': 'Negro',
  'mark.color.azul': 'Azul',
  'mark.color.custom': 'Otro…',
  'mark.outline': 'Borde blanco',
  'mark.reset': 'Volver al preset',

  'output.title': 'Salida',
  'output.maxSide': 'Lado máximo',
  'output.maxSide.help': 'Suficiente para que se lea; no vale para falsificar.',
  'output.quality': 'Calidad JPEG',

  'export.jpg': 'Descargar copia',
  'export.zip': 'ZIP',
  'export.pdf': 'PDF',
  'export.working': 'Generando…',
  'export.done': 'Copia lista: {files}. Nada ha salido de tu equipo.',
  'export.none': 'Añade al menos una página para exportar.',

  'camera.title': 'Hazte la foto sosteniendo el documento',
  'camera.help':
    'Luz de frente, el documento junto a la cara e inclinado un poco para que no refleje. La foto se guarda sin espejo: el texto se leerá del derecho.',
  'camera.shoot': 'Hacer foto',
  'camera.cancel': 'Cancelar',
  'camera.starting': 'Encendiendo la cámara…',
  'camera.error.denied':
    'El navegador no ha dado permiso para usar la cámara. Concédelo en la barra de direcciones o elige una foto del disco.',
  'camera.error.unavailable': 'No se ha encontrado ninguna cámara. Elige una foto del disco.',
  'camera.error.unknown': 'No se pudo usar la cámara: {message}',

  'import.error.encrypted':
    '{file}: el PDF tiene contraseña. Quítasela o exporta las páginas como imagen.',
  'import.error.corrupt': '{file}: el archivo no es un PDF válido.',
  'import.error.unsupported':
    '{file}: el navegador no puede abrir este formato. Conviértelo a JPG o PNG (en iPhone: Ajustes › Cámara › Formatos › Más compatible).',
  'import.error.unknown': '{file}: no se pudo abrir ({message}).',
  'import.error.example':
    'No se pudo cargar el documento de ejemplo. Si estás sin conexión, prueba con una foto del disco.',
  'import.working': 'Abriendo {n} archivo(s)…',
  'import.done': '{n} página(s) añadida(s).',
  'import.autocrop':
    'Se ha recortado automáticamente a la imagen que había dentro del PDF. Puedes quitar el recorte en el editor.',

  'about.title': 'Qué hace y qué no hace una marca de agua',
  'about.does.title': 'Lo que consigue',
  'about.does.1':
    'Deja constancia de a quién entregaste la copia, para qué y cuándo. Si aparece en otro sitio, se sabe de dónde salió.',
  'about.does.2':
    'Encarece reutilizarla: una marca densa que cruza foto, número y firma no se quita con un clic.',
  'about.does.3':
    'Junto con tapar lo que el trámite no necesita y bajar la resolución, reduce lo que un tercero puede hacer con ella.',
  'about.doesnt.title': 'Lo que no consigue',
  'about.doesnt.1':
    'No impide que alguien la use. Con herramientas de inpainting se puede intentar borrar; cuanto más densa y más cruce los datos, peor queda el resultado, pero no es imposible.',
  'about.doesnt.2':
    'No sabe a quién la envías. Pedir una foto del DNI junto a un cambio de titularidad es exactamente el material de un fraude de duplicado de SIM: usa solo la app, la web o el correo oficial, nunca el WhatsApp de "un asesor".',
  'about.privacy.title': 'Sobre esta herramienta',
  'about.privacy.1':
    'No hay servidor. El documento se procesa en tu navegador y no se guarda en ningún sitio: al cerrar la pestaña desaparece.',
  'about.privacy.2':
    'La página no puede hacer peticiones a otros dominios (lo impide su política de seguridad) y el código es abierto. Puedes comprobarlo en la pestaña Red de las herramientas de desarrollo.',

  'demo.recipient': 'EMPRESA EJEMPLO',
  'demo.purpose': 'alta de un servicio',
  'demo.title': 'Así queda una copia, paso a paso (documento ficticio)',
  'demo.alt': 'Tarjeta ficticia procesada por copia segura',
  'demo.tab.original': 'Original',
  'demo.tab.masked': 'Tapado',
  'demo.tab.marked': 'Marca',
  'demo.tab.gray': 'B/N',
  'demo.caption.original': 'La foto tal cual: todos los datos visibles.',
  'demo.caption.masked': 'Firma, número de trámite y código de barras tapados con negro opaco.',
  'demo.caption.marked': 'Marca con destinatario, finalidad y fecha cruzando todo el documento.',
  'demo.caption.gray':
    'En blanco y negro la copia vale aún menos para falsificar; la marca sigue en color.',

  'template.label': 'Zonas típicas',
  'template.apply': 'Aplicar',
  'template.help': 'Aproximadas: recorta antes a la tarjeta y revísalas.',
  'template.dni-es-frente': 'DNI España · frente',
  'template.dni-es-dorso': 'DNI España · dorso',
  'template.dni-ar-frente': 'DNI Argentina · frente',
  'template.dni-ar-dorso': 'DNI Argentina · dorso',

  'output.grayscale': 'Blanco y negro',
  'output.grayscale.help': 'El documento en grises; la marca conserva su color.',

  'export.share': 'Compartir',
  'export.shared': 'Copia compartida: {files}. Se ha generado en tu equipo.',
  'export.share.retry': 'Las copias están listas. Pulsa Compartir otra vez para abrir el menú.',
  'export.share.failed': 'Este navegador no ha podido abrir el menú de compartir. Usa Descargar.',
  'export.failed': 'No se pudo generar la copia ({message}). Prueba con un lado máximo menor.',

  'verify.title': 'Compruébalo tú',
  'verify.lead':
    'No hace falta fiarse de lo que dice esta página. Puedes verificarlo en un minuto:',
  'verify.step.1':
    'Abre las herramientas de desarrollo del navegador (F12 o Cmd+Opción+I), pestaña Red, y prepara una copia: no aparece ninguna petición a otro dominio. Ni analítica, ni fuentes externas, ni servidor.',
  'verify.step.2':
    'Mira el código fuente de la página: la política de seguridad (Content-Security-Policy) impide a la página pedir datos o cargar recursos de cualquier otro sitio, aunque alguien lo intentara.',
  'verify.step.3':
    'El código es abierto y cada cambio pasa un test que registra todas las peticiones de un flujo completo y falla si alguna sale del origen:',
  'verify.step.3.link': 'míralo aquí',

  'distinct.title': 'Qué la hace distinta',
  'distinct.1.title': 'Sin terceros',
  'distinct.1.text':
    'Ni analítica, ni fuentes de Google, ni CDN. La página solo habla con el servidor que la aloja, y solo para cargarse.',
  'distinct.2.title': 'Verificable, no prometido',
  'distinct.2.text':
    'La política de seguridad lo impone y un test lo comprueba en cada cambio. El código es público.',
  'distinct.3.title': 'PDF y varias páginas',
  'distinct.3.text':
    'Abre el PDF del escáner o del móvil, recorta solo la tarjeta y exporta frente y dorso juntos en PDF o ZIP.',
  'distinct.4.title': 'Sin metadatos y con resolución justa',
  'distinct.4.text':
    'Elimina la ubicación, el modelo del móvil y la fecha de la foto, y limita el tamaño para que sirva para leer, no para falsificar.',
  'distinct.5.title': 'Zonas típicas en un clic',
  'distinct.5.text':
    'Plantillas para el DNI de España y de Argentina con los datos que un trámite no suele necesitar.',
  'distinct.6.title': 'Honesta sobre sus límites',
  'distinct.6.text':
    'Te explica qué consigue una marca de agua y qué no, en vez de prometer una seguridad que no existe.',

  'notice.close': 'Cerrar aviso',
  'footer.source': 'Código fuente',
  'footer.docs': 'Cómo está hecho',
  'hero.title': 'Tu DNI, solo para quien tú decidas.',
  'hero.sub':
    'Marca, tapa y descarga una copia limitada de tu documento. Sin subir nada: todo ocurre en este dispositivo.',
  'trust.local': 'Se procesa en este dispositivo',
  'trust.noTracking': 'Sin analítica ni cookies',
  'trust.open': 'Código abierto',
  'trust.counter.one': 'recurso de otro dominio',
  'trust.counter.many': 'recursos de otros dominios',
  'trust.counter.title':
    'Recursos de otros dominios que el navegador ha registrado en esta página, en vivo. Pulsa para ver cómo comprobarlo a fondo.',
  'steps.label': 'Pasos',
  'steps.upload': 'Subir',
  'steps.adjust': 'Ajustar',
  'steps.download': 'Descargar',
  'drop.release': 'Suelta para abrir · se procesa en este dispositivo',
  'pages.back': 'Añadir el dorso',
  'mask.item': 'Zona {n}',
  'mask.resize': 'Cambiar el tamaño de la zona {n}',
  'mark.suggestions': 'Sugerencias',
  'mark.suggest.1': 'apertura de cuenta',
  'mark.suggest.2': 'contrato de alquiler',
  'mark.suggest.3': 'alta de línea',
  'mark.suggest.4': 'verificación de identidad',
  'mark.suggest.5': 'proceso de selección',
  'mark.sample': 'COPIA',
  'redact.title': 'Tapar datos',
  'redact.style': 'Estilo',
  'redact.solid': 'Negro',
  'redact.pixelate': 'Pixelado',
  'redact.help.solid': 'Irreversible: los píxeles originales desaparecen. Recomendado.',
  'redact.help.pixelate':
    'Más discreto, pero no lo uses sobre números ni texto: hay técnicas que recuperan texto pixelado.',
  'export.zip.many': 'Descargar {n} copias (ZIP)',
  'export.jpg.short': 'JPG',
  'export.more': 'También como',
  'import.error.heic':
    '{file}: este navegador no abre fotos HEIC del iPhone. Ábrela en Safari, compártela como JPG o pon la cámara en «Más compatible» (Ajustes › Cámara › Formatos).',
  'faq.title': 'Preguntas frecuentes',
  'faq.1.q': '¿Se sube mi DNI a algún servidor?',
  'faq.1.a':
    'No. El documento se abre y se procesa en tu navegador: la página no tiene un servidor al que enviarlo y su política de seguridad le impide pedir datos a otros dominios. «Compruébalo tú» explica cómo verificarlo con las herramientas del propio navegador.',
  'faq.2.q': '¿Qué texto pongo en la marca?',
  'faq.2.a':
    'Para quién es, para qué trámite y la fecha. Cuanto más concreto, menos vale la copia para otra cosa: «COPIA SOLO VÁLIDA PARA Banco Ejemplo · apertura de cuenta · 17/10/2026».',
  'faq.3.q': '¿Qué datos conviene tapar?',
  'faq.3.a':
    'Lo que el trámite no necesita. Suele bastar con nombre, foto y número; la firma, el código de barras, la dirección o la zona de lectura mecánica (las líneas con <<<) rara vez hacen falta. Si dudas, pregunta qué datos necesitan.',
  'faq.4.q': '¿Funciona en el móvil? ¿Y con fotos del iPhone?',
  'faq.4.a':
    'Sí, en las versiones actuales de Safari, Chrome, Firefox y Edge, y puedes usar la cámara. Las fotos HEIC del iPhone se abren en Safari; en otros navegadores, compártelas como JPG o pon la cámara en «Más compatible» (Ajustes › Cámara › Formatos).',
  'faq.5.q': '¿Funciona sin conexión?',
  'faq.5.a':
    'Con fotos, sí, una vez cargada la página. Abrir un PDF o exportar en PDF o ZIP descarga la primera vez los módulos necesarios, siempre desde esta misma web.',
  'faq.6.q': '¿Sirve para el pasaporte, el carné de conducir u otros documentos?',
  'faq.6.a':
    'Sí: funciona con cualquier imagen o PDF. Las plantillas de zonas típicas son solo para el DNI de España y de Argentina.',
  'faq.7.q': '¿Se puede quitar la marca con inteligencia artificial?',
  'faq.7.a':
    'Se puede intentar. Una marca densa que cruza foto, número y firma deja un resultado peor y se nota, pero no es imposible. Por eso conviene además tapar lo que no hace falta y no enviar más resolución de la necesaria.',
  'faq.8.q': '¿Por qué no pixelar números o texto?',
  'faq.8.a':
    'Porque hay técnicas que recuperan texto pixelado cuando los bloques son pequeños. El tapado negro sustituye los píxeles y no deja nada que recuperar. Si eliges pixelado, úsalo sobre fotos o fondos.',
  'faq.9.q': '¿Me pueden pedir una copia del DNI?',
  'faq.9.a':
    'Depende del trámite. Puedes preguntar para qué la necesitan y entregar solo lo imprescindible. Para dudas concretas, la autoridad de protección de datos de tu país (en España, la AEPD) publica guías. Esto no es asesoramiento legal.',
  'mask.selected': 'seleccionada',
  'steps.done': 'completado',
  'export.as': 'Descargar {format}',
} as const;

export type MessageKey = keyof typeof es;
