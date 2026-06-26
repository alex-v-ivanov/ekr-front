/**
 * Модальные окна Stress: stressIdPopUp, analyticsPopUp и др.
 * Классы получают ссылку на stress для доступа к данным и методам.
 */
import { formatState, formatSelected, initSelect2Event, formatDate, sanitizeDateRangeText, applyFieldDataToRow } from './utils.js';
import { StressValidationMessages } from './constants.js';
import { ApiStatus } from '../Common/constants.js';

export class StressIdPopUp {
    constructor(stress) {
        this.stress = stress;
        this.currentType = null;
        this.confirmed = false;
    }

    openModal(type) {
        const $modal = $(".modal-custom__StressId");
        let text = "";
        let btnText = "";
        if (type === 1) {
            text = "Для данного ID версии стресс-тестирования уже был выполнено стресс-тестирование!";
            btnText = "Перезаписать";
        } else if (type === 2) {
            this.confirmed = false;
            text = "Запустить повторный стресс-тест и перезаписать результат?";
            btnText = "Да";
        }
        this.currentType = type;
        $modal.find('.modal-custom__text').text(text);
        $modal.find('[data-btn="yes"]').text(btnText);
        $('html').animate({ scrollTop: 0 }, 500);
        $modal.toggleClass("Hidden");
    }

    closeModal() {
        this.confirmed = false;
        $(".modal-custom__StressId").toggleClass("Hidden");
    }

    apply() {
        if (this.currentType === 2) {
            if (!this.confirmed) {
                this.confirmed = true;
                $(".modal-custom__StressId .modal-custom__text").text(
                    "Запустить повторный стресс-тест и перезаписать результат?"
                );
            } else {
                this.confirmed = false;
                this.closeModal();
                this.stress.sendTest(2);
            }
        } else {
            this.closeModal();
            this.openModal(2);
        }
    }
}

export class AnalyticsPopUp {
    constructor(stress) {
        this.stress = stress;
    }

    init(id, table) {
        let data = null;
        const self = this.stress;
        if (table === "Input") {
            data = self.inputDataRows.find(el => el.number === id);
        } else if (table === "Output") {
            data = self.OutputDataRows.find(el => el.number === id);
        }
        if (data !== null && data !== undefined) {
            const $modal = $(".modal-custom__analytics");
            if ($modal.hasClass('Hidden')) {
                this.render(data, table);
                this.openModal();
            }
        } else {
            this.stress.common.showDialog(StressValidationMessages.COULD_NOT_FIND_INDICATOR);
        }
    }

    render(data, table) {
        const self = this;
        if (data.analytics !== null && data.analytics !== undefined) {
            const $parent = $('.modal-custom__analytics');
            const $body = $parent.find('.SelectAnalyticsContent');
            const $form = $(`<div class="SelectAnalyticsForm" indicatorBlock="${table}" indicatorId="${data.number}">
                <div class="SelectAnalyticsItem" field="Indicator">
                    <p class="SelectAnalyticsText">Показатель</p>
                    <p class="SelectAnalyticsText">${data.indicatorName}</p>
                </div>
            </div>`);
            Object.keys(data.analytics).forEach(key => {
                $form.append(self.getField(data, key, table));
            });
            const $btn = $(`<div class="Button Primary" style="width: max-content; margin-left: auto;">
                <div class="Text"><div>Сохранить</div></div></div>`);
            $btn.on('click', (e) => {
                const $formEl = $(e.currentTarget).closest('.SelectAnalyticsContent').find('.SelectAnalyticsForm');
                const blockName = $formEl.attr('indicatorBlock');
                const indicatorId = Number($formEl.attr('indicatorId'));
                let rowData = null;
                let $rowEl = null;
                if (blockName === "Input") {
                    rowData = self.stress.inputDataRows.find(el => el.number === indicatorId);
                    $rowEl = $('#input_block_list [row-id="' + indicatorId + '"]');
                } else if (blockName === "Output") {
                    rowData = self.stress.OutputDataRows.find(el => el.number === indicatorId);
                    $rowEl = $('#output_block_list [row-id="' + indicatorId + '"]');
                }
                $formEl.find('[field]:not([field="Indicator"])').each((idx, el) => {
                    const $item = $(el);
                    const fieldName = $item.attr('field');
                    if (rowData.analytics[fieldName] !== undefined) {
                        const selectVal = $item.find('select').select2('data');
                        if (selectVal.length > 0) {
                            rowData.analytics[fieldName] = selectVal[0].text.split('#;')[0];
                        } else {
                            if (blockName === "Input" || (blockName === "Output" && fieldName === "trCurrency")) {
                                rowData.analytics[fieldName] = "-1";
                            } else if (blockName === "Output") {
                                rowData.analytics[fieldName] = "0";
                            } else {
                                rowData.analytics[fieldName] = "-1";
                            }
                        }
                    }
                });
                if ($rowEl !== null) {
                    self.stress.syncProductFieldFromAnalytics($rowEl, rowData.analytics);
                }
                self.stress.checkIndicator(rowData, blockName);
                if (blockName === "Input") {
                    self.stress.updateInputValidDateRange($rowEl, rowData);
                }
                this.closeModal();
            });
            $body.append($form);
            $body.append($btn);
        }
    }

