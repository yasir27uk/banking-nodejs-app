# Jenkins Setup Guide — Banking Node.js CI/CD Pipeline
## From Scratch: Local Docker-based Jenkins + Nexus + Banking App

---

## Overview

This guide sets up a fully working local CI/CD pipeline that mirrors an enterprise banking environment:

```
GitHub Repo ──► Jenkins (Docker) ──► Nexus Registry (Docker)
                     │
                     ├── npm audit
                     ├── Semgrep SAST + ESLint Security
                     ├── Unit Tests + Coverage Gate (80%)
                     ├── Integration Tests
                     ├── Docker Build (multi-stage hardened)
                     ├── OWASP Dependency-Check (optional)
                     ├── Trivy Container Scan
                     ├── ZAP DAST (optional)
                     └── Smoke Tests (health-check assertions)
```

**What runs locally vs what is skipped by default:**

| Component | Local Status | Reason |
|-----------|-------------|--------|
| Jenkins + Agents | Running in Docker | Core infra |
| Nexus Docker Registry | Running in Docker | Image storage |
| OWASP Dependency-Check | `SKIP_OWASP=true` | Downloads ~350K CVE records (~30 min) |
| DAST / ZAP | `SKIP_DAST=true` | Needs live URL target |
| FOSSA Licence | `SKIP_FOSSA=true` | Requires paid API key |
| K8s Deploy | `SKIP_K8S_DEPLOY=true` | No Kubernetes locally |
| Slack notifications | Optional | Needs webhook URL |

---

## Prerequisites

### Required Software

| Tool | Minimum Version | Check |
|------|----------------|-------|
| Docker Desktop | 4.x | `docker --version` |
| Docker Compose | v2.x (bundled with Desktop) | `docker compose version` |
| Git | 2.x | `git --version` |
| 8 GB RAM | Available to Docker | Docker Desktop → Resources |

### Required Ports (must be free)

| Port | Service |
|------|---------|
| 8080 | Jenkins web UI |
| 50000 | Jenkins JNLP agent |
| 80 | Nexus HTTP (Docker registry) |
| 8081 | Nexus web UI |

Check nothing is using these ports:

```bash
# macOS / Linux
lsof -i :8080,50000,80,8081

# Windows PowerShell
netstat -ano | findstr "8080 50000 8081"
```

---

## Part 1 — Directory Structure

Create a clean working directory for all infrastructure:

```bash
mkdir -p ~/jenkins-infra/{jenkins_home,nexus-data,casc}
cd ~/jenkins-infra
```

Your final structure will look like:

```
~/jenkins-infra/
├── docker-compose.yml          # Jenkins + Nexus + Agents
├── jenkins_home/               # Jenkins persistent data (auto-created)
├── nexus-data/                 # Nexus persistent data (auto-created)
└── casc/
    └── jenkins.yaml            # Jenkins Configuration as Code
```

---

## Part 2 — Jenkins Configuration as Code (JCasC)

Create the JCasC config file. This pre-configures Jenkins with credentials, agents, and the pipeline job automatically on first boot.

