import { BehaviorSubject, Observable } from "rxjs";

export type Maze = number[][];
export type Mood = 'homed' | 'chase' | 'scatter' | 'frightened';
export type Chaser = 'blinky' | 'pinky' | 'inky' | 'clyde';
export type Direction = 'd'|'u'|'l'|'r';

export type Position = { x: number, y: number };
export type Waypoint = Position & { dir: Direction };

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
const randomDir = (k: string): Direction => {
    const dir = ['u', 'd', 'l', 'r'].filter(d => d !== k);
    const i = Math.floor(Math.random()*dir.length);

    return dir[i] as Direction;
}

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
const directions: { [key in Direction]: Position } = {
    l: { x: -1, y:  0 },
    r: { x:  1, y:  0 },
    u: { x:  0, y: -1 },
    d: { x:  0, y:  1 },
};

const reverse: { [key in Direction]: Direction } = { 
    d: 'u', 
    u: 'd', 
    r: 'l', 
    l: 'r' 
};


//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
const coords = (p: Position): Position => {
    return { x: Math.round(p.x), y: Math.round(p.y) };
}

const onGrid = (n: Position, k: number = 0.3): boolean  => {
    const { x, y } = coords(n);
    return Math.abs(n.x - x) < k && Math.abs(n.y - y) < k;
} 

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
function isOff(maze: Maze, { x, y }: Position): boolean {
    return (x < 0 || x >= maze[0].length || y < 0 || y >= maze.length);
}

function isWall(maze: Maze, { x, y }: Position): boolean {
    return (maze[y][x] === 1);
}

function isOk(maze: Maze, { x, y }: Position): boolean {
    return !isOff(maze, { x, y }) && !isWall(maze, { x, y });
}

function areEquals(p0: Position, p1: Position): boolean {
    return p0.x === p1.x && p0.y === p1.y;
}

function add(p0: Position, p1: Position): Position {
    return { x: p0.x + p1.x, y: p0.y + p1.y };
}

function scale(p0: Position, n: number): Position {
    return { x: n * p0.x, y: n * p0.y };
}

//////////////////////////////////////////////////////////////////////
function findPath(p0: Position, p1: Position, maze: Maze): Waypoint[] | null {
    const queue: { p: Position; path: Waypoint[] }[] = [{ p: p0, path: [] }];
    const visited: boolean[][] = maze.map(row => row.map(() => false));

    visited[p0.x][p0.y] = true;

    while (queue.length > 0) {
        const { p, path } = queue.shift()!;

        if (areEquals(p, p1)) {
            return path;
        }

        for (const [dir, d] of Object.entries(directions) as [Direction, Position][]) {
            const q: Position = add(p, d);

            if (isOk(maze, q) && !visited[q.x][q.y]) {
                visited[q.x][q.y] = true;
                queue.push({ p: q, path: [...path, { ...q, dir }] });
            }
        }
    }

    return null; // Path not found
}

//////////////////////////////////////////////////////////////////////  
//////////////////////////////////////////////////////////////////////  
abstract class Walkable implements Position {
    // Home Position
    protected x0: number;
    protected y0: number;
    protected d0: Direction;

    // Current Position
    public x: number;
    public y: number;

    // Current Direction
    protected dir: Direction;

    // Next Direction
    protected nextDir: Direction;

    // Speed
    protected v: number;
    
    get coords(): Position {
        return coords(this);
    }

    get home(): Position {
        return { x: this.x0, y: this.y0 };
    }

    ///////////////////////////////////////////////////////////
    constructor(x: number, y: number, dir: Direction) {
        this.v = 0.1;
        
        this.x   = this.x0 = x;
        this.y   = this.y0 = y;
        this.dir = this.d0 = dir;
        this.nextDir = dir;
    }

    ///////////////////////////////////////////////////////////
    protected reborn(): void {
        this.x = this.x0;
        this.y = this.y0;
        this.dir = this.d0;
        this.nextDir = this.dir;
    }


    protected distance(p: Walkable): number {
        return Math.abs(this.x - p.x) + Math.abs(this.y - p.y);
    }


    protected nextPos(maze: Maze, dir: Direction): Position | null {
        // const [dx, dy] = directions[dir];
        const d = directions[dir];
        const p = add(this, scale(d, this.v));
        // const x = this.x + this.v * dx;
        // const y = this.y + this.v * dy;
        // const K = Coords({ x: x+dx/2, y: y+dy/2 });
        const q = coords(add(p, scale(d, 0.5)));
        return isWall(maze, q) ? null : p;
    }


