# Finance Tracker

Monorepo:
- `backend/`: Spring Boot 3 (Java 17) REST API
- `frontend/`: React 18 + Vite + Tailwind CSS web app
- `docker-compose.yml`: Postgres + API + web

## Prereqs (local dev)
- Java 17
- Maven 3.9+
- Node.js 20+ (for frontend)
- Docker Desktop (optional, for Postgres/containers)

## Run with Docker (recommended)

```bash
cd finance-tracker
docker compose up --build
```

- API: `http://localhost:8080`
- Web: `http://localhost:5173`
- Postgres: `localhost:5432` (db `fintrack`, user `fintrack`, password `fintrack`)

### First-time build notes
- The `web` image build needs internet access to download npm packages.
- If you deploy on an Oracle VM, install Docker first (steps below), then run `docker compose up -d --build`.

### Single-user login (JWT)
- This project runs in **single-user mode**.
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (in `docker-compose.yml` or your VM environment).
- Login via the UI at `/login`. There is **no public registration** endpoint.

## Run backend locally (without Docker)

1) Start Postgres (or use Docker):

```bash
docker compose up -d db
```

2) Run API:

```bash
cd backend
mvn spring-boot:run
```

## Run frontend locally (without Docker)

```bash
cd frontend
npm install
npm run dev
```

## Oracle Cloud Always Free VM (Docker Compose)

- **VM sizing**: Always Free instances are small; builds can be slow. If needed, build images on your laptop and push to a registry later.
- **Open ports**: In OCI security lists/NSGs, allow inbound **80** (and optionally **443**).
- **Install Docker (Ubuntu)**:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

- **Deploy**: Copy this repo to the VM, then:

```bash
docker compose up -d --build
```

If you want HTTPS, add a reverse proxy (Caddy or Nginx) + certs.

