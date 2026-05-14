const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size, rounded = true) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 1024; // fator de escala

  // ── Fundo com gradiente diagonal ──────────────────────────────────────────
  if (rounded) {
    const r = size * 0.22;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();
  }

  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#1a1a2e');
  bg.addColorStop(0.5, '#16213e');
  bg.addColorStop(1, '#0f3460');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // ── Grade de pontos sutil (textura de mapa) ───────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  const spacing = 60 * s;
  for (let x = spacing; x < size; x += spacing) {
    for (let y = spacing; y < size; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 2 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Rota principal (curva bezier) ─────────────────────────────────────────
  const roadWidth = 80 * s;
  const roadColor = '#FF4500';

  // Sombra da rota
  ctx.shadowColor = 'rgba(255,69,0,0.4)';
  ctx.shadowBlur = 30 * s;

  ctx.beginPath();
  ctx.moveTo(180 * s, 900 * s);
  ctx.bezierCurveTo(
    200 * s, 620 * s,
    460 * s, 620 * s,
    512 * s, 420 * s,
  );
  ctx.bezierCurveTo(
    560 * s, 220 * s,
    760 * s, 180 * s,
    840 * s, 148 * s,
  );
  ctx.strokeStyle = roadColor;
  ctx.lineWidth = roadWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Linha central tracejada (branca)
  ctx.setLineDash([28 * s, 22 * s]);
  ctx.beginPath();
  ctx.moveTo(180 * s, 900 * s);
  ctx.bezierCurveTo(
    200 * s, 620 * s,
    460 * s, 620 * s,
    512 * s, 420 * s,
  );
  ctx.bezierCurveTo(
    560 * s, 220 * s,
    760 * s, 180 * s,
    840 * s, 148 * s,
  );
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 8 * s;
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Pin de destino (topo da rota) ─────────────────────────────────────────
  const pinX = 840 * s;
  const pinY = 148 * s;
  const pinR = 88 * s;

  // Anel de brilho externo
  ctx.shadowColor = 'rgba(255,69,0,0.6)';
  ctx.shadowBlur = 28 * s;
  ctx.beginPath();
  ctx.arc(pinX, pinY, pinR + 14 * s, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,69,0,0.2)';
  ctx.fill();
  ctx.shadowBlur = 0;

  // Círculo laranja do pin
  ctx.beginPath();
  ctx.arc(pinX, pinY, pinR, 0, Math.PI * 2);
  const pinGrad = ctx.createRadialGradient(
    pinX - 20 * s, pinY - 20 * s, 4 * s,
    pinX, pinY, pinR,
  );
  pinGrad.addColorStop(0, '#ff6a33');
  pinGrad.addColorStop(1, '#cc2200');
  ctx.fillStyle = pinGrad;
  ctx.fill();

  // Ponto branco interno
  ctx.beginPath();
  ctx.arc(pinX, pinY, 36 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Triângulo/seta do pin apontando para baixo
  const pw = 28 * s;
  ctx.beginPath();
  ctx.moveTo(pinX - pw, pinY + pinR - 10 * s);
  ctx.lineTo(pinX + pw, pinY + pinR - 10 * s);
  ctx.lineTo(pinX, pinY + pinR + 36 * s);
  ctx.closePath();
  const arrowGrad = ctx.createLinearGradient(0, pinY + pinR - 10 * s, 0, pinY + pinR + 36 * s);
  arrowGrad.addColorStop(0, '#cc2200');
  arrowGrad.addColorStop(1, '#aa1a00');
  ctx.fillStyle = arrowGrad;
  ctx.fill();

  // ── Ponto de partida (base da rota) ───────────────────────────────────────
  const startX = 180 * s;
  const startY = 900 * s;

  ctx.beginPath();
  ctx.arc(startX, startY, 54 * s, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(startX, startY, 38 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(startX, startY, 22 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#FF4500';
  ctx.fill();

  return canvas;
}

function drawSplash(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fundo
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#1a1a2e');
  bg.addColorStop(1, '#0f3460');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Ícone centralizado (versão menor)
  const iconSize = Math.min(width, height) * 0.35;
  const iconCanvas = drawIcon(Math.round(iconSize), true);
  const ix = (width - iconSize) / 2;
  const iy = (height - iconSize) / 2 - height * 0.06;
  ctx.drawImage(iconCanvas, ix, iy, iconSize, iconSize);

  // Nome do app
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(height * 0.055)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('RotaLog', width / 2, iy + iconSize + height * 0.075);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `${Math.round(height * 0.028)}px sans-serif`;
  ctx.fillText('Odômetro Digital', width / 2, iy + iconSize + height * 0.12);

  return canvas;
}

function drawFavicon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#1a1a2e');
  bg.addColorStop(1, '#0f3460');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Rota simples
  ctx.beginPath();
  ctx.moveTo(size * 0.18, size * 0.88);
  ctx.bezierCurveTo(size * 0.2, size * 0.5, size * 0.5, size * 0.5, size * 0.82, size * 0.14);
  ctx.strokeStyle = '#FF4500';
  ctx.lineWidth = size * 0.12;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Pin
  ctx.beginPath();
  ctx.arc(size * 0.82, size * 0.14, size * 0.13, 0, Math.PI * 2);
  ctx.fillStyle = '#FF4500';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.82, size * 0.14, size * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  return canvas;
}

// ── Gerar todos os assets ──────────────────────────────────────────────────
const assetsDir = path.join(__dirname, '..', 'assets');

// icon.png — 1024×1024 com cantos arredondados
const icon = drawIcon(1024, true);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), icon.toBuffer('image/png'));
console.log('✓ icon.png');

// adaptive-icon.png — 1024×1024 sem arredondamento (Android aplica a máscara)
const adaptive = drawIcon(1024, false);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptive.toBuffer('image/png'));
console.log('✓ adaptive-icon.png');

// splash-icon.png — 2048×2048 com nome do app
const splash = drawSplash(2048, 2048);
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), splash.toBuffer('image/png'));
console.log('✓ splash-icon.png');

// favicon.png — 48×48
const fav = drawFavicon(48);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), fav.toBuffer('image/png'));
console.log('✓ favicon.png');

console.log('\nTodos os ícones gerados em assets/');
