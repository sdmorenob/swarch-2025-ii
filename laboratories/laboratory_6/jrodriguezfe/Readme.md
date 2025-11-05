# Laboratorio 6 — Detección de la Rodilla de Rendimiento

## Integrante

Julian David Rodríguez Fernández

---

## Descripción General

Este laboratorio tiene como objetivo identificar la **“rodilla”** en el rendimiento del sistema, es decir, el punto en el que el incremento de la carga (peticiones por segundo) causa una degradación significativa del tiempo de respuesta.

Se definió un **límite máximo de aceptación** para el tiempo de respuesta (`req_max`) de **3 segundos**.  
Cuando se supera este umbral, se considera que el sistema ha alcanzado su punto de saturación.

---

## Configuración de la Prueba

- **Herramienta utilizada:** k6 + Grafana
- **Métricas observadas:**
  - `http_req_duration` (tiempo de respuesta por solicitud)
  - `Requests per Second` (tasa de peticiones por segundo)
  - `Errors per Second` (errores por segundo)
- **Criterio de fallo:** `req_max > 3s`
- **Métrica de carga:** número de _requests per second (RPS)_

---

## Resultados de las Pruebas

### Prueba 1

| Parámetro                              | Valor                      |
| -------------------------------------- | -------------------------- |
| Carga máxima estable                   | 20 RPS                     |
| `req_max`                              | 2.84 s                     |
| Duración extendida (10 s más a 20 RPS) | `req_max` aumentó a 3.37 s |

**Conclusión:**  
El sistema mantiene un rendimiento aceptable hasta 20 RPS.  
Sin embargo, al mantener esta carga durante 10 segundos adicionales, el tiempo máximo de respuesta supera el límite de 3 segundos, indicando el inicio del punto de saturación.

**Evidencia:**  
![Prueba 1 - Resultados](./Pruebas/Prueba%201%20god.png)
![Prueba 1 - Resultados](./Pruebas/Prueba%201%20!god.png)

---

### Prueba 2

| Parámetro                             | Valor                      |
| ------------------------------------- | -------------------------- |
| Carga máxima estable                  | 18 RPS                     |
| `req_max`                             | 2.99 s                     |
| Duración extendida (8 s más a 18 RPS) | `req_max` aumentó a 3.14 s |

**Conclusión:**  
El sistema alcanza el límite de rendimiento a una carga ligeramente menor (18 RPS).  
Esto sugiere que, tras la primera prueba, la estabilidad térmica o el estado del hardware afectan negativamente el desempeño.

**Evidencia:**  
![Prueba 2 - Resultados](./Pruebas/Prueba%202%20god.png)
![Prueba 2 - Resultados](./Pruebas/Prueba%202%20!god.png)

---

### Prueba 3

| Parámetro                              | Valor                      |
| -------------------------------------- | -------------------------- |
| Carga máxima estable                   | 16 RPS                     |
| `req_max`                              | 3.00 s                     |
| Duración extendida (10 s más a 16 RPS) | `req_max` aumentó a 3.31 s |

**Conclusión:**  
El sistema llega al límite de aceptación con solo 16 RPS.  
La degradación del rendimiento con cargas menores confirma que el sistema no recupera completamente su capacidad entre pruebas consecutivas.

**Evidencia:**  
![Prueba 2 - Resultados](./Pruebas/Prueba%203%20god.png)
![Prueba 2 - Resultados](./Pruebas/Prueba%203%20!god.png)

---

## Observaciones

Aunque el número de peticiones por segundo no aumentó entre pruebas, se observó un deterioro progresivo del tiempo de respuesta.  
Esto puede explicarse por factores físicos y técnicos:

- **Calentamiento del hardware:** al aumentar la temperatura, la CPU reduce su frecuencia (thermal throttling), lo que ralentiza el procesamiento.
- **Acumulación de procesos o saturación de memoria/caché:** el sistema tarda más en liberar recursos entre peticiones.
- **Efecto de carga sostenida:** mantener una misma carga durante más tiempo genera cuellos de botella en la red o backend.

---

## Conclusión General

El punto de **rodilla** del sistema se encuentra entre **16 y 20 RPS**, rango en el cual el `req_max` comienza a superar los **3 segundos**.

A partir de ese punto, cualquier incremento sostenido o prolongado en la tasa de peticiones provoca un aumento no lineal del tiempo de respuesta, lo que evidencia la saturación del sistema.
