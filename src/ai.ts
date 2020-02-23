interface AI {
    initObj() : void;
    updateObj(deltaTime: number) : boolean;
}

class BaseAttackAI implements AI {
    weapon: WeaponSystem;
    constructor(w: WeaponSystem) {
        this.weapon = w;
    }

    initObj() : void {
        let ship = this.weapon.owner;
        let stage = ship.stage;
        let myShip = stage.ships[0];
        ship.target(myShip.meshes[0].position);
    }

    updateObj(deltaTime: number) : boolean {
        let w = this.weapon;
        if (w.isUsable()) {
            let stage = w.stage;
            if (stage.isPlayerAlive) {
                let p = w.fire();
                if (p) {
                    stage.projectiles.push(p);
                }
            }
            return true;
        }
        return false;
    }

}

class FollowPathAI implements AI {
    obj: GameObj;
    pathPoints: BABYLON.Vector3[];
    pointIdx: number;
    constructor(obj: GameObj, points: BABYLON.Vector3[]) {
        this.obj = obj;
        this.pathPoints = points;
        this.pointIdx = 1;
    }

    initObj() : void {
        let obj = this.obj;
        let path = this.pathPoints;
        obj.meshes[0].position.copyFrom(path[0]);
        if (path.length > 1)
            obj.target(path[1]);
        else
            obj.orient(Util.VECTOR_BACK);
        obj.setVelocity();
    }

    updateObj(deltaTime: number) : boolean {
        let millis = deltaTime;
        let obj = this.obj;
        let path = this.pathPoints;
        while (millis > 0 && this.pointIdx < path.length) {
            millis = obj.moveToward(path[this.pointIdx], millis);
            if (millis >= 0) {
                if (++this.pointIdx < path.length) {
                    obj.target(path[this.pointIdx]);
                    obj.setVelocity();
                }
                
            }
        }
        return (this.pointIdx < path.length);
    }

}

class SequenceAI implements AI {
    subAIs: AI[];
    aiIdx: number;

    constructor() {
        this.subAIs = [];
        this.aiIdx = 0;
    }

    add(ai: AI) {
        this.subAIs.push(ai);
    }

    initObj() : void {
        if (this.subAIs.length > 0)
            this.subAIs[0].initObj();
    }

    updateObj(deltaTime: number) : boolean {
        if (this.aiIdx < this.subAIs.length) {
            if (this.subAIs[this.aiIdx].updateObj(deltaTime))
                return true;
            if (++this.aiIdx < this.subAIs.length) {
                this.subAIs[this.aiIdx].initObj();
                return true;
            }
        }
        return false;
    }
}

class ParallelAI implements AI {
    subAIs: AI[];
    aiIdx: number;

    constructor() {
        this.subAIs = [];
        this.aiIdx = 0;
    }

    add(ai: AI) {
        this.subAIs.push(ai);
    }

    initObj() : void {
        if (this.subAIs.length > 0)
            this.subAIs[0].initObj();
    }

    updateObj(deltaTime: number) : boolean {
        let ret = false;
        for (let ai of this.subAIs) {
            let rc = ai.updateObj(deltaTime);
            // Return true if at least one sub AI returns true.
            if (rc)
                ret = true;
        }
        return ret;
    }
}

class WaitAI {
    timeLeft: number;
    constructor(millis: number) {
        this.timeLeft = millis;
    }
    initObj() : void {}

    updateObj(deltaTime: number) : boolean {
        this.timeLeft -= deltaTime;
        return (this.timeLeft > 0);
    }
}

class BasicAI extends SequenceAI {
    ship: Spaceship;
    constructor(s: Spaceship, path: BABYLON.Vector3[]) {
        super();
        this.ship = s;
        this.add(new FollowPathAI(s, path));
        this.add(new BaseAttackAI(s.weapons[0]));
    }
}
