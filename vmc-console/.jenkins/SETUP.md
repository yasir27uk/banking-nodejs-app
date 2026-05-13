# Jenkins Enterprise CI/CD — Setup Guide
## VMC Console Pipeline @ https://localhost:8443/

---

## 1. Required Jenkins Plugins

Install via **Manage Jenkins → Plugins → Available Plugins**:

| Plugin | Purpose |
|--------|---------|
| `pipeline` (Workflow Aggregator) | Declarative pipeline support |
| `git` | SCM checkout |
| `docker-workflow` | `withDockerRegistry`, Docker build/push steps |
| `docker-plugin` | Docker agent/cloud |
| `credentials-binding` | `withCredentials` step |
| `configuration-as-code` (JCasC) | Apply `casc/jenkins.yaml` |
| `job-dsl` | Seed pipeline job from JCasC |
| `ansicolor` | Coloured build console |
| `timestamper` | Timestamp every log line |
| `htmlpublisher` | Publish OWASP HTML report |
| `warnings-ng` | Publish ESLint/TypeScript findings |
| `ws-cleanup` | `cleanWs()` post step |
| `build-discarder` | Retention policies |
| `role-strategy` | RBAC (role-based access) |
| `pipeline-stage-view` | Stage visualisation |
| `blueocean` *(optional)* | Modern pipeline UI |
| `email-ext` *(optional)* | Rich email notifications |
| `slack` *(optional)* | Slack notifications |

---

## 2. Jenkins Agent Requirements

The pipeline runs **entirely in Docker containers** — the only thing required on
the Jenkins agent (label `docker-agent`) is:

```bash
# Required
docker --version      # Docker Engine 24+
git --version         # Git 2.x
curl --version        # for smoke tests
wget --version        # for smoke tests (also used by nginx healthcheck)

# Verify Docker socket is accessible
ls -la /var/run/docker.sock
```

### Register the agent in Jenkins

1. **Manage Jenkins → Nodes → New Node**
2. Name: `docker-agent-01`
3. Labels: `docker-agent linux`
4. Launch method: **SSH** or **JNLP**
5. Remote root: `/home/jenkins/agent`

---

## 3. Apply JCasC Configuration

### Option A — Environment Variables (recommended)
Export secrets before starting Jenkins:
```bash
export JENKINS_ADMIN_PASSWORD="<strong-password>"
export NEXUS_USERNAME="admin"
export NEXUS_PASSWORD="<nexus-password>"
export NVD_API_KEY="<nvd-key>"          # https://nvd.nist.gov/developers/request-an-api-key
export SLACK_WEBHOOK_URL="<url>"        # optional
export GITHUB_USERNAME="yasir27uk"
export GITHUB_TOKEN="<pat>"
```

### Option B — Mount the file
Place `casc/jenkins.yaml` at the JCasC path and set:
```
CASC_JENKINS_CONFIG=/var/jenkins_home/casc_configs/jenkins.yaml
```
Then restart Jenkins or click **Manage Jenkins → Configuration as Code → Reload existing configuration**.

---

## 4. Configure Credentials Manually (alternative to JCasC)

Navigate to **Manage Jenkins → Credentials → System → Global credentials**:

| ID | Type | Value |
|----|------|-------|
| `nexus-docker-credentials` | Username + Password | Nexus admin user & password |
| `nvd-api-key` | Secret Text | NIST NVD API key |
| `slack-webhook` | Secret Text | Slack Incoming Webhook URL |
| `github-credentials` | Username + Password | GitHub username + PAT |

---

## 5. Nexus Docker Registry Configuration

### Allow HTTP push (insecure registry)
On the Jenkins agent and Docker host, add to `/etc/docker/daemon.json`:
```json
{
  "insecure-registries": ["localhost:80"]
}
```
Restart Docker:
```bash
sudo systemctl restart docker
```

### Nexus repository setup
1. Log into Nexus: `http://localhost:8081`
2. **Repository → Create repository → docker (hosted)**
   - Name: `docker-hosted`
   - HTTP connector port: `8082` (Nexus routes from port 80 → 8082 via nginx proxy)
3. Enable **Docker Bearer Token Realm**: Security → Realms → Add Docker Bearer Token

---

## 6. Create the Pipeline Job

### Option A — Automatic via JCasC
JCasC automatically seeds the `vmc-console-cicd` job via the embedded Job DSL
script in `casc/jenkins.yaml`. After applying JCasC, the job appears immediately.

### Option B — Manual
1. **New Item → Pipeline** — name: `vmc-console-cicd`
2. **Pipeline → Definition**: Pipeline script from SCM
3. **SCM**: Git — `https://github.com/yasir27uk/vmc-aws-console.git`
4. **Credentials**: `github-credentials`
5. **Branch**: `*/main`
6. **Script Path**: `Jenkinsfile`
7. ☑ **Lightweight checkout**
8. **Save**

