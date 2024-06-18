import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { fromEvent, timer } from 'rxjs';
import * as d3 from 'd3';

import { wallMap } from './wallmap';
import { Pacman, Ghost, Maze, Direction, Position } from './walkable';

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
@Component({
  selector: 'pacman',
  templateUrl: './pacman.component.html',
  styleUrl: './pacman.component.scss'
})
export class PacmanComponent implements AfterViewInit{
  @ViewChild('board') board!: ElementRef;
  
  private svg:     any;
  private walls!:  Maze;

  public debug = true;
  public pacman = new Pacman(10, 13);
  public ghosts = [
    new Ghost( 9, 10, 'u', 'blinky', 'red',     1,  1),
    new Ghost(11, 10, 'd', 'pinky',  'cyan',   1, 21),
    new Ghost( 9, 11, 'l', 'inky',   'pink',   19,  1),
    new Ghost(11, 11, 'r', 'clyde',  'orange', 19, 21)
  ];

  public timer = timer(0, 1000);

  ///////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////
  constructor() {
    this.ghosts.forEach(ghost => ghost.chase(this.pacman));
    this.pacman.dead.subscribe(() => {
      this.ghosts.forEach(ghost => ghost.reborn());
    });
  }

  ///////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////
  ngAfterViewInit() {
    const h = wallMap.length;
    const w = wallMap[0].length;

    this.svg = d3.select(this.board.nativeElement)
                .attr('viewBox', `0 0 ${w} ${h}`);

    this.definePatterns();

    this.drawBoard(wallMap);      
    
    // Handle keyboard events
    fromEvent<KeyboardEvent>(document, 'keydown')
    .subscribe((event: KeyboardEvent) => {
      const key = event.key[5];
      if (event.key === ' ') {
        this.debug = !this.debug;
        if ( !this.debug ) {
          this.svg.selectAll('.coordinates').remove();
          this.svg.selectAll('.path').remove();
          this.svg.selectAll('.target').remove();
        }
        return;
      }
      if (key ) {
        this.pacman.go = (key.toLowerCase()) as Direction;
      }

    });
      
    // Handle eating events  
    this.pacman.onEating = (p: Position) => {
      this.svg.selectAll(`[y="${p.y}"][x="${p.x}"]`).remove();
    }
    
    // Game loop
    d3.interval(() => {
      this.pacman.moveOn(this.walls);
      this.drawPacman();

      this.ghosts.forEach(ghost => ghost.moveOn(this.walls));
      this.drawGhosts();
    }, 50);
  }

  ///////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////
  drawPacman() {
    this.svg.selectAll('.pacman').remove();
    this.svg
        .append('g')
        .attr('class', 'pacman')
        .append('rect')
        .datum(this.pacman)
          .attr('transform', (d: any) => `translate(${d.x}, ${d.y}) rotate(${d.r}, 0.5, 0.5)`)
          .attr('width', 1)
          .attr('height', 1)
          .attr('fill', (d: any) => d.strong ? `url(#buster)` : `url(#pacman)`);
  }

  drawGhosts() {
    this.svg.selectAll('.ghosts').remove();
    this.svg
        .append('g')
        .attr('class', 'ghosts')
        .selectAll('rect')
        .data(this.ghosts)
        .enter()
        .append('rect')
          .attr('transform', (d: any) => `translate(${d.x}, ${d.y})`)
          .attr('width', 1)
          .attr('height', 1)
          .attr('fill', (d: any) => `url(#${d.ghost})`)
          .attr('opacity', (d: any) => d.weak ? 0.5 : 1);

    if (this.debug) {
      this.drawPaths();
    }
  }

