/**
 * API-слой Prognoz: вызовы bi.getResultForeModule для модуля прогнозирования.
 * Зависимости bi и ForeKeys передаются через конструктор.
 */
const MODULE_KEY = 'DK_PROGNOZ_1145438';

export class PrognozApi {
    constructor(bi, foreKeys) {
        this.bi = bi;
        this.foreKeys = foreKeys || {};
    }

    _moduleKey() {
        return this.foreKeys.DK_PROGNOZ_1145438;
    }

    getDatecloseKFO() {
        return this.bi.getResultForeModule({
            moduleKey: this._moduleKey(),
            methodName: 'GetDatecloseKFO',
            args: ''
        });
    }

    getUserFullName(userName) {
        const _params = [
            this.bi.OpenArgs('uName', userName, this.bi.ItDataType.String)
        ];
        return this.bi.getResultForeModule({
            moduleKey: this._moduleKey(),
            methodName: 'UserFullNameAPI',
            args: _params
        });
    }

    readVersionJson(versionId) {
        const _params = [
            this.bi.OpenArgs('iVersionSrc', versionId, this.bi.ItDataType.Integer)
        ];
        return this.bi.getResultForeModule({
            moduleKey: this._moduleKey(),
            methodName: 'ReadJSONVersAPI',
            args: _params
        });
    }

    readScenarioJson(scenarioId) {
        const _params = [
            this.bi.OpenArgs('iv_ID_SCENARIO', scenarioId, this.bi.ItDataType.Integer)
        ];
        return this.bi.getResultForeModule({
            moduleKey: this._moduleKey(),
            methodName: 'ReadJSONFullAPI',
            args: _params
        });
    }

    scenSaveAs(newJson, elemName, userName) {
        const _params = [
            this.bi.OpenArgs('json', JSON.stringify(newJson), this.bi.ItDataType.String),
            this.bi.OpenArgs('elemName', elemName, this.bi.ItDataType.String),
            this.bi.OpenArgs('userName', userName, this.bi.ItDataType.String)
        ];
        return this.bi.getResultForeModule({
            moduleKey: this._moduleKey(),
            methodName: 'ScenSaveAs',
            args: _params
        });
    }

    saveJsonToVersion(jsonString, versionKey) {
        const _params = [
            this.bi.OpenArgs('JString', jsonString, this.bi.ItDataType.String),
            this.bi.OpenArgs('iKey', Number(versionKey), this.bi.ItDataType.Integer)
        ];
        return this.bi.getResultForeModule({
            moduleKey: this._moduleKey(),
            methodName: 'JSONFROMFILEAPI',
            args: _params
        });
    }

    scenSave(newJson, elemName, elemKey, userName) {
        const _params = [
            this.bi.OpenArgs('json', JSON.stringify(newJson), this.bi.ItDataType.String),
            this.bi.OpenArgs('elemName', elemName, this.bi.ItDataType.String),
            this.bi.OpenArgs('elemKey', elemKey, this.bi.ItDataType.String),
            this.bi.OpenArgs('userName', userName, this.bi.ItDataType.String)
        ];
        return this.bi.getResultForeModule({
            moduleKey: this._moduleKey(),
            methodName: 'ScenSave',
            args: _params
        });
    }

    scenDelete(scenarioId) {
        const _params = [
            this.bi.OpenArgs('id', String(scenarioId), this.bi.ItDataType.String)
        ];
        return this.bi.getResultForeModule({
            moduleKey: this._moduleKey(),
            methodName: 'ScenDelete',
            args: _params
        });
    }

    prognozVersionDelete(versionId) {
        const _params = [
            this.bi.OpenArgs('id', versionId, this.bi.ItDataType.String)
        ];
        return this.bi.getResultForeModule({
            moduleKey: this._moduleKey(),
            methodName: 'PrognozVersionDelete',
            args: _params
        });
    }

    getCountAPI(itabId, isWhere) {
        const _params = [
            this.bi.OpenArgs('ItabId', itabId, this.bi.ItDataType.String),
            this.bi.OpenArgs('isWhere', isWhere, this.bi.ItDataType.String)
        ];
        return this.bi.getResultForeModule({
            moduleKey: this._moduleKey(),
            methodName: 'GetCountAPI',
            args: _params
        });
    }

    startPrognoz(params) {
        return this.bi.getResultForeModule({
            moduleKey: this._moduleKey(),
            methodName: 'StartPrognoz',
            args: params
        });
    }

    recalcPrognoz(params) {
        return this.bi.getResultForeModule({
            moduleKey: this._moduleKey(),
            methodName: 'RecalcPrognoz',
            args: params
        });
    }
}
