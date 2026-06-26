/**
 * Контроллер журнала: связь Model и View, обработка событий.
 */

import { JournalApiModel } from '../models/JournalApiModel.js';
import { JournalView } from '../views/JournalView.js';
import { JournalCardsView } from '../views/JournalCardsView.js';
import { JournalFiltersView } from '../views/JournalFiltersView.js';
import { JournalDetailsView } from '../views/JournalDetailsView.js';
import { ApiStatus } from '../../Common/constants.js';
import { dateRU } from "../utils/journal-utils.js";

export class JournalController {
    constructor(model, report) {
        this.model = model;
        this.report = report;

        // Инициализация представлений
        this.view = new JournalView();
        this.cardsView = new JournalCardsView(this.model);
        this.apiModel = new JournalApiModel(this.report.config);

        // Фильтры и детали инициализируем после создания контроллера
        this.filtersView = null;
        this.detailsView = null;
    }

    initFiltersAndDetails() {
        this.filtersView = new JournalFiltersView(this.model, this);
        this.detailsView = new JournalDetailsView(this.model, this);
    }

    init() {

        this.view.init();

        this.model.type = this.report.urlPars.type;

        if (this.model.isStressType()) {
            this.view.setStressTheme();
        }

        const dt = new Date();
        const currentDate = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0);
        this.model.setDateFrom(this.view.initDateTimePicker("DateFrom", currentDate));

        this.initFiltersAndDetails();

        this.filtersView.initUser();
        this.filtersView.initCreationDatePicker();

        this.getData();

        this.view.initDropdownEvent();
        this.view.initTooltips();

        this.initDetailsButtonListener();

        this.initModalCloseHandler();
        
    }

    initDetailsButtonListener() {
        $(document).on('click', '.details-btn', (e) => {
            const $btn = $(e.currentTarget);
            const versionId = $btn.data('version-id');
            this.openDetails(versionId);
        });
    }

    getData(isUpdate) {
        if (!this.model.isStressType() && !this.model.isPrognozType()) return;

        const dateFrom = this.model.getDateFromValue()

        this.apiModel.fetchJournalData(this.model.getType(), dateFrom)
            .then(response => this.handleDataResponse(response, isUpdate));
    }

    handleDataResponse(response, isUpdate) {
        if (response === ApiStatus.ERROR_LOWER) {
            this.view.hideWaiter("getData");
            this.model.clearDataInterval();
            return;
        }

        if (response && response.faultstring && response.faultstring.length > 0) {
            this.view.hideWaiter("getData");
            this.model.clearDataInterval();
            this.view.showErrorDialog(response.faultstring);
            return;
        }

        if (this.model.getData() == null) {
            const interval = setInterval(() => { this.getData(true); }, 60000);
            this.model.setDataInterval(interval);
        }

        const updatedData = this.model.updateData(response);

        if (isUpdate === undefined) {
            const users = this.view.getUsersFromData(response);
            if (users.length > 0) {
                this.filtersView.loadingUsers(users);
            }
        }

        this.cardsView.renderCards(updatedData, isUpdate);
        this.view.hideWaiter("getData");
    }

    openDetails(versionId) {
        this.detailsView.openModal();

        const dateStr =  dateRU(this.model.getDateFromValue());
        this.apiModel.fetchDetailsByVersionId(versionId, dateStr)
            .then(response => this.handleDetailsResponse(response));
    }

    handleDetailsResponse(response) {
        this.detailsView.renderSteps(response);
        this.detailsView.hideWaiter();
        this.view.animateScrollToTop();
    }

    onUserSelect() {
        const createdFrom = this.filtersView.getCreationFrom();
        const createdTo = this.filtersView.getCreationTo();
        const selectedUser = this.filtersView.getSelectedUser();

        if (createdTo !== null) {
            this.filtersView.filterJurnalCard(createdFrom, createdTo, selectedUser);
        } else if (createdFrom !== null) {
            const createdToLastDay = new Date(createdFrom.getFullYear(), createdFrom.getMonth() + 1, 0);
            this.filtersView.filterJurnalCard(createdFrom, createdToLastDay, selectedUser);
        } else {
            this.filtersView.filterJurnalCard(createdFrom, createdTo, selectedUser);
        }
    }

    onUserUnselect() {
        const createdFrom = this.filtersView.getCreationFrom();
        const createdTo = this.filtersView.getCreationTo();

        if (createdTo !== null) {
            this.filtersView.filterJurnalCard(createdFrom, createdTo, null);
        } else if (createdFrom !== null) {
            const createdToLastDay = new Date(createdFrom.getFullYear(), createdFrom.getMonth() + 1, 0);
            this.filtersView.filterJurnalCard(createdFrom, createdToLastDay, null);
        } else {
            this.filtersView.filterJurnalCard(createdFrom, createdTo, null);
        }
    }

    onDateToSelect(date) {
        const createdFrom = this.filtersView.getCreationFrom();
        const selectedUser = this.filtersView.getSelectedUser();
        this.filtersView.filterJurnalCard(createdFrom, date, selectedUser);
    }

    clearFilter() {
        this.filtersView.clearFilter();
    }

    initModalCloseHandler() {

        // Закрытие по крестику
        $(document).on('click', '#closeDetailsBtn', (e) => {
            if (this.detailsView) {
                this.detailsView.closeModal();
            }
        });        
    }
}