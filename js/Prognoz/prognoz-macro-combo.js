/**
 * Инициализация комбо макропараметров: Well, InterestRate, InflationRate, InflationProp, PriceProduct.
 */
import { formatState, formatSelected } from './prognoz-utils.js';

const defaultSelect2Opt = () => ({
    width: '150px',
    dropdownAutoWidth: false,
    placeholder: '',
    multiple: true,
    allowClear: true,
    maximumSelectionLength: 1,
});

const select2DataOpt = (data) => ({
    data,
    templateResult: formatState,
    templateSelection: formatSelected,
    width: '150px',
    dropdownAutoWidth: false,
    placeholder: '',
    multiple: true,
    allowClear: true,
    maximumSelectionLength: 3,
    language: {
        noResults: () => "Ничего не найдено",
        maximumSelected: (args) => args.maximum > 1 ? "Можно выбрать только " + args.maximum + " элемента" : "Можно выбрать только 1 элемент",
    },
    adaptDropdownCssClass: () => '',
});

function setTippyContent($el, html) {
    const $parent = $el.closest('.block-parameters__item');
    const $btnInfo = $parent.find('[btn="info"]');
    if ($btnInfo.length > 0) {
        if ($btnInfo[0]._tippy !== undefined) $btnInfo[0]._tippy.setProps({ content: html });
        else if (typeof tippy !== 'undefined') tippy($btnInfo[0], { content: html, animation: 'fade', followCursor: true, arrow: false, allowHTML: true });
    }
}

export class PrognozMacroCombo {
    constructor(prognoz) {
        this.prognoz = prognoz;
    }

    _initMacroComboOne($form, selector, propName, groupId) {
        const p = this.prognoz;
        const $combo = $form.find(selector);
        p[propName] = $combo;
        const option = defaultSelect2Opt();
        if (p.type !== 0) {
            option.disabled = true;
            $combo.closest('label').addClass('selected__disabled');
        }
        $combo.select2(option);
        p.initSelect2Event($combo);
        setTippyContent($combo, '<p class="tooltipe__text">Не выбрано</p>');
        $combo.on('select2:select', function () {
            const $el = $(this);
            const html = $el.val().length >= 1 ? p.getSelectedHtmlInfo($el.select2('data')) : '<p class="tooltipe__text">Не выбрано</p>';
            setTippyContent($el, html);
        });
        $combo.on('select2:unselect', function () {
            const $el = $(this);
            $el.closest('.block-parameters__item').find('.dropdown').removeClass('error');
            const html = $el.val().length >= 1 ? p.getSelectedHtmlInfo($el.select2('data')) : '<p class="tooltipe__text">Не выбрано</p>';
            setTippyContent($el, html);
        });
        if (groupId !== null && p.inputData.length > 0) {
            let data = p.inputData.find(item => Number(item.group) === groupId);
            data = data ? data.items.map((item) => ({ id: Number(item.id), text: Number(item.id) + "#;" + item.name })) : [];
            const $parent = $combo.closest('.block-parameters__item');
            $parent.find('.warning__text').remove();
            $parent.find('.dropdown').removeClass('warning__block');
            $combo.empty().select2(select2DataOpt(data));
        }
    }

    initWellCombo($form) {
        this._initMacroComboOne($form, '#well', 'WellComboSelected', 1);
    }

    initInterestRateCombo($form) {
        this._initMacroComboOne($form, '#interestRate', 'interestRateComboSelected', 2);
    }

    initInflationRateCombo($form) {
        this._initMacroComboOne($form, '#inflationRate', 'inflationRateComboSelected', 3);
    }

    initInflationPropCombo($form) {
        const p = this.prognoz;
        p.inflationPropComboSelected = $form.find('#inflationProp');
        const option = defaultSelect2Opt();
        if (p.type !== 0) {
            option.disabled = true;
            p.inflationPropComboSelected.closest('label').addClass('selected__disabled');
        }
        p.inflationPropComboSelected.select2(option);
        p.initSelect2Event(p.inflationPropComboSelected);
        p.loadingInflationPropData();
    }

    initPriceProductCombo($form) {
        this._initMacroComboOne($form, '#priceProduct', 'priceProductComboSelected', 4);
    }
}
