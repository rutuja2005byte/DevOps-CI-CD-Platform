pipeline {
    agent any

    environment {
        PATH = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
        IMAGE = "rutuja2005byte/devops-cicd-platform:latest"
        PREVIOUS_IMAGE = "devops-cicd-platform:previous"
        CONTAINER_NAME = "devops-platform-cd"
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
                sh 'docker pull $IMAGE'
            }
        }

        stage('Save Previous Image') {
            steps {
                sh '''
                    if docker ps -q --filter "name=$CONTAINER_NAME" | grep -q .; then
                        CURRENT_IMAGE=$(docker inspect --format='{{.Config.Image}}' $CONTAINER_NAME)

                        echo "Current running image: $CURRENT_IMAGE"

                        docker tag "$CURRENT_IMAGE" "$PREVIOUS_IMAGE"

                        echo "Previous image saved as: $PREVIOUS_IMAGE"
                    else
                        echo "No existing application container found."
                        echo "Skipping previous image backup."
                    fi
                '''
            }
        }

        stage('Stop Old Container') {
            steps {
                sh 'docker stop $CONTAINER_NAME || true'
            }
        }

        stage('Remove Old Container') {
            steps {
                sh 'docker rm $CONTAINER_NAME || true'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker run -d \
                    --name $CONTAINER_NAME \
                    -p 3001:3000 \
                    $IMAGE
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    sleep 5
                    curl --fail http://localhost:3001/health
                '''
            }
        }
    }

    post {

        failure {
            echo 'Deployment failed. Starting rollback...'

            sh '''
                docker stop $CONTAINER_NAME || true
                docker rm $CONTAINER_NAME || true

                if docker image inspect $PREVIOUS_IMAGE > /dev/null 2>&1; then

                    echo "Previous image found."
                    echo "Rolling back..."

                    docker run -d \
                    --name $CONTAINER_NAME \
                    -p 3001:3000 \
                    $PREVIOUS_IMAGE

                    sleep 5

                    curl --fail http://localhost:3001/wrong-health

                    echo "Rollback completed successfully."

                else
                    echo "No previous image available."
                    echo "Rollback cannot be performed."
                    exit 1
                fi
            '''
        }

        success {
            echo 'Deployment completed successfully!'
        }
    }
}