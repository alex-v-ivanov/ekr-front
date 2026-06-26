/**
 * Инициализация UI Stress: даты, комбо, фильтры, тултипы, версия.
 * Зависимости берутся из this.stress (openDimCombo, Dims, bi, ForeKeys, common).
 */
import { formatState, formatSelected, formatState3, initSelect2Event, formatDate } from './utils.js';
import { StressModes, StressValidationMessages } from './constants.js';

export class StressUI {
    constructor(stress) {
        this.stress = stress;
    }

    run() {
        this.stress.initDateParam();
        this.stress.initPrognozVersionCombo();
        this.stress.initIterationCountCombo();
        this.stress.initSimulationCount();
        this.stress.initSerachDistributionToListPopUp();
        this.stress.initFilterInputIndicator();
        this.stress.initFilterOutputIndicator();
        this.stress.chart.init();
        this.stress.InputSelectDistribution.init();
        this.stress.addListIndicators.init();
        this.stress.uploadFilePopUp.init();
        this.stress.arrayDataPopUp.init();
        this.stress.initVersion();
        this.stress.initTooltip();

        $(document).on('click', '.dropdown svg', function (e) {
            const $select = $(this).siblings('select');
            $select.select2('open');
            e.stopPropagation();
        });

        const tableLR = document.querySelector('#SelectDistributionGrid [data-field="LR"]');
        if (tableLR) tableLR.asc = true;
    }

    initTooltip() {
        const tooltips = document.querySelectorAll('[tooltipe]');

        tooltips.forEach(el => {
            const text = el.getAttribute('tooltipe');

            tippy(el, {
                content: '<p class="tooltipe__text">' + text + '</p>',
                animation: 'fade',
                followCursor: true,
                arrow: false,
                allowHTML: true,
            });
        });
    }

    filterInputItems($btn, mode) {
        let data = Array.from(this.stress.inputDataRows);
        if (mode === StressModes.PRODUCT) {
            data = this.stress.ProductsEls.map(item => {
                const product = item.text.split('#;');
                return {
                    "number": product[0],
                    "indicatorName": product[1],
                };
            });
        } else {
            data.unshift({
                "number": "Все",
                "indicatorName": "Все",
            });

            if (mode !== "Number") {
                data = data.filter((item, index, self) =>
                    index === self.findIndex((t) => (t.indicatorName === item.indicatorName)));
            }
        }

        this.stress.customePopUp.init($btn, data, [], "filteringInputItems" + mode, $('#input_block .ListHeadlines'));
    }

    filterOutputItems($btn, mode) {
        let data = Array.from(this.stress.OutputDataRows);
        if (mode === StressModes.PRODUCT) {
            data = this.stress.ProductsEls.map(item => {
                const product = item.text.split('#;');
                return {
                    "number": product[0],
                    "indicatorName": product[1],
                };
            });
        } else {
            data.unshift({
                "number": "Все",
                "indicatorName": "Все",
            });

            if (mode !== "Number") {
                data = data.filter((item, index, self) =>
                    index === self.findIndex((t) => (t.indicatorName === item.indicatorName)));
            }
        }

        this.stress.customePopUp.init($btn, data, [], "filteringOutputItems" + mode, $('#output_block .ListHeadlines'));
    }

    initSelect2Field($el, data) {
        $el.select2({
            data: data,
            templateResult: formatState,
            templateSelection: formatSelected,
            width: '170px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
            language: {
                noResults: function () {
                    return "Ничего не найдено";
                },
                maximumSelected: function (args) {
                    if (args.maximum > 1) {
                        return "Можно выбрать только " + args.maximum + " элемента";
                    } else {
                        return "Можно выбрать только 1 элемент";
                    }
                }
            },
            adaptDropdownCssClass: function () {
                return '';
            },
            matcher: function (params, data) {
                if ($.trim(params.term) === '') {
                    return data;
                }
                var parts = data.text.split(';');
                var valuePart = parts.length > 1 ? parts[1] : parts[0];
                if (valuePart.toUpperCase().indexOf(params.term.toUpperCase()) >= 0) {
                    return data;
                }
                return null;
            },
        });

        initSelect2Event($el);
    }

