import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export function normalizeString(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

@Injectable({
  providedIn: 'root',
})
export class TermoService {
  private wordCache: { [key: number]: string[] } = {};

  constructor(private http: HttpClient) {}

  getWordList(length: number): Observable<string[]> {
    if (this.wordCache[length]) {
      // Return cached words as an Observable
      return of(this.wordCache[length]);
    }
    // Load words from local JSON files and cache them
    return this.http
      .get<string[]>(`assets/words/words${length}.json`)
      .pipe(
        tap((words) => {
          this.wordCache[length] = words;
        })
      );
  }

  getRandomWord(length: number): Observable<string> {
    return this.getWordList(length).pipe(
      map((words) => words[Math.floor(Math.random() * words.length)])
    );
  }

  validateWord(word: string): Observable<boolean> {
    const length = word.length;
    return this.getWordList(length).pipe(
      map((words) => {
        const normalizedWords = words.map(normalizeString);
        const normalizedInput = normalizeString(word);
        return normalizedWords.includes(normalizedInput);
      })
    );
  }
}