    getField(prop, analyticsName, table) {
        const self = this;
        const analyticsValue = prop.analytics[analyticsName];
        const displayName = this.stress.analyticsDictionary[analyticsName];
        const $field = $(`<div class="SelectAnalyticsItem" field="${analyticsName}">
            <p class="SelectAnalyticsText">${displayName}</p>
            <label class="dropdown" style="width: max-content; margin-left: auto;">
                <select id="analytics__${analyticsName}"></select>
                <svg width="18" height="18" viewBox="0 0 32 32" fill="#004C97" xmlns="http://www.w3.org/2000/svg">
                    <path d="M26.7074 12.7075L16.7074 22.7075C16.6146 22.8005 16.5043 22.8742 16.3829 22.9246C16.2615 22.9749 16.1314 23.0008 15.9999 23.0008C15.8685 23.0008 15.7384 22.9749 15.617 22.9246C15.4956 22.8742 15.3853 22.8005 15.2924 22.7075L5.29245 12.7075C5.1048 12.5199 4.99939 12.2654 4.99939 12C4.99939 11.7346 5.1048 11.4801 5.29245 11.2925C5.48009 11.1049 5.73458 10.9995 5.99995 10.9995C6.26531 10.9995 6.5198 11.1049 6.70745 11.2925L15.9999 20.5863L25.2924 11.2925C25.3854 11.1996 25.4957 11.1259 25.6171 11.0756C25.7384 11.0253 25.8686 10.9995 25.9999 10.9995C26.1313 10.9995 26.2614 11.0253 26.3828 11.0756C26.5042 11.1259 26.6145 11.1996 26.7074 11.2925C26.8004 11.3854 26.8741 11.4957 26.9243 11.6171C26.9746 11.7385 27.0005 11.8686 27.0005 12C27.0005 12.1314 26.9746 12.2615 26.9243 12.3829C26.8741 12.5043 26.8004 12.6146 26.7074 12.7075Z" />
                </svg>
            </label>
        </div>`);
        const $select = $field.find(`#analytics__${analyticsName}`);
        const selectItems = this.getSelectItems(analyticsName);
        $select.select2({
            data: selectItems,
            templateResult: formatState,
            templateSelection: formatSelected,
            width: '120px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
            language: {
                noResults: () => "Ничего не найдено",
                maximumSelected: (args) => args.maximum > 1 ? "Можно выбрать только " + args.maximum + " элемента" : "Можно выбрать только 1 элемент"
            },
            adaptDropdownCssClass: () => '',
            matcher: function (params, data) {
                if ($.trim(params.term) === '') return data;
                const parts = data.text.split(';');
                const valuePart = parts.length > 1 ? parts[1] : parts[0];
                if (valuePart.toUpperCase().indexOf(params.term.toUpperCase()) >= 0) return data;
                return null;
            },
        });
        initSelect2Event($select);
        const valueStr = analyticsValue !== undefined && analyticsValue !== null ? String(analyticsValue) : '';
        if (valueStr !== '') {
            let selecteddistribution = null;
            let posOptions = null;
            $select.find('option').each(function () {
                if ($(this).text().split('#;')[0] === valueStr) {
                    const name = $(this).text().split('#;')[1];
                    posOptions = Number(valueStr);
                    selecteddistribution = { id: Number(valueStr), text: valueStr + "#;" + name };
                    return false;
                }
            });
            if (selecteddistribution !== null) {
                $select.val([posOptions]).trigger('change');
                const select2Event = $.Event('select2:select');
                select2Event.params = { data: selecteddistribution };
                $select.trigger(select2Event);
            }
        }
        return $field;
    }

    openModal() {
        $('html').animate({ scrollTop: 0 }, 500);
        $(".modal-custom__analytics").toggleClass("Hidden");
    }

    closeModal() {
        const $modal = $(".modal-custom__analytics");
        $modal.find('.SelectAnalyticsContent').empty();
        $modal.toggleClass("Hidden");
    }

