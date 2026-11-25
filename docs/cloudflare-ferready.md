# Publicar ferready.odelza.com

La tienda usa un túnel **dedicado** llamado `ferready`. El túnel `odelza` sigue sirviendo
`odelza.com`, `*.odelza.com` y el resto de subdominios hacia `127.0.0.1:18300` (Twenty CRM), y no se
toca: crear o reiniciar el túnel de la tienda nunca afecta al CRM ni a los agentes.

## 1. Crear el túnel (una sola vez)

`/root/.cloudflared/cert.pem` ya autoriza la cuenta en el servidor:

```bash
cloudflared tunnel create ferready
# Created tunnel ferready with id <UUID>
```

## 2. Configuración y servicio

`/etc/cloudflared/ferready.yml`, con permisos `600`:

```yaml
tunnel: <UUID>
credentials-file: /root/.cloudflared/<UUID>.json

ingress:
  - hostname: ferready.odelza.com
    service: http://127.0.0.1:18400
  - service: http_status:404
```

Validar y levantar la unidad propia (no se reinicia `cloudflared`):

```bash
cloudflared tunnel ingress validate --config /etc/cloudflared/ferready.yml
systemctl daemon-reload
systemctl enable --now cloudflared-ferready
systemctl is-active cloudflared-ferready          # active
journalctl -u cloudflared-ferready --since "2 min ago" --no-pager | grep -c "Registered tunnel connection"
```

## 3. DNS: apuntar al túnel correcto

El comodín `*.odelza.com` ya existe y apunta al túnel `odelza`; el nombre de la tienda necesita su
propio registro explícito.

```bash
cloudflared tunnel route dns ferready ferready.odelza.com
```

**Trampa comprobada:** con la versión instalada (2026.7.3) ese comando escribió el CNAME apuntando
al túnel `odelza` (`4f35f51b…`) en vez de al nuevo. Comprobar siempre a qué túnel quedó apuntando:

```bash
dig +short CNAME ferready.odelza.com     # debe ser <UUID nuevo>.cfargotunnel.com
```

Si quedó apuntando al túnel equivocado, corregirlo con la API (o recrear el registro) hacia
`<UUID nuevo>.cfargotunnel.com`, proxied. El comodín debe seguir intacto.

## 4. Access: abrir el hostname

Existe la aplicación `*.odelza.com` ("Odelza Unknown Subdomains") que exige autenticación a todo
subdominio no listado. La tienda debe ser pública, así que tiene su propia aplicación, que gana por
ser más específica:

```text
Aplicación:  Odelza Ferready
Dominio:     ferready.odelza.com
Política:    Bypass tienda publica · decision=bypass · include=[everyone]
```

Ni la aplicación comodín ni sus políticas se modifican. Con el bypass, la respuesta deja de ser un
`302` al login de Access.

## 5. Verificar

```bash
# Público, sin login, y sirviendo el storefront (no el CRM)
curl -s -o /dev/null -w '%{http_code}\n' https://ferready.odelza.com
curl -s https://ferready.odelza.com | grep -o '<title>[^<]*</title>' | head -1

# Foto servida desde /opt/ferready/media
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' https://ferready.odelza.com/project/products/truper/100105.jpg

# Los hostnames que ya existían siguen igual
curl -s -o /dev/null -w 'mew %{http_code}\n' https://mew.odelza.com
curl -s -o /dev/null -w 'morgan %{http_code}\n' https://morgan.odelza.com
```

Lectura de códigos: `200` correcto · `302` sigue el login de Access · `502` el túnel llega pero el
storefront está caído · `404` el túnel no tiene regla para ese hostname.

## Reversión

```bash
systemctl disable --now cloudflared-ferready
```

Después: borrar la aplicación `Odelza Ferready` en Access y el registro CNAME
`ferready.odelza.com`. El túnel `odelza` nunca se modificó, así que no hay nada que restaurar en él.
