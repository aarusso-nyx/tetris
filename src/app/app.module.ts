import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { TetrisComponent } from './tetris/tetris.component';

@NgModule({
  declarations: [
    TetrisComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [TetrisComponent]
})
export class AppModule { }