    protected moveOn(maze: Maze): boolean {
        if ( this.nextDir !== this.dir ) {
            if ( this.nextDir === reverse[this.dir] ) {
                this.dir = this.nextDir;
            } else {
                const next = this.nextPos(maze, this.nextDir); 
                if (next && onGrid(next)) {
                    this.dir = this.nextDir;
                    const p = coords(next);
                    this.x = p.x;
                    this.y = p.y;
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

    protected set score(s: number) {
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

    ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////
    private _strong: boolean = false;
    get strong(): boolean {
        return this._strong;
    }
    
    protected set strong(s: boolean) {
        this._strong = s;
        setTimeout(() => this._strong = false, 15000);
    }

    ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////
    private _eater: (p: Position) => void = () => {}; 
    set onEating(eater: (p: Position) => void) {
        this._eater = eater;
    }

    private $dead = new BehaviorSubject<boolean>(false);
    get dead(): Observable<boolean> {
        return this.$dead.asObservable();
    }

    ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////
    set go(dir: Direction) {
        this.nextDir = dir;
    }

    get go(): Direction {
        return this.dir;
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
    protected die(): void {
        this.lives = this._lives - 1;
    }

    protected eat(n: number): void {
        this.score = this._score + n;
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

            const { x, y } = this.coords;
            const pill = maze[y][x];

            // Eating
            if (pill === 2 || pill === 4) {
                maze[y][x] = 0;
                if (pill === 4) {
                    this.strong = true;
                }

                const diet = (this.strong) ? 2 : 1;
                const meal = (pill === 2) ? 10 : 50;
                this.eat(diet*meal);

                if (this._eater) {
                    this._eater({ x, y });
                }
            }
            return true;
        } else {
            return false;
        }
    }
}

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
export class Ghost extends Walkable {
    private ghost: Chaser;
    get name(): string {
        return this.ghost;
    }
    
    private _color: string = 'white';
    get color(): string {
        return this._color;
    }

    private pacman!: Pacman;
    chase(pacman: Pacman): void {
        this.pacman = pacman;    
    }

    // Path, Waypoints
    private tick: boolean = false;
    private path: Waypoint[] = [];

    // Current Target
    private _tx: number = 0;
    private _ty: number = 0;

    // Scatter Corner
    private _cx: number;
    private _cy: number;
    
    // State Machine
    private t?: any;
    private _state!: Mood;
    private set state(s: Mood) {
        this._state = s;

        if ( this.t ) {
            clearInterval(this.t);
        }

        if ( s === 'homed' ) {
            this.t = setTimeout(() => this.state = 'scatter', 3000);
        }

        if ( s === 'scatter' ) {
            this.t = setTimeout(() => this.state = 'chase', 15000);
        }

        if ( s === 'frightened' ) {
            this.t = setTimeout(() => this.state = 'chase', 15000);
        }

        if ( s === 'chase' ) {
            this.t = setInterval(() => this.tick = true, 15000);
        }
    }

    get state(): Mood {
        return this._state;
    }

    get weak (): boolean {
        return this._state === 'frightened';
    }

    get go(): Direction {
        return this.dir;
    }

    get going(): Direction {
        return this.nextDir;
    }

    get pathway(): Waypoint[] {
        return this.path;
    }

    get target(): Position {
        return coords({ x: this._tx, y: this._ty });
    }

    set target(p: Position) {
        this._tx = p.x;
        this._ty = p.y;
    }

    get corner(): Position {
        return { x: this._cx, y: this._cy };
    }

    ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////
    constructor(x: number, y: number, dir: Direction, ghost: Chaser, color: string, cx: number, cy: number) {
        super(x, y, dir);
        this.ghost = ghost;
        this._color = color;
        this._cx = cx;
        this._cy = cy;
        this.reborn();
    }
        
    public override reborn(): void {
        super.reborn();
        this.state = 'homed';
    }


    protected override distance(): number {
        return super.distance(this.pacman);
    }


    public override moveOn(maze: Maze): boolean {
        if ( !this.pacman ) {
            return false;
        }

        if ( this.state === 'chase' && this.pacman.strong ) {
            this.state = 'frightened';
        }

        if ( this.state === 'frightened' && !this.pacman.strong ) {
            this.state = 'chase';
        }

        // Wander or Follow a Path 
        if ( onGrid(this) ) {
            if (  this.state === 'homed' ) {
                while ( !this.nextPos(maze, this.nextDir) ) {
                    this.nextDir = randomDir(this.nextDir);
                }
            } else {
                if ( this.tick || this.path.length === 0 ) { 
                    this.updatePath(maze);
                    this.tick = false;
                }

                if ( this.path.length > 0) {
                    const next = this.path[0];
                    if ( areEquals(this.coords, coords(next)) ) {
                        this.path.shift();
                    }
 
                    this.nextDir = next.dir;
                }
            }
        }

        // Die or Kill            
        if ( areEquals(this.coords, this.pacman.coords) ) {
            this.path = [];
            this.weak ? this.reborn() : this.pacman.reborn();
            return false;
        } else {
            return super.moveOn(maze);
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    private updatePath(maze: Maze): void {
        const lookAhead = (n: number): Position => {
            const d = directions[this.pacman.go];
            const p = this.pacman.coords;
            let q = add(p, scale(d, n));
            if ( isOff(maze, q) ) {
                q = add(p, scale(d, -n));
            }

            while ( !isOk(maze, q) ) {   
                q = add(q, d);
                if ( isOff(maze, q) ) {
                    return this.home;
                }
            }
             
            return q;
        }


        if ( this.state === 'chase' ) {
          switch (this.ghost) {
            case 'blinky':  this.target = lookAhead(0); break;
            case 'pinky':   this.target = lookAhead(4); break;
            case 'inky':    this.target = lookAhead(2); break;
            case 'clyde':   this.target = (this.distance() > 8) ? 
                                          lookAhead(1) : 
                                          this.corner;  break;
          }
        } else if ( this.state === 'scatter' ) {
            this.target = this.corner;
        } else if ( this.state === 'frightened' ) {
            this.target = this.home;
        }

        
        const path = findPath(this.coords, this.target, maze);
        if (path) {
            this.path = path;
        }
    }
}