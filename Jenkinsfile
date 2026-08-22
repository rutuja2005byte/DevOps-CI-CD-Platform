pipeline {
    agent any

    environment {
        PATH = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
    }

    stages {

        stage('Test') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh 'npm ci'
                sh 'npm test'
            }
        }

        stage('Docker Test') {
            steps {
                sh 'docker --version'
                sh 'docker ps'
            }
        }

        stage('Pull Docker Image') {
            steps {
                sh 'docker pull rutuja2005byte/devops-cicd-platform:latest'
            }
        }

        stage('Stop Old Container') {
            steps {
                sh 'docker stop devops-platform-cd || true'
            }
        }

        stage('Remove Old Container') {
            steps {
                sh 'docker rm devops-platform-cd || true'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker run -d \
                    --name devops-platform-cd \
                    -p 3001:3000 \
                    rutuja2005byte/devops-cicd-platform:latest
                '''
            }
        }

    }
}