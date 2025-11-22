import subprocess
import sys

# Colores para la terminal
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'

def check_connection(container, target_host, target_port, expect_success):
    """
    Prueba la conexión TCP usando 'nc' (Netcat) que es nativo en imágenes Alpine.
    """
    print(f"{Colors.OKBLUE}Probando conexión: [{container}] -> {target_host}:{target_port}...{Colors.ENDC}", end=" ")
    
    # Usamos 'nc -z -v -w 3 host port'
    # -z: Solo escaneo (sin enviar datos)
    # -w 3: Timeout de 3 segundos
    cmd = [
        "docker", "compose", "exec", "-T", container,
        "nc", "-z", "-w", "3", target_host, str(target_port)
    ]

    try:
        # Ejecutar comando
        result = subprocess.run(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Exit code 0 significa que nc logró conectar al puerto
        connection_made = result.returncode == 0
        
        if expect_success:
            if connection_made:
                print(f"{Colors.OKGREEN}✔ ÉXITO (Conectado){Colors.ENDC}")
                return True
            else:
                print(f"{Colors.FAIL}✘ FALLO (Debería conectar pero no pudo){Colors.ENDC}")
                # Mostrar stderr si ayuda, aunque nc a veces es silencioso en fallo
                if result.stderr: print(f"   Debug: {result.stderr.strip()}")
                return False
        else:
            if not connection_made:
                print(f"{Colors.OKGREEN}✔ ÉXITO (Bloqueado correctamente){Colors.ENDC}")
                return True
            else:
                print(f"{Colors.FAIL}✘ FALLO DE SEGURIDAD (Debería estar bloqueado){Colors.ENDC}")
                return False

    except Exception as e:
        print(f"{Colors.FAIL}Error ejecutando docker: {e}{Colors.ENDC}")
        return False

def main():
    print(f"{Colors.HEADER}=== Iniciando Verificación de Segmentación de Red (TCP) ==={Colors.ENDC}")
    print("Usando Netcat (nc) para compatibilidad con Alpine Linux\n")

    tests_passed = 0
    total_tests = 0

    # --- PRUEBA 1: Aislamiento (Public -> Private) ---
    # El Frontend NO debe alcanzar al Auth Service
    total_tests += 1
    if check_connection("frontend", "auth-service", 8001, expect_success=False):
        tests_passed += 1

    # --- PRUEBA 2: Comunicación Gateway (Bridge -> Private) ---
    # El API Gateway SÍ debe alcanzar al Auth Service
    total_tests += 1
    if check_connection("api-gateway", "auth-service", 8001, expect_success=True):
        tests_passed += 1

    # --- PRUEBA 3: Comunicación Pública (Public -> Public) ---
    # El Nginx SÍ debe alcanzar al Landing Page
    total_tests += 1
    if check_connection("nginx-proxy", "landing-page", 3001, expect_success=True):
        tests_passed += 1

    print(f"\n{Colors.HEADER}=== Resultados ==={Colors.ENDC}")
    print(f"Pruebas ejecutadas: {total_tests}")
    print(f"Pruebas pasadas: {tests_passed}")

    if tests_passed == total_tests:
        print(f"\n{Colors.OKGREEN}✅ LA SEGMENTACIÓN DE RED FUNCIONA CORRECTAMENTE.{Colors.ENDC}")
        sys.exit(0)
    else:
        print(f"\n{Colors.FAIL}❌ ERROR EN LA SEGMENTACIÓN DE RED.{Colors.ENDC}")
        sys.exit(1)

if __name__ == "__main__":
    main()