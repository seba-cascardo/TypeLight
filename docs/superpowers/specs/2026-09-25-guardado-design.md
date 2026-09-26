# Guardado menos frágil — diseño

Fecha 2026-09-25 · pedido de Seba al cerrar la review de la sesión nocturna 2: «vamos a ver cómo mejoramos el guardado para que no sea tan frágil a perder los datos». De tres opciones (A: red dentro del navegador; B: copia sola en una carpeta; C: el servidor local guarda) eligió **B**, con una condición: «se la voy a pasar a unos amigos a la app así que la elección de la carpeta debe ser personalizable».

**Estado:** implementado (plan `docs/superpowers/plans/2026-09-25-guardado.md`) y mergeado fast-forward a `master` el 2026-09-26 por pedido de Seba; queda su prueba en Chrome con una carpeta real (que la carpeta se recuerde al volver a abrir y los errores reales de Chrome no los cubre ningún test automático). Desvíos: (1) la pausa tiene un tercer motivo, `denied` (el navegador no tiene permiso para esa carpeta), que ofrece solo «Elegir otra carpeta»; (2) un error de escritura que no es de permiso ni de carpeta perdida (disco lleno, un archivo bloqueado por OneDrive o el antivirus) no pausa: la copia sigue activa y reintenta con el próximo cambio, y «última: hace …» deja ver el atraso; un borrado fallido de la rotación tampoco pausa; (3) las escrituras van en una cola, una por vez; (4) con la carga bloqueada, Bienvenida oculta los pasos hasta que se elige restaurar o empezar de cero (si no, lo practicado después se perdía sin aviso); (5) el e2e usa una carpeta falsa en memoria: el OPFS del Chromium de Playwright se cae al releer un handle guardado en IndexedDB después de recargar, así que «la carpeta se recuerda» queda para la prueba manual; (6) con la copia activa o en pausa, la tarjeta no muestra la línea de la descarga manual, y «Descargar copia» es botón secundario salvo en navegadores sin soporte.

## 0. Qué es

Hoy el progreso vive solo en el `localStorage` del navegador (zustand `persist`, clave `typelight.v1`, store v8). La copia es un JSON que se baja a mano desde Ajustes, con un recordatorio a los 30 días. Pasan a ser tres capas:

1. **Base:** si la carga falla, lo guardado no se pisa, y el navegador no desaloja los datos por su cuenta.
2. **Copia automática en una carpeta que elige cada persona**, con el mismo JSON de hoy, una por día y 30 días de historia.
3. **La copia manual de hoy**, sin cambios: es la vía en los navegadores que no pueden escribir en una carpeta.

Fuera: cuenta, sync entre dispositivos, merge al importar, backend, deploy. Importar sigue reemplazando todo.

## 1. Base: no pisar, no perder

Lo que hoy pasa (zustand 5.0.15, `persist` en `node_modules/zustand/esm/middleware.mjs`): si `migrate` tira un error o el JSON no se puede leer, el `.catch` de la hidratación solo avisa; la app queda con el estado vacío y **el primer `set` escribe ese estado vacío sobre `typelight.v1`**. Además, una migración que termina bien reescribe los datos enseguida y el original no queda en ningún lado.

- **Escrituras bloqueadas si la hidratación falla.** Un `storage` propio envuelve a `localStorage`: si la hidratación falla, copia el texto crudo a `typelight.v1.rescate` y bloquea todo `setItem` de `typelight.v1` (también la copia a la carpeta) hasta que la persona elija qué hacer. En Bienvenida aparece el aviso «No pudimos leer tu progreso guardado. No lo borramos.» con «Restaurar desde una copia…» y «Empezar de cero». Empezar de cero desbloquea y deja `typelight.v1.rescate` donde está.
- **Copia antes de migrar.** Antes de migrar, el texto crudo va a `typelight.v1.antes-de-migrar` (una sola, se pisa en la migración siguiente). Si no entra por cuota, se sigue sin ella. Es una red para rescatar a mano desde las herramientas del navegador, sin UI: con carpeta, las copias diarias ya cubren ese caso.
- **Almacenamiento persistente.** `navigator.storage.persist()` una vez por carga, solo con `onboarded`. Chrome decide solo y sin preguntar; Firefox pregunta una vez y recuerda la respuesta.

