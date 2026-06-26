/**
 * Модальное окно выбора распределения / модели (таблица, запросы, график).
 * Использует: stress.chart, stress.customePopUp, stress.inputDataRows, stress.distributionEls и др.
 */
import { formatDate, toFixedNoRounding } from './utils.js';
import { StressValidationMessages } from './constants.js';
import { ApiStatus } from '../Common/constants.js';

export class InputSelectDistribution {
    constructor(stress) {
        this.stress = stress;
        this.table = $('.modal-custom__distribution .Grid');
        this.tableBody = $('#SelectDistributionGrid tbody');
        this.distributionObj = {
            results: [],
            unable_to_fit: [],
        };
    }

    init() {
        $('input[name="parameterType"]').on('change', () => {
            this.changeType();
        });
    }

    request(json, self, methodName) {
        const selectedIds = self.PrognozVersionComboSelected.val();
        const selectedId = selectedIds ? selectedIds[0] : null;
        if (selectedId !== null) {
            const selectedData = self.PrognozVersionComboSelected.select2('data')[0];
            const PrognozVersionComboId = selectedData.text.split('#;')[0];
            const _params = [
                this.stress.bi.OpenArgs("json", JSON.stringify(json), this.stress.bi.ItDataType.String),
                this.stress.bi.OpenArgs("userName", this.stress.getUserId ? this.stress.getUserId() : '', this.stress.bi.ItDataType.String),
                this.stress.bi.OpenArgs("version", PrognozVersionComboId, this.stress.bi.ItDataType.String),
            ];
            return this.stress.bi.getResultForeModule({
                "moduleKey": this.stress.ForeKeys.DK_STRESS_1144013, "methodName": methodName, "args": _params
            });
        }
    }

