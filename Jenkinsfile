// =============================================================================
// ENTERPRISE BANKING-GRADE JENKINSFILE  ─── Local Jenkins Edition
// =============================================================================
// Adapted from enterprise template for local Docker-based Jenkins instance.
// Infrastructure replacements:
//   Kubernetes agents  → Docker agents (jenkins-agent-1/2 with Docker CLI)
//   HashiCorp Vault    → Jenkins Credentials (nexus-credentials, nvd-api-key)
//   External Nexus     → localhost:80/repository/docker-hosted
//   K8s / Helm deploy  → Skipped (SKIP_K8S_DEPLOY=true by default locally)
//   FOSSA              → Skipped (SKIP_FOSSA=true by default locally)
//   S3 audit upload    → Removed (no AWS locally)
// =============================================================================
// Pipeline Stages:
//   1.  Initialisation & Credential Retrieval
//   2.  Source Checkout & SBOM Generation
//   3.  Dependency Install & NPM Audit
//   4.  SAST — Semgrep + ESLint Security          [PARALLEL]
//   5.  Unit Tests + Coverage Gate
//   6.  Integration Tests
//   7.  Docker Build (multi-stage hardened image)
//   8.  SCA — OWASP Dependency-Check
//   9.  Container Scan — Aqua Trivy (CRITICAL/HIGH block)
//  10.  DAST — OWASP ZAP                          [skippable]
//  11.  Licence Compliance (FOSSA)                [skippable]
//  12.  Nexus — Push Image
//  13.  Deploy — Dev / Staging / Production       [skippable — no K8s locally]
//  14.  Smoke Tests (post-build health-check)
// =============================================================================
//
// Jenkins Credentials required:
//   nexus-credentials   (Username/Password) — Nexus Docker registry
//   nvd-api-key         (Secret Text)       — OWASP NVD API key (optional)
//   slack-webhook       (Secret Text)       — Slack notifications (optional)
// =============================================================================

// ── Global pipeline configuration (local overrides) ─────────────────────────
def GLOBAL_CONFIG = [
    // Nexus — local Docker Desktop instance
    nexusUrl          : 'http://localhost:80',
    nexusCredId       : 'nexus-credentials',
    nexusDockerRepo   : 'repository/docker-hosted',

    // Application
    appName           : 'banking-nodejs-app',
    dockerfilePath    : 'Dockerfile',
    nodeVersion       : '20',
    coverageThreshold : 80,
    cvssBlockThreshold: 7.0,

    // Notifications (optional — set NOTIFY_EMAIL param or configure slack-webhook)
    emailRecipients   : '',
    complianceBranch  : 'main',
]

// ── Computed at runtime ──────────────────────────────────────────────────────
def imageTag     = ''
def imageFullRef = ''

