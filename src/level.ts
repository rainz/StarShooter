class Level {
    stage: GameStage;
    private _completed: boolean = false;

    protected _completedFunc: () => boolean;
    protected _initFunc: () => void;

    constructor(s: GameStage, initFunc: ()=>void = null, compFunc: ()=>boolean = null) {
        this.stage = s;
        this._initFunc = initFunc;
        this._completedFunc = compFunc;
        if (!this._completedFunc)
            this._completedFunc = this.defaultCompletedFunc;
    }

    init() : void {
        console.log("Initializing level");
        // TODO: do common init
        this._completed = false;
        if (this._initFunc)
            this._initFunc();
    }

    finished() : boolean {
        if (!this._completed) {
            this._completed = this._completedFunc();
        }
        return this._completed;
    }

    defaultCompletedFunc(): boolean {
        let stage = this.stage;
        let myShip = stage.ships[0];
        let myCount = 1 + myShip.childShips.length;
        return (stage.ships.length <= myCount);

    }

    static createLevels(stage: GameStage) : Level[] {
        let levels = new Array<Level>();
        const fireOffset = new BABYLON.Vector3(6, 0, 0); // TODO

        let level = new Level(stage, () => {
            // for (let x = -2; x <= 2; ++x) {
            //     for (let y = -2; y <= 2; ++y) {
            for (let x = 0; x <= 0; ++x) {
                for (let y = 1; y <= 1; ++y) {
                    let enemyShip = new Spaceship(30, stage);
                    stage.ships.push(enemyShip);
                    enemyShip.weapons.push(new WeaponSystem(MeshType.UNKNOWN, MeshType.BULLET1, 0, 10, 300, 10, fireOffset, enemyShip));
                    let curve = BABYLON.Curve3.CreateQuadraticBezier(new BABYLON.Vector3(-10, 10, 50), new BABYLON.Vector3(10, 30, 35), new BABYLON.Vector3(0, 10, 15), 50);
                    // let points = [new BABYLON.Vector3(-50, 10, 50), new BABYLON.Vector3(-20, 10, 40), new BABYLON.Vector3(0, 10, 15)];
                    // let curve = BABYLON.Curve3.CreateCatmullRomSpline(points, 50);
                    // enemyShip.ai = new FollowPathAI(enemyShip, curve.getPoints());
                    enemyShip.ai = new BasicAI(enemyShip, curve.getPoints());
                    enemyShip.ai.initObj();
                }
            }
        });

        levels.push(level);
        return levels;
    }
}