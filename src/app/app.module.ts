import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { TetrisComponent } from './tetris/tetris.component';
import { PacmanComponent } from './pacman/pacman.component';
@NgModule({
  declarations: [
    TetrisComponent,
    PacmanComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [PacmanComponent]
})
export class AppModule { }
