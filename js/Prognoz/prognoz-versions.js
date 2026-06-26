/**
 * Блок версий прогноза: рендер списка версий, кнопки удаления/подробнее.
 */
import { PrognozMessages } from './constants.js';

export class PrognozVersions {
    constructor(prognoz) {
        this.prognoz = prognoz;
    }

    renderBlockVersionsForecast() {
        const prognoz = this.prognoz;
        const $parent = $('.block-parameters[block="scenType"] .block-parameters__body');
        $parent.empty();
        $parent.append('<div class="waiter"></div');

        if (prognoz.inputData.length > 0) {
            let data = prognoz.inputData.find(item => Number(item.group) === 30);
            if (data !== undefined) {
                data = data.items;
                data.sort((a, b) => b.created - a.created);
            } else {
                data = [];
            }

            if (data.length > 0) {
                prognoz.renderVersions($parent, data);
            }
        }
    }

    renderVersions($parent, data) {
        const self = this.prognoz;

        data.forEach(item => {
            const $row = self.getVersionTemplate();
            const created = item.created?.toISOString();
            $row.attr('row-id', item.id);

            $row.find('[field="Name"] .RowItemName').text(item.id + ";" + item.name);
            $row.find('[field="Version"] .RowItemName').text(item.versionTypeName);

            if (item.created !== null) {
                $row.find('[field="DateCreation"] .RowItemName').text(item.created.toLocaleDateString('ru-Ru', { day: 'numeric', month: 'numeric', year: 'numeric' }));
            }

            const versionName = self.getTypeScenarioFromName(item.name);
            if (versionName !== "") {
                $row.attr('data-version', versionName);
            }
            if (created !== undefined) {
                $row.attr('data-created', created.split('T')[0]);
            }

            if (item.author === window.Reports.UserFullName || window.Reports.typeSuper === true) {
                $row.find('[rowBtn="removeRow"]').removeClass('Hidden');
            }

            self.addVersionsBtnEvent($row);

            const $tooltipes = $row.find('[tooltipe]');
            $tooltipes.each((index, element) => {
                const text = $(element).attr('tooltipe');
                tippy(element, {
                    content: '<p class="tooltipe__text">' + text + '</p>',
                    animation: 'fade',
                    followCursor: true,
                    arrow: false,
                    allowHTML: true,
                });
            });

            $parent.append($row);
        });
    }

    getTypeScenarioFromName(versionName) {
        const versionTypes = ["базовый", "пессимистичный", "оптимистичный"];
        const regex = new RegExp(versionTypes.join("|", "i"));
        const match = versionName.toLowerCase().match(regex);
        if (match) {
            return match[0].toLowerCase();
        }
        return "";
    }

    addVersionsBtnEvent($row) {
        const self = this.prognoz;
        const $removeBtn = $row.find('[rowBtn="removeRow"]');
        const $detailsBtn = $row.find('[rowBtn="details"]');

        $removeBtn.on('click', (e) => {
            const $btn = $(e.currentTarget);
            const $parent = $btn.closest('.ListRow');
            const scenarioName = $parent.find('.RowItemName').text();
            const scenarioID = $parent.attr('row-id');
            if (scenarioName !== "") {
                window.Reports.common.showDialog(`Вы действительно хотите удалить "${scenarioName}"?`, "Exclamation", () => {
                    window.Reports.prognozApi.prognozVersionDelete(scenarioID)
                        .then(x => this.handlePrognozVersionDeleteResponse(x, $parent, scenarioName, self));
                });
            }
        });

        $detailsBtn.on('click', (e) => {
            const $btn = $(e.currentTarget);
            const $parent = $btn.closest('.ListRow');
            const rowId = $parent.attr('row-id');
            if (!$btn.hasClass('disable')) {
                $btn.addClass('disable');
                self.detailsPopUp.openModal(rowId);
            }
        });
    }

    /** Обработчик ответа prognozVersionDelete: сообщение, удаление строки, перезагрузка. */
    handlePrognozVersionDeleteResponse(x, $parent, scenarioName, self) {
        if (x.status === "OK") {
            window.Reports.common.showDialog(PrognozMessages.SCENARIO_DELETED_FULL + scenarioName + PrognozMessages.SCENARIO_DELETED_FULL_SUFFIX);
            $parent.remove();
            self.loadingScenTypeData();
        } else {
            window.Reports.common.showDialog(x.message, "Error");
        }
    }
}
