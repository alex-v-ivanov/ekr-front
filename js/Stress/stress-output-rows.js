import { StressValidationMessages } from './constants.js';
import {
    formatState,
    formatSelected,
    initSelect2Event,
    getOutputTemplate,
    matcherTemplate
} from './utils.js';

/**
 * Управление строками вывода (Output): renderOutput, initOutputIndicator, addOutputBtnEvent.
 */
export class OutputRowsManager {
    constructor(stress) {
        this.stress = stress;
    }

    getNextOutputNumber() {
        const rows = this.stress.OutputDataRows;
        if (!rows || rows.length === 0) return 1;
        return Math.max(...rows.map(obj => obj.number)) + 1;
    }

    addNewOutput() {
        const self = this.stress;
        const version = self.PrognozVersionComboSelected.select2('data');
        const IterationCountComboSelected = self.IterationCountComboSelected.select2('data');
        const SimulationCount = self.SimulationCount.select2('data');
        if (version.length > 0 && IterationCountComboSelected.length > 0 && SimulationCount.length > 0) {
            this.renderOutput([null]);
        } else {
            this.stress.common.showDialog(StressValidationMessages.FILL_REQUIRED_FIELDS);
        }
    }

    renderOutput(data = []) {
        const self = this.stress;
        const $list = $(".OutputContent");
        if (data == undefined || data.Output?.length == 0) {
            self.OutputDataRows = [];
            $list.remove();
            return;
        }
        if (data.length > 0 && data[0] === null) {
            const $block = $('.listBlockOutput');
            const $ItemsBlock = $('#output_block_list');
            $block.animate({ scrollTop: $ItemsBlock.height() }, 500);
        }
        data.forEach(item => {
            let rowObj = {
                number: this.getNextOutputNumber(),
                indicatorId: null,
                analytics: null,
            };
            const $input = getOutputTemplate();
            if (item !== null) {
                rowObj.indicatorId = item.key;
                rowObj.indicatorName = item.name;
                rowObj.status = item.status;
                rowObj.analytics = item.analytics;
                $input.find('[mode="view"]').removeClass('hidden');
                $input.find('[mode="editor"]').addClass('hidden');
            }
            self.OutputDataRows.push(rowObj);
            if (rowObj.analytics !== null) {
                self.syncProductFieldFromAnalytics($input, rowObj.analytics);
            }
            const $analyticBtn = $input.find('[data-rowBtn="analytics"]');
            self.initBtnAnalysts($analyticBtn, rowObj.analytics);
            $input.attr('row-id', rowObj.number);
            $input.find('[field="Number"] .RowItemName').text(rowObj.number);
            this.initOutputIndicator($input, rowObj);
            this.addOutputBtnEvent($input);
            const $tooltipes = $input.find('[tooltipe]');
            if (rowObj.status !== undefined) {
                $input.toggleClass('ListRow__error', rowObj.status === 0 ? false : true);
            } else {
                self.checkIndicator(rowObj, "Output");
            }
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
            $list.append($input);
        });
    }

    initOutputIndicator($input, data) {
        const $indicator = $input.find('[field="Indicator"] .indicator');
        const self = this.stress;
        $indicator.select2({
            data: self.OutputIndicatorEls,
            templateResult: formatState,
            templateSelection: formatSelected,
            width: '120px',
            dropdownAutoWidth: false,
            placeholder: '',
            matcher: matcherTemplate,
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });
        initSelect2Event($indicator);
        $indicator.on('select2:select', function (e) {
            if ($(this).val().length >= 1) {
                const $input = $(this);
                const $parent = $input.closest('.ListRow');
                const rowId = $parent.attr('row-id');
                const rowData = self.OutputDataRows.find(el => el.number === Number(rowId));
                const $field = $parent.find('[field="Indicator"]');
                const $view = $field.find('[mode="view"]');
                let selected = null;
                if (Array.isArray(e.params.data)) {
                    selected = e.params.data.find(el => el.selected === true);
                    if (selected !== undefined) selected = selected.text;
                } else {
                    selected = e.params.data.text;
                }
                const selectedVal = selected.split('#;')[1];
                const selectedID = Number(selected.split('#;')[0]);
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
                    await self.loadingAnalysts($parent, rowData, "Output");
                    self.checkIndicator(rowData, "Output");
                })();
            }
        });
        if (data.indicatorId !== null && self.OutputIndicatorEls.length > 0) {
            const $indicatorBlock = $input.find('[field="Indicator"]');
            $indicatorBlock.attr("id", data.indicatorId);
            $indicatorBlock.find('[mode="view"]').text(data.indicatorName);
            let selectedindicatorbution = null;
            let posOptions = null;
            self.OutputIndicatorEls.forEach((item) => {
                const id = Number(item.text.split('#;')[0]);
                if (id === data.indicatorId) {
                    posOptions = data.indicatorId;
                    selectedindicatorbution = { id: posOptions, text: posOptions + "#;" + data.indicatorName };
                    return false;
                }
            });
            if (selectedindicatorbution !== null) {
                $indicator.val([posOptions]).trigger('change');
                $indicator.trigger($.Event('select2:close'));
            }
        }
    }

    addOutputBtnEvent($input) {
        const self = this.stress;
        const $removeBtn = $input.find('[data-rowBtn="removeRow"]');
        const $cancel = $input.find('[data-rowbtn="cancel"]');
        const $editeRow = $input.find('[data-rowbtn="editeRow"]');
        const $analytics = $input.find('[data-rowbtn="analytics"]');
        const $filteringIndicator = $input.find('[data-rowBtn="filteringIndicator"]');
        $removeBtn.on('click', (e) => {
            this.stress.common.showDialog(StressValidationMessages.CONFIRM_DELETE_OUTPUT_INDICATOR, "Exclamation", () => {
                const $btn = $(e.currentTarget);
                const $parent = $btn.closest('.ListRow');
                const rowId = $parent.attr('row-id');
                self.OutputDataRows = self.OutputDataRows.filter(el => el.number !== Number(rowId));
                $parent.remove();
            });
        });
        $cancel.on('click', (e) => {
            const $btn = $(e.currentTarget);
            const $parent = $btn.closest('.ListRow');
            $parent.find('[mode="view"]').removeClass('hidden');
            $parent.find('[mode="editor"]').addClass('hidden');
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
                self.analyticsPopUp.init(Number($parent.attr('row-id')), "Output");
            }
        });
        $filteringIndicator.on('click', (e) => {
            const $btn = $(e.currentTarget);
            self.customePopUp.init($btn, self.BlocksIndicatorsEls, [], "filteringIndicatorOutput", $btn.parent());
        });
    }
}
