import { at, set } from "lodash-es";
import { BehaviorSubject, Observable } from "rxjs";

export type Maze = number[][];
export type Direction = 'd'|'u'|'l'|'r';
export type Mood = 'homed' | 'chase' | 'scatter' | 'freed' | 'exiting' | 'frightened';

const coords = (n: { x: number, y: number }): [number, number] => {
    return [ Math.round(n.x), Math.round(n.y) ];
}


const onGrid = (n: { x: number, y: number }, k: number = 0.3): boolean  => {
    const [nx, ny] = coords(n);
    const  dx = Math.abs(n.x - nx);
    const  dy = Math.abs(n.y - ny);
    return dx < k && dy < k;
} 

const randomDir = (k: string): Direction => {
    const dir = ['u', 'd', 'l', 'r'].filter(d => d !== k);
    const i = Math.floor(Math.random()*dir.length);

    return dir[i] as Direction;
}

//////////////////////////////////////////////////////////////////////  
abstract class Walkable {
    private x0: number;
    private y0: number;
    private d0: Direction;
    
    public x: number;
    public y: number;

    protected dir: Direction;
    protected nextDir: Direction;
    
    protected v: number;

    constructor(x: number, y: number, dir: Direction) {
        this.v = 1.0;
        
        this.x   = this.x0 = x;
        this.y   = this.y0 = y;
        this.dir = this.d0 = dir;
        this.nextDir = dir;
    }

    protected reborn(): void {
        this.x = this.x0;
        this.y = this.y0;
        this.dir = this.d0;
        this.nextDir = this.dir;
    }


    protected distance(p: Walkable): number {
        const [px, py] = coords(p);
        const [gx, gy] = coords(this);
        return Math.abs(px-gx) + Math.abs(py-gy);
    }

    protected get coords(): [number, number] {
        return coords(this);
    }

    protected nextPos(maze: Maze, dir: Direction): { x: number, y: number } | null {
        const d = this.v * 0.1;
        let kx=0, x = this.x;
        let ky=0, y = this.y;

        switch (dir) {
            case 'd':   ky =  1; y += ky*d;     break;
            case 'u':   ky = -1; y += ky*d;     break;
            case 'r':   kx =  1; x += kx*d;     break;
            case 'l':   kx = -1; x += kx*d;     break;
        }

        const [j, i] = coords({ x: x+kx/2, y: y+ky/2 });
        return (maze[i][j] !== 1) ? { x, y } : null;
    }


    protected moveOn(maze: Maze): boolean {
        if ( this.nextDir !== this.dir ) {
            const reverse = { d: 'u', u: 'd', r: 'l', l: 'r' };
            if ( this.nextDir === reverse[this.dir] ) {
                this.dir = this.nextDir;
            } else {
                const next = this.nextPos(maze, this.nextDir); 
                if (next && onGrid(next)) {
                    this.dir = this.nextDir;
                    this.x = Math.round(next.x);
                    this.y = Math.round(next.y);
                    return true;
                }
            }
        } 

        const next = this.nextPos(maze, this.dir);
        if (next) {
            const m = maze.length;
            const n = maze[0].length;

            // Wrap around
            this.x = (next.x + n) % n;
            this.y = (next.y + m) % m;
        }

        return !!next;
    }
}
//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
export class Pacman extends Walkable {
    r: number = 0;

    ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////
    private _score: number = 0;
    private $score = new BehaviorSubject<number>(this._score);
    get score(): Observable<number> {
        return this.$score.asObservable();
    }

     set score(s: number) {
        this._score = s;
        this.$score.next(s);
    }

    private _lives: number = 3;
    private $lives = new BehaviorSubject<number>(this._lives);
    get lives(): Observable<number> {
        return this.$lives.asObservable();
    }

    protected set lives(l: number) {
        this._lives = l;
        this.$lives.next(l);
    }

    private _level: number = 1;
    private $level = new BehaviorSubject<number>(this._level);
    get level(): Observable<number> {
        return this.$level.asObservable();
    }

    protected set level(l: number) {
        this._level = l;
        this.$level.next(l);
    }

    protected die(): void {
        this.lives = this._lives - 1;
    }

    protected eat(n: number): void {
        this.score = this._score + n;
    }

    ///////////////////////////////////////////////////////////
    set go(dir: Direction) {
        this.nextDir = dir;
    }

    private _strong: boolean = false;
    get strong(): boolean {
        return this._strong;
    }
    
    private set strong(s: boolean) {
        this._strong = s;
        setTimeout(() => this._strong = false, 15000);
    }

    ///////////////////////////////////////////////////////////
    private _eater: (i: number, j:number) => void = () => {}; 
    set onEating(eater: (i: number, j:number) => void) {
        this._eater = eater;
    }

    private $dead = new BehaviorSubject<boolean>(false);
    get dead(): Observable<boolean> {
        return this.$dead.asObservable();
    }

    ///////////////////////////////////////////////////////////
    constructor(x: number, y: number) {
        super(x, y, 'd');
        this.score = 0;
        this.lives = 3;
        this.level = 1;
    }

    ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////
    override reborn(): void {
        this.die();
        super.reborn();
        this.$dead.next(true);
    }