    renderRow(item, idx, status) {
        let NormalBlock = "";
        let colorText = "black";
        if (status === "unable_to_fit") {
            colorText = "red";
        } else if (status === "fit") {
            colorText = "green";
        }
        if (item.params !== null) {
            Object.keys(item.params).forEach((el) => {
                NormalBlock += `<div style="display:flex; gap: 1rem;">
                    <p style="margin: 0;" class="text-${colorText}-600">${el}</p>
                    <p style="margin: 0;" class="text-${colorText}-600 distribution__text" title="${item.params[el]}">${toFixedNoRounding(item.params[el], 3)}</p>
                </div>`;
            });
        }
        const AIC = toFixedNoRounding(item.info_criteria["AIC"], 3);
        const HQIC = toFixedNoRounding(item.info_criteria["HQIC"], 3);
        const LR = toFixedNoRounding(item.info_criteria["LR"], 3);
        const SIC = toFixedNoRounding(item.info_criteria["SIC"], 3);

        const $row = $(`<tr id="sdRow_${idx}" distributionid="${item['key']}" Distribution="${item['dist_type']}" ${item.getParamFromRequest === true ? "needUpdate" : ""}> 
            <td style=" width: 3rem; "><input type="radio" name="propRadio" ${idx === 0 && status !== "unable_to_fit" ? "checked" : ""} class="${status === "unable_to_fit" ? "hidden" : ""} " /></td>
            <td style=" width: 3rem; "><input type="checkbox" name="${item['dist_type']}" class="${status === "unable_to_fit" ? "hidden" : ""}" /></td>
            <td field="name" class="text-${colorText}-600" ${item.error !== undefined ? `style="display: flex; align-items: center; gap: 0.5rem; "` : ``} >${item['dist_type']}${item.error !== undefined ? 
                `<svg width="18" height="18" tooltipe="${item.error}" viewBox="0 0 32 32" fill="#e7000b" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.5 22.5C17.5 22.7967 17.412 23.0867 17.2472 23.3334C17.0824 23.58 16.8481 23.7723 16.574 23.8858C16.2999 23.9993 15.9983 24.0291 15.7074 23.9712C15.4164 23.9133 15.1491 23.7704 14.9393 23.5607C14.7296 23.3509 14.5867 23.0836 14.5288 22.7926C14.471 22.5017 14.5007 22.2001 14.6142 21.926C14.7277 21.6519 14.92 21.4176 15.1667 21.2528C15.4133 21.088 15.7033 21 16 21C16.3978 21 16.7794 21.158 17.0607 21.4393C17.342 21.7206 17.5 22.1022 17.5 22.5ZM16 9C13.2425 9 11 11.0188 11 13.5V14C11 14.2652 11.1054 14.5196 11.2929 14.7071C11.4804 14.8946 11.7348 15 12 15C12.2652 15 12.5196 14.8946 12.7071 14.7071C12.8946 14.5196 13 14.2652 13 14V13.5C13 12.125 14.3463 11 16 11C17.6538 11 19 12.125 19 13.5C19 14.875 17.6538 16 16 16C15.7348 16 15.4804 16.1054 15.2929 16.2929C15.1054 16.4804 15 16.7348 15 17V18C15 18.2652 15.1054 18.5196 15.2929 18.7071C15.4804 18.8946 15.7348 19 16 19C16.2652 19 16.5196 18.8946 16.7071 18.7071C16.8946 18.5196 17 18.2652 17 18V17.91C19.28 17.4913 21 15.6725 21 13.5C21 11.0188 18.7575 9 16 9ZM29 16C29 18.5712 28.2376 21.0846 26.8091 23.2224C25.3807 25.3603 23.3503 27.0265 20.9749 28.0104C18.5995 28.9944 15.9856 29.2518 13.4638 28.7502C10.9421 28.2486 8.6257 27.0105 6.80762 25.1924C4.98953 23.3743 3.75141 21.0579 3.2498 18.5362C2.74819 16.0144 3.00563 13.4006 3.98957 11.0251C4.97351 8.64968 6.63975 6.61935 8.77759 5.1909C10.9154 3.76244 13.4288 3 16 3C19.4467 3.00364 22.7512 4.37445 25.1884 6.81163C27.6256 9.24882 28.9964 12.5533 29 16ZM27 16C27 13.8244 26.3549 11.6977 25.1462 9.88873C23.9375 8.07979 22.2195 6.66989 20.2095 5.83733C18.1995 5.00476 15.9878 4.78692 13.854 5.21136C11.7202 5.6358 9.76021 6.68345 8.22183 8.22183C6.68345 9.7602 5.63581 11.7202 5.21137 13.854C4.78693 15.9878 5.00477 18.1995 5.83733 20.2095C6.66989 22.2195 8.07979 23.9375 9.88873 25.1462C11.6977 26.3549 13.8244 27 16 27C18.9164 26.9967 21.7123 25.8367 23.7745 23.7745C25.8367 21.7123 26.9967 18.9164 27 16Z" />
                </svg>` : ""}</td>
            <td field="SIC" class="text-${colorText}-600" ><p class="distribution__text" title="${item.info_criteria["SIC"]}">${SIC}</p></td>
            <td field="AIC" class="text-${colorText}-600" ><p class="distribution__text" title="${item.info_criteria["AIC"]}">${AIC}</p></td>
            <td field="HQIC" class="text-${colorText}-600" ><p class="distribution__text" title="${item.info_criteria["HQIC"]}">${HQIC}</p></td>
            <td field="LR" class="text-${colorText}-600" ><p class="distribution__text" title="${item.info_criteria["LR"]}">${LR}</p></td>
            <td field="params">${NormalBlock}</td>
            <td>
                <div style="width: 3rem;height: 100%;text-align: center;vertical-align: middle;display: flex;justify-content: center;">
                    <svg class="removeRow" fill="#aa1212" style="cursor: pointer;" tooltipe="Удалить распределение" width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M27 6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM24 26H8V8H24V26ZM10 3C10 2.73478 10.1054 2.48043 10.2929 2.29289C10.4804 2.10536 10.7348 2 11 2H21C21.2652 2 21.5196 2.10536 21.7071 2.29289C21.8946 2.48043 22 2.73478 22 3C22 3.26522 21.8946 3.51957 21.7071 3.70711C21.5196 3.89464 21.2652 4 21 4H11C10.7348 4 10.4804 3.89464 10.2929 3.70711C10.1054 3.51957 10 3.26522 10 3Z" />
                    </svg>
                </div>
            </td>
        </tr>`);

        this.tableBody.append($row);
        const $tooltipes = $row.find('[tooltipe]');
        $tooltipes.each((index, element) => {
            const el = $(element);
            const text = el.attr('tooltipe');
            tippy(element, {
                content: '<p class="tooltipe__text">' + text + '</p>',
                animation: 'fade',
                followCursor: true,
                arrow: false,
                allowHTML: true,
            });
        });

        $row.find('.removeRow').on('click', (el) => {
            const $parent = $(el.currentTarget).closest('[Distribution]');
            const name = $parent.attr('Distribution');
            const self = this;
            const index = self.distributionObj.results.findIndex(item => item.dist_type === name);
            if (status === "new") {
                if (index !== -1) {
                    self.distributionObj.results.splice(index, 1);
                    $parent.remove();
                }
            } else if (status === "fit") {
                this.stress.common.showDialog(StressValidationMessages.CONFIRM_DELETE_CALC_INDICATOR, "Exclamation", () => {
                    const el = self.distributionObj.results.find(item => item.dist_type === name);
                    const res = self.removeDistribution(el.key);
                    if (res !== null) {
                        res.then(x => this.handleRemoveDistributionResponse(x, "fit", name, index, null, $parent));
                    }
                });
            } else if (status === "unable_to_fit") {
                const el = self.distributionObj.unable_to_fit.find(item => item.dist_type === name);
                const res = self.removeDistribution(el.key);
                if (res !== null) {
                    res.then(x => this.handleRemoveDistributionResponse(x, "unable_to_fit", name, null, null, $parent));
                }
            }
        });

        $row.find('input[type="checkbox"]').on('change', (el) => {
            const $input = $(el.currentTarget);
            const $parent = $input.closest('[distribution]');
            const name = $input.attr('name');
            const value = this.distributionObj.results.find(item => item.dist_type === name);
            if ($input.is(':checked')) {
                const seriesColor = this.stress.chart.addSeries(name, value, this.distributionObj.bin_centers);
                if (seriesColor !== null) {
                    $parent.css('background', seriesColor + '33');
                }
            } else {
                this.stress.chart.removeSeries(name);
                $parent.css('background', 'transparent');
            }
        });
    }