```bash
cat > ~/jenkins-infra/casc/jenkins.yaml << 'EOF'
jenkins:
  systemMessage: "Banking CI/CD Jenkins — Local Docker Edition"
  numExecutors: 0
  mode: EXCLUSIVE
  slaveAgentPort: 50000

  securityRealm:
    local:
      allowsSignup: false
      users:
        - id: "admin"
          name: "Administrator"
          password: "${JENKINS_ADMIN_PASSWORD:-admin123}"

  authorizationStrategy:
    loggedInUsersCanDoAnything:
      allowAnonymousRead: false

  nodes:
    - permanent:
        name: "docker-agent-1"
        labelString: "docker linux build"
        remoteFS: "/home/jenkins/agent"
        numExecutors: 4
        mode: NORMAL
        retentionStrategy: "always"
        launcher:
          inbound:
            workDirSettings:
              disabled: false
              workDirPath: "/home/jenkins/agent"
              internalDir: "remoting"
              failIfWorkDirIsMissing: false
    - permanent:
        name: "docker-agent-2"
        labelString: "docker linux build test"
        remoteFS: "/home/jenkins/agent"
        numExecutors: 4
        mode: NORMAL
        retentionStrategy: "always"
        launcher:
          inbound:
            workDirSettings:
              disabled: false
              workDirPath: "/home/jenkins/agent"
              internalDir: "remoting"
              failIfWorkDirIsMissing: false

  globalNodeProperties:
    - envVars:
        env:
          - key: "NEXUS_URL"
            value: "localhost:80"
          - key: "ENVIRONMENT"
            value: "local"

  remotingSecurity:
    enabled: true

credentials:
  system:
    domainCredentials:
      - credentials:
          - usernamePassword:
              scope: GLOBAL
              id: "nexus-credentials"
              description: "Nexus Docker Registry"
              username: "admin"
              password: "${NEXUS_PASSWORD:-admin123}"
          - string:
              scope: GLOBAL
              id: "nvd-api-key"
              description: "NIST NVD API key (optional — speeds OWASP 10x)"
              secret: "${NVD_API_KEY:-}"
          - string:
              scope: GLOBAL
              id: "slack-webhook"
              description: "Slack Incoming Webhook (optional)"
              secret: "${SLACK_WEBHOOK_URL:-}"

security:
  globalJobDslSecurityConfiguration:
    useScriptSecurity: false

unclassified:
  location:
    url: "http://localhost:8080/"
    adminAddress: "admin@local"

  scmGit:
    globalConfigName: "Jenkins CI"
    globalConfigEmail: "jenkins@local"

  globalDefaultFlowDurabilityLevel:
    durabilityHint: PERFORMANCE_OPTIMIZED

  timestamperConfig:
    allPipelines: true

tool:
  git:
    installations:
      - name: "Default"
        home: "git"

jobs:
  - script: |
      folder('banking') {
        description('Banking platform projects')
      }
      pipelineJob('banking/banking-nodejs-app') {
        description('Banking Node.js API — Enterprise CI/CD Pipeline')
        logRotator { numToKeep(20); artifactNumToKeep(10) }
        properties {
          disableConcurrentBuilds { abortPrevious(true) }
        }
        triggers { scm('H/5 * * * *') }
        parameters {
          choiceParam('DEPLOY_ENV', ['dev', 'staging', 'production'], 'Target environment')
          booleanParam('SKIP_OWASP',      true,  'Skip OWASP Dependency-Check')
          booleanParam('SKIP_DAST',       true,  'Skip ZAP DAST scan')
          booleanParam('SKIP_FOSSA',      true,  'Skip FOSSA licence scan')
          booleanParam('SKIP_K8S_DEPLOY', true,  'Skip K8s deploy')
          booleanParam('PUSH_TO_NEXUS',   true,  'Push image to Nexus')
          booleanParam('FORCE_DEPLOY',    false, 'Force deploy on scan warnings')
          stringParam('IMAGE_TAG_OVERRIDE', 'latest', 'Image tag override')
          stringParam('NOTIFY_EMAIL', '', 'Email for build results (blank = off)')
        }
        definition {
          cpsScm {
            scm {
              git {
                remote {
                  url('https://github.com/yasir27uk/banking-nodejs-app.git')
                }
                branch('*/main')
              }
            }
            scriptPath('Jenkinsfile')
            lightweight(true)
          }
        }
      }
EOF
```

> **Tip:** Replace the GitHub URL with your own repo URL before proceeding.

---

## Part 3 — Docker Compose

Create the main `docker-compose.yml` that runs Jenkins, two build agents, and Nexus:

