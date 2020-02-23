enum InputCmd {
    UP = 0,
    DOWN,
    LEFT,
    RIGHT,
    FIRE,
    COUNT
}

class InputControl {
    stage: GameStage;
    inputState: boolean[];
    private _lastVKeyTs: number = 0;
    private _lastHKeyTs: number = 0;
    //private _lastFireTs: number = 0;

    constructor(s: GameStage) {
        this.stage = s;
        this.inputState = new Array<boolean>(InputCmd.COUNT).fill(false);
    }

    handleKeyDown(evt: BABYLON.ActionEvent) : void {
        let currTs = this.stage.gameTs();
        //console.log("Got key "+ evt.sourceEvent.key);
        switch (evt.sourceEvent.key) {
            case 'a':
                this.inputState[InputCmd.LEFT] = true;
                this.inputState[InputCmd.RIGHT] = false;
                this._lastHKeyTs = currTs;
                break;
            case 'd':
                this.inputState[InputCmd.LEFT] = false;
                this.inputState[InputCmd.RIGHT] = true;
                this._lastHKeyTs = currTs;
                break;
            case 'w':
                this.inputState[InputCmd.UP] = true;
                this.inputState[InputCmd.DOWN] = false;
                this._lastVKeyTs = currTs;
                break;
            case 's':
                this.inputState[InputCmd.UP] = false;
                this.inputState[InputCmd.DOWN] = true;
                this._lastVKeyTs = currTs;
                break;
            case ' ':
                this.inputState[InputCmd.FIRE] = true;
                break;
            default:
                break;
        }
    }

    handleKeyUp(evt: BABYLON.ActionEvent) : void {
        let currTs = this.stage.gameTs();
        let key = evt.sourceEvent.key; //TODO always lowercase
        switch (key) {
            case 'a':
                this.inputState[InputCmd.LEFT] = false;
                if (!this.inputState[InputCmd.RIGHT])
                    this._lastHKeyTs = 0;
                break;
            case 'd':
                this.inputState[InputCmd.RIGHT] = false;
                if (!this.inputState[InputCmd.LEFT])
                    this._lastHKeyTs = 0;
                break;
            case 'w':
                this.inputState[InputCmd.UP] = true;
                if (!this.inputState[InputCmd.DOWN])
                    this._lastVKeyTs = 0;
                break;
            case 's':
                this.inputState[InputCmd.DOWN] = false;
                if (!this.inputState[InputCmd.UP])
                    this._lastVKeyTs = 0;
                break;
            case ' ':
                this.inputState[InputCmd.FIRE] = false;
                break;
            default:
                break;
        }
    }

    getVTime(ts: number) : number {
        let result = 0;
        if (this._lastVKeyTs) {
            let dir = 0;
            if (this.inputState[InputCmd.DOWN])
                dir = -1;
            else if (this.inputState[InputCmd.UP])
                dir = 1;
            result = dir*(ts - this._lastVKeyTs)/1000;
            this._lastVKeyTs = ts;
        }
        return result;
    }
    
    getHTime(ts: number) : number {
        let result = 0;
        if (this._lastHKeyTs) {
            let dir = 0;
            if (this.inputState[InputCmd.LEFT])
                dir = -1;
            else if (this.inputState[InputCmd.RIGHT])
                dir = 1;
            result = dir*(ts - this._lastHKeyTs)/1000;
            this._lastHKeyTs = ts;
        }
        return result;
    }
}