    loadingData(indicatorType) {
        const $row = $('#input_block .ListRow[isactive="true"]');
        const rowId = $row.attr('row-id');
        const self = this.stress;
        const indicatorData = this.stress.inputDataRows.find(item => item.number === Number(rowId));
        if (indicatorData !== undefined) {
            const tableBody = $('.modal-custom__distribution .Grid');
            tableBody.prepend(`<div class="waiter"></div>`);

            const dateFrom = new Date(indicatorData.$historicalRangeFrom.selectedDates[0]);
            const dateTo = new Date(indicatorData.$historicalRangeTo.selectedDates[0]);
            const formatedHistoricalDateFrom = formatDate(dateFrom);
            const formatedHistoricalDateTo = formatDate(dateTo);
            const fromDateParam = formatDate(self.DateParamFromEl.selectedDates[0]);
            const toDateParam = formatDate(self.DateParamToEl.selectedDates[0]);
            const PrognozVersionComboSelected = self.PrognozVersionComboSelected.select2('data')[0];
            const PrognozVersionComboSelectedId = PrognozVersionComboSelected.text.split('#;')[0];
            indicatorData.indicatorType = Number(indicatorType);
            const prop = {
                prognozVersion: Number(PrognozVersionComboSelectedId),
                indicatorId: indicatorData.indicatorId,
                indicatorType: indicatorType,
                forecastData: { dateFrom: fromDateParam, dateTo: toDateParam },
                dateFrom: formatedHistoricalDateFrom,
                dateTo: formatedHistoricalDateTo,
                analytics: { product: '-1', movementType: '-1', company: '-1', trCurrency: '-1', lt_st: '-1' },
            };
            if (indicatorData.analytics !== null && indicatorData.analytics !== undefined) {
                Object.keys(indicatorData.analytics).forEach(key => {
                    prop.analytics[key] = indicatorData.analytics[key];
                });
            }
            if (indicatorData.ExcelGUID !== undefined && indicatorData.ExcelGUID !== "") {
                prop.ExcelGUID = indicatorData.ExcelGUID;
                prop.ExcelType = indicatorData.ExcelType;
            }

            this.request(prop, self, "GetDistributionData").then(x => this.handleGetDistributionDataResponse(x, indicatorData, indicatorType));
        }
    }

