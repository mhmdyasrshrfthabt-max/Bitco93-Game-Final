// Bitco93 Game - Main Game Logic

// Game state
let score = 0;
let lives = 3;
let gameTime = 0;
let level = 1;
let gamePaused = false;
let gameOver = false;
let levelComplete = false;

// Canvas context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Player object
const player = {
    x: canvas.width * 0.1,
    y: canvas.height * 0.6,
    width: 40,
    height: 60,
    velocityX: 0,
    velocityY: 0,
    speed: 8,
    jumpForce: -18,
    gravity: 0.8,
    isGrounded: false,
    color: '#4CAF50',
    
    // Ragdoll parts
    parts: [
        { x: 0, y: -20, radius: 15, color: '#4CAF50' }, // Head
        { x: 0, y: 10, radius: 20, color: '#45a049' },  // Body
        { x: -25, y: 0, radius: 8, color: '#4CAF50' },  // Left arm
        { x: 25, y: 0, radius: 8, color: '#4CAF50' },   // Right arm
        { x: -15, y: 30, radius: 10, color: '#4CAF50' }, // Left leg
        { x: 15, y: 30, radius: 10, color: '#4CAF50' }   // Right leg
    ],
    
    // Stretch properties
    isStretching: false,
    stretchPower: 0,
    stretchAngle: 0,
    
    update() {
        if (gamePaused || gameOver || levelComplete) return;
        
        // Apply gravity
        this.velocityY += this.gravity;
        
        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Ground collision
        if (this.y + this.height > canvas.height - 100) {
            this.y = canvas.height - 100 - this.height;
            this.velocityY = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
        
        // Screen boundaries
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = 0;
        }
        if (this.x + this.width > canvas.width) {
            this.x = canvas.width - this.width;
            this.velocityX = 0;
        }
        
        // Apply damping
        this.velocityX *= 0.92;
        this.velocityY *= 0.995;
        
        // Apply stretch force
        if (this.isStretching && this.stretchPower > 0) {
            const forceX = Math.cos(this.stretchAngle) * this.stretchPower * 0.5;
            const forceY = Math.sin(this.stretchAngle) * this.stretchPower * 0.5;
            
            this.velocityX += forceX;
            this.velocityY += forceY;
            
            // Reset stretch
            this.isStretching = false;
            this.stretchPower = 0;
        }
    },
    
    draw() {
        // Draw ragdoll parts with connections
        this.parts.forEach((part, index) => {
            const partX = this.x + this.width/2 + part.x;
            const partY = this.y + this.height/2 + part.y;
            
            // Draw part
            ctx.fillStyle = part.color;
            ctx.beginPath();
            ctx.arc(partX, partY, part.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw outline
            ctx.strokeStyle = '#2E7D32';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Connect to body (first part after head)
            if (index > 0) {
                const connectTo = index === 1 ? 0 : 1; // Connect to head or body
                const connectX = this.x + this.width/2 + this.parts[connectTo].x;
                const connectY = this.y + this.height/2 + this.parts[connectTo].y;
                
                ctx.strokeStyle = '#2E7D32';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(partX, partY);
                ctx.lineTo(connectX, connectY);
                ctx.stroke();
            }
        });
        
        // Draw face
        const headX = this.x + this.width/2 + this.parts[0].x;
        const headY = this.y + this.height/2 + this.parts[0].y;
        
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(headX - 5, headY - 3, 4, 0, Math.PI * 2);
        ctx.arc(headX + 5, headY - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(headX - 5 + (this.velocityX * 0.1), headY - 3, 2, 0, Math.PI * 2);
        ctx.arc(headX + 5 + (this.velocityX * 0.1), headY - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Smile
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(headX, headY + 3, 8, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // Draw stretch indicator if stretching
        if (this.isStretching && this.stretchPower > 0) {
            const endX = headX + Math.cos(this.stretchAngle) * (20 + this.stretchPower * 2);
            const endY = headY + Math.sin(this.stretchAngle) * (20 + this.stretchPower * 2);
            
            // Line
            ctx.strokeStyle = `rgba(255, ${255 - this.stretchPower * 2}, 0, 0.8)`;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(headX, headY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Arrow head
            ctx.fillStyle = `rgb(255, ${100 - this.stretchPower}, 0)`;
            ctx.beginPath();
            ctx.translate(endX, endY);
            ctx.rotate(this.stretchAngle);
            ctx.moveTo(0, 0);
            ctx.lineTo(-10, -5);
            ctx.lineTo(-10, 5);
            ctx.closePath();
            ctx.fill();
            ctx.rotate(-this.stretchAngle);
            ctx.translate(-endX, -endY);
        }
    },
    
    jump() {
        if (this.isGrounded) {
            this.velocityY = this.jumpForce;
            this.isGrounded = false;
            if (typeof playSound === 'function') playSound('jump');
        }
    },
    
    move(direction) {
        this.velocityX = direction * this.speed;
    },
    
    startStretch(x, y) {
        this.isStretching = true;
        const headX = this.x + this.width/2 + this.parts[0].x;
        const headY = this.y + this.height/2 + this.parts[0].y;
        
        this.stretchAngle = Math.atan2(y - headY, x - headX);
        this.stretchPower = 0;
    },
    
    updateStretch(x, y) {
        if (!this.isStretching) return;
        
        const headX = this.x + this.width/2 + this.parts[0].x;
        const headY = this.y + this.height/2 + this.parts[0].y;
        
        const dx = x - headX;
        const dy = y - headY;
        this.stretchPower = Math.min(Math.sqrt(dx * dx + dy * dy) / 5, 50);
        this.stretchAngle = Math.atan2(dy, dx);
    },
    
    endStretch() {
        if (this.isStretching && this.stretchPower > 5) {
            if (typeof playSound === 'function') playSound('jump');
        }
        this.isStretching = false;
    }
};

// Platforms
const platforms = [];
function createPlatforms() {
    platforms.length = 0;
    
    // Ground platform
    platforms.push({
        x: 0,
        y: canvas.height - 100,
        width: canvas.width,
        height: 100,
        color: '#8B4513',
        type: 'ground'
    });
    
    // Level-based platforms
    switch(level) {
        case 1:
            platforms.push(
                { x: 200, y: canvas.height - 200, width: 150, height: 20, color: '#A0522D', type: 'normal' },
                { x: 450, y: canvas.height - 300, width: 150, height: 20, color: '#A0522D', type: 'normal' },
                { x: 700, y: canvas.height - 250, width: 150, height: 20, color: '#A0522D', type: 'normal' }
            );
            break;
        case 2:
            platforms.push(
                { x: 150, y: canvas.height - 180, width: 120, height: 20, color: '#2196F3', type: 'ice' },
                { x: 350, y: canvas.height - 280, width: 120, height: 20, color: '#FF9800', type: 'bouncy' },
                { x: 550, y: canvas.height - 220, width: 120, height: 20, color: '#A0522D', type: 'normal' },
                { x: 750, y: canvas.height - 320, width: 120, height: 20, color: '#9C27B0', type: 'moving' }
            );
            break;
        case 3:
            platforms.push(
                { x: 100, y: canvas.height - 150, width: 100, height: 20, color: '#A0522D', type: 'normal' },
                { x: 250, y: canvas.height - 250, width: 100, height: 20, color: '#FF9800', type: 'bouncy' },
                { x: 400, y: canvas.height - 200, width: 100, height: 20, color: '#2196F3', type: 'ice' },
                { x: 550, y: canvas.height - 300, width: 100, height: 20, color: '#A0522D', type: 'normal' },
                { x: 700, y: canvas.height - 180, width: 100, height: 20, color: '#9C27B0', type: 'moving' }
            );
            break;
    }
}

// Coins
const coins = [];
function createCoins() {
    coins.length = 0;
    
    const coinCount = 5 + level * 2;
    for (let i = 0; i < coinCount; i++) {
        coins.push({
            x: 100 + i * 120,
            y: canvas.height - 200 - Math.sin(i) * 50,
            radius: 12,
            collected: false,
            animation: i * 0.5,
            color: '#FFD700'
        });
    }
}

// Obstacles
const obstacles = [];
function createObstacles() {
    obstacles.length = 0;
    
    for (let i = 0; i < level; i++) {
        obstacles.push({
            x: 300 + i * 200,
            y: canvas.height - 140,
            width: 40,
            height: 60,
            type: 'spike',
            color: '#FF5252'
        });
    }
}

// Finish line
const finishLine = {
    x: canvas.width - 100,
    y: canvas.height - 400,
    width: 50,
    height: 80,
    color: '#4CAF50'
};

// Input handling
let keys = {};

// Keyboard events
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ' || e.key === 'Spacebar') {
        player.jump();
    }
    
    if (e.key === 'Escape') {
        gamePaused = !gamePaused;
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) pauseMenu.style.display = gamePaused ? 'block' : 'none';
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Button controls
document.getElementById('left-btn').addEventListener('mousedown', () => player.move(-1));
document.getElementById('left-btn').addEventListener('mouseup', () => player.velocityX = 0);
document.getElementById('left-btn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.move(-1);
});
document.getElementById('left-btn').addEventListener('touchend', () => player.velocityX = 0);

document.getElementById('right-btn').addEventListener('mousedown', () => player.move(1));
document.getElementById('right-btn').addEventListener('mouseup', () => player.velocityX = 0);
document.getElementById('right-btn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.move(1);
});
document.getElementById('right-btn').addEventListener('touchend', () => player.velocityX = 0);

document.getElementById('jump-btn').addEventListener('click', () => player.jump());
document.getElementById('jump-btn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.jump();
});

// Stretch area
const stretchArea = document.getElementById('stretch-area');
stretchArea.addEventListener('mousedown', handleStretchStart);
stretchArea.addEventListener('mousemove', handleStretchMove);
stretchArea.addEventListener('mouseup', handleStretchEnd);
stretchArea.addEventListener('mouseleave', handleStretchEnd);

stretchArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStretchStart({ clientX: touch.clientX, clientY: touch.clientY });
});

