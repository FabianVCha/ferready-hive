# Publicar ferready.odelza.com en el túnel

El túnel `odelza` sirve hoy `odelza.com` y `*.odelza.com` apuntando a `127.0.0.1:18300` (Twenty CRM).
Un subdominio nuevo necesita su propia regla **antes** del comodín; si se deja después, el CRM
responde en lugar de la tienda.

## 1. Respaldo y edición

```bash
cp /etc/cloudflared/config.yml /etc/cloudflared/config.yml.bak-$(date +%Y%m%dT%H%M%S)
```

Insertar la regla justo antes de la entrada comodín:

```yaml
ingress:
  - hostname: ferready.odelza.com
    service: http://127.0.0.1:18400
  - hostname: odelza.com
    service: http://127.0.0.1:18300
  - hostname: '*.odelza.com'
    service: http://127.0.0.1:18300
  - service: http_status:404
```

Validar que el YAML sigue siendo válido antes de reiniciar:

```bash
python3 -c "import yaml,sys; yaml.safe_load(open('/etc/cloudflared/config.yml'))" && echo YAML_OK
```

## 2. DNS

Comprobar si el nombre ya resuelve al túnel:

```bash
dig +short ferready.odelza.com
cloudflared tunnel list
```

Si no existe el registro, crearlo apuntando al túnel `odelza`:

```bash
cloudflared tunnel route dns odelza ferready.odelza.com
```

## 3. Aplicar

```bash
systemctl restart cloudflared
systemctl is-active cloudflared
journalctl -u cloudflared --since "2 min ago" --no-pager | tail -20
```

## 4. Verificar

```bash
# La tienda responde y llega al storefront, no al CRM.
curl -sI https://ferready.odelza.com | head -5
curl -s https://ferready.odelza.com | grep -o '<title>[^<]*</title>' | head -1

# Los hostnames que ya existían siguen igual.
curl -sI https://mew.odelza.com | head -3
curl -sI https://morgan.odelza.com | head -3
```

## Reversión

```bash
cp /etc/cloudflared/config.yml.bak-<marca> /etc/cloudflared/config.yml
systemctl restart cloudflared
```

El backup deja el túnel exactamente como estaba: mismo certificado, mismas reglas, mismo DNS.