    getSelectItems(fieldName) {
        const s = this.stress;
        if (fieldName === "product") return s.ProductsEls;
        if (fieldName === "movementType") return s.TypeMovementEls;
        if (fieldName === "company") return s.CompaniesEls;
        if (fieldName === "trCurrency") return s.TransactionCurrencyEls;
        if (fieldName === "lt_st") return s.LTSTDataEls;
        return null;
    }
}

/** Модальное окно «Анализ» — список показателей Input/Output с фильтрами. */
export class AnalysisPopUp {
    constructor(stress) {
        this.stress = stress;
    }

    render(data, table) {
        const self = this.stress;
        if (data.length > 0) {
            const $body = $('.SelectAnalysisBody');
            data.forEach(item => {
                const $row = this.getRowTemplate();
                const $rowNumber = $row.find('[field="Number"] .SelectAnalysisFieldText');
                const $rowIndicator = $row.find('[field="Indicator"] .SelectAnalysisFieldText');
                const $removeBtn = $row.find('[data-rowbtn="removeRow"]');
                $row.attr({ "row-id": item.number, "table": table });
                if (item.ExcelType !== "" && item.ExcelType !== undefined) {
                    let color = "";
                    if (item.ExcelType === 2) {
                        color = "ListRow__yellow";
                        $row.find('[field="Distribution"]').addClass('invisibility');
                    } else if (item.ExcelType === 1) {
                        color = "ListRow__green";
                        $row.find('[field="Distribution"]').removeClass('invisibility');
                    }
                    $row.addClass(color);
                }
                $rowNumber.text(item.number);
                $rowIndicator.text(item.indicatorName);
                if (table === "Input") {
                    const $rowDistribution = $row.find('[field="Distribution"] .SelectAnalysisFieldText');
                    const $rowHistoricalRange = $row.find('[field="HistoricalRange"] .SelectAnalysisFieldText');
                    const $rowAcceptableRange = $row.find('[field="AcceptableRange"] .SelectAnalysisFieldText');
                    $rowDistribution.text(item.distributionName);
                    $rowHistoricalRange.text(item.historicalRangeFrom + ' - ' + item.historicalRangeTo);
                    if (item.validDateFrom !== undefined && item.validDateTo !== undefined) {
                        $rowAcceptableRange.text(sanitizeDateRangeText(String(item.validDateFrom)) + " - " + sanitizeDateRangeText(String(item.validDateTo))).removeClass('error__message');
                    } else {
                        $rowAcceptableRange.addClass('error__message').text("Нет данных");
                    }
                }
                if (item.analytics !== null && item.analytics !== undefined) {
                    const analyticsListsMap = {
                        product: self.ProductsEls,
                        movementType: self.TypeMovementEls,
                        company: self.CompaniesEls,
                        trCurrency: self.TransactionCurrencyEls,
                        lt_st: self.LTSTDataEls
                    };
                    Object.keys(item.analytics).forEach(key => {
                        const $el = $row.find(`[field="${key}"]`);
                        if ($el.length) {
                            const items = analyticsListsMap[key];
                            if (items !== undefined) {
                                applyFieldDataToRow(
                                    { value: item.analytics[key] },
                                    items,
                                    $el,
                                    { textSelector: '.SelectAnalysisFieldText', valueAttr: 'value' }
                                );
                            }
                        }
                    });
                }
                if (item.ExcelName !== undefined && item.ExcelName !== "") {
                    const $fileInfo = $row.find('[data-rowbtn="fileInfo"]');
                    const $fileRemove = $row.find('[data-rowbtn="fileRemove"]');
                    if ($fileInfo[0]._tippy !== undefined) {
                        $fileInfo[0]._tippy.setProps({ content: '<p class="tooltipe__text">' + item.ExcelName + '</p>' });
                    } else {
                        tippy($fileInfo[0], { content: '<p class="tooltipe__text">' + item.ExcelName + '</p>', animation: 'fade', followCursor: true, arrow: false, allowHTML: true });
                    }
                    $fileInfo.removeClass('invisibility');
                    $fileRemove.removeClass('invisibility');
                    $row.find('[field="HistoricalRange"]').addClass('invisibility');
                }
                $removeBtn.on('click', (el) => {
                    this.stress.common.showDialog(StressValidationMessages.CONFIRM_DELETE_INDICATOR, "Exclamation", () => {
                        const $r = $(el.currentTarget).closest('.SelectAnalysisRow');
                        const rowId = $r.attr('row-id');
                        if (rowId !== undefined) {
                            const data = table === "Input" ? self.inputDataRows : self.OutputDataRows;
                            const $table = table === "Input" ? $('#input_block_list') : $('#output_block_list');
                            const $el = $table.find('[row-id="' + rowId + '"]');
                            const index = data.findIndex(it => it.number === Number(rowId));
                            if (index !== -1) data.splice(index, 1);
                            $el.remove();
                            $r.remove();
                        }
                    });
                });
                $body.append($row);
            });
        }
    }

