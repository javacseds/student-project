#!/bin/bash
# Enterprise AI Coding Assessment Platform Cloud Deployment Script
# Targets AWS ECS (Elastic Container Service) with Fargate launch type

set -e

AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="123456789012"
APP_NAME="ai-coding-assessment"

echo "======================================================"
echo "Starting Cloud Deployment Pipeline for $APP_NAME"
echo "======================================================"

# 1. Authenticate Docker with AWS ECR
echo "Authenticating with AWS ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# 2. Build and Tag Backend Container
echo "Building Backend Docker image..."
docker build -t $APP_NAME-backend ./backend
docker tag $APP_NAME-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME-backend:latest

# 3. Build and Tag Frontend Container
echo "Building Frontend Docker image..."
docker build -t $APP_NAME-frontend ./frontend
docker tag $APP_NAME-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME-frontend:latest

# 4. Push images to AWS ECR
echo "Pushing images to AWS ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME-frontend:latest

# 5. Deploy / Update ECS Service
echo "Updating ECS Services to force new deployment..."
aws ecs update-service --cluster $APP_NAME-cluster --service $APP_NAME-backend-service --force-new-deployment --region $AWS_REGION
aws ecs update-service --cluster $APP_NAME-cluster --service $APP_NAME-frontend-service --force-new-deployment --region $AWS_REGION

echo "Deployment finished successfully. Access the platform via CloudFront/ALB endpoint."
