import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Import BrowserAnimationsModule
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module'; // Import the AppRoutingModule

import { AppComponent } from './app/app.component';
import { TetrisComponent } from './tetris/tetris.component';
import { PacmanComponent } from './pacman/pacman.component';
import { TermoComponent } from './termo/termo.component';
import { KeyboardComponent } from './termo/keyboard/keyboard.component';

@NgModule({
  declarations: [
    AppComponent, 
    TermoComponent,
    KeyboardComponent,
    TetrisComponent,
    PacmanComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
  ],
  providers: [
    provideHttpClient(  withInterceptorsFromDi()  )
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