  drawPaths() {
    this.ghosts.forEach((ghost, i) => {
      const dx = i%2 ? 0.75 : 0.25;
      const dy = i<2 ? 0.75 : 0.25;  

      this.svg.selectAll(`.path_${ghost.name}`).remove();
        this.svg.append('g')
            .attr('class', `path_${ghost.name}`)
            .selectAll('text')
            .data(ghost.pathway)
            .enter()
            .append('text')
              .attr('x', (d: any) => d.x)
              .attr('y', (d: any) => d.y)
              .text((d: any) => d.dir)
              .attr('fill', ghost.color )
              .attr('font-size', 0.3)
              .attr('text-anchor', 'middle')
              .attr('alignment-baseline', 'middle')
              .attr('transform', `translate(${dx}, ${dy})`);


      this.svg.selectAll(`.target_${ghost.name}`).remove();
        this.svg.append('g')
            .attr('class', `target_${ghost.name}`)
            .append('text')
              .attr('x', ghost.target.x)
              .attr('y', ghost.target.y)
              .text('X')
              .attr('fill', ghost.color)
              .attr('font-size', 0.6)
              .attr('text-anchor', 'middle')
              .attr('alignment-baseline', 'middle')
              .attr('transform', `translate(${dx}, ${dy})`);
    });
  }

  drawBoard(grid: Maze) {
    const classOf = (cell: number) => {
      switch(cell) {
        case 1: return 'wall';
        case 2: return 'dot';
        case 4: return 'pill';
        default: return 'none';
      }
    }

    this.walls = grid;
    const walls = [];
    for ( let y=0; y<grid.length; y++) { 
      for (let x=0; x<grid[y].length; x++) {
          walls.push({ x, y, cell: classOf(grid[y][x]) });
      } 
    }

    this.svg
        .append('g')
        .attr('class', 'walls')
        .selectAll('rect')
        .data(walls)
        .enter()
        .append('rect')
          .attr('x', (d: any) => d.x)
          .attr('y', (d: any) => d.y)
          .attr('width', 1)
          .attr('height', 1)
          .attr('fill', (d: any) => `url(#${d.cell})`)

    if (this.debug) {
      this.drawCoordinates(walls);
    }
  }

  drawCoordinates(walls: any[]) {
    this.svg
        .append('g')  
        .attr('class', 'coordinates')
        .selectAll('text')
        .data(walls)
        .enter()  
          .append('text')
          .attr('x', (d: any) => d.x+0.5)
          .attr('y', (d: any) => d.y+0.5)
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('font-size', 0.3)
            .attr('font-family', 'Arial')
            .attr('fill', 'white')
            .attr('opacity', 0.5)
            .text((d: any) => {
              return `${d.x},${d.y}`;
            });
  }