## 2. La carpeta

**Soporte:** la API de acceso al sistema de archivos (`showDirectoryPicker`), que existe en Chrome, Edge y Opera de escritorio. No existe en Firefox, Safari, Brave (viene apagada) ni en Android. Se detecta con `'showDirectoryPicker' in window`. Funciona en `http://localhost` y en cualquier `https`, así que no depende de cómo les llegue la app a los amigos.

**Personalizable, sin rutas fijas.** Cada persona elige su carpeta con el selector del sistema (`showDirectoryPicker({ id: 'typelight-copias', mode: 'readwrite', startIn: 'documents' })`) y la puede cambiar o dejar de usar cuando quiera. La app no conoce ni muestra la ruta, solo el nombre de la carpeta (`handle.name`): la API no da más. El texto sugiere, sin imponer: «Si elegís una carpeta de OneDrive, Google Drive o Dropbox, la copia también sale de tu compu.»

**Dónde vive la elección.** El `FileSystemDirectoryHandle` va a IndexedDB (base `typelight`, almacén `kv`, clave `backupDir`), no a `localStorage` ni al store. Por eso no viaja en el JSON de la copia: pasarle una copia a otra persona no le pasa la carpeta. Cada origen tiene la suya (`:5173`, `:5175`, `:5174`).

**Permiso.** Al cargar, `queryPermission({ mode: 'readwrite' })`:
- `granted` → la copia está activa.
- `prompt` → la copia queda **en pausa**. Chrome vuelve a pedir permiso cuando se abre la app de nuevo después de haber cerrado todas sus pestañas, salvo que se elija «Permitir en cada visita». El pedido necesita un clic. Aparece «Reconectar carpeta», que llama a `requestPermission`. El texto dice: «Elegí "Permitir en cada visita" para que no vuelva a preguntar.»
- `denied`, o una carpeta que ya no existe → en pausa, con «Elegir otra carpeta».

**Qué se escribe.**
- `typelight-progreso-AAAA-MM-DD.json` con el formato de `serializeBackup` (el de la descarga manual; se importa igual). A lo largo del día se reescribe con el último estado.
- Antes de «Reiniciar progreso» y antes de importar: `typelight-progreso-AAAA-MM-DD-antes-de-reiniciar.json` o `…-antes-de-importar.json`. Sin eso, la copia del día quedaría pisada por el estado nuevo.
- **Cuándo:** la app se suscribe al store y escribe cuando cambia alguna clave de `PERSISTED_KEYS`, 3 s después del último cambio. Al ocultarse la pestaña, escribe lo pendiente enseguida (sin garantía). La escritura es atómica: `createWritable()` escribe aparte y reemplaza al cerrar, así que un archivo nunca queda a medias.
- **Rotación:** se guardan los archivos de los **30 días más recientes que tengan copia** (días con copia, no de calendario: si alguien deja un mes, la historia no se vacía). Solo se borran archivos con el patrón exacto `^typelight-progreso-\d{4}-\d{2}-\d{2}(-antes-de-(reiniciar|importar))?\.json$`. Cualquier otro archivo de la carpeta no se toca. Tope práctico: unos 30 × 0,5 MB.
- **Dev:** con `import.meta.env.DEV`, el prefijo es `typelight-dev-progreso-`. Si Seba elige su carpeta real mientras prueba una rama en `:5175`, el dev escribe en archivos propios y la rotación no alcanza los del build estable.
- La copia automática **no toca el store**, porque escribir en el store dispararía otra copia. `lastBackupAt` sigue siendo solo de la descarga manual. La hora de la última copia automática se toma del `lastModified` del archivo más nuevo.

## 3. Pantallas

