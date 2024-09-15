import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PacmanComponent } from './pacman/pacman.component';
import { TetrisComponent } from './tetris/tetris.component';
import { TermoComponent } from './termo/termo.component';

const routes: Routes = [
    {
        path: 'tetris',
        component: TetrisComponent
    },
    {
        path: 'pacman',
        component: PacmanComponent
    },
    {
        path: 'termo',
        component: TermoComponent
    },
    {
        path: '**',
        redirectTo: 'termo'
    },
    {
        path: '',
        redirectTo: 'termo',
        pathMatch: 'full'
    }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }