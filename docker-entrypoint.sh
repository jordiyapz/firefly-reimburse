#!/bin/sh
envsubst '${FIREFLY_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Inject VITE_FIREFLY_URL into index.html at runtime if set
if [ -n "$VITE_FIREFLY_URL" ]; then
  sed -i "s|</body>|<script>window.__VITE_FIREFLY_URL__='$VITE_FIREFLY_URL'</script></body>|" /usr/share/nginx/html/index.html
fi

nginx -g 'daemon off;'
