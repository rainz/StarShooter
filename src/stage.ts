class AssetInfo {
    constructor(public type: MeshType, public fileName: string) {}
}

class BillBoardLoadInfo extends AssetInfo {
    constructor(type: MeshType, fileName: string, public size: number) {
        super(type, fileName);
    }
}

class Star {
    constructor(public x: number, public y: number, public size: number) {}
}

class GameStage {
    stageLower: BABYLON.Vector3;
    stageUpper: BABYLON.Vector3;

    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;
    camera: BABYLON.TargetCamera;
    hemiLight: BABYLON.HemisphericLight;

    background: BABYLON.AbstractMesh;
    bgSize: number;
    bgTexture: BABYLON.DynamicTexture;
    bgTxSize: number;
    stars: Array<Star>;
    starSpeed: number;
    assetsDepot: AssetsDepot;

    private _cameraOffset: BABYLON.Vector3;

    private _pause: boolean;
    private _pauseTs: number;
    private _lastGameTs: number;

    inputCtrl: InputControl;

    isPlayerAlive: boolean;
    currentTs: number;
    lastUpdateTs: number;

    levels: Level[];
    currLevel: number;

    explosionSprite: BABYLON.SpriteManager;

    projectiles: Projectile[] = [];
    ships: Spaceship[] = [];
    myShip: Spaceship;

    static BACKGROUND_Z = 20;

    constructor(canvas: HTMLCanvasElement) {
        // Create canvas and engine
        this.canvas = canvas;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.inputCtrl = new InputControl(this);
        this._pause = true;
        this._pauseTs = 0; // shouldn't matter
        this._lastGameTs = 0;
        this.stageLower = new BABYLON.Vector3(-100, -100, -100);
        this.stageUpper = new BABYLON.Vector3(100, 100, 200);
    }

    assetsReady() : void {
        //this.explosionSprite.texture = this.assetsDepot.textures[TextureType.EXPLOSION].texture;

        let myShip = new Spaceship(20, this);
        myShip.side = BattleSide.MINE;
        // myShip.showShield(true);
        this.ships.push(myShip); // keep myShip the first item
        const fireOffset = new BABYLON.Vector3(6, 0, 0); // TODO
        let myWeapon = new WeaponSystem(MeshType.UNKNOWN, MeshType.BULLET2, 1, 100, 100, -1, fireOffset, myShip);
        myShip.weapons.push(myWeapon);
        this.isPlayerAlive = true;
        let myPos = myShip.meshes[0].position;
        myPos.x = 0;
        myPos.y = 0;
        myPos.z = 0;
        // myShip.orient(this.ships[1].meshes[0].position);
        myShip.target(BABYLON.Vector3.Forward());
        
        this.camera.parent = myShip.meshes[0];

        Projectile.createPools(this);

        this.currLevel = 0;
        this.levels = Level.createLevels(this);
        let level = this.levels[this.currLevel];
        level.init();

        this.lastUpdateTs = this.gameTs();
        this.pauseGame(false);
    }

