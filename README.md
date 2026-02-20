# Goop Cafetería 🍵
!!! Para poder ejecutar el Proyecto elimina carpeta de Node Modules y en terminal ejecutar el commando "Npm start"

Sistema de gestión web para la cafetería **Goop**. Diseño orgánico-minimalista con paleta tierra/neutros (beige, terracota, café), tipografías modernas y bordes redondeados (soft UI).



## Estructura del Proyecto

```
goop-cafeteria/
├── index.html   → Estructura HTML 
├── styles.css   → Sistema de diseño completo (tokens, componentes, responsive)
├── script.js    → Lógica de negocio, estado global y persistencia
└── README.md    → Esta documentación
```

## Arquitectura

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| Presentación | HTML5 + CSS3 | Vistas, componentes, responsive |
| Lógica | JavaScript ES6+ | CRUD, estado, validaciones |
| Datos | LocalStorage API | Persistencia entre sesiones |

Los datos se guardan automáticamente en `localStorage` del navegador bajo las claves `goop_menu`, `goop_orders` y `goop_inventory`. Al primer uso, se cargan datos de ejemplo (seed data).

## Requerimientos Funcionales

| ID | Descripción |
|---|---|
| **RF1** | El administrador puede agregar, editar y eliminar productos del menú (nombre, categoría, precio, imagen, disponibilidad) |
| **RF2** | El sistema calcula automáticamente el total del pedido al seleccionar productos |
| **RF3** | El administrador puede cambiar el estatus de un pedido: Pendiente → Preparando → Entregado |
| **RF4** | El sistema muestra visualmente (barra roja) cuando un insumo está por debajo del 10% de su capacidad máxima |
| **RF5** | El usuario puede filtrar el catálogo por categoría (Bebidas, Alimentos, Postres) |
| **RF6** | El administrador puede filtrar pedidos por estatus desde el panel |
| **RF7** | Todos los datos persisten en LocalStorage entre sesiones del navegador |

## Requerimientos No Funcionales

| ID | Descripción |
|---|---|
| **RNF1** | **Estética de Marca**: Paleta tierra/neutros (beige `#F5F0E8`, terracota `#C4714A`, café `#4A2E1A`), tipografías Outfit + Inter, bordes redondeados |
| **RNF2** | **Responsividad**: 100% funcional en móvil (≥320px), tablet (≥768px) y escritorio (≥1024px) |
| **RNF3** | **Usabilidad**: Cualquier acción CRUD se completa en ≤3 clics desde el tablero principal |
| **RNF4** | **Accesibilidad (WCAG 2.1)**: Roles ARIA, semántica HTML5, navegación por teclado, contraste ≥4.5:1 |
| **RNF5** | **Rendimiento**: Operaciones CRUD con latencia <10ms (LocalStorage, sin peticiones de red) |

## Vistas

### Catálogo de Usuario
- Grid de tarjetas de productos con imagen, categoría, precio y disponibilidad
- Filtros por categoría con microinteracciones
- Diseño hero con gradiente oscuro

### Panel de Administración
- **Estadísticas**: Productos totales, pedidos activos, alertas de stock bajo, ventas del día
- **Tab Menú**: Tabla con imagen, nombre, categoría, precio, disponibilidad + CRUD
- **Tab Pedidos**: Tabla con ID, cliente, productos, total, estatus + avance rápido de estatus
- **Tab Inventario**: Tabla con barra de progreso de stock y alertas visuales

### Documentación
- Sección integrada en la app con RF, RNF y diagrama de arquitectura

## Modulos JavaScript

```
Storage   → Wrapper de LocalStorage (get/set/load/save)
Menu      → CRUD de productos (saveMenu, editMenu, deleteItem)
Orders    → CRUD de pedidos + cálculo de total + avance de estatus
Inventory → CRUD de insumos + detección de stock bajo
UI        → Render de vistas, modales, toasts, navegación
Init      → Seed data + arranque de la aplicación
```

## Paleta de Colores

| Token | Hex | Uso |
|---|---|---|
| `--cream` | `#F5F0E8` | Fondo principal |
| `--terracota` | `#C4714A` | Acento primario, precios, botones |
| `--cafe` | `#4A2E1A` | Texto principal, headers |
| `--sage` | `#7A9E6E` | Stock normal, disponible |
| `--warm-white` | `#FDFAF6` | Superficies de cards y modales |

---

