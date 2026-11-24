# deploy-ferready-vps

Objetivo: desplegar la tienda completa (storefront Next + backend Medusa + Postgres) en el VPS `mew`
y publicarla en `https://ferready.odelza.com`.
Rama: `feat/ferready-identity`. Entrega: commits por tema en la rama; `main` no se toca.
Runner de verificación: `npm test`, `npm run lint`, `npm run build` en `apps/storefront` y
`apps/backend`, más `docker compose config` y arranque real de las imágenes.

## Specs

- S1. La tienda completa corre en el VPS `mew` con Docker Compose: Postgres, backend Medusa y
  storefront Next, con reinicio automático y sin publicar puertos al exterior.
- S2. La página responde en `https://ferready.odelza.com` a través del túnel Cloudflare existente,
  sin abrir puertos en el firewall del VPS.
- S3. Los secretos (base de datos, JWT, cookie, publishable key) viven solo en el VPS, en un archivo
  con permisos 600; nada de credenciales en git.
- S4. El catálogo aprobado se importa como borradores y existe un usuario admin de Medusa. El
  importador sigue sin publicar nada.
- S5. Los cambios pendientes de la rama quedan en commits separados por tema. `main` no recibe push.
- S6. La documentación del proyecto declara la nueva fase: deja de afirmar que no hay despliegue y
  deja de tratar la demo como no autorizada para hosting público.
- S7. Actualizar la tienda es `git pull` + `docker compose up -d --build`, documentado en un archivo
  de operación.

## Tasks

- T1. Verificar el estado actual (test, lint, build) y corregir lo que falle. Route: inline.
- T2. Commits por tema del trabajo pendiente. Route: inline.
- T3. Dockerfile del backend, Dockerfile del storefront, compose de producción, `.env.example`.
  Route: inline.
- T4. Documentación de fase y de operación (S6, S7). Route: inline.
- T5. Construir las imágenes en local y hacer smoke test real (arranque + HTTP 200 + import).
  Route: inline.
- T6. Llevar el código al VPS y ejecutar el primer arranque (migraciones, admin, publishable key,
  import del catálogo). Route: inline, requiere passphrase del usuario.
- T7. Regla del túnel Cloudflare para `ferready.odelza.com`, reinicio de `cloudflared` y verificación
  pública. Route: inline + verificador independiente (riesgo alto: comparte túnel con el CRM).
- T8. Registrar la intervención en `~/docs/vps-mew/11-registro-de-cambios.md`. Route: inline.

## Log

- L1 (2026-11-24, petición original): "kyara necesito ayuda para saber como puedo desplegar en el
  VPS una pagina nueva de ferreterias porfavor, el proyecto es el de ferready-hive que esta en este
  PC aca ~/projects/ferready-hive:feat/ferready-identity"
- L2 (2026-11-24, decisión de alcance): "los servicios completo de la tienda nueva, pero quisiera
  que todo este despelgado asi no se use"
- L3 (2026-11-24, dominio): "ferready.odelza.com"
- L4 (2026-11-24, commits): "Dividir en varios commits por tema antes de desplegar"
- L5 (2026-11-24, hallazgo): el estado de partida tiene 97 archivos sin commitear y la rama no
  existe en `origin`. `README.md` y `PROTOTYPE.md` declaran que no hay despliegue autorizado; S6
  cubre esa corrección. Sin commit y push, el VPS no puede recibir el trabajo.
