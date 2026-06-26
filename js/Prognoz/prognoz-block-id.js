/**
 * Блок ID сценария/версии прогноза: обновление подсказки ID и формат отображаемого ID.
 * Получает ссылку на фасад prognoz.
 */
import { PrognozType } from './constants.js';
import { PrognozMessages } from './constants.js';

export class PrognozBlockId {
    constructor(prognoz) {
        this.prognoz = prognoz;
    }

    renderBlockPrognozid() {
        const self = this.prognoz;
        const $parent = $(".block-prognoz-id");

        switch (self.type) {
            case PrognozType.TYPE_0: {
                const $formScenario = $(`
                            <div class="page__block block-prognoz-id" role="prognozTestId" style=" width: max-content; flex-shrink: 0; ">
                                <span style="max-width: 250px;text-wrap: nowrap;" class="Label">ID сценария прогноза RCFF</span>
                                <div style="display: flex; gap: 0.5rem; align-items: center;">
                                    <div class="block-prognoz-id__input">
                                        <div mode="view" class="" style="display: flex;">
                                                <span class="block-prognoz-id__input-scenarioRCFF"></span>
                                        </div>
                                        <div mode="editor" class="Hidden" style="display: flex;">
                                            <label class="dropdown" style="border: unset;padding: unset; height: 1rem;">
                                                <select id="scenarioRCFFID"></select>
                                                <svg width="18" height="18" viewBox="0 0 32 32" fill="#004C97"
                                                    xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M26.7074 12.7075L16.7074 22.7075C16.6146 22.8005 16.5043 22.8742 16.3829 22.9246C16.2615 22.9749 16.1314 23.0008 15.9999 23.0008C15.8685 23.0008 15.7384 22.9749 15.617 22.9246C15.4956 22.8742 15.3853 22.8005 15.2924 22.7075L5.29245 12.7075C5.1048 12.5199 4.99939 12.2654 4.99939 12C4.99939 11.7346 5.1048 11.4801 5.29245 11.2925C5.48009 11.1049 5.73458 10.9995 5.99995 10.9995C6.26531 10.9995 6.5198 11.1049 6.70745 11.2925L15.9999 20.5863L25.2924 11.2925C25.3854 11.1996 25.4957 11.1259 25.6171 11.0756C25.7384 11.0253 25.8686 10.9995 25.9999 10.9995C26.1313 10.9995 26.2614 11.0253 26.3828 11.0756C26.5042 11.1259 26.6145 11.1996 26.7074 11.2925C26.8004 11.3854 26.8741 11.4957 26.9243 11.6171C26.9746 11.7385 27.0005 11.8686 27.0005 12C27.0005 12.1314 26.9746 12.2615 26.9243 12.3829C26.8741 12.5043 26.8004 12.6146 26.7074 12.7075Z" />
                                                </svg>
                                            </label>
                                        </div>
                                        -
                                        <p id="stress_test_id" class="block-prognoz-id__text">${self.GetPrognozRCFFIdUserInputValue()}</p>
                                        –
                                        <input type="text" placeholder="Маркер" autocomplete="off" id="stress_test_name" style="max-width: 90px;">
                                    </div>
                                    <div mode="view" class="" style="display: flex;">
                                        <svg rowbtn="editeRow" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Редактировать" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M28.415 9.17125L22.8288 3.58625C22.643 3.40049 22.4225 3.25313 22.1799 3.15259C21.9372 3.05205 21.6771 3.00031 21.4144 3.00031C21.1517 3.00031 20.8916 3.05205 20.6489 3.15259C20.4062 3.25313 20.1857 3.40049 20 3.58625L4.58626 19C4.39973 19.185 4.25185 19.4053 4.15121 19.648C4.05057 19.8907 3.99917 20.151 4.00001 20.4138V26C4.00001 26.5304 4.21072 27.0391 4.5858 27.4142C4.96087 27.7893 5.46958 28 6.00001 28H27C27.2652 28 27.5196 27.8946 27.7071 27.7071C27.8947 27.5196 28 27.2652 28 27C28 26.7348 27.8947 26.4804 27.7071 26.2929C27.5196 26.1054 27.2652 26 27 26H14.415L28.415 12C28.6008 11.8143 28.7481 11.5938 28.8487 11.3511C28.9492 11.1084 29.001 10.8483 29.001 10.5856C29.001 10.3229 28.9492 10.0628 28.8487 9.82016C28.7481 9.57747 28.6008 9.35698 28.415 9.17125ZM11.5863 26H6.00001V20.4138L17 9.41375L22.5863 15L11.5863 26ZM24 13.5863L18.415 8L21.415 5L27 10.5863L24 13.5863Z"></path>
                                        </svg>
                                    </div>
                                    <div mode="editor" class="Hidden" style="display: flex;">
                                        <svg rowbtn="saveRow" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Сохранить" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M28.7074 9.70751L12.7074 25.7075C12.6146 25.8005 12.5043 25.8742 12.3829 25.9246C12.2615 25.9749 12.1314 26.0008 11.9999 26.0008C11.8685 26.0008 11.7384 25.9749 11.617 25.9246C11.4956 25.8742 11.3853 25.8005 11.2924 25.7075L4.29245 18.7075C4.1048 18.5199 3.99939 18.2654 3.99939 18C3.99939 17.7346 4.1048 17.4801 4.29245 17.2925C4.48009 17.1049 4.73458 16.9994 4.99995 16.9994C5.26531 16.9994 5.5198 17.1049 5.70745 17.2925L11.9999 23.5863L27.2924 8.29251C27.4801 8.10487 27.7346 7.99945 27.9999 7.99945C28.2653 7.99945 28.5198 8.10487 28.7074 8.29251C28.8951 8.48015 29.0005 8.73464 29.0005 9.00001C29.0005 9.26537 28.8951 9.51987 28.7074 9.70751Z" />
                                        </svg>
                                    </div>
                                    <svg btn="IDInfo" width="24" height="24" viewBox="0 0 32 32" fill="#004C97" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M16 3C13.4288 3 10.9154 3.76244 8.77759 5.1909C6.63975 6.61935 4.97351 8.64968 3.98957 11.0251C3.00563 13.4006 2.74819 16.0144 3.2498 18.5362C3.75141 21.0579 4.98953 23.3743 6.80762 25.1924C8.6257 27.0105 10.9421 28.2486 13.4638 28.7502C15.9856 29.2518 18.5995 28.9944 20.9749 28.0104C23.3503 27.0265 25.3807 25.3603 26.8091 23.2224C28.2376 21.0846 29 18.5712 29 16C28.9964 12.5533 27.6256 9.24882 25.1884 6.81163C22.7512 4.37445 19.4467 3.00364 16 3ZM16 27C13.8244 27 11.6977 26.3549 9.88873 25.1462C8.07979 23.9375 6.66989 22.2195 5.83733 20.2095C5.00477 18.1995 4.78693 15.9878 5.21137 13.854C5.63581 11.7202 6.68345 9.7602 8.22183 8.22183C9.76021 6.68345 11.7202 5.6358 13.854 5.21136C15.9878 4.78692 18.1995 5.00476 20.2095 5.83733C22.2195 6.66989 23.9375 8.07979 25.1462 9.88873C26.3549 11.6977 27 13.8244 27 16C26.9967 18.9164 25.8367 21.7123 23.7745 23.7745C21.7123 25.8367 18.9164 26.9967 16 27ZM18 22C18 22.2652 17.8946 22.5196 17.7071 22.7071C17.5196 22.8946 17.2652 23 17 23C16.4696 23 15.9609 22.7893 15.5858 22.4142C15.2107 22.0391 15 21.5304 15 21V16C14.7348 16 14.4804 15.8946 14.2929 15.7071C14.1054 15.5196 14 15.2652 14 15C14 14.7348 14.1054 14.4804 14.2929 14.2929C14.4804 14.1054 14.7348 14 15 14C15.5304 14 16.0391 14.2107 16.4142 14.5858C16.7893 14.9609 17 15.4696 17 16V21C17.2652 21 17.5196 21.1054 17.7071 21.2929C17.8946 21.4804 18 21.7348 18 22ZM14 10.5C14 10.2033 14.088 9.91332 14.2528 9.66665C14.4176 9.41997 14.6519 9.22771 14.926 9.11418C15.2001 9.00065 15.5017 8.97094 15.7926 9.02882C16.0836 9.0867 16.3509 9.22956 16.5607 9.43934C16.7704 9.64912 16.9133 9.91639 16.9712 10.2074C17.0291 10.4983 16.9994 10.7999 16.8858 11.074C16.7723 11.3481 16.58 11.5824 16.3334 11.7472C16.0867 11.912 15.7967 12 15.5 12C15.1022 12 14.7206 11.842 14.4393 11.5607C14.158 11.2794 14 10.8978 14 10.5Z"></path>
                                    </svg>
                                </div>
                            </div>
                            <div class="page__block block-prognoz-id" style="justify-content: flex-end;">
                                <div onclick="Reports.Prognoz.helpPopUp.openModal();" class="Button Outline" style="width: 140px; text-decoration: none;">
                                    <p class="Text">Помощь</p>
                                </div>
                                <div class="Rectangle1" style="width: 2px; height: 20px; background: #ccd0d4; border-radius: 10px"></div>
                                <div id="SaveBtn" class="Button Primary Disabled" style="width: 140px" title="Изменить" onclick="Reports.Prognoz.ScenSave()" tooltipe="Изменить выбранный сценарий">
                                    <div class="Text"><div>Изменить</div></div>
                                </div>
                                <div id="SaveAsBtn" class="Button Primary" style="width: 140px" title="Создать" onclick="Reports.Prognoz.ScenSaveAs()" tooltipe="Создание нового сценария">
                                    <div class="Text"><div>Создать</div></div>
                                </div>
                                <div id="DeleteBtn" class="Button Outline Disabled" style="width: 140px" title="Удалить" onclick="Reports.Prognoz.DeleteScenarioRCFF()">
                                    <div class="Text"><div>Удалить</div></div>
                                </div>
                            </div>
                        `);
                self.initScenarioRCFFIDCombo($formScenario);
                const $editBtn = $formScenario.find('[rowbtn="editeRow"]');
                const $saveBtn = $formScenario.find('[rowbtn="saveRow"]');
                const $marker = $formScenario.find('#stress_test_name');
                $editBtn.on('click', (e) => {
                    const $parent = $(e.currentTarget).closest('.block-prognoz-id');
                    $parent.find('[mode="view"]').addClass("Hidden");
                    $parent.find('[mode="editor"]').removeClass("Hidden");
                });
                $saveBtn.on('click', (e) => {
                    const $parent = $(e.currentTarget).closest('.block-prognoz-id');
                    $parent.find('[mode="view"]').removeClass("Hidden");
                    $parent.find('[mode="editor"]').addClass("Hidden");
                });
                $marker.on('input', (e) => {
                    const input = e.currentTarget;
                    if (input.value.includes('_')) input.value = input.value.replaceAll('_', '');
                    self.updateIDInfo();
                });
                $parent.append($formScenario);
                self.updateIDInfo();
                break;
            }
            case PrognozType.TYPE_1:
            case PrognozType.TYPE_2: {
                const userID = self.getCurrentUserId();
                const Reports = window.Reports;
                const $form = $(`
                            <div class="page__block block-prognoz-id" role="prognozTestId" style="width: 45%;flex-shrink: 0;">
                                ${self.type === PrognozType.TYPE_2 ?
                                    `<span style="max-width: 250px;text-wrap: nowrap;" class="Label">ID версии прогноза</span>
                                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                                        <div class="block-prognoz-id__input">
                                            <input type="text" placeholder="Маркер" autocomplete="off" id="marker" style="max-width: 100px;"> -
                                            <span class="block-prognoz-id__input-scenarioRCFF text__blockId"></span> -
                                            <p class="block-prognoz-id__text text__blockId" title="${userID}#2">${userID}#2</p>
                                        </div>
                                    </div>` :
                                    `<span style="max-width: 250px;text-wrap: nowrap;" class="Label">ID версии прогноза</span>
                                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                                        <div class="block-prognoz-id__input" style="min-width: 13.75rem;">
                                            <span class="block-prognoz-id__input-scenarioRCFF text__blockId"></span> -
                                            <span class="block-prognoz-id__input-user" title="ver2_${userID}#3">ver2_${userID}#3</span>
                                        </div>
                                    </div>`
                                }
                                <svg btn="IDInfo" width="24" height="24" viewBox="0 0 32 32" fill="#004C97" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 3C13.4288 3 10.9154 3.76244 8.77759 5.1909C6.63975 6.61935 4.97351 8.64968 3.98957 11.0251C3.00563 13.4006 2.74819 16.0144 3.2498 18.5362C3.75141 21.0579 4.98953 23.3743 6.80762 25.1924C8.6257 27.0105 10.9421 28.2486 13.4638 28.7502C15.9856 29.2518 18.5995 28.9944 20.9749 28.0104C23.3503 27.0265 25.3807 25.3603 26.8091 23.2224C28.2376 21.0846 29 18.5712 29 16C28.9964 12.5533 27.6256 9.24882 25.1884 6.81163C22.7512 4.37445 19.4467 3.00364 16 3ZM16 27C13.8244 27 11.6977 26.3549 9.88873 25.1462C8.07979 23.9375 6.66989 22.2195 5.83733 20.2095C5.00477 18.1995 4.78693 15.9878 5.21137 13.854C5.63581 11.7202 6.68345 9.7602 8.22183 8.22183C9.76021 6.68345 11.7202 5.6358 13.854 5.21136C15.9878 4.78692 18.1995 5.00476 20.2095 5.83733C22.2195 6.66989 23.9375 8.07979 25.1462 9.88873C26.3549 11.6977 27 13.8244 27 16C26.9967 18.9164 25.8367 21.7123 23.7745 23.7745C21.7123 25.8367 18.9164 26.9967 16 27ZM18 22C18 22.2652 17.8946 22.5196 17.7071 22.7071C17.5196 22.8946 17.2652 23 17 23C16.4696 23 15.9609 22.7893 15.5858 22.4142C15.2107 22.0391 15 21.5304 15 21V16C14.7348 16 14.4804 15.8946 14.2929 15.7071C14.1054 15.5196 14 15.2652 14 15C14 14.7348 14.1054 14.4804 14.2929 14.2929C14.4804 14.1054 14.7348 14 15 14C15.5304 14 16.0391 14.2107 16.4142 14.5858C16.7893 14.9609 17 15.4696 17 16V21C17.2652 21 17.5196 21.1054 17.7071 21.2929C17.8946 21.4804 18 21.7348 18 22ZM14 10.5C14 10.2033 14.088 9.91332 14.2528 9.66665C14.4176 9.41997 14.6519 9.22771 14.926 9.11418C15.2001 9.00065 15.5017 8.97094 15.7926 9.02882C16.0836 9.0867 16.3509 9.22956 16.5607 9.43934C16.7704 9.64912 16.9133 9.91639 16.9712 10.2074C17.0291 10.4983 16.9994 10.7999 16.8858 11.074C16.7723 11.3481 16.58 11.5824 16.3334 11.7472C16.0867 11.912 15.7967 12 15.5 12C15.1022 12 14.7206 11.842 14.4393 11.5607C14.158 11.2794 14 10.8978 14 10.5Z"></path>
                                </svg>
                            </div>
                            <div class="page__block block-prognoz-id" style="justify-content: flex-end;">
                                ${self.type !== PrognozType.TYPE_1 ? `<div onclick="Reports.Prognoz.helpPopUp.openModal();" class="Button Outline" style="width: 140px; text-decoration: none;"><p class="Text">Помощь</p></div>
                                <div class="Rectangle1" style="width: 2px; height: 20px; background: #ccd0d4; border-radius: 10px"></div>` : ''}
                                <div id="AutoStoriesBtn" class="Button Outline" style="width: 140px" title="Журнал" onclick="Reports.GoToJournal(2)"><div class="Text"><div>Журнал расчета</div></div></div>
                                ${self.type === PrognozType.TYPE_1 && (Reports.typeModel === true || Reports.typeSuper === true) ? `<div onclick="Reports.Prognoz.UpdateInterface(2)" class="Button Outline" style="width: 220px"><div class="Text"><div>Расширенная версия</div></div></div>` : ''}
                                ${self.type === PrognozType.TYPE_2 ? `<div onclick="Reports.Prognoz.UpdateInterface(3)" class="Button Outline" style="width: 220px"><div class="Text"><div>Управление версиями</div></div></div>` : ''}
                                ${self.type === PrognozType.TYPE_2 ? `<div onclick="Reports.Prognoz.UpdateInterface(1)" class="Button Outline" style="width: 140px" title="Перерасчет"><div class="Text"><div>Перерасчет</div></div></div>` : ''}
                                <div class="Rectangle1" style="width: 2px; height: 20px; background: #ccd0d4; border-radius: 10px"></div>
                                <div onclick="Reports.Prognoz.Calculate()" class="Button Primary" style="width: 220px"><div class="Text"><div>Рассчитать</div></div></div>
                            </div>
                        `);
                const $marker2 = $form.find('#marker');
                $parent.append($form);
                $marker2.on('input', (e) => {
                    const input = e.currentTarget;
                    if (input.value.includes('_')) input.value = input.value.replaceAll('_', '');
                    self.updateIDInfo();
                });
                self.updateIDInfo();
                break;
            }
            default:
                window.Reports.common.showDialog(PrognozMessages.COULD_NOT_DETERMINE_SCENARIO);
        }
    }

