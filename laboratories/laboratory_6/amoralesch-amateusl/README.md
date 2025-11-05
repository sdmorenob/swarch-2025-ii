# Laboratorio N° 6 - Atributos de calidad: *Performance*
## Integrantes 👥
- Anderson Steven Mateus Lopez
- Anderson David Morales Chila

## Prueba N° 1 📘 
![Prueba 1](https://raw.githubusercontent.com/AndersonMorales08/Image_repository/refs/heads/main/Universidad/2025-2S/Arquitectura_de_software/Laboratorios/Laboratorio_6/Prueba_1.jpeg)

![Métricas - Prueba 1](https://raw.githubusercontent.com/AndersonMorales08/Image_repository/refs/heads/main/Universidad/2025-2S/Arquitectura_de_software/Laboratorios/Laboratorio_6/Metricas-Prueba_1.jpeg)

La carga se incrementa gradualmente desde ~0 hasta ~73 $\frac{requests}{second}$ 

**Duración:** aproximadamente 10 minutos (20:53 - 21:03).

**Pico máximo:** aproximadamente 73 req/s alcanzado cerca del final de la prueba.

### Métricas de Desempeño (http_req_duration)

#### Tiempos de respuesta:

- **Promedio:** 23.88s
- **Máximo:** 1.00 min (60s)
- **Mediana:** 18.38s
- **P90:** 1.00 min
- **P95:** 1.00 min

### Requests bloqueados (http_req_blocked)

Muy bajos 0.08ms promedio, siendo 17.73ms el máximo.
Esto indica que el tiempo de establecimiento de conexión es mínimo.

## Prueba N° 2 📘
![Prueba 2](https://raw.githubusercontent.com/AndersonMorales08/Image_repository/refs/heads/main/Universidad/2025-2S/Arquitectura_de_software/Laboratorios/Laboratorio_6/Prueba_2.jpeg)

![Métricas - Prueba 2](https://raw.githubusercontent.com/AndersonMorales08/Image_repository/refs/heads/main/Universidad/2025-2S/Arquitectura_de_software/Laboratorios/Laboratorio_6/Metricas-Prueba_2.jpeg)

La duración es de aproximadamente 9 minutos (21:05 - 21:14). Adicionalmente, la carga fue sostenida con aproximadamente 35-45 req/s durante la mayor parte de la prueba. El pico máximo fue de 140 req/s (spike al final) con un promedio de 63.6 req/s.

### Métricas de Desempeño (http_req_duration)
#### Tiempos de respuesta:

- **Promedio:** 22.02s (mejora de ~1.86s vs Prueba 1).
- **Máximo:** 1.00 min (60s) - mismo timeout.
- **Mediana:** 15.48s (mejora de ~2.9s vs Prueba 1).
- **Mínimo:** 133.81ms (DRÁSTICA mejora vs Prueba 1).
- **P90:** 1.00 min.
- **P95:** 1.00 min.

## Prueba N° 3 📘
![Prueba 3](https://raw.githubusercontent.com/AndersonMorales08/Image_repository/refs/heads/main/Universidad/2025-2S/Arquitectura_de_software/Laboratorios/Laboratorio_6/Prueba_3.jpeg)

![Métricas - Prueba 3](https://raw.githubusercontent.com/AndersonMorales08/Image_repository/refs/heads/main/Universidad/2025-2S/Arquitectura_de_software/Laboratorios/Laboratorio_6/Metricas-Prueba_3.jpeg)

La carga sube  continuamente al inicio seguido de meseta (Similar a Prueba 1 pero más corta). La duración fue de aproximadamente de 9 minutos (21:17 - 21:26). La carga fue sostenida con aproximadamente 35-40 req/s durante la mayor parte. El pico máximo 73 req/s (spike final) y el promedio fue 31.7 req/s

### Métricas de Desempeño (http_req_duration)
#### Tiempos de respuesta:

- **Promedio:** 22.31s.
- **Máximo:** 1.00 min (60s).
- **Mediana:** 15.74s.
- **Mínimo:** 135.61ms.
- **P90:** 1.00 min.
- **P95:** 1.00 min.

El punto del codo es aproximadamente ***30-35 requests/second*** de carga promedio.

Este es el throughput óptimo donde el sistema alcanza su mejor balance entre carga y latencia con la configuración actual.
