enum BattleSide {
    MINE = 0,
    ALIEN,
}

abstract class GameObj {
    meshes: BABYLON.AbstractMesh[];
    meshType: MeshType;
    stage: GameStage;
    life: number;
    speed: number; // per second
    velocity: BABYLON.Vector3;

    orientation: BABYLON.Vector3;

    constructor(type: MeshType, s: GameStage) {
        this.stage = s;
        this.life = 1;
        this.meshes = [];
        this.meshType = type;
        this.orientation = BABYLON.Vector3.Right().clone();
        this.speed = 0;
        this.velocity = BABYLON.Vector3.Zero().clone();
        if (type < MeshType.UNKNOWN) {
            this.createMesh(type);
        }
    }

    protected createMesh(type: MeshType) : void {
        let p = this.stage.assetsDepot.allMeshes[type];
        let m = p.createInstance(p.name);
        m.billboardMode = p.billboardMode;
        this.meshes.push(m);
    }

    // dir must be normalized
    setVelocity(s: number = null, dir: BABYLON.Vector3 = null) : void {
        if (s)
            this.speed = s;
        else
            s = this.speed;
        if (!dir)
            dir = this.orientation;
        this.velocity = dir.multiplyByFloats(s, s, s);
    }

    update(deltaTime: number) : void {}

    intersectObject(other: GameObj) : boolean {
        for (let m of this.meshes) {
            if (m.isVisible) {
                for (let m2 of other.meshes) {
                    if (m2.isVisible && m.intersectsMesh(m2, false))
                        return true;
                }
            }
        }
        return false;
    }

    intersectPoint(p: BABYLON.Vector3) : boolean {
        for (let m of this.meshes) {
            if (m.isVisible && m.intersectsPoint(p))
                return true;
        }
        return false;
    }

    receiveDamage(dmg: number) : void {
        this.life -= dmg;
    }

    orient(dir: BABYLON.Vector3) : void {
        let m = this.meshes[0];
        if (m.billboardMode == BABYLON.Mesh.BILLBOARDMODE_NONE) {
            let axis1 = dir;
            let axis3 = BABYLON.Vector3.Cross(Util.VECTOR_DOWN, axis1);
            let axis2 = BABYLON.Vector3.Cross(axis3, axis1);
            m.rotation = BABYLON.Vector3.RotationFromAxis(axis1, axis2, axis3);
        }
        this.orientation.copyFrom(dir);
        this.orientation.normalize();
    }

    target(tgt: BABYLON.Vector3) : void {
        let m = this.meshes[0];
        let myPos = m.position;
        // m.lookAt(target);
        this.orient(tgt.subtract(myPos));
        
        // let dist = BABYLON.Vector3.Distance(myPos, dir);
        // let xzdist = Math.sqrt(dx*dx + dz*dz);
        // if (xzdist != 0)
        //     m.rotation.y = Math.asin(dz/xzdist);
        // if (dist != 0)
        //     m.rotation.z = Math.asin(dy/dist);
    }

    // Return -1 if cannot reach dest within deltaTime; otherwise, return remaining time
    // Make sure velocity is updated
    moveToward(dest: BABYLON.Vector3, deltaTime: number) : number {
        if (this.speed == 0)
            return -1;
        let pos = this.meshes[0].position;
        let dist = BABYLON.Vector3.Distance(dest, pos);
        let timeNeed = dist/this.speed * 1000;
        if (timeNeed <= deltaTime) {
            // Reached dest
            pos.copyFrom(dest);
            return deltaTime - timeNeed;
        }
        let v = this.velocity;
        let deltaSec = deltaTime / 1000;
        pos.x += v.x * deltaSec;
        pos.y += v.y * deltaSec,
        pos.z += v.z * deltaSec;
        return -1;
    }

    explode() : void {};

    enable(state = true) : void {
        for (let m of this.meshes)
            m.setEnabled(state);
    }

    destroy() : void {
        for (let m of this.meshes) {
            m.setEnabled(false);
            m.dispose();
        }
    }

    protected drawExplosion(size: number) : void{
        // TODO avoid creating player every time
        let player = new BABYLON.Sprite("player", this.stage.explosionSprite);
        player.position.x = this.meshes[0].position.x;
        player.position.y = this.meshes[0].position.y;
        player.position.z = this.meshes[0].position.z;
        player.size = size;
        player.disposeWhenFinishedAnimating = true;
        player.isPickable = false;
        player.playAnimation(0, 23, false, 20, ():void => {});
    }
}

class Spaceship extends GameObj {
    side: BattleSide;

    weapons: WeaponSystem[];
    childShips: Spaceship[];

    shieldMesh: BABYLON.AbstractMesh;
    shieldLife: number;

    ai: AI;

    constructor(spd: number, s: GameStage) {
        super(MeshType.MODEL_SHIP1, s);
        this.setVelocity(spd);
        this.weapons = [];
        this.childShips = [];
        this.side = BattleSide.ALIEN;

        // TODO make shield look better
        let scene = this.stage.scene;
        this.shieldLife = 0;
        let shield = BABYLON.MeshBuilder.CreateSphere("shield", {diameter: 10} , scene); // TODO don't hard-code size
        shield.parent = this.meshes[0];
        shield.renderingGroupId = this.meshes[0].renderingGroupId;
        this.meshes.push(shield);
        this.shieldMesh = shield;
        let mat = new BABYLON.StandardMaterial("matSheild", scene);
        // let tx = new BABYLON.Texture("txShield", scene);
        // mat.emissiveTexture = tx;
        mat.emissiveColor = BABYLON.Color3.Blue();
        // mat.disableLighting = true;
        mat.alpha = 0.1;
        shield.material = mat;
        shield.isVisible = false;
    }

    update(deltaTime: number) {
        if (this.ai) {
            this.ai.updateObj(deltaTime);
        }
    }

    receiveDamage(dmg: number) : void {
        let dmgReduce = dmg > this.shieldLife ? this.shieldLife : dmg;
        // TODO dmgReduce should have a limit
        dmg -= dmgReduce;
        this.shieldLife -= dmgReduce;
        if (this.shieldLife <= 0)  {
            this.shieldLife = 0;
            this.showShield(false); // TODO: move to update?
        }
        this.life -= dmg;
    }

    showShield(show : boolean) : void {
        this.shieldMesh.isVisible = show;
        this.shieldMesh.isPickable = show;
    }

    explode() : void {
        this.drawExplosion(3);
    }
}

class ObjPool<T extends GameObj> {
    pool: Array<T>;
    factory: () => T;

    constructor(initCapacity: number, f: ()=>T) {
        this.factory = f;
        this.pool = new Array<T>();
        for (let i = 0; i < initCapacity; ++i) {
            let obj = this.factory();
            this.put(obj);
        }
    }

    get() : T {
        let obj : T = null;
        if (this.pool.length == 0) {
            obj = this.factory();
        } else {
            obj = this.pool.pop();
        }
        obj.enable(true);
        return obj;
    }

    put(obj: T) : void {
        obj.enable(false);
        this.pool.push(obj);
    }
}