const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const ground = 431;
const keys = new Set();
const state = { running: false, over: false, score: 0, last: 0, shake: 0 };
const player = { x: 235, y: ground - 106, vx: 0, vy: 0, health: 100, facing: 1, attack: 0, attackType: "", cooldown: 0, hitFlash: 0 };
const rival = { x: 690, y: ground - 106, vx: 0, vy: 0, health: 100, facing: -1, attack: 0, attackType: "", cooldown: 0, hitFlash: 0 };
const message = document.querySelector("#message");

document.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
  if (event.key === "Enter" && (!state.running || state.over)) startGame();
  if (["a", "d", "w", "j", "k", "Enter"].includes(event.key)) event.preventDefault();
});
document.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

function startGame() {
  Object.assign(player, { x: 235, y: ground - 106, vx: 0, vy: 0, health: 100, facing: 1, attack: 0, attackType: "", cooldown: 0, hitFlash: 0 });
  Object.assign(rival, { x: 690, y: ground - 106, vx: 0, vy: 0, health: 100, facing: -1, attack: 0, attackType: "", cooldown: 0, hitFlash: 0 });
  Object.assign(state, { running: true, over: false, score: 0, shake: 0 });
  message.classList.add("hidden");
}

function update(dt) {
  if (!state.running) return;
  movePlayer(dt);
  moveRival(dt);
  updateFighter(player, dt);
  updateFighter(rival, dt);
  resolveAttack(player, rival);
  resolveAttack(rival, player);
  state.shake = Math.max(0, state.shake - dt);
  document.querySelector("#player-health").style.width = `${player.health}%`;
  document.querySelector("#enemy-health").style.width = `${rival.health}%`;
  document.querySelector("#score").textContent = String(state.score).padStart(6, "0");
  if (player.health <= 0 || rival.health <= 0) endGame(player.health > 0);
}

function movePlayer(dt) {
  const left = keys.has("a");
  const right = keys.has("d");
  player.vx = (right ? 3.9 : 0) - (left ? 3.9 : 0);
  if (player.vx) player.facing = Math.sign(player.vx);
  if (keys.has("w") && player.y >= ground - 107) player.vy = -11;
  if (keys.has("j")) beginAttack(player, "punch");
  if (keys.has("k")) beginAttack(player, "kick");
  player.x = Math.max(80, Math.min(W - 130, player.x + player.vx * dt * 60));
}

function moveRival(dt) {
  const distance = player.x - rival.x;
  rival.facing = distance > 0 ? 1 : -1;
  rival.vx = Math.abs(distance) > 160 ? Math.sign(distance) * 1.8 : 0;
  if (Math.abs(distance) < 185 && Math.random() < dt * 1.4) beginAttack(rival, Math.random() > 0.45 ? "punch" : "kick");
  rival.x = Math.max(80, Math.min(W - 130, rival.x + rival.vx * dt * 60));
}

function updateFighter(fighter, dt) {
  fighter.vy += 0.55 * dt * 60;
  fighter.y += fighter.vy * dt * 60;
  if (fighter.y > ground - 107) { fighter.y = ground - 107; fighter.vy = 0; }
  fighter.cooldown = Math.max(0, fighter.cooldown - dt);
  fighter.attack = Math.max(0, fighter.attack - dt);
  fighter.hitFlash = Math.max(0, fighter.hitFlash - dt);
}

function beginAttack(fighter, type) {
  if (fighter.cooldown > 0 || fighter.attack > 0) return;
  fighter.attackType = type;
  fighter.attack = type === "kick" ? 0.36 : 0.27;
  fighter.cooldown = type === "kick" ? 0.7 : 0.42;
}

function resolveAttack(attacker, target) {
  if (!attacker.attack || attacker.attack < 0.11) return;
  const reach = attacker.attackType === "kick" ? 112 : 91;
  const direction = target.x - attacker.x;
  if (Math.sign(direction) !== attacker.facing || Math.abs(direction) > reach || target.hitFlash) return;
  target.health = Math.max(0, target.health - (attacker.attackType === "kick" ? 11 : 7));
  target.hitFlash = 0.22;
  attacker.attack = 0.02;
  state.shake = 0.13;
  if (attacker === player) state.score += attacker.attackType === "kick" ? 150 : 100;
}

