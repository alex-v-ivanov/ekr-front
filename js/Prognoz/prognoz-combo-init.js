import { formatState, formatSelected } from './prognoz-utils.js';
import { PrognozType } from './constants.js';

/**
 * Инициализация комбо и общих обработчиков select2: initScenarioRCFFCombo, initScenarioRCFFIDCombo, initDefauilSelected, initScenarioUKCombo, initVersionRCFFCombo.
 */
export class PrognozComboInit {
    constructor(prognoz) {
        this.prognoz = prognoz;
    }

    initScenarioRCFFCombo($form) {
        const p = this.prognoz;
        const Reports = window.Reports;
        p.ScenariosPrognozComboSelected = $form.find('#scenarioRCFF');
        p.ScenariosPrognozComboSelected.select2({
            width: '100%',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });
        p.initSelect2Event(p.ScenariosPrognozComboSelected);

        p.ScenariosPrognozComboSelected.on('select2:select', (e) => {
            if ($(p.ScenariosPrognozComboSelected).val().length >= 1) {
                let selected;
                p.clearField();
                if (Array.isArray(e.params.data)) {
                    selected = e.params.data.find(el => el.selected === true);
                    selected = selected !== undefined ? selected.text : undefined;
                } else {
                    selected = e.params.data.text;
                }
                if (!selected) return;
                const id = selected.split('#;')[0];
                const name = selected.split('#;')[1];
                const $textId = $('.block-prognoz-id__input-scenarioRCFF');
                const currentScenario = p.ScenariosDataInfo.find(item => item.id === Number(id));
                if (p.type === PrognozType.TYPE_0) {
                    let isScenarioOwner = false;
                    const $stress_test_id = $('#stress_test_id');
                    const $stress_test_name = $('#stress_test_name');
                    let ScenariosNameId = "";
                    if (!p.ScenariosDefault.includes(name)) {
                        const nameParse = name.split('_');
                        if (nameParse.length >= 4) {
                            ScenariosNameId = nameParse[0] + "_" + nameParse[1];
                            $textId.text(ScenariosNameId);
                            $textId.attr('title', ScenariosNameId);
                            $stress_test_id.text(nameParse[2] + "_" + nameParse[3]);
                            $stress_test_id.attr('title', nameParse[2] + "_" + nameParse[3]);
                            $stress_test_name.val(nameParse.length === 5 ? nameParse[nameParse.length - 1] : '');
                        }
                    } else {
                        ScenariosNameId = name;
                        $textId.text(name);
                        $stress_test_id.text(p.GetPrognozRCFFIdUserInputValue());
                        $stress_test_name.val('');
                        p.initDefauilSelected();
                    }
                    if (ScenariosNameId !== "") {
                        let selectedindicatorbution = null;
                        const $scenarioRCFFID = $('#scenarioRCFFID');
                        let posOptions = null;
                        $scenarioRCFFID.find('option').each(function () {
                            const optName = $(this).text().split('#;')[1];
                            if (optName === ScenariosNameId) {
                                posOptions = Number($(this).text().split('#;')[0]);
                                selectedindicatorbution = { id: posOptions, text: posOptions + "#;" + ScenariosNameId };
                                return false;
                            }
                        });
                        if (selectedindicatorbution !== null) {
                            $scenarioRCFFID.val([posOptions]).trigger('change');
                            const ev = $.Event('select2:select');
                            ev.params = { data: selectedindicatorbution };
                            $scenarioRCFFID.trigger(ev);
                        }
                    }
                    const $SaveBtn = $('#SaveBtn');
                    if (currentScenario !== undefined && currentScenario.scenarioOwner.toLowerCase() === Reports.UserName.toLowerCase()) isScenarioOwner = true;
                    if (!p.ScenariosDefault.includes(name) && (Reports.typeSuper || isScenarioOwner)) {
                        $('#DeleteBtn').removeClass('Disabled');
                    }
                    if (Reports.typeSuper || isScenarioOwner) {
                        $SaveBtn.removeClass('Disabled');
                    }
                } else {
                    $textId.text(name);
                    $textId.attr('title', name);
                    if (p.ScenariosDefault.includes(name)) p.initDefauilSelected();
                }
                const scenario = p.ScenariosDataInfo.find(item => item.id === Number(id));
                if (scenario !== undefined && p.type === PrognozType.TYPE_0) {
                    p.HorizonFrom.selectDate(scenario.horizonFrom, { silent: true });
                    p.HorizonTo.selectDate(scenario.horizonTo, { silent: true });
                    p.HorizonTo.update({
                        minDate: scenario.horizonFrom,
                        maxDate: new Date(scenario.horizonFrom.getFullYear() + 10, scenario.horizonFrom.getMonth(), scenario.horizonFrom.getDate()),
                    });
                    p.HorizonFrom.setViewDate(scenario.horizonFrom);
                    p.HorizonTo.setViewDate(scenario.horizonTo);
                }
                p.updateIDInfo();
                p.fillScenarioField(Number(id));
            }
            $('.error__message').remove();
            if (p.ForecastDefaultComboSelected !== undefined) {
                p.ForecastDefaultComboSelected.trigger($.Event('select2:unselect'));
                p.ForecastDefaultComboSelected.val(null).trigger('change');
            }
        });

        p.ScenariosPrognozComboSelected.on('select2:unselecting', () => {
            const $textId = $('.block-prognoz-id__input-scenarioRCFF');
            const $stress_test_id = $('#stress_test_id');
            const $stress_test_name = $('#stress_test_name');
            $textId.text('');
            $stress_test_id.text(p.GetPrognozRCFFIdUserInputValue());
            $stress_test_name.val('');
            if (p.type === PrognozType.TYPE_0) {
                p.HorizonFrom.clear();
                p.HorizonTo.clear();
            }
            $('#DeleteBtn').addClass('Disabled');
            $('#SaveBtn').addClass('Disabled');
            p.updateIDInfo();
            p.clearField();
            $('.error__message').remove();
            if (p.ForecastDefaultComboSelected !== undefined) {
                p.ForecastDefaultComboSelected.trigger($.Event('select2:unselect'));
                p.ForecastDefaultComboSelected.val(null).trigger('change');
            }
        });
        p.loadingScenariosPrognozData();
    }