stretchArea.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStretchMove({ clientX: touch.clientX, clientY: touch.clientY });
});

stretchArea.addEventListener('touchend', handleStretchEnd);

function handleStretchStart(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    player.startStretch(x, y);
    stretchArea.style.background = 'rgba(255, 255, 255, 0.2)';
    stretchArea.style.borderColor = '#FF5722';
    stretchArea.textContent = '💪 اترك لتحرير القوة!';
}

function handleStretchMove(e) {
    if (!player.isStretching) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    player.updateStretch(x, y);
}

function handleStretchEnd() {
    player.endStretch();
    stretchArea.style.background = 'rgba(255, 255, 255, 0.1)';
    stretchArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    stretchArea.textContent = '💪 اسحب هنا لشد الرجدول!';
}

// Score particles
let scoreParticles = [];

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game time
    if (!gamePaused && !gameOver && !levelComplete) {
        gameTime += 1/60;
        
        // Update time display
        const minutes = Math.floor(gameTime / 60);
        const seconds = Math.floor(gameTime % 60);
        document.getElementById('time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Handle continuous keyboard input
    if (keys['ArrowLeft']) player.move(-1);
    if (keys['ArrowRight']) player.move(1);
    
    // Update player
    player.update();
    
    // Update platforms (for moving platforms)
    platforms.forEach(platform => {
        if (platform.type === 'moving') {
            platform.x += Math.sin(gameTime) * 2;
        }
    });
    
    // Check collisions
    checkCollisions();
    
    // Draw game objects
    drawBackground();
    drawPlatforms();
    drawObstacles();
    drawCoins();
    drawFinishLine();
    player.draw();
    
    // Draw UI
    drawUI();
    
    // Check win condition
    if (player.x > finishLine.x && 
        player.x < finishLine.x + finishLine.width &&
        player.y > finishLine.y && 
        player.y < finishLine.y + finishLine.height) {
        completeLevel();
    }
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Drawing functions
function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F7FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 5; i++) {
        const x = (canvas.width * 0.2 * i + gameTime * 20) % (canvas.width + 200) - 100;
        const y = 50 + Math.sin(gameTime + i) * 30;
        
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.arc(x + 40, y, 40, 0, Math.PI * 2);
        ctx.arc(x + 80, y, 30, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Distant mountains
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 100);
    for (let i = 0; i < 10; i++) {
        const x = (i * canvas.width / 10);
        const y = canvas.height - 100 - Math.sin(i + gameTime * 0.1) * 50;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height - 100);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
}

function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Platform details
        ctx.strokeStyle = platform.type === 'ice' ? '#E3F2FD' : 
                         platform.type === 'bouncy' ? '#FFF3E0' :
                         platform.type === 'moving' ? '#F3E5F5' : '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        
        // Platform pattern
        ctx.fillStyle = platform.type === 'ice' ? 'rgba(255, 255, 255, 0.3)' :
                       platform.type === 'bouncy' ? 'rgba(255, 255, 255, 0.2)' :
                       platform.type === 'moving' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
        
        const patternSize = 10;
        for (let px = platform.x + 5; px < platform.x + platform.width; px += patternSize) {
            for (let py = platform.y + 5; py < platform.y + platform.height; py += patternSize) {
                if ((px + py) % (patternSize * 2) === 0) {
                    ctx.fillRect(px, py, patternSize - 2, patternSize - 2);
                }
            }
        }
    });
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        
        if (obstacle.type === 'spike') {
            // Draw spike
            ctx.beginPath();
            ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y);
            ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
            ctx.closePath();
            ctx.fill();
            
            // Spike details
            ctx.strokeStyle = '#D32F2F';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Danger symbol
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚠️', obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
        }
    });
}

