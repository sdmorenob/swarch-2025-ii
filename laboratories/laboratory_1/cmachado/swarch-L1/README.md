# Laboratorio 1 Arquitectura de software: Sistema Flask + MySQL con Docker

---

## 1. Diagrama de Despliegue (PlantUML)

Este diagrama representa los contenedores creados con Docker y cómo se relacionan entre sí.

```plantuml
@startuml
node "Docker Host" {
  node "swarch-mo (Flask App)" {
    [Controllers]
    [Services]
    [Repositories]
    [Models]
  }

  node "swarch-db (MySQL 8.0)" {
    database "swarch_db"
  }
}

actor "Usuario" as user

user --> [Controllers] : HTTP 5000
[Repositories] --> [swarch-db (MySQL 8.0)] : TCP 3306
@enduml

