# Azure Static Web App Deployment

This project is set up to be deployed as an Azure Static Web App.

## Prerequisites

- Azure account
- GitHub account
- Azure CLI (for local development and deployment)

## Deployment Steps

### 1. Create Azure Static Web App

1. Go to the [Azure Portal](https://portal.azure.com/)
2. Click "Create a resource"
3. Search for "Static Web App" and select it
4. Click "Create"

### 2. Configure the Static Web App

1. **Subscription**: Select your Azure subscription
2. **Resource Group**: Create new or select existing
3. **Name**: Enter a name for your app (e.g., "dmp-analyser")
4. **Plan type**: Select "Free" or "Standard" based on your needs
5. **Azure Functions and staging**: Choose the appropriate region
6. **Source**: GitHub
7. **Sign in with GitHub** and authorize Azure
8. **Organization**: Select your GitHub organization (Vaikuttava-Yritys)
9. **Repository**: Select "dmp-analyser-frontend"
10. **Branch**: Select "main"
11. **Build Presets**: Choose "Custom"
12. **App location**: "/" (root directory)
13. **Api location**: Leave empty (we don't have an API for this static site)
14. **App artifact location**: Leave empty (defaults to "dist" which we don't use)
15. Click "Review + create"
16. Review the settings and click "Create"

### 3. Configure GitHub Secrets (if needed)

If you're setting up the GitHub Actions workflow manually, you'll need to add these secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets" > "Actions"
3. Click "New repository secret"
4. Add a secret named `AZURE_STATIC_WEB_APPS_API_TOKEN` with the value from the Azure Portal

### 4. Deploy

The GitHub Actions workflow will automatically deploy your app when you push to the main branch. You can monitor the deployment in the "Actions" tab of your GitHub repository.

## Custom Domain (Optional)

To set up a custom domain:

1. Go to your Static Web App in the Azure Portal
2. Click on "Custom domains" in the left menu
3. Click "Add"
4. Follow the instructions to verify your domain and configure DNS settings

## Environment Variables

If your app needs environment variables:

1. Go to your Static Web App in the Azure Portal
2. Click on "Configuration" in the left menu
3. Add your application settings under "Application settings"
4. Click "Save"

## Monitoring

You can monitor your app's performance and errors in the Azure Portal under the "Monitoring" section of your Static Web App.
