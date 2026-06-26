/**
 * API-модель: все запросы к серверу.
 */

export class JournalApiModel {
    constructor(reports) {
        this.reports = reports;
    }

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

    fetchDetailsByVersionId(versionId, dateStr) {
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