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
                    dockerImageLatest = docker.build REGISTRY + ":latest"
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
