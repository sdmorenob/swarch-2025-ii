/**
 * Script de verificación del Search Service
 * ----------------------------------------
 * Este script verifica si el search service de Go está funcionando correctamente
 * 
 * Uso:
 * 1. Asegúrate de que el search service esté ejecutándose (puerto 8081)
 * 2. Ejecuta: node verify_search_service.js
 */

const https = require('https');
const http = require('http');

// Configuración
const SEARCH_SERVICE_URL = 'http://localhost:8081';
const TEST_TOKEN = 'your-test-token-here'; // Reemplaza con un token válido

// Función para hacer peticiones HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Verificaciones
async function verifySearchService() {
  console.log('🔍 Verificando Search Service...\n');
  
  try {
    // 1. Verificar health endpoint
    console.log('1. Verificando health endpoint...');
    const healthResponse = await makeRequest(`${SEARCH_SERVICE_URL}/health`);
    
    if (healthResponse.statusCode === 200) {
      console.log('✅ Health endpoint responde correctamente');
      console.log(`   Status: ${healthResponse.statusCode}`);
      console.log(`   Response: ${healthResponse.data}\n`);
    } else {
      console.log(`❌ Health endpoint falló: ${healthResponse.statusCode}\n`);
      return;
    }
    
    // 2. Verificar search endpoint (sin autenticación)
    console.log('2. Verificando search endpoint...');
    const searchPayload = JSON.stringify({
      query: "test",
      user_id: 1,
      limit: 5
    });
    
    const searchResponse = await makeRequest(`${SEARCH_SERVICE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: searchPayload
    });
    
    console.log(`   Status: ${searchResponse.statusCode}`);
    console.log(`   Response: ${searchResponse.data}`);
    
    if (searchResponse.statusCode === 200) {
      console.log('✅ Search endpoint responde correctamente');
    } else if (searchResponse.statusCode === 401) {
      console.log('⚠️  Search endpoint requiere autenticación válida');
    } else {
      console.log('❌ Search endpoint falló');
    }
    
  } catch (error) {
    console.log('❌ Error conectando al search service:');
    console.log(`   ${error.message}`);
    console.log('\n💡 Posibles causas:');
    console.log('   - El search service no está ejecutándose');
    console.log('   - MongoDB no está disponible');
    console.log('   - Puerto 8081 está bloqueado');
    console.log('   - Variables de entorno incorrectas');
  }
}

// Función para verificar desde el frontend
function showFrontendVerification() {
  console.log('\n📱 Para verificar desde el frontend:');
  console.log('1. Abre la aplicación en el navegador');
  console.log('2. Abre DevTools (F12) → Console');
  console.log('3. Ve a la página de Notas');
  console.log('4. Realiza una búsqueda');
  console.log('5. Observa los mensajes en la consola:');
  console.log('   ✅ Sin errores = Search service funcionando');
  console.log('   ❌ "Search service unavailable" = Usando búsqueda local');
  
  console.log('\n🌐 Para verificar las llamadas de red:');
  console.log('1. DevTools → Network');
  console.log('2. Realiza una búsqueda');
  console.log('3. Busca llamadas a "localhost:8081/search"');
  console.log('4. Verifica el status de la respuesta');
}

// Ejecutar verificaciones
verifySearchService().then(() => {
  showFrontendVerification();
});