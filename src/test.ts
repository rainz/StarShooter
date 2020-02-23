class TestStage {
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;
    camera: BABYLON.TargetCamera;
    hemiLight: BABYLON.HemisphericLight;

    mesh: BABYLON.AbstractMesh;

    constructor(canvas: HTMLCanvasElement) {
        // Create canvas and engine
        this.canvas = canvas;
        this.engine = new BABYLON.Engine(this.canvas, true);
    }

    createScene(): void {
        this.scene = new BABYLON.Scene(this.engine);
        // this.camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, -20, BABYLON.Vector3.Zero(), this.scene);
        // this.camera.rotation.x = Math.PI/16;
        
        this.camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(3, 2, -20), this.scene);
        this.camera.rotation.y = Math.PI/16;

        this.camera.attachControl(this.canvas, true);
        this.hemiLight = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 15, 0), this.scene);

        this.createAxes();

        // Remember to set the first parameter to ""
        BABYLON.SceneLoader.ImportMesh("", "model/", "spaceship.babylon", this.scene, (meshes: BABYLON.AbstractMesh[]):void => {
            console.log("loaded models:"+meshes.length);
            let m = meshes[0];
            // m.lookAt(new BABYLON.Vector3(0, 0, 1));
            // m.rotation.y = Math.PI/2;
            // m.rotation.x = -1;
            // m.position.y= -0.4;
            this.mesh = m;
            let front = BABYLON.MeshBuilder.CreateSphere("plane", {diameter: 1}, this.scene);
            front.position.z = -6;
            let mat = new BABYLON.StandardMaterial("mat", this.scene);
            mat.diffuseColor = BABYLON.Color3.Red();
            front.material = mat;
            front.setParent(m);
        });

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
    }

    update() : void {
        let m = this.mesh;
        if (m)
            m.rotation.x += 0.01;
    }

    animate(): void {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
    
}

window.addEventListener('DOMContentLoaded', () => {
    let canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    let stage = new TestStage(canvas);
    stage.createScene();
    stage.animate();
});
