// ===== Game screen: setup, turns, AI, undo / redo, daily challenge =====

const $ = (id) => document.getElementById(id);
const AI_DEPTH = { Easy: 2, Medium: 3, Hard: 5 };

let chosenMode = 'ai';
let mode, names, firstPlayer, difficulty;
let board, turn, over, roundId = 0;
let history = [];
let redoStack = [];

// ---------- Setup screen ----------

function showMode(newMode) {
  chosenMode = newMode;
  document.querySelectorAll('.mode').forEach((button) => {
    button.classList.toggle('on', button.dataset.mode === newMode);
  });
  $('name2Row').hidden = newMode !== '2p';
  $('levelRow').hidden = newMode !== 'ai';
  $('firstRow').hidden = newMode === 'daily';
  $('dailyInfo').hidden = newMode !== 'daily';
  $('label2').textContent = newMode === '2p' ? 'Player 2 colour' : 'AI colour';
  $('first').innerHTML = newMode === '2p'
    ? '<option value="1">Player 1</option><option value="2">Player 2</option>'
    : '<option value="1">You</option><option value="2">AI</option>';

  const result = Store.get('daily', {})[todayKey()];
  $('dailyInfo').textContent = 'Same opening for everyone today. You move first against the Hard AI. Today: '
    + (result || 'not played yet') + '.';
}

function startFromSetup() {
  const name1 = $('name1').value.trim();
  const name2 = $('name2').value.trim();
  if (chosenMode === '2p' && (!name1 || !name2)) {
    $('setupError').textContent = 'Please enter a name for both players.';
    return;
  }
  if ($('color1').value === $('color2').value) {
    $('setupError').textContent = 'Please pick two different colours.';
    return;
  }
  $('setupError').textContent = '';

  mode = chosenMode;
  names = [name1 || 'You', mode === '2p' ? name2 : 'AI 🤖'];
  difficulty = $('level').value;
  firstPlayer = mode === 'daily' ? 1 : Number($('first').value);
  $('board').style.setProperty('--c1', $('color1').value);
  $('board').style.setProperty('--c2', $('color2').value);

  $('setup').hidden = true;
  $('game').hidden = false;
  newRound();
}

// Names are cleared every time so different people can play
function backToSetup() {
  roundId++;
  $('modal').classList.remove('on');
  $('name1').value = '';
  $('name2').value = '';
  $('game').hidden = true;
  $('setup').hidden = false;
  showMode(chosenMode);
}

// ---------- One round ----------

function newRound() {
  roundId++;
  $('modal').classList.remove('on');
  board = newBoard();
  history = [];
  redoStack = [];
  over = false;
  turn = firstPlayer;

  if (mode === 'daily') {
    dailyOpening(todayKey()).forEach((col, i) => dropDisc(board, col, (i % 2) + 1));
    turn = 1;
  }
  render();
  maybeAiTurn();
}

const aiThinking = () => !over && mode !== '2p' && turn === 2;

function render(winCells = []) {
  const last = history[history.length - 1];
  $('board').innerHTML = '';
  board.forEach((rowCells, r) => {
    rowCells.forEach((value, c) => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.col = c;
      if (value) {
        const disc = document.createElement('div');
        disc.className = 'disc p' + value;
        if (last && last.row === r && last.col === c) disc.classList.add('drop');
        if (winCells.some(([wr, wc]) => wr === r && wc === c)) disc.classList.add('win');
        cell.appendChild(disc);
      }
      $('board').appendChild(cell);
    });
  });

  $('p1').innerHTML = '<span class="dot" style="background:' + $('color1').value + '"></span>' + names[0];
  $('p2').innerHTML = '<span class="dot" style="background:' + $('color2').value + '"></span>' + names[1];
  $('p1').classList.toggle('turn', !over && turn === 1);
  $('p2').classList.toggle('turn', !over && turn === 2);
  $('msg').textContent = over ? '' : aiThinking() ? 'AI is thinking...' : names[turn - 1] + "'s turn";
  $('undo').disabled = !canUndo();
  $('redo').disabled = over || aiThinking() || redoStack.length === 0;
}

