import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PacmanComponent } from './pacman/pacman.component';
import { TetrisComponent } from './tetris/tetris.component';

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
        path: '**',
        redirectTo: 'pacman'
    },
    {
        path: '',
        redirectTo: 'pacman',
        pathMatch: 'full'
    }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }