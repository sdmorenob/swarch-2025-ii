import requests
import concurrent.futures
import time
import urllib3

# Desactivar advertencias de certificado SSL (self-signed)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

URL = "https://localhost/api/users/"
TOTAL_REQUESTS = 50
CONCURRENCY = 50  # Lanzarlas todas a la vez para forzar el burst

def make_request(index):
    try:
        # Timeout muy corto (2s) para simular fail-fast
        response = requests.get(URL, verify=False, timeout=2)
        return {
            "id": index,
            "status": response.status_code,
            "origin": "Nginx" if response.status_code == 503 else "Backend"
        }
    except Exception as e:
        return {"id": index, "status": 0, "origin": "Error"}

def run_test():
    print(f"🚀 Iniciando prueba de Rate Limiting (Enfoque Arquitectónico)...")
    print(f"📡 URL Objetivo: {URL}")
    print(f"⚡ Lanzando {TOTAL_REQUESTS} peticiones simultáneas...")

    results = []
    start_time = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = [executor.submit(make_request, i) for i in range(1, TOTAL_REQUESTS + 1)]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    duration = time.time() - start_time
    
    # Análisis
    accepted = [r for r in results if r['status'] in [200, 401, 404, 405]]
    blocked = [r for r in results if r['status'] == 503]
    errors = [r for r in results if r['status'] == 0]

    print("\n📊 --- RESULTADOS DEL TEST ---")
    print(f"⏱️  Tiempo total: {duration:.2f} segundos")
    print(f"✅ Peticiones Aceptadas (Pasaron al Backend): {len(accepted)}")
    print(f"⛔ Peticiones Bloqueadas (Detenidas por Nginx): {len(blocked)}")

    if errors:
        print(f"⚠️  Errores de conexión: {len(errors)}")

    print("-" * 40)
    
    if len(blocked) > 0:
        print("[EXITO] El patrón Rate Limiting está ACTIVO.")
        print("       Nginx protegió el sistema del exceso de tráfico.")
    else:
        print("[FALLO] No se detectaron bloqueos (Revisa tu configuración).")

if __name__ == "__main__":
    run_test()