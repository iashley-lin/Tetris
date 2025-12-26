const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');

// Mobile Controls
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const downBtn = document.getElementById('down-btn');
const rotateBtn = document.getElementById('rotate-btn');

const COLS = 12;
const ROWS = 20;
const BLOCK_SIZE = 20;

const COLORS = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // O
    '#0DFF72', // L
    '#F538FF', // J
    '#FF8E0D', // I
    '#FFE138', // S
    '#3877FF'  // Z
];

const SHAPES = [
    [], // Empty
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]], // T
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]], // L
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]], // J
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]], // S
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]]  // Z
];

let board = createBoard();
let piece;
let nextPiece;
let score = 0;
let requestId;
let isGameOver = false;
let isPaused = false;

function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

class Piece {
    constructor(shape, color) {
        this.shape = shape;
        this.color = color;
        this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2);
        this.y = 0;
    }

    draw(ctx = context, offsetX = 0, offsetY = 0) {
        ctx.fillStyle = this.color;
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    ctx.fillRect((this.x + x + offsetX) * BLOCK_SIZE, (this.y + y + offsetY) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
    }

    move(x, y) {
        this.x += x;
        this.y += y;
    }

    rotate() {
        // Simple rotation algorithm
        const newShape = this.shape.map((_, index) => this.shape.map(col => col[index])).reverse();
        if (!collision(this.x, this.y, newShape)) {
            this.shape = newShape;
        }
    }
}

function createPiece() {
    const rand = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
    return new Piece(SHAPES[rand], COLORS[rand]);
}

function draw() {
    // Clear main canvas and draw board
    context.clearRect(0, 0, canvas.width, canvas.height);
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                context.fillStyle = COLORS[value];
                context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
    piece.draw();
}

function drawNextPiece() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        const shape = nextPiece.shape;
        const color = nextPiece.color;
        const xOffset = (nextCanvas.width / BLOCK_SIZE - shape[0].length) / 2;
        const yOffset = (nextCanvas.height / BLOCK_SIZE - shape.length) / 2;
        
        nextContext.fillStyle = color;
        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    nextContext.fillRect((x + xOffset) * BLOCK_SIZE, (y + yOffset) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
    }
}


function collision(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] > 0) {
                let newX = x + col;
                let newY = y + row;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (board[newY] && board[newY][newX]) > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function merge() {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                board[piece.y + y][piece.x + x] = COLORS.indexOf(piece.color);
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    outer: for (let y = ROWS - 1; y > 0; --y) {
        for (let x = 0; x < COLS; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        linesCleared++;
    }
    if (linesCleared > 0) {
        score += linesCleared * 10;
        scoreElement.innerText = score;

        if (score >= 1000) {
            isGameOver = true;
            alert('Congratulations! You reached 1000 points!');
            cancelAnimationFrame(requestId);
        }
    }
}

function drop() {
    if (isGameOver) return false;
    if (!collision(piece.x, piece.y + 1, piece.shape)) {
        piece.move(0, 1);
    } else {
        merge();
        clearLines();
        piece = nextPiece;
        nextPiece = createPiece();
        drawNextPiece();
        if (collision(piece.x, piece.y, piece.shape)) {
            isGameOver = true;
            alert('Game Over! Final Score: ' + score);
            cancelAnimationFrame(requestId);
            return false;
        }
    }
    return true;
}

let dropCounter = 0;
let dropInterval = 1000; // ms
let lastTime = 0;

function gameLoop(time = 0) {
    if (isPaused) {
        lastTime = time; // To prevent a large deltaTime jump when unpausing
        requestId = requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        drop();
        dropCounter = 0;
    }

    draw();
    if (!isGameOver) {
        requestId = requestAnimationFrame(gameLoop);
    }
}


document.addEventListener('keydown', event => {
    if (isGameOver || isPaused) return;
    
    if (event.key === 'ArrowLeft') {
        if (!collision(piece.x - 1, piece.y, piece.shape)) {
            piece.move(-1, 0);
        }
    } else if (event.key === 'ArrowRight') {
        if (!collision(piece.x + 1, piece.y, piece.shape)) {
            piece.move(1, 0);
        }
    } else if (event.key === 'ArrowDown') {
        drop();
    } else if (event.key === 'ArrowUp') { // Rotate
        piece.rotate();
    }
});

function startGame() {
    board = createBoard();
    score = 0;
    scoreElement.innerText = score;
    isGameOver = false;
    piece = createPiece();
    nextPiece = createPiece();
    drawNextPiece();
    if (requestId) {
        cancelAnimationFrame(requestId);
    }
    gameLoop();
}

startButton.addEventListener('click', startGame);

pauseButton.addEventListener('click', () => {
    if (isGameOver) return;

    isPaused = !isPaused;
    pauseButton.innerText = isPaused ? 'Resume' : 'Pause';
    if (!isPaused) {
        // To restart the loop correctly after unpausing
        gameLoop();
    }
});

// Mobile Controls Event Listeners
leftBtn.addEventListener('click', () => {
    if (isGameOver || isPaused) return;
    if (!collision(piece.x - 1, piece.y, piece.shape)) {
        piece.move(-1, 0);
        draw();
    }
});

rightBtn.addEventListener('click', () => {
    if (isGameOver || isPaused) return;
    if (!collision(piece.x + 1, piece.y, piece.shape)) {
        piece.move(1, 0);
        draw();
    }
});

downBtn.addEventListener('click', () => {
    if (isGameOver || isPaused) return;
    drop();
});

rotateBtn.addEventListener('click', () => {
    if (isGameOver || isPaused) return;
    piece.rotate();
    draw();
});