---

## 7. Pipeline Parameters Reference

| Parameter | Default | Description |
|-----------|---------|-------------|
| `BUILD_ENV` | `dev` | Target environment (`dev`/`staging`/`production`) |
| `TRIVY_SEVERITY` | `HIGH,CRITICAL` | Minimum severity that fails the build |
| `SKIP_SECURITY_SCAN` | `false` | Skip all scans (blocked for `production`) |
| `PUSH_TO_NEXUS` | `true` | Push image after Quality Gate passes |
| `RUN_SMOKE_TEST` | `true` | Run container health/smoke test |
| `IMAGE_TAG` | *(auto)* | Custom tag; leave blank for `<branch>-<build#>` |

---

## 8. Pipeline Stage Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Stage 1 : Initialise          metadata, validation             │
│  Stage 2 : Install             npm ci (Nexus nodejs-base image) │
│  Stage 3 : Pre-flight Checks ──────────────────── [PARALLEL]   │
│    ├─ Lint & TypeScript        npx tsc --noEmit + next lint     │
│    └─ NPM Dependency Audit     npm audit --audit-level=moderate │
│  Stage 4 : Security Scanning ──────────────────── [PARALLEL]   │
│    ├─ Secret Detection         Gitleaks (SARIF report)          │
│    └─ SAST                     Semgrep (TypeScript/React/OWASP) │
│  Stage 5 : OWASP Dep. Check    CVE database scan                │
│  Stage 6 : Docker Build        BuildKit multi-stage             │
│  Stage 7 : Container Scan      Trivy SBOM + vuln report         │
│  Stage 8 : Quality Gate        evaluate all scan results        │
│  Stage 9 : Push to Nexus       version tag + branch-latest      │
│  Stage 10: Smoke Test          health-check + header assertions │
│  Post     : Archive, cleanup, notify                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Reports & Artifacts

Each build archives the following under **Build → Archived Artifacts**:

| Report | Stage | Format |
|--------|-------|--------|
| `reports/tsc-output.txt` | Pre-flight | Text |
| `reports/eslint-output.txt` | Pre-flight | Text |
| `reports/npm-audit.json` | Pre-flight | JSON |
| `reports/gitleaks.sarif` | Security Scan | SARIF |
| `reports/semgrep.json` | SAST | JSON |
| `reports/dependency-check-report.html` | OWASP | HTML (published) |
| `reports/trivy-vulns.json` | Container Scan | JSON |
| `reports/sbom.cyclonedx.json` | Container Scan | CycloneDX |
| `reports/smoke-container.log` | Smoke Test | Text |

---

## 10. Enabling Notifications

### Slack
1. Create a Slack App / Incoming Webhook at `api.slack.com/apps`
2. Add the URL as credential `slack-webhook`
3. In `Jenkinsfile`, uncomment the `slackSend` lines in the `post {}` block

### Email
1. **Manage Jenkins → Configure System → Extended E-mail Notification**
2. Set SMTP server, port, and credentials
3. In `Jenkinsfile`, uncomment `emailext` lines in the `post {}` block

---

## 11. Quality Gate Policy

| Finding | Dev | Staging | Production |
|---------|-----|---------|-----------|
| Trivy CRITICAL CVEs | Unstable | Unstable | **Fail** |
| npm audit CRITICAL | Unstable | Unstable | **Fail** |
| Secrets detected | Unstable | **Fail** | **Fail** |
| Semgrep ERROR | Unstable | Unstable | Unstable |
| OWASP CVSS ≥ 8 | Unstable | **Fail** | **Fail** |

---

## 12. Troubleshooting

### Docker login fails
```
Error response from daemon: Get "https://localhost:80/v2/": ...
```
→ Add `localhost:80` to `insecure-registries` in `/etc/docker/daemon.json` and restart Docker.

### npm ci fails inside Docker (permission denied)
```
EACCES: permission denied, mkdir '/app/node_modules'
```
→ Ensure the workspace directory is owned by the UID running inside the container (10001 for nodejs-base).
Add `--user root` to the `docker run` command for the install stage if needed.

### Trivy cannot pull CVE database
→ Add `--skip-db-update` to Trivy flags if offline, or configure a Nexus proxy for `ghcr.io/aquasecurity/trivy-db`.

### OWASP scan is slow (>30 min)
→ Register for a free NVD API key at `nvd.nist.gov/developers/request-an-api-key` and add it as the `nvd-api-key` credential. Scans with an API key are 10–50x faster.
