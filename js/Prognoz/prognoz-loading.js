/**
 * Загрузка данных: сценарии, версии, сценарии УХ, показатели, DP, тип сценария, инфляция, поиск.
 */
import { formatState, formatSelected } from './prognoz-utils.js';

export class PrognozLoading {
    constructor(prognoz) {
        this.prognoz = prognoz;
    }

    loadingScenariosPrognozData() {
        const self = this.prognoz;
        const combo = window.Reports.OpenDimCombo(window.Reports.Dims.DK_PROGNOZ_SCEN_RCFF_TABSPRAV, "ScenariosPrognozCombo", null, null, true, (x) => {
            window.Reports.bi.getFiltredDimElements({ "key": combo.dim.getOdId().id }).then(data => this.applyScenariosPrognozData(data, combo, self));
        });
    }

    /** Обработчик данных getFiltredDimElements для сценариев прогноза: обогащение, сортировка, select2. */
    applyScenariosPrognozData(data, combo, self) {
        if (data !== undefined) {
            data.forEach(el => {
                if (el.ea.it && Array.isArray(el.ea.it)) {
                    el.ea.it = el.ea.it.map((col, index) => {
                        const attr = combo.dim._Metadata.data.attrs.it[index];
                        if (attr !== null) {
                            if (typeof col === 'object') col.id = attr.id;
                            else col = { "id": attr.id, "@v": "" };
                        }
                        return col;
                    });
                }
            });
            data = data.filter(item => {
                const status = item.ea.it.find(item => item.id === "STATUS");
                return status !== undefined ? status["@v"] !== "2" : false;
            });
            data.sort((item1, item2) => {
                const isItem1Priority = self.ScenariosDefault.includes(item1.n);
                const isItem2Priority = self.ScenariosDefault.includes(item2.n);
                const dateCreateItem1 = item1.ea.it.find(item => item.id === "CREATED_ON");
                const dateCreateItem2 = item2.ea.it.find(item => item.id === "CREATED_ON");
                if (isItem1Priority === isItem2Priority && dateCreateItem1 !== undefined && dateCreateItem2 !== undefined) {
                    return new Date(dateCreateItem2["@v"]) - new Date(dateCreateItem1["@v"]);
                }
                return isItem1Priority ? -1 : 1;
            });
            const res = data.map((item) => ({ id: Number(item.k), text: item.k + "#;" + item.n }));
            self.ScenariosDataInfo = data.map((item) => {
                const dateFrom = item.ea.it.find(item => item.id === "DATE_FROM");
                const dateTo = item.ea.it.find(item => item.id === "DATE_TO");
                const scenarioUKId = item.ea.it.find(item => item.id === "SCEN_1C");
                const scenarioOwner = item.ea.it.find(item => item.id === "OWNER_UID");
                return {
                    id: Number(item.k),
                    horizonFrom: dateFrom !== undefined ? new Date(dateFrom['@v']) : null,
                    horizonTo: dateTo !== undefined ? new Date(dateTo['@v']) : null,
                    scenarioUKId: scenarioUKId !== undefined ? scenarioUKId['@v'] : null,
                    scenarioOwner: scenarioOwner['@v'],
                };
            });
            self.ScenariosPrognozComboSelected.empty().select2({
                data: res,
                templateResult: formatState,
                templateSelection: formatSelected,
                width: '200px',
                dropdownAutoWidth: false,
                placeholder: '',
                multiple: true,
                allowClear: true,
                maximumSelectionLength: 1,
                language: {
                    noResults: () => "Ничего не найдено",
                    maximumSelected: (args) => args.maximum > 1 ? "Можно выбрать только " + args.maximum + " элемента" : "Можно выбрать только 1 элемент",
                },
                adaptDropdownCssClass: () => '',
            });
        } else {
            const $parent = self.ScenariosPrognozComboSelected.closest('.block-parameters__item');
            if (!$parent.find('.dropdown').hasClass('warning__block')) {
                $parent.find('.dropdown').addClass('warning__block');
                $parent.append(`<p class="warning__text">Нет верифицированных данных</p>`);
            }
        }
    }

    loadingVersionData() {
        const self = this.prognoz;
        if (self.inputData.length > 0) {
            let data = self.inputData.find(item => Number(item.group) === 30);
            if (data !== undefined) {
                const items = data.items.filter(item => item.versionType === "2");
                data = items.map((item) => ({ id: Number(item.id), text: Number(item.id) + "#;" + item.name }));
                const $parent = self.VersionComboSelected.closest('.block-parameters__item');
                $parent.find('.warning__text').remove();
                $parent.find('.dropdown').removeClass('warning__block');
            } else {
                data = [];
            }
            self.VersionComboSelected.empty().select2({
                data: data,
                templateResult: formatState,
                templateSelection: formatSelected,
                width: '200px',
                dropdownAutoWidth: false,
                placeholder: '',
                multiple: true,
                allowClear: true,
                maximumSelectionLength: 1,
                language: {
                    noResults: () => "Ничего не найдено",
                    maximumSelected: (args) => args.maximum > 1 ? "Можно выбрать только " + args.maximum + " элемента" : "Можно выбрать только 1 элемент",
                },
                adaptDropdownCssClass: () => '',
            });
        }
    }

