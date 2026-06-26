/**
 * Инициализация datepicker'ов: горизонт, глубина, период создания версии.
 */
import { PrognozType } from './constants.js';

export class PrognozDatePickers {
    constructor(prognoz) {
        this.prognoz = prognoz;
    }

    initHorizonDatePicker() {
        const self = this.prognoz;
        const currentDate = new Date();

        const optionFrom = {
            readonly: true,
            view: 'months',
            minView: 'months',
            dateFormat: 'MMMM yyyy',
        };

        const optionTo = {
            readonly: true,
            view: 'months',
            minView: 'months',
            dateFormat: 'MMMM yyyy',
        };

        let from = "";
        let to = "";

        if (self.dtCloseKFO !== null) {
            let dateKFO = new Date(self.dtCloseKFO);

            if (self.type !== PrognozType.TYPE_0) {
                from = dateKFO.toISOString().split('T')[0];
                to = dateKFO.toISOString().split('T')[0];
                const $paramBlock = $('[block="parameters"] .block-parameters__body');
                const formattedDateKFO = [dateKFO.toLocaleString('ru-RU', { month: 'long' }), dateKFO.getFullYear()].join(' ');
                if (self.type === PrognozType.TYPE_2) {
                    $paramBlock.prepend(`
                            <div class="block-parameters__item">
                                <p class="block-parameters__text">Период закрытия КФО</p>
                                <p class="block-parameters__text" style="text-transform: capitalize;width: max-content;margin: 14px auto 0 auto;">${formattedDateKFO}</p>
                            </div>`);
                }
                from = new Date(dateKFO.getFullYear(), dateKFO.getMonth() + 1, dateKFO.getDate()).toISOString().split('T')[0];
                to = new Date(dateKFO.getFullYear() + 3, 11, dateKFO.getDate()).toISOString().split('T')[0];
                optionFrom.disabled = true;
                const $selectHorizonFrom = $('#HorizonFrom');
                $selectHorizonFrom.addClass('selected__disabled');
                $selectHorizonFrom.parent().css('background', '#eee');

                if (self.type === PrognozType.TYPE_1) {
                    optionTo.disabled = true;
                    const $HorizonTo = $('#HorizonTo');
                    $HorizonTo.addClass('selected__disabled');
                    $HorizonTo.parent().css('background', '#eee');
                    from = "";
                    to = "";
                }
                optionTo.minDate = new Date(dateKFO.getFullYear(), dateKFO.getMonth() + 2, dateKFO.getDate()).toISOString().split('T')[0];
                optionTo.maxDate = new Date(dateKFO.getFullYear() + 10, dateKFO.getMonth() + 1, dateKFO.getDate()).toISOString().split('T')[0];
            } else if (self.type === PrognozType.TYPE_0) {
                const prognoz = this.prognoz;
                optionFrom.onSelect = function (formattedDate, date, inst) {
                    if (formattedDate.date !== undefined) {
                        prognoz.HorizonTo.update({
                            minDate: new Date(formattedDate.date.getFullYear(), formattedDate.date.getMonth() + 1, formattedDate.date.getDate()).toISOString().split('T')[0],
                            maxDate: new Date(formattedDate.date.getFullYear() + 10, formattedDate.date.getMonth() + 1, formattedDate.date.getDate()).toISOString().split('T')[0]
                        });
                    }
                    prognoz.HorizonTo.clear();
                };
            }
        }

        self.HorizonFrom = new AirDatepicker('#HorizonFrom', optionFrom);
        self.HorizonTo = new AirDatepicker('#HorizonTo', optionTo);
        self.HorizonFrom.selectDate(from, { silent: true });
        self.HorizonTo.selectDate(to, { silent: true });
        self.HorizonFrom.setViewDate(from);
        self.HorizonTo.setViewDate(to);
    }

    initCreationDatePicker() {
        const self = this.prognoz;
        const currentDate = new Date();
        let from = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, currentDate.getDate());
        let to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
        const prognoz = this.prognoz;