function drawCoins() {
    coins.forEach(coin => {
        if (coin.collected) return;
        
        // Update animation
        coin.animation += 0.1;
        const floatY = Math.sin(coin.animation) * 10;
        
        // Draw coin
        ctx.fillStyle = coin.color;
        ctx.beginPath();
        ctx.arc(coin.x, coin.y + floatY, coin.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(coin.x - 4, coin.y + floatY - 4, coin.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin ring
        ctx.strokeStyle = '#FFA000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(coin.x, coin.y + floatY, coin.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Coin symbol
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', coin.x, coin.y + floatY);
    });
}

function drawFinishLine() {
    // Flag pole
    ctx.fillStyle = '#795548';
    ctx.fillRect(finishLine.x + 10, finishLine.y, 5, finishLine.height);
    
    // Flag
    ctx.fillStyle = finishLine.color;
    ctx.beginPath();
    ctx.moveTo(finishLine.x + 15, finishLine.y + 10);
    ctx.lineTo(finishLine.x + 45, finishLine.y + 25);
    ctx.lineTo(finishLine.x + 15, finishLine.y + 40);
    ctx.closePath();
    ctx.fill();
    
    // Flag details
    ctx.strokeStyle = '#388E3C';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Finish text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏁 النهاية', finishLine.x + 25, finishLine.y + finishLine.height + 20);
}

function drawUI() {
    // Score particles
    if (scoreParticles.length > 0) {
        scoreParticles.forEach((particle, index) => {
            particle.y -= 2;
            particle.alpha -= 0.02;
            
            ctx.fillStyle = `rgba(255, 215, 0, ${particle.alpha})`;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('+10', particle.x, particle.y);
            
            if (particle.alpha <= 0) {
                scoreParticles.splice(index, 1);
            }
        });
    }
}

// Collision detection
function checkCollisions() {
    // Platform collisions
    let onPlatform = false;
    
    platforms.forEach(platform => {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height + 10 &&
            player.velocityY > 0) {
            
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.isGrounded = true;
            onPlatform = true;
            
            // Platform effects
            if (platform.type === 'bouncy') {
                player.velocityY = -25;
                player.isGrounded = false;
                if (typeof playSound === 'function') playSound('jump');
            } else if (platform.type === 'ice') {
                player.velocityX *= 1.1; // Slippery
            }
        }
    });
    
    // If not on any platform, not grounded
    if (!onPlatform && player.y + player.height < canvas.height - 100) {
        player.isGrounded = false;
    }
    
    // Coin collisions
    coins.forEach((coin, index) => {
        if (!coin.collected) {
            const dx = player.x + player.width/2 - coin.x;
            const dy = player.y + player.height/2 - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < player.width/2 + coin.radius) {
                coin.collected = true;
                score += 10;
                document.getElementById('score').textContent = score;
                
                // Add score particle
                scoreParticles.push({
                    x: coin.x,
                    y: coin.y,
                    alpha: 1
                });
                
                if (typeof playSound === 'function') playSound('coin');
            }
        }
    });
    
    // Obstacle collisions
    obstacles.forEach(obstacle => {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
            
            // Player hit obstacle
            lives--;
            document.getElementById('lives').textContent = lives;
            
            // Knockback
            player.velocityX = (player.x < obstacle.x ? -15 : 15);
            player.velocityY = -10;
            
            if (typeof playSound === 'function') playSound('hurt');
            
            if (lives <= 0) {
                gameOver = true;
                showGameOver();
            }
        }
    });
}

