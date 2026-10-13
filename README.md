# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

## Puntuación

| Asteroide       | Puntos |
| --------------- | ------ |
| Grande          | 20     |
| Mediano         | 50     |
| Pequeño         | 100    |
| Estrella fugaz  | 150    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up **Triple Disparo**: al destruir un asteroide puede caer un pickup; al recogerlo la nave dispara 3 balas en abanico durante 5 segundos (el HUD muestra la cuenta atrás)
- **Estrella fugaz**: asteroide especial que cruza la pantalla a gran velocidad dejando una cola dorada y chispas. Aparece de forma aleatoria durante la partida y se desvanece solo con el tiempo. Vale 150 puntos, no se divide y destruye la nave al tocarla.
