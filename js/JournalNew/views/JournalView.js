/**
 * Основное представление: управление корневыми UI-элементами.
 */

export class JournalView {
    constructor() {
        this.$body = null;
        this.$tooltips = null;
    }

    init() {
        this.$body = $('.page__journal__body');
    }

    setStressTheme() {
        this.$body.addClass('journal__stres');
    }

    initDateTimePicker(containerId, currentDate) {
        return new PP.Ui.DateTimePicker({
            ParentNode: document.getElementById(containerId),
            ShowTime: false,
            CurrentDate: currentDate,
            Width: 180,
        });
    }

    initTooltips() {
        const $tooltips = $('[tooltipe]');
        $tooltips.each((index, element) => {
            const text = $(element).attr('tooltipe');
            tippy(element, {
                content: '<p class="tooltipe__text">' + text + '</p>',
                animation: 'fade',
                followCursor: true,
                arrow: false,
                allowHTML: true,
            });
        });
    }

    initDropdownEvent() {
        $(document).on('click', '.dropdown svg', function (e) {
            const $select = $(this).siblings('select');
            $select.select2('open');
            e.stopPropagation();
        });
    }

    showWaiter(key) {
        const reports = this._getReports();
        if (reports?.common?.waiter) {
            reports.common.waiter.show(key);
        }
    }

    hideWaiter(key) {
        const reports = this._getReports();
        if (reports?.common?.waiter) {
            reports.common.waiter.hide(key);
        }
    }

    showErrorDialog(message) {
        const reports = this._getReports();
        if (reports?.common?.showDialog) {
            reports.common.showDialog(message, "Error");
        }
    }

    showDialog(message) {
        const reports = this._getReports();
        if (reports?.common?.showDialog) {
            reports.common.showDialog(message);
        }
    }

    _getReports() {
        return typeof window !== "undefined" && window.Reports;
    }

    animateScrollToTop() {
        $('html').animate({ scrollTop: 0 }, 500);
    }

    getUsersFromData(data) {
        return [...new Set((data || []).map(item => item.User))];
    }
}