  ///////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////
  definePatterns() {
    const defs = this.svg.append('defs');

    // define cells classes: wall, dot, pill
    defs.append('pattern')
        .attr('id', 'wall')
        .attr('width', 1)
        .attr('height', 1)
        .attr('patternUnits', 'userSpaceOnUse')
        .append('rect')
        .attr('width', 1)
        .attr('height', 1)
        .attr('fill', 'blue');

    defs.append('pattern')
        .attr('id', 'dot')
        .attr('width', 1)
        .attr('height', 1)
        .attr('patternUnits', 'userSpaceOnUse')
        .append('circle')
        .attr('cx', 0.5)
        .attr('cy', 0.5)
        .attr('r', 0.1)
        .attr('fill', this.debug ? 'transparent' : 'white');

    // blink pill
    const pill = defs.append('pattern')
        .attr('id', 'pill')
        .attr('width', 1)
        .attr('height', 1)
        .attr('patternUnits', 'userSpaceOnUse')
        .append('circle')
        .attr('cx', 0.5)
        .attr('cy', 0.5)
        .attr('r', 0.25)
        .attr('fill', 'orange');

    pill.append('animate')
        .attr('attributeName', 'r')
        .attr('values', '0.20;0.25;0.20')
        .attr('dur', '1s')
        .attr('repeatCount', 'indefinite');
        
    pill.append('animate')
        .attr('attributeName', 'fill')
        .attr('values', 'orange;red;orange')
        .attr('dur', '1s')
        .attr('repeatCount', 'indefinite');

    ///////////////////////////////
    // Ghosts
    const dx = 380; 
    const dy = 360;
    const ghosts = [
        { name: 'blinky', offset: [ 0,  0], shaky: 1  },
        { name: 'pinky',  offset: [dx,  0], shaky: 1  },
        { name: 'inky',   offset: [ 0, dy], shaky: 1.5},
        { name: 'clyde',  offset: [dx, dy], shaky: 2  }
    ];

    ghosts.forEach(ghost => {
      const pattern = defs.append('pattern')
          .attr('id', ghost.name)
          .attr('patternUnits', 'userSpaceOnUse')
          .attr('width', 1)
          .attr('height', 1)
          .append('image')
          .attr('xlink:href', '/assets/pacman/ghosts.png')
          .attr('width', 750)
          .attr('height', 730)
          .attr('transform', `scale(${4/750}) translate(${-ghost.offset[0]}, ${-ghost.offset[1]})`);

      pattern.append('animate')
          .attr('id', `${ghost.name}-shaky`)
          .attr('attributeName', 'x')
          .attr('values', `0; ${-dx/2}; 0`)
          .attr('keyTimes', '0;0.5;1')
          .attr('calcMode', 'discrete')
          .attr('dur', `${ghost.shaky}s`)
          .attr('repeatCount', 'indefinite');
          
      pattern.append('animate')
          .attr('attributeName', 'y')
          .attr('values', `0; ${-dy/2}; 0`)
          .attr('keyTimes', '0;0.5;1')
          .attr('calcMode', 'discrete')
          .attr('begin', `${ghost.shaky/4}s`)
          .attr('dur', `${ghost.shaky}s`)
          .attr('repeatCount', 'indefinite');
    });

    ///////////////////////////////
    // Pacman
    const frame = [50, 30, 10, 30, 50].map((mouth: number) => {
      const s = Math.sin(mouth * Math.PI/180);
      const c = Math.cos(mouth * Math.PI/180);
      const x = 0.5 + 0.5 * c;
      const ya = 0.5 + 0.5 * s;
      const yb = 0.5 - 0.5 * s;
  
      return `M 0.5,0.5 L ${x},${ya} A 0.5,0.5 0 1 1 ${x},${yb} L 0.5,0.5 Z`;
    });

    const pacman = defs
        .append('pattern')
        .attr('id', 'pacman')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 1)
        .attr('height', 1)
        .append('g')
        .attr('transform', 'scale(0.8), translate(0.1, 0.1)');

    const chomp = pacman.append('path')
          .attr('d', frame[0])
          .attr('fill', 'yellow');

    chomp.append('animate')
        .attr('attributeName', 'd')
        .attr('values', frame.join(';'))
        .attr('dur', '1.5s')
        .attr('repeatCount', 'indefinite');

    pacman.append('circle')
        .attr('cx', 0.55)
        .attr('cy', 0.25)
        .attr('r', 0.1)
        .attr('fill', 'black');


    ///////////////////////////////
    // Buster
    const buster = defs
        .append('pattern')
        .attr('id', 'buster')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 1)
        .attr('height', 1)
        .append('g')
        .attr('transform', 'scale(0.8), translate(0.1, 0.1)');
    
    const eater = buster.append('path')
        .attr('d', frame[0])
        .attr('fill', 'red')
    
    eater.append('animate')
        .attr('attributeName', 'fill')
        .attr('values', 'red;yellow;red'  )
        .attr('dur', '1s')
        .attr('repeatCount', 'indefinite');
    
    eater.append('animate')
        .attr('attributeName', 'd')
        .attr('values', frame.join(';'))
        .attr('dur', '1s')
        .attr('repeatCount', 'indefinite');

      buster.append('circle')
        .attr('cx', 0.55)
        .attr('cy', 0.25)
        .attr('r', 0.13)
        .attr('fill', 'black');
  }
}