    openModal(table) {
        const self = this.stress;
        const $modal = $(".modal-custom__analysis");
        let data = table === "Input" ? self.inputDataRows : self.OutputDataRows;
        if (table === "Input") {
            $modal.find('[field="Distribution"] , [field="HistoricalRange"] , [field="AcceptableRange"]').removeClass('invisibility');
        } else {
            $modal.find('[field="Distribution"] , [field="HistoricalRange"] , [field="AcceptableRange"]').addClass('invisibility');
        }
        this.render(data, table);
        $('html').animate({ scrollTop: 0 }, 500);
        $modal.toggleClass("Hidden");
    }

    closeModal() {
        const $modal = $(".modal-custom__analysis");
        $modal.find('.SelectAnalysisBody').empty();
        $modal.toggleClass("Hidden");
        this.clearFilter();
    }

    applyFilter() {
        const filters = [];
        $('.SelectAnalysisHeaderRow .SelectAnalysisItem select').each((i, el) => {
            const $select = $(el);
            const id = $select.attr('id');
            if (id) {
                const fieldName = id.replace('analysis__', '');
                const selectedValue = $select.select2('data');
                if (selectedValue.length > 0) {
                    filters.push({ field: fieldName, value: selectedValue[0].text.split('#;')[0] });
                }
            }
        });
        if (filters.length === 0) {
            $('.SelectAnalysisRow').removeClass('Hidden');
            return;
        }
        $('.SelectAnalysisRow').each((i, row) => {
            const $row = $(row);
            let shouldHide = false;
            for (const filter of filters) {
                const fieldValue = $row.find(`[field="${filter.field}"]`).attr('value');
                if (fieldValue !== filter.value && filter.value !== "0") { shouldHide = true; break; }
            }
            $row.toggleClass('Hidden', shouldHide);
        });
    }

    clearFilter() {
        $('.SelectAnalysisHeaderRow .SelectAnalysisItem').each((i, el) => {
            $(el).find('select').val('').trigger('change');
        });
        $('.SelectAnalysisRow').removeClass('Hidden');
    }

