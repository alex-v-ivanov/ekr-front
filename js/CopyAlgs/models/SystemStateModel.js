// Константы для состояний
export const SystemState = {
    READY: 1,
    PROCESSING: 2
};

export class SystemStateModel extends EventTarget {
    constructor() {
        super();
        this._state = SystemState.READY;
        this._currentOperation = "";
        this._userId = 0;
        this._userName = "";
    }

    // Геттеры и сеттеры с валидацией
    get state() { return this._state; }
    get isReady() { return this._state === SystemState.READY; }
    get isProcessing() { return this._state === SystemState.PROCESSING; }
    get currentOperation() { return this._currentOperation; }
    get userId() { return this._userId; }
    get userName() { return this._userName; }

    setState(state, operation = "") {
        if (!Object.values(SystemState).includes(state)) {
            throw new Error(`Invalid state: ${state}`);
        }
        
        const oldState = this._state;
        this._state = state;
        this._currentOperation = operation;
        
        // Диспатчим событие об изменении состояния
        this.dispatchEvent(new CustomEvent('stateChanged', {
            detail: { oldState, newState: state, operation }
        }));
    }

    setUserInfo(id, name) {
        this._userId = id;
        this._userName = name;
        this.dispatchEvent(new CustomEvent('userChanged', {
            detail: { id, name }
        }));
    }

    reset() {
        this.setState(SystemState.READY, "");
    }
}