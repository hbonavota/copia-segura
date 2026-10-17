// Aplica el tema guardado antes del primer pintado, para que no parpadee (RF-19).
// Script clásico y del propio origen: lo permite la CSP sin 'unsafe-inline'.
// Misma clave y valores que src/ui/theme.ts.
try {
  var theme = localStorage.getItem('copia-segura.theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch (e) {
  // Sin almacenamiento: se sigue el tema del sistema.
}
