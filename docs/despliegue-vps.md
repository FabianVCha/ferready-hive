# Despliegue en el VPS mew

La tienda completa corre en el VPS `mew` con Docker Compose y se publica a través del túnel de
Cloudflare. No se abre ningún puerto en el firewall: todo escucha en loopback y el túnel entra por
salida.

## Arquitectura

```text
Internet
   │
   ▼
Cloudflare  (túnel "odelza", regla para ferready.odelza.com)
   │
   ▼
127.0.0.1:18400  storefront (Next.js, contenedor ferready-storefront-1)
127.0.0.1:18410  backend    (Medusa API + admin, contenedor ferready-backend-1)
                     │
                     ▼
                 ferready-db (Postgres 16, volumen ferready_db, sin puerto al host)
```

El storefront habla con el backend por la red interna de Docker (`http://backend:9000`). El backend
solo se publica en loopback para poder entrar al admin por un túnel SSH, nunca por Internet.

## Archivos

| Archivo | Para qué |
|---|---|
| `infra/production/docker-compose.yml` | Servicios, puertos, healthchecks y volumen |
| `infra/production/.env.example` | Variables requeridas; se copia a `.env` en el VPS |
| `apps/backend/Dockerfile` | Imagen de Medusa |
| `apps/storefront/Dockerfile` | Imagen de Next.js |
| `.dockerignore` | Deja fuera `node_modules`, `.next`, `.medusa`, `data/research` |

## Primer despliegue

1. En el VPS, clonar el repositorio en `/opt/ferready` (llave de solo lectura).

2. Crear el archivo de entorno:

```bash
cd /opt/ferready/infra/production
cp .env.example .env
sed -i "s|replace_with_openssl_rand_hex_24|$(openssl rand -hex 24)|" .env
sed -i "s|replace_with_openssl_rand_hex_32|$(openssl rand -hex 32)|g" .env
chmod 600 .env
```

3. Construir y levantar:

```bash
cd /opt/ferready
docker compose --env-file infra/production/.env -f infra/production/docker-compose.yml up -d --build
```

4. Preparar el canal de venta, la clave publicable y el catálogo. Las migraciones no se piden a
mano: el servicio `migrate` las corre en cada `up` antes de que arranque el backend.

```bash
docker compose ... exec backend npm --prefix apps/backend run bootstrap:production
docker compose ... exec backend npm --prefix apps/backend run catalog:import
```

El bootstrap imprime `MEDUSA_PUBLISHABLE_KEY=...`. Copiarlo al `.env` del host y reiniciar el
storefront:

```bash
sed -i "s|^MEDUSA_PUBLISHABLE_KEY=.*|MEDUSA_PUBLISHABLE_KEY=<valor>|" infra/production/.env
docker compose ... up -d storefront
```

5. Crear el usuario admin (una sola vez):

```bash
docker compose ... exec backend npx medusa user -e admin@ferready.local -p '<password>'
```

6. Publicar el origen en Cloudflare: ver `docs/cloudflare-ferready.md`.

## Actualizar la tienda

```bash
cd /opt/ferready
git pull
docker compose --env-file infra/production/.env -f infra/production/docker-compose.yml up -d --build
```

El servicio `migrate` corre `db:migrate` antes del backend en cada `up`, y es idempotente: solo
aplica migraciones nuevas. El importador de catálogo también es
idempotente y **nunca publica**: los productos quedan en borrador hasta que una persona los publique
desde el admin.

## Operación

- Estado: `docker compose ... ps`
- Logs: `docker compose ... logs -f storefront` (o `backend`, `db`)
- Admin, sin exponerlo a Internet:

```bash
ssh -N -L 18410:127.0.0.1:18410 root@31.220.96.107
# luego abrir http://localhost:18410/app
```

- Respaldo de la base:

```bash
docker compose ... exec -T db pg_dump -U ferready ferready | gzip > ferready-$(date +%F).sql.gz
```

## Verificación

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://ferready.odelza.com
docker compose ... exec backend node -e "fetch('http://127.0.0.1:9000/health').then(r=>console.log(r.status))"
```

## Limitaciones conocidas

- El pago sigue siendo el proveedor `demo`: no hay cobro ni pedido real.
- Los precios del catálogo aprobado son de referencia; `price_cop` puede ser `null` y entonces la
  ficha pide cotización.
- Las páginas de la demo (`FERREADY_DEMO=1`) siguen marcadas `noindex`. El sitio de producción no usa
  ese modo y no lleva `noindex`.
- El admin de Medusa no se publica en Internet: se entra por túnel SSH.
