# Catálogo Truper local

Las 36 referencias de `data/approved/catalog.json` fueron aprobadas por el
usuario el 22 de noviembre de 2026, quien manifestó ser distribuidor autorizado.
La aprobación comprende las doce referencias iniciales y las 24 seleccionadas
por las carpetas locales de aire comprimido y pintura (7), construcción (6)
y corte y abrasivos (11). No autoriza nuevas extracciones.

El segundo lote se materializa de forma incremental y sin red mediante
`node scripts/prepare-truper-selected-folders.mjs`. Repetirlo no agrega duplicados
ni modifica las referencias ya aprobadas. Conserva el lote inicial y sus fotos.
Las 22 fotos nuevas proceden del fabricante y se optimizan como JPEG de hasta
1200 px; la evidencia conserva los hashes del original y del archivo servido.
Las fichas 19784 (BAS-2B) y 12544 (DICOF-3010) están incluidas **sin foto**:
sus candidatos locales proceden de comercios terceros y no se ha establecido
su procedencia como fotografía original del fabricante. No se sustituyen por IA.
La referencia 15020 (GTS-SH), cuchara para jardín, se clasifica en Jardinería,
no Construcción; la evidencia conserva su carpeta de selección original.
El catálogo queda con siete categorías, 36 fichas y 34 fotografías.

## Galerías locales y transparencia

La validación exhaustiva posterior está en
[`truper-catalog-validation.md`](truper-catalog-validation.md), con matriz de las
35 referencias restantes y regresión de 103068. Esta revisión sustituye los
recuentos históricos: 27 ilustraciones en nueve referencias, 44 ilustraciones
excluidas y dos componentes ilustrados confirmados exclusivamente para 103068.
Las cuatro vistas generadas de 16590 se retiraron por rotulación incompatible.
Sus originales y derivados históricos no se borraron.

La revisión visual inicial de los archivos suministrados añadió 31 ilustraciones a diez
referencias: 101895, 103068, 104275, 104412, 13448, 14012, 16182, 16590,
103030 y 103660. Se muestran después de la fotografía original, identificadas
como ilustraciones suministradas, nunca como fotografías del fabricante ni
como prueba de accesorios incluidos. Las otras 24 referencias con fotografía
conservan una sola vista; 19784 y 12544 siguen sin foto.

La presentación sigue la referencia original `81d4d48`: tres objetos
seleccionables en portada y cuatro capítulos controlados por desplazamiento
en la ficha. Se retiraron las miniaturas añadidas y la galería independiente:
no sustituían la narrativa original.

`apps/storefront/lib/editorial-media.mjs` asigna explícitamente imágenes
revisadas por referencia y hash, sin interpretar posiciones de la galería
como contenido semántico. El primer capítulo utiliza la fotografía del
fabricante; el segundo, una vista alternativa o detalle ilustrado suministrado;
el tercero, un detalle adicional cuando existe, identificado como vista del
producto y no como prueba del contenido del empaque. La referencia 13448
vuelve a la fotografía principal en el tercer capítulo por no tener otro
detalle aprobado. Las referencias con una sola fotografía conservan esa
fotografía sin simular vistas nuevas. Las dos referencias sin fotografía
mantienen su aviso explícito.

El tercer capítulo utiliza ahora la mesa original con cantidades variables:
una fotografía del producto por referencia disponible y tres objetos en 103068,
cuya inclusión de mango y llave confirmó el usuario de forma específica.
El cuarto capítulo conserva el empaque ilustrativo. No se incorporan baterías,
cargadores ni piezas de los fixtures a las referencias aprobadas.
Las fotografías aprobadas no pasan otra vez por el recorte en canvas.
La selección de capítulos funciona también sin animación y con movimiento
reducido. La portada conserva su ciclo de diez segundos y las pausas por
interacción, foco, visibilidad y movimiento reducido.

`python scripts/prepare-truper-galleries.py` reconstruye los derivados sin red.
`data/approved/truper-gallery-selection.json` fija las rutas y SHA-256
revisadas; una fuente ausente o modificada detiene el proceso antes de escribir
el catálogo. `truper-gallery-audit.json` registra aprobaciones y exclusiones
por referencia. Se excluyen 42 archivos de accesorios aislados, identidad
insuficiente o piezas repetidas entre SKU. En particular, el disco ilustrado
de 7 pulgadas no corresponde a la amoladora 16590 de 9 pulgadas.

Las 34 fotografías tienen un PNG derivado con transparencia: se elimina
únicamente blanco casi puro (todos los canales >=250) conectado al borde.
No se borra el blanco interior encerrado, no se genera geometría y el RGB
de los píxeles conservados no cambia. El procedimiento es conservador:
pueden quedar bordes claros y huecos blancos interiores, deliberadamente,
en lugar de erosionar etiquetas o metal claro. No es una segmentación
semántica. Los originales quedan sin modificar y registrados en los metadatos.
Se inspeccionó el conjunto sobre fondo oscuro.

