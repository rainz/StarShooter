class Projectile extends GameObj {
    damage: number;
    emitter: WeaponSystem;
    accumuTime: number; // record time during which no movement was made
    constructor(projType: MeshType, stage: GameStage) {
        super(projType, stage);
    }

    init(weapon: WeaponSystem) : void {
        this.emitter = weapon;
        this.damage = weapon.computeDamage();
        this.accumuTime = 0;
        this.setVelocity(weapon.computeSpeed(), this.getShip().orientation);
    }

    getShip() : Spaceship {
        return this.emitter.owner;
    }

    update(deltaTime: number) : void {
        let totalTime = this.accumuTime + deltaTime;
        let totalSec = totalTime/1000;
        let pos = this.meshes[0].position;
        let v = this.velocity;
        let dx = v.x * totalSec;
        let dy = v.y * totalSec;
        let dz = v.z * totalSec;
        if (dx != 0 || dy != 0 || dz != 0) {
            pos.x += dx;
            pos.y += dy;
            pos.z += dz;
            this.accumuTime = 0;
        } else {
            // Not moving this time, so accumulate time
            this.accumuTime = totalTime;
        }
    }

    destroy() : void {
        let pool = Projectile.pools[this.meshType];
        pool.put(this);
    }

    // TODO extends this to all game objs if needed.
    static pools: ObjPool<Projectile>[];
    static createPools(stage: GameStage) : void {
        Projectile.pools = new Array<ObjPool<Projectile>>(MeshType.COUNT).fill(null);
        let types = [MeshType.BULLET1, MeshType.BULLET2];
        let capacity = 1000; 
        for (let projType of types) {
            let pool = new ObjPool<Projectile>(capacity, (): Projectile => {
                return new Projectile(projType, stage);
            });
            Projectile.pools[projType] = pool;
        }
    }
    static get(projType: MeshType) : Projectile {
        let pool = Projectile.pools[projType];
        if (pool) {
            return pool.get();
        }
        console.log("Error: pool not created for ", projType);
        return null;
    }
}


class WeaponSystem extends GameObj{
    owner: Spaceship;
    fireDelay: number; // in milliseconds
    baseDamage: number;
    baseSpeed: number;
    projMeshType: MeshType;
    currLevel: number;
    maxProjectiles: number;
    protected _lastFireTs = 0;
    protected _firePointMesh: BABYLON.AbstractMesh; // a mesh to record weapon position and will move & rotate with parent
    //TODO create a projectile pool for each weapon mesh type

    constructor(type: MeshType, projType: MeshType, dmg: number, spd: number, delay: number, maxProj: number, position: BABYLON.Vector3, ship: Spaceship) {
        super(type, ship.stage);
        this.owner = ship;
        this.baseDamage = dmg;
        this.baseSpeed = spd;
        this.fireDelay = delay;
        this.projMeshType = projType;
        this.currLevel = 1;
        this.maxProjectiles = maxProj >= 0 ? maxProj : 999999999;
        this._firePointMesh = this.stage.assetsDepot.allMeshes[MeshType.POS_MESH].createInstance("weaponPos");
        this._firePointMesh.position.copyFrom(position);
        // this._firePointMesh.setParent(ship.meshes[0]); // doesn't work??
        this._firePointMesh.parent = ship.meshes[0];
        this._firePointMesh.isVisible = false;
    }

    fire() : Projectile {
        let ts = this.stage.currentTs;
        if (this.maxProjectiles > 0 && ts - this._lastFireTs >= this.fireDelay) {
            let p = Projectile.get(this.projMeshType);
            p.init(this);
            let m = p.meshes[0];
            // this._firePointMesh.computeWorldMatrix(true); // do I need this?
            let absPos = this._firePointMesh.getAbsolutePosition(); // TODO: fix jitter caused by this line!!!
            m.position.copyFrom(absPos);
            p.orient(this.owner.orientation);
            --this.maxProjectiles;
            this._lastFireTs = ts;
            return p;
        }
        return null;
    }

    isUsable() : boolean {
        return (this.maxProjectiles > 0);
    }

    computeDamage(): number {
        let dmg = this.baseDamage;
        for (let i = 1; i < this.currLevel;++i)
            dmg *= 1.1;
        return dmg;
    }
    
    computeSpeed(): number {
        let spd = this.baseSpeed;
        for (let i = 1; i < this.currLevel;++i)
            spd *= 1.1;
        return spd;
    }
}