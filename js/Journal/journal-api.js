/**
 * API-слой Journal: вызовы bi.getResultForeModule для журнала (GetInfoLog).
 * Конструктор: JournalApi(reports) для доступа к bi, ForeKeys, common.waiter.
 */

export class JournalApi {
    constructor(reports) {
        this.reports = reports;
    }

    /**
     * Загрузка списка записей журнала.
     * @param {number} type - 1 = стресс, 2 = прогноз
     * @param {string} dateStr - дата в формате toShortDate()
     * @returns {Promise<Array>} сырые данные от GetInfoLog
     */
    fetchJournalData(type, dateStr) {
        const R = this.reports;
        let json = {
            date: dateStr,
            current: '',
            version: ''
        };
        let method = 'GetInfoLog';
        let module = null;
        if (type == 1) {
            json.type = 0;
            module = R.ForeKeys.DK_STRESS_1144013;
        } else if (type == 2) {
            json.type = 1;
            json.version = '-1';
            module = R.ForeKeys.DK_PROGNOZ_1145438;
        } else {
            return Promise.resolve([]);
        }

        const _params = [R.bi.OpenArgs('json', JSON.stringify(json), R.bi.ItDataType.String)];
        return R.bi.getResultForeModule({
            moduleKey: module,
            methodName: method,
            args: _params
        });
    }

    /**
     * Загрузка деталей (шагов) по version id для стресс-журнала.
     * @param {string|number} versionId
     * @param {string} dateStr - дата журнала
     * @returns {Promise<Array>} массив шагов
     */
    loadDetailsByVersionId(versionId, dateStr) {
        const R = this.reports;
        const json = {
            type: 0,
            current: '',
            version: '' + versionId + '',
            date: dateStr
        };
        const _params = [R.bi.OpenArgs('json', JSON.stringify(json), R.bi.ItDataType.String)];
        return R.bi.getResultForeModule({
            moduleKey: R.ForeKeys.DK_STRESS_1144013,
            methodName: 'GetInfoLog',
            args: _params
        });
    }
}
