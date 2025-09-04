# Laboratorio 1: Architectural Design

## 1. Representación visual
![Representación gráfica de la arquitectura](/laboratories/laboratory_1/amoralesch/Representacion_grafica_monolito.png)

## 2. Descripción de propiedades del sistema

**1. Registrar nuevos libros (externamente visible):** el sistema permite que el usuario registre libros y estos se guarden en la base de datos.

**2. Visualizar los géneros literarios registrados en la base de datos (externamente visible):** el sistema tiene una interfaz que permite visualizar en forma de lista, los diferentes géneros literarios que se encuentran dentro de la base de datos.

**3. Mantenibilidad (calidad):** el sistema esta dividido en diferentes módulos como *services*, *templates*, *repositories*, etc., y que, además, cada uno de estos tenga archivos específicando a que entidad pertenecen, permiten un mejor entendimiento del código y facilidad para realizar cambios, sin tener que alterar porciones grandes del programa. Esto límita fallos o errores sistemáticos.

**4. Portabilidad (calidad):** al utilizar conterización con *Docker*, permite que el sistema se pueda ejecutar casi que en cualquier servidor ya que dentro del contenedor se pueden descargar e instalar sistemas operativos, requerimientos, dependencias, versiones de lenguajes, etc., necesarios para la correcta ejecución del programa. 

**5. Simplicidad (calidad):** el sistema, al solo usar dos elementos arquitectónicos, necesita menos cantidad de código y de archivos, permitiendo que estos últimos, se organicen en pocos modulos, facilitando asi, la mantenibilidad del sistema.