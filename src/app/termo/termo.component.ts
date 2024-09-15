import { Component, OnInit } from '@angular/core';
import { TermoService, normalizeString } from './termo.service';
import { Tile } from './termo';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  templateUrl: './termo.component.html',
  styleUrls: ['./termo.component.css'],
  animations: [
    trigger('flip', [
      state('default', style({ transform: 'rotateX(0)' })),
      state('flipped', style({ transform: 'rotateX(360deg)' })),
      transition('default => flipped', [animate('1.5s')]),
    ]),

    trigger('fadeInOut', [
      transition(':enter', [    // :enter is alias to 'void => *'
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 })),
      ]),
      transition(':leave', [    // :leave is alias to '* => void'
        animate(500, style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class TermoComponent implements OnInit {
  wordLengths = [5, 6, 7];
  wordLength = 5;
  maxAttempts = 6;
  currentAttempt = 0;
  gameStarted = false;
  secretWord = '';
  currentGuess = '';
  tiles: Tile[] = [];
  usedKeys: { [key: string]: string } = {};
  message = '';
  gameOver = false;

  constructor(private termoService: TermoService) {}

  ngOnInit(): void {}

  async startGame() {
    this.termoService.getRandomWord(this.wordLength).subscribe((word) => {
      this.secretWord = word;
      const len = this.secretWord.length;
      this.maxAttempts = len + 1;
      this.currentAttempt = 0;
      this.currentGuess = '';
      this.gameStarted = true;
      this.gameOver = false;
      this.message = '';
      this.usedKeys = {};
      console.log('Secret Word:', this.secretWord); // Remove in production
      console.log(this.maxAttempts, len);
      this.tiles = Array(this.maxAttempts * len)
        .fill(null)
        .map(() => ({ letter: '', class: '', state: 'default' }));
    });
  }

  handleKeyPress(key: string) {
    console.log(key);
    if (this.gameOver) return;

    key = key.toLowerCase();
    if (key === 'enter') {
      this.submitGuess();
    } else if (key === 'delete') {
      this.deleteLetter();
    } else if (/^[a-zà-úç]$/.test(key)) {
      this.addLetter(key);
    }
  }

  addLetter(letter: string) {
    if (this.currentGuess.length < this.wordLength) {
      this.currentGuess += letter.toLowerCase();
      this.updateBoard();
    }
  }

  deleteLetter() {
    if (this.currentGuess.length > 0) {
      this.currentGuess = this.currentGuess.slice(0, -1);
      this.updateBoard();
    }
  }


  submitGuess() {
    const normalizedGuess = normalizeString(this.currentGuess);
  console.log(normalizedGuess);
  console.log(this.secretWord);
  console.log(this.currentGuess);
    if (normalizedGuess.length !== this.wordLength) {
      alert(`A palavra deve ter ${this.wordLength} letras.`);
      return;
    }
  
    this.termoService.validateWord(this.currentGuess).subscribe((isValid) => {
      if (!isValid) {
        alert('Palavra não encontrada na lista.');
        return;
      }
  
      this.evaluateGuess();
      this.currentAttempt++;
  
      const normalizedSecret = normalizeString(this.secretWord);
  
      if (normalizedGuess === normalizedSecret) {
        this.message = '🎉 Parabéns! Você acertou a palavra!';
        this.gameOver = true;
      } else if (this.currentAttempt >= this.maxAttempts) {
        this.message = `😞 Fim de jogo! A palavra era "${this.secretWord.toUpperCase()}".`;
        this.gameOver = true;
      }
  
      this.currentGuess = '';
    });
  }

  updateBoard() {
    const start = this.currentAttempt * this.wordLength;
    for (let i = 0; i < this.wordLength; i++) {
      this.tiles[start + i].letter = this.currentGuess[i]
        ? this.currentGuess[i].toUpperCase()
        : '';
    }
  }


  evaluateGuess() {
    const start = this.currentAttempt * this.wordLength;
    const tilesSlice = this.tiles.slice(start, start + this.wordLength);
  
    const normalizedSecret = normalizeString(this.secretWord);
    let secretArray: (string|null)[] = normalizedSecret.split('');
    const normalizedGuess = normalizeString(this.currentGuess);
    const guessArray: (string|null)[] = normalizedGuess.split('');
    const originalGuessArray = this.currentGuess.split('');
    const feedback: string[] = [];
  
    // First pass for correct letters
    guessArray.forEach((letter, index) => {
      if (letter === secretArray[index]) {
        feedback[index] = 'correct';
        secretArray[index] = null;
        guessArray[index] = null;
        this.usedKeys[originalGuessArray[index]] = 'correct';
      }
    });
  
    // Second pass for present letters
    guessArray.forEach((letter, index) => {
      if (letter && secretArray.includes(letter)) {
        feedback[index] = 'present';
        secretArray[secretArray.indexOf(letter)] = null;
        if (this.usedKeys[originalGuessArray[index]] !== 'correct') {
          this.usedKeys[originalGuessArray[index]] = 'present';
        }
      } else if (!feedback[index]) {
        feedback[index] = 'absent';
        if (!this.usedKeys[originalGuessArray[index]]) {
          this.usedKeys[originalGuessArray[index]] = 'absent';
        }
      }
    });
  
    // Update tiles with feedback and original letters
    tilesSlice.forEach((tile, index) => {
      tile.class = feedback[index];
      tile.state = 'flipped';
      tile.letter = originalGuessArray[index].toUpperCase();
    });
  }
}