// wordle.interfaces.ts

export interface Tile {
    letter: string;
    class: string;
    state: string;
  }

export interface WordList {
    [key: number]: string[];
}