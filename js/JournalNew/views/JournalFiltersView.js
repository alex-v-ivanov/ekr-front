/**
 * Представление фильтров: пользователь, дата создания.
 */

import { formatState, formatSelected } from '../utils/journal-utils.js';

export class JournalFiltersView {
    constructor(model, controller) {
        this.model = model;
        this.controller = controller;
    }

    loadingUsers(users) {
        const data = users.map((user, index) => ({
            id: index,
            text: index + '#;' + user
        }));

        this.model.userSelected.empty().select2({
            data: data,
            templateResult: formatState,
            templateSelection: formatSelected,
            width: '100%',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: false,
            maximumSelectionLength: 1,
            language: {
                noResults: function () {
                    return 'Ничего не найдено';
                },
                maximumSelected: function (args) {
                    return 'Можно выбрать только ' + args.maximum + ' элемент';
                }
            },
            adaptDropdownCssClass: function () {
                return '';
            }
        });
    }

    initUser() {
        this.model.userSelected = $('#user');
        this.model.userSelected.select2({
            width: '220px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });

        this.initSelect2Event(this.model.userSelected);

        this.model.userSelected.on('select2:select', () => {
            this.controller.onUserSelect();
        });

        this.model.userSelected.on('select2:unselect', () => {
            this.controller.onUserUnselect();
        });
    }

    initSelect2Event($el) {
        $el.on('select2:open', function () {
            const $input = $(this);
            const $parent = $input.closest('.dropdown');
            const $dropdownBtn = $parent.find('svg');
            if ($dropdownBtn.length > 0) {
                $dropdownBtn.css('transform', 'rotate(180deg)');
            }
        });

        $el.on('select2:select', function () {
            if ($(this).val().length >= 1) {
                $(this).next('.select2-container').find('.select2-search--inline').hide();
            }
        });

        $el.on('select2:close', function () {
            const $input = $(this);
            const $parent = $input.closest('.dropdown');
            const $dropdownBtn = $parent.find('svg');
            if ($(this).val().length >= 1) {
                $(this).next('.select2-container').find('.select2-search--inline').hide();
            }
            if ($dropdownBtn.length > 0) {
                $dropdownBtn.css('transform', 'rotate(0deg)');
            }
        });

        $el.on('select2:unselect', function () {
            if ($(this).val().length < 1) {
                $(this).next('.select2-container').find('.select2-search--inline').show();
            }
        });
    }

    initCreationDatePicker() {
        const optionFrom = {
            dateFormat: 'dd.MM.yyyy',
            onSelect: (formattedDate, date, inst) => {
                if (formattedDate.date !== undefined) {
                    this.model.creationTo.update({
                        minDate: new Date(formattedDate.date.getFullYear(), formattedDate.date.getMonth(), '1').toISOString().split('T')[0]
                    });
                }
                this.model.creationTo.clear();
            }
        };

        const optionTo = {
            dateFormat: 'dd.MM.yyyy',
            position: 'bottom right',
            onSelect: (formattedDate, date, inst) => {
                if (formattedDate.date !== undefined) {
                    this.controller.onDateToSelect(formattedDate.date);
                }
            }
        };

        this.model.creationFrom = new AirDatepicker('#creationFrom', optionFrom);
        this.model.creationTo = new AirDatepicker('#creationTo', optionTo);
    }

    filterJurnalCard(from, to, user) {
        const $cards = $('.card:not(".card__skeleton")');
        let userName = null;
        if (user !== null) {
            userName = user.text?.split('#;')[1];
        }

        $cards.each((i, el) => {
            const $card = $(el);
            const created = $card.attr('data-created');
            const userAttr = $card.attr('data-user');
            let shouldHide = false;

            if (created) {
                const createdDate = new Date(created + 'T00:00:00');
                if (from !== null && to !== null) {
                    if (createdDate < from || createdDate > to) {
                        shouldHide = true;
                    }
                } else if (from !== null && createdDate < from) {
                    shouldHide = true;
                } else if (to !== null && createdDate > to) {
                    shouldHide = true;
                }

                if (!shouldHide && userName !== null) {
                    if (!userAttr || userName.toLowerCase() !== userAttr.toLowerCase()) {
                        shouldHide = true;
                    }
                }
            } else {
                shouldHide = true;
            }

            if (shouldHide) {
                $card.addClass('Hidden');
            } else {
                $card.removeClass('Hidden');
            }
        });
    }

    clearFilter() {
        $('.card:not(".card__skeleton")').removeClass('Hidden');
        this.model.userSelected.val(null).trigger('change');
        this.model.creationFrom.clear();
        this.model.creationTo.clear();
    }

    getSelectedUser() {
        const userSelected = this.model.userSelected.select2('data');
        return userSelected.length > 0 ? userSelected[0] : null;
    }

    getCreationFrom() {
        return this.model.creationFrom?.selectedDates?.length > 0 ? this.model.creationFrom.selectedDates[0] : null;
    }

    getCreationTo() {
        return this.model.creationTo?.selectedDates?.length > 0 ? this.model.creationTo.selectedDates[0] : null;
    }
}