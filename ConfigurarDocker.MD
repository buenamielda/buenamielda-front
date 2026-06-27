# Docker - Puesta en marcha de BuenaMielda

# 1. Crear la red Docker

La red permitirá que los tres contenedores se comuniquen entre sí mediante su nombre.

```bash
docker network create buenamielda-network
```

Comprobar que existe:

```bash
docker network ls
```

---

# 2. Crear el contenedor de PostgreSQL

Si todavía no existe:

```bash
docker run -d \
  --name postgres-buenamielda \
  --network buenamielda-network \
  -e POSTGRES_DB=buenamielda \
  -e POSTGRES_USER=buenamielda \
  -e POSTGRES_PASSWORD=buenamielda \
  -p 5432:5432 \
  postgres
```

Comprobar que está funcionando:

```bash
docker ps
```

---

# 3. Si PostgreSQL ya existe

Si el contenedor ya estaba creado y funcionando:

```bash
docker network connect buenamielda-network postgres-buenamielda
```

Comprobar las redes del contenedor:

```bash
docker inspect postgres-buenamielda --format='{{json .NetworkSettings.Networks}}'
```

Debe aparecer:

* bridge
* buenamielda-network

---

# 4. Arrancar el Backend

Entrar en el proyecto:

```bash
cd buenamielda-back
```

Construir y arrancar:

```bash
docker compose up -d --build
```

Ver los logs:

```bash
docker logs -f buenamielda-back
```

Entrar en el contenedor:

```bash
docker exec -it buenamielda-back sh
```

---

# 5. Arrancar el Frontend

Entrar en el proyecto:

```bash
cd buenamielda-front
```

Construir y arrancar:

```bash
docker compose up -d --build
```

Ver los logs:

```bash
docker logs -f buenamielda-front
```

Entrar en el contenedor:

```bash
docker exec -it buenamielda-front sh
```

---

# 6. Comprobar los contenedores

Mostrar los contenedores activos:

```bash
docker ps
```

Deberían aparecer:

```
postgres-buenamielda
buenamielda-back
buenamielda-front
```

---

# 7. Comprobar la red

```bash
docker network inspect buenamielda-network
```

Deben aparecer los tres contenedores conectados.

---

# 8. URLs de acceso

Frontend

```
http://localhost:4200
```

Backend

```
http://localhost:8080
```

PostgreSQL

```
Host: localhost
Puerto: 5432
Base de datos: buenamielda
Usuario: buenamielda
Contraseña: buenamielda
```

---

# Arquitectura

```
                    Navegador
                         │
                         ▼
               http://localhost:4200
                         │
                         ▼
                  Nginx (Angular)
                         │
                  /api/*
                         │
                         ▼
           buenamielda-back:8080
                         │
                         ▼
      postgres-buenamielda:5432
```

El navegador únicamente accede al frontend.

Las peticiones a `/api/**` son redirigidas por Nginx al backend.

El backend accede a PostgreSQL utilizando el nombre del contenedor:

```
jdbc:postgresql://postgres-buenamielda:5432/buenamielda
```
