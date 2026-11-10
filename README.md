# hive-web

Sitio web estático mínimo del proyecto web personal de Fabián. Contenido neutro: este repositorio
solo aporta estructura, reglas de trabajo y QA; no define requisitos de producto.

- **Visibilidad**: privada. No hacerla pública sin autorización explícita de Fabián.
- **Rama por defecto**: `main`.

## Estructura

```text
.
├── index.html                       # única página
├── assets/
│   ├── styles.css                   # estilos base
│   └── app.js                       # script mínimo (marca el documento como interactivo)
├── tests/site.test.mjs              # pruebas de humo con el runner nativo de Node
├── .github/workflows/qa.yml         # QA en cada pull request
├── .github/pull_request_template.md # checklist de QA para PR
└── package.json                     # scripts lint/test
```

## QA

Local:

```bash
npm ci
npm run lint   # html-validate sobre index.html
npm test       # pruebas de humo sobre los archivos reales del sitio
```

En CI, el workflow `QA` corre `lint` y `test` en cada pull request y en `workflow_dispatch`.
Nombre del check: **`QA / lint-and-test`**.

Las pruebas verifican hechos del código que existe: doctype y `lang`, `<title>` no vacío, un solo
`<h1>`, que cada `href`/`src` local apunte a un archivo existente y que no queden marcadores de
conflicto de merge.

## Reglas de trabajo (propuestas, documentadas)

1. **Sin commits ni push directos a `main`.** Todo cambio entra por rama + pull request.
2. **Cambios a `main` solo por PR**, con **mínimo 1 aprobación** de un miembro elegible. No tiene que
   ser Fabián.
3. **QA obligatorio en el PR hacia `main`**: `lint` y `test` en verde, y el checklist de la plantilla
   completado.
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
de 2026. Motivo: el repositorio estaba vacío y sin primer commit no existe rama `main` sobre la cual
crear una rama de trabajo o aplicar reglas. Fue el único commit directo; a partir de aquí todo entra
por rama y PR.

## Fuera de alcance

Sin despliegue, sin VPS, sin Pages y sin cambios de plan, visibilidad o gasto.