    /**
     * Обработчик ответа GetDistributionData: разбор данных, заполнение таблицы распределений, обновление графика.
     */
    handleGetDistributionDataResponse(x, indicatorData, indicatorType) {
        if (x.faultstring?.length > 0) {
            this.stress.common.showDialog(StressValidationMessages.COULD_NOT_GET_DISTRIBUTION_DATA);
        } else {
            if (x.status === ApiStatus.OK) {
                this.tableBody.empty();
                this.distributionObj = JSON.parse(x.message);
                const data = [];
                this.distributionObj.results.forEach(el => {
                    el.status = "fit";
                    data.push(el);
                });
                this.distributionObj.unable_to_fit.forEach(el => {
                    data.push({
                        "key": el.key,
                        "dist_type": el.dist_type,
                        "info_criteria": { "AIC": "x", "HQIC": "x", "LR": "x", "SIC": "x" },
                        "params": {},
                        "status": "unable_to_fit",
                        "error": el.error,
                    });
                });
                data.sort((a, b) => b.info_criteria.LR - a.info_criteria.LR);
                if (indicatorData.distributionName !== "" && indicatorData.distributionName !== null) {
                    const selectedIndex = data.findIndex(item => item.dist_type.toLowerCase() === indicatorData.distributionName.toLowerCase());
                    if (selectedIndex !== -1) {
                        const selectedItem = data.splice(selectedIndex, 1)[0];
                        data.unshift(selectedItem);
                    }
                }
                data.forEach((el, index) => {
                    this.renderRow(el, index, el.status);
                });
                const $btnChoose = $('.SelectDistributionContent [data-btn="chooseDistribution"]');
                if (indicatorType === 1) {
                    $btnChoose.find('.Text').text('Выбрать распределение');
                } else {
                    $btnChoose.find('.Text').text('Выбрать модель');
                }
                this.stress.chart.loadingData(indicatorType);
            } else {
                this.stress.common.showDialog(StressValidationMessages.ERROR_COLON + x.message);
            }
        }
        const waiter = $('.modal-custom__distribution .Grid .waiter');
        waiter.remove();
    }

    clearList() {
        this.stress.common.showDialog(StressValidationMessages.CONFIRM_DELETE_ALL_RECORDS, "Exclamation", () => {
            const $body = $('#SelectDistributionGrid tbody');
            const self = this.stress;
            this.distributionObj.results.forEach(item => {
                this.removeDistribution(item.key);
            });
            this.distributionObj.results = [];
            this.distributionObj.unable_to_fit.forEach(item => {
                this.removeDistribution(item.key);
            });
            this.distributionObj.unable_to_fit = [];
            const option = this.stress.chart.canvas.getOption();
            option.series = option.series.filter(item => item.name === "Факт" || item.name === "Исторические данные");
            option.legend[0].data = option.legend[0].data.filter(item => item.name === "Факт" || item.name === "Исторические данные");
            this.stress.chart.canvas.setOption(option, true);
            $body.empty();
        });
    }

