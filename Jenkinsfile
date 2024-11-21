#!groovy
pipeline {
    agent any

    environment {
        REGISTRY = "docker-registry.wemove.com/geo-conversion-api"
        SCANNER_HOME = tool 'SonarQube Scanner'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '5', artifactNumToKeepStr: '5'))
        gitLabConnection('GitLab (wemove)')
    }

    stages {
        stage ('Run Tests') {
            steps {
                nodejs(nodeJSInstallationName: 'nodejs20') {
                    sh 'cd server && npm ci && npm test'
                }
            }
        }
        stage ('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('Wemove SonarQube') {
                    sh "${SCANNER_HOME}/bin/sonar-scanner -Dsonar.projectKey=geo-conversion-api"
                }
            }
        }
        stage ('SonarQube Quality Gate') {
            options {
                timeout(time: 5, unit: 'MINUTES')
            }
            steps {
                waitForQualityGate abortPipeline: true
            }
        }
        stage('Build Image') {
            steps {
                script {
                    // version = snapshotVersionFromGit()
                    // dockerImage = docker.build REGISTRY + ":" + version
                    def commitId = sh(script: "git log -n 1 --pretty=format:'%H'", returnStdout: true)
                    def buildTimestamp = sh(script: "git show -s --format='%cI' ${commitId}", returnStdout: true).trim()
                    dockerImageLatest = docker.build("${REGISTRY}:latest", "--build-arg commitId='${commitId}' --build-arg buildTimestamp='${buildTimestamp}' .")
                }
            }
        }
        stage('Push Image') {
            steps {
                script {
                    // dockerImage.push()
                    dockerImageLatest.push()
                }
            }
        }
    }
}

def snapshotVersionFromGit() {
    def latestVersion = sh script: 'git describe --tags $(git rev-list --branches=origin/main --tags --max-count=1)', returnStdout: true
    def (major, minor, patch) = latestVersion.tokenize('.').collect { it.toInteger() }
    def snapshotVersion = "${major}.${minor + 1}.0-SNAPSHOT"
    snapshotVersion
}
