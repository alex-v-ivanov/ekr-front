import {
    formatState,
    formatState2,
    formatSelected,
    formatDate,
    parseDate,
    getYearDiff,
    getYearWord,
    getJsonFromUrl
} from './prognoz-utils.js';
import { PrognozApi } from './prognoz-api.js';
import { DetailsPopUp, HelpPopUp } from './prognoz-details-popup.js';
import { PrognozBlockId } from './prognoz-block-id.js';
import { PrognozBlockParameters } from './prognoz-block-parameters.js';
import { PrognozMacroParameters } from './prognoz-macro-parameters.js';
import { PrognozScenarioIndicators } from './prognoz-scenario-indicators.js';
import { PrognozVersions } from './prognoz-versions.js';
import { PrognozComboInit } from './prognoz-combo-init.js';
import { PrognozParams } from './prognoz-params.js';
import { PrognozDatePickers } from './prognoz-date-pickers.js';
import { PrognozActions } from './prognoz-actions.js';
import { PrognozValidation } from './prognoz-validation.js';
import { PrognozLoading } from './prognoz-loading.js';
import { PrognozMacroCombo } from './prognoz-macro-combo.js';
import { PrognozMessages, PROGNOZ_BYPASS_ACCESS_CHECKS } from './constants.js';
import { ApiStatus } from '../Common/constants.js';

