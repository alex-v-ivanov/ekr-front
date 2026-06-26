export class AlgCopyView {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onCreate = options.onCreate || (() => {});
		this.onReplace = options.onReplace || (() => {});
        this.onDelete = options.onDelete || (() => {});
        this.tooltipInit = options.tooltipInit || (() => {});
        
        this._boundHandlers = new Map(); // Очистка событий

		this._attachMainHandlers();
    }

    render(copies, isProcessing = false) {
        if (!this.container) return;

        this.container.innerHTML = "";

        if (!copies || copies.length === 0) {
            this._renderEmpty();
            return;
        }

        copies.forEach(copy => {
            const row = this._createRow(copy, isProcessing);
            this.container.appendChild(row);
        });

        // Инициализируем тултипы после рендера
        if (this.tooltipInit) {
            this.tooltipInit();
        }
    }

    _renderEmpty() {
        const emptyRow = document.createElement("li");
        emptyRow.className = "empty-list-row";
        emptyRow.innerHTML = `
            <div class="empty-list-message">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="#ccd0d4" stroke-width="2"/>
                    <path d="M9 9L15 15" stroke="#ccd0d4" stroke-width="2"/>
                    <path d="M15 9L9 15" stroke="#ccd0d4" stroke-width="2"/>
                </svg>
                <span>Список копий пуст</span>
            </div>
        `;
        this.container.appendChild(emptyRow);
    }

    _createRow(copy, isProcessing) {
        const row = document.createElement("li");
        row.className = "ListRow";
        row.setAttribute("row-id", copy.id);

        // Имя с статусом
        const nameCell = this._createCell("Name");
        nameCell.innerHTML = `
            <div style="display:flex; gap:0.5rem; align-items: center;">
                <p>${this._escapeHtml(copy.name)}</p>
                ${this._getStatusIcon(copy.status)}
            </div>
        `;

        // Комментарий
        const commentCell = this._createCell("Comment");
        commentCell.textContent = copy.comment;

        // Дата
        const dateCell = this._createCell("Date");
        if (copy.created_at) {
            const date = new Date(copy.created_at.split('.')[0]);
            dateCell.textContent = date.toLocaleDateString("ru-RU", {
                year: "2-digit",
                month: "short",
                day: '2-digit',
                hour: "numeric",
                minute: "numeric"
            });
        }

        // Кнопки действий
        const actionsCell = this._createCell(null);
        actionsCell.innerHTML = this._getActionButtons();

        // Добавляем все ячейки в строку
        row.appendChild(nameCell);
        row.appendChild(commentCell);
        row.appendChild(dateCell);
        row.appendChild(actionsCell);

        // Добавляем обработчики событий
        this._attachHandlers(row, copy, isProcessing);

        return row;
    }

    _createCell(field) {
        const cell = document.createElement("div");
        cell.className = "RowItem RowInlineContent";
        if (field === "Name" || field === "Comment" || field === "Date") {
            cell.classList.add("LongItem");
        }
        if (field) {
            cell.setAttribute("field", field);
        }
        cell.style.border = "unset";
        return cell;
    }

    _getActionButtons() {
        return `
            <div style="margin-left: auto;gap: 0.5rem;align-items: center;display: grid;grid-template-columns: 1fr 1fr;height: max-content;">
                <svg data-rowbtn="replace" fill="#004c97" style="cursor: pointer;" tooltipe="Заменить актуальный алгоритм расчета" width="24" height="24" viewBox="0 0 32 32">
                    <path d="M2.99999 16C3.00264 13.6139 3.9517 11.3262 5.63896 9.63897C7.32621 7.95172 9.61386 7.00265 12 7.00001H25.5862L24.2925 5.70751C24.1049 5.51987 23.9994 5.26537 23.9994 5.00001C23.9994 4.73464 24.1049 4.48015 24.2925 4.29251C24.4801 4.10487 24.7346 3.99945 25 3.99945C25.2654 3.99945 25.5199 4.10487 25.7075 4.29251L28.7075 7.29251C28.8005 7.38538 28.8742 7.49567 28.9246 7.61707C28.9749 7.73846 29.0008 7.86859 29.0008 8.00001C29.0008 8.13142 28.9749 8.26155 28.9246 8.38295C28.8742 8.50434 28.8005 8.61463 28.7075 8.70751L25.7075 11.7075C25.5199 11.8951 25.2654 12.0006 25 12.0006C24.7346 12.0006 24.4801 11.8951 24.2925 11.7075C24.1049 11.5199 23.9994 11.2654 23.9994 11C23.9994 10.7346 24.1049 10.4801 24.2925 10.2925L25.5862 9.00001H12C10.1441 9.00199 8.36476 9.74013 7.05244 11.0525C5.74011 12.3648 5.00198 14.1441 4.99999 16C4.99999 16.2652 4.89464 16.5196 4.7071 16.7071C4.51956 16.8947 4.26521 17 3.99999 17C3.73478 17 3.48042 16.8947 3.29289 16.7071C3.10535 16.5196 2.99999 16.2652 2.99999 16ZM28 15C27.7348 15 27.4804 15.1054 27.2929 15.2929C27.1053 15.4804 27 15.7348 27 16C26.998 17.8559 26.2599 19.6352 24.9475 20.9476C23.6352 22.2599 21.8559 22.998 20 23H6.41374L7.70749 21.7075C7.8004 21.6146 7.8741 21.5043 7.92439 21.3829C7.97467 21.2615 8.00055 21.1314 8.00055 21C8.00055 20.8686 7.97467 20.7385 7.92439 20.6171C7.8741 20.4957 7.8004 20.3854 7.70749 20.2925C7.61458 20.1996 7.50428 20.1259 7.38289 20.0756C7.2615 20.0253 7.13139 19.9994 6.99999 19.9994C6.8686 19.9994 6.73849 20.0253 6.6171 20.0756C6.4957 20.1259 6.3854 20.1996 6.29249 20.2925L3.29249 23.2925C3.19952 23.3854 3.12576 23.4957 3.07543 23.6171C3.02511 23.7385 2.99921 23.8686 2.99921 24C2.99921 24.1314 3.02511 24.2615 3.07543 24.3829C3.12576 24.5043 3.19952 24.6146 3.29249 24.7075L6.29249 27.7075C6.3854 27.8004 6.4957 27.8741 6.6171 27.9244C6.73849 27.9747 6.8686 28.0006 6.99999 28.0006C7.13139 28.0006 7.2615 27.9747 7.38289 27.9244C7.50428 27.8741 7.61458 27.8004 7.70749 27.7075C7.8004 27.6146 7.8741 27.5043 7.92439 27.3829C7.97467 27.2615 8.00055 27.1314 8.00055 27C8.00055 26.8686 7.97467 26.7385 7.92439 26.6171C7.8741 26.4957 7.8004 26.3854 7.70749 26.2925L6.41374 25H20C22.3861 24.9974 24.6738 24.0483 26.361 22.361C28.0483 20.6738 28.9973 18.3861 29 16C29 15.7348 28.8946 15.4804 28.7071 15.2929C28.5196 15.1054 28.2652 15 28 15Z"></path>
                </svg>
                <svg data-rowbtn="removeRow" fill="#aa1212" style="cursor: pointer;" tooltipe="Удалить копию" width="24" height="24" viewBox="0 0 32 32">
                    <path d="M27 6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM24 26H8V8H24V26ZM10 3C10 2.73478 10.1054 2.48043 10.2929 2.29289C10.4804 2.10536 10.7348 2 11 2H21C21.2652 2 21.5196 2.10536 21.7071 2.29289C21.8946 2.48043 22 2.73478 22 3C22 3.26522 21.8946 3.51957 21.7071 3.70711C21.5196 3.89464 21.2652 4 21 4H11C10.7348 4 10.4804 3.89464 10.2929 3.70711C10.1054 3.51957 10 3.26522 10 3Z"></path>
                </svg>
            </div>
        `;
    }

    _getStatusIcon(status) {
        if (!status?.id) return "";

        const icons = {
            1: `<svg tooltipe="${status.text}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 200 200">
					<path fill="none" d="M0 0h200v200H0z"></path>
					<path fill="none" class="svg_strokeWidth svg__stroke" stroke-linecap="round" stroke="#dbc924" stroke-width="15" transform-origin="center" d="M70 95.5V112m0-84v16.5m0 0a25.5 25.5 0 1 0 0 51 25.5 25.5 0 0 0 0-51Zm36.4 4.5L92 57.3M33.6 91 48 82.7m0-25.5L33.6 49m58.5 33.8 14.3 8.2">
						<animateTransform 
							type="rotate" 
							attributeName="transform"
							dur="2" 
							values="0 6.3 6.3; -120 6.3 6.3" 
							repeatCount="indefinite"></animateTransform>
					</path>
					<path fill="none" class="svg_strokeWidth svg__stroke" stroke-linecap="round" stroke="#dbc924" stroke-width="15" transform-origin="center" d="M130 155.5V172m0-84v16.5m0 0a25.5 25.5 0 1 0 0 51 25.5 25.5 0 0 0 0-51Zm36.4 4.5-14.3 8.3M93.6 151l14.3-8.3m0-25.4L93.6 109m58.5 33.8 14.3 8.2">
						<animateTransform 
							type="rotate" 
							attributeName="transform"
							dur="2" 
							values="0 11.7 11.7; 120 11.7 11.7" 
							repeatCount="indefinite"></animateTransform>
					</path>
				</svg>`,
				
            2: `<svg fill="#2ecc71" tooltipe="${status.text}" width="18" height="18" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
					<path d="M21.7075 12.2925C21.8005 12.3854 21.8742 12.4957 21.9246 12.6171C21.9749 12.7385 22.0008 12.8686 22.0008 13C22.0008 13.1314 21.9749 13.2615 21.9246 13.3829C21.8742 13.5043 21.8005 13.6146 21.7075 13.7075L14.7075 20.7075C14.6146 20.8005 14.5043 20.8742 14.3829 20.9246C14.2615 20.9749 14.1314 21.0008 14 21.0008C13.8686 21.0008 13.7385 20.9749 13.6171 20.9246C13.4957 20.8742 13.3854 20.8005 13.2925 20.7075L10.2925 17.7075C10.1049 17.5199 9.99945 17.2654 9.99945 17C9.99945 16.7346 10.1049 16.4801 10.2925 16.2925C10.4801 16.1049 10.7346 15.9994 11 15.9994C11.2654 15.9994 11.5199 16.1049 11.7075 16.2925L14 18.5863L20.2925 12.2925C20.3854 12.1995 20.4957 12.1258 20.6171 12.0754C20.7385 12.0251 20.8686 11.9992 21 11.9992C21.1314 11.9992 21.2615 12.0251 21.3829 12.0754C21.5043 12.1258 21.6146 12.1995 21.7075 12.2925ZM29 16C29 18.5712 28.2376 21.0846 26.8091 23.2224C25.3807 25.3603 23.3503 27.0265 20.9749 28.0104C18.5995 28.9944 15.9856 29.2518 13.4638 28.7502C10.9421 28.2486 8.6257 27.0105 6.80762 25.1924C4.98953 23.3743 3.75141 21.0579 3.2498 18.5362C2.74819 16.0144 3.00563 13.4006 3.98957 11.0251C4.97351 8.64968 6.63975 6.61935 8.77759 5.1909C10.9154 3.76244 13.4288 3 16 3C19.4467 3.00364 22.7512 4.37445 25.1884 6.81163C27.6256 9.24882 28.9964 12.5533 29 16ZM27 16C27 13.8244 26.3549 11.6977 25.1462 9.88873C23.9375 8.07979 22.2195 6.66989 20.2095 5.83733C18.1995 5.00476 15.9878 4.78692 13.854 5.21136C11.7202 5.6358 9.76021 6.68345 8.22183 8.22183C6.68345 9.7602 5.63581 11.7202 5.21137 13.854C4.78693 15.9878 5.00477 18.1995 5.83733 20.2095C6.66989 22.2195 8.07979 23.9375 9.88873 25.1462C11.6977 26.3549 13.8244 27 16 27C18.9164 26.9967 21.7123 25.8367 23.7745 23.7745C25.8367 21.7123 26.9967 18.9164 27 16Z"></path>
				</svg>`,
				
            3: `<svg fill="#e74c3c" tooltipe="${status.text}" width="18" height="18" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
					<path d="M20.7075 12.7075L17.4138 16L20.7075 19.2925C20.8004 19.3854 20.8741 19.4957 20.9244 19.6171C20.9747 19.7385 21.0006 19.8686 21.0006 20C21.0006 20.1314 20.9747 20.2615 20.9244 20.3829C20.8741 20.5043 20.8004 20.6146 20.7075 20.7075C20.6146 20.8004 20.5043 20.8741 20.3829 20.9244C20.2615 20.9747 20.1314 21.0006 20 21.0006C19.8686 21.0006 19.7385 20.9747 19.6171 20.9244C19.4957 20.8741 19.3854 20.8004 19.2925 20.7075L16 17.4137L12.7075 20.7075C12.6146 20.8004 12.5043 20.8741 12.3829 20.9244C12.2615 20.9747 12.1314 21.0006 12 21.0006C11.8686 21.0006 11.7385 20.9747 11.6171 20.9244C11.4957 20.8741 11.3854 20.8004 11.2925 20.7075C11.1996 20.6146 11.1259 20.5043 11.0756 20.3829C11.0253 20.2615 10.9994 20.1314 10.9994 20C10.9994 19.8686 11.0253 19.7385 11.0756 19.6171C11.1259 19.4957 11.1996 19.3854 11.2925 19.2925L14.5863 16L11.2925 12.7075C11.1049 12.5199 10.9994 12.2654 10.9994 12C10.9994 11.7346 11.1049 11.4801 11.2925 11.2925C11.4801 11.1049 11.7346 10.9994 12 10.9994C12.2654 10.9994 12.5199 11.1049 12.7075 11.2925L16 14.5863L19.2925 11.2925C19.3854 11.1996 19.4957 11.1259 19.6171 11.0756C19.7385 11.0253 19.8686 10.9994 20 10.9994C20.1314 10.9994 20.2615 11.0253 20.3829 11.0756C20.5043 11.1259 20.6146 11.1996 20.7075 11.2925C20.8004 11.3854 20.8741 11.4957 20.9244 11.6171C20.9747 11.7385 21.0006 11.8686 21.0006 12C21.0006 12.1314 20.9747 12.2615 20.9244 12.3829C20.8741 12.5043 20.8004 12.6146 20.7075 12.7075ZM29 16C29 18.5712 28.2376 21.0846 26.8091 23.2224C25.3807 25.3603 23.3503 27.0265 20.9749 28.0104C18.5995 28.9944 15.9856 29.2518 13.4638 28.7502C10.9421 28.2486 8.6257 27.0105 6.80762 25.1924C4.98953 23.3743 3.75141 21.0579 3.2498 18.5362C2.74819 16.0144 3.00563 13.4006 3.98957 11.0251C4.97351 8.64968 6.63975 6.61935 8.77759 5.1909C10.9154 3.76244 13.4288 3 16 3C19.4467 3.00364 22.7512 4.37445 25.1884 6.81163C27.6256 9.24882 28.9964 12.5533 29 16ZM27 16C27 13.8244 26.3549 11.6977 25.1462 9.88873C23.9375 8.07979 22.2195 6.66989 20.2095 5.83733C18.1995 5.00476 15.9878 4.78692 13.854 5.21136C11.7202 5.6358 9.76021 6.68345 8.22183 8.22183C6.68345 9.7602 5.63581 11.7202 5.21137 13.854C4.78693 15.9878 5.00477 18.1995 5.83733 20.2095C6.66989 22.2195 8.07979 23.9375 9.88873 25.1462C11.6977 26.3549 13.8244 27 16 27C18.9164 26.9967 21.7123 25.8367 23.7745 23.7745C25.8367 21.7123 26.9967 18.9164 27 16Z"></path>
				</svg>`
        };

        return icons[status.id] || "";
    }

	_attachMainHandlers(){
		const createBtn = document.getElementById('createCopyBtn');
		if (createBtn){
			createBtn.addEventListener("click", this.onCreate);
		}
		
		const restoreBtn = document.getElementById('restoreOriginalBtn');
		if (restoreBtn){
			const restoreOriginalHandler = (e) => {
				e.preventDefault();
				if (this.onReplace) {
					this.onReplace("ORIGINAL");
				}
			};
			restoreBtn.addEventListener("click", restoreOriginalHandler);	
		}			
	}		

    _attachHandlers(row, copy, isProcessing) {
        const replaceBtn = row.querySelector("[data-rowbtn='replace']");
        const deleteBtn = row.querySelector("[data-rowbtn='removeRow']");

        const setDisabled = (btn, disabled) => {
            if (disabled) {
                btn.classList.add("disabled");
                btn.style.opacity = "0.5";
                btn.style.pointerEvents = "none";
            } else {
                btn.classList.remove("disabled");
                btn.style.opacity = "1";
                btn.style.pointerEvents = "all";
            }
        };

        setDisabled(replaceBtn, isProcessing);
        setDisabled(deleteBtn, isProcessing);

        // Сохраняем обработчики для возможности отписки
        const replaceHandler = (e) => {
            e.preventDefault();
            if (!isProcessing && this.onReplace) {
                this.onReplace(copy.id);
            }
        };

        const deleteHandler = (e) => {
            e.preventDefault();
            if (!isProcessing && this.onDelete) {
                this.onDelete(copy.id);
            }
        };

        replaceBtn.addEventListener("click", replaceHandler);
        deleteBtn.addEventListener("click", deleteHandler);

        // Сохраняем для очистки
        this._boundHandlers.set(row, { replaceHandler, deleteHandler });
    }

    _escapeHtml(str) {
        if (!str) return "";
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    destroy() {
        // Очищаем все обработчики
        this._boundHandlers.forEach((handlers, row) => {
            const replaceBtn = row.querySelector("[data-rowbtn='replace']");
            const deleteBtn = row.querySelector("[data-rowbtn='removeRow']");
            
            if (replaceBtn) {
                replaceBtn.removeEventListener("click", handlers.replaceHandler);
            }
            if (deleteBtn) {
                deleteBtn.removeEventListener("click", handlers.deleteHandler);
            }
        });
        
        this._boundHandlers.clear();
        
        if (this.container) {
            this.container.innerHTML = "";
        }
    }
}