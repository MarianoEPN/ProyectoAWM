# Cabildo S.J. Cocotog — Sistema de Gestión

Proyecto React (Vite) generado a partir de tus mockups `.html`:
`mckp_ges_vehiculos`, `mckp_ges_vendedores`, `mckp_ges_categorias`, `mckp_val_vehiculo_web`, `mckp_val_vendedor_web`.

Conserva la identidad visual original (colores, tipografías, clases CSS) y añade
interactividad real: estado en memoria, búsqueda, filtros, paginación, modales
de alta/edición y un "validador" que consulta contra los mismos datos que el
módulo interno registra.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre la URL que muestre la terminal (por defecto `http://localhost:5173`).

Para generar el build de producción:

```bash
npm run build
npm run preview
```

## Estructura

```
src/
  main.jsx                  Punto de entrada (Router + Provider global)
  App.jsx                   Definición de rutas
  index.css                 Reset + tokens de diseño (colores, radios, fuentes)
  styles/app.css            Estilos de todas las pantallas (mismas clases que tus .html)
  services/api.js            Instancia de axios + funciones por recurso (AJUSTAR a tu API real)
  data/
    uiOptions.js              Solo opciones de interfaz (paletas de color para selects), no datos de negocio
    AppDataContext.jsx        Estado global: carga datos desde api.js y expone acciones (CRUD) a las páginas
  utils/avatar.js             Iniciales/color de avatar calculados en frontend a partir del nombre
  hooks/usePagination.js      Paginación reutilizable
  components/
    Sidebar.jsx               Menú lateral (variante "interno" y "validador")
    Layout.jsx                Shell + topbar + sidebar
    Modal.jsx                 Modal genérico usado en formularios
  pages/
    Dashboard.jsx             Panel principal (no existía como mockup; resumen de datos)
    GestionVehiculos.jsx       Basado en mckp_ges_vehiculos.html
    GestionVendedores.jsx      Basado en mckp_ges_vendedores.html
    GestionCategorias.jsx      Basado en mckp_ges_categorias.html
    ValidarVehiculo.jsx        Basado en mckp_val_vehiculo_web.html
    ValidarVendedor.jsx        Basado en mckp_val_vendedor_web.html
    Placeholder.jsx            Pantallas del menú sin mockup aún (Reportes, Configuración, Gestión QR)
```

## Conexión con tu backend (axios)

Los datos ya **no** están hardcodeados: `AppDataContext.jsx` carga todo desde
tu API a través de `src/services/api.js` usando axios.

1. Copia `.env.example` a `.env` y pon la URL de tu backend:
   ```
   VITE_API_URL=http://localhost:3000/api
   ```
2. Ajusta las rutas/payloads en `src/services/api.js` para que calcen con tus
   endpoints reales (las que dejé son el contrato que asumí: `GET /vehiculos`,
   `POST /vehiculos`, `PATCH /vehiculos/:id/estado`, etc. — están comentadas).
3. Si tu API usa autenticación, agrega el interceptor de axios que ya está
   comentado en ese mismo archivo.

`AppDataContext.jsx` no necesita más cambios: en cuanto `api.js` devuelva las
respuestas con la forma esperada, toda la app (tablas, filtros, formularios,
validadores) funciona igual.

## Qué es funcional ahora mismo

- **Vehículos**: buscar por placa, filtrar por estado, paginar, crear/editar
  (modal), activar/desactivar (esto también invalida/reactiva el QR).
- **Vendedores**: buscar por cédula/nombre/categoría, filtrar por vigencia,
  paginar, crear/editar (modal), revocar autorización.
- **Categorías**: crear, editar, elegir color, eliminar (solo si no tiene
  vendedores asignados — el conteo se calcula en vivo desde los vendedores reales).
- **Validar vehículo / Validar vendedor**: búsqueda manual (simulando la
  lectura del QR) contra los mismos datos que administra el módulo interno;
  guarda las últimas verificaciones en un historial.
- **Panel principal**: resumen con los números reales de las otras secciones.

Todo el estado vive en memoria (`AppDataContext`) — al recargar la página
vuelve a los datos semilla. Cuando tengas un backend, ese contexto es el único
lugar que necesitas reemplazar por llamadas a tu API (los componentes de las
páginas no cambian).

## Pendiente / próximos pasos sugeridos

- Ajustar `src/services/api.js` a la forma real de tu API (rutas, payloads, auth).
- Si tu backend no calcula `estado` de vendedor por fecha, decide si lo hace el
  backend o si se recalcula en frontend a partir de `vencimiento`.
- Implementar el escaneo real de QR con la cámara (ej. librería `html5-qrcode`)
  en `ValidarVehiculo.jsx` / `ValidarVendedor.jsx`, donde ahora hay un `<div class="scan-area">` de marcador visual.
- Diseñar las pantallas de "Gestión QR", "Reportes" y "Configuración" (por ahora
  son un placeholder para que el menú no quede roto).
- Autenticación / control de acceso entre el módulo "interno" y el "validador".