**Ajustes → «Tu progreso»**, según el estado:
- Sin soporte: la tarjeta de hoy, más «Este navegador no puede guardar solo en una carpeta: usá Chrome o Edge, o bajá la copia a mano.»
- Apagada: «Guardá copias solas en una carpeta de tu compu.» [Elegir carpeta], más Descargar e Importar como hoy.
- Activa: «Se guarda sola en «TypeLight» · última: hace 2 min.» [Cambiar carpeta] [Restaurar…] [Dejar de usar la carpeta], más Descargar e Importar.
- En pausa: «La copia automática está en pausa.» [Reconectar carpeta] o [Elegir otra carpeta].
- **Restaurar…** muestra los archivos de la carpeta, del más nuevo al más viejo (fecha y, si corresponde, «antes de reiniciar» o «antes de importar»). Al elegir uno se pasa por el mismo `parseBackup` y la misma confirmación «Reemplaza el progreso actual…» que Importar.

**Inicio:** el recordatorio (`backupDue`) no aparece con la copia activa. En pausa, lo reemplaza «Tu copia automática está en pausa.» [Reconectar]. Con soporte y la copia apagada, el recordatorio de hoy suma «o elegí una carpeta en Ajustes para que se guarde sola».

**Bienvenida:** «¿Ya tenías progreso? Restaurar desde una copia…», con el selector de archivo e Importar. Hoy, alguien con el navegador vacío (limpieza, otra compu, un amigo que cambia de máquina) tiene que terminar la bienvenida antes de poder importar. Con las escrituras bloqueadas (§1), aparece además el aviso de rescate.

## 4. Código

- `src/app/store/storage.ts`: el `storage` con bloqueo y rescate, y la copia antes de migrar. `index.ts` lo usa en `persist` (con `onRehydrateStorage` para detectar el error).
- `src/app/lib/idb.ts`: `get`, `set` y `del` mínimos sobre IndexedDB para el handle.
- `src/app/lib/autoBackup.ts`: estado (`unsupported | off | on | paused`, nombre de la carpeta, última copia) expuesto con `useSyncExternalStore`, la suscripción al store y las acciones `choose`, `reconnect`, `stop`, `list`, `read` y `snapshot(suffix)`. La lógica pura va aparte y probada: nombres, rotación (`filesToDelete(names, keepDays)`) y parseo de la lista para Restaurar.
- `backup.ts` no cambia de formato: `BACKUP_VERSION` sigue en 8.

## 5. Verificación

- **Vitest:** rotación (días con copia, huecos, sufijos, archivos ajenos intactos), nombres con y sin prefijo dev, bloqueo (una versión cuya migración tira error deja `typelight.v1` intacto después de un `setSettings` y crea `typelight.v1.rescate`), copia antes de migrar, y el programador de copias con una carpeta falsa en memoria (espera de 3 s, pausa sin escribir, `snapshot` antes de reiniciar).
- **e2e:** `showDirectoryPicker` falso con `addInitScript` sobre el OPFS (`navigator.storage.getDirectory()`, un handle real del navegador). Si el OPFS no alcanza, un handle falso en memoria. Casos: elegir carpeta → grabar una sesión → aparece el archivo del día con esa sesión; reiniciar deja `…-antes-de-reiniciar.json`; Restaurar reemplaza el progreso; sin `showDirectoryPicker`, la tarjeta es la de hoy; restaurar desde Bienvenida.
- `npm test`, `npm run e2e` (sin editar el repo mientras corre), `npm run build`. Lint sin advertencias nuevas.
- **Prueba real en Chrome sobre `:5175`** con una carpeta de verdad: elegir, practicar, cerrar y abrir Chrome (pausa → reconectar → «Permitir en cada visita»), restaurar.

## 6. Decisiones que cambia

- «Copia de progreso» pasa de «JSON descargado a mano; importar reemplaza todo» a «JSON escrito solo en una carpeta que elige cada persona (Chrome/Edge), más la descarga manual; importar reemplaza todo». Alternativas rechazadas: red solo en el navegador (A), servidor local (C), cuenta/backend, merge. El rechazo de cuenta/backend sigue en pie: esto no es sync ni merge.