// Level completion
function completeLevel() {
    levelComplete = true;
    
    // Calculate final stats
    const timeBonus = Math.max(0, 300 - Math.floor(gameTime)) * 10;
    const lifeBonus = lives * 100;
    const coinBonus = coins.filter(c => c.collected).length * 20;
    
    const finalScore = score + timeBonus + lifeBonus + coinBonus;
    
    // Update display
    document.getElementById('final-score').textContent = finalScore;
    document.getElementById('final-time').textContent = 
        `${Math.floor(gameTime / 60).toString().padStart(2, '0')}:${Math.floor(gameTime % 60).toString().padStart(2, '0')}`;
    document.getElementById('final-lives').textContent = lives;
    
    // Show level complete menu
    document.getElementById('level-complete-menu').style.display = 'block';
    if (typeof playSound === 'function') playSound('win');
}

// Game over
function showGameOver() {
    document.getElementById('game-over-score').textContent = score;
    document.getElementById('game-over-level').textContent = level;
    document.getElementById('game-over-menu').style.display = 'block';
}

// Initialize game
function initGame() {
    createPlatforms();
    createCoins();
    createObstacles();
    
    // Reset player position
    player.x = canvas.width * 0.1;
    player.y = canvas.height * 0.6;
    player.velocityX = 0;
    player.velocityY = 0;
    
    // Start game loop
    gameLoop();
}

// Start game when page loads
window.addEventListener('load', initGame);