    createScene(): void {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        this._cameraOffset = new BABYLON.Vector3(-50, 10, 0);
        // this.camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 5, BABYLON.Vector3.Zero(), this.scene);
        // this.camera.rotation.x = Math.PI/16;
        this.camera = new BABYLON.FreeCamera('camera1', BABYLON.Vector3.Zero(), this.scene);
        this.camera.rotation.y = Math.PI/2;
        this.camera.position = this._cameraOffset;
        this.camera.attachControl(this.canvas, true);
        this.hemiLight = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 15, 0), this.scene);
        this.assetsDepot = new AssetsDepot(this);
        this.assetsDepot.loadAssets();

        this.explosionSprite = new BABYLON.SpriteManager("explosionManager","texture/explosion.png", 128, 64, this.scene);
        // this.explosionSprite = new BABYLON.SpriteManager("explosionManager","", 128, 64, this.scene);
        this.explosionSprite.renderingGroupId = 1;

        this.createAxes();
        this.createBackground();
        //this.createUI();

        this.scene.actionManager = new BABYLON.ActionManager(this.scene);
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger,
            (evt: BABYLON.ActionEvent): void => { this.inputCtrl.handleKeyDown(evt); }));
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger,
            (evt: BABYLON.ActionEvent): void => { this.inputCtrl.handleKeyUp(evt); }));
        this.scene.onBeforeRenderObservable.add( () => { this.update(); });
    }

    createAxes() : void {
        const axisLen = 50;
        let xPoints: BABYLON.Vector3[] = [new BABYLON.Vector3(-axisLen, 0, 0), new BABYLON.Vector3(axisLen, 0, 0)];
        let xAxis = BABYLON.MeshBuilder.CreateLines("xAxis", {points: xPoints}, this.scene);
        xAxis.color = BABYLON.Color3.Red();
        let xEnd = BABYLON.MeshBuilder.CreateCylinder("x", {height:1, diameterTop:0, diameterBottom:1}, this.scene);
        xEnd.rotation.z= -Math.PI/2;
        xEnd.position.x = axisLen;
        let yPoints: BABYLON.Vector3[] = [new BABYLON.Vector3(0, -axisLen, 0), new BABYLON.Vector3(0, axisLen, 0)];
        let yAxis = BABYLON.MeshBuilder.CreateLines("yAxis", {points: yPoints}, this.scene);
        yAxis.color = BABYLON.Color3.Green();
        let yEnd = BABYLON.MeshBuilder.CreateCylinder("y", {height:1, diameterTop:0, diameterBottom:1}, this.scene);
        yEnd.position.y = axisLen;
        let zPoints: BABYLON.Vector3[] = [new BABYLON.Vector3(0, 0, -axisLen), new BABYLON.Vector3(0, 0, axisLen)];
        let zAxis = BABYLON.MeshBuilder.CreateLines("zAxis", {points: zPoints}, this.scene);
        zAxis.color = BABYLON.Color3.Blue();
        let zEnd = BABYLON.MeshBuilder.CreateCylinder("z", {height:1, diameterTop:0, diameterBottom:1}, this.scene);
        zEnd.rotation.x= -Math.PI/2;
        zEnd.position.z = axisLen;

        xAxis.renderingGroupId = 1;
        xEnd.renderingGroupId = 1;
        yAxis.renderingGroupId = 1;
        yEnd.renderingGroupId = 1;
        zAxis.renderingGroupId = 1;
        zEnd.renderingGroupId = 1;
    }

    createUI() : void {
        let rect = new UIRect3D(this, 20, 10, 0, 0, 10, 512);
    }

    createBackground() : void {
        this.bgSize = 32;
        let numStars = 300;
        this.bgTxSize = 1024;
        this.stars = [];
        for (let i = 0; i < numStars; i++) {
            let star = new Star(Util.rand(0, this.bgSize),
                                Util.rand(0, this.bgSize),
                                Util.rand(0, 1));
            this.stars.push(star);
        }
        this.starSpeed = 0.2;

        // TODO: use UIRect
        this.background = BABYLON.MeshBuilder.CreatePlane("background", {width: this.bgSize, height: this.bgSize}, this.scene);
        this.background.isPickable = false;
        this.background.position.z = GameStage.BACKGROUND_Z;
        this.background.renderingGroupId = 0;
        let mat = new BABYLON.StandardMaterial("backgroundMat", this.scene);
        mat.disableLighting = true;
        let tx = new BABYLON.DynamicTexture("backgroundTx", this.bgTxSize, this.scene, false);
        mat.emissiveTexture = tx;
        this.background.material = mat;
        this.bgTexture = tx;
        this.background.parent = this.camera;
    }

    updateBackground(deltaTime: number) : void {
        let context = this.bgTexture.getContext();
        // reset canvas for next frame
        let sz = this.bgTxSize;
        context.clearRect(0, 0, sz, sz);
        let spd = this.starSpeed;
        let delta = deltaTime/1000 * spd;

        for (let star of this.stars) {
            let oldX = star.x;
            let oldY = star.y;

            star.x += (star.x - sz/2) * star.size * delta;
            star.y += (star.y - sz/2) * star.size * delta;
            star.size += delta;

            // Recycle out-of-bound stars
            if(star.x < 0 || star.x > sz || star.y < 0 || star.y > sz) {
                star.x = Util.rand(0, sz);
                star.y = Util.rand(0, sz);
                star.size = 0;
            }

            let starSize = star.size <= 1 ? star.size : 1;
            context.strokeStyle = "rgba(255, 255, 255, " + starSize + ")";
            context.beginPath();
            context.lineWidth = star.size;
            context.moveTo(oldX, oldY);
            context.lineTo(star.x, star.y);
            context.stroke();
        }
        this.bgTexture.update();
    }

    isOutofBound(pos: BABYLON.Vector3) : boolean {
        return (pos.x < this.stageLower.x || pos.x > this.stageUpper.x ||
                pos.y < this.stageLower.y || pos.y > this.stageUpper.y ||
                pos.z < this.stageLower.z || pos.z > this.stageUpper.z);
    }

    update() : void {
        if (this._pause)
            return;
        let level = this.levels[this.currLevel];
        if (level.finished()) {
            if (this.currLevel < this.levels.length-1) {
                ++this.currLevel;
                level = this.levels[this.currLevel];
                level.init();
            }
        }

        let currTs = this.gameTs();
        this.currentTs = currTs;
        let deltaTime = currTs - this.lastUpdateTs;
        this.updateBackground(deltaTime);

        // Capture input data
        let myDeltaX = this.inputCtrl.getHTime(currTs);
        let myDeltaY = this.inputCtrl.getVTime(currTs);
        let firing = this.inputCtrl.inputState[InputCmd.FIRE];

        // Update ships
        for (let ship of this.ships) {
            let mesh = ship.meshes[0];
            let oldX = mesh.position.x;
            let oldY = mesh.position.y;
            let oldZ = mesh.position.z;
            if (ship.side == BattleSide.MINE) {
                // My ship
                if (this.isPlayerAlive) {
                    mesh.position.x += ship.speed * myDeltaX;
                    mesh.position.y += ship.speed * myDeltaY;
                    if (firing) {
                        for (let w of ship.weapons) {
                            let p = w.fire();
                            if (p) {
                                this.projectiles.push(p);
                            }
                        }
                    }
                }
            } else {
                ship.update(deltaTime);
                // TODO check if ship out of bound
            }
            
            // TODO check if my ship is out of bound

            // Check ship collision
            for (let other of this.ships) {
                if (other != ship && ship.intersectObject(other)) {
                    if (ship.side == other.side) {
                        // No friendly damage, just back up
                        // TODO: two ships may deadlock!!!!!!
                        mesh.position.x = oldX;
                        mesh.position.y = oldY;
                        mesh.position.z = oldZ;
                    } else {
                        // Collision damage. At least one of the two will be destroyed.
                        let thisLife = ship.life;
                        ship.receiveDamage(other.life);
                        other.receiveDamage(thisLife);
                    }
                }
            }
        }

        // Update projectiles
        let pLen = this.projectiles.length;
        for (let pIdx = 0; pIdx < pLen; ++pIdx) {
            let p = this.projectiles[pIdx];
            p.update(deltaTime);
            let pos = p.meshes[0].position;
            if (this.isOutofBound(pos)) {
                // out of bound
                Util.swapRemove(this.projectiles, pIdx);
                --pIdx;
                --pLen;
                p.destroy();
            }

        }

        // Check projectile hit
        for (let pIdx = 0; pIdx < pLen; ++pIdx) {
            let p = this.projectiles[pIdx];
            let pos = p.meshes[0].position;
            let shipSelf = p.getShip();
            for (let s of this.ships) {
                if (s == shipSelf)
                    continue;
                if (s.life <= 0)
                    continue; // ship already destroyed, so ignore
                if (s.intersectPoint(pos)) {
                    if (p.getShip().side != s.side)
                        s.receiveDamage(p.damage);
                    Util.swapRemove(this.projectiles, pIdx);
                    --pIdx;
                    --pLen;
                    p.explode();
                    p.destroy();
                    break;
                }
            }
        }

        // Check my ship's life
        let myShip = this.ships[0];
        if (this.isPlayerAlive && myShip.life <= 0) {
            // My ship has just been destroyed
            console.log("Exploding my ship");
            myShip.explode();
            // Detach camera from my ship
            let pos = myShip.meshes[0].position;
            this.camera.parent = null;
            this.camera.position.x = pos.x + this._cameraOffset.x;
            this.camera.position.y = pos.y + this._cameraOffset.y;
            this.camera.position.z = pos.z + this._cameraOffset.z;
            myShip.enable(false);
            this.isPlayerAlive = false;
            // Don't dispose my main ship
        }
        // Check other ships' life
        let sLen = this.ships.length;
        for (let sIdx = 1; sIdx < sLen; ++sIdx) {
            let s = this.ships[sIdx];
            if (s.life <= 0) {
                s.explode();
                Util.swapRemove(this.ships, sIdx);
                --sIdx;
                --sLen;
                s.destroy();
            }
        }

        // Check game status
        //TODO

        this.lastUpdateTs = currTs;
    }

    animate(): void {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
    
    pauseGame(state: boolean) : void {
        if (this._pause == state)
            return; // no state change

        let now = Date.now();
        if (state) {
            // Pause
            this._lastGameTs = now - this._pauseTs + this._lastGameTs;
        }

        this._pauseTs = now;
        this._pause = state;
    }

    gameTs(): number {
        if (!this._pause) {
            return (Date.now() - this._pauseTs + this._lastGameTs);
        } else {
            return this._lastGameTs;
        }
    }
    
}