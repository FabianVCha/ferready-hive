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

- T1. [hecho] Verificar el estado actual (test, lint, build). Route: inline. Evidencia: 48 tests
  storefront, 13 tests schema, typecheck backend y ambos builds en verde.
- T2. [hecho] Commits por tema del trabajo pendiente. Route: inline. Evidencia: 7 commits, de
  `chore(repo)` a `docs(odd)`, con el árbol limpio y `data/research/` fuera de git.
- T3. [hecho] Dockerfile del backend, Dockerfile del storefront, compose de producción,
  `.env.example`, script de bootstrap. Route: inline.
- T4. [hecho] Documentación de fase y de operación (S6, S7). Route: inline.
- T5. [hecho] Imágenes construidas y stack real levantado: los tres servicios `healthy`, tienda con
  200 y título Ferready, catálogo con productos reales, admin 200, bootstrap emitiendo clave,
  import de 45 borradores. Route: inline.
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
- L6 (2026-11-24, verificación T5): hallazgos corregidos, todos encontrados solo al construir en
  limpio. (a) `node:22` rompe el prerender de Next 16; se usa `node:24`. (b) `NODE_ENV=development`
  durante `next build` también lo rompe; las devDependencies se instalan con `--include=dev` en vez
  de fijar el entorno. (c) `npm ci` fallaba porque el lock no traía las dependencias opcionales de
  otras plataformas; se regeneró con `--package-lock-only --include=optional`. (d) Medusa agotaba el
  pool de 10 conexiones al migrar; `medusa-config.ts` fija `DB_POOL_MAX` (20 por defecto). (e)
  `medusa start` sirve el admin relativo al cwd: el contenedor arranca desde `.medusa/server`.
- L7 (2026-11-24, push): "Sí, sube la rama feat/ferready-identity (main no se toca)". Rama subida a
  origin con seguimiento; main intacto.
- L8 (2026-11-24, bloqueo): el socket `/tmp/ssh-agent-kyara.sock` no existe, así que el VPS rechaza
  la llave. T6 y T7 esperan que el usuario ejecute `bash ~/unlock-vps-key.sh`.- L9 (2026-11-24, decisión de visibilidad): "haz eel repo publico porfavor" y, ante el riesgo
  detectado, "Publicarlo pero sacando antes las fotos de producto del repo". Las 224 fotos del
  catálogo (89 MB) se eliminaron de todo el historial con `git filter-repo` y force-push; quedan en
  el host del VPS, montadas de solo lectura en `/opt/ferready/media`. El repo es público: un clon
  anónimo trae 0 fotos. `main` no cambió.
