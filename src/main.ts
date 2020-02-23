class Util {
    static readonly VECTOR_DOWN: BABYLON.Vector3 = new BABYLON.Vector3(0, -1, 0);
    static readonly VECTOR_BACK: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, -1);

    static init() {
        // TODO build lookup table
    }

    static rand(start: number, end: number) : number {
        return Math.random() * (end - start) + start;
    }

    static swapRemove(arr: Array<any>, idx: number) : any {
        let len = arr.length;
        let lastItem = arr.pop()
        if (idx == len - 1)
            return lastItem;
        if (idx < len) {
            let obj = arr[idx];
            arr[idx] = lastItem;
            return obj;
        }
        return null;
    }

    static sin(x) : number {
        // TODO use lookup table
        return Math.sin(x);
    }

    static cos(x) : number {
        return Util.sin(x+Math.PI/2);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    let canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    Util.init();
    let stage = new GameStage(canvas);
    canvas.onblur = ():void => {
        console.log("onblur");
        stage.pauseGame(true);
    }
    canvas.onfocus = ():void => {
        console.log("onfocus");
        stage.pauseGame(false);
    }
    stage.createScene();
    stage.animate();
});
