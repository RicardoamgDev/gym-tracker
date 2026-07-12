// Desarrollo
//export const BASE_URL = "http://127.0.0.1:8000";

//Produccion Hetzner
export const BASE_URL = "https://apigymtracker.softwarech.cl";

// Helper para rutas de archivos públicos
export const storageUrl = (path) => `${BASE_URL}/storage/${path}`;
