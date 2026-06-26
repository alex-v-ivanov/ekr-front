import {
    formatDate,
    formatState,
    formatSelected,
    getJsonFromUrl,
    getInputTemplate,
    getOutputTemplate,
    GoToPage,
    GoToJournal,
    parseDate,
    initSelect2Event,
    toFixedNoRounding,
    formatDistribution,
    formatState2,
    formatState3,
    formatSelected2,
    matcherTemplate
} from './utils.js';
import { Validator } from './stress-validator.js';
import { StressReport } from './stress-report.js';
import { AddListIndicators } from './stress-add-list.js';
import { StressChart } from './stress-chart.js';
import { InputSelectDistribution } from './stress-input-select-distribution.js';
import { StressIdPopUp, AnalyticsPopUp, AnalysisPopUp, UploadFilePopUp, ArrayDataPopUp } from './stress-popups.js';
import { CustomePopUp } from './stress-custome-popup.js';
import { InputRowsManager } from './stress-input-rows.js';
import { OutputRowsManager } from './stress-output-rows.js';
import { StressUI } from './stress-ui.js';
import { StressApp } from './stress-app.js';
import { StressModes, StressValidationMessages } from './constants.js';

const stressValidator = new Validator();

function StressClass(deps) {
    var self = this;
    this.deps = deps || {};
    this.common = this.deps.common;
    this.bi = this.deps.bi;
    this.openDimCombo = this.deps.openDimCombo;
    this.Dims = this.deps.Dims;
    this.ForeKeys = this.deps.ForeKeys;
    this.config = this.deps.config;
    this.DateParamFromEl = null;
    this.DateParamToEl = null;
    this.PrognozVersionCombo = null;
    this.PrognozVersionComboSelected = null;
    this.IterationCountCombo = null;
    this.IterationCountComboSelected = null;
    this.distributionEls = []; // список распределений
    this.PrognozVersionEls = []; // список версий прогноза
    this.inputDataRows = [];
    this.inputRowsManager = null;
    this.outputRowsManager = null;
    this.OutputDataRows = [];
    this.SimulationCount = null;
    this.streesTestName = null;
    this.BlocksIndicatorsEls = null;
    this.InputIndicatorEls = null;
    this.OutputIndicatorEls = null;
    this.getStressName = function(){
            const stressName = $('#stress_test_name').val()
            this.streesTestName=stressName;
        };
        this.getStressParams = function(mode) {
            let self = this;
            let from = '';
            let to = '';

            if(self.DateParamFromEl.selectedDates.length > 0){
                from = formatDate(self.DateParamFromEl.selectedDates[0]);
            }else{
                self.common.showDialog(StressValidationMessages.PERIOD_VERSION_REQUIRED);
                return {
                    valid: false,
                }
            }

            if(self.DateParamToEl.selectedDates.length > 0){
                to = formatDate(self.DateParamToEl.selectedDates[0]);
            }else{
                self.common.showDialog(StressValidationMessages.PERIOD_VERSION_REQUIRED);
                return {
                    valid: false,
                }
            }

            let isValid = true;
            // Получаем массив выбранных ID 
            const selectedIds = self.PrognozVersionComboSelected.val();
            let rez = {};
            // Если нужно получить первый (и единственный) выбранный ID
            const selectedId = selectedIds ? selectedIds[0] : null;
            if(selectedId !== null){

                if(mode === StressModes.RUN_TEST && self.OutputDataRows.length === 0){
                    self.common.showDialog(StressValidationMessages.OUTPUT_INDICATORS_NOT_FILLED);
                    return {
                        valid: false,
                        data: {},
                    }
                }

                const selectedData = self.PrognozVersionComboSelected.select2('data');
                let PrognozVersionComboId = '';

                const IterationCountComboSelected = self.IterationCountComboSelected.select2('data');
                let IterationCountComboSelectedVal = '';
                
                const SimulationCountComboSelected = self.SimulationCount.select2('data');
                let SimulationCountComboSelectedVal = '';

                if(selectedData.length > 0){
                    PrognozVersionComboId = selectedData[0].text.split('#;')[0];
                }else{
                    self.common.showDialog(StressValidationMessages.PROGNOSIS_VERSION_REQUIRED)
                    return {
                        valid: false,
                    }
                }

                if(IterationCountComboSelected.length > 0){
                    IterationCountComboSelectedVal = IterationCountComboSelected[0].text;
                }else{
                    self.common.showDialog(StressValidationMessages.ITERATION_COUNT_REQUIRED)
                    return {
                        valid: false,
                    }
                }

                if(SimulationCountComboSelected.length > 0){
                    SimulationCountComboSelectedVal = SimulationCountComboSelected[0].text;
                }else{
                    self.common.showDialog(StressValidationMessages.SIMULATION_COUNT_REQUIRED)
                    return {
                        valid: false,
                    }
                }

                rez = {
                    dateFrom: from, //{ type: "default", value: from },
                    dateTo: to, //{ type: "default", value: to },
                    prognozVersion: Number(PrognozVersionComboId),
                    IterationCount: IterationCountComboSelectedVal,
                    SimulationCount: SimulationCountComboSelectedVal,
                    Input: [],
                    Output: [],
                }
                
                self.inputDataRows.forEach(el => {
                    const option = {
                        number: el.number,
                        key: (el.indicatorId != null && el.indicatorId !== '' && !Number.isNaN(el.indicatorId)) ? el.indicatorId : null,
                        name: el.indicatorName !== null ? el.indicatorName : "",
                        distribution: (el.distributionId != null && el.distributionId !== '' && !Number.isNaN(el.distributionId)) ? el.distributionId : -1,
                        distributionId: el.distributionName !== null ? el.distributionName : "",
                        distributionParams: el.distributionParams,
                        dateFrom: el.historicalRangeFrom,
                        dateTo: el.historicalRangeTo,
                        indicatorType: el.indicatorType,
                        analytics: {
                            product: '-1',
                            movementType: '-1',
                            company: '-1',
                            trCurrency: '-1',
                            lt_st: '-1',
                        },
                        status: el.status
                    }

                    // по требованию бекенд должен получать все виды аналитик, если например у показателя в аналитиках только 2 параметра, то значит остальные -1
                    if(el.analytics !== null && el.analytics !== undefined){
                        // Заполняем выбранные поля
                        Object.keys(el.analytics).forEach(key => {
                            option.analytics[key] = el.analytics[key];
                        })
                    }  

                    if(el.ExcelGUID !== undefined && el.ExcelGUID !== ""){
                        option.ExcelGUID = el.ExcelGUID !== undefined ? el.ExcelGUID : "";
                        option.ExcelType = el.ExcelType !== undefined ? el.ExcelType : "";
                        option.ExcelName = el.ExcelName !== undefined ? el.ExcelName : "";
                    }
                    
                    if(mode === StressModes.SAVE){
                        option.validDateFrom = el.validDateFrom;
                        option.validDateTo = el.validDateTo;
                    }
                    rez.Input.push(option);
                });

                self.OutputDataRows.forEach(el => {

                    const option = {
                        number: el.number,
                        key: el.indicatorId,
                        name: el.indicatorName,
                        analytics:  {
                            product: '-1',
                            movementType: '-1',
                            company: '-1',
                            trCurrency: '-1',
                            lt_st: '-1',
                        },
                        status: el.status
                    }

                    // по требованию бекенд должен получать все виды аналитик, если например у показателя в аналитиках только 2 параметра, то значит остальные -1
                    if(el.analytics !== null && el.analytics !== undefined){
                        // Заполняем выбранные поля
                        Object.keys(el.analytics).forEach(key => {
                            option.analytics[key] = el.analytics[key];
                        })
                    }  


                    rez.Output.push(option);
                })

                const resCheck = stressValidator.checkForDuplicates(rez);

                if(resCheck.details.length > 0){
                    self.common.showDialog(resCheck.details.join(self.deps.NEW_LINE));
                    isValid = false;
                }

                // Проверка исторических данных
                const validationResult = stressValidator.validateInputParameters(rez);
                
                if (mode === StressModes.RUN_TEST && !validationResult.isValid) {
                    // Для режима запуска - не допускаем ошибок
                    self.common.showDialog(validationResult.errors.join(self.deps.NEW_LINE));
                    return {
                        valid: false,
                        data: rez,
                    };
                } else if (mode === StressModes.SAVE && !validationResult.isValid) {
                    isValid = true;
                }
                
                // Проверяем использования выбранных показателей в версии прогноза
                if(mode === StressModes.RUN_TEST){
                    const $invalidrow = $('.ListRow.ListRow__error');
                    const $validHistoricalDate = $('[field="HistoricalRange"] .error__message');

                    if($invalidrow.length > 0){
                        isValid = false;
                        self.common.showDialog(StressValidationMessages.INDICATORS_NOT_SUPPORTED)
                    }else if($validHistoricalDate.length > 0){
                        isValid = false;
                        self.common.showDialog(StressValidationMessages.INVALID_HISTORICAL_RANGE)
                    }
                }

            }else{
                self.common.showDialog(StressValidationMessages.COULD_NOT_DETERMINE_PROGNOSIS_VERSION)
            }

            return {
                valid: isValid,
                data: rez,
            }
        };
        this.getVersionsCombo = function(selectId = null) {
            var self = this;
            self.common.waiter.show("STRESS_VERSIONS");

            const from = '01.' + formatDate(self.DateParamFromEl.selectedDates[0]);
            const to = '01.' + formatDate(self.DateParamToEl.selectedDates[0]);

            let _params = [
                { Id: "DATE_IN", Value: from, Type: self.bi.ItDataType.String },
                { Id: "DATE_OUT", Value: to, Type: self.bi.ItDataType.String }
            ];
            
            self.PrognozVersionCombo = self.openDimCombo(self.Dims.STRESS_VERSIONS, "PrognozVersionCombo", _params, null, false, function (x) {
                self.PrognozVersionCombo.dimSrv.getAllElements(self.PrognozVersionCombo.dim, {}, function (sender, args) {
                    self.common.waiter.hide("STRESS_VERSIONS");
                    let els = args.Response.GetDimElementsResult.els;
                    if(els !== ""){
                        const data = els.e.map((item) => ({
                            id: item.k, // преобразуем строку в число
                            text: item.k + "#;"+ item.n
                        }));
    
                        // загружаем полученные данные
    
                        self.PrognozVersionComboSelected.empty().select2({
                            data: data,
                            templateResult: formatState,
                            templateSelection: formatSelected,
                            width : '200px',
                            dropdownAutoWidth: false,
                            placeholder: '',
                            multiple: true,
                            allowClear: true,
                            maximumSelectionLength: 1,
                            dropdownParent: self.PrognozVersionComboSelected.parent(),
                            language: {
                                noResults: function() {
                                    return "Ничего не найдено";
                                },
                                maximumSelected: function (args) {
                                    if(args.maximum > 1){
                                        return "Можно выбрать только " + args.maximum + " элемента";
                                    }else{
                                        return "Можно выбрать только 1 элемент";
                                    }
                                }
                            },
                            adaptDropdownCssClass: function() {
                                return ''; // Отключаем CSS-классы, которые могут добавлять title
                            }
                          });

                        if (data && data.length > 0) {
                            // Устанавливаем ранне выбранную версию прогноза
                            
                            if(selectId !== null){
                                const vers = data.find(item => item.id === selectId);
                                if(vers !== undefined){
                                    self.PrognozVersionComboSelected.val([vers.id]).trigger('change');
                                    
                                    // Затем вручную вызываем событие select2:select
                                    var select2Event = $.Event('select2:select');
                                    select2Event.params = {
                                        data: vers
                                    };
                                    self.PrognozVersionComboSelected.trigger(select2Event);
                                }
                            }else{
                                // устанавливаем первый элемен по умолчанию 
                                self.PrognozVersionComboSelected.val([data[0].id]).trigger('change');

                                // Затем вручную вызываем событие select2:select
                                var select2Event = $.Event('select2:select');
                                select2Event.params = {
                                    data: data[0]
                                };
                                self.PrognozVersionComboSelected.trigger(select2Event);

                            }
                        }
                        const $parent = self.PrognozVersionComboSelected.closest('.block-parameters__item');
                        if($parent.find('.dropdown').hasClass('warning__block')){
                            $parent.find('.dropdown').removeClass('warning__block');
                            $parent.find('.warning__text').remove();
                        }
                    }else{
                        const $parent = self.PrognozVersionComboSelected.closest('.block-parameters__item');
                        if(!$parent.find('.dropdown').hasClass('warning__block')){
                            $parent.find('.dropdown').addClass('warning__block');
                            $parent.append(`<p class="warning__text">Нет данных</p>`);
                        }
                    }
                })
            });
        };
        this.checkForDuplicates = function(data) {
            return stressValidator.checkForDuplicates(data);
        };
        this.validateInputParameters = function(config) {
            return stressValidator.validateInputParameters(config);
        };
        /** 
         * @param {mode} 1 - создать свой stress ID, 2- перезаписать существующий stress ID
         */
        this.sendTest = function(mode) {
            var self = this;
            var error = false
            self.common.waiter.show("StressCheckData");
            const stressParams = self.getStressParams(StressModes.RUN_TEST);

            if(stressParams.valid){
                const objJson = stressParams.data;
                if(self.streesTestName !== ""){
                    objJson.Name = self.streesTestName;
                }

                let json = JSON.stringify(objJson);
                // Получаем массив выбранных ID 
                const selectedIds = self.PrognozVersionComboSelected.val();
                // Если нужно получить первый (и единственный) выбранный ID
                const selectedId = selectedIds ? selectedIds[0] : null;

                if(selectedId !== undefined){
                    

                    
                    self.stressReport.getValidData(objJson, objJson.prognozVersion, self.getUserId ? self.getUserId() : '').then(res => {

                        if (res.status == self.deps.ApiStatus.ERROR || res.faultstring?.length > 0) {
                            res = objJson;
                        }else{
                            res = JSON.parse(res.message);
                        }
                        let message = `Проверка не пройдена.`

                        const $InputList = $('#input_block_list');
                        const $OutputList = $('#output_block');
                        let isError = false;
                        res.Input.forEach(item => {
                            if(item.status === undefined || item.status === -1){
                                isError = true;
                               let $input = $InputList.find('[row-id="'+ item.number +'"]');
                               if($input !== undefined){
                                    $input.addClass('ListRow__error');
                               }
                            }
                        });

                        res.Output.forEach(item => {
                            if(item.status === undefined || item.status === -1){
                                isError = true;
                               let $input = $OutputList.find('[row-id="'+ item.number +'"]');
                               if($input !== undefined){
                                    $input.addClass('ListRow__error');
                               }
                            }
                        });
                        
                        if(isError){
                            self.common.showDialog(message);
                        }else{
                            self.common.waiter.show("RunTest");
                            debugLog("RunTest start");
                            self.stressReport.startModelRisk(json, self.getUserName ? self.getUserName() : '', objJson.prognozVersion).then(x => {
                                if(x && x.status === self.deps.ApiStatus.OK){
                                }else if(x && x.message){
                                    self.common.showDialog(StressValidationMessages.ERROR_PREFIX + x.message);
                                }
                                debugLog("RunTest end");
                                self.common.waiter.hide("RunTest");
                            });
                            self.common.showDialog(StressValidationMessages.STRESS_TEST_SUCCESS);
                        }

                        self.common.waiter.hide("StressCheckData");
                    });

                }
            }
        };
        this.CheckDateParam = function() {
            const self = this;
            let rez = true;

            if(self.DateParamToEl.selectedDates.length === 0 || self.DateParamFromEl.selectedDates.length === 0){
                return false;
            }
            return rez;
        };
        this.RunTest = function() {
            var self = this;
            const $stressId = $('#stress_test_name');

            self.streesTestName = $stressId.val();

            if($stressId.val() !== ""){
            
                const stressId = this.PrognozVersionEls.find(item => {
                    const prognozName = item.text.split('#;')[1];
                    const prognozNameFormated = prognozName.toUpperCase().replace(' ', '');
                    const streesTestName = self.streesTestName.toUpperCase().replace(' ', '');
                    return streesTestName === prognozNameFormated;
                });

                if(stressId !== undefined){
                    self.stressIdPopUp.openModal(1);
                }else{
                    self.sendTest(1);
                }
            }else{
                self.sendTest(1);
            }
            
        },
        this.renderInput = function(data = []) { this.inputRowsManager.renderInput(data); };
        this.initBtnAnalysts = function($btn, res){ // res Object
            let tooltipName = "Нет аналитик";
            let svgColor = "#404040";

            if(res !== null && Object.keys(res).length > 0){

                tooltipName = "Аналитики";
                svgColor = "#004c97";
                $btn.removeClass('disabled');
            }else{
                $btn.addClass('disabled');
            }

            $btn.attr({
                fill: svgColor,
                tooltipe: tooltipName,
            });

            if($btn[0]._tippy !== undefined){
                $btn[0]._tippy.setProps({
                    content: '<p class="tooltipe__text">'+tooltipName +'</p>'
                })
            }else{
                tippy($btn[0], {
                    content: '<p class="tooltipe__text">' + tooltipName + '</p>',
                    animation: 'fade',
                    followCursor: true,
                    arrow: false,
                    allowHTML: true,
                });
            }
            
            $btn.removeClass('invisibility');
        };
        /** Подпись продукта в строке списка: всегда по фактическому значению analytics.product (в т.ч. -1 / 0), без скрытия сентинелей. */
        this.syncProductFieldFromAnalytics = function($parent, analytics){
            const $view = $parent.find('[field="Product"] [mode="view"]');
            const $editor = $parent.find('[field="Product"] [mode="editor"]');
            if (analytics === null || analytics === undefined || analytics.product === undefined) {
                $view.text('');
                $editor.text('');
                return;
            }
            const id = String(analytics.product);
            const product = self.ProductsEls.find(item => item.text.split('#;')[0] === id);
            const label = product !== undefined ? product.text.split('#;')[1] : id;
            $view.text(label);
            $editor.text(label);
        };
        this.addInputBtnEvent = function($input) { this.inputRowsManager.addInputBtnEvent($input); };
        this.checkValidDataFromSelection = function($input, data) { return this.inputRowsManager.checkValidDataFromSelection($input, data); };
        this.chackValidInputOptions = function(input) { return this.inputRowsManager.chackValidInputOptions(input); };
        this.initInputIndicator = function($input, data) { this.inputRowsManager.initInputIndicator($input, data); };
        this.initInputDistribution = function($input, data) { this.inputRowsManager.initInputDistribution($input, data); };
        this.initInputHistoricalRange = function($input, data) { this.inputRowsManager.initInputHistoricalRange($input, data); };
        this.fillHistoricalRange = function(rowId) { this.inputRowsManager.fillHistoricalRange(rowId); };
        this.fillDistributionOptions = function($parent, rowData) { this.inputRowsManager.fillDistributionOptions($parent, rowData); };
        this.checkRangeDate = function($row, rowData) { this.inputRowsManager.checkRangeDate($row, rowData); };
        this.updateInputValidDateRange = function($input, data) { this.inputRowsManager.updateInputValidDateRange($input, data); };
        this.loadingAnalysts = function($input, data, block){
            const self = this;
            return new Promise((resolve) =>{
                if(data.indicatorId !== null){
                    const _params = [
                        { Id: "INDICATOR", Value: data.indicatorId, Type: self.bi.ItDataType.Integer },
                    ];
    
                    const combo = self.openDimCombo(self.Dims.EKR_ANALYTICSPOKAZ_TABLSPRAV, null, _params, null, true, function (x) {
                        self.bi.getFiltredDimElements({ "key": combo.dim.getOdId().id }).then(res => {
                            const $btn = $input.find('[data-rowbtn="analytics"]');
                            
                            // очищаем старые значения 
                            data.analytics = {};
                            if(res !== undefined && res.length > 0){
                                self.fillAnalysts(data, res, block);
                            }

                            self.initBtnAnalysts($btn, data.analytics);
                            self.syncProductFieldFromAnalytics($input, data.analytics);
                            resolve(true);
                        });
                    });
                }
            })
        },
        this.fillAnalysts = function(prop, data, block){
            const self = this;

            data.forEach(item => {
                let value = "-1";
                if(block === "Output"){
                    if([self.analyticsDictionary.product, self.analyticsDictionary.movementType, self.analyticsDictionary.company, self.analyticsDictionary.lt_st].includes(item.n)){
                        value = "0"
                    }
                }
                const propName = Object.keys(self.analyticsDictionary).find(key => self.analyticsDictionary[key] === item.n);
                if(propName !== undefined){
                    prop.analytics[propName] = value; 
                }

            });
            
        },
        this.checkIndicator = function(data, mode){
            const self = this;
            const from = formatDate(self.DateParamFromEl.selectedDates[0]);
            const to = formatDate(self.DateParamToEl.selectedDates[0]);
            
            const IterationCountComboSelected = self.IterationCountComboSelected.select2('data');
            let IterationCountComboSelectedVal = '';
            
            const SimulationCountComboSelected = self.SimulationCount.select2('data');
            let SimulationCountComboSelectedVal = '';
            
            if( self.PrognozVersionComboSelected.select2('data').length > 0 && self.IterationCountComboSelected.select2('data').length && self.SimulationCount.select2('data').length){
                const selectedData = self.PrognozVersionComboSelected.select2('data')[0];
                const PrognozVersionComboId = selectedData.text.split('#;')[0];
                SimulationCountComboSelectedVal = SimulationCountComboSelected[0].text.split('#;')[0];
                IterationCountComboSelectedVal = IterationCountComboSelected[0].text.split('#;')[0];
                debugLog('iteration :' + IterationCountComboSelectedVal )
                const json = {
                    prognozVersion: Number(PrognozVersionComboId),
                    indicatorId: data.indicatorId, 
                    forecastData: {
                        dateFrom: from,
                        dateTo: to,
                    },
                    IterationCount: IterationCountComboSelectedVal,
                    SimulationCount: SimulationCountComboSelectedVal,
                    analytics: {
                        product: '-1',
                        movementType: '-1',
                        company: '-1',
                        trCurrency: '-1',
                        lt_st: '-1',
                    },
                }

                if(data.analytics !== null && data.analytics !== undefined){
                    // Заполняем выбранные поля
                    Object.keys(data.analytics).forEach(key => {
                        json.analytics[key] = data.analytics[key];
                    })
                }
    
                if(mode === StressModes.INPUT){
                    json.dateFrom = data.historicalRangeFrom;
                    json.dateTo = data.historicalRangeTo;
                }else if(mode === StressModes.OUTPUT){
                    json.dateFrom = from;
                    json.dateTo = to;
                }

                if(data.ExcelType !== undefined && data.ExcelType === 2){
                    json.ExcelGUID = data.ExcelGUID;
                    json.ExcelType = data.ExcelType;
                }
                self.common.waiter.show("CheckIndicator");
                let _params = [
                    self.bi.OpenArgs("json", JSON.stringify(json), self.bi.ItDataType.String),
                    self.bi.OpenArgs("userName", self.getUserId ? self.getUserId() : '', self.bi.ItDataType.String),
                    self.bi.OpenArgs("version", PrognozVersionComboId, self.bi.ItDataType.String),
                ];
                
                self.bi.getResultForeModule({
                    "moduleKey": self.ForeKeys.DK_STRESS_1144013, "methodName": "CheckSingleStructure", "args": _params 
                }).then(x => {
                    
                    const { number } = data;
                    const isError = x.status === self.deps.ApiStatus.ERROR;
                    const selectorPrefix = mode === StressModes.INPUT 
                        ? '#input_block' 
                        : '#output_block_list';
                    const $row = $(`${selectorPrefix} .ListRow[row-id="${number}"]`);
                    
                    $row.toggleClass('ListRow__error', isError);

                    if(data.ExcelType !== undefined && data.ExcelType === 2 && isError){
                        self.common.showDialog(x.message)
                    }
                    // 0 - true
                    // -1 - false
                    data.status = isError ? -1 : 0;
                    
                    self.common.waiter.hide("CheckIndicator");
                })
            }else{
                self.common.showDialog(StressValidationMessages.COULD_NOT_DETERMINE_REQUIRED_FIELDS)
            }
        },
        this.getValidInputFromBuffer = function(e) { return this.inputRowsManager.getValidInputFromBuffer(e); };
        this.getOptionsEl = function(data, isViewHidden) { return this.inputRowsManager.getOptionsEl(data, isViewHidden); };
        this.getTypeDistributionByName = function(name) { return this.inputRowsManager.getTypeDistributionByName(name); };
        this.renderOutput = function(data = []) { this.outputRowsManager.renderOutput(data); };
        this.initOutputIndicator = function($input, data) { this.outputRowsManager.initOutputIndicator($input, data); };
        this.addOutputBtnEvent = function($input) { this.outputRowsManager.addOutputBtnEvent($input); };
        this.removeFile = function($input, data){
            const prop = {
                ExcelGUID: data.ExcelGUID
            }

            this.InputSelectDistribution.request(prop, this, "DeleteExcelDataSet").then(x => this.handleDeleteExcelDataSetResponse(x, data, $input));
        };
        this.analyticsDictionary = {
            product : "Продукты",
            movementType : "Вид движения",
            company : "Компания",
            trCurrency : "Валюта транзакций",
            lt_st: "Классификация LT/ST"
        };
        this.customePopUp = null;
        this.analyticsPopUp = null;
        this.analysisPopUp = null;
        this.uploadFilePopUp = null;
        this.arrayDataPopUp = null;
        this.chart = null;
        this.stressIdPopUp = null;
        this.initTooltip = function(){
            return this.stressUI.initTooltip();
        };
        this.filterInputItems = function($btn, mode){
            return this.stressUI.filterInputItems($btn, mode);
        };
        this.filterOutputItems = function($btn, mode){
            return this.stressUI.filterOutputItems($btn, mode);
        };
        this.initSelect2Field = function($el, data){
            return this.stressUI.initSelect2Field($el, data);
        };
        this.initDateParam = function(){
            return this.stressUI.initDateParam();
        };
        this.initPrognozVersionCombo = function(){
            return this.stressUI.initPrognozVersionCombo();
        };
        this.initIterationCountCombo = function(){
            return this.stressUI.initIterationCountCombo();
        };
        this.loadingIterationCountData = function(selectCount = null){
            return this.stressUI.loadingIterationCountData(selectCount);
        };
        this.loadingVersionsCombo = function(){
            return this.stressUI.loadingVersionsCombo();
        };
        this.loadingSaveStressIdByPrognozVersionid = function(prognozId){
            return this.stressUI.loadingSaveStressIdByPrognozVersionid(prognozId);
        };
        this.clearInputList = function(){
            return this.stressUI.clearInputList();
        };
        this.clearOutputList = function(){
            return this.stressUI.clearOutputList();
        };
        this.initSimulationCount = function(){
            return this.stressUI.initSimulationCount();
        };
        this.getValidData = function(json, PrognozVersionComboId){
            return this.stressReport.getValidData(json, PrognozVersionComboId, this.getUserId ? this.getUserId() : '');
        };
        this.initVersion = function(){
            return this.stressUI.initVersion();
        };
        this.loadingDataFromList = function(module, method, prop){
            return this.stressUI.loadingDataFromList(module, method, prop);
        };
        this.initSerachDistributionToListPopUp = function(){
            return this.stressUI.initSerachDistributionToListPopUp();
        };
        this.initFilterInputIndicator = function(){
            return this.stressUI.initFilterInputIndicator();
        };
        this.initFilterOutputIndicator = function(){
            return this.stressUI.initFilterOutputIndicator();
        };
        this.saveTestState = function(){
            var self = this;

            const stressParams = self.getStressParams(StressModes.SAVE);
            if(stressParams.valid){
                self.common.waiter.show("Save Test");
                let json = JSON.stringify(stressParams.data);
                debugLog("SaveTest start");
                // Получаем массив выбранных ID 
                const selectedIds = self.PrognozVersionComboSelected.val();
                // Если нужно получить первый (и единственный) выбранный ID
                const selectedId = selectedIds ? selectedIds[0] : null;
                if(selectedId !== null){
                    const selectedData = self.PrognozVersionComboSelected.select2('data')[0];
                    const PrognozVersionComboId = selectedData.text.split('#;')[0];
        
                    this.stressReport.saveUserStructure(json, self.getUserId ? self.getUserId() : '', PrognozVersionComboId).then(x => this.handleSaveUserStructureResponse(x));
                }
            }
        };
        /**
         * Обработчик ответа DeleteExcelDataSet: обновление данных строки и скрытие кнопок файла.
         */
        this.handleDeleteExcelDataSetResponse = function(x, data, $input) {
            if (x.faultstring?.length > 0) {
                self.common.showDialog(StressValidationMessages.COULD_NOT_GET_DELETE_EXCEL_DATA);
            } else {
                if (x.status === self.deps.ApiStatus.OK) {
                    delete data.ExcelGUID;
                    delete data.ExcelType;
                    $input.find('[data-rowbtn="fileInfo"]').addClass('invisibility');
                    $input.find('[data-rowbtn="fileRemove"]').addClass('invisibility');
                    $input.find('[field="HistoricalRange"]').removeClass('invisibility');
                    $input.find('[field="Distribution"]').removeClass('invisibility');
                    $input.removeClass('ListRow__yellow').removeClass('ListRow__green');
                } else {
                    self.common.showDialog(StressValidationMessages.COULD_NOT_DELETE_FILE);
                }
            }
        };
        /**
         * Обработчик ответа saveUserStructure: сообщения и скрытие waiter.
         */
        this.handleSaveUserStructureResponse = function(x) {
            if (x == self.deps.ApiStatus.OK_LOWER) {
                self.common.showDialog(StressValidationMessages.TEST_SUCCESS);
            } else if (x && x.faultstring?.length > 0) {
                self.common.showDialog(x.faultstring, "Error");
            } else if (x == self.deps.ApiStatus.ERROR_LOWER) {
                self.common.showDialog(StressValidationMessages.RUNTIME_ERROR);
            }
            self.common.showDialog(StressValidationMessages.CONFIG_SAVED);
            debugLog("SaveTest end");
            self.common.waiter.hide("Save Test");
        };
}
export default function initStress(deps) {
    var Stress = new StressClass(deps);
    Stress.stressReport = new StressReport(deps.bi, deps.ForeKeys);

    Stress.inputRowsManager = new InputRowsManager(Stress);
    Stress.addNewInput = function () { this.inputRowsManager.addNewInput(); };
    Stress.outputRowsManager = new OutputRowsManager(Stress);
    Stress.addNewOutput = function () { this.outputRowsManager.addNewOutput(); };
    Stress.chart = new StressChart(Stress);
    Stress.InputSelectDistribution = new InputSelectDistribution(Stress);
    Stress.stressIdPopUp = new StressIdPopUp(Stress);
    Stress.analyticsPopUp = new AnalyticsPopUp(Stress);
    Stress.analysisPopUp = new AnalysisPopUp(Stress);
    Stress.uploadFilePopUp = new UploadFilePopUp(Stress);
    Stress.arrayDataPopUp = new ArrayDataPopUp(Stress);
    Stress.customePopUp = new CustomePopUp(Stress);
    Stress.addListIndicators = new AddListIndicators(Stress, () => (Stress.getUserId && Stress.getUserId()));
    Stress.stressUI = new StressUI(Stress);

    var app = new StressApp(Stress);
    Stress.getUserId = function () { return app.userId; };
    Stress.getUserName = function () { return app.userName; };
    window.Reports = {
        getMoniker: function () {},
        init: function () { app.run(); },
        getUserId: function () { return app.userId; },
        getUserName: function () { return app.userName; },
        Stress: Stress
    };
    // Для onclick в StressConf.html: «Формы ввода», «Отчет о финансовых рисках», «Журнал»
    window.GoToPage = GoToPage;
    window.GoToJournal = GoToJournal;
    if (document.readyState !== "loading") {
        app.run();
    } else {
        document.addEventListener("DOMContentLoaded", function () { app.run(); });
    }
}  