    initScenarioRCFFIDCombo($form) {
        const p = this.prognoz;
        p.scenarioRCFFIDComboSelected = $form.find('#scenarioRCFFID');
        const option = {
            width: '150px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        };
        if (p.type !== 0) {
            option.disabled = true;
            p.scenarioRCFFIDComboSelected.closest('label').addClass('selected__disabled');
        }
        p.scenarioRCFFIDComboSelected.select2(option);
        p.initSelect2Event(p.scenarioRCFFIDComboSelected);
        p.scenarioRCFFIDComboSelected.empty().select2({
            data: [
                { id: 1, text: "1#;RCFF_Базовый" },
                { id: 2, text: "2#;RCFF_Оптимистичный" },
                { id: 3, text: "3#;RCFF_Стрессовый" },
            ],
            templateResult: formatState,
            templateSelection: formatSelected,
            width: '150px',
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
        });
        p.scenarioRCFFIDComboSelected.on('select2:select', (e) => {
            if ($(p.scenarioRCFFIDComboSelected).val().length >= 1) {
                let selected = Array.isArray(e.params.data) ? (e.params.data.find(el => el.selected === true)?.text) : e.params.data.text;
                if (selected) {
                    const $text = $('.block-prognoz-id__input-scenarioRCFF');
                    $text.text(selected.split('#;')[1]);
                    $text.attr('title', selected.split('#;')[1]);
                    p.updateIDInfo();
                }
            }
        });
    }

    initDefauilSelected() {
        const p = this.prognoz;
        const optionsInflationProp = p.inflationPropComboSelected.find('option');
        let selectedInflationProp = null;
        optionsInflationProp.each(function () {
            const text = $(this).text().split('#;');
            const name = text[1];
            const id = text[0];
            if (name === 'Россия инфляция по итогам календарного года') {
                selectedInflationProp = { id: id, text: id + "#;" + name };
                return false;
            }
        });
        if (selectedInflationProp !== null) {
            p.inflationPropComboSelected.val([selectedInflationProp.id]).trigger('change');
            const ev = $.Event('select2:select');
            ev.params = { data: selectedInflationProp };
            p.inflationPropComboSelected.trigger(ev);
        }
    }

    initScenarioUKCombo($form) {
        const p = this.prognoz;
        p.ScenarioUKSelect = $form.find('#scenarioUK');
        p.ScenarioUKSelect.select2({
            width: '220px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });
        p.initSelect2Event(p.ScenarioUKSelect);
        p.ScenarioUKSelect.on('select2:select', (e) => {
            if ($(p.ScenarioUKSelect).val().length >= 1) {
                let selected = Array.isArray(e.params.data) ? (e.params.data.find(el => el.selected === true)?.text) : e.params.data.text;
                if (selected) {
                    const id = selected.split('#;')[0];
                    const scenarioUK = p.scenarioUKData.find(item => item.id === Number(id));
                    if (scenarioUK !== undefined) {
                        const scenarioBuilder = p.scenarioBuilder.find(item => item.guid === scenarioUK.guid);
                        if (scenarioBuilder !== undefined) {
                            const activeParans = scenarioBuilder.params.filter(item => item.status === true);
                            let html = '';
                            if (scenarioBuilder.activeFrom !== "") {
                                html += `<p class="tooltipe__text">Действует с ${scenarioBuilder.activeFrom?.split('-').reverse().join('.')} по ${scenarioBuilder.periodBy?.split('-').reverse().join('.')}</p>`;
                            }
                            activeParans.forEach(item => { html += `<p class="tooltipe__text">- ${item.name}</p>`; });
                            if (html === "") html = '<p class="tooltipe__text">Нет данных</p>';
                            const $parent = $(p.ScenarioUKSelect).closest('.block-parameters__box');
                            const $btnInfo = $parent.find('[btn="info"]');
                            if ($btnInfo[0]._tippy !== undefined) $btnInfo[0]._tippy.setProps({ content: html });
                            else if (typeof tippy !== 'undefined') tippy($btnInfo[0], { content: html, animation: 'fade', followCursor: true, arrow: false, allowHTML: true });
                        }
                    }
                }
            }
        });
        p.ScenarioUKSelect.on('select2:unselect', () => {
            const $parent = $(p.ScenarioUKSelect).closest('.block-parameters__box');
            const $btnInfo = $parent.find('[btn="info"]');
            const html = '<p class="tooltipe__text">Нет данных</p>';
            if ($btnInfo[0]._tippy !== undefined) $btnInfo[0]._tippy.setProps({ content: html });
            else if (typeof tippy !== 'undefined') tippy($btnInfo[0], { content: html, animation: 'fade', followCursor: true, arrow: false, allowHTML: true });
        });
        p.loadingScenarioUKData();
    }

    initVersionRCFFCombo($form) {
        const p = this.prognoz;
        const Reports = window.Reports;
        p.VersionComboSelected = $form.find('#versionRCFF');
        p.VersionComboSelected.select2({
            width: '200px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });
        p.initSelect2Event(p.VersionComboSelected);
        p.VersionComboSelected.on('select2:select', (e) => {
            if ($(p.VersionComboSelected).val().length >= 1) {
                let selected = Array.isArray(e.params.data) ? (e.params.data.find(el => el.selected === true)?.text) : e.params.data.text;
                if (!selected) return;
                const id = selected.split('#;')[0];
                const text = selected.split('#;')[1];
                const $input = $('.block-prognoz-id__input-scenarioRCFF');
                const splitVersion = text.split('_');
                if (splitVersion.length > 8) {
                    const $userName = $('.block-prognoz-id__input-user');
                    if ($userName.length > 0) {
                        const userNameText = $userName.text();
                        const lastRecalcName = splitVersion[splitVersion.length - 1];
                        const lastRecalcNumber = lastRecalcName.split('#')[1];
                        $userName.text(userNameText.slice(0, -1) + (Number(lastRecalcNumber) + 1));
                        $userName.attr('title', $userName.text());
                        $input.text(splitVersion.slice(0, 6).reduce((acc, cur) => acc === '' ? cur : acc + "_" + cur, ''));
                        $input.attr('title', $input.text());
                    }
                } else {
                    $input.text(text);
                    $input.attr('title', text);
                }
                p.updateIDInfo();
                p.clearField();
                p.fillVersionField(Number(id));
                if (p.type === PrognozType.TYPE_1) {
                    const varsionData = p.inputData.find(item => Number(item.group) === 30);
                    const versionItem = varsionData && varsionData.items.find(item => item.id === id);
                    if (versionItem !== undefined) {
                        if (versionItem.horizonFrom !== null && versionItem.horizonTo !== null) {
                            p.HorizonFrom.selectDate(versionItem.horizonFrom, { silent: true });
                            p.HorizonTo.selectDate(versionItem.horizonTo, { silent: true });
                            p.HorizonTo.update({
                                minDate: versionItem.horizonFrom,
                                maxDate: new Date(versionItem.horizonFrom.getFullYear() + 10, versionItem.horizonFrom.getMonth(), versionItem.horizonFrom.getDate()),
                            });
                            p.HorizonFrom.setViewDate(versionItem.horizonFrom);
                            p.HorizonTo.setViewDate(versionItem.horizonTo);
                        }
                        if (versionItem.depthFrom !== null && versionItem.depthTo !== null) {
                            p.DepthFrom.selectDate(versionItem.depthFrom, { silent: true });
                            p.DepthTo.selectDate(versionItem.depthTo, { silent: true });
                            p.DepthFrom.update({
                                minDate: new Date(versionItem.depthTo.getFullYear() - 5, versionItem.depthTo.getMonth(), versionItem.depthTo.getDate()),
                                maxDate: versionItem.depthTo,
                            });
                            p.DepthFrom.setViewDate(versionItem.depthFrom);
                            p.DepthTo.setViewDate(versionItem.depthTo);
                        }
                        if (versionItem.isManage !== undefined) {
                            $("#isManage").prop("checked", versionItem.isManage !== "");
                        }
                    }
                }
            }
        });
        p.VersionComboSelected.on('select2:unselect', () => {
            const $input = $('.block-prognoz-id__input-scenarioRCFF');
            $input.text("");
            $input.attr('title', "");
            p.updateIDInfo();
            p.clearField();
            if (p.type === PrognozType.TYPE_1) {
                const $userName = $('.block-prognoz-id__input-user');
                $userName.text($userName.text().slice(0, -1) + 3);
                $userName.attr('title', $userName.text());
                if (p.dtCloseKFO !== null) {
                    const dateKFO = new Date(p.dtCloseKFO);
                    p.HorizonTo.update({
                        minDate: new Date(dateKFO.getFullYear(), dateKFO.getMonth() + 2, dateKFO.getDate()).toISOString().split('T')[0],
                        maxDate: new Date(dateKFO.getFullYear() + 10, dateKFO.getMonth() + 1, dateKFO.getDate()).toISOString().split('T')[0],
                    });
                    p.DepthFrom.clear();
                    p.DepthTo.clear();
                    p.HorizonFrom.clear();
                    p.HorizonTo.clear();
                    $("#isManage").prop('checked', true);
                }
            }
        });
    }

    initSelect2Event($el) {
        const prognoz = this.prognoz;
        $el.on('select2:open', function (e) {
            const $input = $(this);
            const $parent = $input.closest('.dropdown');
            const $dropdownBtn = $parent.find('svg');
            if ($dropdownBtn.length > 0) {
                $dropdownBtn.css('transform', 'rotate(180deg)');
            }
        });

        $el.on('select2:select', function (e) {
            const $field = $(this).closest('.block-parameters__item');
            const fieldName = $field.attr('field');
            const select2Data = $(this).data('select2');
            const maxSelectionLength = select2Data.results.data.maximumSelectionLength;
            const allItems = select2Data.results.data._dataToConvert !== undefined ? select2Data.results.data._dataToConvert.length : 0;

            if (prognoz.type === PrognozType.TYPE_0 || fieldName == undefined || fieldName == "scenarioUk") {
                if ($(this).val().length >= maxSelectionLength || $(this).val().length >= allItems) {
                    $(this).next('.select2-container').find('.select2-search--inline').hide();
                }
            } else {
                if (["metal", "macro", "custom"].includes(fieldName)) {
                    $(this).next('.select2-container').find('.select2-search--inline').hide();
                }
            }
        });

        $el.on('select2:close', function (e) {
            const $input = $(this);
            const $parent = $input.closest('.dropdown');
            const $dropdownBtn = $parent.find('svg');
            const select2Data = $(this).data('select2');
            const $field = $(this).closest('.block-parameters__item');
            const fieldName = $field.attr('field');
            const maxSelectionLength = select2Data.results.data.maximumSelectionLength;
            const allItems = select2Data.results.data._dataToConvert !== undefined ? select2Data.results.data._dataToConvert.length : 0;

            if (prognoz.type === PrognozType.TYPE_0 || fieldName == undefined || fieldName == "scenarioUk") {
                if ($(this).val().length >= maxSelectionLength || $(this).val().length >= allItems) {
                    $(this).next('.select2-container').find('.select2-search--inline').hide();
                }
            } else {
                if (["metal", "macro", "custom"].includes(fieldName)) {
                    $(this).next('.select2-container').find('.select2-search--inline').hide();
                }
            }

            if ($dropdownBtn.length > 0) {
                $dropdownBtn.css('transform', 'rotate(0deg)');
            }
        });

        $el.on('select2:unselect', function (e) {
            const select2Data = $(this).data('select2');
            const $field = $(this).closest('.block-parameters__item');
            const fieldName = $field.attr('field');
            const maxSelectionLength = select2Data.results.data.maximumSelectionLength;
            const allItems = select2Data.results.data._dataToConvert !== undefined ? select2Data.results.data._dataToConvert.length : 0;

            if (prognoz.type === PrognozType.TYPE_0 || fieldName == undefined) {
                if ($(this).val().length < maxSelectionLength || $(this).val().length <= allItems) {
                    $(this).next('.select2-container').find('.select2-search--inline').show();
                }
            } else {
                if (["metal", "macro", "custom"].includes(fieldName)) {
                    $(this).next('.select2-container').find('.select2-search--inline').show();
                }
            }
        });
    }
}