    initDateParam() {
        const optionFrom = {
            view: 'months',
            minView: 'months',
            dateFormat: 'MMMM yyyy',
            onSelect: (formattedDate, date, inst) => {
                this.stress.DateParamToEl.update({
                    minDate: formattedDate.date
                });
                this.stress.DateParamToEl.clear();

                if (this.stress.CheckDateParam()) {
                    this.stress.getVersionsCombo();
                }
            }
        };

        const optionTo = {
            view: 'months',
            minView: 'months',
            dateFormat: 'MMMM yyyy',
            onSelect: (formattedDate, date, inst) => {
                if (this.stress.CheckDateParam()) {
                    this.stress.getVersionsCombo();
                }
            }
        };
        this.stress.DateParamFromEl = new AirDatepicker('#DateParamFrom', optionFrom);
        this.stress.DateParamToEl = new AirDatepicker('#DateParamTo', optionTo);

        this.stress.DateParamFromEl.selectDate("2024-01-01", {
            silent: true
        });
        this.stress.DateParamToEl.selectDate("2024-12-31", {
            silent: true
        });

        this.stress.DateParamFromEl.setViewDate("2024-01-01");
        this.stress.DateParamToEl.setViewDate("2024-12-31");
    }

    initPrognozVersionCombo() {
        this.stress.PrognozVersionComboSelected = $('#PrognozVersionCombo');

        this.stress.PrognozVersionComboSelected.select2({
            width: '120px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });

        initSelect2Event(this.stress.PrognozVersionComboSelected);

        this.stress.PrognozVersionComboSelected.on('select2:select', (e) => {
            if ($(e.target).val().length >= 1) {
                const res = $(e.target).select2('data');

                if (res.length > 0) {
                    const PrognozVersionid = Number(res[0].text.split('#;')[0]);
                    this.loadingSaveStressIdByPrognozVersionid(PrognozVersionid);

                    const Indicators = $('.ListRow');

                    Indicators.each((indx, e) => {
                        const $item = $(e);
                        const $parent = $item.closest('ul');
                        const parentIdBlock = $parent.attr('id');
                        const itemNumber = $item.attr('row-id');

                        let mode = "";
                        let rowData = null;

                        if (parentIdBlock === "output_block_list") {
                            mode = "Output";
                            rowData = this.stress.OutputDataRows.find(item => item.number === Number(itemNumber));
                        } else {
                            mode = "Input";
                            rowData = this.stress.inputDataRows.find(item => item.number === Number(itemNumber));
                        }

                        if (rowData !== null) {
                            this.stress.checkIndicator(rowData, mode);
                        }
                    });
                }
            }
        });
    }

    initIterationCountCombo() {
        this.stress.IterationCountComboSelected = $('#IterationCountCombo');

        this.stress.IterationCountComboSelected.select2({
            width: '120px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });

        initSelect2Event(this.stress.IterationCountComboSelected);
    }

    loadingIterationCountData(selectCount = null) {
        this.stress.IterationCountCombo = this.stress.openDimCombo(this.stress.Dims.DK_ITERATION_COUNT, "IterationCountCombo", null, function (selectedKey, select, sender) {
        }, false, () => {
            this.stress.IterationCountCombo.dimSrv.getAllElements(this.stress.IterationCountCombo.dim, {}, (sender, args) => {
                let els = args.Response.GetDimElementsResult.els;

                const data = els.e.map((item, index) => ({
                    id: item.n,
                    text: item.n
                }));

                this.stress.IterationCountComboSelected.empty().select2({
                    data: data,
                    templateResult: formatState3,
                    width: '200px',
                    dropdownAutoWidth: false,
                    placeholder: '',
                    multiple: true,
                    allowClear: true,
                    maximumSelectionLength: 1,
                    language: {
                        noResults: function () {
                            return "Ничего не найдено";
                        },
                        maximumSelected: function (args) {
                            if (args.maximum > 1) {
                                return "Можно выбрать только " + args.maximum + " элемента";
                            } else {
                                return "Можно выбрать только 1 элемент";
                            }
                        }
                    },
                    adaptDropdownCssClass: function () {
                        return '';
                    },
                    tags: true,
                    createTag: function (params) {
                        if (!/^[0-9]+$/.test(params.term)) {
                            return null;
                        }
                        const number = parseInt(params.term, 10);
                        if (isNaN(number) || number <= 0 || number > 100000) {
                            return null;
                        }
                        if (params.term !== number.toString()) {
                            return null;
                        }
                        return {
                            id: params.term,
                            text: params.term
                        };
                    }
                });

                if (selectCount !== null) {
                    const options = this.stress.IterationCountComboSelected.find('option');
                    let option = null;
                    let posOptions = null;

                    options.each(function (index) {
                        if ($(this).text() === selectCount) {
                            posOptions = index;
                            option = $(this)[0];
                            return false;
                        }
                    });

                    if (posOptions === null) {
                        option = new Option(selectCount, selectCount, true, true);
                        this.stress.IterationCountComboSelected.append(option);
                    }

                    this.stress.IterationCountComboSelected.val(option.value).trigger('change');
                } else {
                    if (data && data.length > 0) {
                        if (selectCount !== null) {
                            const index = data.findIndex(item => item.text === selectCount);
                            this.stress.IterationCountComboSelected.val(data[index].id).trigger('change');
                        } else {
                            this.stress.IterationCountComboSelected.val([data[0].id]).trigger('change');
                        }
                    }
                }
            });
        });
    }

    loadingVersionsCombo() {
        return new Promise((resolve, reject) => {
            const from = '01.' + formatDate(this.stress.DateParamFromEl.selectedDates[0]);
            const to = '01.' + formatDate(this.stress.DateParamToEl.selectedDates[0]);

            let _params = [
                { Id: "DATE_IN", Value: from, Type: this.stress.bi.ItDataType.String },
                { Id: "DATE_OUT", Value: to, Type: this.stress.bi.ItDataType.String }
            ];

            this.stress.PrognozVersionCombo = this.stress.openDimCombo(this.stress.Dims.STRESS_VERSIONS, "PrognozVersionCombo", _params, null, false, (x) => {
                this.stress.PrognozVersionCombo.dimSrv.getAllElements(this.stress.PrognozVersionCombo.dim, {}, (sender, args) => {
                    let els = args.Response.GetDimElementsResult.els;
                    resolve(els !== undefined ? els : []);
                });
            });
        });
    }

    loadingSaveStressIdByPrognozVersionid(prognozId) {
        const json = {
            prognozVersion: Number(prognozId)
        };

        let _params = [
            this.stress.bi.OpenArgs("json", JSON.stringify(json), this.stress.bi.ItDataType.String),
            this.stress.bi.OpenArgs("userName", this.stress.getUserId ? this.stress.getUserId() : '', this.stress.bi.ItDataType.String),
            this.stress.bi.OpenArgs("version", prognozId, this.stress.bi.ItDataType.String),
        ];
        this.stress.bi.getResultForeModule({
            "moduleKey": this.stress.ForeKeys.DK_STRESS_1144013, "methodName": "GetStressTestVersions", "args": _params
        }).then(x => this.handleGetStressTestVersionsResponse(x));
    }

    /**
     * Обработчик ответа GetStressTestVersions: заполнение PrognozVersionEls.
     */
    handleGetStressTestVersionsResponse(x) {
        if (x.status === "OK") {
            const json = JSON.parse(x.message);
            this.stress.PrognozVersionEls = json.map((item, index) => ({
                id: index,
                text: item.key + "#;" + item.name
            }));
        }
    }

    clearInputList() {
        this.stress.common.showDialog(StressValidationMessages.CONFIRM_DELETE_ALL_INPUT, "Exclamation", () => {
            const $body = $('#input_block_list');
            this.stress.inputDataRows = [];
            $body.empty();
        });
    }

    clearOutputList() {
        this.stress.common.showDialog(StressValidationMessages.CONFIRM_DELETE_ALL_OUTPUT, "Exclamation", () => {
            const $body = $('#output_block_list');
            this.stress.OutputDataRows = [];
            $body.empty();
        });
    }

    initSimulationCount() {
        this.stress.SimulationCount = $('#SimulationCount');

        this.stress.SimulationCount.select2({
            width: '120px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });

        initSelect2Event(this.stress.SimulationCount);

        const data = [
            { id: 1, text: "1" },
            { id: 2, text: "2" },
            { id: 3, text: "3" },
            { id: 4, text: "4" },
            { id: 5, text: "5" },
            { id: 6, text: "6" },
            { id: 7, text: "7" },
            { id: 8, text: "8" },
            { id: 9, text: "9" },
            { id: 10, text: "10" },
        ];
        this.stress.SimulationCount.empty().select2({
            data: data,
            width: '200px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
            language: {
                noResults: function () {
                    return "Ничего не найдено";
                },
                maximumSelected: function (args) {
                    if (args.maximum > 1) {
                        return "Можно выбрать только " + args.maximum + " элемента";
                    } else {
                        return "Можно выбрать только 1 элемент";
                    }
                }
            },
            adaptDropdownCssClass: function () {
                return '';
            },
            tags: true,
            createTag: function (params) {
                if (!/^[0-9]+$/.test(params.term)) {
                    return null;
                }
                const number = parseInt(params.term, 10);
                if (isNaN(number) || number <= 0 || number > 10) {
                    return null;
                }
                if (params.term !== number.toString()) {
                    return null;
                }
                return {
                    id: params.term,
                    text: params.term
                };
            }
        });

        if (data && data.length > 0) {
            this.stress.SimulationCount.val([data[0].id]).trigger('change');

            var select2Event = $.Event('select2:select');
            select2Event.params = {
                data: data[0]
            };
            this.stress.SimulationCount.trigger(select2Event);
        }
    }

    initVersion() {
        this.stress.common.waiter.show("initVersion");
        const hideInitVersionWaiter = () => {
            try {
                this.stress.common.waiter.hide("initVersion");
            } catch (e) {
                debugWarn("hideInitVersionWaiter:", e);
            }
        };

        let _params = [
            this.stress.bi.OpenArgs("userName", this.stress.getUserId ? this.stress.getUserId() : '', this.stress.bi.ItDataType.String),
            this.stress.bi.OpenArgs("version", "-1", this.stress.bi.ItDataType.String),
        ];
        this.stress.bi.getResultForeModule({
            "moduleKey": this.stress.ForeKeys.DK_STRESS_1144013, "methodName": "getStructure", "args": _params
        }).then(req => {
            if (req == "error" || !req) {
                hideInitVersionWaiter();
                return;
            }
            if (req.faultstring && req.faultstring.length > 0) {
                this.stress.common.showDialog(req.faultstring, "Error");
                hideInitVersionWaiter();
                return;
            }

            this.stress.getValidData(req, req.prognozVersion != null ? req.prognozVersion : null).then(res => {
                try {
                    if (res && (res.status == "ERROR" || (res.faultstring && res.faultstring.length > 0))) {
                        res = req;
                    } else if (res && res.message) {
                        res = JSON.parse(res.message);
                    } else {
                        hideInitVersionWaiter();
                        return;
                    }
                } catch (e) {
                    debugError("initVersion parse response:", e);
                    hideInitVersionWaiter();
                    return;
                }

                if (!res || !res.dateFrom || !res.dateTo) {
                    hideInitVersionWaiter();
                    return;
                }
                const dateFrom = res.dateFrom.split('.').reverse().join('-') + "-01";
                const dateTo = res.dateTo.split('.').reverse().join('-') + "-01";

                this.stress.DateParamFromEl.selectDate(dateFrom, {
                    silent: true
                });
                this.stress.DateParamToEl.selectDate(dateTo, {
                    silent: true
                });

                this.stress.DateParamFromEl.setViewDate(dateFrom);
                this.stress.DateParamToEl.setViewDate(dateTo);

                this.loadingSaveStressIdByPrognozVersionid(res.prognozVersion);
                this.loadingIterationCountData(res.IterationCount);

                if (res.SimulationCount !== "" && res.SimulationCount !== null) {
                    const options = this.stress.SimulationCount.find('option');
                    let option = null;
                    let posOptions = null;

                    options.each(function (index) {
                        if ($(this).text() === res.SimulationCount) {
                            posOptions = index;
                            option = $(this)[0];
                            return false;
                        }
                    });

                    if (posOptions === null) {
                        option = new Option(res.SimulationCount, res.SimulationCount, true, true);
                        this.stress.SimulationCount.append(option);
                    }

                    this.stress.SimulationCount.val(option.value).trigger('change');
                }

                const listData = [
                    { module: this.stress.Dims.STRESS_POKS, method: null, prop: [{ Id: "IND_TYPE", Value: 1, Type: this.stress.bi.ItDataType.Integer }, { Id: "BLOCK_ID", Value: -1, Type: this.stress.bi.ItDataType.Integer }] },
                    { module: this.stress.Dims.STRESS_POKS, method: null, prop: [{ Id: "IND_TYPE", Value: 2, Type: this.stress.bi.ItDataType.Integer }, { Id: "BLOCK_ID", Value: -1, Type: this.stress.bi.ItDataType.Integer }] },
                    { module: this.stress.Dims.DK_DISTRIBUTION, method: "distributionCombo", prop: [{ Id: "TYPE", Value: 1, Type: this.stress.bi.ItDataType.Integer }] },
                    { module: this.stress.Dims.DK_DISTRIBUTION, method: "distributionCombo", prop: [{ Id: "TYPE", Value: 2, Type: this.stress.bi.ItDataType.Integer }] },
                    { module: this.stress.Dims.DK_MODEL_BLOCK_NSISPRAV, method: null, prop: null },
                    { module: this.stress.Dims.DK_PRODUCTS_NSISPRAV, method: null, prop: null },
                    { module: this.stress.Dims.DK_EKR_NSISPRAV_FLOWKIND, method: null, prop: null },
                    { module: this.stress.Dims.DK_COMPANIES_TABLSPRAV, method: null, prop: null },
                    { module: this.stress.Dims.DK_TRCURR_NSISPRAV, method: null, prop: null },
                    { module: this.stress.Dims.DK_EKR_NSSPRAV_KLASS_LT_ST, method: null, prop: null },
                ];

                const requestData = listData.map(item => this.loadingDataFromList(item.module, item.method, item.prop));
                requestData.push(this.loadingVersionsCombo());

                Promise.all(requestData)
                    .then(([IndicatorInputData, IndicatorOutputData, DistributionData, ModelData, BlocksIndicatorsData,
                        ProductsData, TypeMovementData, CompaniesData, TransactionCurrencyData, LTSTData, VersionsCombo]) => {

                        if (VersionsCombo.e.length > 0) {
                            const data = VersionsCombo.e.map((item) => ({
                                id: item.k,
                                text: item.k + "#;" + item.n
                            }));

                            this.stress.PrognozVersionComboSelected.empty().select2({
                                data: data,
                                templateResult: formatState,
                                templateSelection: formatSelected,
                                width: '200px',
                                dropdownAutoWidth: false,
                                placeholder: '',
                                multiple: true,
                                allowClear: true,
                                maximumSelectionLength: 1,
                                dropdownParent: this.stress.PrognozVersionComboSelected.parent(),
                                language: {
                                    noResults: function () {
                                        return "Ничего не найдено";
                                    },
                                    maximumSelected: function (args) {
                                        if (args.maximum > 1) {
                                            return "Можно выбрать только " + args.maximum + " элемента";
                                        } else {
                                            return "Можно выбрать только 1 элемент";
                                        }
                                    }
                                },
                                adaptDropdownCssClass: function () {
                                    return '';
                                }
                            });

                            if (data && data.length > 0) {
                                const selectId = res.prognozVersion;
                                if (selectId !== null) {
                                    const versItem = data.find(item => Number(item.text.split('#;')[0]) === selectId);
                                    if (versItem !== undefined) {
                                        this.stress.PrognozVersionComboSelected.val([selectId]).trigger('change');
                                        var select2Event = $.Event('select2:select');
                                        select2Event.params = { data: versItem };
                                        this.stress.PrognozVersionComboSelected.trigger(select2Event);
                                    } else {
                                        this.stress.PrognozVersionComboSelected.val([data[0].id]).trigger('change');
                                        var select2Event = $.Event('select2:select');
                                        select2Event.params = { data: data[0] };
                                        this.stress.PrognozVersionComboSelected.trigger(select2Event);
                                    }
                                }
                            }
                            const $parent = this.stress.PrognozVersionComboSelected.closest('.block-parameters__item');
                            if ($parent.find('.dropdown').hasClass('warning__block')) {
                                $parent.find('.dropdown').removeClass('warning__block');
                                $parent.find('.warning__text').remove();
                            }
                        } else {
                            const $parent = this.stress.PrognozVersionComboSelected.closest('.block-parameters__item');
                            if (!$parent.find('.dropdown').hasClass('warning__block')) {
                                $parent.find('.dropdown').addClass('warning__block');
                                $parent.append(`<p class="warning__text">Нет данных</p>`);
                            }
                        }

                        if (IndicatorInputData.length > 0) {
                            this.stress.InputIndicatorEls = IndicatorInputData.map((item) => ({
                                id: item.k,
                                text: item.k + "#;" + item.n
                            }));
                        } else {
                            this.stress.InputIndicatorEls = [];
                        }

                        if (IndicatorOutputData.length > 0) {
                            this.stress.OutputIndicatorEls = IndicatorOutputData.map((item) => ({
                                id: item.k,
                                text: item.k + "#;" + item.n
                            }));
                        } else {
                            this.stress.OutputIndicatorEls = [];
                        }

                        if (DistributionData.length > 0) {
                            this.stress.distributionEls.push({
                                type: 1,
                                data: DistributionData
                            });
                        }

                        if (ModelData.length > 0) {
                            this.stress.distributionEls.push({
                                type: 2,
                                data: ModelData
                            });
                        }

                        if (BlocksIndicatorsData.length > 0) {
                            BlocksIndicatorsData.unshift({ k: "-1", n: 'Все' });
                            this.stress.BlocksIndicatorsEls = BlocksIndicatorsData.map((item) => ({
                                id: item.k,
                                text: item.k + "#;" + item.n
                            }));
                        }

                        if (ProductsData.length > 0) {
                            this.stress.ProductsEls = ProductsData.map((item) => ({
                                id: item.k,
                                text: item.k + "#;" + item.n
                            }));
                            this.initSelect2Field($('.SelectAnalysisContent #analysis__product'), this.stress.ProductsEls);
                        }

                        if (TypeMovementData.length > 0) {
                            this.stress.TypeMovementEls = TypeMovementData.map((item) => ({
                                id: item.k,
                                text: item.k + "#;" + item.n
                            }));
                            this.initSelect2Field($('.SelectAnalysisContent #analysis__movementType'), this.stress.TypeMovementEls);
                        }

                        if (CompaniesData.length > 0) {
                            this.stress.CompaniesEls = CompaniesData.map((item) => ({
                                id: item.k,
                                text: item.k + "#;" + item.n
                            }));
                            this.initSelect2Field($('.SelectAnalysisContent #analysis__company'), this.stress.CompaniesEls);
                        }

                        if (TransactionCurrencyData.length > 0) {
                            this.stress.TransactionCurrencyEls = TransactionCurrencyData.map((item) => ({
                                id: item.k,
                                text: item.k + "#;" + item.n
                            }));
                            this.initSelect2Field($('.SelectAnalysisContent #analysis__trCurrency'), this.stress.TransactionCurrencyEls);
                        }

                        if (LTSTData.length > 0) {
                            this.stress.LTSTDataEls = LTSTData.map((item) => ({
                                id: item.k,
                                text: item.k + "#;" + item.n
                            }));
                            this.initSelect2Field($('.SelectAnalysisContent #analysis__lt_st'), this.stress.LTSTDataEls);
                        }

                        if (res.Input.length > 0) {
                            this.stress.renderInput(res.Input);
                        }
                        if (res.Output.length > 0) {
                            this.stress.renderOutput(res.Output);
                        }

                        hideInitVersionWaiter();
                    })
                    .catch(error => {
                        debugError("Ошибка в одном из запросов:", error);
                        hideInitVersionWaiter();
                    });
            }).catch(err => {
                debugError("initVersion getValidData error:", err);
                hideInitVersionWaiter();
            });
        }).catch(err => {
            debugError("initVersion getResultForeModule error:", err);
            hideInitVersionWaiter();
        });
    }

    loadingDataFromList(module, method, prop) {
        return new Promise((resolve, reject) => {
            const combo = this.stress.openDimCombo(module, method, prop, null, true, (x) => {
                this.resolveWithFiltredDimElements(combo, resolve);
            });
        });
    }

    /**
     * Запрашивает отфильтрованные элементы по combo и передаёт результат в resolve.
     */
    resolveWithFiltredDimElements(combo, resolve) {
        this.stress.bi.getFiltredDimElements({ "key": combo.dim.getOdId().id }).then(data => {
            resolve(data !== undefined ? data : []);
        });
    }

    initSerachDistributionToListPopUp() {
        const $parent = $('.modal-custom__distribution');
        const $input = $parent.find('.search__input');
        $input.on('input', () => {
            this.stress.InputSelectDistribution.serachDistributionToList($input.val());
        });
    }

    initFilterInputIndicator() {
        const $btn = $('[data-rowbtn="filteringInput"]');

        $btn.on('click', (e) => {
            const mode = $(e.currentTarget).attr('mode');
            this.filterInputItems($(e.currentTarget), mode);
        });
    }

    initFilterOutputIndicator() {
        const $btn = $('[data-rowbtn="filteringOutput"]');

        $btn.on('click', (e) => {
            const mode = $(e.currentTarget).attr('mode');
            this.filterOutputItems($(e.currentTarget), mode);
        });
    }
}