```bash
cat > ~/jenkins-infra/docker-compose.yml << 'EOF'
version: "3.8"

services:

  # ── Jenkins Controller ─────────────────────────────────────────────────────
  jenkins:
    image: jenkins/jenkins:lts-jdk21
    container_name: jenkins
    hostname: jenkins
    restart: unless-stopped
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - ./casc:/var/jenkins_home/casc:ro
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      CASC_JENKINS_CONFIG: /var/jenkins_home/casc/jenkins.yaml
      JENKINS_ADMIN_PASSWORD: admin123
      NEXUS_PASSWORD: admin123
      NVD_API_KEY: ""
      SLACK_WEBHOOK_URL: ""
      JAVA_OPTS: >-
        -Djenkins.install.runSetupWizard=false
        -Dhudson.security.csrf.DefaultCrumbIssuer.EXCLUDE_SESSION_ID=true
    networks:
      - cicd

  # ── Jenkins Agent 1 ────────────────────────────────────────────────────────
  jenkins-agent-1:
    image: jenkins/inbound-agent:latest-jdk21
    container_name: jenkins-agent-1
    hostname: jenkins-agent-1
    restart: unless-stopped
    depends_on:
      - jenkins
    volumes:
      - agent1_workspace:/home/jenkins/agent
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      JENKINS_URL: http://jenkins:8080
      JENKINS_AGENT_NAME: docker-agent-1
      JENKINS_SECRET: "${AGENT1_SECRET}"
      JENKINS_AGENT_WORKDIR: /home/jenkins/agent
    networks:
      - cicd

  # ── Jenkins Agent 2 ────────────────────────────────────────────────────────
  jenkins-agent-2:
    image: jenkins/inbound-agent:latest-jdk21
    container_name: jenkins-agent-2
    hostname: jenkins-agent-2
    restart: unless-stopped
    depends_on:
      - jenkins
    volumes:
      - agent2_workspace:/home/jenkins/agent
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      JENKINS_URL: http://jenkins:8080
      JENKINS_AGENT_NAME: docker-agent-2
      JENKINS_SECRET: "${AGENT2_SECRET}"
      JENKINS_AGENT_WORKDIR: /home/jenkins/agent
    networks:
      - cicd

  # ── Nexus Repository Manager ───────────────────────────────────────────────
  nexus:
    image: sonatype/nexus3:latest
    container_name: nexus
    hostname: nexus
    restart: unless-stopped
    ports:
      - "8081:8081"    # Nexus web UI
      - "80:8082"      # Docker registry HTTP connector
    volumes:
      - nexus_data:/nexus-data
    environment:
      INSTALL4J_ADD_VM_PARAMS: "-Xms1g -Xmx2g -XX:MaxDirectMemorySize=3g"
    networks:
      - cicd

volumes:
  jenkins_home:
  agent1_workspace:
  agent2_workspace:
  nexus_data:

networks:
  cicd:
    driver: bridge
EOF
```

---

## Part 4 — Install Jenkins Plugins

Jenkins needs specific plugins before starting. Create a `plugins.txt` file:

```bash
cat > ~/jenkins-infra/plugins.txt << 'EOF'
configuration-as-code
job-dsl
workflow-aggregator
pipeline-stage-view
git
github
credentials-binding
ansicolor
timestamper
ws-cleanup
publish-over-ssh
junit
htmlpublisher
email-ext
docker-workflow
docker-plugin
EOF
```

Build a custom Jenkins image with all plugins pre-installed:

```bash
cat > ~/jenkins-infra/Dockerfile.jenkins << 'EOF'
FROM jenkins/jenkins:lts-jdk21
USER root
RUN apt-get update && apt-get install -y docker.io curl && rm -rf /var/lib/apt/lists/*
USER jenkins
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
EOF
```

Update your `docker-compose.yml` to build instead of pull Jenkins:

```yaml
# In docker-compose.yml, replace the jenkins service image line with:
  jenkins:
    build:
      context: .
      dockerfile: Dockerfile.jenkins
    # remove the: image: jenkins/jenkins:lts-jdk21 line
```

---

## Part 5 — First Boot (Jenkins Only)

Start Jenkins and Nexus first — **without agents** — to get agent secrets:

```bash
cd ~/jenkins-infra

# Start Jenkins + Nexus only (agents need secrets first)
docker compose up -d jenkins nexus

# Watch Jenkins boot logs
docker logs -f jenkins
```

Wait until you see:

```
INFO    jenkins.InitReactorRunner$1#onAttained: Completed initialization
```

This takes **2–4 minutes** on first boot (plugin installation).

---

## Part 6 — Configure Nexus

### 6.1 Get the initial Nexus admin password

```bash
docker exec nexus cat /nexus-data/admin.password
# e.g.: a1b2c3d4-e5f6-...
```

### 6.2 Open Nexus UI