    loadingScenarioUKData() {
        const prognozRef = this.prognoz;
        new Promise((resolve, reject) => {
            window.Reports.bi.openDim({ "dimKey": window.Reports.Dims.DK_RDS_SCENARIOS }).then(x => {
                try {
                    return window.Reports.bi.getFiltredDimElements({ "key": x.id.id }).then(y => {
                        window.Reports.bi.closeDim({ "id": x.id });
                        window.Reports.common.waiter.hide("DK_RDS_SCENARIOS_11486421");
                        y.forEach(el => {
                            if (el.ea.it && Array.isArray(el.ea.it)) {
                                el.ea.it = el.ea.it.map((col, index) => {
                                    const attr = x.meta.data.attrs.it[index];
                                    if (attr !== null) {
                                        if (typeof col === 'object') col.id = attr.id;
                                        else col = { "id": attr.id, "@v": "" };
                                    }
                                    return col;
                                });
                            }
                        });
                        resolve(y);
                    });
                } catch (e) {
                    reject('Error');
                }
            });
        }).then((data) => {
            const self = prognozRef;
            self.scenarioUKData = data.map((item, index) => {
                const name = item.ea.it.find(item => item.id === "NAME");
                const guid = item.ea.it.find(item => item.id === "ZFM1501");
                const isShow = item.ea.it.find(item => item.id === "ZFM1505");
                if (isShow !== undefined && item.k !== "-1" && isShow['@v'] === "") {
                    return { id: index, name: name['@v'], guid: guid['@v'], isShow: isShow['@v'] };
                }
                return null;
            }).filter(item => item !== null);

            const dataInput = self.scenarioUKData.map((item) => ({ id: item.id, text: item.id + "#;" + item.name }));
            self.ScenarioUKSelect.empty().select2({
                data: dataInput,
                templateResult: formatState,
                templateSelection: formatSelected,
                width: '200px',
                dropdownAutoWidth: false,
                placeholder: '',
                multiple: true,
                allowClear: true,
                maximumSelectionLength: 1,
                language: {
                    noResults: () => "Ничего не найдено",
                    maximumSelected: (args) => args.maximum > 1 ? "Можно выбрать только " + args.maximum + " элемента" : "Можно выбрать только 1 элемент",
                },
                adaptDropdownCssClass: () => '',
            });

            self.scenarioBuilder = data.map((item, index) => {
                const activeFrom = item.ea.it.find(item => item.id === "ZFM1676");
                const changesMarketIndicators = item.ea.it.find(item => item.id === "ZFM1677");
                const potentialCreditLines = item.ea.it.find(item => item.id === "ZFM1678");
                const potentialOneLoans = item.ea.it.find(item => item.id === "ZFM1679");
                const existingCreditLines = item.ea.it.find(item => item.id === "ZFM1680");
                const existingOneLoans = item.ea.it.find(item => item.id === "ZFM1681");
                const potentialOwnBonds = item.ea.it.find(item => item.id === "ZFM1682");
                const existingOwnBonds = item.ea.it.find(item => item.id === "ZFM1683");
                const periodBy = item.ea.it.find(item => item.id === "ZFM1684");
                const guid = item.ea.it.find(item => item.id === "ZFM1501");
                return {
                    id: index,
                    name: item.n,
                    guid: guid !== undefined ? guid['@v'] : "",
                    activeFrom: activeFrom !== undefined ? activeFrom['@v'] : "",
                    params: [
                        { name: "Изменение рыночных индикаторов (проц. ставки, курсы валют)", status: changesMarketIndicators !== undefined ? changesMarketIndicators['@v'] !== "" : false },
                        { name: "Создание потенциальных кредитных линий", status: potentialCreditLines !== undefined ? potentialCreditLines['@v'] !== "" : false },
                        { name: "Создание потенциальных единовременных кредитов", status: potentialOneLoans !== undefined ? potentialOneLoans['@v'] !== "" : false },
                        { name: "Корректировка существующих кредитных линий", status: existingCreditLines !== undefined ? existingCreditLines['@v'] !== "" : false },
                        { name: "Корректировка существующих единовременных кредитов", status: existingOneLoans !== undefined ? existingOneLoans['@v'] !== "" : false },
                        { name: "Выпуск потенциальных собственных облигаций", status: potentialOwnBonds !== undefined ? potentialOwnBonds['@v'] !== "" : false },
                        { name: "Выкуп существующих собственных облигаций", status: existingOwnBonds !== undefined ? existingOwnBonds['@v'] !== "" : false },
                    ],
                    periodBy: periodBy['@v'],
                };
            });
        }).catch(error => {
            debugError("Ошибка в одном из запросов:", error);
        });
    }

