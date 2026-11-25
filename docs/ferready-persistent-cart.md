# Carrito previo a la habilitación comercial

## Contrato actual

Las 45 referencias aprobadas se sincronizan con Medusa **como borradores**.
Sus imágenes originales, galerías revisadas, procedencia y especificaciones
se conservan; no se asignan precios, existencias ni condiciones comerciales.
La sincronización no autoriza publicación.

Medusa 2.22.6 rechaza añadir al carrito comercial variantes de productos no
publicados o sin precio (`get-variants-and-items-with-prices`). Por eso el
carrito visible guarda una **selección persistente** mediante un módulo
de Medusa y PostgreSQL, no mediante precios ficticios ni `localStorage`.
No es un pedido, una reserva de inventario ni un carrito comercial de Medusa.
La interfaz conserva `/carrito` y muestra «Por definir», sin totales de cero,
checkout, pagos o formularios de datos personales.

La presentación reutiliza `CartView` (no un carrito paralelo): navegación,
controles de cantidad escritos entre 1 y 20 y orientación sobre medidas y
compatibilidad. En la selección persistente, escribir confirma al salir del
campo o pulsar Enter; un campo vacío o inválido restaura la cantidad guardada.
Las escrituras en curso no admiten nuevas modificaciones.

«Ver resumen» lleva a la tirilla de `ThermalReceipt`, con el mismo papel blanco,
Courier, bordes perforados y reglas discontinuas del comprobante original.
Su modo `selection` muestra «Resumen de selección», «No es comprobante de pago»
y «Precios por definir», sin referencia de pedido, fecha de pago ni datos
personales. «Imprimir resumen» permite imprimir/guardar como PDF desde el
navegador, sin habilitar el PDF de pago simulado. La impresión aísla la tirilla.
El checkout demo, su comprobante y descarga PDF originales siguen separados.

## Persistencia y seguridad

- `selectionCart` guarda una fila por sesión/producto con cantidad entre 0 y 20.
  Cantidad 0 elimina la línea visible; la clave estable permite reintentos.
- El navegador recibe una cookie aleatoria `HttpOnly`, `SameSite=Lax`, de 30 días,
  `Secure` en producción. No contiene datos personales ni un ID secuencial.
  Perder la cookie pierde el acceso a esa selección; no hay recuperación por correo.
- Next.js actúa como intermediario del mismo origen. Solo el servidor transmite
  el token a Medusa; PostgreSQL guarda su SHA-256, nunca el token original.
- Las escrituras comprueban el origen, cantidades, campos admitidos y existencia
  de un producto importado y aprobado con precio pendiente. No aceptan importes,
  estados comerciales ni datos de clientes.
- Cantidades absolutas hacen los reintentos idempotentes; las líneas independientes
  evitan sobrescribir otros productos. Escrituras simultáneas de una misma línea
  usan la última cantidad recibida. Las pestañas se actualizan con BroadcastChannel.
- Un error no añade productos ficticiamente; conserva la selección conocida y
  ofrece reintentar. No se usa el carrito demo como alternativa silenciosa.
- El carrito demo (`FERREADY_DEMO=1`) sigue aislado y conserva su comportamiento.

## Operación local y pruebas

```bash
# El launcher comprueba el contenedor/puerto y fija la BD ferready_hive.
node scripts/local-ferready-backend.mjs migrate
node scripts/local-ferready-backend.mjs import
node scripts/local-ferready-backend.mjs dev

# Con backend 9000 y storefront no-demo 8000 activos:
node scripts/test-ferready-sync.mjs
cd apps/storefront
node tests/browser-persistent-cart.probe.cjs
```

La prueba de sincronización vuelve a importar dos veces y verifica en PostgreSQL
45 identidades únicas, estado borrador, metadatos/galerías exactos, archivos
presentes y ausencia de precios vinculados. Usa el catálogo y la auditoría de
galería actuales, no los recuentos históricos de la revisión de 36 referencias.
Para 16590 conserva la fotografía y cinco ilustraciones de accesorios revisadas;
no reincorpora vistas del modelo/disco incompatibles.

La prueba E2E usa Chromium a 1440, 390 y 320 píxeles contra los dos servidores reales:
seleccionar, añadir, modificar, recargar, sincronizar pestañas, aislar sesiones,
rechazar datos inválidos y origen externo, simular fallo de red/reintentar con
teclado, eliminar y comprobar ausencia de checkout/importes inventados. Incluye
escritura directa (vacío, cero y máximo), orientación, resumen térmico e impresión.
Evidencia: `/tmp/opencode/ferready-persistent-cart/`.

`CATALOG_ASSET_ORIGIN` configura el origen absoluto de imágenes al importar.
El valor local por defecto es `http://localhost:8000`; al cambiar de entorno
hay que definir el origen correcto y volver a sincronizar. No se configura
hosting, dominio ni despliegue desde este trabajo.

## Cuando se definan los precios

Habilitar ventas requiere una decisión separada: precios reales, moneda/región,
canal de venta, disponibilidad y publicación aprobadas; después se podrá convertir
la selección mediante las API comerciales de Medusa revalidando cada referencia.
Actualmente no existe esa conversión ni se intenta cobrar.

## Correos

No hay un adaptador de correo ni proveedor transaccional configurado en el
proyecto. Medusa tiene un módulo de notificaciones, pero eso no significa
que envíe correos reales. Para enviarlos hace falta un servicio SMTP/API,
remitente/dominio verificado y el adaptador correspondiente, con secretos fuera
del código. La elección del proveedor queda pendiente; no bloquea este carrito.
Las pruebas actuales no envían correos ni generan pedidos.
