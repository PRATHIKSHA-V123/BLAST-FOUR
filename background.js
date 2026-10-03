// ===== Floating coloured balls in the background =====

const BALL_COLORS = ['#ff2d55', '#ffd000', '#00e5ff', '#7cff6b', '#ffffff', '#ff8a3c'];
const BALL_COUNT = 18;

const layer = document.createElement('div');
layer.className = 'balls';

for (let i = 0; i < BALL_COUNT; i++) {
  const ball = document.createElement('i');
  ball.style.left = (i * 5.5 + 2) + '%';               // spread across the screen
  ball.style.setProperty('--size', (24 + (i * 7) % 46) + 'px');
  ball.style.setProperty('--time', (14 + (i * 3) % 14) + 's');
  ball.style.setProperty('--color', BALL_COLORS[i % BALL_COLORS.length]);
  ball.style.animationDelay = '-' + (i * 2) + 's';     // so balls are already floating on load
  layer.appendChild(ball);
}
document.body.prepend(layer);
