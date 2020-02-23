enum ModelType {
    SHIP1 = 0,
    COUNT
}

enum TextureType {
    BULLET1 = 0,
    EXPLOSION,
    COUNT
}

enum MeshType {
    POS_MESH = 0,
    MODEL_SHIP1,
    BULLET1,
    BULLET2,
    COUNT,
    UNKNOWN = COUNT
};

class ModelAsset {
    mesh: BABYLON.Mesh;
    constructor(public id: ModelType, public url: string) {}
}

class TextureAsset {
    texture: BABYLON.Texture;
    constructor(public id: TextureType, public url: string) {}
}

class AssetsDepot {
    stage: GameStage;
    models: ModelAsset[];
    textures: TextureAsset[];
    allMeshes: BABYLON.Mesh[];

    protected assetsManager: BABYLON.AssetsManager;

    constructor(stage: GameStage) {
        this.stage = stage;
        this.models = [
            new ModelAsset(ModelType.SHIP1, "spaceship.babylon"),
        ];
        this.textures = [
            new TextureAsset(TextureType.BULLET1, "flare_alpha.png"),
            new TextureAsset(TextureType.EXPLOSION, "explosion.png"),
        ];
        this.allMeshes = [];
        this.assetsManager = new BABYLON.AssetsManager(this.stage.scene);
        this.assetsManager.onFinish = (tasks: BABYLON.IAssetTask[]) : void => {
            // TODO handle errors
            for (let t of tasks) {
                if (!t.isCompleted)
                    return;
            }
            console.log("assetsManager: done loading ");
            this.buildMeshes();
            this.stage.assetsReady();
        };
        this.assetsManager.onTaskError = (task: BABYLON.IAssetTask) : void => {
            console.log("assetsManager: asset task error ");
        };
    }

    loadAssets() : void {
        let am = this.assetsManager;
        for (let mdl of this.models) {
            let task = am.addMeshTask(mdl.id.toString(), "", "model/", mdl.url);
            task.onSuccess = (t: BABYLON.MeshAssetTask) : void => {
                mdl.mesh = t.loadedMeshes[0] as BABYLON.Mesh;
                console.log("Loaded model: " + mdl.url);
            };
            task.onError = (t: BABYLON.MeshAssetTask) : void => {
                console.log("task: failed to load mesh " + t.name);
            }
        }
        for (let tx of this.textures) {
            let task = am.addTextureTask(tx.id.toString(), "texture/" + tx.url);
            task.onSuccess = (t: BABYLON.ITextureAssetTask) : void => {
                tx.texture = t.texture;
                console.log("Loaded texture: " + tx.url);
            };
            task.onError = (t: BABYLON.ITextureAssetTask) : void => {
                console.log("task: failed to load texture " + t.texture.name);
            };
        }
        am.load();
    }

    protected buildMeshes() {
        let stage = this.stage;
        let scene = stage.scene;
        for (let i = 0; i < MeshType.COUNT; ++i) {
            let msh : BABYLON.Mesh = null;
            switch (i) {
                case MeshType.POS_MESH:
                {
                    msh = BABYLON.MeshBuilder.CreatePlane("posMesh", {size: 0.1}, this.stage.scene);
                    break;
                }
                case MeshType.MODEL_SHIP1:
                {
                    let mdl = this.models[ModelType.SHIP1];
                    msh = mdl.mesh;
                    msh.rotation.y = -Math.PI/2;
                    msh.position.y = -0.4;
                    msh.bakeCurrentTransformIntoVertices();
                    break;
                }
                case MeshType.BULLET1:
                {
                    msh = BABYLON.MeshBuilder.CreatePlane("bullet1", {size: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE, updatable: false}, scene) as BABYLON.Mesh;
                    let mat = new BABYLON.StandardMaterial("matBullet1", scene);
                    let t = this.textures[TextureType.BULLET1];
                    let tx = t.texture;
                    tx.hasAlpha = true;
                    mat.emissiveTexture = tx;
                    mat.opacityTexture = tx;
                    mat.opacityTexture.getAlphaFromRGB = true;
                    mat.useSpecularOverAlpha = false;
                    msh.material = mat;
                    msh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
                    break;
                }
                case MeshType.BULLET2:
                {
                    msh = BABYLON.MeshBuilder.CreateCylinder("bullet2", {height: 2, diameterTop: 0.01, diameterBottom: 0.3, tessellation: 6}, scene);
                    msh.rotation.z = -Math.PI/2;
                    msh.bakeCurrentTransformIntoVertices();
                    break;
                }
                default:
                {
                    console.error("buildMeshes(): unhandled mesh type " + i);
                    break;
                }
            }
            if (msh) {
                msh.renderingGroupId = 1;
                this.allMeshes[i] = msh;
                msh.setEnabled(false);
            }
        }
    }

}