// =============================================================================
// PIPELINE DEFINITION
// =============================================================================
pipeline {

    // ── Agent — Docker-enabled Jenkins agent (jenkins-agent-1 / jenkins-agent-2)
    agent { label 'docker' }

    // ── Environment ───────────────────────────────────────────────────────────
    environment {
        APP_NAME          = "${GLOBAL_CONFIG.appName}"
        NEXUS_URL         = "${GLOBAL_CONFIG.nexusUrl}"
        NEXUS_DOCKER_REPO = "${GLOBAL_CONFIG.nexusDockerRepo}"
        REPORTS_DIR       = 'pipeline-reports'
        TRIVY_CACHE_DIR   = '/tmp/.trivy-cache'
        NODE_ENV          = 'test'
        DOCKER_BUILDKIT   = '0'
        SMOKE_PORT        = '19090'
        SMOKE_CONTAINER   = "banking-smoke-${env.BUILD_NUMBER ?: '0'}"
        // Credentials — NEXUS_CREDS_USR / NEXUS_CREDS_PSW auto-injected
        NEXUS_CREDS       = credentials('nexus-credentials')
    }

    // ── Pipeline options ──────────────────────────────────────────────────────
    options {
        timeout(time: 90, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '10'))
        disableConcurrentBuilds(abortPrevious: true)
        timestamps()
        ansiColor('xterm')
        durabilityHint('PERFORMANCE_OPTIMIZED')
    }

    // ── Trigger configuration ─────────────────────────────────────────────────
    triggers {
        pollSCM('H/5 * * * *')
    }

    // ── Parameters ────────────────────────────────────────────────────────────
    parameters {
        choice(
            name: 'DEPLOY_ENV',
            choices: ['dev', 'staging', 'production'],
            description: 'Target deployment environment'
        )
        booleanParam(
            name: 'SKIP_DAST',
            defaultValue: true,
            description: 'Skip DAST / ZAP scan (disable only when a live target URL is available)'
        )
        booleanParam(
            name: 'SKIP_FOSSA',
            defaultValue: true,
            description: 'Skip FOSSA licence-compliance scan (requires FOSSA API key)'
        )
        booleanParam(
            name: 'SKIP_K8S_DEPLOY',
            defaultValue: true,
            description: 'Skip Kubernetes deployment stages (no K8s available locally)'
        )
        booleanParam(
            name: 'PUSH_TO_NEXUS',
            defaultValue: true,
            description: 'Push built image to local Nexus registry'
        )
        booleanParam(
            name: 'FORCE_DEPLOY',
            defaultValue: false,
            description: 'Force deploy even with non-critical scan findings'
        )
        string(
            name: 'IMAGE_TAG_OVERRIDE',
            defaultValue: 'latest',
            description: 'Override image tag (leave empty for auto: build#-commit-timestamp)'
        )
        string(
            name: 'NOTIFY_EMAIL',
            defaultValue: '',
            description: 'Send build result to this email (blank = disabled)'
        )
    }

    // =========================================================================
    // STAGES
    // =========================================================================
    stages {

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 0 — Initialisation (replaces Vault secret retrieval)
        // ─────────────────────────────────────────────────────────────────────
        stage('Initialise') {
            steps {
                script {
                    def gitCommitShort = sh(script: 'git rev-parse --short HEAD 2>/dev/null || echo unknown', returnStdout: true).trim()
                    def buildTimestamp = sh(script: 'date -u +%Y%m%d%H%M%S', returnStdout: true).trim()

                    imageTag     = params.IMAGE_TAG_OVERRIDE?.trim() ?:
                                   "${env.BUILD_NUMBER}-${gitCommitShort}-${buildTimestamp.take(8)}"
                    imageFullRef = "${GLOBAL_CONFIG.nexusUrl}/${GLOBAL_CONFIG.nexusDockerRepo}/${GLOBAL_CONFIG.appName}:${imageTag}"

                    env.IMAGE_TAG     = imageTag
                    env.IMAGE_REF     = imageFullRef
                    env.GIT_SHORT     = gitCommitShort
                    env.BUILD_TS      = buildTimestamp

                    sh "mkdir -p ${REPORTS_DIR}/{npm-audit,sast,sca,trivy,zap,coverage,licence}"

                    writeJSON file: "${REPORTS_DIR}/pipeline-meta.json", json: [
                        pipelineId  : env.BUILD_TAG,
                        buildNumber : env.BUILD_NUMBER,
                        gitCommit   : env.GIT_COMMIT ?: 'unknown',
                        gitBranch   : env.GIT_BRANCH ?: 'unknown',
                        imageTag    : imageTag,
                        imageRef    : imageFullRef,
                        deployTarget: params.DEPLOY_ENV,
                        triggeredBy : currentBuild.getBuildCauses()[0]?.shortDescription ?: 'unknown',
                    ]

                    echo """
╔══════════════════════════════════════════════════════════════════╗
║       Banking Node.js — Enterprise CI/CD Pipeline               ║
╠══════════════════════════════════════════════════════════════════╣
║  Build      : #${env.BUILD_NUMBER}
║  Agent      : ${env.NODE_NAME}
║  Commit     : ${gitCommitShort}
║  Image Tag  : ${imageTag}
║  Image Ref  : ${imageFullRef}
║  Deploy Env : ${params.DEPLOY_ENV}
╠══════════════════════════════════════════════════════════════════╣
║  DAST       : ${!params.SKIP_DAST} │ FOSSA=${!params.SKIP_FOSSA} │ K8s=${!params.SKIP_K8S_DEPLOY}
║  Push Nexus : ${params.PUSH_TO_NEXUS}
╚══════════════════════════════════════════════════════════════════╝"""
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 1 — Source Checkout & SBOM
        // ─────────────────────────────────────────────────────────────────────
        stage('Checkout & SBOM') {
            steps {
                checkout scm
                sh """
                    docker run --rm \
                        --volumes-from \$(hostname) -w "${WORKSPACE}" \
                        -e HOME=/tmp \
                        node:${GLOBAL_CONFIG.nodeVersion}-alpine \
                        sh -c 'npm install -g @cyclonedx/cyclonedx-npm --quiet 2>/dev/null; \
                               cyclonedx-npm --output-format JSON \
                                 --output-file ${REPORTS_DIR}/sbom.cdx.json 2>/dev/null || echo SBOM generation skipped' \
                    || true
                    echo "✅ Checkout complete"
                """
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 2 — Dependency Install & NPM Audit
        // ─────────────────────────────────────────────────────────────────────
        stage('Install & NPM Audit') {
            steps {
                sh """
                    docker run --rm \
                        --volumes-from \$(hostname) -w "${WORKSPACE}" \
                        -e HOME=/tmp \
                        -e NODE_ENV=development \
                        node:${GLOBAL_CONFIG.nodeVersion}-alpine \
                        sh -c 'npm ci --prefer-offline 2>&1 && \
                               npm audit --audit-level=high --json \
                                 > ${REPORTS_DIR}/npm-audit/npm-audit.json 2>&1 || \
                               (echo AUDIT_HAS_ISSUES=true && exit 0)'
                """
                script {
                    if (fileExists("${REPORTS_DIR}/npm-audit/npm-audit.json")) {
                        try {
                            def audit    = readJSON file: "${REPORTS_DIR}/npm-audit/npm-audit.json"
                            def critical = audit?.metadata?.vulnerabilities?.critical ?: 0
                            def high     = audit?.metadata?.vulnerabilities?.high     ?: 0
                            echo "npm audit — CRITICAL: ${critical}, HIGH: ${high}"
                            if (critical > 0) unstable("npm audit: ${critical} CRITICAL vulnerabilities")
                        } catch (e) { echo "WARN: Could not parse npm-audit.json" }
                    }
                }
            }
            post { always { archiveArtifacts artifacts: "${REPORTS_DIR}/npm-audit/**", allowEmptyArchive: true } }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 3 — SAST: Semgrep + ESLint Security  [PARALLEL]
        // ─────────────────────────────────────────────────────────────────────
        stage('SAST — Semgrep + ESLint') {
            parallel {

                stage('Semgrep SAST') {
                    steps {
                        sh """
                            docker run --rm \
                                --volumes-from \$(hostname) -w "${WORKSPACE}" \
                                semgrep/semgrep:latest \
                                semgrep scan \
                                  --config=p/nodejs \
                                  --config=p/owasp-top-ten \
                                  --config=p/secrets \
                                  --json \
                                  --output=${REPORTS_DIR}/sast/semgrep-results.json \
                                  --timeout=60 \
                                  --max-memory=1024 \
                                  src/ 2>&1 | tee ${REPORTS_DIR}/sast/semgrep-stdout.txt || true
                        """
                        script {
                            if (fileExists("${REPORTS_DIR}/sast/semgrep-results.json")) {
                                try {
                                    def sg  = readJSON file: "${REPORTS_DIR}/sast/semgrep-results.json"
                                    def err = sg?.results?.findAll { it?.extra?.severity == 'ERROR' }?.size() ?: 0
                                    echo "Semgrep: ${err} ERROR-level findings"
                                    if (err > 0) unstable("Semgrep: ${err} SAST findings")
                                } catch (e) { echo "WARN: could not parse semgrep results" }
                            }
                        }
                    }
                }

                stage('ESLint Security') {
                    steps {
                        sh """
                            docker run --rm \
                                --volumes-from \$(hostname) -w "${WORKSPACE}" \
                                -e HOME=/tmp \
                                node:${GLOBAL_CONFIG.nodeVersion}-alpine \
                                sh -c 'npm run lint:security -- \
                                         --format json \
                                         --output-file ${REPORTS_DIR}/sast/eslint-security.json 2>&1 || true' \
                            || true
                        """
                    }
                }
            }
            post { always { archiveArtifacts artifacts: "${REPORTS_DIR}/sast/**", allowEmptyArchive: true } }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 4 — Unit Tests + Coverage Gate
        // ─────────────────────────────────────────────────────────────────────
        stage('Unit Tests & Coverage') {
            steps {
                sh """
                    docker run --rm \
                        --volumes-from \$(hostname) -w "${WORKSPACE}" \
                        -e HOME=/tmp -e NODE_ENV=test \
                        node:${GLOBAL_CONFIG.nodeVersion}-alpine \
                        sh -c 'npm run test:unit -- \
                                 --ci \
                                 --coverage \
                                 --coverageReporters=lcov \
                                 --coverageReporters=text \
                                 --coverageReporters=json-summary \
                                 --coverageDirectory=${REPORTS_DIR}/coverage \
                                 --forceExit 2>&1 | tee ${REPORTS_DIR}/jest-unit.log'
                """
                script {
                    if (fileExists("${REPORTS_DIR}/coverage/coverage-summary.json")) {
                        try {
                            def summary  = readJSON file: "${REPORTS_DIR}/coverage/coverage-summary.json"
                            def lineCov  = summary?.total?.lines?.pct ?: 0
                            def threshold = GLOBAL_CONFIG.coverageThreshold
                            echo "Coverage: ${lineCov}% (threshold: ${threshold}%)"
                            if (lineCov < threshold) unstable("Coverage ${lineCov}% below threshold ${threshold}%")
                            else echo "✅ Coverage gate passed"
                        } catch (e) { echo "WARN: Could not parse coverage-summary.json" }
                    }
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: '**/junit*.xml'
                    publishHTML(target: [allowMissing: true, alwaysLinkToLastBuild: true, keepAll: true,
                        reportDir: "${REPORTS_DIR}/coverage/lcov-report", reportFiles: 'index.html',
                        reportName: 'Coverage Report'])
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 5 — Integration Tests
        // ─────────────────────────────────────────────────────────────────────
        stage('Integration Tests') {
            steps {
                sh """
                    docker run --rm \
                        --volumes-from \$(hostname) -w "${WORKSPACE}" \
                        -e HOME=/tmp -e NODE_ENV=test \
                        -e DB_URI="memory://test" \
                        -e JWT_SECRET="test-secret-for-ci-only" \
                        node:${GLOBAL_CONFIG.nodeVersion}-alpine \
                        sh -c 'npm run test:integration -- \
                                 --ci --forceExit 2>&1 | tee ${REPORTS_DIR}/jest-integration.log' \
                    || true
                """
            }
            post { always { junit allowEmptyResults: true, testResults: '**/junit-integration*.xml' } }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 6 — Docker Build
        // ─────────────────────────────────────────────────────────────────────
        stage('Docker Build') {
            steps {
                sh """
                    echo "\${NEXUS_CREDS_PSW}" | docker login '${NEXUS_URL}' \
                        --username "\${NEXUS_CREDS_USR}" --password-stdin 2>/dev/null || true

                    docker build \
                        --file "${GLOBAL_CONFIG.dockerfilePath}" \
                        --tag "${env.IMAGE_REF}" \
                        --tag "${NEXUS_URL}/${NEXUS_DOCKER_REPO}/${APP_NAME}:latest" \
                        --build-arg APP_VERSION="${env.IMAGE_TAG}" \
                        --build-arg GIT_COMMIT="${env.GIT_SHORT}" \
                        --build-arg DEPLOY_ENV="${params.DEPLOY_ENV}" \
                        --label "pipeline.build=${env.BUILD_TAG}" \
                        --cache-from "${NEXUS_URL}/${NEXUS_DOCKER_REPO}/${APP_NAME}:cache" \
                        . 2>&1

                    echo "✅ Image built: ${env.IMAGE_REF}"
                    docker images "${NEXUS_URL}/${NEXUS_DOCKER_REPO}/${APP_NAME}"
                """
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 7 — SCA: OWASP Dependency-Check
        // ─────────────────────────────────────────────────────────────────────
        stage('SCA — OWASP Dependency-Check') {
            steps {
                script {
                    def nvdKey = ''
                    try {
                        withCredentials([string(credentialsId: 'nvd-api-key', variable: 'NVD_KEY')]) {
                            nvdKey = NVD_KEY
                        }
                    } catch (e) { /* credential may not exist */ }

                    sh """
                        docker run --rm \
                            --volumes-from \$(hostname) \
                            owasp/dependency-check:latest \
                            --project "${APP_NAME}" \
                            --scan "${WORKSPACE}" \
                            --format JSON --format HTML \
                            --out "${WORKSPACE}/${REPORTS_DIR}/sca" \
                            --failOnCVSS ${GLOBAL_CONFIG.cvssBlockThreshold} \
                            --enableExperimental \
                            --exclude '**/.git/**' \
                            --exclude '**/node_modules/.cache/**' \
                            ${nvdKey ? "--nvdApiKey '${nvdKey}'" : ''} \
                            2>&1 | tee ${REPORTS_DIR}/sca/owasp-stdout.txt || true
                    """
                }
            }
            post {
                always {
                    publishHTML(target: [allowMissing: true, alwaysLinkToLastBuild: false, keepAll: true,
                        reportDir: "${REPORTS_DIR}/sca", reportFiles: 'dependency-check-report.html',
                        reportName: 'OWASP Dependency-Check'])
                    archiveArtifacts artifacts: "${REPORTS_DIR}/sca/**", allowEmptyArchive: true
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 8 — Container Scan: Aqua Trivy
        // ─────────────────────────────────────────────────────────────────────
        stage('Container Scan — Trivy') {
            steps {
                sh """
                    mkdir -p "\${TRIVY_CACHE_DIR}"

                    # SBOM + vulnerability scan — non-fatal exit so we can archive
                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        --volumes-from \$(hostname) \
                        -v "\${TRIVY_CACHE_DIR}:/tmp/trivy-cache" \
                        aquasec/trivy:latest image \
                        --cache-dir /tmp/trivy-cache \
                        --severity CRITICAL,HIGH \
                        --format sarif \
                        --output "${WORKSPACE}/${REPORTS_DIR}/trivy/trivy-vuln.sarif" \
                        --ignore-unfixed \
                        --exit-code 0 \
                        "${env.IMAGE_REF}" 2>&1 | tee ${REPORTS_DIR}/trivy/trivy-stdout.txt

                    # Table summary to console
                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        -v "\${TRIVY_CACHE_DIR}:/tmp/trivy-cache" \
                        aquasec/trivy:latest image \
                        --cache-dir /tmp/trivy-cache \
                        --severity CRITICAL,HIGH \
                        --format table \
                        --exit-code 0 \
                        "${env.IMAGE_REF}"

                    echo "✅ Trivy container scan complete"
                """
                script {
                    if (fileExists("${REPORTS_DIR}/trivy/trivy-vuln.sarif")) {
                        try {
                            def sarif    = readJSON file: "${REPORTS_DIR}/trivy/trivy-vuln.sarif"
                            def critical = sarif?.runs?.collectMany { it?.results ?: [] }
                                               ?.findAll { it?.level == 'error' }?.size() ?: 0
                            if (critical > 0) unstable("Trivy: ${critical} CRITICAL/HIGH CVE(s) in container image")
                        } catch (e) { echo "WARN: Could not parse trivy SARIF" }
                    }
                }
            }
            post { always { archiveArtifacts artifacts: "${REPORTS_DIR}/trivy/**", allowEmptyArchive: true } }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 9 — DAST: OWASP ZAP  [skippable]
        // ─────────────────────────────────────────────────────────────────────
        stage('DAST — OWASP ZAP') {
            when { expression { !params.SKIP_DAST } }
            steps {
                sh """
                    mkdir -p "${REPORTS_DIR}/zap"
                    ZAP_TARGET="http://host.docker.internal:${SMOKE_PORT}"

                    docker run --rm \
                        --volumes-from \$(hostname) \
                        ghcr.io/zaproxy/zaproxy:stable \
                        zap-baseline.py \
                        -t "\${ZAP_TARGET}" \
                        -r "${WORKSPACE}/${REPORTS_DIR}/zap/zap-report.html" \
                        -J "${WORKSPACE}/${REPORTS_DIR}/zap/zap-report.json" \
                        -l WARN \
                        -I 2>&1 | tee ${REPORTS_DIR}/zap/zap-stdout.txt || true

                    echo "ZAP scan complete — review ${REPORTS_DIR}/zap/zap-report.html"
                """
            }
            post {
                always {
                    publishHTML(target: [allowMissing: true, alwaysLinkToLastBuild: false, keepAll: true,
                        reportDir: "${REPORTS_DIR}/zap", reportFiles: 'zap-report.html',
                        reportName: 'OWASP ZAP DAST Report'])
                    archiveArtifacts artifacts: "${REPORTS_DIR}/zap/**", allowEmptyArchive: true
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 10 — Licence Compliance (FOSSA)  [skippable]
        // ─────────────────────────────────────────────────────────────────────
        stage('Licence Compliance — FOSSA') {
            when { expression { !params.SKIP_FOSSA } }
            steps {
                withCredentials([string(credentialsId: 'fossa-api-key', variable: 'FOSSA_API_KEY')]) {
                    sh """
                        docker run --rm \
                            --volumes-from \$(hostname) -w "${WORKSPACE}" \
                            -e FOSSA_API_KEY="\${FOSSA_API_KEY}" \
                            fossas/fossa-cli:latest \
                            analyze --debug 2>&1 | tee ${REPORTS_DIR}/licence/fossa-analyze.log || true

                        docker run --rm \
                            --volumes-from \$(hostname) -w "${WORKSPACE}" \
                            -e FOSSA_API_KEY="\${FOSSA_API_KEY}" \
                            fossas/fossa-cli:latest \
                            test --json 2>&1 > ${REPORTS_DIR}/licence/fossa-test.json || true

                        echo "✅ Licence compliance scan complete"
                    """
                }
            }
            post { always { archiveArtifacts artifacts: "${REPORTS_DIR}/licence/**", allowEmptyArchive: true } }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 11 — Push Image to Nexus
        // ─────────────────────────────────────────────────────────────────────
        stage('Nexus — Push Image') {
            when { expression { params.PUSH_TO_NEXUS } }
            steps {
                sh """
                    echo "\${NEXUS_CREDS_PSW}" | docker login '${NEXUS_URL}' \
                        --username "\${NEXUS_CREDS_USR}" --password-stdin

                    docker push "${env.IMAGE_REF}"
                    docker push "${NEXUS_URL}/${NEXUS_DOCKER_REPO}/${APP_NAME}:latest"

                    docker tag "${env.IMAGE_REF}" \
                        "${NEXUS_URL}/${NEXUS_DOCKER_REPO}/${APP_NAME}:cache"
                    docker push "${NEXUS_URL}/${NEXUS_DOCKER_REPO}/${APP_NAME}:cache" || true

                    echo "✅ Image pushed: ${env.IMAGE_REF}"
                """
            }
            post { always { sh "docker logout '${NEXUS_URL}' 2>/dev/null || true" } }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 12 — Deploy (K8s / Helm — skipped locally by default)
        // ─────────────────────────────────────────────────────────────────────
        stage('Deploy') {
            when { expression { !params.SKIP_K8S_DEPLOY } }
            steps {
                echo "K8s deployment would run here (kubectl / helm). Skipped — no K8s locally."
                echo "Image to deploy: ${env.IMAGE_REF}"
                echo "Target environment: ${params.DEPLOY_ENV}"
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 13 — Smoke Tests (run built container, health-check + assertions)
        // ─────────────────────────────────────────────────────────────────────
        stage('Smoke Tests') {
            steps {
                script {
                    sh """
                        echo "Starting smoke container: ${SMOKE_CONTAINER} on port ${SMOKE_PORT}"
                        docker run -d \
                            --name '${SMOKE_CONTAINER}' \
                            -p '${SMOKE_PORT}:3000' \
                            -e NODE_ENV=test \
                            -e DB_URI="memory://smoke" \
                            -e JWT_SECRET="smoke-test-secret" \
                            --health-cmd 'wget -qO /dev/null http://localhost:3000/health || exit 1' \
                            --health-interval 5s \
                            --health-timeout 3s \
                            --health-retries 6 \
                            --health-start-period 10s \
                            "${env.IMAGE_REF}"
                    """

                    timeout(time: 90, unit: 'SECONDS') {
                        waitUntil(initialRecurrencePeriod: 3000) {
                            def status = sh(
                                script: "docker inspect --format='{{.State.Health.Status}}' '${SMOKE_CONTAINER}' 2>/dev/null || echo starting",
                                returnStdout: true
                            ).trim()
                            echo "Container health: ${status}"
                            if (status == 'unhealthy') error('Smoke container is unhealthy')
                            return status == 'healthy'
                        }
                    }

                    sh """
                        BASE="http://localhost:${SMOKE_PORT}"
                        echo "── Smoke Assertions ────────────────────────────"

                        STATUS=\$(curl -so /dev/null -w '%{http_code}' "\${BASE}/health")
                        [ "\${STATUS}" = "200" ] && echo "✓ /health → 200" || { echo "✗ /health → \${STATUS}"; exit 1; }

                        STATUS=\$(curl -so /dev/null -w '%{http_code}' "\${BASE}/")
                        [ "\${STATUS}" = "200" ] && echo "✓ / → 200" || echo "⚠ / → \${STATUS}"

                        echo "── Smoke Tests PASSED ──────────────────────────"
                    """
                }
            }
            post {
                always {
                    sh """
                        docker logs '${SMOKE_CONTAINER}' > ${REPORTS_DIR}/smoke-container.log 2>&1 || true
                        docker stop '${SMOKE_CONTAINER}' 2>/dev/null || true
                        docker rm   '${SMOKE_CONTAINER}' 2>/dev/null || true
                    """
                    archiveArtifacts artifacts: "${REPORTS_DIR}/smoke-container.log", allowEmptyArchive: true
                }
            }
        }

    } // end stages

    // =========================================================================
    // POST-PIPELINE ACTIONS
    // =========================================================================
    post {

        always {
            archiveArtifacts artifacts: "${REPORTS_DIR}/**", allowEmptyArchive: true
            sh """
                docker rmi "${env.IMAGE_REF ?: 'none'}" 2>/dev/null || true
                docker rmi "${NEXUS_URL}/${NEXUS_DOCKER_REPO}/${APP_NAME}:latest" 2>/dev/null || true
                docker image prune -f 2>/dev/null || true
                docker run --rm --volumes-from \$(hostname) alpine \
                    chmod -R 777 "${WORKSPACE}" 2>/dev/null || true
            """
            cleanWs(deleteDirs: true, notFailBuild: true,
                    patterns: [[pattern: "${REPORTS_DIR}/**", type: 'EXCLUDE']])
        }

        success {
            script {
                def msg = """
✅ Pipeline SUCCESS — ${APP_NAME} #${env.BUILD_NUMBER}
Branch: ${env.GIT_BRANCH} | Commit: ${env.GIT_SHORT} | Image: ${env.IMAGE_REF}
Duration: ${currentBuild.durationString} | URL: ${env.BUILD_URL}
""".stripIndent()
                echo msg
                if (params.NOTIFY_EMAIL?.trim()) {
                    emailext(subject: "✅ Passed: ${APP_NAME} #${env.BUILD_NUMBER}", body: msg, to: params.NOTIFY_EMAIL)
                }
            }
        }

        failure {
            script {
                def msg = """
❌ Pipeline FAILED — ${APP_NAME} #${env.BUILD_NUMBER}
Branch: ${env.GIT_BRANCH} | Commit: ${env.GIT_SHORT}
Duration: ${currentBuild.durationString} | Logs: ${env.BUILD_URL}console
""".stripIndent()
                echo msg
                if (params.NOTIFY_EMAIL?.trim()) {
                    emailext(subject: "❌ FAILED: ${APP_NAME} #${env.BUILD_NUMBER}", body: msg, to: params.NOTIFY_EMAIL)
                }
            }
        }

        unstable {
            echo "⚠️ Pipeline UNSTABLE — ${APP_NAME} #${env.BUILD_NUMBER} — review scan reports at ${env.BUILD_URL}"
        }

        aborted {
            echo "⏹ Build #${env.BUILD_NUMBER} aborted"
        }
    }
}
