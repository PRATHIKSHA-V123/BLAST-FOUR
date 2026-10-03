// ===== Scores page + Alpha-Beta speed test =====

const $ = (id) => document.getElementById(id);

function card(title, rows) {
  return '<div class="card"><h3>' + title + '</h3>'
    + rows.map(([label, value]) => '<div class="row"><span>' + label + '</span><b class="stat">' + value + '</b></div>').join('')
    + '</div>';
}

const ai = Store.get('ai', { wins: 0, losses: 0, draws: 0 });
const two = Store.get('2p', { p1: 0, p2: 0, draws: 0 });
const daily = Store.get('daily', {});
const dailyWins = Object.values(daily).filter((result) => result === 'won').length;

$('scores').innerHTML =
  card('🤖 Player vs AI', [['You won', ai.wins], ['AI won', ai.losses], ['Draws', ai.draws]])
  + card('👥 Player 1 vs Player 2', [['Player 1 won', two.p1], ['Player 2 won', two.p2], ['Draws', two.draws]])
  + card('📅 Daily Challenge', [['Days won', dailyWins], ['Today', daily[todayKey()] || 'not played']]);

const recent = Store.get('recent', []);
$('recent').innerHTML = recent.length
  ? recent.map((line) => '<li>' + line + '</li>').join('')
  : '<li>No games yet. Go play one!</li>';

$('reset').onclick = () => {
  if (!confirm('Delete all saved scores?')) return;
  ['ai', '2p', 'daily', 'recent'].forEach((key) => localStorage.removeItem('b4_' + key));
  location.reload();
};

// Alpha-Beta ON vs OFF: same AI, count the positions it checks
$('run').onclick = () => {
  $('speed').hidden = false;
  $('speed').innerHTML = '<tr><th>Depth</th><th>Pruning ON</th><th>Pruning OFF</th></tr>';
  setTimeout(() => {
    for (const depth of [2, 3, 4, 5]) {
      const cells = [true, false].map((pruning) => {
        Engine.pruning = pruning;
        Engine.nodes = 0;
        const start = performance.now();
        bestMove(newBoard(), 2, depth);
        return Engine.nodes.toLocaleString() + ' positions, ' + Math.round(performance.now() - start) + ' ms';
      });
      $('speed').innerHTML += '<tr><td>' + depth + '</td><td>' + cells[0] + '</td><td>' + cells[1] + '</td></tr>';
    }
    Engine.pruning = true;
  }, 50);
};