function draw() {
  ctx.save();
  if (state.shake) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 5);
  drawBackground();
  drawShadow(player); drawShadow(rival);
  drawFighter(player, "#3de6e1", "#1a899b");
  drawFighter(rival, "#ff477e", "#8d285e");
  ctx.restore();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#29234b"); sky.addColorStop(0.65, "#514069"); sky.addColorStop(1, "#17152b");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffd166"; ctx.fillRect(790, 70, 50, 50);
  ctx.fillStyle = "#35294d"; ctx.fillRect(0, 285, W, ground - 285);
  for (let x = 20; x < W; x += 87) {
    const height = 65 + ((x * 17) % 80);
    ctx.fillStyle = x % 2 ? "#24203e" : "#2b2347";
    ctx.fillRect(x, ground - 100 - height, 70, height);
    ctx.fillStyle = "#ffd166";
    for (let wy = ground - 80 - height; wy < ground - 35; wy += 24) if ((x + wy) % 3) ctx.fillRect(x + 14, wy, 9, 8);
  }
  ctx.fillStyle = "#1b192e"; ctx.fillRect(0, ground, W, H - ground);
  ctx.strokeStyle = "#3e355d"; ctx.lineWidth = 3;
  for (let x = -H; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(W / 2, ground); ctx.lineTo(x, H); ctx.stroke(); }
  ctx.strokeStyle = "#ec4b86"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, ground, W, ground); ctx.stroke();
}

function drawShadow(fighter) {
  ctx.fillStyle = "rgb(5 4 14 / 45%)";
  ctx.beginPath(); ctx.ellipse(fighter.x + 44, ground + 4, 45, 10, 0, 0, Math.PI * 2); ctx.fill();
}

function drawFighter(fighter, main, dark) {
  const x = Math.round(fighter.x);
  const y = Math.round(fighter.y);
  const flip = fighter.facing;
  ctx.save();
  ctx.translate(x + 44, y);
  ctx.scale(flip, 1);
  if (fighter.hitFlash) ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#f5b27b"; ctx.fillRect(-15, 0, 30, 30);
  ctx.fillStyle = "#201d38"; ctx.fillRect(-18, -6, 36, 10); ctx.fillRect(-14, -13, 27, 8);
  ctx.fillStyle = dark; ctx.fillRect(-29, 29, 58, 52);
  ctx.fillStyle = main; ctx.fillRect(-25, 34, 50, 44);
  ctx.fillStyle = "#f5b27b"; ctx.fillRect(-34, 37, 10, 28);
  ctx.fillStyle = main; ctx.fillRect(-26, 78, 20, 29); ctx.fillRect(7, 78, 20, 29);
  ctx.fillStyle = "#201d38"; ctx.fillRect(-28, 102, 24, 9); ctx.fillRect(7, 102, 27, 9);
  if (fighter.attack) {
    ctx.fillStyle = "#f5b27b";
    if (fighter.attackType === "kick") ctx.fillRect(25, 55, 55, 12);
    else ctx.fillRect(22, 38, 58, 13);
    ctx.fillStyle = "#fff1ca"; ctx.fillRect(73, fighter.attackType === "kick" ? 53 : 36, 9, 17);
  }
  ctx.restore();
}

function endGame(won) {
  state.running = false; state.over = true;
  message.innerHTML = `<strong>${won ? "YOU WIN!" : "K.O.!"}</strong><span>${won ? "The block is yours." : "The streets fight back."} Press ENTER to rematch</span>`;
  message.classList.remove("hidden");
}

function loop(time = 0) {
  const dt = Math.min(0.033, (time - state.last) / 1000 || 0);
  state.last = time;
  update(dt); draw();
  requestAnimationFrame(loop);
}

draw();
requestAnimationFrame(loop);
