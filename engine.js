// ===== Game rules and AI (Minimax + Alpha-Beta) for Blast Four =====

const ROWS = 6;
const COLS = 7;
const SEARCH_ORDER = [3, 2, 4, 1, 5, 0, 6]; // centre first = better pruning
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];

// pruning = Alpha-Beta ON/OFF, nodes = positions checked by the AI
const Engine = { pruning: true, nodes: 0 };

// Every possible group of four cells (69 in total)
const WINDOWS = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    for (const [dr, dc] of DIRECTIONS) {
      const endRow = r + 3 * dr;
      const endCol = c + 3 * dc;
      if (endRow < 0 || endRow >= ROWS || endCol < 0 || endCol >= COLS) continue;
      WINDOWS.push([0, 1, 2, 3].map((k) => [r + k * dr, c + k * dc]));
    }
  }
}

function newBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function lowestEmptyRow(board, col) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === 0) return row;
  }
  return -1; // column is full
}

function dropDisc(board, col, player) {
  const row = lowestEmptyRow(board, col);
  if (row >= 0) board[row][col] = player;
  return row;
}

function removeDisc(board, row, col) {
  board[row][col] = 0;
}

function isFull(board) {
  return board[0].every((cell) => cell !== 0);
}

// Returns { player, cells } if someone has four in a row, otherwise null
function findWin(board) {
  for (const cells of WINDOWS) {
    const first = board[cells[0][0]][cells[0][1]];
    if (first && cells.every(([r, c]) => board[r][c] === first)) {
      return { player: first, cells };
    }
  }
  return null;
}

// Score one group of four cells from the point of view of "me"
function scoreWindow(values, me) {
  const mine = values.filter((v) => v === me).length;
  const theirs = values.filter((v) => v === 3 - me).length;
  if (mine && theirs) return 0;
  const points = [0, 1, 6, 40][mine || theirs];
  return mine ? points : -points;
}

function evaluate(board, me) {
  let score = 0;
  for (let r = 0; r < ROWS; r++) {
    if (board[r][3] === me) score += 3;
    else if (board[r][3] === 3 - me) score -= 3;
  }
  for (const cells of WINDOWS) {
    score += scoreWindow(cells.map(([r, c]) => board[r][c]), me);
  }
  return score;
}

function minimax(board, depth, alpha, beta, turn, me) {
  Engine.nodes++;
  const win = findWin(board);
  if (win) return win.player === me ? 100000 + depth : -100000 - depth;
  if (isFull(board)) return 0;
  if (depth === 0) return evaluate(board, me);

  const maximizing = turn === me;
  let best = maximizing ? -Infinity : Infinity;

  for (const col of SEARCH_ORDER) {
    const row = dropDisc(board, col, turn);
    if (row < 0) continue;
    const score = minimax(board, depth - 1, alpha, beta, 3 - turn, me);
    removeDisc(board, row, col);

    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (Engine.pruning && alpha >= beta) break; // skip useless branches
  }
  return best;
}

// Choose a column for "player"; ties are broken randomly
function bestMove(board, player, depth) {
  const scores = Array(COLS).fill(null);
  for (const col of SEARCH_ORDER) {
    const row = dropDisc(board, col, player);
    if (row < 0) continue;
    scores[col] = minimax(board, depth - 1, -Infinity, Infinity, 3 - player, player);
    removeDisc(board, row, col);
  }
  const best = Math.max(...scores.filter((s) => s !== null));
  const ties = SEARCH_ORDER.filter((col) => scores[col] === best);
  return ties[Math.floor(Math.random() * ties.length)];
}

// Daily Challenge: the same 4 opening moves for everyone on a given date
function dailyOpening(dateText) {
  let seed = 0;
  for (const ch of dateText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const columns = [];
  for (let i = 0; i < 4; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    columns.push(Math.floor((seed / 4294967296) * COLS));
  }
  return columns; // played as player 1, 2, 1, 2
}