    getRowTemplate() {
        return $(`
            <div class="SelectAnalysisRow">
                <div class="SelectAnalysisField" field="Number"><span class="SelectAnalysisFieldText"></span></div>
                <div class="SelectAnalysisField" field="Indicator"><span class="SelectAnalysisFieldText"></span></div>
                <div class="SelectAnalysisField" field="product" value=""><span class="SelectAnalysisFieldText"></span></div>
                <div class="SelectAnalysisField" field="movementType" value=""><span class="SelectAnalysisFieldText"></span></div>
                <div class="SelectAnalysisField" field="company" value=""><span class="SelectAnalysisFieldText"></span></div>
                <div class="SelectAnalysisField" field="trCurrency" value=""><span class="SelectAnalysisFieldText"></span></div>
                <div class="SelectAnalysisField" field="lt_st" value=""><span class="SelectAnalysisFieldText"></span></div>
                <div class="SelectAnalysisField" field="Distribution"><span class="SelectAnalysisFieldText"></span></div>
                <div class="SelectAnalysisField SelectAnalysisField_center" field="HistoricalRange"><span class="SelectAnalysisFieldText"></span></div>
                <div class="SelectAnalysisField SelectAnalysisField_center" field="AcceptableRange"><span class="SelectAnalysisFieldText"></span></div>
                <div class="SelectAnalysisField" style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                    <svg data-rowBtn="fileInfo" class="invisibility" width="24" height="24" tooltipe="файл" fill="#004c97" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M26.2075 15.2925C26.3005 15.3854 26.3742 15.4957 26.4245 15.6171C26.4749 15.7384 26.5008 15.8686 26.5008 16C26.5008 16.1314 26.4749 16.2615 26.4245 16.3829C26.3742 16.5043 26.3005 16.6146 26.2075 16.7075L15.9512 26.9575C14.6382 28.2703 12.8575 29.0078 11.0008 29.0077C9.14406 29.0075 7.36342 28.2699 6.0506 26.9569C4.73778 25.6439 4.00031 23.8632 4.00043 22.0064C4.00054 20.1497 4.73824 18.3691 6.05123 17.0562L18.4587 4.46624C19.3961 3.52787 20.6678 3.00031 21.9942 2.9996C23.3206 2.9989 24.5929 3.52512 25.5312 4.46249C26.4696 5.39987 26.9972 6.67161 26.9979 7.99796C26.9986 9.32432 26.4724 10.5966 25.535 11.535L13.125 24.125C12.5614 24.6886 11.797 25.0052 11 25.0052C10.2029 25.0052 9.43856 24.6886 8.87498 24.125C8.31139 23.5614 7.99477 22.797 7.99477 22C7.99477 21.203 8.31139 20.4386 8.87498 19.875L19.2875 9.29749C19.3787 9.20019 19.4884 9.12211 19.6103 9.06786C19.7321 9.01361 19.8636 8.98428 19.9969 8.9816C20.1303 8.97892 20.2628 9.00293 20.3867 9.05224C20.5106 9.10154 20.6234 9.17513 20.7185 9.26869C20.8136 9.36224 20.8889 9.47386 20.9402 9.59698C20.9915 9.72011 21.0176 9.85224 21.017 9.98561C21.0165 10.119 20.9892 10.2509 20.9369 10.3736C20.8846 10.4963 20.8083 10.6072 20.7125 10.7L10.2987 21.2887C10.2055 21.3812 10.1314 21.4912 10.0806 21.6123C10.0299 21.7335 10.0035 21.8634 10.003 21.9948C10.0025 22.1261 10.0278 22.2563 10.0776 22.3778C10.1274 22.4993 10.2006 22.6099 10.2931 22.7031C10.3856 22.7964 10.4956 22.8705 10.6167 22.9212C10.7378 22.9719 10.8678 22.9983 10.9991 22.9989C11.1305 22.9994 11.2606 22.974 11.3822 22.9242C11.5037 22.8745 11.6142 22.8012 11.7075 22.7087L24.1162 10.125C24.6798 9.56257 24.9969 8.79929 24.9977 8.00309C24.9985 7.20688 24.683 6.44295 24.1206 5.87937C23.5582 5.31578 22.7949 4.9987 21.9987 4.99788C21.2025 4.99706 20.4386 5.31257 19.875 5.87499L7.46998 18.46C7.00526 18.924 6.63648 19.4749 6.3847 20.0814C6.13291 20.6879 6.00305 21.3381 6.00253 21.9948C6.00201 22.6514 6.13083 23.3018 6.38165 23.9087C6.63247 24.5156 7.00037 25.0672 7.46435 25.5319C7.92833 25.9966 8.47929 26.3654 9.08579 26.6171C9.69229 26.8689 10.3424 26.9988 10.9991 26.9993C11.6558 26.9998 12.3062 26.871 12.9131 26.6202C13.52 26.3694 14.0715 26.0015 14.5362 25.5375L24.7937 15.2875C24.9819 15.1008 25.2365 14.9964 25.5016 14.9973C25.7667 14.9983 26.0206 15.1044 26.2075 15.2925Z" /></svg>
                    <svg data-rowbtn="removeRow" fill="#aa1212" style="cursor: pointer;" tooltipe="Удалить показатель" width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M27 6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM24 26H8V8H24V26ZM10 3C10 2.73478 10.1054 2.48043 10.2929 2.29289C10.4804 2.10536 10.7348 2 11 2H21C21.2652 2 21.5196 2.10536 21.7071 2.29289C21.8946 2.48043 22 2.73478 22 3C22 3.26522 21.8946 3.51957 21.7071 3.70711C21.5196 3.89464 21.2652 4 21 4H11C10.7348 4 10.4804 3.89464 10.2929 3.70711C10.1054 3.51957 10 3.26522 10 3Z"></path></svg>
                </div>
            </div>`);
    }
}

/** Модальное окно загрузки Excel-файла. */
export class UploadFilePopUp {
    constructor(stress) {
        this.stress = stress;
        this.InputData = null;
        this.isRemoveFile = null;
        this.uploadInput = null;
    }

    init() {
        const dropFileZone = $(".upload-zone_dragover");
        this.uploadInput = $(".form-upload__input");
        const removeFileButton = $('.removeFile');
        this.isRemoveFile = false;
        $(document).on("dragover drop", function (evt) {
            evt.preventDefault();
            return false;
        });
        removeFileButton.on('click', (e) => {
            e.preventDefault();
            this.removeFile();
        });
        dropFileZone.on("dragenter", function () { $(this).addClass("_active"); });
        dropFileZone.on("dragleave", function () { $(this).removeClass("_active"); });
        dropFileZone.on("drop", (event) => {
            $(event.currentTarget).removeClass("_active");
            const file = event.originalEvent.dataTransfer?.files[0];
            if (file) {
                const bodyZoneEl = $('.upload-zone_dragover');
                bodyZoneEl.append($('<p>', { text: file.name, class: 'file_name', css: { color: "#000000" } }));
                bodyZoneEl.find('.loading__file-Info').css('display', 'none');
                bodyZoneEl.find('.removeFile').addClass('removeFile__active');
                this.uploadInput[0].files = event.originalEvent.dataTransfer.files;
            }
        });
        dropFileZone.on("click", () => {
            if (!this.isRemoveFile) this.uploadInput.trigger('click');
            else this.isRemoveFile = false;
        });
        const popup = this;
        this.uploadInput.on("change", function () {
            const file = this.files?.[0];
            if (file) {
                const bodyZoneEl = $('.upload-zone_dragover');
                bodyZoneEl.append($('<p>', { text: file.name, class: 'file_name', css: { color: "#000000" } }));
                bodyZoneEl.find('.loading__file-Info').css('display', 'none');
                bodyZoneEl.find('.removeFile').addClass('removeFile__active');
                popup.uploadInput[0].files = this.files;
            }
        });
    }

