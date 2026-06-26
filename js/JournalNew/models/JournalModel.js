/**
 * Модель журнала: хранит данные, бизнес-логику.
 */

import { getDateFromString, getDateDifference, pluralize } from '../utils/journal-utils.js';
import { JournalType } from '../constants.js';

export class JournalModel {
    constructor() {
        this.data = null;
        this.type = null;
        this.dateFrom = null;
        this.userSelected = null;
        this.creationFrom = null;
        this.creationTo = null;
        this.dataInterval = null;
    }

    setType(type) {
        this.type = type;
    }

    setDateFrom(dateFrom) {
        this.dateFrom = dateFrom;
    }

    getDateFromValue() {
        return this.dateFrom?.getValue();
    }

    updateData(data) {
        this.data = (data || []).map(item => {
            if (item.StartDateTime !== "") {
                item.create = getDateFromString(item.StartDateTime);
            }
            return item;
        });
        return this.data;
    }

    getData() {
        return this.data || [];
    }

    getDateFromString(date) {
        return getDateFromString(date);
    }

    getDateDifference(dateFrom, dateTo) {
        return getDateDifference(dateFrom, dateTo);
    }

    pluralize(number, forms) {
        return pluralize(number, forms);
    }

    getType() {
        return this.type;
    }

    isStressType() {
        return this.type === JournalType.STRESSTEST;
    }

    isPrognozType() {
        return this.type ===  JournalType.PROGNOZ;
    }

    setDataInterval(interval) {
        this.dataInterval = interval;
    }

    clearDataInterval() {
        if (this.dataInterval) {
            clearInterval(this.dataInterval);
            this.dataInterval = null;
        }
    }
}