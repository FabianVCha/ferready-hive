# Actualizaciones de la template en este proyecto derivado

Este repositorio es un proyecto derivado de
[`FabianVCha/hive-web`](https://github.com/FabianVCha/hive-web). La template
upstream es la fuente del código compartido. Este proyecto conserva su
identidad comercial y sus secretos, pero recibe las actualizaciones mediante
Pull Requests.

## Capas

- **Template**: `apps/`, `packages/`, `scripts/`, `infra/` y los workflows
  compartidos.
- **Proyecto**: `apps/storefront/data/project-config.mjs`, recursos propios
  bajo `apps/storefront/public/project/` y variables de entorno.
- **Contrato**: `template-manifest.json` declara la versión, la estrategia de
  actualización y las rutas de cada capa. El workflow actualiza la versión de
  la template, pero conserva `project.id`.

`project-config.mjs` es el punto de personalización actual. Contiene el
identificador del proyecto, el proveedor de pago elegido y la configuración
visual/catalográfica de la tienda.

## Registrar un nuevo proyecto derivado

Los siguientes pasos se ejecutan en el repositorio upstream al dar de alta un
nuevo consumidor. No son necesarios para cada actualización de este proyecto.

1. Copia esta base a un repositorio nuevo.
2. Conserva `template-manifest.json` y cambia `project.id`.
3. Personaliza `apps/storefront/data/project-config.mjs`.
4. Configura el secreto `TEMPLATE_UPDATE_TOKEN` en el proyecto derivado. Debe
   poder leer este repositorio privado y crear Pull Requests en el derivado.
5. Configura la variable `TEMPLATE_REPOSITORY` con `owner/repository` si no se
   usa `FabianVCha/hive-web`.
6. Ejecuta manualmente `Propose template update` para comprobar el primer flujo.
7. Añade el repositorio al arreglo `.github/template-consumers.json` de esta
   template:

   ```json
   [
     { "owner": "organizacion", "repo": "tienda-a" }
   ]
   ```

Al publicar una release, `Notify template consumers` envía un evento a cada
repositorio registrado. El workflow del derivado crea una rama
`chore/template-update-*`, fusiona la referencia indicada y abre un Pull
Request. Nunca escribe directamente sobre `main`.

## Conflictos y datos propios

El script preserva las rutas listadas en `sync.projectOwnedPaths` antes de
fusionar la template. Si la fusión tiene conflictos, aborta y no abre un Pull
Request parcial. La resolución debe hacerse en el Pull Request, revisando
especialmente:

- cambios de estructura de configuración;
- migraciones de base de datos;
- variables de entorno;
- imágenes y contenido comercial;
- cambios de contrato público.

Las credenciales y archivos `.env` nunca se versionan ni se copian desde la
template.

## Pagos

`apps/storefront/lib/payment-provider.ts` define el contrato
`PaymentProvider`. Actualmente solo existe `DemoPaymentProvider`, que conserva
el checkout simulado y no cobra dinero. Una integración real debe implementar
otro adaptador, manejar webhooks e idempotencia y guardar sus credenciales
únicamente en los secretos del proyecto derivado.
