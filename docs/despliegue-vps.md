# Despliegue en el VPS mew

La tienda completa corre en el VPS `mew` con Docker Compose y se publica a través de un túnel de
Cloudflare dedicado. No se abre ningún puerto en el firewall: todo escucha en loopback y el túnel
entra por salida.

## Arquitectura

```text
Internet
   │
   ▼
Cloudflare  (túnel "ferready", dedicado, regla solo para ferready.odelza.com)
   │
   ▼
127.0.0.1:18400  storefront (Next.js, contenedor ferready-storefront-1)
                     └── /opt/ferready/media → /app/.../public/project/products (ro)
127.0.0.1:18410  backend    (Medusa API + admin, contenedor ferready-backend-1)
                     │
                     ▼
                 ferready-db (Postgres 16, volumen ferready_db, sin puerto al host)
```

El túnel `ferready` es independiente del túnel `odelza` que sirve el CRM y los agentes: desplegar la
tienda nunca reinicia ese proceso. El storefront habla con el backend por la red interna de Docker
(`http://backend:9000`). El backend solo se publica en loopback para entrar al admin por un túnel
SSH, nunca por Internet.

## Disposición en el servidor

```text
/opt/ferready/repo    clon del repositorio (rama main)
/opt/ferready/media   fotografía de producto, fuera del clon
/etc/cloudflared/ferready.yml                  configuración del túnel dedicado
/etc/systemd/system/cloudflared-ferready.service
/root/ferready-admin.txt                       credenciales del admin (chmod 600)
```

La fotografía **no** puede vivir dentro del clon: el repositorio la ignora
(`apps/storefront/public/project/products/`) y el compose la monta desde el host. Por eso el clon va
en `/opt/ferready/repo` y la media en `/opt/ferready/media`.

## Archivos del repositorio

| Archivo | Para qué |
|---|---|
| `infra/production/docker-compose.yml` | Servicios, puertos, healthchecks, límites y volumen |
| `infra/production/.env.example` | Variables requeridas; se copia a `.env` en el VPS |
| `apps/backend/Dockerfile` | Imagen de Medusa |
| `apps/storefront/Dockerfile` | Imagen de Next.js |
| `.dockerignore` | Deja fuera `node_modules`, `.next`, `.medusa`, `data/research` |

## Primer despliegue

Desde el PC, los dos primeros pasos:

```bash
# 1. Clonar en el VPS
ssh root@31.220.96.107 'mkdir -p /opt/ferready/media && \
  git clone --depth 1 https://github.com/FabianVCha/ferready-hive.git /opt/ferready/repo'

# 2. Copiar la fotografía una sola vez: después vive en el host
rsync -a ~/ferready-media-backup/products/ root@31.220.96.107:/opt/ferready/media/
ssh root@31.220.96.107 'find /opt/ferready/media -type f | wc -l'   # 224
```

En el VPS:

```bash
cd /opt/ferready/repo/infra/production
cp .env.example .env
python3 - <<'PY'
import secrets, pathlib
p = pathlib.Path(".env"); t = p.read_text()
t = t.replace("replace_with_openssl_rand_hex_24", secrets.token_hex(24))
while "replace_with_openssl_rand_hex_32" in t:
    t = t.replace("replace_with_openssl_rand_hex_32", secrets.token_hex(32), 1)
p.write_text(t); p.chmod(0o600)
PY

cd /opt/ferready/repo
docker compose --env-file infra/production/.env -f infra/production/docker-compose.yml up -d --build
```

El servicio `migrate` corre las migraciones antes de que arranque el backend, así que una base nueva
nunca recibe tráfico sin tablas.

Preparar canal, clave publicable y catálogo:

```bash
DC="docker compose --env-file infra/production/.env -f infra/production/docker-compose.yml"
$DC exec -T backend npm --prefix apps/backend run bootstrap:production   # imprime MEDUSA_PUBLISHABLE_KEY
$DC exec -T backend npm --prefix apps/backend run catalog:import         # 45 productos en borrador
```

Guardar la clave en el `.env` del host y reiniciar el storefront:

```bash
sed -i "s|^MEDUSA_PUBLISHABLE_KEY=.*|MEDUSA_PUBLISHABLE_KEY=<valor>|" infra/production/.env
$DC up -d storefront
```

Crear el usuario admin y guardar la credencial fuera del repositorio. El binario vive en
`apps/backend/node_modules/.bin/medusa`, no en la raíz de la imagen:

```bash
PW=$(openssl rand -base64 24 | tr -d "/+=" | head -c 24)
$DC exec -T -e PW="$PW" backend sh -lc 'cd /app/apps/backend && ./node_modules/.bin/medusa user -e admin@ferready.local -p "$PW"'
printf "email=admin@ferready.local\npassword=%s\n" "$PW" > /root/ferready-admin.txt
chmod 600 /root/ferready-admin.txt
```

Por último, publicar el origen y abrir el hostname: ver `docs/cloudflare-ferready.md`.

## Límites de recursos

Cada servicio declara `deploy.resources.limits` (memoria y CPU) más `memswap_limit` igual a su
memoria, para que no pueda empujar swap del host:

| Servicio | Memoria | CPU |
|---|---|---|
| backend | 768 MB | 1.0 |
| storefront | 512 MB | 0.75 |
| db | 384 MB | 1.0 |
| migrate | 1 GB | 1.0 |

Medido en el servidor con la tienda arriba: backend ~230 MB, storefront ~80 MB, base ~65 MB. Si un
contenedor llega a su techo, Docker lo mata y `restart: unless-stopped` lo levanta, sin tocar a los
demás.

## Actualizar la tienda

```bash
cd /opt/ferready/repo
git pull
docker compose --env-file infra/production/.env -f infra/production/docker-compose.yml up -d --build
```

## Operación

- Estado: `$DC ps`
- Logs: `$DC logs -f storefront` (o `backend`, `db`)
- Admin, sin exponerlo a Internet:

```bash
ssh -N -L 18410:127.0.0.1:18410 root@31.220.96.107
# luego abrir http://localhost:18410/app
# usuario admin@ferready.local · contraseña en /root/ferready-admin.txt
```

- Respaldo de la base:

```bash
$DC exec -T db pg_dump -U ferready ferready | gzip > ferready-$(date +%F).sql.gz
```

## Verificación

```bash
# Desde el PC: público y con el título correcto
curl -s -o /dev/null -w '%{http_code}\n' https://ferready.odelza.com
curl -s https://ferready.odelza.com | grep -o '<title>[^<]*</title>' | head -1

# Una foto servida de verdad
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' https://ferready.odelza.com/project/products/truper/100105.jpg

# Desde el VPS: origen y backend
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:18400/
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:18410/health
```

Un `302` significa que Access sigue protegiendo el hostname; un `502` significa que el túnel llega
pero el storefront está caído.

## Limitaciones conocidas

- El pago sigue siendo el proveedor `demo`: no hay cobro ni pedido real.
- Los precios del catálogo aprobado son de referencia; `price_cop` puede ser `null` y entonces la
  ficha pide cotización.
- Los productos importados quedan en borrador: publicarlos es una acción humana en el admin.
- El admin de Medusa no se publica en Internet: se entra por túnel SSH.
- La auditoría de hashes de las fotos no corre en CI, porque la media no se versiona; corre en
  cualquier copia local que tenga `apps/storefront/public/project/products/`.
