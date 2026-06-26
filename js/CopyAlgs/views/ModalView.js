export class ModalView {
    constructor() {
        this.modal = null;
        this.resolve = null;
        this.validator = null;
        this.init();
    }

    init() {
        if (document.getElementById("customPromptOverlay")) return;

        const modalHtml = `
            <div class="modal-overlay" id="customPromptOverlay">
                <div class="modal-window">
                    <h3 class="modal-title" id="modalTitle">Заголовок</h3>
                    <div class="modal-body">
                        <input type="text" id="modalInput" placeholder="Введите текст..." autocomplete="off">
                        <div id="modalInputError" style="display: none; color: red; font-size: 0.85em; margin-top: 5px;"></div>
                        <div id="modalMessage" style="display: none;"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="modalCancelBtn">Отмена</button>
                        <button class="btn btn-primary" id="modalConfirmBtn">ОК</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML("beforeend", modalHtml);
        this.modal = document.getElementById("customPromptOverlay");
        
        // Привязываем обработчики
        const cancelBtn = document.getElementById("modalCancelBtn");
        const confirmBtn = document.getElementById("modalConfirmBtn");
        const inputEl = document.getElementById("modalInput");
        
        cancelBtn?.addEventListener("click", () => this.close(null));
        confirmBtn?.addEventListener("click", () => this.confirm());
        inputEl?.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.confirm();
            if (e.key === "Escape") this.close(null);
        });
    }

    showPrompt(title, placeholder = "", validator = null) {
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.validator = validator;
            
            const titleEl = document.getElementById("modalTitle");
            const inputEl = document.getElementById("modalInput");
            const msgEl = document.getElementById("modalMessage");
            
            if (titleEl) titleEl.innerText = title;
            if (inputEl) {
                inputEl.style.display = "block";
                inputEl.value = "";
                inputEl.placeholder = placeholder;
                setTimeout(() => inputEl.focus(), 100);
            }
            if (msgEl) msgEl.style.display = "none";
            
            this.hideError();
            this.show();
        });
    }

    showConfirm(text) {
        return new Promise((resolve) => {
            this.resolve = resolve;
            const titleEl = document.getElementById("modalTitle");
            const inputEl = document.getElementById("modalInput");
            const msgEl = document.getElementById("modalMessage");
            
            if (titleEl) titleEl.innerText = "Подтверждение";
            if (inputEl) inputEl.style.display = "none";
            if (msgEl) {
                msgEl.style.display = "block";
                msgEl.innerText = text;
            }
            
            this.hideError();
            this.show();
        });
    }

    confirm() {
        const inputEl = document.getElementById("modalInput");
		const value = inputEl?.value || "";
        
        if (this.validator) {
            const error = this.validator(value);
            if (error) {
                this.showError(error);
                return;
            }
        }

		const confirmWithoutValue = inputEl.style.display == "none"
        this.close(value || confirmWithoutValue);
    }

    close(value) {
        this.hide();
        if (this.resolve) {
            this.resolve(value);
            this.resolve = null;
        }
        this.validator = null;
    }

    showError(message) {
        const errorEl = document.getElementById("modalInputError");
        const inputEl = document.getElementById("modalInput");
        
        if (errorEl) {
            errorEl.innerText = message;
            errorEl.style.display = "block";
        }
        if (inputEl) {
            inputEl.style.borderColor = "red";
        }
    }

    hideError() {
        const errorEl = document.getElementById("modalInputError");
        const inputEl = document.getElementById("modalInput");
        
        if (errorEl) errorEl.style.display = "none";
        if (inputEl) inputEl.style.borderColor = "";
    }

    show() {
        if (this.modal) {
            this.modal.classList.add("visible");
        }
    }

    hide() {
        if (this.modal) {
            this.modal.classList.remove("visible");
        }
        this.hideError();
    }

    destroy() {
        if (this.modal) {
            this.modal.remove();
        }
    }
}