function PrognozReportsClass(deps) {
    var self = this;
    if (deps) {
        self.common = deps.common;
        self.bi = deps.bi;
        self.metabase = deps.metabase;
        self.config = deps.config;
        self.Dims = deps.Dims;
        self.ForeKeys = deps.ForeKeys;
        self.openDimCombo = deps.openDimCombo || (function (a, b, c, d, e, f) { return window.OpenDimCombo && window.OpenDimCombo(a, b, c, d, e, f); });
    } else {
        self.common = typeof window !== "undefined" && window.Common;
        self.bi = typeof window !== "undefined" && window.bi;
        self.metabase = typeof window !== "undefined" && window.Metabase;
        self.config = { Moniker: null, ClientServiceUrl: null, urlPars: null };
        self.Dims = typeof window !== "undefined" && window.Dims;
        self.ForeKeys = typeof window !== "undefined" && window.ForeKeys;
        self.openDimCombo = function (a, b, c, d, e, f) { return window.OpenDimCombo && window.OpenDimCombo(a, b, c, d, e, f); };
    }
    this.prognozApi = new PrognozApi(this.bi, this.ForeKeys);
    this.init = function () {
        debugLog("Reports init");

        try {
            let KapRibbon = window.top.document.getElementsByClassName("KapRibbon");
            if (KapRibbon != undefined && KapRibbon[0]) {
                KapRibbon[0].parentNode.style.display = 'none';
                var rv = window.top.document.getElementsByClassName("kap-RootView")[0];
                if (rv) rv.parentNode.style.inset = "0px";
            }
        } catch (error) {
            debugWarn("hideRibbon:", error);
        }

        if (self.config && self.config.urlPars) {
            self.common.urlPars = self.config.urlPars;
            return;
        }
        let urlPars = this.getJsonFromUrl && this.getJsonFromUrl();
        if (!urlPars && typeof window !== "undefined" && window.getJsonFromUrl) urlPars = window.getJsonFromUrl();
        if (!urlPars) urlPars = {};
        self.common.urlPars = urlPars;
        if (urlPars?.moniker?.length > 0) self.config.Moniker = urlPars.moniker;
        if (urlPars?.urlbi?.length > 0) self.config.ClientServiceUrl = urlPars.urlbi;

        debugLog(urlPars,' - urlPars');
        debugLog("Moniker: " + self.config.Moniker);
        debugLog("ClientServiceUrl: " + self.config.ClientServiceUrl);

        if (self.config.Moniker?.length > 0 && self.metabase) {
            self.metabase.Open({ Moniker: self.config.Moniker, PPServiceUrl: self.config.ClientServiceUrl });
            self.bi.clearCache();
            if (self.common.checkStatusPP) self.common.StatusId = setInterval(function () { self.common.checkStatusPP(); }, 2 * 60 * 1000);
        }
    };
    this.UserId = null;
    this.UserName = null;
    this.UserFullName = null;
    this.Prognoz = {
        //тут прописываем какой вид будет открытт
        // забираем из url 0 - Настройка сценария; 1 - Ограниченная версия|Расширенная версия
        type: 0,
        // тут прописываем какая группа чего может, 0 - Настройка сценария/Расширенная версия; 1 - только Ограниченная версия
        typeUserRoles: [
            { key: 0, name: "АДМИНИСТРАТОРЫ", mode: 0 },
            { key: 1, name: "FAP.СУПЕРПОЛЬЗОВАТЕЛЬМОДЕЛИПРОГНОЗИРОВАНИЯ. ДБНУИФО. ЦИФРОВОЕ КАЗНАЧЕЙСТВО", mode: 0 },
            { key: 2, name: "FAP.АНИЛИЗРЕЗУЛЬТАТОВВЛИЯНИЯСЦЕНАРИЯ. ДБНУИФО. ЦИФРОВОЕ КАЗНАЧЕЙСТВО", mode: 1 },
            { key: 3, name: "FAP.МОДЕЛЬПРмОГНОЗИРОВАНИЯ. ДБНУИФО. ЦИФРОВОЕ КАЗНАЧЕЙСТВО", mode: 1 }],
        dtCloseKFO: null,
        ScenariosPrognozComboSelected: null,
        ScenarioIndicatorsData: [],
        ModelBlockData: [],
        ScenarioUKSelect: null,
        ScenariosDefault: ["RCFF_Базовый", "RCFF_Оптимистичный", "RCFF_Стрессовый"],
        initScenTypeCombo($form){
            const self = Reports;

            self.Prognoz.scenTypeSelected = $form.find('#scenType');

            const option = {
                width : '220px',
                dropdownAutoWidth: false,
                placeholder: '',
                multiple: true,
                allowClear: true,
                maximumSelectionLength: 1,
            }

            self.Prognoz.scenTypeSelected.select2(option);

            self.Prognoz.initSelect2Event(self.Prognoz.scenTypeSelected);


            self.Prognoz.scenTypeSelected.on('select2:select', function(e) {
                if ($(this).val().length >= 1) {
                    const $input = $(this);
                    let selectedValue = $(this).select2('data');
                    const createdFrom = self.Prognoz.CreationFrom?.selectedDates.length > 0 ? self.Prognoz.CreationFrom.selectedDates[0] : null;
                    const createdTo = self.Prognoz.CreationTo?.selectedDates.length > 0 ? self.Prognoz.CreationTo.selectedDates[0] : null;

                    if(createdFrom !== null && createdTo !== null){
                        const createdToLastDay = new Date(createdTo.getFullYear(), createdTo.getMonth() + 1, 0); // 0-й день устанавливает последний день текущего месяца
                        self.Prognoz.filterVersionList(createdFrom, createdToLastDay, selectedValue[0]);
                    }
                    self.Prognoz.searchSelected?.val(null).trigger('change');
                }
            });

            self.Prognoz.loadingScenTypeData();
        },
        initSearch($form){
            const self = Reports;

            self.Prognoz.searchSelected = $form.find('#search');

            const option = {
                width : '220px',
                dropdownAutoWidth: false,
                placeholder: '',
                multiple: true,
                allowClear: true,
                maximumSelectionLength: 1,
            }

            self.Prognoz.searchSelected.select2(option);

            self.Prognoz.initSelect2Event(self.Prognoz.searchSelected);

            
            self.Prognoz.searchSelected.on('select2:select', function(e) {
                if ($(this).val().length >= 1) {
                    let selectedValue = $(this).select2('data');
                    const rowId = selectedValue[0].text.split('#;')[0];
                    const $items = $('.ListRow');

                    // hidden all items
                    $items.each((i,el) =>{
                        const $item = $(el)
                        if(!$item.hasClass("Hidden")){
                            $item.addClass('Hidden');
                        }
                    })

                    const $row = $('.ListRow[row-id="'+ rowId +'"]');
                    
                    if($row.length > 0){
                        $row.removeClass('Hidden');
                    }
                }
            });

            self.Prognoz.searchSelected.on('select2:unselect', function(e) {
                const createdFrom = self.Prognoz.CreationFrom?.selectedDates.length > 0 ? self.Prognoz.CreationFrom.selectedDates[0] : null;
                const createdTo = self.Prognoz.CreationTo?.selectedDates.length > 0 ? self.Prognoz.CreationTo.selectedDates[0] : null;
                const selectedValue = self.Prognoz.scenTypeSelected.select2('data');
                
                if(createdFrom !== null && createdTo !== null && selectedValue.length > 0){
                    const createdToLastDay = new Date(createdTo.getFullYear(), createdTo.getMonth() + 1, 0); // 0-й день устанавливает последний день текущего месяца
                    self.Prognoz.filterVersionList(createdFrom, createdToLastDay, selectedValue[0]);
                }
            });

            self.Prognoz.loadingSearchData();
        },
        initTooltip(){
            const tooltips = document.querySelectorAll('[tooltipe]');

            tooltips.forEach(el =>{
                const text = el.getAttribute('tooltipe');
        
                tippy(el, {
                    content: '<p class="tooltipe__text">' + text + '</p>',
                    animation: 'fade',
                    followCursor: true,
                    arrow: false,
                    allowHTML: true,
                });
            })
        },
        UpdateInterface(type){
            Reports.Prognoz.setTitleType(type)
            const $blockPrognozId = $('section.page__block.block-prognoz-id');
            const $blockParameters = $('.block-parameters[block="parameters"] .block-parameters__body');
            const $blockMacroparameters = $('.block-parameters[block="macroparameters"]');
            const $blockScenarioIndicatorsRCFF = $('.block-parameters[block="scenarioIndicatorsRCFF"]');
            const $blockScenType = $('.block-parameters[block="scenType"]');

            if(type === 2 || type === 1){
                Reports.Prognoz.type = type;
                $blockPrognozId.empty();
                $blockParameters.empty();

                $blockPrognozId.removeClass('Hidden');
                $blockMacroparameters.removeClass('Hidden');
                $blockScenarioIndicatorsRCFF.removeClass('Hidden');
                $('.error__message').remove();
                if(!$blockScenType.hasClass('Hidden')){
                    $blockScenType.addClass('Hidden');
                }
                
                // ------------- заполняем блок прогноз ID -------------
                Reports.Prognoz.renderBlockPrognozid();
                
                // ------------- заполняем блок Параметры -------------
                Reports.Prognoz.renderBlockParameters();
                
                Reports.Prognoz.clearField();
                
                Reports.Prognoz.loadingDPInfo();
            }else if(type === 3){
                Reports.Prognoz.type = type;

                $blockPrognozId.empty();
                $blockParameters.empty();

                $blockPrognozId.addClass('Hidden');
                $blockMacroparameters.addClass('Hidden');
                $blockScenarioIndicatorsRCFF.addClass('Hidden');
                $blockScenType.removeClass('Hidden');

                // ------------- заполняем блок Параметры -------------
                Reports.Prognoz.renderBlockParameters();

                // ------------- заполняем блок Версии прогноза RCFF -------------
                Reports.Prognoz.renderBlockVersionsForecast();

            }
            
        },
        setTitleType(type){
            let title = "";
            let tooltipeMessage = "";

            const $parent = $(".page__block__title");

            $parent.empty();

            if(type === 0){
                title = "Сценарий"
            }else if(type === 1){
                title = "Ограниченная версия"
            }else if(type === 2){
                title = "Расширенная версия"
                tooltipeMessage = "Ограниченная версия";
            }else if(type === 3){
                title = "Управление версиями"
                tooltipeMessage = "Расширенная версия";
            }

            const $html = $(`${type === 2 || type === 3 ?` <svg width="24" height="24" onclick="Reports.Prognoz.UpdateInterface(${type - 1})" style="cursor: pointer;" tooltipe="${tooltipeMessage}" viewBox="0 0 32 32" fill="#004C97" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.7076 25.2925C20.8005 25.3854 20.8742 25.4957 20.9244 25.6171C20.9747 25.7385 21.0006 25.8686 21.0006 26C21.0006 26.1314 20.9747 26.2615 20.9244 26.3829C20.8742 26.5043 20.8005 26.6146 20.7076 26.7075C20.6146 26.8004 20.5043 26.8741 20.383 26.9244C20.2616 26.9747 20.1314 27.0006 20.0001 27.0006C19.8687 27.0006 19.7386 26.9747 19.6172 26.9244C19.4958 26.8741 19.3855 26.8004 19.2926 26.7075L9.29255 16.7075C9.19958 16.6146 9.12582 16.5043 9.07549 16.3829C9.02517 16.2615 8.99927 16.1314 8.99927 16C8.99927 15.8686 9.02517 15.7385 9.07549 15.6171C9.12582 15.4957 9.19958 15.3854 9.29255 15.2925L19.2926 5.29251C19.4802 5.10487 19.7347 4.99945 20.0001 4.99945C20.2654 4.99945 20.5199 5.10487 20.7076 5.29251C20.8952 5.48015 21.0006 5.73464 21.0006 6.00001C21.0006 6.26537 20.8952 6.51987 20.7076 6.70751L11.4138 16L20.7076 25.2925Z" />
                        </svg>`: ''}<h1 class="page__title">${title}</h1>`);

            const $tooltip = $html.filter('svg[tooltipe]');

            if($tooltip.length > 0){
                const text = $tooltip.attr('tooltipe');
                tippy($tooltip[0], {
                    content: '<p class="tooltipe__text">' + text + '</p>',
                    animation: 'fade',
                    followCursor: true,
                    arrow: false,
                    allowHTML: true,
                });
            }

            $parent.append($html);
        },
    };
    this.Prognoz.parseDate = parseDate;
    this.Prognoz.getYearDiff = getYearDiff;
    this.Prognoz.getYearWord = getYearWord;
    this.Prognoz.detailsPopUp = new DetailsPopUp(this.Prognoz);
    this.Prognoz.helpPopUp = new HelpPopUp();
    const prognozBlockParameters = new PrognozBlockParameters(this.Prognoz);
    this.Prognoz.renderBlockParameters = (...args) => prognozBlockParameters.renderBlockParameters(...args);
    const prognozMacroParameters = new PrognozMacroParameters(this.Prognoz);
    this.Prognoz.renderMacroParam = () => prognozMacroParameters.renderMacroParam();
    const prognozMacroCombo = new PrognozMacroCombo(this.Prognoz);
    this.Prognoz.initWellCombo = ($form) => prognozMacroCombo.initWellCombo($form);
    this.Prognoz.initInterestRateCombo = ($form) => prognozMacroCombo.initInterestRateCombo($form);
    this.Prognoz.initInflationRateCombo = ($form) => prognozMacroCombo.initInflationRateCombo($form);
    this.Prognoz.initInflationPropCombo = ($form) => prognozMacroCombo.initInflationPropCombo($form);
    this.Prognoz.initPriceProductCombo = ($form) => prognozMacroCombo.initPriceProductCombo($form);
    const prognozScenarioIndicators = new PrognozScenarioIndicators(this.Prognoz);
    this.Prognoz.renderScenarioIndicators = () => prognozScenarioIndicators.renderScenarioIndicators();
    this.Prognoz.initForecastDefault = () => prognozScenarioIndicators.initForecastDefault();
    this.Prognoz.getSelectedHtmlInfo = (selectedValue) => prognozScenarioIndicators.getSelectedHtmlInfo(selectedValue);
    this.Prognoz.getSelectField = (field) => prognozScenarioIndicators.getSelectField(field);
    const prognozVersions = new PrognozVersions(this.Prognoz);
    this.Prognoz.renderBlockVersionsForecast = () => prognozVersions.renderBlockVersionsForecast();
    this.Prognoz.renderVersions = (a, b) => prognozVersions.renderVersions(a, b);
    this.Prognoz.getTypeScenarioFromName = (name) => prognozVersions.getTypeScenarioFromName(name);
    this.Prognoz.addVersionsBtnEvent = (row) => prognozVersions.addVersionsBtnEvent(row);
    const prognozComboInit = new PrognozComboInit(this.Prognoz);
    this.Prognoz.initSelect2Event = (el) => prognozComboInit.initSelect2Event(el);
    this.Prognoz.initScenarioRCFFCombo = ($form) => prognozComboInit.initScenarioRCFFCombo($form);
    this.Prognoz.initScenarioRCFFIDCombo = ($form) => prognozComboInit.initScenarioRCFFIDCombo($form);
    this.Prognoz.initDefauilSelected = () => prognozComboInit.initDefauilSelected();
    this.Prognoz.initScenarioUKCombo = ($form) => prognozComboInit.initScenarioUKCombo($form);
    this.Prognoz.initVersionRCFFCombo = ($form) => prognozComboInit.initVersionRCFFCombo($form);
    const prognozParams = new PrognozParams(this.Prognoz);
    this.Prognoz.getVersionTemplate = () => prognozParams.getVersionTemplate();
    this.Prognoz.getCurrentUserId = () => prognozParams.getCurrentUserId();
    this.Prognoz.getPrognozParams = () => prognozParams.getPrognozParams();
    this.Prognoz.fillScenarioField = (id) => prognozParams.fillScenarioField(id);
    this.Prognoz.fillFieldFromJSON = (json) => prognozParams.fillFieldFromJSON(json);
    this.Prognoz.fillVersionField = (id) => prognozParams.fillVersionField(id);
    this.Prognoz.loadingVersionJsonById = (id) => prognozParams.loadingVersionJsonById(id);
    this.Prognoz.filterVersionList = (from, to, type) => prognozParams.filterVersionList(from, to, type);
    this.Prognoz.clearField = () => prognozParams.clearField();
    const prognozDatePickers = new PrognozDatePickers(this.Prognoz);
    this.Prognoz.initHorizonDatePicker = () => prognozDatePickers.initHorizonDatePicker();
    this.Prognoz.initCreationDatePicker = () => prognozDatePickers.initCreationDatePicker();
    this.Prognoz.initDepthDatePicker = () => prognozDatePickers.initDepthDatePicker();
    const prognozBlockId = new PrognozBlockId(this.Prognoz);
    this.Prognoz.updateIDInfo = () => prognozBlockId.updateIDInfo();
    this.Prognoz.GetPrognozRCFFIdUserInputValue = () => prognozBlockId.GetPrognozRCFFIdUserInputValue();
    const prognozActions = new PrognozActions(this.Prognoz);
    this.Prognoz.ScenSaveAs = () => prognozActions.ScenSaveAs();
    this.Prognoz.ScenSave = () => prognozActions.ScenSave();
    this.Prognoz.Applay = () => prognozActions.Applay();
    this.Prognoz.Calculate = () => prognozActions.Calculate();
    this.Prognoz.sendRequest = (json, elemName) => prognozActions.sendRequest(json, elemName);
    this.Prognoz.DeleteScenarioRCFF = () => prognozActions.DeleteScenarioRCFF();
    this.Prognoz.renderBlockPrognozid = () => prognozBlockId.renderBlockPrognozid();
    const prognozValidation = new PrognozValidation(this.Prognoz);
    this.Prognoz.checkObjects = (a, b, c, d, e, f) => prognozValidation.checkObjects(a, b, c, d, e, f);
    this.Prognoz.isHorizonCovered = (a, b) => prognozValidation.isHorizonCovered(a, b);
    this.Prognoz.isHorizonOverlapping = (a, b) => prognozValidation.isHorizonOverlapping(a, b);
    this.Prognoz.findOverlappingHorizons = (objs) => prognozValidation.findOverlappingHorizons(objs);
    this.Prognoz.checkRequiredField = () => prognozValidation.checkRequiredField();
    this.Prognoz.checkScenarioRCFF = () => prognozValidation.checkScenarioRCFF();
    this.Prognoz.getDaysInMonth = (year, month) => prognozValidation.getDaysInMonth(year, month);
    const prognozLoading = new PrognozLoading(this.Prognoz);
    this.Prognoz.loadingScenariosPrognozData = () => prognozLoading.loadingScenariosPrognozData();
    this.Prognoz.loadingVersionData = () => prognozLoading.loadingVersionData();
    this.Prognoz.loadingScenarioUKData = () => prognozLoading.loadingScenarioUKData();
    this.Prognoz.loadingScenarioIndicatorsData = () => prognozLoading.loadingScenarioIndicatorsData();
    this.Prognoz.loadingDPInfo = () => prognozLoading.loadingDPInfo();
    this.Prognoz.loadingScenTypeData = () => prognozLoading.loadingScenTypeData();
    this.Prognoz.loadingInflationPropData = () => prognozLoading.loadingInflationPropData();
    this.Prognoz.loadingSearchData = () => prognozLoading.loadingSearchData();
    this.GoToJournal = function(type) { // 1 - Стресс, 2 - Прогноз
        debugLog("GoToJournal");
        const root = window.parent.location.href.split('#')[0];
        window.parent.location.href = root + '#/app/navigator?key=1148290';
    };
    this.formatDate = formatDate;
    this.PrognozConf = async function() {
        debugLog("PrognozConf");
        window.Reports.common.waiter.show("PrognozConf");

        $("#SaveBtn").addClass("Disabled");
        $("#DeleteBtn").addClass("Disabled");

        var self = this;
        var prognoz = self.Prognoz;
        window.Reports.bi.GetMbSec().then(async x => {
            if (!x) {
                window.Reports.common.showDialog(PrognozMessages.USER_INFO_FAILED);
                window.Reports.common.waiter.hideAll();
                return;

            }
            self.UserId = x.meta.profiles.its.it[0].id;
            self.UserName = x.meta.profiles.its.it[0].n;
            self.UserGroups = x.meta.groups.its.it;
            self.typeSuper = false;
            self.typeModel = false;

            window.Reports.prognozApi.getUserFullName(self.UserName).then(x => this.handlePrognozConfGetUserFullName(x, self));

            if (PROGNOZ_BYPASS_ACCESS_CHECKS) {
                self.typeSuper = true;
                self.typeModel = true;
            } else {
                const isSuperUser = self.UserGroups.find(item => item.n.toLowerCase().includes('ms-hq-fap_superusermodelforecastdk_ekr') || item.n.toLowerCase().includes('ms-hq-fap-develop_ekr')); // MS-HQ-FAP_SUPERUSERMODELFORECASTDK_EKR  NPR\\MS-HQ-FAP-DEVELOP_EKR
                if (isSuperUser !== undefined) {
                    self.typeSuper = true;
                }

                const isModelUser = self.UserGroups.find(item => item.n === 'MS-HQ-FAP_MODELFORECASTDK_EKR');
                if (isModelUser !== undefined) {
                    self.typeModel = true;
                }
            }

            if (window.Reports.common.urlPars?.type) {
                prognoz.type = parseInt(window.Reports.common.urlPars.type, 10);
            }

            Reports.Prognoz.setTitleType(prognoz.type);

            // ------------- заполняем блок прогноз ID -------------
            Reports.Prognoz.renderBlockPrognozid();
            
            // ------------- получаем справочник Версия (в нем храняться данные для полей блока 'Макропараметры' и 'Сценарные показатели RCFF') -------------
            const combo = Reports.OpenDimCombo(window.Reports.Dims.DK_VERSION_NSISPRAV, null, null, null, true, (x) => {
                window.Reports.bi.getFiltredDimElements({ "key": combo.dim.getOdId().id }).then(data => this.handlePrognozConfVersionDimData(data, combo, self));
            });

            window.Reports.common.waiter.hide("PrognozConf");

        }).catch(e => {
            window.Reports.common.waiter.hideAll();
            debugLog(e);
        });
    };
    /** Обработчик ответа getUserFullName в PrognozConf. */
    this.handlePrognozConfGetUserFullName = function(x, self) {
        if (x.status === ApiStatus.OK) {
            self.UserFullName = x.message;
        } else {
            window.Reports.common.showDialog(x.message, "Error");
        }
    };
    /** Обработчик данных getFiltredDimElements для справочника Версия в PrognozConf: inputData, renderBlockParameters, loadingDPInfo. */
    this.handlePrognozConfVersionDimData = function(data, combo, self) {
        const Reports = window.Reports;
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
                const verification = item.ea.it.find(item => item.id === "VERIFICATION_STATUS");
                const status = item.ea.it.find(item => item.id === "STATUS");
                return verification !== undefined && status !== undefined && verification['@v'] === "1" && status['@v'] !== "2";
            });
            const result = data.reduce((acc, item) => {
                const inputForm = item.ea.it.find(item => item.id === "INPUT_FORM");
                const groupKey = inputForm !== undefined ? inputForm["@v"] : 0;
                const horizonFromAttr = item.ea.it.find(item => item.id === "DATE_HORIZ_FROM");
                const horizonToAttr = item.ea.it.find(item => item.id === "DATE_HORIZ_TO");
                const DepthFromAttr = item.ea.it.find(item => item.id === "DATE_DEPTH_FROM");
                const DepthToAttr = item.ea.it.find(item => item.id === "DATE_DEPTH_TO");
                const createdAttr = item.ea.it.find(item => item.id === "CREATED_ON");
                const periodicityAttr = item.ea.it.find(item => item.id === "PERIOD_TYPE_MACRO");
                const versionTypeAttr = item.ea.it.find(item => item.id === "VERS_TYPE");
                const author = item.ea.it.find(item => item.id === "CREATED_BY");
                const isManageAttr = item.ea.it.find(item => item.id === "IS_MANAGE");
                const horizonFrom = horizonFromAttr !== undefined ? Reports.Prognoz.parseDate(horizonFromAttr["@v"]) : null;
                const horizonTo = horizonToAttr !== undefined ? Reports.Prognoz.parseDate(horizonToAttr["@v"]) : null;
                const depthFrom = DepthFromAttr !== undefined && DepthFromAttr["@v"] !== '' ? Reports.Prognoz.parseDate(DepthFromAttr["@v"]) : null;
                const depthTo = DepthToAttr !== undefined && DepthToAttr["@v"] !== '' ? Reports.Prognoz.parseDate(DepthToAttr["@v"]) : null;
                const created = createdAttr !== undefined ? Reports.Prognoz.parseDate(createdAttr["@v"]) : null;
                const isManage = isManageAttr !== undefined ? isManageAttr["@v"] : null;
                const extractedData = {
                    id: item.k,
                    name: item.n,
                    horizonFrom, horizonTo, depthFrom, depthTo,
                    horizonVal: Reports.Prognoz.getYearDiff(horizonFrom, horizonTo),
                    periodicity: periodicityAttr !== undefined ? periodicityAttr['@dv']?.match(/\(([^)]+)\)/)?.[1] : null,
                    versionType: versionTypeAttr !== undefined ? versionTypeAttr["@v"] : null,
                    versionTypeName: versionTypeAttr !== undefined ? versionTypeAttr["@dv"].replace(versionTypeAttr["@v"] + "(", '').replace(")", '') : null,
                    created,
                    author: author !== undefined ? author["@v"] : null,
                    isManage,
                };
                if (!acc[groupKey]) acc[groupKey] = [];
                acc[groupKey].push(extractedData);
                return acc;
            }, {});
            Reports.Prognoz.inputData = Object.entries(result).map(([key, value]) => ({
                group: key,
                items: value.sort((a, b) => b.created - a.created)
            }));
        } else {
            Reports.Prognoz.inputData = [];
        }
        Reports.Prognoz.renderBlockParameters();
        Reports.Prognoz.renderMacroParam();
        self.Prognoz.loadingScenarioIndicatorsData();
        self.Prognoz.initTooltip();
        Reports.Prognoz.loadingDPInfo();
        $(document).on('click', '.dropdown svg', function(e) {
            const $select = $(this).siblings('select');
            $select.select2('open');
            e.stopPropagation();
        });
    };
    this.getJsonFromUrl = getJsonFromUrl;
    this.OpenArgs = function (id, value, type) {
        return {
            dt: type,
            id: id,
            n: id,
            k: Number.MAX_SAFE_INTEGER,
            vis: true,
            value: value
        }
    };
    this.OpenDimCombo = function(dimKey, divId, _params, onselectionChange, isMultiSelect, onLoad) {
        return self.openDimCombo(dimKey, divId, _params, onselectionChange, isMultiSelect, onLoad);
    };
}
function run(deps) {
    var Reports = new PrognozReportsClass(deps);
    window.Reports = Reports;
    Reports.init();
    Reports.PrognozConf();
}

export default run;