    loadingScenarioIndicatorsData() {
        const self = this.prognoz;
        const scenarioPromise = window.Reports.bi.openRds({ "rdsKey": window.Reports.Dims.DK_INDICATORS_NISSPRAV }).then(x => {
            if (x == "error") {
                window.Reports.common.waiter.hide("DK_INDICATORS_NISSPRAV_11474987");
                return Promise.reject("Failed to open RDS for indicators");
            }
            return window.Reports.bi.getRdsElements({ "id": x.id.id }).then(y => {
                window.Reports.bi.closeRds({ "id": x.id });
                y.els.e.forEach(el => {
                    if (el.ea.it && Array.isArray(el.ea.it)) {
                        el.ea.it = el.ea.it.map((col, index) => {
                            const attr = x.meta.attrs.its.it[index];
                            if (attr !== null) {
                                if (typeof col === 'object') col.id = attr.id;
                                else col = { "id": attr.id, "@v": "" };
                            }
                            return col;
                        });
                    }
                });
                return y.els.e;
            });
        });

        const modelBlockPromise = window.Reports.bi.openRds({ "rdsKey": window.Reports.Dims.DK_MODEL_BLOCK_NISSPRAV }).then(x => {
            if (x == "error") {
                window.Reports.common.waiter.hide("DK_MODEL_BLOCK_NISSPRAV_11474993");
                return Promise.reject("Failed to open RDS for model block");
            }
            return window.Reports.bi.getRdsElements({ "id": x.id.id }).then(y => {
                window.Reports.bi.closeRds({ "id": x.id });
                y.els.e.forEach(el => {
                    if (el.ea.it && Array.isArray(el.ea.it)) {
                        el.ea.it = el.ea.it.map((col, index) => {
                            const attr = x.meta.attrs.its.it[index];
                            if (attr !== null) {
                                if (typeof col === 'object') col.id = attr.id;
                                else col = { "id": attr.id, "@v": "" };
                            }
                            return col;
                        });
                    }
                });
                return y.els.e;
            });
        });

        Promise.all([scenarioPromise, modelBlockPromise])
            .then(([scenarioData, modelBlockData]) => {
                self.ScenarioIndicatorsData = scenarioData.map(item => {
                    const manualCorrAttr = item.ea.it.find(item => item.id === "MANUAL_CORR");
                    if (manualCorrAttr && manualCorrAttr['@v'] !== "1") return null;
                    const codeAttr = item.ea.it.find(item => item.id === "CODE");
                    const requiredAttr = item.ea.it.find(item => item.id === "NECES_SCEN_IND");
                    const indicatorBlockAttr = item.ea.it.find(item => item.id === "INDICATOR_BLOCK");
                    const json = {
                        id: Number(item.k),
                        name: item.n,
                        blockId: indicatorBlockAttr ? Number(indicatorBlockAttr['@v']) : null,
                        code: codeAttr ? codeAttr['@v'] : "",
                        isRequired: requiredAttr ? requiredAttr['@v'] === "1" : false,
                    };
                    return json;
                }).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));

                self.ModelBlockData = modelBlockData.map(item => ({
                    id: Number(item.k),
                    name: item.n,
                })).sort((a, b) => a.name.localeCompare(b.name));

                self.renderScenarioIndicators();
                self.detailsPopUp.init();
            })
            .catch(error => {
                debugError("Ошибка в одном из запросов:", error);
            });
    }

    loadingDPInfo() {
        const combo = window.Reports.OpenDimCombo(window.Reports.Dims.DK_EKR_VAR_NSISPRAV, null, null, null, true, function (x) {
            window.Reports.bi.getFiltredDimElements({ "key": combo.dim.getOdId().id }).then(data => {
                if (data !== undefined) {
                    data.forEach(el => {
                        if (el.ea.it && Array.isArray(el.ea.it)) {
                            el.ea.it = el.ea.it.map((col, index) => {
                                const attr = combo.dim._Metadata.data.attrs.it[index];
                                if (attr !== null) {
                                    if (typeof col === 'object') col.id = attr.id;
                                    else col = { "id": attr.id, "@v": "" };
                                }
                                return col;
                            });
                        }
                    });
                    const $DPBlock = $('[field="scenarioUk"]');
                    if ($DPBlock.length > 0) {
                        const info = data.find(item => item.ea.it.find(item => item.id === "ID")["@v"] === "DP_LAST_PRECALC");
                        if (info !== undefined) {
                            const value = info.ea.it.find(item => item.id === "TEXT_VAL");
                            const dpInfo = $DPBlock.find('[data-infoDP]');
                            if (value !== undefined && dpInfo.length === 0) {
                                $DPBlock.append(`<p data-infoDP="" style="grid-column: span 4 / span 4; margin: 0;">${value['@v']}</p>`);
                            }
                        }
                    }
                }
            });
        });
    }

    loadingScenTypeData() {
        const self = this.prognoz;
        const data = [
            { id: 1, text: "1#;Все" },
            { id: 2, text: "2#;Базовый" },
            { id: 3, text: "3#;Оптимистичный" },
            { id: 4, text: "4#;Стрессовый" },
        ];
        self.scenTypeSelected.empty().select2({
            data: data,
            templateResult: formatState,
            templateSelection: formatSelected,
            width: '200px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: false,
            maximumSelectionLength: 1,
            language: {
                noResults: () => "Ничего не найдено",
                maximumSelected: (args) => args.maximum > 1 ? "Можно выбрать только " + args.maximum + " элемента" : "Можно выбрать только 1 элемент",
            },
            adaptDropdownCssClass: () => '',
        });
        self.scenTypeSelected.val([data[0].id]).trigger('change');
        const select2Event = $.Event('select2:select');
        select2Event.params = { data: data[0] };
        self.scenTypeSelected.trigger(select2Event);
    }

    loadingInflationPropData() {
        const self = this.prognoz;
        const combo = window.Reports.OpenDimCombo(window.Reports.Dims.SHORTCUT_TO_DK_INFL_RATE_NSISPRAV, null, null, null, true, function (x) {
            window.Reports.bi.getFiltredDimElements({ "key": combo.dim.getOdId().id }).then(data => {
                const $parent = self.inflationPropComboSelected.closest('.block-parameters__item');
                if (data !== undefined) {
                    const res = data.map((item) => ({ id: Number(item.k), text: item.k + "#;" + item.n }));
                    self.inflationPropData = data;
                    self.inflationPropComboSelected.empty().select2({
                        data: res,
                        templateResult: formatState,
                        templateSelection: formatSelected,
                        width: '150px',
                        dropdownAutoWidth: false,
                        placeholder: '',
                        multiple: true,
                        allowClear: true,
                        maximumSelectionLength: 1,
                        language: {
                            noResults: () => "Ничего не найдено",
                            maximumSelected: (args) => args.maximum > 1 ? "Можно выбрать только " + args.maximum + " элемента" : "Можно выбрать только 1 элемент",
                        },
                        adaptDropdownCssClass: () => '',
                    });
                    if ($parent.find('.dropdown').hasClass('warning__block')) {
                        $parent.find('.dropdown').removeClass('warning__block');
                        $parent.find('.warning__text').remove();
                    }
                    if (res.length > 0) {
                        const defaultVal = res.find(item => item.text.includes('Россия инфляция по итогам календарного года'));
                        if (defaultVal !== undefined) {
                            self.inflationPropComboSelected.val([defaultVal.id]).trigger('change');
                            const ev = $.Event('select2:select');
                            ev.params = { data: defaultVal };
                            self.inflationPropComboSelected.trigger(ev);
                        }
                    }
                } else {
                    if (!$parent.find('.dropdown').hasClass('warning__block')) {
                        $parent.find('.dropdown').addClass('warning__block');
                        $parent.append(`<p class="warning__text">Нет верифицированных данных</p>`);
                    }
                }
            });
        });
    }

    loadingSearchData() {
        const self = this.prognoz;
        const $parent = $('[block="scenType"]');
        const $items = $parent.find('.ListRow:not(.Hidden)');
        const data = [];
        $items.each((i, el) => {
            const $item = $(el);
            const rowId = $item.attr('row-id');
            const name = $item.find('[field="Name"] .RowItemName').text();
            data.push({ id: i, text: rowId + "#;" + name });
        });
        self.searchSelected.empty().select2({
            data: data,
            templateResult: formatState,
            templateSelection: formatSelected,
            width: '200px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: false,
            maximumSelectionLength: 1,
            language: {
                noResults: () => "Ничего не найдено",
                maximumSelected: (args) => args.maximum > 1 ? "Можно выбрать только " + args.maximum + " элемента" : "Можно выбрать только 1 элемент",
            },
            adaptDropdownCssClass: () => '',
        });
    }
}
