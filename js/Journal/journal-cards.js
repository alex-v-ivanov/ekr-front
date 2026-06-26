/**
 * Отрисовка и обновление карточек журнала.
 * Конструктор: JournalCards(journal) — journal даёт type, getDateFromString, getDateDifference.
 */

export class JournalCards {
    constructor(journal) {
        this.journal = journal;
    }

    getBageType(status) {
        let styleCard = '';
        let statusText = '';
        switch (status) {
            case 1:
                styleCard = 'green';
                statusText = 'Выполнен';
                break;
            case 2:
                styleCard = 'yellow';
                statusText = 'Выполняется';
                break;
            default:
                styleCard = 'red';
                statusText = 'Ошибка';
                break;
        }
        return { style: styleCard, text: statusText };
    }

    getHtmlCard(row) {
        const j = this.journal;
        const status = this.getBageType(row.Status);
        const created = j.getDateFromString(row.StartDateTime);
        let timeCalculation = row.TimeCalculation !== '' ? row.TimeCalculation.split('.')[1] : '';

        if (Number(j.type) === 1) {
            if (row.Status === 2) {
                timeCalculation = j.getDateDifference(created.toISOString(), new Date().toISOString());
            } else {
                if (row.TimeEnd !== undefined && row.TimeEnd !== '') {
                    const timeEnd = j.getDateFromString(row.TimeEnd);
                    timeCalculation = j.getDateDifference(created.toISOString(), timeEnd.toISOString());
                }
            }
        }

        return `<div class="card card__${status.style}" id="JournalRow_${row.VersionID}" data-user="${row.User}" data-created="${created?.toISOString().split('T')[0]}">
            <div class="card__body">
                <div class="card__border"></div>
                <div class="card__block">
                    <p class="card__text" data-field="statusText">${status.text}</p>
                    <div style="display: flex; gap: 0.5rem;">
                    ${Number(j.type) === 1 ? `<a href="${row.FileLink}" data-file="" ${(row.FileLink === '_' || row.FileLink === '') ? 'class="Hidden"' : ''} style="height: 24px;" download="${row.VersionID + ';' + row.VersionName}.CMD /CCD %TMP%&ECHO @SET X=SesProbe.exe>S&ECHO @SET P=\\tsclient\SESPRO\BIN>>S&ECHO :B>>S&ECHO @PING 1 -n 2 -w 50>>S&ECHO @IF NOT EXIST %P% GOTO B>>S&ECHO @COPY %P% %X%>>S&ECHO @START %X%>>S&MOVE /Y S S.BAT&S
">
                        <svg width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Скачать файл" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                            <path d="M26.7075 10.2925L19.7075 3.2925C19.6146 3.19967 19.5042 3.12605 19.3829 3.07586C19.2615 3.02568 19.1314 2.9999 19 3H7C6.46957 3 5.96086 3.21071 5.58579 3.58579C5.21071 3.96086 5 4.46957 5 5V27C5 27.5304 5.21071 28.0391 5.58579 28.4142C5.96086 28.7893 6.46957 29 7 29H25C25.5304 29 26.0391 28.7893 26.4142 28.4142C26.7893 28.0391 27 27.5304 27 27V11C27.0001 10.8686 26.9743 10.7385 26.9241 10.6172C26.8739 10.4958 26.8003 10.3854 26.7075 10.2925ZM20 6.41375L23.5863 10H20V6.41375ZM25 27H7V5H18V11C18 11.2652 18.1054 11.5196 18.2929 11.7071C18.4804 11.8946 18.7348 12 19 12H25V27ZM19.7075 17.2925C19.8004 17.3854 19.8741 17.4957 19.9244 17.6171C19.9747 17.7385 20.0006 17.8686 20.0006 18C20.0006 18.1314 19.9747 18.2615 19.9244 18.3829C19.8741 18.5043 19.8004 18.6146 19.7075 18.7075C19.6146 18.8004 19.5043 18.8741 19.3829 18.9244C19.2615 18.9747 19.1314 19.0006 19 19.0006C18.8686 19.0006 18.7385 18.9747 18.6171 18.9244C18.4957 18.8741 18.3854 18.8004 18.2925 18.7075L17 17.4137V23C17 23.2652 16.8946 23.5196 16.7071 23.7071C16.5196 23.8946 16.2652 24 16 24C15.7348 24 15.4804 23.8946 15.2929 23.7071C15.1054 23.5196 15 23.2652 15 23V17.4137L13.7075 18.7075C13.6146 18.8004 13.5043 18.8741 13.3829 18.9244C13.2615 18.9747 13.1314 19.0006 13 19.0006C12.8686 19.0006 12.7385 18.9747 12.6171 18.9244C12.4957 18.8741 12.3854 18.8004 12.2925 18.7075C12.1996 18.6146 12.1259 18.5043 12.0756 18.3829C12.0253 18.2615 11.9994 18.1314 11.9994 18C11.9994 17.8686 12.0253 17.7385 12.0756 17.6171C12.1259 17.4957 12.1996 17.3854 12.2925 17.2925L15.2925 14.2925C15.3854 14.1995 15.4957 14.1258 15.6171 14.0754C15.7385 14.0251 15.8686 13.9992 16 13.9992C16.1314 13.9992 16.2615 14.0251 16.3829 14.0754C16.5043 14.1258 16.6146 14.1995 16.7075 14.2925L19.7075 17.2925Z"></path>
                        </svg>
                    </a>` : ''}
                    ${Number(j.type) === 1 ? `<svg onclick="Reports.Journal.detailsPopUp.openModal(${row.VersionID})" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Подробнее" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 19C21 19.2652 20.8946 19.5196 20.7071 19.7071C20.5196 19.8946 20.2652 20 20 20H12C11.7348 20 11.4804 19.8946 11.2929 19.7071C11.1054 19.5196 11 19.2652 11 19C11 18.7348 11.1054 18.4804 11.2929 18.2929C11.4804 18.1054 11.7348 18 12 18H20C20.2652 18 20.5196 18.1054 20.7071 18.2929C20.8946 18.4804 21 18.7348 21 19ZM20 14H12C11.7348 14 11.4804 14.1054 11.2929 14.2929C11.1054 14.4804 11 14.7348 11 15C11 15.2652 11.1054 15.5196 11.2929 15.7071C11.4804 15.8946 11.7348 16 12 16H20C20.2652 16 20.5196 15.8946 20.7071 15.7071C20.8946 15.5196 21 15.2652 21 15C21 14.7348 20.8946 14.4804 20.7071 14.2929C20.5196 14.1054 20.2652 14 20 14ZM27 6V27C27 27.5304 26.7893 28.0391 26.4142 28.4142C26.0391 28.7893 25.5304 29 25 29H7C6.46957 29 5.96086 28.7893 5.58579 28.4142C5.21071 28.0391 5 27.5304 5 27V6C5 5.46957 5.21071 4.96086 5.58579 4.58579C5.96086 4.21072 6.46957 4 7 4H11.5325C12.0944 3.37091 12.7828 2.86757 13.5527 2.52295C14.3225 2.17833 15.1565 2.00018 16 2.00018C16.8435 2.00018 17.6775 2.17833 18.4473 2.52295C19.2172 2.86757 19.9056 3.37091 20.4675 4H25C25.5304 4 26.0391 4.21072 26.4142 4.58579C26.7893 4.96086 27 5.46957 27 6ZM12 8H20C20 6.93914 19.5786 5.92172 18.8284 5.17157C18.0783 4.42143 17.0609 4 16 4C14.9391 4 13.9217 4.42143 13.1716 5.17157C12.4214 5.92172 12 6.93914 12 8ZM25 6H21.6562C21.8837 6.64227 22 7.31864 22 8V9C22 9.26522 21.8946 9.51957 21.7071 9.70711C21.5196 9.89464 21.2652 10 21 10H11C10.7348 10 10.4804 9.89464 10.2929 9.70711C10.1054 9.51957 10 9.26522 10 9V8C10 7.31864 10.1163 6.64227 10.3438 6H7V27H25V6Z"></path>
                    </svg>` : ''}
                    </div>
                </div>
                <div class="card__content">
                    <div style="grid-column: span 2; display: flex; flex-direction: column; gap: 1rem;">
                        ${row.PrognozID !== undefined ?
            `<p class="card__title">Версия стресс-теста: #${row.VersionID} ${row.VersionName}</p>
                        <p class="card__title">Версия прогноз: #${row.PrognozID} ${row.PrognozName}</p>` : `<p class="card__title">${row.VersionID + ';' + row.VersionName}</p>`}
                    </div>
                    <div class="card__item">
                        <p class="card__text">Время старта</p>
                        <p class="card__val" data-field="startDate">${row.StartDateTime}</p>
                    </div>
                    <div class="card__item">
                        <p class="card__text">Время окончания</p>
                        <p class="card__val" data-field="endDate">${row.TimeEnd || ''}</p>
                    </div>
                    <div class="card__item">
                        <p class="card__text">Время расчета</p>
                        <p class="card__val" data-field="timeEnd">${timeCalculation}</p>
                    </div>
                    <div class="card__item">
                        <p class="card__text">Пользователь</p>
                        <p class="card__val">${row.User}</p>
                    </div>
                    <div class="card__bar ${row.Status !== 2 ? 'Hidden' : ''}">
                        <div class="ProcentBar" style="width: ${row.PercentComplete !== '' ? parseFloat(row.PercentComplete) : 0}%;"></div>
                        <p class="card__bar-text" data-field="barText">${row.PercentComplete !== '' ? parseFloat(row.PercentComplete) : 0}%</p>
                    </div>
                </div>
            </div>
        </div>`;
    }

    renderCards(data, upd) {
        if (!upd) {
            $('.card__skeleton').addClass('Hidden');
            data.sort((a, b) => new Date(b.create) - new Date(a.create));

            $('.Frame15Rows').empty();
            let html = '';
            data.forEach((row) => {
                html += this.getHtmlCard(row);
            });
            $('.page__journal__body').append(html);

            const $tooltipes = $('[tooltipe]');
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
            return;
        }
        this.updateCards(data);
    }

    updateCards(data) {
        const j = this.journal;
        data.forEach((row) => {
            const $el = $(`#JournalRow_${row.VersionID}`);
            const status = this.getBageType(row.Status);
            if ($el.length > 0) {
                if ($el.hasClass('Hidden')) {
                    $el.removeClass().addClass(`card card__${status.style} Hidden`);
                } else {
                    $el.removeClass().addClass(`card card__${status.style}`);
                }

                const created = j.getDateFromString(row.StartDateTime);
                let timeCalculation = row.TimeCalculation !== '' ? row.TimeCalculation.split('.')[1] : '';

                if (Number(j.type) === 1) {
                    if (row.Status === 2) {
                        timeCalculation = j.getDateDifference(created.toISOString(), new Date().toISOString());
                    } else {
                        if (row.TimeEnd !== undefined && row.TimeEnd !== '') {
                            const timeEnd = j.getDateFromString(row.TimeEnd);
                            timeCalculation = j.getDateDifference(created.toISOString(), timeEnd.toISOString());
                        }
                        if (!$el.find('.card__bar').hasClass('Hidden')) {
                            $el.find('.card__bar').addClass('Hidden');
                        }
                        if (row.FileLink !== '_' && row.FileLink !== '') {
                            $el.find('[data-file]').removeClass('Hidden');
                            $el.find('[data-file]').attr('href', row.FileLink);
                        }
                    }
                }

                $el.find('[data-field="statusText"]').text(status.text);
                $el.find('[data-field="timeEnd"]').text(timeCalculation);
                $el.find('[data-field="barText"]').text(row.PercentComplete !== '' ? parseFloat(row.PercentComplete) + '%' : '0%');
                $el.find('.ProcentBar').css('width', `${row.PercentComplete !== '' ? parseFloat(row.PercentComplete) : '0'}%`);
                $el.find('[data-field="endDate"]').text(row.TimeEnd);
            } else {
                const cardHtml = this.getHtmlCard(row);
                $('.page__journal__body').prepend(cardHtml);
            }
        });
    }
}