        const optionFrom = {
            readonly: true,
            view: 'months',
            minView: 'months',
            dateFormat: 'MMMM yyyy',
            onSelect: function (formattedDate, date, inst) {
                if (formattedDate.date !== undefined) {
                    prognoz.CreationTo.update({
                        minDate: new Date(formattedDate.date.getFullYear(), formattedDate.date.getMonth() + 1, formattedDate.date.getDate()).toISOString().split('T')[0]
                    });
                }
                prognoz.CreationTo.clear();
            }
        };

        const optionTo = {
            readonly: true,
            view: 'months',
            minView: 'months',
            dateFormat: 'MMMM yyyy',
            onSelect: function (formattedDate, date, inst) {
                if (formattedDate.date !== undefined) {
                    const createdFrom = prognoz.CreationFrom.selectedDates.length > 0 ? prognoz.CreationFrom.selectedDates[0] : null;
                    const scenTypeSelected = prognoz.scenTypeSelected.select2('data');
                    if (createdFrom !== null && scenTypeSelected.length > 0) {
                        const createdTo = formattedDate.date;
                        const createdToLastDay = new Date(createdTo.getFullYear(), createdTo.getMonth() + 1, 0);
                        prognoz.filterVersionList(createdFrom, createdToLastDay, scenTypeSelected[0]);
                    }
                }
            }
        };

        self.CreationFrom = new AirDatepicker('#creationFrom', optionFrom);
        self.CreationTo = new AirDatepicker('#creationTo', optionTo);
        self.CreationFrom.selectDate(from, { silent: true });
        self.CreationTo.selectDate(to, { silent: true });
        self.CreationFrom.setViewDate(from);
        self.CreationTo.setViewDate(to);
    }

    initDepthDatePicker() {
        const self = this.prognoz;
        const currentDate = new Date();

        const optionFrom = {
            readonly: true,
            view: 'months',
            minView: 'months',
            dateFormat: 'MMMM yyyy',
        };

        const optionTo = {
            readonly: true,
            view: 'months',
            minView: 'months',
            dateFormat: 'MMMM yyyy',
        };

        let from = "";
        let to = "";

        if (self.dtCloseKFO !== null) {
            let dateKFO = new Date(self.dtCloseKFO);
            from = dateKFO.toISOString().split('T')[0];
            to = dateKFO.toISOString().split('T')[0];

            if (self.type !== PrognozType.TYPE_0) {
                from = new Date(dateKFO.getFullYear() - 3, dateKFO.getMonth() + 1, dateKFO.getDate()).toISOString().split('T')[0];
                to = new Date(dateKFO.getFullYear(), dateKFO.getMonth(), dateKFO.getDate()).toISOString().split('T')[0];
                optionTo.disabled = true;
                const $DepthTo = $('#DepthTo');
                $DepthTo.addClass('selected__disabled');
                $DepthTo.parent().css('background', '#eee');

                if (self.type === PrognozType.TYPE_1) {
                    optionFrom.disabled = true;
                    const $selectDepthFrom = $('#DepthFrom');
                    $selectDepthFrom.addClass('selected__disabled');
                    $selectDepthFrom.parent().css('background', '#eee');
                    from = "";
                    to = "";
                }
                optionFrom.minDate = new Date(dateKFO.getFullYear() - 5, dateKFO.getMonth(), dateKFO.getDate());
                optionFrom.maxDate = dateKFO;
            }
        } else {
            from = currentDate;
            to = currentDate;
        }

        self.DepthFrom = new AirDatepicker('#DepthFrom', optionFrom);
        self.DepthTo = new AirDatepicker('#DepthTo', optionTo);
        self.DepthFrom.selectDate(from, { silent: true });
        self.DepthTo.selectDate(to, { silent: true });
        self.DepthFrom.setViewDate(from);
        self.DepthTo.setViewDate(to);
    }
}