    toggleModal() {
        const $modal = $(".modal-custom__distribution");
        const $tbody = $modal.find('tbody');
        const $items = $tbody.find('tr');
        $modal.toggleClass("Hidden");
        $('html').animate({ scrollTop: 0 }, 500);
        if ($items.length > 0) {
            $tbody.empty();
            this.distributionObj.results = [];
            const option = this.stress.chart.canvas.getOption();
            option.legend[0].data = [];
            option.series = [];
            option.xAxis[0].data = [];
            this.stress.chart.canvas.setOption(option, true);
            const $activeRow = $('.block-parameters__body .ListRow[isactive="true"]');
            $activeRow.attr('isActive', 'false');
        }
    }

    addAllDistributionToList() {
        this.stress.common.showDialog(StressValidationMessages.CONFIRM_ADD_ALL_INDICATORS, "Exclamation", () => {
            if (this.stress.distributionEls.length > 0) {
                const dateFormat = this.distributionObj.results.map(item => ({ name: item.dist_type }));
                this.distributionObj.unable_to_fit.forEach(item => {
                    dateFormat.push({ name: item.dist_type });
                });
                const indicatorTypeEl = $('[name="parameterType"]:checked');
                let indicatorType = 1;
                if (indicatorTypeEl.length > 0) {
                    indicatorType = Number(indicatorTypeEl.attr('typeId'));
                }
                const filterData = this.stress.distributionEls.find(item => item.type === indicatorType);
                const selectableParameters = filterData.data.filter(item => item.ea.it["6"]["@v"] === "1");
                const unselected = this.stress.customePopUp.getUnselectedItems(selectableParameters, dateFormat);
                unselected.forEach((el, index) => {
                    const item = {
                        "key": el.k,
                        "dist_type": el.n,
                        "info_criteria": { "AIC": "-", "HQIC": "-", "LR": "-", "SIC": "-" },
                        "params": { "p": 1 },
                        "getParamFromRequest": true,
                    };
                    this.distributionObj.results.push(item);
                    this.renderRow(item, index, "new");
                });
            } else {
                this.stress.common.showDialog(StressValidationMessages.DISTRIBUTION_LIST_EMPTY);
            }
        });
    }

    addDistributionToList() {
        const $btn = $('#addDistributionToList');
        const selected = [];
        $('#SelectDistributionGrid tbody tr').each((index, el) => {
            const $row = $(el);
            const id = Number($row.attr('distributionid'));
            const text = $row.find('td[field="name"]').text();
            selected.push({ id, name: text.trim() });
        });
        this.stress.customePopUp.init($btn, this.stress.distributionEls, selected, "addNewDistribution", $('.SelectDistributionContent .FrameLeft .Frame12'));
    }

    serachDistributionToList(val) {
        const $btn = $('#serachDistributionToList');
        let selected = [];
        $('#SelectDistributionGrid tbody tr').each((index, el) => {
            const $row = $(el);
            const text = $row.find('td[field="name"]').text();
            selected.push({ name: text });
        });
        selected = selected.filter(el => el.name.toLowerCase().includes(val.toLowerCase()));
        this.stress.customePopUp.init($btn, this.distributionObj, selected, "searchDistribution", $('.SelectDistributionContent .FrameLeft .Frame12'));
    }

    chooseDistribution() {
        const $activeRow = $('.modal-custom__distribution input[name="propRadio"]:checked');
        if ($activeRow.length > 0) {
            const $parent = $activeRow.closest('tr');
            const name = $parent.attr('Distribution');
            this.updateSelectInputIndicator(name);
        } else {
            this.stress.common.showDialog(StressValidationMessages.PARAM_NOT_SELECTED);
        }
    }

