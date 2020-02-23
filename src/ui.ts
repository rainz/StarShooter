abstract class UIRect {
    ctx2d: CanvasRenderingContext2D;
    constructor(public stage: GameStage, public w: number, public h: number, public x: number, public y: number) {
    }
    abstract update(deltaTime: number) : void;
}

// class UIRect2D extends UIRect {
//     constructor(stage: GameStage, w: number, h: number, x: number, y: number) {
//         super(stage, w, h, x, y);
//         this.ctx2d = stage.canvas.getContext("2d", {alpha: true});
//         this.ctx2d.fillStyle = 'rgb(200,0,0)';
//         this.ctx2d.fillRect(80, 80, 100, 100);
//     }

//     update(deltaTime: number) : void {

//     }
// }

class UIRect3D extends UIRect{
    rect: BABYLON.AbstractMesh;
    tx: BABYLON.DynamicTexture;
    constructor(stage: GameStage, w: number, h: number, x: number, y: number, z: number, txSize: number) {
        super(stage, w, h, x, y);
        let scene = stage.scene;
        let cam = stage.camera;
        this.rect = BABYLON.MeshBuilder.CreatePlane("ui", {width: w, height: h}, scene);
        this.rect.position.x = x;
        this.rect.position.y = y;
        this.rect.position.z = z;
        // this.rect.rotation.x = -Math.PI/2;
        this.setRenderGroup(3);
        this.rect.isPickable = false;
        let mat = new BABYLON.StandardMaterial("matUI", scene);
        mat.disableLighting = true;
        this.tx = new BABYLON.DynamicTexture("uiTx", txSize, scene, false);
        this.ctx2d  = this.tx.getContext();
        mat.emissiveTexture = this.tx;
        mat.alpha = 0.5;
        this.rect.material = mat;
        // this.rect.parent = cam;
        // this.tx.clear();
        this.tx.drawText("test", 80, 80, "bold 72px Arial", "white", "blue");
        this.ctx2d.fillStyle = 'rgb(200,0,0)';
        this.ctx2d.fillRect(200, 200, 100, 100);

        this.ctx2d.fillStyle = 'rgb(200,200,0)';
        this.ctx2d.beginPath();
        let centerX = 100;
        let centerY = 100;
        let radius = 50;
        let startAngle = 0;
        let endAngle = 2;
        this.ctx2d.moveTo(centerX,centerY);
        this.ctx2d.arc(centerX, centerY, radius, startAngle, endAngle);
        this.ctx2d.closePath();
        this.ctx2d.fill();

        this.tx.update();
    }

    update(deltaTime: number) : void {

    }

    setRenderGroup(group: number) : void {
        this.rect.renderingGroupId = group;
    }
}