Open [http://localhost:8081](http://localhost:8081) in your browser.

1. Click **Sign in** (top right)
2. Username: `admin` / Password: *(the value from step 6.1)*
3. Complete the setup wizard — set your admin password to `admin123` (or whatever you set in `NEXUS_PASSWORD`)
4. When asked about anonymous access — choose **Disable**

### 6.3 Enable the Docker Bearer Token realm

1. Go to **Administration** (gear icon) → **Security** → **Realms**
2. Move **Docker Bearer Token Realm** from Available to Active
3. Click **Save**

### 6.4 Create a Docker hosted repository

1. Go to **Administration** → **Repositories** → **Create repository**
2. Select **docker (hosted)**
3. Fill in:
   - **Name:** `docker-hosted`
   - **HTTP port:** `8082` (maps to host port 80)
   - **Allow anonymous docker pull:** unchecked
   - **Deployment policy:** Allow redeploy
4. Click **Create repository**

### 6.5 Configure the Docker connector

1. Go to **Administration** → **System** → **Capabilities**
2. Click **New capability** → select **Docker Connector**
3. Enable with port `8082`
4. Save

### 6.6 Verify Nexus is reachable as a Docker registry

```bash
# Test the Docker registry endpoint (should return 200)
curl -I http://localhost:80/v2/

# Login to confirm credentials work
echo "admin123" | docker login localhost:80 --username admin --password-stdin
```

Expected output: `Login Succeeded`

---

## Part 7 — Retrieve Agent Secrets

With Jenkins running, get the JNLP secrets for both agents. These are generated by Jenkins when it creates the agent nodes via JCasC.

### 7.1 Open Jenkins UI

Open [http://localhost:8080](http://localhost:8080) — login with `admin` / `admin123`

### 7.2 Get agent secrets via Jenkins script console

Go to **Manage Jenkins** → **Script Console** and run:

```groovy
// Get docker-agent-1 secret
println jenkins.model.Jenkins.instance
  .getNode("docker-agent-1")
  .computer
  .jnlpMac
```

Run again replacing `docker-agent-1` with `docker-agent-2`.

Copy both secrets.

### 7.3 Alternative — get secrets via CLI

```bash
# Get agent-1 secret
docker exec jenkins bash -c \
  "cat /var/jenkins_home/secrets/slave-to-master-security-kill-switch 2>/dev/null; \
   ls /var/jenkins_home/nodes/docker-agent-1/"

# Or via Jenkins API (with curl)
JENKINS_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASS="admin123"

curl -s -u "${ADMIN_USER}:${ADMIN_PASS}" \
  "${JENKINS_URL}/computer/docker-agent-1/slave-agent.jnlp" | \
  grep -o 'secret="[^"]*"'
```

---

## Part 8 — Start Agents

Create an `.env` file with the agent secrets:

```bash
cat > ~/jenkins-infra/.env << 'EOF'
AGENT1_SECRET=<paste-docker-agent-1-secret-here>
AGENT2_SECRET=<paste-docker-agent-2-secret-here>
NEXUS_PASSWORD=admin123
JENKINS_ADMIN_PASSWORD=admin123
EOF
```

Now start the agents:

```bash
docker compose up -d jenkins-agent-1 jenkins-agent-2

# Verify agents connected
docker logs jenkins-agent-1 | tail -5
docker logs jenkins-agent-2 | tail -5
```

Expected output (per agent):

```
INFO: Connected
```

Verify in Jenkins UI: **Manage Jenkins** → **Nodes** — both agents should show green.

---

## Part 9 — Add Jenkins Credentials

The Jenkinsfile requires two credentials. JCasC created them automatically, but verify:

1. Go to **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
2. You should see:
   - `nexus-credentials` — Username/Password
   - `nvd-api-key` — Secret text (can be empty)
   - `slack-webhook` — Secret text (can be empty)

If missing, add manually:

### nexus-credentials

- Kind: **Username with password**
- Scope: Global
- Username: `admin`
- Password: `admin123`
- ID: `nexus-credentials`

### nvd-api-key (optional but recommended)

Get a free key at [https://nvd.nist.gov/developers/request-an-api-key](https://nvd.nist.gov/developers/request-an-api-key)

- Kind: **Secret text**
- Secret: *(your NVD API key)*
- ID: `nvd-api-key`

---

## Part 10 — Set Up the Pipeline Job

### Option A — Auto-created by JCasC (recommended)

If the JCasC `jenkins.yaml` above was loaded correctly, the job `banking/banking-nodejs-app` was already created. Verify:

1. Jenkins dashboard → folder **banking** → **banking-nodejs-app**

If it exists, skip to Part 11.

### Option B — Create manually via UI

1. Jenkins dashboard → **New Item**
2. Name: `banking-nodejs-app`
3. Type: **Pipeline** → OK
4. Under **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/yasir27uk/banking-nodejs-app.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
5. Under **Build Triggers**: check **Poll SCM** → Schedule: `H/5 * * * *`
6. Save

### Option C — If using a private/local Git repo

```bash
# Push the project to a local Gitea or GitLab, then use that URL
# Or configure Jenkins to watch the local filesystem

# For testing with a local path (no SCM polling):
# In the Pipeline definition choose "Pipeline script" and paste the Jenkinsfile content
```

---

## Part 11 — Configure Docker Access on Agents

The pipeline uses `--volumes-from $(hostname)` to share the workspace with Docker containers run inside the pipeline. The agents need Docker access.

Verify the agents have Docker CLI available:

```bash
# Check agent-1 has Docker
docker exec jenkins-agent-1 docker --version

# If not, the inbound-agent image needs Docker CLI
# Update docker-compose.yml to use a custom agent image:
```

Create a custom agent with Docker CLI:

```bash
cat > ~/jenkins-infra/Dockerfile.agent << 'EOF'
FROM jenkins/inbound-agent:latest-jdk21
USER root
RUN apt-get update && \
    apt-get install -y docker.io curl wget && \
    usermod -aG docker jenkins && \
    rm -rf /var/lib/apt/lists/*
USER jenkins
EOF
```

Update `docker-compose.yml` for both agents:

```yaml
jenkins-agent-1:
  build:
    context: .
    dockerfile: Dockerfile.agent
  # remove: image: jenkins/inbound-agent:latest-jdk21
```

Rebuild and restart:

```bash
docker compose build jenkins-agent-1 jenkins-agent-2
docker compose up -d jenkins-agent-1 jenkins-agent-2
```

---

## Part 12 — Run Your First Build

### 12.1 Trigger manually

1. Go to **banking** → **banking-nodejs-app**
2. Click **Build with Parameters**
3. Review default parameters (all skips are `true` — safe for first run)
4. Click **Build**

### 12.2 Watch the build

Click the build number → **Console Output**

You should see stages execute in order:

```
[Initialise]
╔══════════════════════════════════════════════════════════════════╗
║       Banking Node.js — Enterprise CI/CD Pipeline
╠══════════════════════════════════════════════════════════════════╣
║  Build      : #1
║  Image Tag  : latest
...

[Checkout & SBOM]
✅ Checkout complete

[Install & NPM Audit]
npm audit — CRITICAL: 0, HIGH: 0

[SAST — Semgrep + ESLint]   ← runs in parallel
...

[Unit Tests & Coverage]
Coverage: 85% (threshold: 80%)
✅ Coverage gate passed

[Docker Build]
✅ Image built: localhost:80/repository/docker-hosted/banking-nodejs-app:latest

[Container Scan — Trivy]
✅ Trivy container scan complete

[Nexus — Push Image]
✅ Image pushed: localhost:80/repository/docker-hosted/banking-nodejs-app:latest

[Smoke Tests]
✓ /health → 200
✓ / → 200
── Smoke Tests PASSED ──────────────────────────
```

---

## Part 13 — Pipeline Stages Reference

| Stage | What it does | Blocking |
|-------|-------------|---------|
| **Initialise** | Sets image tag, creates report dirs, writes pipeline-meta.json | Yes |
| **Checkout & SBOM** | Git checkout + CycloneDX SBOM generation | No |
| **Install & NPM Audit** | `npm ci` + `npm audit --audit-level=high` | Marks UNSTABLE on CRITICAL |
| **SAST — Semgrep** | Scans `src/` with nodejs/owasp-top-ten/secrets rules | Marks UNSTABLE on errors |
| **SAST — ESLint Security** | `eslint-plugin-security` scan | No |
| **Unit Tests & Coverage** | Jest unit tests + 80% line coverage gate | Marks UNSTABLE below threshold |
| **Integration Tests** | Jest integration tests with in-memory DB | No |
| **Docker Build** | Multi-stage hardened image build | Yes (build failure = fail) |
| **OWASP Dep-Check** | SCA scan — downloads NVD CVE data | `SKIP_OWASP=true` by default |
| **Trivy Container Scan** | CRITICAL/HIGH CVE scan on built image | Marks UNSTABLE on findings |
| **DAST — ZAP** | Baseline scan against running app | `SKIP_DAST=true` by default |
| **FOSSA Licence** | Open source licence compliance | `SKIP_FOSSA=true` by default |
| **Nexus Push** | `docker push` to local Nexus registry | Only if `PUSH_TO_NEXUS=true` |
| **Deploy** | Helm/kubectl deploy | `SKIP_K8S_DEPLOY=true` by default |
| **Smoke Tests** | Starts container, checks `/health` returns 200 | Yes |

---

## Part 14 — Enable Optional Stages

### Enable OWASP Dependency-Check

> Requires ~30 min first run (downloads 350K CVE records). Provide an NVD API key to speed this up to ~3 min.

1. Get a free NVD API key: [https://nvd.nist.gov/developers/request-an-api-key](https://nvd.nist.gov/developers/request-an-api-key)
2. Add to Jenkins credentials as `nvd-api-key` (Secret text)
3. Build with Parameters → set `SKIP_OWASP = false`

### Enable DAST (ZAP)

ZAP scans a **running** instance of your app. The pipeline uses `host.docker.internal:19090`.

1. Ensure the app is running on port `19090` before triggering the scan
2. Build with Parameters → set `SKIP_DAST = false`

### Enable Slack Notifications

1. Create an Incoming Webhook in your Slack workspace
2. Add to Jenkins credentials as `slack-webhook` (Secret text)
3. The pipeline uses `emailext` for email — Slack requires adding the Slack Notification plugin and wiring it in the `post {}` block

---

## Part 15 — Troubleshooting

### Agent not connecting

```bash
# Check agent logs
docker logs jenkins-agent-1

# Common fix: wrong secret
# Re-get secret from Jenkins → Manage Jenkins → Nodes → docker-agent-1 → Status
# Copy the secret shown on the page and update .env
```

### Docker socket permission denied on agent

```bash
# The agent user needs to be in the docker group
docker exec -it jenkins-agent-1 bash
groups jenkins   # should include docker

# Fix: rebuild agent image (see Part 11)
```

### `--volumes-from $(hostname)` fails

This technique requires the pipeline to run inside a Docker container (the agent) and share its filesystem with sibling containers. If running on a bare-metal agent, replace with explicit volume mounts:

```groovy
// Replace --volumes-from $(hostname) with:
-v "${WORKSPACE}:${WORKSPACE}"
```

### Nexus push: `unauthorized`

```bash
# Re-login on the agent
docker exec jenkins-agent-1 bash -c \
  'echo admin123 | docker login localhost:80 --username admin --password-stdin'

# Verify nexus-credentials in Jenkins matches actual Nexus password
```

### Smoke test: container unhealthy

```bash
# Check container logs
docker logs banking-smoke-<build-number>

# Common causes:
# - App crashes on startup (check NODE_ENV=test env var)
# - Port conflict (another container on 19090)
# - /health endpoint not implemented (check app.js)
```

### Coverage gate fails (< 80%)

The threshold is set in [Jenkinsfile](Jenkinsfile) line 48:

```groovy
coverageThreshold : 80,
```

Lower it for initial setup:

```groovy
coverageThreshold : 0,   // disable gate temporarily
```

---

## Part 16 — Full Stack Startup / Shutdown

### Start everything

```bash
cd ~/jenkins-infra
docker compose up -d
docker logs -f jenkins   # watch until ready
```

### Stop everything (preserve data)

```bash
docker compose stop
```

### Destroy everything (wipe all data)

```bash
docker compose down -v   # -v removes named volumes (Jenkins home, Nexus data)
```

### Check status

```bash
docker compose ps
```

---

## Part 17 — Security Hardening (Production Checklist)

Before using this setup beyond local development:

- [ ] Change all default passwords (`admin123` → strong passwords)
- [ ] Disable anonymous access in both Jenkins and Nexus
- [ ] Put Jenkins and Nexus behind a reverse proxy (nginx) with TLS
- [ ] Use Jenkins Credentials for all secrets — never hardcode in Jenkinsfile
- [ ] Enable CSRF protection in Jenkins
- [ ] Restrict agent labels — only trusted jobs should get `docker` label
- [ ] Enable Nexus Content Selectors to restrict what can be pushed/pulled
- [ ] Add the `docker.sock` mount only to agents that absolutely need it
- [ ] Rotate Nexus credentials every 90 days
- [ ] Set `JENKINS_ADMIN_PASSWORD` via a secret manager (not plaintext in `.env`)

---

## Quick Reference

| Task | Command |
|------|---------|
| Start all services | `docker compose up -d` |
| View Jenkins logs | `docker logs -f jenkins` |
| View agent logs | `docker logs -f jenkins-agent-1` |
| Nexus admin UI | `http://localhost:8081` |
| Jenkins UI | `http://localhost:8080` |
| Get agent secret | Jenkins → Manage → Nodes → agent → Status page |
| Test Nexus registry | `docker login localhost:80 -u admin` |
| Trigger build (CLI) | `curl -X POST http://admin:admin123@localhost:8080/job/banking/job/banking-nodejs-app/build` |
| View pipeline reports | Build → Artifacts → `pipeline-reports/` |