    closeModal() {
        const $modal = $(".modal-custom__UploadFile");
        $modal.find('#ExcelName').removeClass('error').val('');
        $modal.toggleClass("Hidden");
        $modal.find('.upload-zone_dragover').removeClass('upload-zone_dragover__error');
        this.removeFile();
        $modal.find('[data-btn="copy"]').removeClass('Disabled');
    }

    openModal(inputId) {
        this.InputData = this.stress.inputDataRows.find(el => el.number === Number(inputId));
        if (this.InputData !== null) {
            const type = this.InputData.ExcelType !== undefined && this.InputData.ExcelType !== "" ? this.InputData.ExcelType : 1;
            $('[name="parameterTypeFile"][typeid="' + type + '"]').prop('checked', true);
            $('html').animate({ scrollTop: 0 }, 500);
            $(".modal-custom__UploadFile").toggleClass("Hidden");
        }
    }

    removeFile() {
        $('.upload-zone_dragover').removeClass('_active');
        $('.file_name').remove();
        $('.removeFile').removeClass('removeFile__active');
        $('.loading__file-Info').css('display', 'flex');
        $('.form-upload__submit').removeClass('upload-btn-active');
        this.isRemoveFile = true;
        this.InputData = null;
        if (this.uploadInput && this.uploadInput.length) this.uploadInput.val('');
    }