Medusa conserva exclusivamente fotografías fiables en `images`; las
ilustraciones y sus etiquetas se importan en `metadata.gallery`, evitando
que el admin las presente como fotografías sin contexto. La importación
local posterior confirmó `created=0 updated=36 drafts_pending_review=36`.

Verificación local del segundo lote: primera importación `created=24 updated=12`,
segunda `created=0 updated=36`. La base `ferready_hive` confirmó 36 productos
`draft`, 36 SKU distintos, 34 imágenes y cero precios vinculados a variantes.
Recuento editorial final: eléctricas 10, neumáticas 1, accesorios eléctricos 1,
aire y pintura 7, construcción 5, corte y abrasivos 11 y jardinería 1.
La prueba `browser-approved-catalog.probe.cjs` recorre 45 rutas en 320, 390
y 1440 px, comprueba las imágenes disponibles y permite ausencia explícita de
foto en las dos fichas indicadas.

## Sitio

`projectConfig.catalogSource = "approved"` muestra el catálogo informativo en
`/`, `/catalogo`, `/c/<handle>` y `/p/<handle>`, sin depender del backend.
Ejecutar `FERREADY_DEMO=0 npm run dev` desde `apps/storefront` y abrir
<http://localhost:8000/catalogo>.

No hay precios, existencias ni botones de compra para estas referencias.
El catálogo aprobado reutiliza los componentes originales Ferready: portada
`CampaignHome` y mostrador `ProductHero`, navegación principal, `CatalogView`
con filtros, y ficha `ProductView` con el recorrido animado `ProductJourney`,
acordeones técnicos y productos relacionados. No usa una portada alternativa
de catálogo ni una ficha simplificada. El adaptador `approvedVisualCatalog`
aporta las 36 referencias y siete categorías a través de `VisualCatalogProvider`;
los fixtures de demo conservan sus datos y comportamiento aislados.

Las categorías reales ocupan el selector interactivo de la portada en lugar
de inventar kits u objetivos de compra. Se preservan los controles de selección
y navegación; no se inventan contenidos de empaque, precios, existencias ni
condiciones de entrega. El empaque animado es explícitamente ilustrativo.
El modo informativo oculta el carrito, no lee ni escribe el carrito demo,
y bloquea `/carrito` y `/checkout`. Las dos referencias sin fotografía conservan
un estado explícito sin foto, incluso en el recorrido del producto.
La demo se conserva separada: `FERREADY_DEMO=1` sigue utilizando exclusivamente
productos, precios y checkout de ejemplo.

La comprobación visual debe verificar `.ferready.neutral-template`, tipografía,
colores computados y respuestas CSS 200, además de datos y rutas. Un CSS 200
por sí solo no garantiza que la página utilice el shell correcto.

Las fotografías se sirven desde `public/project/products/truper`. No se usan
imágenes generadas como fotografías de producto. La imagen candidata de 11452
se revisó visualmente: muestra la marca y el grabado BROU-R2 1/4M, coherente con
la ficha y su atributo de imagen. Se conserva `image_source_url`, incluso cuando
el nombre original de la imagen difiere del modelo. Las especificaciones se
transcriben de la investigación del fabricante, sin deducir prestaciones.

## Medusa

El importador conserva el contrato de publicación manual: crea **borradores**,
incluye fotografías, código, modelo, marca y especificaciones, y nunca publica.
Los borradores carecen de precio si el archivo aprobado no lo contiene.
La disponibilidad se registra como `unconfirmed`, no como inventario real.

Desde `apps/backend`, con una `DATABASE_URL` local verificada:

```bash
npm run db:migrate
npm run catalog:import
```

No reutilizar una URL heredada del shell sin verificar la base. La instancia
Docker `hive-web-db` de este equipo pertenece a la template; la base independiente
del proyecto es `ferready_hive`, en `127.0.0.1:55433`.
Para este equipo, desde la raíz del repositorio:

```bash
node scripts/local-ferready-backend.mjs dev
```

El lanzador obtiene las credenciales del contenedor local sin guardarlas en
archivos, fuerza la base independiente e ignora cualquier `DATABASE_URL`
heredada. También admite `migrate`, `search` e `import`.
Los secretos de sesión son efímeros: reiniciar invalida las sesiones del admin.

`CATALOG_ASSET_ORIGIN` configura el origen de fotografías para Medusa
(por defecto `http://localhost:8000`). El storefront debe estar en ejecución
para verlas desde el admin local.

Repetir el importador actualiza por handle sin crear duplicados ni cambiar
estados de publicación. La publicación y la configuración comercial deben
revisarse manualmente antes de habilitar ventas.
