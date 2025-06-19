// Direct API access without any authentication
window.ENV = {
    "NODE_ENV": "production",
    "API_PORT": "443",
    "API_BASE_URL": "https://reproaiprod-app.lemondune-e106e75a.westeurope.azurecontainerapps.io/api/v1",
    "ALLOWED_ORIGINS": "[\"https://reproai-frontend.azurestaticapps.net\"]"
};

// For development
// window.ENV = {
//     "NODE_ENV":  "development",
//     "API_PORT":  "8080",
//     "API_BASE_URL":  "http://localhost:8080",
//     "BYPASS_AUTH_IN_DEV":  "true",
//     "ALLOWED_ORIGINS":  "[\"http://localhost:3000\", \"http://127.0.0.1:3000\"]"
// };