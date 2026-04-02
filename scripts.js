
// DOM Elements
const board = document.getElementById('board');
const statusText = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const resetScoresBtn = document.getElementById('resetScores');
const xScoreEl = document.getElementById('xScore');
let oScoreEl = document.getElementById('oScore'); // will be reassigned when needed
const oLabel = document.getElementById('oLabel');
const difficultySelect = document.getElementById('difficulty');
const modeSelect = document.getElementById('mode');
const shareBtn = document.getElementById('shareBtn');

// Game State
let cells = Array(9).fill(null);
let currentPlayer = 'X';
let gameOver = false;
let xScore = 0;
let oScore = 0;
let mode = 'ai';
let difficulty = 'medium';

// Winning Patterns
const WIN_PATTERNS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

// Voice control (fixed)
let isSpeaking = false;
const bridgetSpeak = async (text) => {
  if (isSpeaking) return;
  isSpeaking = true;

  try {
    const audio = new Audio(
      `https://api.streamelements.com/kappa/v2/speech?voice=Joanna&text=${encodeURIComponent(text)}`
    );
    await audio.play();
  } catch (err) {
    console.error("Voice error:", err);
  }

  isSpeaking = false;
};

// Create board
for (let i = 0; i < 9; i++) {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  cell.dataset.index = i;
  board.appendChild(cell);
  cell.addEventListener('click', () => makeMove(i));
}

// Mode change (FIXED)
modeSelect.addEventListener('change', (e) => {
  mode = e.target.value;

  oLabel.innerHTML = mode === 'ai'
    ? '🤖 Bridget O: <span id="oScore"></span>'
    : '🧑 Player O: <span id="oScore"></span>';

  oScoreEl = document.getElementById('oScore');
  oScoreEl.textContent = oScore;

  resetGame();
});

// Difficulty change
difficultySelect.addEventListener('change', (e) => {
  difficulty = e.target.value;
});

// Move logic
const makeMove = (index) => {
  if (cells[index] || gameOver) return;

  cells[index] = currentPlayer;
  board.children[index].textContent = currentPlayer;

  const winPattern = getWinnerPattern(cells, currentPlayer);

  if (winPattern) {
    highlightWin(winPattern);

    const winnerName =
      currentPlayer === 'O' && mode === 'ai'
        ? 'Bridget 🤖'
        : `Player ${currentPlayer}`;

    statusText.textContent = `🎉 ${winnerName} wins!`;
    updateScore(currentPlayer);
    gameOver = true;

    bridgetSpeak(
      currentPlayer === 'O' ? "I win!" : "Nice move! You win!"
    );

    return;
  }

  if (isDraw(cells)) {
    statusText.textContent = "😐 It's a draw!";
    gameOver = true;
    bridgetSpeak("It's a draw!");
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

  if (mode === 'ai' && currentPlayer === 'O') {
    statusText.textContent = "Bridget 🤖 is thinking...";
    setTimeout(computerMove, 600);
  } else {
    statusText.textContent = `Player ${currentPlayer}'s turn`;
  }
};

// AI move
const computerMove = () => {
  if (gameOver) return;

  let move;
  if (difficulty === 'easy') move = getRandomMove();
  else if (difficulty === 'medium')
    move = Math.random() < 0.5 ? getRandomMove() : findBestMove(cells);
  else move = findBestMove(cells);

  makeMove(move);
};

// Utilities
const getWinnerPattern = (boardState, player) => {
  return WIN_PATTERNS.find(([a,b,c]) =>
    boardState[a] === player &&
    boardState[b] === player &&
    boardState[c] === player
  );
};

const highlightWin = (pattern) =>
  pattern.forEach(i => board.children[i].classList.add('win'));

const isDraw = (b) => b.every(cell => cell);

const getRandomMove = () => {
  const empty = cells.map((v,i) => (v ? null : i)).filter(v => v !== null);
  return empty[Math.floor(Math.random() * empty.length)];
};

// Minimax AI
const minimax = (boardState, isMax) => {
  if (getWinnerPattern(boardState, 'O')) return 1;
  if (getWinnerPattern(boardState, 'X')) return -1;
  if (isDraw(boardState)) return 0;

  let best = isMax ? -Infinity : Infinity;

  for (let i = 0; i < 9; i++) {
    if (!boardState[i]) {
      boardState[i] = isMax ? 'O' : 'X';
      let score = minimax(boardState, !isMax);
      boardState[i] = null;
      best = isMax ? Math.max(best, score) : Math.min(best, score);
    }
  }

  return best;
};

const findBestMove = (b) => {
  let bestScore = -Infinity;
  let move;

  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      b[i] = 'O';
      let score = minimax(b, false);
      b[i] = null;

      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }

  return move;
};

// Score + Reset
const updateScore = (player) => {
  if (player === 'X') xScoreEl.textContent = ++xScore;
  else oScoreEl.textContent = ++oScore;
};

const resetGame = () => {
  cells = Array(9).fill(null);
  Array.from(board.children).forEach(c => {
    c.textContent = '';
    c.classList.remove('win');
  });

  gameOver = false;
  currentPlayer = 'X';
  statusText.textContent = "Player X's turn";
};

const resetScores = () => {
  xScore = 0;
  oScore = 0;

  xScoreEl.textContent = '0';
  oScoreEl.textContent = '0';

  resetGame();
};

// Share
shareBtn.addEventListener('click', async () => {
  const message = `🎮 Tic Tac Toe Scores:
X: ${xScore}
O: ${oScore}
Play: ${window.location.href}`;

  if (navigator.share) {
    await navigator.share({ text: message });
  } else {
    navigator.clipboard.writeText(message);
    alert('Copied!');
  }
});

// Buttons
resetBtn.addEventListener('click', resetGame);
resetScoresBtn.addEventListener('click', resetScores);

// Start
resetGame();