    updateSelectInputIndicator(name) {
        const self = this.stress;
        const distributions = this.distributionObj;
        if (distributions.results.length > 0) {
            const selectDistribution = distributions.results.find(el => el.dist_type === name);
            const $activeRow = $('.block-parameters__body .ListRow[isactive="true"]');
            if ($activeRow.length > 0) {
                const activeRowId = Number($activeRow.attr('row-id'));
                const rowData = this.stress.inputDataRows.find(el => el.number === Number(activeRowId));
                if (rowData !== undefined) {
                    const $RowOptions = $activeRow.find('[field="Options"]');
                    const $RowDistribution = $activeRow.find('[field="Distribution"]');
                    if ($RowOptions.length > 0) {
                        $RowOptions.empty();
                        if (selectDistribution.params !== null) {
                            const formattedDate = Object.keys(selectDistribution.params).map(el => ({
                                name: el,
                                value: selectDistribution.params[el] !== null ? selectDistribution.params[el].toString() : selectDistribution.params[el],
                            }));
                            const $optionEl = this.stress.getOptionsEl(formattedDate, false);
                            $RowOptions.append($optionEl);
                            rowData.distributionParams = formattedDate;
                            rowData.getParamFromRequest = false;
                        } else {
                            rowData.distributionParams = [];
                        }
                    }
                    if ($RowDistribution.length > 0) {
                        const combinedData = self.distributionEls.flatMap(item => item.data);
                        const selDistribution = combinedData.find(f => f.n === name);
                        if (selDistribution) {
                            $RowDistribution.find('[mode="view"]').text(selDistribution.n);
                            const $distribution = $RowDistribution.find('[mode="editor"] .distribution');
                            const options = $distribution.find('option');
                            const kStr = String(selDistribution.k);
                            const textVal = selDistribution.k + "#;" + selDistribution.n;
                            let selecteddistribution = null;
                            let posOptions = null;
                            options.each(function () {
                                const optText = $(this).text();
                                const idPart = optText.split('#;')[0];
                                if (idPart !== undefined && (String(idPart) === kStr || (Number(idPart).toString() === idPart && Number(selDistribution.k).toString() === kStr))) {
                                    posOptions = idPart;
                                    selecteddistribution = { id: String(idPart), text: textVal };
                                    return false;
                                }
                            });
                            if (selecteddistribution === null) {
                                posOptions = kStr;
                                selecteddistribution = { id: kStr, text: textVal };
                            }
                            $distribution.val([String(posOptions)]).trigger('change');
                            const select2Event = $.Event('select2:select');
                            select2Event.params = { data: selecteddistribution };
                            $distribution.trigger(select2Event);
                            const kVal = selDistribution.k;
                            rowData.distributionId = (typeof kVal === 'number' && !Number.isNaN(kVal)) || (String(kVal) !== '' && Number(kVal).toString() === String(kVal)) ? Number(kVal) : kVal;
                            rowData.distributionName = selDistribution.n;
                        }
                    }
                    const $RowSchedule = $activeRow.find('[field="Schedule"] img');
                    if ($RowSchedule.length > 0) {
                        $RowSchedule.attr('src', 'img/distribution/' + selectDistribution.dist_type + '.svg').removeAttr('width').removeAttr('height');
                        $RowSchedule.removeClass('invisibility');
                    }
                } else {
                    this.stress.common.showDialog(StressValidationMessages.COULD_NOT_SET_INDICATOR);
                }
                this.toggleModal();
            } else {
                this.stress.common.showDialog(StressValidationMessages.COULD_NOT_FIND_SELECTED_INDICATOR);
            }
        } else {
            this.stress.common.showDialog(StressValidationMessages.COULD_NOT_FIND_SELECTED_INDICATOR);
            this.toggleModal();
        }
    }

