/**
 * API-модель: запросы к бэкенду.
 */

import { JournalType, ForeKeys } from "../constants.js";
import { Foresight } from "../services/ForesightAPI.js";
import { dateRU } from "../utils/journal-utils.js";

export class JournalApiModel {
    constructor(config) {
        this.ForeKeys = ForeKeys;
        this.Foresight = new Foresight(config);
    }

    fetchJournalData(type, dateFrom) {
        const dateStr = dateRU(dateFrom)

        let json = {
            date: dateStr,
            current: '',
            version: ''
        };
        let method = 'GetInfoLog';
        let module = null;

        if (type == JournalType.STRESSTEST) {
            json.type = 0;
            module = this.ForeKeys.STRESSTEST_MAIN_MODULE;
        } 
        else if (type == JournalType.PROGNOZ) {
            json.type = 1;
            json.version = '-1';
            module = this.ForeKeys.PROGNOZ_MAIN_MODULE;
        } 
        else {
            return Promise.resolve([]);
        }

        const _params = [Foresight.OpenArgs('json', JSON.stringify(json), Foresight.ItDataType.String)];
        
        return this.Foresight.getResultForeModule({
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