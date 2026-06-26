/**
 * Управление строками ввода (Input): номера строк, добавление новой строки,
 * renderInput, initInput*, fill*, check*, get*, addInputBtnEvent.
 */
import {
    formatState,
    formatSelected,
    formatDistribution,
    initSelect2Event,
    getInputTemplate,
    matcherTemplate,
    formatDate,
    parseDate,
    toFixedNoRounding,
    OpenDimCombo,
    sanitizeDateRangeText,
    applyFieldDataToRow
} from './utils.js';
import { StressValidationMessages } from './constants.js';
import { ApiStatus } from '../Common/constants.js';

/* global Dims, bi, ForeKeys, Common */

export class InputRowsManager {
    constructor(stress) {
        this.stress = stress;
    }

    getNumberRow(data) {
        if (!data || data.length === 0) {
            return 1;
        }
        const hasNumberProperty = data.some(obj => obj.hasOwnProperty('number'));
        if (!hasNumberProperty) {
            return 1;
        }
        const numbers = data
            .filter(obj => obj.hasOwnProperty('number') && typeof obj.number === 'number')
            .map(obj => obj.number);
        return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    }

    addNewInput() {
        const self = this.stress;
        const version = self.PrognozVersionComboSelected.select2('data');
        const IterationCountComboSelected = self.IterationCountComboSelected.select2('data');
        const SimulationCount = self.SimulationCount.select2('data');
        if (version.length > 0 && IterationCountComboSelected.length > 0 && SimulationCount.length > 0) {
            this.renderInput([null]);
        } else {
            this.stress.common.showDialog(StressValidationMessages.FILL_REQUIRED_FIELDS);
        }
    }

