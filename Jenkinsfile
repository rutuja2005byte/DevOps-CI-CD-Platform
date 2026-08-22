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
                sh 'docker pull YOUR_DOCKERHUB_USERNAME/devops-cicd-platform:latest'
            }
        }

    }
}