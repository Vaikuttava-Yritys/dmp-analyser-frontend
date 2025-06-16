window.ENV = {
    "NODE_ENV":  "production",
    "API_PORT":  "8080",
    "API_BASE_URL":  "https://dmp-apim.azure-api.net/",
    "BYPASS_AUTH_IN_DEV":  "false",
    "AUTH_PROXY_URL":  "https://dmp-token-proxy.azurewebsites.net",
    "API_HOST":  "https://dmp-apim.azure-api.net",
    "AUTH_PROXY_TOKEN_ENDPOINT":  "/token",
    "ALLOWED_ORIGINS":  "[\"http://localhost:3000\", \"http://localhost:3001\", \"http://127.0.0.1:3000\"]"
};

// For development
// window.ENV = {
//     "NODE_ENV":  "development",
//     "API_PORT":  "8080",
//     "API_BASE_URL":  "http://localhost:8080",
//     "BYPASS_AUTH_IN_DEV":  "true",
//     "AUTH_PROXY_URL":  "http://localhost:8080",
//     "API_HOST":  "localhost",
//     "AUTH_PROXY_TOKEN_ENDPOINT":  "/token",
//     "ALLOWED_ORIGINS":  "[\"http://localhost:3000\", \"http://localhost:3001\", \"http://127.0.0.1:3000\"]"
// };