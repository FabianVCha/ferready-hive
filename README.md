# ferready-hive

## 🚀 ACTUALIZACIONES DE LA TEMPLATE

> [!IMPORTANT]
> **Este repositorio es un proyecto derivado de [`FabianVCha/hive-web`](https://github.com/FabianVCha/hive-web).**
>
> La fuente de verdad del código compartido es el repositorio de la template.
> Las actualizaciones llegan aquí mediante una propuesta automática de
> **Pull Request**.
>
> **Nunca se hace push directo a `main`.** Cada proyecto conserva su marca,
> catálogo, imágenes, secretos y configuración propia; la actualización trae
> únicamente el código común y se revisa antes de fusionarse.

### Flujo

```text
Nueva release de `hive-web`
           ↓
Notificación a este proyecto derivado
          ↓
Rama chore/template-update-*
          ↓
Pull Request + QA + revisión humana
```

Para entender el contrato de actualización y la configuración del proyecto,
consulta [`docs/template-updates.md`](docs/template-updates.md). El registro de
nuevos consumidores se realiza en el repositorio upstream de la template.

Sitio personal con tienda: storefront Next.js y backend Medusa, ambos locales. Fase actual: **F0 + F1**, catálogo local sin pagos y sin despliegue.

- **Visibilidad**: privada. No hacerla pública sin autorización explícita de Fabián.
- **Rama por defecto**: `main`.

## Estructura

```text
.
├── apps/
│   ├── backend/                 # Medusa 2.22.6 (API + admin en /app)
│   └── storefront/              # Next.js 16.4.6 (App Router)
├── packages/catalog-schema/     # validación y reglas de URL canónica
├── data/approved/catalog.json   # catálogo aprobado a mano (vacío al inicio)
├── content/guias/               # guías en Markdown
├── infra/                       # Postgres local (docker compose)
├── scripts/                     # validación de catálogo y runner de integración
├── tests/integration/           # pruebas HTTP contra una BD de test aislada
└── docs/                        # notas de arquitectura
```

## Requisitos

- Node.js **22.22 o superior** (Medusa 2.22.6); con el storefront Next 16, **24 LTS o menor**.
- Docker para el Postgres local.

## Puesta en marcha local

```bash
# 1. Base de datos (127.0.0.1:55433, contenedor hive-web-db)
cp infra/.env.example infra/.env          # ajusta las credenciales
docker compose --env-file infra/.env -f infra/docker-compose.yml up -d

# 2. Backend
cd apps/backend
cp .env.example .env                      # rellena DATABASE_URL y los secretos
npm ci
npm run db:migrate
npx medusa user -e admin@hive-web.local -p <password-local>
npm run catalog:import                    # aprobados -> borradores
npm run dev                               # API 9000, admin 9000/app

# 3. Storefront (otra terminal)
cd apps/storefront
cp .env.example .env.local                # MEDUSA_BACKEND_URL + publishable key
npm ci
npm run dev                               # http://localhost:8000
```

La publishable key se crea en el admin de Medusa (`Settings → Publishable API keys`); es una clave
pública de cliente, no un secreto de servidor.

> **Aviso**: si tu shell exporta `DATABASE_URL` (por ejemplo desde
> `~/.config/environment.d/`), Medusa la usará por encima de `.env`. Verifica con
> `env -u DATABASE_URL DATABASE_URL=<tu-url> npx medusa exec ./src/scripts/whoami.ts`.

## Catálogo

El catálogo Ferready actual tiene 45 referencias aprobadas, sincronizadas como
borradores y sin precios. El carrito guarda la selección en Medusa/PostgreSQL,
sin habilitar pedidos ni pagos mientras faltan los datos comerciales.
Operación y pruebas E2E: [carrito persistente](docs/ferready-persistent-cart.md).

### Demostración con identidad Ferready

Activa `FERREADY_DEMO=1` para usar la tienda Ferready sin backend. Conserva el
layout de la template, los productos de ejemplo y el checkout simulado.
Los cuatro SVG oficiales suministrados viven en `public/project/`.

- Personaliza nombre, textos principales, colores, productos, categorías,
  objetivos, piezas del empaque y guía en
  `apps/storefront/data/project-config.mjs`.
- `apps/storefront/app/template.css` aplica los tokens configurados: papel,
  negro metal, azul marino, acero y rojo Ferready. Los logos y el icono son
  opcionales; otras tiendas pueden conservar la marca de texto neutral.
- Reemplaza `public/template/product-placeholder.svg` o las rutas de imagen de
  la configuración por tus propios recursos autorizados.
- Las rutas de ejemplo son `/p/producto-ejemplo-1` y `/c/categoria-1`.
  Se conservan los patrones de rutas; los antiguos handles de demo ya no existen.
- Precios y condiciones son ejemplos. El checkout simula pago sin cobro ni
  pedido real y conserva el carrito. El PDF no es un documento fiscal.
- El catálogo de Medusa y sus rutas fuera de la demo no cambian. Los fixtures
  históricos en `data/prototype-products.json` siguen aislados para pruebas.

Verificación adicional desde `apps/storefront` (servidor demo en el puerto 8000):

```bash
node tests/browser-template.probe.cjs
node tests/browser-auto-packing-transition.probe.cjs
node tests/browser-guest-checkout.probe.cjs
```

Las capturas y el PDF de prueba se guardan en `/tmp/opencode/neutral-template`.
Puedes cambiar esa carpeta con `BROWSER_EVIDENCE_DIR` si `/tmp` no tiene espacio.

### Catálogo real aprobado

`data/approved/catalog.json` solo contiene referencias **aprobadas a mano**:

```json
{ "version": 1, "categories": [], "products": [] }
```

Reglas (implementadas en `packages/catalog-schema`):

- una referencia, un `handle`, **una URL**: `/p/<handle>`;
- el archivo **no puede** declarar `url`, `path`, `route`, `canonical` ni `slug`;
- `content_variants` describe contenido y nunca genera rutas nuevas;
- `reference` única, `category` existente, `approved_by` y `approved_at` obligatorios.

Flujo de publicación:

```text
data/approved/catalog.json → npm run catalog:import → producto en DRAFT
                                                      → publicación manual en el admin
```

El importador es idempotente (busca por `handle`) y **nunca publica**: un borrador solo se publica
desde el admin, por decisión humana. No hay integración con Odelza ni sincronización automática.

## Template y proyecto derivado

Este repositorio recibe el código común de `FabianVCha/hive-web` mediante ramas
y Pull Requests automáticos. La configuración propia del proyecto vive en
`apps/storefront/data/project-config.mjs`; los recursos propios pueden vivir
en `apps/storefront/public/project/`.

No se hace push directo a `main`. El código común y las reglas de actualización
están descritos en `template-manifest.json`; el procedimiento completo y los
secretos necesarios están documentados en
[`docs/template-updates.md`](docs/template-updates.md).

El checkout usa el contrato `PaymentProvider` y conserva `demo` como proveedor
por defecto. No hay todavía una pasarela real ni credenciales financieras.

Validar sin arrancar Medusa:

```bash
node scripts/validate-catalog.mjs
```

## QA

```bash
# catálogo
node --test packages/catalog-schema/tests/*.test.mjs

# storefront (tipos, pruebas y build)
cd apps/storefront && npm ci && npm run lint && npm test && npm run build

# backend (lint y build)
cd apps/backend && npm ci && npm run lint && npm run build

# integración: BD de test aislada, fixtures de framework, servidor real
bash scripts/run-integration-tests.sh
```

Las pruebas de integración usan `medusa_hive_test` y fixtures creados por
`apps/backend/src/scripts/test-fixtures.ts`. **No** tocan el catálogo operativo ni la base de
desarrollo.

## Reglas de trabajo (documentadas, sin enforcement de plataforma)

1. **Sin commits ni push directos a `main`.** Todo cambio entra por rama + pull request.
2. **Cambios a `main` solo por PR**, con **mínimo 1 aprobación** de un miembro elegible. No tiene que
   ser Fabián.
3. **QA obligatorio en el PR hacia `main`**: jobs `catalog-schema`, `storefront` y `backend` en verde,
   y el checklist de la plantilla completado.
4. **Sin force-push ni borrado de `main`.**
5. **Conversaciones del PR resueltas** antes de fusionar.
6. **Nada de reescritura de historia en `main`.**

## Estado real de enforcement

Verificado contra la API de GitHub el **9 de noviembre de 2026** (cuenta `FabianVCha`, plan Free,
repositorio privado):

| Intento | Endpoint | Resultado |
|---|---|---|
| Protección de rama `main` | `PUT /repos/FabianVCha/hive-web/branches/main/protection` | **403** — `Upgrade to GitHub Pro or make this repository public to enable this feature.` |
| Ruleset de repositorio | `POST /repos/FabianVCha/hive-web/rulesets` | **403** — mismo mensaje |

Consecuencia, sin adornos: **ninguna de las reglas de la sección anterior está impuesta por GitHub**.
No hay protección de rama, no hay ruleset, no hay check requerido. Hoy son reglas de disciplina
humana, no de plataforma. GitHub las bloquea por plan en repositorios privados; hacer el repo
público o subir de plan queda **fuera de autorización**.

Lo único impuesto por la plataforma es el QA que el workflow ejecuta y reporta: aparece como check en
cada PR, pero **fusionar con el check en rojo sigue siendo posible**. Requiere revisión humana.

## Colaborador elegible: dato faltante

La regla de "1 aprobación de un miembro elegible" no se puede cumplir hoy: el repositorio tiene un
solo colaborador (`FabianVCha`), y GitHub no permite aprobar el PR propio. Falta definir e invitar a
un segundo revisor elegible; **no se invitó a nadie** por suposición.

## Excepción de bootstrap

El commit `chore: bootstrap static site skeleton` se hizo **directo sobre `main`** el 9 de noviembre
de 2026, con el repositorio vacío y sin rama sobre la cual trabajar. Fue el único commit directo.

## Fuera de alcance en esta fase

Sin pagos, sin SumUp, sin despliegue, sin VPS, sin Pages y sin cambios de plan, visibilidad o gasto.
