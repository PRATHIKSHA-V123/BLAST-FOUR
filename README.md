# Blast Four

Blast Four is a Connect Four game where you can play against a smart AI or a friend, with undo, a daily challenge, your own disc colours and music.

**Author:** PRATHIKSHA V

## Features

- **Player vs AI** with three levels: Easy, Medium and Hard
- **Player 1 vs Player 2** on the same device (names are asked every game)
- **Daily Challenge:** a new opening every day, the same for everyone
- **Undo and Redo** buttons
- **Choose who starts:** You or AI, Player 1 or Player 2
- **Choose your disc colours**
- **Background music and sound effects** with a Settings page and volume slider
- **Saved scores** (wins, losses, draws, daily results and recent games)
- **Alpha-Beta test:** shows how many positions the AI checks with pruning ON and OFF

## How to run

1. Keep all the files together in one folder.
2. Double-click `index.html` to open it in your browser.

No installation is needed. Sound only starts after your first click, because browsers require this.

## Project structure

```
index.html       Home page
game.html        Game setup and play screen
compare.html     Scores and Alpha-Beta test
settings.html    Music and sound settings
style.css        All styles
engine.js        Game rules and AI (Minimax + Alpha-Beta)
game.js          Setup, turns, undo/redo, daily challenge
compare.js       Scores page and speed test
settings.js      Settings page
sound.js         Sound effects and music
storage.js       Saves scores in the browser
background.js    Floating coloured balls
README.md
```

## How the AI works

The AI uses **Minimax**, which looks several moves ahead and picks the move with the best result for it. **Alpha-Beta pruning** speeds this up by skipping moves that cannot change the answer.

| Level  | Moves the AI looks ahead |
|--------|--------------------------|
| Easy   | 2 |
| Medium | 3 |
| Hard   | 5 |

The Daily Challenge uses a search depth of 4.

## Built with

HTML, CSS and JavaScript (no libraries). Scores and settings are saved with the browser's `localStorage`.