    checkDistribution() {
        const $row = $('#input_block .ListRow[isactive="true"]');
        const rowId = $row.attr('row-id');
        const self = this.stress;
        const indicatorData = this.stress.inputDataRows.find(item => item.number === Number(rowId));
        if (indicatorData !== undefined) {
            const tableBody = $('.modal-custom__distribution .Grid');
            tableBody.prepend(`<div class="waiter"></div>`);
            let needCalculate = this.distributionObj.results.map(el => el.getParamFromRequest === true ? el.dist_type : null);
            needCalculate = needCalculate.filter(el => el != null);
            const dateFrom = new Date(indicatorData.$historicalRangeFrom.selectedDates[0]);
            const dateTo = new Date(indicatorData.$historicalRangeTo.selectedDates[0]);
            const formatedHistoricalDateFrom = formatDate(dateFrom);
            const formatedHistoricalDateTo = formatDate(dateTo);
            const fromDateParam = formatDate(self.DateParamFromEl.selectedDates[0]);
            const toDateParam = formatDate(self.DateParamToEl.selectedDates[0]);
            const indicatorTypeEl = $('[name="parameterType"]:checked');
            let indicatorType = 1;
            if (indicatorTypeEl.length > 0) indicatorType = Number(indicatorTypeEl.attr('typeId'));
            indicatorData.indicatorType = Number(indicatorType);
            const PrognozVersionComboSelected = this.stress.PrognozVersionComboSelected.select2('data')[0];
            const PrognozVersionComboSelectedId = PrognozVersionComboSelected.text.split('#;')[0];
            const prop = {
                prognozVersion: Number(PrognozVersionComboSelectedId),
                indicatorId: indicatorData.indicatorId,
                indicatorType: indicatorType,
                forecastData: { dateFrom: fromDateParam, dateTo: toDateParam },
                dateFrom: formatedHistoricalDateFrom,
                dateTo: formatedHistoricalDateTo,
                analytics: { product: '-1', movementType: '-1', company: '-1', trCurrency: '-1', lt_st: '-1' },
                dist_type: needCalculate,
            };
            if (indicatorData.analytics !== null && indicatorData.analytics !== undefined) {
                Object.keys(indicatorData.analytics).forEach(key => { prop.analytics[key] = indicatorData.analytics[key]; });
            }
            if (indicatorData.ExcelGUID !== undefined && indicatorData.ExcelGUID !== "") {
                prop.ExcelGUID = indicatorData.ExcelGUID;
                prop.ExcelType = indicatorData.ExcelType;
            }
            this.request(prop, self, "ChoiceDistribution").then(x => this.handleChoiceDistributionResponse(x));
        } else {
            this.stress.common.showDialog(StressValidationMessages.SOMETHING_WENT_WRONG);
        }
    }

    /**
     * Обработчик ответа ChoiceDistribution: обновление критериев и параметров распределений в таблице.
     */
    handleChoiceDistributionResponse(x) {
        if (x.faultstring?.length > 0) {
            this.stress.common.showDialog(StressValidationMessages.COULD_NOT_GET_CHOICE_DISTRIBUTION);
        } else {
            if (x.message !== "") {
                try {
                    const updateDate = JSON.parse(x.message);
                    this.distributionObj.bin_centers = updateDate.bin_centers;
                    this.distributionObj.bin_heights = updateDate.bin_heights;
                    updateDate.results.forEach(item => {
                        const res = this.distributionObj.results.find(el => el.dist_type === item.dist_type);
                        if (res !== undefined) {
                            res.info_criteria["AIC"] = item.info_criteria["AIC"];
                            res.info_criteria["HQIC"] = item.info_criteria["HQIC"];
                            res.info_criteria["LR"] = item.info_criteria["LR"];
                            res.info_criteria["SIC"] = item.info_criteria["SIC"];
                            res.params = item.params;
                            res.points = item.points;
                        }
                    });
                    this.distributionObj.unable_to_fit = updateDate.unable_to_fit;
                    this.updateRow();
                    $('.modal-custom__distribution .Grid .waiter').remove();
                } catch (er) {
                    this.stress.common.showDialog(x.message);
                }
            } else {
                this.stress.common.showDialog(StressValidationMessages.DATA_NOT_FOUND);
            }
        }
    }

    removeDistribution(key) {
        const $row = $('#input_block .ListRow[isactive="true"]');
        let Indicatorkey = $row.find('[field="Indicator"]').attr('id');
        if (Indicatorkey !== "") {
            const self = this.stress;
            Indicatorkey = Number(Indicatorkey);
            return this.request({ key }, self, "DeleteDistribution");
        }
        return null;
    }