function play(col) {
  const row = dropDisc(board, col, turn);
  if (row < 0) {
    $('msg').textContent = 'That column is full. Pick another one.';
    return;
  }
  history.push({ row, col, player: turn });
  redoStack = [];
  Sound.play('drop');

  const win = findWin(board);
  if (win || isFull(board)) {
    finish(win);
    return;
  }
  turn = 3 - turn;
  render();
  maybeAiTurn();
}

function maybeAiTurn() {
  if (!aiThinking()) return;
  const id = roundId;
  setTimeout(() => {
    if (id !== roundId || over) return;
    const depth = mode === 'daily' ? 4 : AI_DEPTH[difficulty];
    play(bestMove(board, 2, depth));
  }, 500);
}

// ---------- Undo / Redo ----------

// Against the AI, undo takes back both the AI's move and yours
function canUndo() {
  const needed = mode === '2p' ? 1 : 2;
  return !over && !aiThinking() && history.length >= needed;
}

function undo() {
  if (!canUndo()) return;
  const count = mode === '2p' ? 1 : 2;
  const removed = history.splice(-count);
  removed.forEach((move) => removeDisc(board, move.row, move.col));
  redoStack.push(removed);
  turn = removed[0].player;
  Sound.play('click');
  render();
}

function redo() {
  if (over || aiThinking() || !redoStack.length) return;
  const group = redoStack.pop();
  group.forEach((move) => {
    board[move.row][move.col] = move.player;
    history.push(move);
  });
  turn = 3 - group[group.length - 1].player;
  Sound.play('click');
  render();
}

// ---------- Game over ----------

function finish(win) {
  over = true;
  render(win ? win.cells : []);
  record(win);

  let title, text, sound;
  if (!win) {
    title = '🤝 It is a draw!';
    text = 'Nobody wins this time.';
    sound = 'draw';
  } else if (mode === '2p') {
    title = '🎉 ' + names[win.player - 1] + ' wins!';
    text = 'Well played both of you.';
    sound = 'win';
  } else if (win.player === 1) {
    title = '🎉 ' + names[0] + ' wins!';
    text = 'You beat the AI.';
    sound = 'win';
  } else {
    title = '🤖 AI wins!';
    text = 'Try again, you can do it.';
    sound = 'lose';
  }
  Sound.play(sound);
  setTimeout(() => {
    $('resultTitle').textContent = title;
    $('resultText').textContent = text;
    $('modal').classList.add('on');
  }, 800);
}

function record(win) {
  const outcome = !win ? 'draw' : win.player === 1 ? 'won' : 'lost';

  if (mode === 'ai') {
    const ai = Store.get('ai', { wins: 0, losses: 0, draws: 0 });
    if (outcome === 'won') ai.wins++;
    else if (outcome === 'lost') ai.losses++;
    else ai.draws++;
    Store.set('ai', ai);
  } else if (mode === '2p') {
    const two = Store.get('2p', { p1: 0, p2: 0, draws: 0 });
    if (!win) two.draws++;
    else if (win.player === 1) two.p1++;
    else two.p2++;
    Store.set('2p', two);
  } else {
    const daily = Store.get('daily', {});
    if (daily[todayKey()] !== 'won') daily[todayKey()] = outcome;
    Store.set('daily', daily);
  }

  const label = { ai: 'vs AI', '2p': names.join(' vs '), daily: 'Daily Challenge' }[mode];
  const text = !win ? 'draw' : mode === '2p' ? names[win.player - 1] + ' won' : 'you ' + outcome;
  const recent = Store.get('recent', []);
  recent.unshift(todayKey() + ' · ' + label + ': ' + text);
  Store.set('recent', recent.slice(0, 8));
}

// ---------- Connect buttons ----------

document.querySelectorAll('.mode').forEach((button) => {
  button.onclick = () => {
    showMode(button.dataset.mode);
    Sound.play('click');
  };
});
$('start').onclick = startFromSetup;
$('undo').onclick = undo;
$('redo').onclick = redo;
$('newGame').onclick = backToSetup;
$('rematch').onclick = newRound;
$('newPlayers').onclick = backToSetup;
$('board').onclick = (event) => {
  const cell = event.target.closest('.cell');
  if (cell && !over && !aiThinking()) play(Number(cell.dataset.col));
};

showMode('ai');
