# hh-signup-bot

Registers a LTD account on hh.ru automatically in 20 seconds

## Installation

```bash
sudo docker compose up
```

## Running without proxy

```bash
sudo docker run -it playwright-docker:latest npm start
```

## Running with proxy

### Not authenticated

```bash
sudo docker run \
-e PROXY_HOST='example.com' \
-e PROXY_PORT='1234' npm start \
-it playwright-docker:latest \
npm start
```

### Authenticated

#### With password

```bash
sudo docker run \
-e PROXY_HOST='example.com' \
-e PROXY_PORT='1234' \
-e PROXY_USERNAME='username' \
-e PROXY_PASSWORD='password' \
-it playwright-docker:latest \
npm start
```

#### Without password

```bash
sudo docker run \
-e PROXY_HOST='example.com' \
-e PROXY_PORT='1234' \
-e PROXY_USERNAME='username' \
-it playwright-docker:latest \
npm start
```
