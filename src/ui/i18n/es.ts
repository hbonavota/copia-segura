export const es = {
  'app.title': 'copia segura',
  'app.tagline': 'Prepara una copia limitada de tu documento sin que salga de tu navegador.',
  'app.local': 'Todo ocurre en tu navegador. No se envía nada a ningún sitio.',
  'app.language': 'Idioma',

  'drop.title': 'Arrastra aquí tu DNI',
  'drop.hint': 'Un PDF, o una o varias fotos (JPG, PNG, WebP).',
  'drop.choose': 'Elegir archivos',
  'drop.camera': 'Hacer una foto con la cámara',
  'drop.example': 'Probar con un documento de ejemplo',
  'drop.or': 'o',

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
    'Dibuja un rectángulo sobre lo que el trámite no necesita: número de trámite, código de barras, dirección…',
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
  'mark.recipient': 'Destinatario',
  'mark.recipient.placeholder': 'Movistar',
  'mark.purpose': 'Finalidad',
  'mark.purpose.placeholder': 'cambio de titularidad',
  'mark.includeDate': 'Añadir la fecha de hoy',
  'mark.preview': 'Así quedará el texto',
  'mark.preset': 'Intensidad',
  'mark.preset.normal': 'Normal',
  'mark.preset.normal.help': 'Bien visible, roja, con borde.',
  'mark.preset.suave': 'Suave',
  'mark.preset.suave.help': 'Discreta pero legible, gris.',
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

  'export.jpg': 'Descargar JPG',
  'export.jpg.many': 'Descargar {n} JPG',
  'export.zip': 'Descargar ZIP',
  'export.pdf': 'Descargar PDF',
  'export.working': 'Generando…',
  'export.done': 'Descarga iniciada: {files}',
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
  'export.shared': 'Compartido: {files}',

  'verify.title': 'Compruébalo tú',
  'verify.lead':
    'No hace falta fiarse de lo que dice esta página. Puedes verificarlo en un minuto:',
  'verify.step.1':
    'Abre las herramientas de desarrollo del navegador (F12 o Cmd+Opción+I), pestaña Red, y prepara una copia: no aparece ninguna petición a otro dominio. Ni analítica, ni fuentes externas, ni servidor.',
  'verify.step.2':
    'Mira el código fuente de la página: la política de seguridad (Content-Security-Policy) prohíbe al navegador conectar con cualquier otro sitio, aunque alguien lo intentara.',
  'verify.step.3':
    'El código es abierto y cada cambio pasa un test que registra todas las peticiones de un flujo completo y falla si alguna sale del origen:',
  'verify.step.3.link': 'míralo aquí',

  'distinct.title': 'Qué la hace distinta',
  'distinct.1.title': 'Sin terceros',
  'distinct.1.text': 'Ni analítica, ni fuentes de Google, ni CDN. Tu IP tampoco viaja a nadie.',
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
} as const;

export type MessageKey = keyof typeof es;