    send() {
        const $parent = $('#uploadForm');
        const $input = $('#ExcelName');
        const s = this.stress;
        if (this.uploadInput[0].files.length > 0 && $input.val() !== "") {
            $parent.find('[data-btn="copy"]').addClass('Disabled');
            let ExcelType = 1;
            const typeEl = $parent.find('[name="parameterTypeFile"]:checked');
            if (typeEl.length > 0) ExcelType = Number(typeEl.attr('typeId'));
            const file = this.uploadInput[0].files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            formData.append("data", file);
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop().toLowerCase();
            try {
                fetch(this.stress.config.ClientServiceUrl + "/PutBin?createNewDoc=1&format=" + fileExtension + "&fileName=" + fileName + "&mon=" + this.stress.config.Moniker + "!" + this.stress.Dims.FOLDER_UPDATE, {
                    method: 'POST',
                    body: formData,
                }).then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.text();
                }).then((xmlText) => {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
                    const content = xmlDoc.querySelector("PutBinResult").textContent.trim();
                    const ExcelID = "OBJ" + content.split("!").pop();
                    const dateFrom = new Date(this.InputData.$historicalRangeFrom.selectedDates[0]);
                    const dateTo = new Date(this.InputData.$historicalRangeTo.selectedDates[0]);
                    const fromDateParam = formatDate(s.DateParamFromEl.selectedDates[0]);
                    const toDateParam = formatDate(s.DateParamToEl.selectedDates[0]);
                    const PrognozVersionComboSelected = s.PrognozVersionComboSelected.select2('data')[0];
                    const PrognozVersionComboSelectedId = PrognozVersionComboSelected.text.split('#;')[0];
                    const IterationCountComboSelected = s.IterationCountComboSelected.select2('data')[0];
                    const SimulationCount = s.SimulationCount.select2('data')[0];
                    const prop = {
                        prognozVersion: Number(PrognozVersionComboSelectedId),
                        indicatorId: this.InputData.indicatorId,
                        IterationCount: IterationCountComboSelected.text,
                        SimulationCount: SimulationCount.text,
                        forecastData: { dateFrom: fromDateParam, dateTo: toDateParam },
                        dateFrom: formatDate(dateFrom),
                        dateTo: formatDate(dateTo),
                        analytics: { product: '-1', movementType: '-1', company: '-1', trCurrency: '-1', lt_st: '-1' },
                        ExcelID,
                        ExcelName: $input.val(),
                        ExcelType,
                    };
                    if (this.InputData.analytics) Object.keys(this.InputData.analytics).forEach(key => { prop.analytics[key] = this.InputData.analytics[key]; });
                    this.stress.common.waiter.show("sendSaveExcel");
                    s.InputSelectDistribution.request(prop, s, "SaveExcelDataSet").then(x => this.handleSaveExcelDataSetResponse(x, $input, ExcelType));
                }).catch(err => {
                    debugError("Ошибка загрузки файла:", err);
                    this.stress.common.showDialog(StressValidationMessages.COULD_NOT_SAVE_EXCEL_DATA);
                    this.closeModal();
                });
            } catch (error) {
                debugError("Ошибка загрузки:", error);
            }
            $parent.find('.upload-zone_dragover').removeClass('upload-zone_dragover__error');
            $input.parent().removeClass('error');
        } else {
            if ($input.val() === "") $input.parent().addClass('error');
            else $parent.find('.upload-zone_dragover').addClass('upload-zone_dragover__error');
        }
    }

    /**
     * Обработчик ответа SaveExcelDataSet: обновление InputData и DOM строки после сохранения файла.
     */
    handleSaveExcelDataSetResponse(x, $input, ExcelType) {
        if (x.faultstring?.length > 0) {
            this.stress.common.showDialog(StressValidationMessages.COULD_NOT_SAVE_EXCEL_DATA);
        } else if (x.status === ApiStatus.OK) {
            const json = JSON.parse(x.message);
            const $rowInput = $('#input_block_list .ListRow[row-id="' + this.InputData.number + '"]');
            $rowInput.removeClass('ListRow__error');
            this.InputData.ExcelGUID = json.ExcelGUID;
            this.InputData.ExcelType = ExcelType;
            this.InputData.ExcelName = $input.val();
            this.InputData.distribution = "";
            this.InputData.distributionId = -1;
            this.InputData.distributionParams = [];
            let color = "";
            if (ExcelType === 2) {
                color = "ListRow__yellow";
                $rowInput.find('[field="Distribution"]').addClass('invisibility');
            } else if (ExcelType === 1) {
                color = "ListRow__green";
                $rowInput.find('[field="Distribution"]').removeClass('invisibility');
            }
            $rowInput.find('[field="HistoricalRange"]').addClass('invisibility').find('.error__message').remove();
            $rowInput.removeClass('ListRow__yellow').removeClass('ListRow__green').addClass(color);
            const $fileInfo = $rowInput.find('[data-rowbtn="fileInfo"]');
            if ($fileInfo[0]._tippy !== undefined) $fileInfo[0]._tippy.setProps({ content: '<p class="tooltipe__text">' + $input.val() + '</p>' });
            else tippy($fileInfo[0], { content: '<p class="tooltipe__text">' + $input.val() + '</p>', animation: 'fade', followCursor: true, arrow: false, allowHTML: true });
            $fileInfo.removeClass('invisibility');
            $rowInput.find('[data-rowbtn="fileRemove"]').removeClass('invisibility');
            this.stress.common.waiter.hide("sendSaveExcel");
        } else {
            this.stress.common.showDialog(x.message);
        }
        this.closeModal();
    }
}

/** Модальное окно выбора массива данных (Excel). */
export class ArrayDataPopUp {
    constructor(stress) {
        this.stress = stress;
        this.$control = null;
        this.InputData = null;
        this.excelData = [];
        this.type = null;
    }

