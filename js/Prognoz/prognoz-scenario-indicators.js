import { formatState, formatSelected } from './prognoz-utils.js';
import { PrognozType } from './constants.js';

/**
 * Блок сценарных показателей RCFF: рендер табов и полей выбора, getSelectField, getSelectedHtmlInfo, initForecastDefault.
 */
export class PrognozScenarioIndicators {
    constructor(prognoz) {
        this.prognoz = prognoz;
    }

    initForecastDefault() {
        const self = this.prognoz;
        self.ForecastDefaultComboSelected = $('#forecastDefault');
        self.ForecastDefaultComboSelected.select2({
            width: '150px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });
        self.initSelect2Event(self.ForecastDefaultComboSelected);

        let data = self.inputData.find(item => Number(item.group) === 26);
        data = data !== undefined
            ? data.items.map((item) => ({ id: Number(item.id), text: Number(item.id) + "#;" + item.name }))
            : [];

        self.ForecastDefaultComboSelected.empty().select2({
            data: data,
            templateResult: formatState,
            templateSelection: formatSelected,
            width: '172px',
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
            matcher: function (params, data) {
                if ($.trim(params.term) === '') return data;
                const parts = data.text.split(';');
                const valuePart = parts.length > 1 ? parts[1] : parts[0];
                return valuePart.toUpperCase().indexOf(params.term.toUpperCase()) >= 0 ? data : null;
            },
        });
    }

    getSelectedHtmlInfo(selectedValue) {
        const self = this.prognoz;
        let html = '';
        selectedValue.forEach(item => {
            const itemId = Number(item.id);
            const selectedItem = self.inputData.reduce((foundItem, inputGroup) => {
                if (foundItem) return foundItem;
                return inputGroup.items.find(input => Number(input.id) === itemId) || null;
            }, null);
            if (selectedItem !== null) {
                html += `<div class="tooltipe__block" blockId="${selectedItem.id}">
                    <p class="tooltipe__text">Параметр: ${selectedItem.name}</p>
                    ${selectedItem.horizonVal > 0 ? `<p class="tooltipe__text">Горизонт: ${selectedItem.horizonVal} ${self.getYearWord(selectedItem.horizonVal)}</p>` : ''}
                    <p class="tooltipe__text">Периодичность: ${selectedItem.periodicity}</p>
                    <p class="tooltipe__text">Действует с ${selectedItem.horizonFrom.toLocaleDateString('ru-RU').replace(/\//g, '.')} по ${selectedItem.horizonTo.toLocaleDateString('ru-RU').replace(/\//g, '.')}</p>
                </div>`;
            }
        });
        return html;
    }

    getSelectField(field) {
        const self = this.prognoz;
        const $field = $(`
                <div class="block-parameters__item">
                    <p class="block-parameters__text" style="height: 2.5rem; overflow: hidden; text-overflow: ellipsis;" title="${field.name}">${field.name}</p>
                    <div class="block-parameters__box" style="display: flex; gap: 0.5rem; align-items: center;">
                        <label class="dropdown warning__block">
                            <select id="select__${field.id}"></select>
                            <svg width="18" height="18" viewBox="0 0 32 32" fill="#004C97"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M26.7074 12.7075L16.7074 22.7075C16.6146 22.8005 16.5043 22.8742 16.3829 22.9246C16.2615 22.9749 16.1314 23.0008 15.9999 23.0008C15.8685 23.0008 15.7384 22.9749 15.617 22.9246C15.4956 22.8742 15.3853 22.8005 15.2924 22.7075L5.29245 12.7075C5.1048 12.5199 4.99939 12.2654 4.99939 12C4.99939 11.7346 5.1048 11.4801 5.29245 11.2925C5.48009 11.1049 5.73458 10.9995 5.99995 10.9995C6.26531 10.9995 6.5198 11.1049 6.70745 11.2925L15.9999 20.5863L25.2924 11.2925C25.3854 11.1996 25.4957 11.1259 25.6171 11.0756C25.7384 11.0253 25.8686 10.9995 25.9999 10.9995C26.1313 10.9995 26.2614 11.0253 26.3828 11.0756C26.5042 11.1259 26.6145 11.1996 26.7074 11.2925C26.8004 11.3854 26.8741 11.4957 26.9243 11.6171C26.9746 11.7385 27.0005 11.8686 27.0005 12C27.0005 12.1314 26.9746 12.2615 26.9243 12.3829C26.8741 12.5043 26.8004 12.6146 26.7074 12.7075Z" />
                            </svg>
                        </label>
                        <svg btn="info" width="24" height="24" viewBox="0 0 32 32" fill="#004C97" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 3C13.4288 3 10.9154 3.76244 8.77759 5.1909C6.63975 6.61935 4.97351 8.64968 3.98957 11.0251C3.00563 13.4006 2.74819 16.0144 3.2498 18.5362C3.75141 21.0579 4.98953 23.3743 6.80762 25.1924C8.6257 27.0105 10.9421 28.2486 13.4638 28.7502C15.9856 29.2518 18.5995 28.9944 20.9749 28.0104C23.3503 27.0265 25.3807 25.3603 26.8091 23.2224C28.2376 21.0846 29 18.5712 29 16C28.9964 12.5533 27.6256 9.24882 25.1884 6.81163C22.7512 4.37445 19.4467 3.00364 16 3ZM16 27C13.8244 27 11.6977 26.3549 9.88873 25.1462C8.07979 23.9375 6.66989 22.2195 5.83733 20.2095C5.00477 18.1995 4.78693 15.9878 5.21137 13.854C5.63581 11.7202 6.68345 9.7602 8.22183 8.22183C9.76021 6.68345 11.7202 5.6358 13.854 5.21136C15.9878 4.78692 18.1995 5.00476 20.2095 5.83733C22.2195 6.66989 23.9375 8.07979 25.1462 9.88873C26.3549 11.6977 27 13.8244 27 16C26.9967 18.9164 25.8367 21.7123 23.7745 23.7745C21.7123 25.8367 18.9164 26.9967 16 27ZM18 22C18 22.2652 17.8946 22.5196 17.7071 22.7071C17.5196 22.8946 17.2652 23 17 23C16.4696 23 15.9609 22.7893 15.5858 22.4142C15.2107 22.0391 15 21.5304 15 21V16C14.7348 16 14.4804 15.8946 14.2929 15.7071C14.1054 15.5196 14 15.2652 14 15C14 14.7348 14.1054 14.4804 14.2929 14.2929C14.4804 14.1054 14.7348 14 15 14C15.5304 14 16.0391 14.2107 16.4142 14.5858C16.7893 14.9609 17 15.4696 17 16V21C17.2652 21 17.5196 21.1054 17.7071 21.2929C17.8946 21.4804 18 21.7348 18 22ZM14 10.5C14 10.2033 14.088 9.91332 14.2528 9.66665C14.4176 9.41997 14.6519 9.22771 14.926 9.11418C15.2001 9.00065 15.5017 8.97094 15.7926 9.02882C16.0836 9.0867 16.3509 9.22956 16.5607 9.43934C16.7704 9.64912 16.9133 9.91639 16.9712 10.2074C17.0291 10.4983 16.9994 10.7999 16.8858 11.074C16.7723 11.3481 16.58 11.5824 16.3334 11.7472C16.0867 11.912 15.7967 12 15.5 12C15.1022 12 14.7206 11.842 14.4393 11.5607C14.158 11.2794 14 10.8978 14 10.5Z"></path>
                        </svg>
                    </div>
                    <p class="warning__text">Нет верифицированных данных</p>
                </div>`);

        const $select = $field.find('select');
        const option = {
            width: '220px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 3,
            dropdownParent: $select.closest('.block-parameters__item'),
        };
        if (self.type !== 0) {
            option.disabled = true;
            $field.find('label').addClass('selected__disabled');
        }
        $select.select2(option);
        self.initSelect2Event($select);

        const setTippyContent = (html) => {
            const $parent = $select.closest('.block-parameters__item');
            const $btnInfo = $parent.find('[btn="info"]');
            if ($btnInfo.length > 0) {
                if ($btnInfo[0]._tippy !== undefined) {
                    $btnInfo[0]._tippy.setProps({ content: html });
                } else if (typeof tippy !== 'undefined') {
                    tippy($btnInfo[0], { content: html, animation: 'fade', followCursor: true, arrow: false, allowHTML: true });
                }
            }
        };

        const selfIndicators = this;
        $select.on('select2:select', function () {
            const $el = $(this);
            const html = $el.val().length >= 1 ? selfIndicators.getSelectedHtmlInfo($el.select2('data')) : '<p class="tooltipe__text">Не выбрано</p>';
            setTippyContent(html);
        });
        $select.on('select2:unselect', function () {
            const $el = $(this);
            const $parent = $el.closest('.block-parameters__item');
            $parent.find('.dropdown').removeClass('error');
            const html = $el.val().length >= 1 ? selfIndicators.getSelectedHtmlInfo($el.select2('data')) : '<p class="tooltipe__text">Не выбрано</p>';
            setTippyContent(html);
        });

        if (self.inputData.length > 0) {
            let data;
            if (field.code === "ProdMe" || field.code === "SalesMe") {
                const volumeRCFF = self.inputData.find(item => Number(item.group) === 6);
                const volumeSales = self.inputData.find(item => Number(item.group) === 31);
                data = { group: '6', items: (volumeRCFF ? volumeRCFF.items : []).concat(volumeSales ? volumeSales.items : []) };
                $field.attr('field', "metal");
            } else {
                data = self.inputData.find(item => Number(item.group) === 26);
                $field.attr('field', "custom");
            }
            $field.attr('data-code', field.code);
            if (field.isRequired === true) {
                $field.find('.block-parameters__text').append(`<span style="color: red;"> *</span>`);
                $field.attr('required', "");
            }
            data = data && data.items ? data.items.map((item) => ({ id: Number(item.id), text: Number(item.id) + "#;" + item.name })) : [];
            if (data.length > 0) {
                $select.closest('.block-parameters__item').find('.warning__text').remove();
                $select.closest('.block-parameters__item').find('.dropdown').removeClass('warning__block');
            }
            $select.empty().select2({
                data: data,
                templateResult: formatState,
                templateSelection: formatSelected,
                width: '220px',
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
        }
        setTippyContent('<p class="tooltipe__text">Не выбрано</p>');
        return $field;
    }

    renderScenarioIndicators() {
        const self = this.prognoz;
        const $body = $('[block="scenarioIndicatorsRCFF"] .block-parameters__body');
        const $nav = $body.find('.scenarioIndicators__nav');
        const $content = $body.find('.scenarioIndicators__body');
        const $forecastDefault = $('[input="forecastDefault"]');
        let custIndex = 0;
        self.ModelBlockData.forEach((block) => {
            const fields = self.ScenarioIndicatorsData.filter(item => item.blockId === block.id);
            if (fields.length > 0) {

                const $tab = $(`<div class="tab__item" tabId="${block.id}">
                        <p class="tab__name">${block.name}</p>
                        </div>`);

                const $tabBlock = $(`<div class="tab__block" tabBlockId="${block.id}">
                        </div`);

                fields.forEach(field => {
                    const $selectField = self.getSelectField(field);
                    $tabBlock.append($selectField);
                });

                $tab.on('click', (e) => {
                    const $tab = $(e.currentTarget);
                    const $parent = $tab.closest('.block-parameters__body');
                    const blockId = $tab.attr('tabid');
                    $parent.find('.tab__item.tab__active').removeClass('tab__active');
                    $parent.find('.tab__block.tab__block-active').removeClass('tab__block-active');

                    $tab.addClass('tab__active');
                    $parent.find('.tab__block[tabblockid="' + blockId + '"]').addClass('tab__block-active');
                });

                if (custIndex === 0) {
                    $tab.addClass('tab__active');
                    $tabBlock.addClass('tab__block-active');
                }

                $nav.append($tab);
                $content.append($tabBlock);
                custIndex++;
            }
        });

        if (self.type === PrognozType.TYPE_0) {
            self.initForecastDefault();
            $forecastDefault.removeClass('Hidden');
        }
    }
}
