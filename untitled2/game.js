const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fit the screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
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
let fireCooldown = 0; // 총알 발사 쿨타임
let gameOver = false;
let spawnInterval = 100; // 적 생성 간격 (프레임 단위)
let spawnTimer = spawnInterval;

// 아이템 관련 변수
let shotgunMode = false;
let shotgunTimer = 0;
const SHOTGUN_DURATION = 300; // 산탄총 지속 시간 (프레임 단위)

// Initialize game
function init() {
    requestAnimationFrame(gameLoop);
}

// Spawn asteroids
function spawnAsteroids() {
    // 10% 확률로 아이템 적 생성
    const isItem = Math.random() < 0.1;
    asteroids.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        dx: (Math.random() - 0.5) * 4,
        dy: (Math.random() - 0.5) * 4,
        radius: isItem ? 20 : 30 + Math.random() * 20, // 아이템 적은 더 작게
        health: isItem ? 1 : 5, // 아이템 적은 체력 1
        isItem: isItem,
    });
}

// Game loop
function gameLoop() {
    if (!gameOver) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    } else {
        drawGameOver();
    }
}

// Update game state
function update() {
    // Move ship
    if (keys['ArrowUp']) ship.speed = Math.min(ship.speed + 0.1, 5);
    if (keys['ArrowLeft']) ship.angle -= 0.05;
    if (keys['ArrowRight']) ship.angle += 0.05;
    if (!keys['ArrowUp']) ship.speed = Math.max(ship.speed - 0.05, 0);

    ship.x += ship.speed * Math.cos(ship.angle);
    ship.y += ship.speed * Math.sin(ship.angle);

    // Wrap ship around screen
    ship.x = (ship.x + canvas.width) % canvas.width;
    ship.y = (ship.y + canvas.height) % canvas.height;

    // Cooldown for bullets
    fireCooldown = Math.max(fireCooldown - 1, 0);

    // Move bullets
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        // Remove off-screen bullets
        if (
            bullet.x < 0 ||
            bullet.x > canvas.width ||
            bullet.y < 0 ||
            bullet.y > canvas.height
        ) {
            bullets.splice(index, 1);
        }
    });

    // Move asteroids
    asteroids.forEach((asteroid) => {
        asteroid.x += asteroid.dx;
        asteroid.y += asteroid.dy;

        // Wrap asteroids around screen
        asteroid.x = (asteroid.x + canvas.width) % canvas.width;
        asteroid.y = (asteroid.y + canvas.height) % canvas.height;
    });

    // Check bullet-asteroid collisions
    bullets.forEach((bullet, bIndex) => {
        asteroids.forEach((asteroid, aIndex) => {
            const dist = Math.hypot(bullet.x - asteroid.x, bullet.y - asteroid.y);
            if (dist < asteroid.radius) {
                // Reduce asteroid health
                asteroid.health -= 1;

                // Remove bullet
                bullets.splice(bIndex, 1);

                // Remove asteroid if health is 0
                if (asteroid.health <= 0) {
                    // If it's an item asteroid, activate shotgun mode
                    if (asteroid.isItem) {
                        shotgunMode = true;
                        shotgunTimer = SHOTGUN_DURATION;
                    }
                    asteroids.splice(aIndex, 1);
                }
            }
        });
    });

    // Check ship-asteroid collisions
    asteroids.forEach((asteroid) => {
        const dist = Math.hypot(ship.x - asteroid.x, ship.y - asteroid.y);
        if (dist < ship.radius + asteroid.radius) {
            gameOver = true;
        }
    });

    // Spawn new asteroids periodically
    spawnTimer--;
    if (spawnTimer <= 0) {
        spawnAsteroids();
        spawnTimer = spawnInterval; // Reset timer
    }

    // Manage shotgun mode
    if (shotgunMode) {
        shotgunTimer--;
        if (shotgunTimer <= 0) {
            shotgunMode = false;
        }
    }
}

// Draw game elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-15, 10);
    ctx.lineTo(-15, -10);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();

    // Draw bullets
    bullets.forEach((bullet) => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
    });

    // Draw asteroids
    asteroids.forEach((asteroid) => {
        ctx.beginPath();
        ctx.arc(asteroid.x, asteroid.y, asteroid.radius, 0, Math.PI * 2);
        ctx.strokeStyle = asteroid.isItem ? 'blue' : 'gray'; // 아이템 적은 파란색
        ctx.stroke();
    });
}

// Draw game over screen
function drawGameOver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Press F5 to Restart', canvas.width / 2, canvas.height / 2 + 50);
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Shoot bullets with cooldown
    if (e.key === ' ' && fireCooldown === 0) {
        if (shotgunMode) {
            // 산탄총: 여러 방향으로 발사
            for (let i = -2; i <= 2; i++) {
                bullets.push({
                    x: ship.x + Math.cos(ship.angle) * 20,
                    y: ship.y + Math.sin(ship.angle) * 20,
                    dx: 10 * Math.cos(ship.angle + i * 0.2),
                    dy: 10 * Math.sin(ship.angle + i * 0.2),
                });
            }
        } else {
            // 일반 총알
            bullets.push({
                x: ship.x + Math.cos(ship.angle) * 20,
                y: ship.y + Math.sin(ship.angle) * 20,
                dx: 10 * Math.cos(ship.angle),
                dy: 10 * Math.sin(ship.angle),
            });
        }
        fireCooldown = 10; // Cooldown of 10 frames
    }
});
document.addEventListener('keyup', (e) => (keys[e.key] = false));

init();