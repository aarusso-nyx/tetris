import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { fromEvent, NEVER, Subject, Subscription, switchMap, timer } from 'rxjs';
import { isNil, sample } from 'lodash-es';
import * as d3 from 'd3';

import { shapes } from './pieces';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
export interface Coord {
  x: number;
  y: number;
  t: string;
};

export type Piece = Array<Coord>;
export type Board = string[][];

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
const emptyRow = (cols: number): (string)[] => Array<string>(cols).fill(' ');

const colorOf = (d: Coord): string => { 
  switch (d.t) {
    case 'I': return 'cyan';
    case 'J': return 'blue';
    case 'L': return 'orange';
    case 'O': return 'yellow';
    case 'S': return 'green';
    case 'T': return 'purple';
    case 'Z': return 'red';
    case ' ': return 'none';
    default:  return 'white';
  }
};

const rotate = (piece: Piece, ccw: (1 | -1)):  (p: Coord) => Coord => {
  const center = piece.reduce((acc, coord) => ({ x: acc.x + coord.x, y: acc.y + coord.y }),{ x: 0, y: 0 });
  
  const x0 = Math.trunc(center.x / piece.length);
  const y0 = Math.trunc(center.y / piece.length);
  
  // Rotate each coordinate around the center
  return (p => ({ x: x0 + ccw*(p.y - y0), y: y0 - ccw*(p.x-x0), t: p.t }));
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
@Component({
  selector: 'tetris',
  templateUrl: './tetris.component.html',
  styleUrls: ['./tetris.component.css']
})
export class TetrisComponent implements AfterViewInit, OnDestroy {
  @ViewChild('tetris') tetris!: ElementRef;
  @ViewChild('gscore') gscore!: ElementRef;

  private readonly rows = 20;
  private readonly cols = 10;

  private svg_game: any;
  private svg_score: any;


  private timer$!: Subscription;
  private pauseSubject = new Subject<boolean>();

  private _speed = 500;
  private _pause = false;

  // Game State
  private _board: Board = [];
  private _piece: Piece = [];

  // Game Stats
  private _score: number = 0;
  private _level: number = 1;
  private _lines: number = 0;
  private _moves: number = 0;
  private _count: number[] = [ 0, 0, 0, 0, 0 ];
  private _clear: boolean[] = [ true, false, false, false, false, false, false, false, false, false, false ];
  
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  constructor() { 
    this.reset();
  }

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  get count(): number[] { return this._count; }
  get score(): number { return this._score; }
  get level(): number { return this._level; }
  get moves(): number { return this._moves; }
  get lines(): number { return this._lines; }
  get pause(): boolean { return this._pause; }
  

  set pause(pause: boolean) {
    this._pause = pause;
    this.pauseSubject.next(pause);
  }

  // set lines(lines: number) {
    // this._lines = lines;
  // }
  
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  get piece(): Piece { return this._piece; }
  set piece(piece: Piece) {
    this._piece = piece;
    this.renderBlocks(piece, 'piece-block');
  }

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  get board(): Board { return this._board; }
  set board(board: Board) {
    this.renderBoard(board);

    // Remove any full rows
    board = board.filter(row => row.some(cell => cell === ' '));

    // Count the number of full rows removed
    const lines = this.rows - board.length;
  
    // Update the score
    this.addScore(board, lines);

    // Fill in the empty rows
    while (board.length < this.rows) {
        board.unshift(emptyRow(this.cols));
    }
        
    // Update the board
    this._board = board;

    // Render the board after a delay
    if (lines > 0) {
      timer(200).subscribe(() => this.renderBoard(board));
    }
  }

  private addScore(board: Board, lines: number): void {
    const levels = [ 0, 5, 10, 15, 20, 167, 217, 274, 340, 415, 501]
    const weight = [ 0, 1, 3, 10, 30 ];
    
    if ( lines < 0 || lines > 4) {
      return;
    }

    this._lines += lines;
    this._count[lines] += 1;

    // Update the level
    const l = levels.findIndex(l => l === this._lines);
    if ( l !== -1 ) {
      this._level = l + 1;
      this._speed = 500 - 50*l;
      this.pause = false;
    }

    // Update the score
    this._score += weight[lines] * this._level;

    // Check if board is tottally empty
    if (board.every(row => row.every(cell => cell === ' '))) {
      // Reward the player for clearing the board but only once per level; 
      if ( !this._clear[this._level] ) {
        this._clear[this._level] = true;
        this._score *= 1.2;     // 20% bonus
      }
    }
  }
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  reset(): void {
    this._moves = 0;
    this._lines = 0;
    this._score = 0;
    this._level = 1;
    this._count = [ 0, 0, 0, 0, 0 ];
    this._pause = false;
    this._speed = 500;
    this.board = Array.from({ length: this.rows }, () => emptyRow(this.cols));
    this.piece = this.newPiece();
    this.pauseSubject.next(false);
  }

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  private checkBoard(piece: Piece): boolean {
    const r = this.rows;
    const c = this.cols;

    if ( !piece.every(p => p.x >= 0 && p.x < c && p.y >= 0 && p.y < r) ) {
      return false;
    }

    return piece.every(p => this.board[p.y][p.x] === ' ');
  }
  

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  private newPiece(): Piece {
      const shape = sample(sample(shapes)) as Board;  
      const x0 = Math.ceil((this.cols - shape[0].length) / 2);
      
      this._moves += 1;
    
      const piece = shape
                  .flatMap((row, y) => row.map<Coord>((t, x) => ({ t, x: x+x0, y })))
                  .filter(cell => cell.t !== ' ');

      if (!this.checkBoard(piece)) {
         this.gameOver();
      }

      return piece;
  }    

  private gameOver(): void {
    alert(`Game Over! Score: ${this.score}`);
    this.reset();
  }


  printBoard(board: Board): string[] {
    return board.map(row => row.join(''));
  }

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  private mergeBoard(piece: Piece): Board {
    const board = this.board.map(row => row.slice());
    piece.forEach(p => board[p.y][p.x] = p.t);
    return board;
  }

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  private renderBoard(board: Board): void {
    const coords = board
                  .flatMap((row, y) => row.map<Coord>((t, x) => ({ t, x, y })))
                  .filter(cell => cell.t !== ' ');

    this.renderBlocks(coords, 'board-block');
  }

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  private renderBlocks(blocks: Coord[], group: string): void {
    const r = 0.15;

    if ( isNil(this.svg_game) ) 
      return;

    this.svg_game.selectAll(`.${group}`).remove();

    this.svg_game.selectAll(`.${group}`)
        .data(blocks)
        .enter()
        .append('rect')
        .attr('class', (d: Coord) => `${group} ${d.t}`)
        .attr('x', (d: Coord) => d.x)
        .attr('y', (d: Coord) => d.y)
        .attr('width', 1)
        .attr('height', 1)
        .attr('fill', colorOf)
        .attr('stroke', 'black')
        .attr('stroke-width', r/2)
        .attr('rx', r)
        .attr('ry', r);
  }
  
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  ngAfterViewInit(): void {
    this.svg_game = d3.select(this.tetris.nativeElement)
                  .attr('viewBox', '0 0 10 20');
    
    this.svg_score = d3.select(this.gscore.nativeElement)
                  .attr('viewBox', '0 0 10 10');



    // Handle Input
    fromEvent<KeyboardEvent>(document, 'keydown')
        .subscribe((event: KeyboardEvent) => {
          let piece: Piece = this.piece;

          switch (event.key) {
              case 'ArrowLeft':   // Move left
                  piece = this.piece.map(p => ({ ...p, x: p.x-1 }));
                  break;

              case 'ArrowRight':  // Move right
                  piece = this.piece.map(p => ({ ...p, x: p.x+1 }));
                  break;

              case 'ArrowDown':   // Move down
                  piece = this.piece.map(p => ({ ...p, y: p.y+1 }));
                  break;

              case ' ':           // Drop
                  while(true) {
                    piece = this.piece.map(p => ({ ...p, y: p.y+1 }));
                    if ( !this.checkBoard(piece) ) {
                      break;
                    }
                    this.piece = piece;
                  }

                  break;
              case 'ArrowUp':     // Rotate clockwise         
                  piece = this.piece.map(rotate(this.piece, 1));
                  break;
              case 'z':           // Rotate counter-clockwise 
                  piece = this.piece.map(rotate(this.piece, -1));
                  break;

              case 'r':           // Reset
                  this.reset();
                  return;

              case 'p':           // Pause
                  this.pause = !this.pause;
                  return;

              default:
                  return;
          }

          if (this.checkBoard(piece)) {
              this.piece = piece;
          } else if (event.key === 'ArrowDown') {
              this.board = this.mergeBoard(this.piece);
              this.piece = this.newPiece();
          }
        });

    // Handle Game Loop
    this.timer$ = this.pauseSubject.pipe(
      switchMap(paused => paused ? NEVER : timer(0, this._speed))
    ).subscribe((t: number) => {
      const piece = this.piece.map(p => ({ ...p, y: p.y+1 }));
      if (this.checkBoard(piece)) {
          this.piece = piece;
      } else {
          this.board = this.mergeBoard(this.piece);
          this.piece = this.newPiece();
      }
    });
  }

  ngOnDestroy(): void {
    this.timer$.unsubscribe();
  }
}