    renderInput(data = []) {
        const self = this.stress;
        const $list = $(".ListContent");
        if (data == undefined || data.Input?.length == 0) {
            self.inputDataRows = [];
            $list.remove();
            return;
        }

        if (data.length > 0 && data[0] === null) {
            const $block = $('.listBlockInput');
            const $ItemsBlock = $('#input_block_list');

            $block.animate({
                scrollTop: $ItemsBlock.height()
            }, 500);
        }

        data.forEach(item => {

            const number = this.getNumberRow(self.inputDataRows);

            let rowObj = {
                number: number,
                indicatorId: null,
                indicatorName: null,
                distributionId: null,
                distributionName: null,
                distributionParams: [],
                historicalRangeFrom: null,
                historicalRangeTo: null,
                getParamFromRequest: true,
                indicatorType: 1,
                analytics: null,
                mode: null,
            };


            const $input = getInputTemplate();
            if (item !== null) {
                rowObj.indicatorId = item.key;
                rowObj.indicatorName = item.name;
                rowObj.distributionId = item.distribution;
                rowObj.distributionName = item.distributionId;
                rowObj.distributionParams = item.distributionParams;
                rowObj.validDateFrom = item.validDateFrom;
                rowObj.validDateTo = item.validDateTo;
                rowObj.status = item.status;
                rowObj.historicalRangeFrom = item.dateFrom;
                rowObj.historicalRangeTo = item.dateTo;
                rowObj.analytics = item.analytics;
                rowObj.ExcelGUID = item.ExcelGUID !== undefined ? item.ExcelGUID : "";
                rowObj.ExcelType = item.ExcelType !== undefined ? item.ExcelType : "";
                rowObj.ExcelName = item.ExcelName !== undefined ? item.ExcelName : "";
                rowObj.indicatorType = item.indicatorType !== undefined ? item.indicatorType : 1;
                rowObj.getParamFromRequest = false;
                $input.find('[mode="view"]').removeClass('hidden');
                $input.find('[mode="editor"]').addClass('hidden');
            }

            self.inputDataRows.push(rowObj);

            $input.attr('row-id', rowObj.number);
            $input.find('[field="Number"] .RowItemName').text(rowObj.number);


            if (rowObj.analytics !== null) {
                applyFieldDataToRow(
                    rowObj.analytics.product !== undefined ? { value: rowObj.analytics.product } : undefined,
                    self.ProductsEls,
                    $input,
                    { textSelector: '[field="Product"] .RowItemName' }
                );
            }
            const $analyticBtn = $input.find('[data-rowBtn="analytics"]');
            this.stress.initBtnAnalysts($analyticBtn, rowObj.analytics);

            this.initInputIndicator($input, rowObj);

            this.initInputDistribution($input, rowObj);

            if (rowObj.distributionName) {
                var $img = $input.find('[field="Schedule"] img');
                if ($img.length) {
                    $img.attr('src', 'img/distribution/' + String(rowObj.distributionName) + '.svg').removeAttr('width').removeAttr('height');
                    $img.removeClass('invisibility');
                }
            }

            $input.removeClass('ListRow__green').removeClass('ListRow__yellow');

            if (rowObj.status !== undefined) {
                $input.toggleClass('ListRow__error', rowObj.status === 0 ? false : true);
            } else {
                this.stress.checkIndicator(rowObj, "Input");
            }

            if (rowObj.ExcelGUID !== "" && rowObj.ExcelGUID !== undefined) {
                let color = "";
                if (rowObj.ExcelType === 2) {
                    color = "ListRow__yellow";
                    $input.find('[field="Distribution"]').addClass('invisibility');
                } else if (rowObj.ExcelType === 1) {
                    color = "ListRow__green";
                    $input.find('[field="Distribution"]').removeClass('invisibility');

                }
                $input.addClass(color);
                const $fileInfo = $input.find('[data-rowbtn="fileInfo"]');
                const $fileRemove = $input.find('[data-rowbtn="fileRemove"]');

                if (rowObj.ExcelName !== undefined && rowObj.ExcelName !== "") {
                    $fileInfo.attr('tooltipe', rowObj.ExcelName);
                }
                $fileInfo.removeClass('invisibility');
                $fileRemove.removeClass('invisibility');
                $input.find('[field="HistoricalRange"]').addClass('invisibility');
            }

            const $AcceptableRangeView = $input.find('[field="AcceptableRange"] [mode="view"]');
            const $AcceptableRangeEditor = $input.find('[field="AcceptableRange"] [mode="editor"]');

            if (rowObj.validDateFrom !== undefined && rowObj.validDateTo !== undefined) {

                const value = sanitizeDateRangeText(String(rowObj.validDateFrom)) + ' - ' + sanitizeDateRangeText(String(rowObj.validDateTo));
                $AcceptableRangeView.text(value);
                $AcceptableRangeEditor.text(value);
                this.stress.checkRangeDate($input, rowObj);
            } else {
                this.stress.updateInputValidDateRange($input, rowObj);
            }

            const $HistoricalRangeFrom = $input.find('[field="HistoricalRange"] .datepicker [input="dateFrom"]');
            const $HistoricalRangeTo = $input.find('[field="HistoricalRange"] .datepicker [input="dateTo"]');
            $HistoricalRangeFrom.attr('id', 'dateFrom__' + rowObj.number);
            $HistoricalRangeTo.attr('id', 'dateTo__' + rowObj.number);


            this.addInputBtnEvent($input);

            const $tooltipes = $input.find('[tooltipe]');

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
            })

            $list.append($input);

            this.initInputHistoricalRange($input, rowObj);

        });
    }

    addInputBtnEvent($input) {

        const $removeBtn = $input.find('[data-rowbtn="removeRow"]');
        const $save = $input.find('[data-rowbtn="save"]');
        const $editeRow = $input.find('[data-rowbtn="editeRow"]');
        const $analytics = $input.find('[data-rowbtn="analytics"]');
        const $data = $input.find('[data-rowbtn="data"]');
        const $loadingFile = $input.find('[data-rowbtn="loadingFile"]');
        const $selection = $input.find('[data-rowBtn="selection"]');
        const $filteringIndicator = $input.find('[data-rowBtn="filteringIndicator"]');
        const $filteringDistribution = $input.find('[data-rowBtn="filteringDistribution"]');
        const $removeFile = $input.find('[data-rowBtn="fileRemove"]');

        $removeBtn.on('click', (e) => {

            this.stress.common.showDialog(StressValidationMessages.CONFIRM_DELETE_INDICATOR, "Exclamation", () => {

                const $btn = $(e.currentTarget);
                const $parent = $btn.closest('.ListRow');
                const rowId = $parent.attr('row-id');
                this.stress.inputDataRows = this.stress.inputDataRows.filter(el => el.number !== Number(rowId));
                $parent.remove();
            })
        });

        $save.on('click', (e) => {
            const $btn = $(e.currentTarget);
            const $parent = $btn.closest('.ListRow');
            const rowId = $parent.attr('row-id');

            const input = this.stress.inputDataRows.find(el => el.number === Number(rowId));
            if (input !== undefined) {

                const isValid = this.chackValidInputOptions(input);
                if (isValid) {
                    $parent.find('[mode="view"]').removeClass('hidden');
                    $parent.find('[mode="editor"]').addClass('hidden');
                } else {
                    this.stress.common.showDialog(StressValidationMessages.VALUES_PROBABILITIES_MISMATCH)
                }
            }
        });

        $editeRow.on('click', (e) => {
            const $btn = $(e.currentTarget);
            const $parent = $btn.closest('.ListRow');
            $parent.find('[mode="view"]').addClass('hidden');
            $parent.find('[mode="editor"]').removeClass('hidden');
        });

        $analytics.on('click', (e) => {
            const $btn = $(e.currentTarget);
            if (!$btn.hasClass('disabled')) {
                const $parent = $btn.closest('.ListRow');
                const id = $parent.attr('row-id');
                this.stress.analyticsPopUp.init(Number(id), "Input");
            }
        });

        $data.on('click', (e) => {
            const $btn = $(e.currentTarget);
            const $parent = $btn.closest('.ListRow');
            const id = $parent.attr('row-id');
            this.stress.arrayDataPopUp.openModal(id);
        });

        $loadingFile.on('click', (e) => {
            const $btn = $(e.currentTarget);
            const $parent = $btn.closest('.ListRow');
            const id = $parent.attr('row-id');
            this.stress.uploadFilePopUp.openModal(id);
        });

        $selection.on('click', (e) => {
            const $btn = $(e.currentTarget);
            const $parent = $btn.closest('.ListRow');
            $parent.attr('isActive', 'true');

            const rowId = $parent.attr('row-id');
            const indicatorData = this.stress.inputDataRows.find(item => item.number === Number(rowId));


            const isApprove = this.checkValidDataFromSelection($parent, indicatorData);

            let indicatorType = Number($btn.attr('type'));
            indicatorData.indicatorType = Number(indicatorType);
            $('[name="parameterType"][typeid="' + indicatorType + '"]').prop('checked', true);

            if (isApprove) {

                this.stress.InputSelectDistribution.loadingData(indicatorType);
                this.stress.InputSelectDistribution.toggleModal();
            } else {
                const historicalErrors = $parent.find('[field="HistoricalRange"] .error__message');

                if (indicatorData.ExcelType !== 2 || indicatorData.ExcelType === undefined) {

                    if (indicatorData.indicatorId === null) {
                        this.stress.common.showDialog(StressValidationMessages.SELECT_INDICATOR);
                    } else if (indicatorData.historicalRangeFrom === undefined && indicatorData.historicalRangeTo === undefined) {
                        this.stress.common.showDialog(StressValidationMessages.NO_HISTORICAL_RANGE + '(№ ' + indicatorData.number + ') ' + indicatorData.indicatorName);
                    } else if (indicatorData.validDateFrom === undefined) {
                        this.stress.common.showDialog(StressValidationMessages.NO_VALID_RANGE + '(№ ' + indicatorData.number + ') ' + indicatorData.indicatorName);
                    } else if (historicalErrors.length !== 0 &&
                        (indicatorData.ExcelType === 1 || indicatorData.ExcelType === undefined)
                        && (indicatorData.ExcelGUID === "" || indicatorData.ExcelGUID === undefined)) {
                        this.stress.common.showDialog(StressValidationMessages.NO_DATA_FOR_FIT);
                    }
                }
            }
        });

        $filteringIndicator.on('click', (e) => {

            this.stress.customePopUp.init($(e.currentTarget), this.stress.BlocksIndicatorsEls, [], "filteringIndicatorInput", $(e.currentTarget).parent());
        });

        $filteringDistribution.on('click', (e) => {

            this.stress.customePopUp.init($(e.currentTarget), [
                {
                    id: 0,
                    name: "Все"
                },
                {
                    id: 1,
                    name: "Распределение"
                },
                {
                    id: 2,
                    name: "Модель"
                },
            ], [], "filteringDistributionInput", $(e.currentTarget).parent());
        });

        $removeFile.on('click', (e) => {
            const $btn = $(e.currentTarget);
            const $parent = $btn.closest('.ListRow');
            const rowId = $parent.attr('row-id');

            this.stress.common.showDialog(StressValidationMessages.CONFIRM_DELETE_FILE, "Exclamation", () => {
                if (rowId !== undefined && rowId !== "") {
                    const indicatorData = this.stress.inputDataRows.find(item => item.number === Number(rowId));
                    if (indicatorData !== undefined) {
                        this.stress.removeFile($parent, indicatorData);
                    }
                }
            });

        });
    }

    checkValidDataFromSelection($input, data) {
        const historicalErrors = $input.find('[field="HistoricalRange"] .error__message');

        if (data.indicatorId === null) {
            return false;
        } else if (historicalErrors.length > 0 && (data.ExcelGUID === "" || data.ExcelGUID === undefined)) {
            return false;
        } else if (data.ExcelType === 2 && data.ExcelGUID !== "") {
            return false;
        }

        return true;
    }

    chackValidInputOptions(input) {
        if (input.distributionParams.length > 0) {
            const checkOptions = input.distributionParams.filter(item => item.isCheckValidValue === true);

            if (checkOptions.length > 0) {
                const firstLength = checkOptions[0].value.split(';').length;

                for (const obj of checkOptions) {
                    if (typeof obj.value !== 'string') return false;

                    const parts = obj.value.split(';');

                    if (parts.length !== firstLength) return false;

                    if (parts.length === 1 && obj.value.includes(';')) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    initInputIndicator($input, data) {
        const $indicator = $input.find('[field="Indicator"] .indicator');

        $indicator.select2({
            data: this.stress.InputIndicatorEls,
            templateResult: formatState,
            templateSelection: formatSelected,
            width: '120px',
            dropdownAutoWidth: false,
            matcher: matcherTemplate,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });

        initSelect2Event($indicator);

        const rowNumber = data.number;
        $indicator.on('select2:select', function (e) {
            if (!e.params || e.params.data == null) return;
            var rowData = this.stress.inputDataRows.find(el => el.number === rowNumber);
            var $parent = $('#input_block_list .ListRow[row-id="' + rowNumber + '"]');
            if (!rowData || !$parent.length) return;

            const rowId = String(rowNumber);
            const $field = $parent.find('[field="Indicator"]');
            const $view = $field.find('[mode="view"]');

            let selected = null;
            if (Array.isArray(e.params.data)) {
                var found = e.params.data.find(el => el.selected === true);
                if (found !== undefined) selected = found.text;
            } else if (e.params && e.params.data != null) {
                selected = e.params.data.text;
            }
            if (!selected || typeof selected !== 'string') return;
            var parts = selected.split('#;');
            var selectedVal = parts.length > 1 ? parts[1] : selected;
            var idRaw = parts.length > 1 ? parts[0] : (e.params.data.id != null ? String(e.params.data.id) : '');
            var selectedID = idRaw === '' ? null : (Number(idRaw).toString() === idRaw ? Number(idRaw) : idRaw);

            $view.text(selectedVal);
            $field.attr("id", selectedID);

            rowData.indicatorId = selectedID;
            rowData.indicatorName = selectedVal;

            if (rowData.analytics === null || rowData.analytics.product === undefined) {
                const $viewProduct = $parent.find('[field="Product"] [mode="view"]');
                const $editorProduct = $parent.find('[field="Product"] [mode="editor"]');

                $viewProduct.text('');
                $editorProduct.text('');
            }

            (async () => {
                    await this.stress.loadingAnalysts($parent, rowData, "Input");
                    this.stress.updateInputValidDateRange($parent, rowData);
                    this.stress.checkIndicator(rowData, "Input");
                })();
        }.bind(this));

        if (data.indicatorId != null && data.indicatorName != null && data.indicatorName !== '') {

            if (this.stress.InputIndicatorEls.length > 0) {

                const $indicatorBlock = $input.find('[field="Indicator"]');
                $indicatorBlock.attr("id", data.indicatorId);
                $indicatorBlock.find('[mode="view"]').text(data.indicatorName);

                var indicatorData = this.stress.InputIndicatorEls;
                var selectedItem = null;
                var posOptions = null;
                for (var i = 0; i < indicatorData.length; i++) {
                    var d = indicatorData[i];
                    var idStr = String(d.id);
                    var textParts = (d.text || '').split('#;');
                    var namePart = textParts[1] || textParts[0] || '';
                    var idMatches = String(data.indicatorId) === idStr || (Number(idStr) === Number(data.indicatorId) && !Number.isNaN(Number(data.indicatorId)));
                    if (idMatches || namePart === data.indicatorName) {
                        posOptions = d.id;
                        selectedItem = { id: d.id, text: d.text };
                        break;
                    }
                }

                if (selectedItem != null && posOptions != null) {
                    var safeVal = String(posOptions);
                    $indicator.val([safeVal]).trigger('change');
                    var select2Event = $.Event('select2:select');
                    select2Event.params = { data: selectedItem };
                    $indicator.trigger(select2Event);
                }

            }
        }
    }

    initInputDistribution($input, data) {
        const $distribution = $input.find('[field="Distribution"] .distribution');

        $distribution.select2({
            width: '120px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });

        initSelect2Event($distribution);

        $distribution.on('select2:select', function (e) {
            // Не вызываем $(this).val() — у Select2 при программном trigger DOM может быть в промежуточном
            // состоянии, и jQuery .val() иногда вызывает toLowerCase у undefined. Берём данные только из e.params.data.
            if (!e.params || e.params.data == null) return;
            var $parent = $(this).closest('.ListRow');
            var rowId = $parent.attr('row-id');
            var rowData = this.stress.inputDataRows.find(function (el) { return el.number === Number(rowId); });
            if (rowData === undefined) return;
            var $view = $parent.find('[field="Distribution"] [mode="view"]');
            var selected = null;
            if (Array.isArray(e.params.data)) {
                var found = e.params.data.find(function (el) { return el.selected === true; });
                if (found !== undefined) selected = found.text;
            } else if (e.params && e.params.data != null) {
                selected = e.params.data.text;
            }

            if (!selected || typeof selected !== 'string') return;
            // Поддержка формата "id#;name" и fallback на полный text или data.id
            var parts = selected.split('#;');
            var selectedVal = parts.length > 1 ? parts[1] : selected;
            var idRaw = parts.length > 1 ? parts[0] : (e.params.data.id != null ? String(e.params.data.id) : '');
            var selectedId = idRaw === '' ? null : (Number(idRaw).toString() === idRaw ? Number(idRaw) : idRaw);
            $view.text(selectedVal);

            rowData.distributionId = selectedId;
            rowData.distributionName = selectedVal;

            if (rowData.getParamFromRequest === true || rowData.distributionParams.length === 0) {
                this.fillDistributionOptions($parent, rowData);
            }

            var typeDistribution = this.getTypeDistributionByName(rowData.distributionName);
            if (typeDistribution !== null) {
                $parent.find('[data-rowbtn="selection"]').attr("type", typeDistribution);
                rowData.indicatorType = Number(typeDistribution);
            }

            if (rowData.ExcelGUID !== "" && rowData.ExcelGUID !== undefined) {
                if (!$parent.find('[field="HistoricalRange"]').hasClass('invisibility')) {
                    $parent.find('[field="HistoricalRange"]').addClass('invisibility');
                    $parent.find('[field="HistoricalRange"] .error__message').remove();
                }
            }

            var $options = $parent.find('[field="Options"]');
            $options.empty();
            var $optionEl = this.getOptionsEl(rowData.distributionParams, $view.hasClass('hidden'));
            $options.append($optionEl);

            var $img = $parent.find('[field="Schedule"] img');
            $img.attr('src', 'img/distribution/' + selectedVal + '.svg').removeAttr('width').removeAttr('height');
            $img.removeClass('invisibility');
            $parent.find('[field="Options"] [mode]').removeClass('invisibility');

            if (rowData.ExcelGUID === "" || rowData.ExcelGUID === undefined) {
                this.stress.updateInputValidDateRange($parent, rowData);
                this.stress.checkRangeDate($parent, rowData);
            }
        }.bind(this));

        $distribution.on('select2:unselecting', function (e) {
            var $parent = $(this).closest('.ListRow');
            var rowId = $parent.attr('row-id');
            var rowData = this.stress.inputDataRows.find(function (el) { return el.number === Number(rowId); });
            if (rowData) rowData.getParamFromRequest = true;
        }.bind(this));

        const combinedData = this.stress.distributionEls.flatMap(item => item.data);

        const distributionData = combinedData
            .filter(function (item) { return item != null && item.k != null && item.k !== ''; })
            .map(function (item) {
                var k = String(item.k);
                var n = item.n != null ? item.n : '';
                return { id: k, text: k + "#;" + n };
            });

        $distribution.empty().select2({
            data: distributionData,
            templateResult: formatDistribution,
            templateSelection: formatSelected,
            width: '120px',
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
                    var term = (params.term != null && typeof params.term === 'string') ? params.term : '';
                    if ($.trim(term) === '') {
                        return data;
                    }
                    if (!data || data.text == null) {
                        return null;
                    }
                    var parts = String(data.text).split(';');
                    var valuePart = (parts.length > 1 ? parts[1] : parts[0]) || '';

                    if (valuePart.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
                        return data;
                    }

                    return null;
                },
        });

        if (distributionData.length > 0) {

            if (data.distributionName != null && data.distributionName !== "") {

                // Select2 с data: не создаёт <option>, ищем по массиву distributionData
                var selecteddistribution = null;
                var opIndex = null;
                for (var i = 0; i < distributionData.length; i++) {
                    var d = distributionData[i];
                    var parts = (d.text || '').split('#;');
                    var idPart = parts[0];
                    var namePart = parts[1] || '';
                    var dataId = data.distributionId;
                    var idMatches = dataId != null && (String(idPart) === String(dataId) || (Number(idPart).toString() === String(idPart) && Number(dataId).toString() === String(dataId) && Number(idPart) === Number(dataId)));
                    if (idMatches) {
                        opIndex = idPart;
                        selecteddistribution = { id: String(idPart), text: d.text };
                        break;
                    }
                    if (namePart === data.distributionName) {
                        opIndex = idPart;
                        selecteddistribution = { id: String(idPart), text: d.text };
                        break;
                    }
                }

                if (selecteddistribution != null && opIndex != null) {
                    var safeVal = String(opIndex);
                    $input.find('[field="Distribution"] [mode="view"]').text(data.distributionName || '');
                    $distribution.val([safeVal]).trigger('change');

                    var select2Event = $.Event('select2:select');
                    select2Event.params = { data: selecteddistribution };
                    $distribution.trigger(select2Event);

                    // Явно заполняем параметры при инициализации (на случай если trigger не обновил DOM)
                    if (data.distributionParams && data.distributionParams.length > 0) {
                        var $options = $input.find('[field="Options"]');
                        var isViewHidden = $input.find('[field="Distribution"] [mode="view"]').hasClass('hidden');
                        var $optionEl = this.getOptionsEl(this.normalizeDistributionParams(data.distributionParams), isViewHidden);
                        if ($optionEl) {
                            $options.empty().append($optionEl);
                            $options.find('[mode]').removeClass('invisibility');
                        }
                    }
                }

            } else {
                $input.find('[field="Schedule"] img').addClass('invisibility');
                $input.find('[field="Options"] [mode]').addClass('invisibility');
            }

        }
    }

    initInputHistoricalRange($input, data) {
        let fromVal = moment().subtract(3, 'year').date(1).format('YYYY-MM-DD');
        let toVal = moment().subtract(1, 'month').date(1).format('YYYY-MM-DD');

        if (data.historicalRangeFrom !== null) {
            fromVal = data.historicalRangeFrom.split('.').reverse().join('-') + "-01";
        } else {
            const splitFrom = fromVal.split('-');
            data.historicalRangeFrom = `${splitFrom[1]}.${splitFrom[0]}`;
        }

        if (data.historicalRangeTo !== null) {
            toVal = data.historicalRangeTo.split('.').reverse().join('-') + "-01";
        } else {
            const splitTo = toVal.split('-');
            data.historicalRangeTo = `${splitTo[1]}.${splitTo[0]}`;
        }

        data.$historicalRangeFrom = new AirDatepicker('#dateFrom__' + data.number, {
            view: 'months',
            minView: 'months',
            dateFormat: 'MMM yyyy',
            selectedDates: [fromVal],
            startDate: fromVal,
            onSelect: (formattedDate, date, inst) => {
                this.fillHistoricalRange(data.number);
            }
        });

        data.$historicalRangeTo = new AirDatepicker('#dateTo__' + data.number, {
            view: 'months',
            minView: 'months',
            dateFormat: 'MMM yyyy',
            selectedDates: [toVal],
            startDate: toVal,
            onSelect: (formattedDate, date, inst) => {
                this.fillHistoricalRange(data.number);
            }
        });

        const valueFull = data.historicalRangeFrom + ' - ' + data.historicalRangeTo;

        $input.find('[field="HistoricalRange"] [mode="view"]').text(valueFull);
    }

    fillHistoricalRange(rowId) {
        const self = this.stress;
        const $row = $('#input_block_list .ListRow[row-id="' + rowId + '"]');
        if ($row.length > 0) {
            const $field = $row.find('[field="HistoricalRange"]');
            const rowData = self.inputDataRows.find(el => el.number === Number(rowId));

            const dateFrom = rowData.$historicalRangeFrom.selectedDates.length > 0 ? new Date(rowData.$historicalRangeFrom.selectedDates[0]) : undefined;
            const dateTo = rowData.$historicalRangeTo.selectedDates.length > 0 ? new Date(rowData.$historicalRangeTo.selectedDates[0]) : undefined;
            let val = "";
            if (dateFrom !== undefined) {
                const formatedDateFrom = formatDate(dateFrom);
                val += formatedDateFrom + ' - ';
                rowData.historicalRangeFrom = formatedDateFrom;
            } else {
                val += ' - ';
                rowData.historicalRangeFrom = undefined;
            }

            if (dateTo !== undefined) {
                const formatedDateTo = formatDate(dateTo);
                val += formatedDateTo;
                rowData.historicalRangeTo = formatedDateTo;
            } else {
                rowData.historicalRangeTo = undefined;
            }

            $field.find('[mode="view"]').text(val);

            if (rowData.ExcelGUID === "" || rowData.ExcelGUID === undefined) {
                this.stress.checkRangeDate($row, rowData);
            }
        }
    }

    fillDistributionOptions($parent, rowData) {
        const distribId = rowData.distributionId;
        const isNumericId = typeof distribId === 'number' && !Number.isNaN(distribId) || (typeof distribId === 'string' && distribId !== '' && Number(distribId).toString() === distribId);
        const _params = [
            { Id: "PARAM_DISTRIB", Value: distribId, Type: isNumericId ? this.stress.bi.ItDataType.Integer : this.stress.bi.ItDataType.String },
        ];
        const combo = this.stress.openDimCombo(this.stress.Dims.DISTRIBUTION_PARAM, null, _params, null, true, (x) => {
            this.stress.bi.getFiltredDimElements({ "key": combo.dim.getOdId().id }).then(data => this.applyDistributionParamsData(data, rowData, $parent));
        });
    }

    /**
     * Обработчик данных getFiltredDimElements для опций параметров распределения: заполнение rowData и отрисовка.
     */
    applyDistributionParamsData(data, rowData, $parent) {
        const $field = $parent.find('[field="Options"]');
        $field.empty();
        rowData.distributionParams = [];
        if (data !== undefined) {
            data.forEach(item => {
                if (item.a.it[5] === "1") {
                    rowData.distributionParams.push({
                        name: item.n,
                        value: "0",
                        isCheckValidValue: item.ea.it[4]["@v"] === "4" ? true : false,
                    });
                }
            });
            const $optionEl = this.getOptionsEl(rowData.distributionParams, true);
            $field.append($optionEl);
        }
    }

    checkRangeDate($row, rowData) {
        const $AcceptableRangeView = $row.find('[field="AcceptableRange"] [mode="view"]');
        const $AcceptableRangeEditor = $row.find('[field="AcceptableRange"] [mode="editor"]');
        const $HistoricalRange = $row.find('[field="HistoricalRange"]');

        $HistoricalRange.find('.error__message').remove();
        $AcceptableRangeView.removeClass('error__message');
        $AcceptableRangeEditor.removeClass('error__message');

        if (rowData.historicalRangeFrom === undefined) {
            $HistoricalRange.append('<p class="error__message">Нет данных за указанный период</p>');
        } else {
            const hasValidDate = rowData.validDateFrom !== undefined;
            const validFrom = hasValidDate ? parseDate(rowData.validDateFrom) : null;
            const historicalFrom = parseDate(rowData.historicalRangeFrom);

            if (!hasValidDate || historicalFrom < validFrom) {
                $HistoricalRange.append(`<p class="error__message">Нет данных за ${rowData.historicalRangeFrom}</p>`);
            }
        }

        if (rowData.historicalRangeTo === undefined) {
            $HistoricalRange.append('<p class="error__message">Нет данных за указанный период</p>');
        } else {
            const hasValidDate = rowData.validDateTo !== undefined;
            const validTo = hasValidDate ? parseDate(rowData.validDateTo) : null;
            const historicalTo = parseDate(rowData.historicalRangeTo);

            if (!hasValidDate || historicalTo > validTo) {
                $HistoricalRange.append(`<p class="error__message">Нет данных за ${rowData.historicalRangeTo}</p>`);
            }
        }

        if (rowData.validDateTo === undefined || rowData.validDateFrom === undefined) {
            $AcceptableRangeView.addClass('error__message');
            $AcceptableRangeEditor.addClass('error__message');
        }

    }

    updateInputValidDateRange($input, data) {
        const self = this.stress;
        this.stress.common.waiter.show("update valid date");
        const PrognozVersionComboSelected = self.PrognozVersionComboSelected.select2('data')[0];
        const PrognozVersionComboSelectedId = PrognozVersionComboSelected.text.split('#;')[0];

        const json = {
            prognozVersion: Number(PrognozVersionComboSelectedId),
            indicatorId: data.indicatorId,
            analytics: {
                "product": "-1",
                "movementType": "-1",
                "company": "-1",
                "trCurrency": "-1",
                "lt_st": "-1",
            }
        }
        if (data.analytics !== null && data.analytics !== undefined) {
            Object.keys(data.analytics).forEach(key => {
                json.analytics[key] = data.analytics[key];
            });
        }
        const selectedIds = self.PrognozVersionComboSelected.val();
        const selectedId = selectedIds ? selectedIds[0] : null;
        if (selectedId !== null) {
            const selectedData = self.PrognozVersionComboSelected.select2('data')[0];
            const PrognozVersionComboId = selectedData.text.split('#;')[0];
            let _params = [
                this.stress.bi.OpenArgs("json", JSON.stringify(json), this.stress.bi.ItDataType.String),
                this.stress.bi.OpenArgs("userName", this.stress.getUserId ? this.stress.getUserId() : '', this.stress.bi.ItDataType.String),
                this.stress.bi.OpenArgs("version", PrognozVersionComboId, this.stress.bi.ItDataType.String),
            ];

            this.stress.bi.getResultForeModule({
                "moduleKey": this.stress.ForeKeys.DK_STRESS_1144013, "methodName": "CheckData", "args": _params
            }).then(x => this.handleCheckDataResponse(x, $input, data));
        }
    }

    /**
     * Обработчик ответа CheckData: обновление допустимого диапазона дат в DOM и в data.
     */
    handleCheckDataResponse(x, $input, data) {
        const $AcceptableRangeView = $input.find('[field="AcceptableRange"] [mode="view"]');
        const $AcceptableRangeEditor = $input.find('[field="AcceptableRange"] [mode="editor"]');
        if (x.status !== ApiStatus.ERROR) {
            if ($AcceptableRangeView.length > 0) {
                const result = JSON.parse(x.message);
                const value = sanitizeDateRangeText(String(result.validDateFrom || '')) + ' - ' + sanitizeDateRangeText(String(result.validDateTo || ''));
                $AcceptableRangeView.text(value);
                $AcceptableRangeEditor.text(value);
                data.validDateFrom = result.validDateFrom;
                data.validDateTo = result.validDateTo;
            }
        } else {
            $AcceptableRangeView.addClass('error__message');
            $AcceptableRangeEditor.addClass('error__message');
            $AcceptableRangeView.text("Нет данных");
            $AcceptableRangeEditor.text("Нет данных");
        }
        if (data.ExcelGUID === "" || data.ExcelGUID === undefined) {
            this.stress.checkRangeDate($input, data);
        }
        this.stress.common.waiter.hide("update valid date");
    }

    getValidInputFromBuffer(e) {
        const clipboardData = e.originalEvent.clipboardData || window.clipboardData;
        if (!clipboardData) return '';

        let pastedText = clipboardData.getData('text/plain');

        return pastedText
            .replace(/[^0-9\n\t-]/g, ' ')
            .replace(/[\s\t]+/g, ' ')
            .trim().split(' ')
            .filter(num => num.length > 0)
            .join('; ');
    }

    /** Приводит параметры распределения из API к формату { name, value } для getOptionsEl. */
    normalizeDistributionParams(params) {
        if (!params || !Array.isArray(params)) return [];
        return params.map(function (el) {
            var name = el.name != null ? el.name : (el.paramName != null ? el.paramName : (el.n != null ? el.n : ''));
            var val = el.value != null ? el.value : (el.paramValue != null ? el.paramValue : (el.v != null ? el.v : (el['@v'] != null ? el['@v'] : '0')));
            return { name: String(name), value: String(val), isCheckValidValue: el.isCheckValidValue === true };
        });
    }

    getOptionsEl(data, isViewHidden) {
        if (data.length > 0) {
            const $form = $(`<div style="width: 100%;">
                    <div mode="view"></div>
                    <div mode="editor" style=" display: flex; flex-direction: column; gap: 0.25rem; width: 100%;flex-wrap: wrap;"></div>
                    </div>`);

            data.forEach(el => {
                const $viewBlock = $form.find('[mode="view"]');
                const $editorBlock = $form.find('[mode="editor"]');

                $viewBlock.append(`<span class="RowItemName" propName="${el.name}" title="${el.value}">${el.name} = ${toFixedNoRounding(el.value, 3)}</span>`);

                $editorBlock.append(`<div style="display:flex;gap: 0.5rem;width:100%;align-items: center;">
                        <span class="RowItemName" style=" margin: 0; flex-shrink: 0; ">${el.name} = </span>
                        <input type="text" class="RowInput" style="width: 100%;" rowOptions="${el.name}" value="${el.value}" />
                        </div>`)

                $editorBlock.find(`[rowOptions="${el.name}"]`)
                    .on('paste', (e) => {
                        e.preventDefault();
                        const value = this.getValidInputFromBuffer(e);
                        const $input = $(e.currentTarget);

                        const startPos = $input[0].selectionStart;
                        const endPos = $input[0].selectionEnd;
                        const currentValue = $input.val();

                        $input.val(currentValue.substring(0, startPos) + value + currentValue.substring(endPos));

                        const newCursorPos = startPos + value.length;
                        $input[0].setSelectionRange(newCursorPos, newCursorPos);

                        $input.trigger('input');
                    })
                    .on('keydown', function (e) {
                        if ((e.ctrlKey || e.metaKey) && e.keyCode === 86) {
                            return;
                        }

                        if ([8, 9, 13, 16, 17, 18, 19, 20, 27, 46].includes(e.keyCode) ||
                            (e.keyCode >= 35 && e.keyCode <= 40)) {
                            return;
                        }

                        if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
                            return;
                        }

                        if (['.', ',', ';', '-', 'e', 'Period', 'Comma', 'Semicolon'].includes(e.key)) {
                            return;
                        }

                        if (e.keyCode === 32) {
                            return;
                        }

                        e.preventDefault();
                    })
                    .on('input', function (e) {
                        const $input = $(e.currentTarget);
                        const $parent = $input.closest('[field="Options"]');

                        const filteredValue = $input.val().replace(/[^0-9;.,\s-e]/g, '');
                        if ($input.val() !== filteredValue) {
                            $input.val(filteredValue);
                        }

                        el.value = filteredValue;
                        $parent.find('[mode="view"] .RowItemName[propName="' + el.name + '"]')
                            .text(`${el.name} = ${toFixedNoRounding(filteredValue, 3)}`).attr('title', filteredValue);
                    });

            });

            if (isViewHidden) {
                $form.find('[mode="view"]').addClass('hidden');
            } else {
                $form.find('[mode="editor"]').addClass('hidden');
            }
            return $form;
        }
        return null;
    }

    getTypeDistributionByName(name) {
        let res = null;
        const foundItem = this.stress.distributionEls.find(item =>
            item.data.some(obj => obj.n === name)
        );

        const type = foundItem ? foundItem.type : undefined;
        if (type !== undefined) {
            res = type;
        }
        return res;
    }
}