    init() {
        const $parent = $('#select_ArrayData_block');
        this.$control = $parent.find('#ArrayDataSelect');
        this.$control.select2({
            width: '320px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });
        initSelect2Event(this.$control);
        $('[name="parameterTypeFileData"]').on('change', (e) => {
            this.loadingArrayDataByType(Number($(e.currentTarget).attr('typeid')));
        });
    }

    closeModal() {
        $(".modal-custom__ArrayData").toggleClass("Hidden");
        $(".modal-custom__ArrayData .dropdown").removeClass('error');
        $(".modal-custom__ArrayData .error__message").remove();
    }

    openModal(inputId) {
        this.InputData = this.stress.inputDataRows.find(el => el.number === Number(inputId));
        if (this.InputData !== null) {
            const type = this.InputData.ExcelType !== undefined && this.InputData.ExcelType !== "" ? this.InputData.ExcelType : 1;
            $('[name="parameterTypeFileData"][typeid="' + type + '"]').prop('checked', true);
            this.loadingArrayDataByType(type);
            $('html').animate({ scrollTop: 0 }, 500);
            $(".modal-custom__ArrayData").toggleClass("Hidden");
        }
    }

    loadingArrayDataByType(type) {
        if (!this.InputData) return;
        const InputData = this.InputData;
        const s = this.stress;
        const dateFrom = new Date(InputData.$historicalRangeFrom.selectedDates[0]);
        const dateTo = new Date(InputData.$historicalRangeTo.selectedDates[0]);
        const prop = {
            prognozVersion: Number(s.PrognozVersionComboSelected.select2('data')[0].text.split('#;')[0]),
            indicatorId: InputData.indicatorId,
            forecastData: { dateFrom: formatDate(s.DateParamFromEl.selectedDates[0]), dateTo: formatDate(s.DateParamToEl.selectedDates[0]) },
            dateFrom: formatDate(dateFrom),
            dateTo: formatDate(dateTo),
            analytics: { product: '-1', movementType: '-1', company: '-1', trCurrency: '-1', lt_st: '-1' },
            ExcelType: type,
        };
        if (InputData.analytics) Object.keys(InputData.analytics).forEach(key => { prop.analytics[key] = InputData.analytics[key]; });
        this.type = type;
        s.InputSelectDistribution.request(prop, s, "GetExcelDataSets").then(x => this.handleGetExcelDataSetsResponse(x));
    }

    /**
     * Обработчик ответа GetExcelDataSets: заполнение списка и переинициализация select2.
     */
    handleGetExcelDataSetsResponse(x) {
        if (x.faultstring?.length > 0) {
            this.stress.common.showDialog(StressValidationMessages.COULD_NOT_GET_EXCEL_DATA);
        } else if (x.status === "OK") {
            const json = JSON.parse(x.message);
            this.excelData = json;
            this.$control.empty().select2({
                data: json.map((item, index) => ({ id: index, text: index + "#;" + item.ExcelName })),
                templateResult: formatState,
                templateSelection: formatSelected,
                width: '320px',
                dropdownAutoWidth: false,
                placeholder: '',
                multiple: true,
                allowClear: true,
                maximumSelectionLength: 1,
                language: { noResults: () => "Ничего не найдено", maximumSelected: (args) => args.maximum > 1 ? "Можно выбрать только " + args.maximum + " элемента" : "Можно выбрать только 1 элемент" },
                adaptDropdownCssClass: () => '',
                matcher: function (params, data) {
                    if ($.trim(params.term) === '') return data;
                    const parts = data.text.split(';');
                    const valuePart = parts.length > 1 ? parts[1] : parts[0];
                    return valuePart.toUpperCase().indexOf(params.term.toUpperCase()) >= 0 ? data : null;
                },
            });
        }
    }

    selected() {
        const s = this.stress;
        const res = this.$control.select2('data');
        if (res.length > 0) {
            const index = Number(res[0].text.split('#;')[0]);
            if (this.excelData.length > 0) {
                const arrayData = this.excelData[index];
                this.InputData.ExcelName = arrayData.ExcelName;
                this.InputData.ExcelGUID = arrayData.ExcelGUID;
                this.InputData.ExcelType = this.type;
                this.InputData.distribution = "";
                this.InputData.distributionId = -1;
                this.InputData.distributionParams = [];
                const $rowInput = $('#input_block_list .ListRow[row-id="' + this.InputData.number + '"]');
                $rowInput.removeClass('ListRow__error');
                let color = "";
                if (this.type === 2) {
                    color = "ListRow__yellow";
                    $rowInput.find('[field="Distribution"]').addClass('invisibility');
                } else if (this.type === 1) {
                    color = "ListRow__green";
                    $rowInput.find('[field="Distribution"]').removeClass('invisibility');
                }
                $rowInput.find('[field="HistoricalRange"]').addClass('invisibility');
                $rowInput.find('[field="HistoricalRange"] .error__message').remove();
                $rowInput.removeClass('ListRow__yellow').removeClass('ListRow__green').addClass(color);
                const $fileInfo = $rowInput.find('[data-rowbtn="fileInfo"]');
                const $removeFile = $rowInput.find('[data-rowbtn="fileRemove"]');
                if ($fileInfo[0]._tippy !== undefined) $fileInfo[0]._tippy.setProps({ content: '<p class="tooltipe__text">' + arrayData.ExcelName + '</p>' });
                else tippy($fileInfo[0], { content: '<p class="tooltipe__text">' + arrayData.ExcelName + '</p>', animation: 'fade', followCursor: true, arrow: false, allowHTML: true });
                if (this.InputData !== null) s.checkIndicator(this.InputData, "Input");
                $fileInfo.removeClass('invisibility');
                $removeFile.removeClass('invisibility');
            }
            this.closeModal();
        } else {
            const $block = this.$control.closest('.SelectAnalysisItem');
            if (!$block.find('.dropdown').hasClass('error')) {
                $block.find('.dropdown').addClass('error');
                $block.append('<p class="error__message">Не заполнено поле!</p>');
            }
        }
    }
}
