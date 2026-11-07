# GOLPES — Documento de diseño (v0.1)

> Título provisional. Juego móvil (iOS y Android) de sigilo por episodios basado en atracos y fugas reales.

## 1. Concepto en una frase

Revive los golpes más famosos de la historia: estudias el plan real, lo ejecutas con sigilo nivel a nivel y al final descubres qué pasó de verdad y cómo los pillaron (o no).

## 2. Pilares

1. **Historias reales contadas jugando.** Cada episodio es un caso real. Las mecánicas salen del propio caso: si en Amberes usaron laca para cegar un sensor térmico, aquí también.
2. **Planificar y ejecutar.** Antes del golpe estudias los planos y eliges el material. Durante el golpe pones el plan en práctica.
3. **Partidas cortas para móvil.** Niveles de 3 a 8 minutos que se juegan con una mano y se reintentan rápido.

## 3. Bucle de juego

```
Briefing (historia) → Planificación (planos, equipo, gadgets) → Ejecución (sigilo)
      ↑                                                            ↓
  Siguiente nivel  ←  Epílogo "Lo que pasó de verdad" + estrellas  ←  Huida
```

**Estrellas por nivel** (lo que hace que valga la pena repetir):
- Completado.
- Sin ser detectado.
- Todo el botín u objetivo secundario.

## 4. Mecánicas núcleo (las que valida el prototipo)

| Mecánica | Cómo funciona |
|---|---|
| Movimiento | Tocas un punto y el ladrón va solo, calculando el camino. En ordenador, con flechas o WASD. |
| Visión | Guardias y cámaras tienen un cono de visión. Las paredes y los muebles altos lo bloquean. |
| Sospecha | Estar dentro de un cono llena una barra de sospecha, más rápido cuanto más cerca estás. Si se llena, te pillan. El guardia que te ha medio visto va a investigar. |
| Esconderse | En armarios: dentro eres invisible. |
| Interacciones | Mantener pulsado para usar algo (forzar, abrir, desactivar). Si sueltas, se cancela. |
| Sensores | Zonas que dan la alarma al instante. Cada una se desactiva con un gadget concreto sacado del caso real. |
| Botín | Cajas que vaciar. Hay un mínimo para completar el nivel y el resto es opcional. |

**Más adelante (no entra en el prototipo):** ruido al correr, distracciones (lanzar objetos), equipo de varios personajes, disfraces, mapa de planificación, golpes con contador de tiempo.

## 5. Estructura de un episodio

3 o 4 niveles por episodio. Ejemplo con **Episodio 1: Amberes, 2003**:

1. **La oficina.** Te infiltras en el edificio y localizas la cámara. Nivel tutorial.
2. **La llave.** Encuentras la llave original de la cámara, que estaba guardada en un almacén cercano.
3. **La cámara.** Neutralizas los sensores, abres la cámara y vacías las cajas. *(Es lo que hace el prototipo, en versión simplificada.)*
4. **La basura.** Huida y deshacerse de las pruebas. Si lo haces mal, se repite la historia real: la basura los delató.

## 6. Episodios candidatos

| # | Caso | Año | Qué lo hace jugable |
|---|---|---|---|
| 1 | Centro del Diamante de Amberes | 2003 | Sensores y gadgets caseros (laca, cinta, placa de aluminio) |
| 2 | Banco Río, Acassuso (Argentina) | 2006 | Rehenes, negociación como contador de tiempo, huida por un túnel y en lanchas |
| 3 | Museo Isabella Stewart Gardner (Boston) | 1990 | Disfraz de policía y engaño. Sigue sin resolverse |
| 4 | Fuga de Alcatraz | 1962 | Rutina de prisión durante días: cavar, cabezas falsas, balsa de chubasqueros |
| 5 | Gran robo del tren (Reino Unido) | 1963 | Coordinación de equipo y señal ferroviaria manipulada |
| 6 | Banco Central de Fortaleza (Brasil) | 2005 | Túnel de unos 80 m desde una empresa de jardinería falsa |

## 7. Alcance de la versión 1 (lo que se publica)

**Entra:**
- Episodio 1 completo (3 o 4 niveles).
- Tutorial integrado en el primer nivel.
- Menú, guardado de progreso y estrellas.
- Español e inglés.
- Sin anuncios ni compras.

**No entra:** multijugador, editor de niveles, monetización, episodios 2 en adelante. Los episodios se añaden después en actualizaciones.

## 8. Estilo

- **Visual:** 2D con vista cenital. Estilo plano e ilustrado, con paleta noir (azules nocturnos y acentos ámbar y rojo). Legible en pantalla pequeña.
- **Sonido:** música de tensión con toques de jazz que sube con la sospecha. Pasos, alarmas y cerraduras. Narración opcional en los briefings.

## 9. Tecnología

- **Prototipo (ahora):** HTML5/JavaScript en un único fichero, jugable desde el móvil con un enlace y sin instalar nada. Es desechable: solo sirve para comprobar si es divertido.
- **Producción:** Godot 4 en 2D. Exporta a iOS y Android, y el proyecto son ficheros de texto versionables en Git. La lógica del prototipo (visión, sospecha, rutas) se reescribe en GDScript.
- **Compilaciones:** Android desde CI en Linux. iOS desde CI en macOS (GitHub Actions o Codemagic), con TestFlight.

## 10. Aspectos legales y de contenido

- Se presenta como **"inspirado en hechos reales"**.
- Nombres cambiados para personas vivas o condenadas. Los hechos históricos públicos se cuentan tal cual.
- Sin violencia explícita: el foco está en el ingenio, no en hacer daño.
- Clasificación por edades prevista: 12+ (temática de crimen sin violencia gráfica).

## 11. Riesgos

| Riesgo | Mitigación |
|---|---|
| El sigilo en pantalla táctil resulta incómodo | Lo validamos con el prototipo antes de producir nada más |
| La historia se queda en texto que nadie lee | Briefings cortos, mecánicas que cuentan la historia y epílogo con dato sorpresa |
| Alcance que se dispara | Versión 1 = un solo episodio. Lo demás va en actualizaciones |
| Regla de 12 testers en Google Play | Reclutar testers durante la fase beta |

## 12. Hoja de ruta

1. **Prototipo** de un nivel jugable y validar que es divertido. *(En curso)*
2. **Vertical slice en Godot:** un nivel con arte y sonido definitivos.
3. **Episodio 1 completo:** 3 o 4 niveles, menú, guardado, traducciones.
4. **Beta:** TestFlight y prueba cerrada en Google Play (12 testers, 14 días).
5. **Publicación** en App Store y Google Play.
6. **Episodios 2, 3…** como actualizaciones.

## 13. Qué tiene que responder el prototipo

- ¿Es cómodo moverse tocando la pantalla, o hace falta un joystick?
- ¿Se entienden los conos de visión y la barra de sospecha sin explicarlos?
- ¿Es divertido neutralizar los sensores con los gadgets del caso real?
- ¿El epílogo "lo que pasó de verdad" engancha?
- ¿La dificultad es razonable (cuántos intentos hacen falta)?
