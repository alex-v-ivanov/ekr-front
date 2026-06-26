/**
 * Бизнес-логика стресс-теста: проверка структуры, запуск расчёта, сохранение конфигурации.
 * Зависимости bi и ForeKeys передаются через конструктор.
 */
export class StressReport {
    constructor(bi, foreKeys) {
        this.bi = bi;
        this.foreKeys = foreKeys || {};
    }

    /**
     * Проверка полной структуры (CheckFullStructure).
     * @param {Object} json — объект конфигурации
     * @param {string|number} prognozVersionId — ID версии прогноза
     * @param {string} userId — ID пользователя
     * @returns {Promise}
     */
    getValidData(json, prognozVersionId, userId) {
        const bi = this.bi;
        if (!bi) throw new Error("StressReport: bi dependency not injected");
        const _params = [
            bi.OpenArgs("json", JSON.stringify(json), bi.ItDataType.String),
            bi.OpenArgs("userName", userId, bi.ItDataType.String),
            bi.OpenArgs("version", prognozVersionId, bi.ItDataType.String),
        ];
        return bi.getResultForeModule({
            moduleKey: this.foreKeys.DK_STRESS_1144013,
            methodName: "CheckFullStructure",
            args: _params,
        });
    }

    /**
     * Запуск стресс-теста (startModelRisk).
     * @param {string} json — JSON-строка конфигурации
     * @param {string} userName — имя пользователя
     * @param {string|number} version — версия прогноза
     * @returns {Promise}
     */
    startModelRisk(json, userName, version) {
        const bi = this.bi;
        if (!bi) throw new Error("StressReport: bi dependency not injected");
        const _params = [
            bi.OpenArgs("json", json, bi.ItDataType.String),
            bi.OpenArgs("userName", userName, bi.ItDataType.String),
            bi.OpenArgs("version", version, bi.ItDataType.String),
        ];
        return bi.getResultForeModule({
            moduleKey: this.foreKeys.DK_STRESS_1144013,
            methodName: "startModelRisk",
            args: _params,
        });
    }

    /**
     * Сохранение конфигурации пользователя (SaveUserStructure).
     * @param {string} json — JSON-строка конфигурации
     * @param {string} userId — ID пользователя
     * @param {string} versionId — ID версии прогноза
     * @returns {Promise}
     */
    saveUserStructure(json, userId, versionId) {
        const bi = this.bi;
        if (!bi) throw new Error("StressReport: bi dependency not injected");
        const _params = [
            bi.OpenArgs("json", json, bi.ItDataType.String),
            bi.OpenArgs("userName", userId, bi.ItDataType.String),
            bi.OpenArgs("version", versionId, bi.ItDataType.String),
        ];
        return bi.getResultForeModule({
            moduleKey: this.foreKeys.DK_STRESS_1144013,
            methodName: "SaveUserStructure",
            args: _params,
        });
    }
}
