(function(){

    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');
    
    
    const CELL_SIZE = 20;
    const GRID_WIDTH = canvas.width / CELL_SIZE;   
    const GRID_HEIGHT = canvas.height / CELL_SIZE; 
    
    
    let snake = [];
    let dx = 1, dy = 0;
    let score = 0;
    let bestScore = 0;
    let food = { x: 12, y: 10 };
    let gameLoop = null;
    let gameRunning = true;
    let changingDirection = false;
    
    
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('bestScore');
    const gameStatusElement = document.getElementById('gameStatus');
    
    
    function loadBestScore() {
        try {
            const saved = localStorage.getItem('snakeBestScore');
            if(saved && !isNaN(parseInt(saved))) {
                bestScore = parseInt(saved);
                bestScoreElement.innerText = bestScore;
            }
        } catch(e) {
            console.log('LocalStorage недоступен');
        }
    }
    
    
    function saveBestScore() { 
        try {
            localStorage.setItem('snakeBestScore', bestScore);
        } catch(e) {}
    }
    
    
    function initSnake() {
        const startX = Math.floor(GRID_WIDTH / 2) - 2;
        const startY = Math.floor(GRID_HEIGHT / 2);
        snake = [
            { x: startX + 3, y: startY },
            { x: startX + 2, y: startY },
            { x: startX + 1, y: startY },
            { x: startX,     y: startY }
        ];
    }
    
    
    function generateRandomFood() {
        const totalCells = GRID_WIDTH * GRID_HEIGHT;
        if(snake.length >= totalCells) {
            return null;
        }
        
        const occupied = new Set();
        for(let segment of snake) {
            occupied.add(`${segment.x},${segment.y}`);
        }
        
        if(occupied.size === totalCells) return null;
        
        const freeCells = [];
        for(let i = 0; i < GRID_WIDTH; i++) {
            for(let j = 0; j < GRID_HEIGHT; j++) {
                if(!occupied.has(`${i},${j}`)) {
                    freeCells.push({ x: i, y: j });
                }
            }
        }
        
        if(freeCells.length === 0) return null;
        const randIndex = Math.floor(Math.random() * freeCells.length);
        return freeCells[randIndex];
    }
    
    function spawnFood() {
        const newFood = generateRandomFood();
        if(newFood) {
            food = newFood;
            return true;
        } else {
            gameWin();
            return false;
        }
    }
    
    
    function drawGrid() {
        ctx.strokeStyle = '#2a6b3c';
        ctx.lineWidth = 0.5;
        for(let i = 0; i <= GRID_WIDTH; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(canvas.width, i * CELL_SIZE);
            ctx.stroke();
        }
    }
    
    function drawSnake() {
        for(let i = 0; i < snake.length; i++) {
            const seg = snake[i];
            const grad = ctx.createLinearGradient(
                seg.x * CELL_SIZE, seg.y * CELL_SIZE,
                (seg.x + 1) * CELL_SIZE, (seg.y + 1) * CELL_SIZE
            );
            
            if(i === 0) {
                grad.addColorStop(0, '#8eff70');
                grad.addColorStop(1, '#48c92a');
            } else {
                grad.addColorStop(0, '#5fdb3a');
                grad.addColorStop(1, '#2c9e1a');
            }
            
            ctx.fillStyle = grad;
            ctx.fillRect(seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
            
            
            if(i === 0) {
                ctx.fillStyle = 'white';
                ctx.fillRect(seg.x * CELL_SIZE + 12, seg.y * CELL_SIZE + 6, 3, 4);
                ctx.fillRect(seg.x * CELL_SIZE + 4, seg.y * CELL_SIZE + 6, 3, 4);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(seg.x * CELL_SIZE + 13, seg.y * CELL_SIZE + 7, 2, 2);
                ctx.fillRect(seg.x * CELL_SIZE + 5, seg.y * CELL_SIZE + 7, 2, 2);
            }
        }
    }
    
    function drawFood() {
        // Яблоко
        ctx.fillStyle = '#ff3a2f';
        ctx.beginPath();
        ctx.arc(food.x * CELL_SIZE + CELL_SIZE/2, food.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE/2 - 2, 0, Math.PI*2);
        ctx.fill();
        
        // Блик
        ctx.fillStyle = '#ffd966';
        ctx.beginPath();
        ctx.arc(food.x * CELL_SIZE + CELL_SIZE/2 - 3, food.y * CELL_SIZE + CELL_SIZE/2 - 3, 2.5, 0, Math.PI*2);
        ctx.fill();
        
        // Листик
        ctx.fillStyle = '#6bcf3a';
        ctx.beginPath();
        ctx.moveTo(food.x * CELL_SIZE + 13, food.y * CELL_SIZE + 5);
        ctx.lineTo(food.x * CELL_SIZE + 18, food.y * CELL_SIZE + 2);
        ctx.lineTo(food.x * CELL_SIZE + 15, food.y * CELL_SIZE + 8);
        ctx.fill();
    }
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        drawFood();
        drawSnake();
    }
    
   
    function moveSnake() {
        if(!gameRunning) return false;
        
        const head = snake[0];
        const newHead = {
            x: head.x + dx,
            y: head.y + dy
        };
        
        const willEat = (newHead.x === food.x && newHead.y === food.y);
        
        snake.unshift(newHead);
        if(!willEat) {
            snake.pop();
        } else {
            score += 10;
            scoreElement.innerText = score;
            
            if(score > bestScore) {
                bestScore = score;
                bestScoreElement.innerText = bestScore;
                saveBestScore();
            }
            
            const success = spawnFood();
            if(!success) {
                return false;
            }
        }
        
        return true;
    }
    
    
    function checkCollision() {
        if(!gameRunning) return true;
        const head = snake[0];
        
        if(head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
            return true;
        }
        
        
        for(let i = 1; i < snake.length; i++) {
            if(snake[i].x === head.x && snake[i].y === head.y) {
                return true;
            }
        }
        return false;
    }
    
    
    function gameOver() {
        if(!gameRunning) return;
        gameRunning = false;
        if(gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        gameStatusElement.innerHTML = '💀 ИГРА ОКОНЧЕНА. Нажмите Рестарт 💀';
        drawGameOverMessage();
    }
    
    function gameWin() {
        if(!gameRunning) return;
        gameRunning = false;
        if(gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        gameStatusElement.innerHTML = '🏆 ПОБЕДА! Вы заполнили поле! 🏆';
        drawWinMessage();
    }
    
    function drawGameOverMessage() {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.fillStyle = '#ff7777';
        ctx.shadowBlur = 0;
        ctx.fillText('GAME OVER', canvas.width/2 - 75, canvas.height/2 - 20);
        ctx.font = '14px monospace';
        ctx.fillStyle = '#dddddd';
        ctx.fillText('Нажмите "Рестарт"', canvas.width/2 - 68, canvas.height/2 + 20);
    }
    
    function drawWinMessage() {
        ctx.fillStyle = 'rgba(30,40,10,0.92)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#ffff88';
        ctx.fillText('PERFECT!', canvas.width/2 - 55, canvas.height/2 - 20);
        ctx.font = '14px monospace';
        ctx.fillStyle = '#aaffaa';
        ctx.fillText('Максимальный счёт!', canvas.width/2 - 78, canvas.height/2 + 20);
    }
    
    
    function gameTick() {
        if(!gameRunning) return;
        
        changingDirection = false;
        
        const moved = moveSnake();
        if(!moved) {
            if(gameRunning) gameOver();
            return;
        }
        
        if(checkCollision()) {
            gameOver();
            return;
        }
        
        draw();
    }
    
   
    function setDirection(newDx, newDy) {
        if(!gameRunning) return;
        if(changingDirection) return;
        
        
        if((dx === -newDx && dy === -newDy)) {
            return;
        }
        
        dx = newDx;
        dy = newDy;
        changingDirection = true;
    }
    
    function handleKey(e) {
        const key = e.keyCode;
        if(key === 37) { setDirection(-1, 0); e.preventDefault(); }
        else if(key === 38) { setDirection(0, -1); e.preventDefault(); }
        else if(key === 39) { setDirection(1, 0); e.preventDefault(); }
        else if(key === 40) { setDirection(0, 1); e.preventDefault(); }
    }
    
    
    function restartGame() {
        if(gameLoop) clearInterval(gameLoop);
        
        initSnake();
        dx = 1;
        dy = 0;
        score = 0;
        gameRunning = true;
        changingDirection = false;
        scoreElement.innerText = '0';
        gameStatusElement.innerHTML = '🎮 Игра активна';
        
        const initialFood = generateRandomFood();
        if(initialFood) {
            food = initialFood;
        } else {
            food = { x: 5, y: 5 };
        }
        
        draw();
        
        gameLoop = setInterval(() => {
            gameTick();
        }, 130);
    }
    
    
    function initControls() {
        window.addEventListener('keydown', handleKey);
        
        document.getElementById('btnUp').addEventListener('click', () => setDirection(0, -1));
        document.getElementById('btnDown').addEventListener('click', () => setDirection(0, 1));
        document.getElementById('btnLeft').addEventListener('click', () => setDirection(-1, 0));
        document.getElementById('btnRight').addEventListener('click', () => setDirection(1, 0));
        document.getElementById('restartBtn').addEventListener('click', () => restartGame());
        
       
        window.addEventListener('keydown', function(e) {
            if(e.keyCode >= 37 && e.keyCode <= 40) {
                e.preventDefault();
            }
        });
    }
    
   
    function startGame() {
        loadBestScore();
        initSnake();
        const startFood = generateRandomFood();
        if(startFood) food = startFood;
        draw();
        gameLoop = setInterval(() => {
            gameTick();
        }, 130);
        initControls();
    }
    
 
    startGame();
})();