    override moveOn(maze: Maze): boolean {
        if (super.moveOn(maze)) {
            this.r = { d: 90, u: 270, r: 0, l: 180 }[this.dir];

            const [j, i] = coords(this);
            const pill = maze[i][j];

            // Eating
            if (pill === 2 || pill === 4) {
                maze[i][j] = 0;
                if (pill === 4) {
                    this.strong = true;
                }

                const diet = (this.strong) ? 2 : 1;
                const meal = (pill === 2) ? 10 : 50;
                this.eat(diet*meal);

                if (this._eater) {
                    this._eater(i, j);
                }
            }
            return true;
        } else {
            return false;
        }
    }

    lookAhead(n: number = 0): [number, number] {
        const [x, y] = coords(this);
        switch (this.dir) {
            case 'd': return [x, y+n];
            case 'u': return [x, y-n];
            case 'r': return [x+n, y];
            case 'l': return [x-n, y];
        }
    }
}

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
export class Ghost extends Walkable {
    ghost: string;

    private _cx: number;
    private _cy: number;

    private _state: Mood = 'homed';
    private set state(s: Mood) {
        console.log('state', s, this.ghost);
        this._state = s;
        if ( s === 'homed' ) {
            setTimeout(() => this._state = 'freed', 1000);
        }

        if ( s === 'scatter' ) {
            setTimeout(() => this._state = 'chase', 15000);
        }
    }

    private get state(): Mood {
        return this._state;
    }

    private pacman!: Pacman;
    chase(pacman: Pacman): void {
        this.pacman = pacman;
    }

    get weak (): boolean {
        return this._state === 'frightened';
    }

    constructor(x: number, y: number, dir: Direction, ghost: string, cx: number, cy: number) {
        super(x, y, dir);
        this.ghost = ghost;
        this._cx = cx;
        this._cy = cy;
        this.reborn();
    }
        
    override reborn(): void {
        super.reborn();
        this.state = 'homed';
    }


    protected randomWalk(maze: Maze): void {
        if ( onGrid(this) ) {
            while ( !this.nextPos(maze, this.nextDir) ) {
                this.nextDir = randomDir(this.nextDir);
            }
        }
    }


    protected override distance(): number {
        return super.distance(this.pacman);
    }


    public override moveOn(maze: Maze): boolean {
        if ( onGrid(this) && this.ghost === 'blinky') {
            const [i, j] = coords(this);
            console.log('state', this.state, this.ghost, i, j);
        }

        const strong = this.pacman && this.pacman.strong;

        if ( this.state === 'chase' && strong ) {
            this.state = 'frightened';
        }

        if ( this.state === 'frightened' && !strong ) {
            this.state = 'chase';
        }

        if (  this.state === 'homed' ) {
            this.randomWalk(maze);
        }

        if ( this.state === 'freed' ) {
            if ( onGrid(this) ) {
                if ( coords(this)[0] === 10 ) {
                    this.nextDir = 'u';
                    this.state = 'exiting';
                } else {
                    this.randomWalk(maze);            
                }
            }
        }

        if ( this.state === 'exiting' ) {
            const [j, i] = coords(this);
            if ( i === 9 && j === 10 ) {
                this.state = 'scatter';
                // this.nextDir = 'd';
                // this.randomWalk(maze);
            }
        }

        if ( this.state === 'frightened' ) {
            this.randomWalk(maze);
            }
            
        if (  this.state === 'scatter' ) {
            this.randomWalk(maze);
            // this.nextDir = this.target(maze);
        }

        // Seek for the target
        if ( this.state === 'chase') {
            if ( onGrid(this) ) {
                this.randomWalk(maze);
                // this.nextDir = this.target(maze);
            }
        }

        // Die or Kill            
        if ( this.shocked() ) {
            this.weak ? this.reborn() : this.pacman.reborn();
        }

        return super.moveOn(maze);
    }

    private shocked(): boolean {
        if ( !this.pacman ) {
            return false;
        }

        const [gj, gi] = coords(this);
        const [pj, pi] = coords(this.pacman);

        return (gj === pj) && (gi === pi);
    }

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    private target(maze: Maze): Direction {
        let [i, j] = coords(this.pacman);

        if ( this.state === 'scatter' || this.state === 'frightened') {
            [i, j] = [this._cx, this._cy];
        }

        if ( this.state === 'chase' ) {
            switch (this.ghost) {
                case 'blinky': 
                    [i, j] = coords(this.pacman);
                    break;

                case 'pinky':  
                    [i, j] = this.pacman.lookAhead(4);
                    break;

                case 'inky':
                    [i, j] = this.pacman.lookAhead(2);
                    break;

                case 'clyde':  
                    if (this.distance() > 8) { 
                        [i, j] = [this._cx, this._cy];
                    } else {
                        [i, j] = coords(this.pacman);
                    }
                    break;
            }
        }

        const dx = i - this.x;
        const dy = j - this.y;
    
        const H = Math.abs(dx) > Math.abs(dy);
        const h = (dx > 0) ? 'r' : 'l';
        const v = (dy > 0) ? 'd' : 'u';
        const op = { u: 'd', d: 'u', l: 'r', r: 'l' };
        
        let dir;
        const dirs = H ? [h, v, op[v], op[h]] : [v, h, op[h], op[v]] ;
    
        for (dir of dirs) {
            if (this.nextPos(maze, dir as Direction)) {
                break;
            }
        }

        return dir as Direction;
    }   
}