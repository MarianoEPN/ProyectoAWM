# Cabildo S.J. Cocotog — Sistema de Gestión

Proyecto React (Vite) que implementa los mockups originales
(`mckp_ges_vehiculos`, `mckp_ges_vendedores`, `mckp_ges_categorias`,
`mckp_val_vehiculo_web`, `mckp_val_vendedor_web`) contra el contrato de
endpoints acordado en **"Endpoints - Proyecto de Aplicaciones Móviles"**
(Mariano Zambrano, Domenica Pinto, Harold Ramirez).

## Cómo correrlo

```bash
npm install
cp .env.example .env   # y ajusta VITE_API_URL a tu backend
npm run dev
```

Todos los endpoints acordados exigen `Authorization: Bearer <token_jwt>`.
El documento de endpoints no incluye todavía un endpoint de login, así que
mientras tanto: entra a **Configuración** en el menú y pega ahí el JWT
(se guarda en `localStorage` y se adjunta automáticamente a cada request).

## Estructura

```
src/
  services/api.js            axios + un método por endpoint, tal como está documentado
  data/AppDataContext.jsx     estado global: pagina, cachea y expone acciones a las páginas
  data/uiOptions.js           solo opciones de interfaz (paleta de colores de vehículo)
  utils/avatar.js             iniciales/color de avatar calculados en frontend
  pages/
    Dashboard.jsx             resumen (usa metadata.totalItems de cada recurso)
    GestionVehiculos.jsx      GET/POST/PUT /vehiculos + ver QR (GET /vehiculos/{id})
    GestionVendedores.jsx     GET/POST/PUT /vendedores + detalle para editar/revocar
    GestionCategorias.jsx     GET/POST/PUT /categorias (sin DELETE)
    ValidarVehiculo.jsx       GET /vehiculos/validar?tipoBusqueda&valor
    ValidarVendedor.jsx       GET /vendedores/validar?tipoBusqueda&valor
    Configuracion.jsx         pega/guarda el JWT mientras no exista login
```

## Mapeo de campos (contrato real, no inventado)

**Vehículo:** `idVehiculo, placa, modelo, color, idHabitante, nombrePropietario,
fechaEmision, fechaExpiracion, estadoActivo ("VIGENTE" | "REVOCADA"), codigoQr`
(este último solo viene en el detalle `GET /vehiculos/{id}`, no en la lista).

**Vendedor:** `idVendedor, cedula, nombre, foto, nResolucion, fechaEmision,
fechaExpiracion, estadoActivo, idHabitante, codigoQr, categorias: [{idCategoria, nombre}]`.
La lista (`GET /vendedores`) solo trae una versión resumida (sin `foto`,
`fechaEmision`, `idHabitante`, `codigoQr`) — por eso **editar o revocar primero
pide el detalle completo** (`GET /vendedores/{id}`) antes de armar el `PUT`.

**Categoría:** `idCategoria, nombre, descripcion, totalVendedores`. Sin color,
sin ícono — esos campos no existen en el contrato, así que se quitaron del
formulario (antes sí los tenía la versión anterior de este proyecto).

## Decisiones que tomé donde el documento no era 100% explícito

- **No existe `PATCH` de estado ni `DELETE`.** Activar/desactivar vehículo,
  revocar vendedor y "eliminar" categoría son en realidad un `PUT` completo
  reenviando todos los campos con `estadoActivo` cambiado. Para categoría
  asumí el valor `"INACTIVA"` — **confírmalo con el equipo de backend**, el
  documento solo dice "cambiando la propiedad estadoActivo" sin dar el valor
  ni mostrarlo en los ejemplos de body/respuesta de `/categorias`.
- **Búsqueda por texto:** los endpoints de listado (`/vehiculos`, `/vendedores`,
  `/categorias`) solo aceptan `page` y `limit`, no un parámetro de búsqueda.
  Por eso el buscador de las tablas de gestión solo filtra lo que ya está
  cargado en la página actual (10 registros por defecto) — está señalado en
  la propia interfaz. La búsqueda real de un registro puntual es
  `GET /vehiculos/validar` o `GET /vendedores/validar` (búsqueda exacta),
  usadas en las pantallas de validador.
- **Historial de "últimas verificaciones":** el documento no dice que
  `/validar` registre nada en el backend, así que ese historial vive solo en
  memoria del cliente (se pierde al recargar). Si más adelante el backend
  agrega un endpoint de historial, hay que conectarlo en
  `AppDataContext.jsx` (`validarVehiculo` / `validarVendedor`).
- **Conteos "vigentes/revocados" en Dashboard y en las tablas:** solo reflejan
  la página cargada, no el total del sistema, porque el backend no expone un
  conteo agregado por estado (sí lo hace para `totalVendedores` en categorías).

## Próximos pasos sugeridos

- Reemplazar `Configuracion.jsx` por un login real en cuanto exista el
  endpoint (guarda el JWT en `localStorage.setItem('token', ...)`, el resto
  ya funciona).
- Si el backend llega a soportar búsqueda por texto o filtro por estado en
  los listados, se puede quitar la nota de "solo filtra esta página" y pasar
  esos parámetros directo a `vehiculosApi.listar` / `vendedoresApi.listar`.
- Implementar el escaneo real de QR con cámara (ej. `html5-qrcode`) que
  resuelva el valor y dispare `tipoBusqueda=qr` automáticamente en los
  validadores.
