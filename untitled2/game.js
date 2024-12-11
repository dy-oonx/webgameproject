const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    speed: 0,
    radius: 15,
};
let bullets = [];
let asteroids = [];
let keys = {};
let fireCooldown = 0;
let gameOver = false;
let spawnInterval = 100;
let spawnTimer = spawnInterval;

let shotgunMode = false;
let shotgunTimer = 0;
const SHOTGUN_DURATION = 300;

function init() {
    requestAnimationFrame(gameLoop);
}

function spawnAsteroids() {
    const isItem = Math.random() < 0.1;
    asteroids.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        dx: (Math.random() - 0.5) * 4,
        dy: (Math.random() - 0.5) * 4,
        radius: isItem ? 20 : 30 + Math.random() * 20,
        health: isItem ? 1 : 5,
        isItem: isItem,
    });
}

function drawBackground() {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function gameLoop() {
    if (!gameOver) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    } else {
        drawGameOver();
    }
}

function update() {
    if (keys['ArrowUp']) ship.speed = Math.min(ship.speed + 0.1, 5);
    if (keys['ArrowLeft']) ship.angle -= 0.05;
    if (keys['ArrowRight']) ship.angle += 0.05;
    if (!keys['ArrowUp']) ship.speed = Math.max(ship.speed - 0.05, 0);

    ship.x += ship.speed * Math.cos(ship.angle);
    ship.y += ship.speed * Math.sin(ship.angle);

    ship.x = (ship.x + canvas.width) % canvas.width;
    ship.y = (ship.y + canvas.height) % canvas.height;

    fireCooldown = Math.max(fireCooldown - 1, 0);

    bullets.forEach((bullet, index) => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        if (
            bullet.x < 0 ||
            bullet.x > canvas.width ||
            bullet.y < 0 ||
            bullet.y > canvas.height
        ) {
            bullets.splice(index, 1);
        }
    });

    asteroids.forEach((asteroid) => {
        asteroid.x += asteroid.dx;
        asteroid.y += asteroid.dy;

        asteroid.x = (asteroid.x + canvas.width) % canvas.width;
        asteroid.y = (asteroid.y + canvas.height) % canvas.height;
    });

    bullets.forEach((bullet, bIndex) => {
        asteroids.forEach((asteroid, aIndex) => {
            const dist = Math.hypot(bullet.x - asteroid.x, bullet.y - asteroid.y);
            if (dist < asteroid.radius) {
                asteroid.health -= 1;
                bullets.splice(bIndex, 1);

                if (asteroid.health <= 0) {
                    if (asteroid.isItem) {
                        shotgunMode = true;
                        shotgunTimer = SHOTGUN_DURATION;
                    }
                    asteroids.splice(aIndex, 1);
                }
            }
        });
    });

    asteroids.forEach((asteroid) => {
        const dist = Math.hypot(ship.x - asteroid.x, ship.y - asteroid.y);
        if (dist < ship.radius + asteroid.radius) {
            gameOver = true;
        }
    });

    spawnTimer--;
    if (spawnTimer <= 0) {
        spawnAsteroids();
        spawnTimer = spawnInterval;
    }

    if (shotgunMode) {
        shotgunTimer--;
        if (shotgunTimer <= 0) {
            shotgunMode = false;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-15, 10);
    ctx.lineTo(-15, -10);
    ctx.closePath();
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'cyan';
    ctx.fillStyle = 'cyan';
    ctx.fill();
    ctx.restore();

    bullets.forEach((bullet) => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
    });

    asteroids.forEach((asteroid) => {
        ctx.beginPath();
        ctx.arc(asteroid.x, asteroid.y, asteroid.radius, 0, Math.PI * 2);
        ctx.strokeStyle = asteroid.isItem ? 'magenta' : 'lime';
        ctx.shadowBlur = 15;
        ctx.shadowColor = asteroid.isItem ? 'magenta' : 'lime';
        ctx.stroke();
    });

    if (shotgunMode) {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawGameOver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'cyan';
    ctx.font = '48px Orbitron';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'cyan';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Orbitron';
    ctx.fillText('Press F5 to Restart', canvas.width / 2, canvas.height / 2 + 50);
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === ' ' && fireCooldown === 0) {
        if (shotgunMode) {
            for (let i = -2; i <= 2; i++) {
                bullets.push({
                    x: ship.x + Math.cos(ship.angle) * 20,
                    y: ship.y + Math.sin(ship.angle) * 20,
                    dx: 10 * Math.cos(ship.angle + i * 0.2),
                    dy: 10 * Math.sin(ship.angle + i * 0.2),
                });
            }
        } else {
            bullets.push({
                x: ship.x + Math.cos(ship.angle) * 20,
                y: ship.y + Math.sin(ship.angle) * 20,
                dx: 10 * Math.cos(ship.angle),
                dy: 10 * Math.sin(ship.angle),
            });
        }
        fireCooldown = 10;
    }
});
document.addEventListener('keyup', (e) => (keys[e.key] = false));

init();