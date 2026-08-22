pipeline {

    agent any

    environment {
        IMAGE_NAME = 'rutuja2005byte/devops-cicd-platform:latest'
        PREVIOUS_IMAGE = 'devops-cicd-platform:previous'
        CONTAINER_NAME = 'devops-platform-cd'
        PORT = '3001'
    }

    stages {

        stage('Test') {
            steps {
                sh '''
                    node --version
                    npm --version
                    npm ci
                    npm test
                '''
            }
        }

        stage('Docker Test') {
            steps {
                sh '''
                    docker --version
                    docker ps
                '''
            }
        }

        stage('Pull Docker Image') {
            steps {
                sh '''
                    docker pull ${IMAGE_NAME}
                '''
            }
        }

        stage('Save Previous Image') {
            steps {
                sh '''
                    if docker ps -q --filter "name=${CONTAINER_NAME}" | grep -q .; then
                        CURRENT_IMAGE=$(docker inspect --format='{{.Config.Image}}' ${CONTAINER_NAME})

                        echo "Current running image: ${CURRENT_IMAGE}"

                        docker tag ${CURRENT_IMAGE} ${PREVIOUS_IMAGE}

                        echo "Previous image saved as: ${PREVIOUS_IMAGE}"
                    else
                        echo "No previous container found."
                    fi
                '''
            }
        }

        stage('Stop Old Container') {
            steps {
                sh '''
                    docker stop ${CONTAINER_NAME} || true
                '''
            }
        }

        stage('Remove Old Container') {
            steps {
                sh '''
                    docker rm ${CONTAINER_NAME} || true
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker run -d \
                      --name ${CONTAINER_NAME} \
                      -p ${PORT}:3000 \
                      ${IMAGE_NAME}
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    sleep 5

                    curl --fail http://localhost:${PORT}/health

                    echo "Health check passed!"
                '''
            }
        }
    }

    post {

        success {
            echo 'Deployment completed successfully!'
        }

        failure {
            echo 'Deployment failed! Starting rollback...'

            sh '''
                docker stop ${CONTAINER_NAME} || true
                docker rm ${CONTAINER_NAME} || true

                if docker image inspect ${PREVIOUS_IMAGE} > /dev/null 2>&1; then

                    echo "Rolling back to previous image..."

                    docker run -d \
                      --name ${CONTAINER_NAME} \
                      -p ${PORT}:3000 \
                      ${PREVIOUS_IMAGE}

                    sleep 5

                    curl --fail http://localhost:${PORT}/health

                    echo "Rollback completed successfully!"

                else
                    echo "No previous image available for rollback."
                fi
            '''
        }
    }
}