    /**
     * Обработчик ответа DeleteDistribution при удалении строки из таблицы распределений.
     * @param {*} x - ответ сервера
     * @param {string} status - "fit" | "unable_to_fit"
     * @param {string} name - имя распределения (dist_type)
     * @param {number|null} resultIndex - индекс в results (только для status === "fit")
     * @param {*} _unused - не используется
     * @param {jQuery} $parent - строка таблицы для удаления
     */
    handleRemoveDistributionResponse(x, status, name, resultIndex, _unused, $parent) {
        if (x.status !== ApiStatus.OK) {
            this.stress.common.showDialog(x.message);
            return;
        }
        let removed = false;
        if (status === "fit" && resultIndex !== -1 && resultIndex !== null) {
            this.distributionObj.results.splice(resultIndex, 1);
            removed = true;
        } else if (status === "unable_to_fit") {
            const idx = this.distributionObj.unable_to_fit.findIndex(item => item.dist_type === name);
            if (idx !== -1) {
                this.distributionObj.unable_to_fit.splice(idx, 1);
                removed = true;
            }
        }
        if (removed) {
            $parent.remove();
        }
    }

    updateRow() {
        const $parent = $('#SelectDistributionGrid');
        this.distributionObj.results.forEach(item => {
            const $row = $parent.find('[distribution="' + item.dist_type + '"][needUpdate]');
            if ($row.length > 0) {
                const failedCalculate = this.distributionObj.unable_to_fit.find(el => el.dist_type === item.dist_type);
                if (failedCalculate === undefined) {
                    Object.keys(item.info_criteria).forEach(el => {
                        const $field = $row.find('[field="' + el + '"]');
                        if ($field.length > 0) {
                            $field.removeClass().addClass('text-green-600').text(toFixedNoRounding(item.info_criteria[el], 3)).attr('title', item.info_criteria[el]);
                        }
                    });
                    const $propField = $row.find('[field="params"]');
                    if ($propField.length > 0) {
                        let NormalBlock = "";
                        Object.keys(item.params).forEach(prop => {
                            NormalBlock += `<div style="display:flex; gap: 1rem;">
                                <p style="margin: 0;">${prop}</p>
                                <p style="margin: 0;" title="${item.params[prop]}">${toFixedNoRounding(item.params[prop], 3)}</p>
                            </div>`;
                        });
                        $propField.empty();
                        $propField.append(NormalBlock);
                    }
                } else {
                    $row.find('[name="propRadio"]').removeAttr('checked').addClass('hidden');
                    $row.find('[type="checkbox"]').addClass('hidden');
                    $row.find('[field="name"]').removeClass().addClass('text-red-600');
                    $row.find('[field="AIC"]').removeClass().addClass('text-red-600').text('x');
                    $row.find('[field="HQIC"]').removeClass().addClass('text-red-600').text('x');
                    $row.find('[field="LR"]').removeClass().addClass('text-red-600').text('x');
                    $row.find('[field="SIC"]').removeClass().addClass('text-red-600').text('x');
                    $row.find('[field="params"]').empty();
                }
                $row.removeAttr('needUpdate');
            }
        });
        const indicatorTypeEl = $('[name="parameterType"]:checked');
        let indicatorType = 1;
        if (indicatorTypeEl.length > 0) indicatorType = Number(indicatorTypeEl.attr('typeId'));
        this.stress.chart.loadingData(indicatorType);
    }

    changeType() {
        const tbody = $("#SelectDistributionGrid tbody");
        tbody.empty();
        this.stress.chart.clear();
        const indicatorTypeEl = $('[name="parameterType"]:checked');
        let indicatorType = 1;
        if (indicatorTypeEl.length > 0) indicatorType = Number(indicatorTypeEl.attr('typeId'));
        this.loadingData(indicatorType);
        const $btnChoose = $('.SelectDistributionContent [data-btn="chooseDistribution"]');
        if (indicatorType === 1) {
            $btnChoose.find('.Text').text('Выбрать распределение');
        } else {
            $btnChoose.find('.Text').text('Выбрать модель');
        }
    }
}
