import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module'; // Import the AppRoutingModule

import { TetrisComponent } from './tetris/tetris.component';
import { PacmanComponent } from './pacman/pacman.component';
import { AppComponent } from './app/app.component';

@NgModule({
  declarations: [
    AppComponent, 
    TetrisComponent,
    PacmanComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
