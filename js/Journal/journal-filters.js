/**
 * Фильтры журнала: пользователь, дата создания (Select2, AirDatepicker), сброс.
 * Конструктор: JournalFilters(journal) — journal даёт userSelected, CreationFrom, CreationTo, filterJurnalCard.
 */

import { formatState, formatSelected } from './journal-utils.js';

export class JournalFilters {
    constructor(journal) {
        this.journal = journal;
    }

    loadingUsers(users) {
        const j = this.journal;
        const data = users.map((user, index) => ({
            id: index,
            text: index + '#;' + user
        }));

        j.userSelected.empty().select2({
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
        const j = this.journal;
        const filterJurnalCard = j.filterJurnalCard.bind(j);

        j.userSelected = $('#user');
        j.userSelected.select2({
            width: '220px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
        });

        this.initSelect2Event(j.userSelected);

        j.userSelected.on('select2:select', function () {
            if ($(this).val().length >= 1) {
                const createdFrom = j.CreationFrom?.selectedDates?.length > 0 ? j.CreationFrom.selectedDates[0] : null;
                const createdTo = j.CreationTo?.selectedDates?.length > 0 ? j.CreationTo.selectedDates[0] : null;
                const selectedValue = $(this).select2('data');
                if (createdTo !== null) {
                    filterJurnalCard(createdFrom, createdTo, selectedValue[0]);
                } else if (createdFrom !== null) {
                    const createdToLastDay = new Date(createdFrom.getFullYear(), createdFrom.getMonth() + 1, 0);
                    filterJurnalCard(createdFrom, createdToLastDay, selectedValue[0]);
                } else {
                    filterJurnalCard(createdFrom, createdTo, selectedValue[0]);
                }
            }
        });

        j.userSelected.on('select2:unselect', function () {
            const createdFrom = j.CreationFrom?.selectedDates?.length > 0 ? j.CreationFrom.selectedDates[0] : null;
            const createdTo = j.CreationTo?.selectedDates?.length > 0 ? j.CreationTo.selectedDates[0] : null;
            if (createdTo !== null) {
                filterJurnalCard(createdFrom, createdTo, null);
            } else if (createdFrom !== null) {
                const createdToLastDay = new Date(createdFrom.getFullYear(), createdFrom.getMonth() + 1, 0);
                filterJurnalCard(createdFrom, createdToLastDay, null);
            } else {
                filterJurnalCard(createdFrom, createdTo, null);
            }
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
        const j = this.journal;
        const filterJurnalCard = j.filterJurnalCard.bind(j);

        const optionFrom = {
            dateFormat: 'dd.MM.yyyy',
            onSelect: function (formattedDate, date, inst) {
                if (formattedDate.date !== undefined) {
                    j.CreationTo.update({
                        minDate: new Date(formattedDate.date.getFullYear(), formattedDate.date.getMonth(), '1').toISOString().split('T')[0]
                    });
                }
                j.CreationTo.clear();
            }
        };

        const optionTo = {
            dateFormat: 'dd.MM.yyyy',
            position: 'bottom right',
            onSelect: function (formattedDate, date, inst) {
                if (formattedDate.date !== undefined) {
                    const createdFrom = j.CreationFrom.selectedDates.length > 0 ? j.CreationFrom.selectedDates[0] : null;
                    const userSelected = j.userSelected.select2('data');
                    const user = userSelected.length > 0 ? userSelected[0] : null;
                    const createdTo = formattedDate.date;
                    filterJurnalCard(createdFrom, createdTo, user);
                }
            }
        };

        j.CreationFrom = new AirDatepicker('#creationFrom', optionFrom);
        j.CreationTo = new AirDatepicker('#creationTo', optionTo);
    }

    filterJurnalCard(from, to, user) {
        const $cards = $('.card:not(".card__skeleton")');
        let userName = null;
        if (user !== null) {
            userName = user.text.split('#;')[1];
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
        const j = this.journal;
        $('.card:not(".card__skeleton")').removeClass('Hidden');
        j.userSelected.val(null).trigger('change');
        j.CreationFrom.clear();
        j.CreationTo.clear();
    }
}
