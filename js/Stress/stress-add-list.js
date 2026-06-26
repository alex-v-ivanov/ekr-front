import { formatState, formatSelected, initSelect2Event } from './utils.js';
import { StressModes } from './constants.js';
import { ApiStatus } from '../Common/constants.js';

/**
 * Окно «Добавить список показателей»: выбор версии стресс-теста и копирование Input/Output.
 */
export class AddListIndicators {
    constructor(stress, getUserId) {
        this.stress = stress;
        this.getUserId = getUserId; //сам UserId а не функция
        this.table = null;
        this.$control = null;
    }

    init() {
        const $parent = $('#select_AddListIndicators_block');
        this.$control = $parent.find('#AddListIndicatorsSelect');
        this.$control.select2({
            width: '100%',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });
        initSelect2Event(this.$control);
    }

    openModal(table) {
        const $modal = $(".modal-custom__AddListIndicators");
        this.table = table;
        this.$control = $('#AddListIndicatorsSelect');
        this.$control.empty().select2({
            data: this.stress.PrognozVersionEls,
            templateResult: formatState,
            templateSelection: formatSelected,
            width: '320px',
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
            matcher(params, data) {
                if ($.trim(params.term) === '') return data;
                const parts = data.text.split(';');
                const valuePart = parts.length > 1 ? parts[1] : parts[0];
                if (valuePart.toUpperCase().indexOf(params.term.toUpperCase()) >= 0) return data;
                return null;
            },
        });
        $('html').animate({ scrollTop: 0 }, 500);
        $modal.toggleClass("Hidden");
    }

    closeModal() {
        const $modal = $(".modal-custom__AddListIndicators");
        this.$control.val('').trigger('change');
        $modal.toggleClass("Hidden");
        const $block = this.$control.closest('.SelectAnalysisItem');
        $block.find('.dropdown').removeClass('error');
        $block.find('.error__message').remove();
    }

    copy() {
        this.stress.common.waiter.show("Copy List");
        const res = this.$control.select2('data');
        if (res.length > 0) {
            const $block = this.$control.closest('.SelectAnalysisItem');
            const id = Number(res[0].text.split('#;')[0]);
            const json = { StressVersion: id };
            const selectedData = this.stress.PrognozVersionComboSelected.select2('data')[0];
            const PrognozVersionComboId = selectedData.text.split('#;')[0];
            const _params = [
                this.stress.bi.OpenArgs("json", JSON.stringify(json), this.stress.bi.ItDataType.String),
                this.stress.bi.OpenArgs("userName", this.getUserId(), this.stress.bi.ItDataType.String),
                this.stress.bi.OpenArgs("version", PrognozVersionComboId, this.stress.bi.ItDataType.String),
            ];
            this.stress.bi.getResultForeModule({
                moduleKey: this.stress.ForeKeys.DK_STRESS_1144013,
                methodName: "GetStressVersion",
                args: _params,
            }).then(x => {
                if (x.status === ApiStatus.OK) {
                    const json = JSON.parse(x.message);
                    this.stress.getValidData(json, json.prognozVersion).then(res => {
                        if (res.status == ApiStatus.ERROR || (res.faultstring && res.faultstring.length > 0)) {
                            res = json;
                        } else {
                            res = JSON.parse(res.message);
                        }
                        if (this.table === StressModes.INPUT) {
                            this.stress.inputDataRows = [];
                            $('#input_block_list').empty();
                            this.stress.renderInput(res.Input);
                        } else if (this.table === StressModes.OUTPUT) {
                            this.stress.OutputDataRows = [];
                            $('#output_block_list').empty();
                            this.stress.renderOutput(res.Output);
                        }
                        this.closeModal();
                        this.stress.common.waiter.hide("Copy List");
                    });
                }
            });
            $block.find('.dropdown').removeClass('error');
            $block.find('.error__message').remove();
        } else {
            const $block = this.$control.closest('.SelectAnalysisItem');
            if (!$block.find('.dropdown').hasClass('error')) {
                $block.find('.dropdown').addClass('error');
                $block.append('<p class="error__message">Не заполнено поле!</p>');
            }
        }
    }
}