    updateIDInfo() {
        const self = this.prognoz;
        const $btn = $('[btn="IDInfo"]');
        let title = "";
        if (self.type === PrognozType.TYPE_0) {
            const $scenarioRCFF = $('.block-prognoz-id__input-scenarioRCFF');
            const $userId = $('#stress_test_id');
            const $version = $('#stress_test_name');
            title = $scenarioRCFF.text() + "_" + $userId.text() + "_" + $version.val();
        } else if (self.type === PrognozType.TYPE_1) {
            const $scenarioRCFF = $('.block-prognoz-id__input-scenarioRCFF.text__blockId');
            const $userId = $('.block-prognoz-id__input-user');
            title = $scenarioRCFF.text() + "_" + $userId.text();
        } else if (self.type === PrognozType.TYPE_2) {
            const $marker = $('#marker');
            const $scenarioRCFF = $('.block-prognoz-id__input-scenarioRCFF.text__blockId');
            const $textId = $('.block-prognoz-id__text.text__blockId');
            title = $marker.val() + "_" + $scenarioRCFF.text() + "_" + $textId.text();
        }

        const html = `<p class="tooltipe__text" style="max-width: 500px; height: 100%;overflow-wrap: break-word; white-space: normal; hyphens: auto;">${title}</p>`;
        if ($btn[0]._tippy !== undefined) {
            $btn[0]._tippy.setProps({
                content: html,
                maxWidth: 500,
            });
        } else {
            tippy($btn[0], {
                content: html,
                maxWidth: 500,
                animation: 'fade',
                followCursor: true,
                arrow: false,
                allowHTML: true,
            });
        }
    }

    GetPrognozRCFFIdUserInputValue() {
        const Reports = window.Reports;
        let dt = new Date();
        return `${dt.getDate().toString().padStart(2, '0')}${(dt.getMonth() + 1).toString().padStart(2, '0')}${dt.getFullYear().toString().slice(2)}_${Reports.UserName}`;
    }
}
