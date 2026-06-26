import { SystemStateModel, SystemState } from '../models/SystemStateModel.js';
import { AlgCopyModel } from '../models/AlgCopyModel.js';
import { StatusView } from '../views/StatusView.js';
import { AlgCopyView } from '../views/AlgCopyView.js';
import { ModalView } from '../views/ModalView.js';
import { ApiService } from '../services/ApiService.js';
import { messages, foreKeys, apiStatuses } from "../constants.js";

export class AlgCopyController {
    constructor(deps) {
        this.deps = deps;
        this.stateModel = new SystemStateModel();
        this.apiService = new ApiService(deps.bi, deps.ForeKeys);
        this.copyModel = new AlgCopyModel(this.apiService);
        
        this.statusView = new StatusView("systemStatus");
        this.copyView = new AlgCopyView("copiesList", {
			onCreate: () => this.handleCreateCopy(),
            onReplace: (id) => this.handleRestore(id),
            onDelete: (id) => this.handleDelete(id),
            tooltipInit: () => this.initTooltips()
        });
        this.modalView = new ModalView();
        
        this.updateInterval = null;
        
        this._bindEvents();
    }

    _bindEvents() {
        // Слушаем изменения состояния
        this.stateModel.addEventListener('stateChanged', (e) => {
            const isProcessing = e.detail.newState === SystemState.PROCESSING;
            this.statusView.render(
                e.detail.newState,
                e.detail.operation,
                isProcessing
            );
            this.copyView.render(this.copyModel.copies, isProcessing);
        });

        // Слушаем изменения списка копий
        this.copyModel.addEventListener('copiesChanged', (e) => {
            this.copyView.render(
                e.detail.copies,
                this.stateModel.isProcessing
            );
        });

        // Слушаем ошибки
        this.copyModel.addEventListener('error', (e) => {
            this.handleError(e.detail.operation, e.detail.error);
        });

        // Слушаем успешные операции
        this.copyModel.addEventListener('copyRestored', () => {
            this.showMessage(messages.RESTORE_SUCCESS, "Результат");
            this.updateSystemState();
        });

        this.copyModel.addEventListener('copyDeleted', () => {
            this.updateSystemState();
        });

        this.copyModel.addEventListener('copyCreated', () => {
            this.updateSystemState();
        });
    }

    async init() {
        try {
            this.showWaiter("init");
			
			console.log(JSON.stringify(this))
            
            // Получаем информацию о пользователе
            const userInfo = await this.apiService.getUserInfo();
            const user = userInfo.meta.profiles.its.it[0];
            this.stateModel.setUserInfo(user.id, user.n);
            
            // Загружаем начальные данные
            await this.updateSystemState();
            await this.copyModel.loadCopies();
            
            // Запускаем периодическое обновление
            this.startPeriodicUpdate();
            
            this.hideWaiter("init");
        } catch (error) {
            this.handleError("init", error.message);
            this.hideWaiter("init");
        }
    }

    async updateSystemState() {
        try {
            const response = await this.apiService.getSystemState();
            
            if (response.status === apiStatuses.OK) {
                const json = JSON.parse(response.message);
                this.stateModel.setState(json.state, json.name || "");
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error("Failed to update system state:", error);
        }
    }

    async handleCreateCopy() {
        const comment = await this.modalView.showPrompt(
            "Введите комментарий для новой копии",
            "",
            (val) => !val || val.trim() === "" ? "Комментарий обязателен!" : null
        );
        
        if (!comment) return;
        if (!this.checkSystemReady()) return;
        
        try {
            this.showWaiter("createCopy");
            await this.copyModel.createCopy(comment);
            await this.updateSystemState();
            this.showMessage(messages.COPY_CREATE_SUCCESS, "Результат");
        } catch (error) {
            this.handleError("create", error.message);
        } finally {
            this.hideWaiter("createCopy");
        }
    }

    async handleRestore(id) {
        const confirmed = await this.modalView.showConfirm(
            "Вы уверены, что хотите заменить текущий алгоритм?"
        );
        
        if (!confirmed) return;
        if (!this.checkSystemReady()) return;
        
        try {
            this.showWaiter("restoreCopy");
            await this.copyModel.restoreCopy(id);
        } catch (error) {
            this.handleError("restore", error.message);
        } finally {
            this.hideWaiter("restoreCopy");
        }
    }

    async handleDelete(id) {
        const confirmed = await this.modalView.showConfirm(
            "Вы уверены, что хотите удалить эту копию?"
        );
        
        if (!confirmed) { console.log('not confirmed!'); return; }
        if (!this.checkSystemReady()) return;
        
        try {
            this.showWaiter("deleteCopy");
            await this.copyModel.deleteCopy(id);
            this.showMessage(messages.COPY_DELETE_SUCCESS, "Результат");
        } catch (error) {
            this.handleError("delete", error.message);
        } finally {
            this.hideWaiter("deleteCopy");
        }
    }

    checkSystemReady() {
        if (!this.stateModel.isReady) {
            this.showMessage(messages.SYSTEM_BUSY, "Предупреждение");
            return false;
        }
        return true;
    }

    startPeriodicUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.updateSystemState();
        }, 60000);
    }

    initTooltips() {
        if (typeof tippy === 'undefined') return;
        
        const tooltips = document.querySelectorAll('[tooltipe]');
        tooltips.forEach(el => {
            const text = el.getAttribute('tooltipe');
            tippy(el, {
                content: '<p class="tooltipe__text">' + text + '</p>',
                animation: 'fade',
                followCursor: true,
                arrow: false,
                allowHTML: true,
            });
        });
    }

    showWaiter(context) {
        if (this.deps.common?.waiter) {
            this.deps.common.waiter.show(context);
        }
    }

    hideWaiter(context) {
        if (this.deps.common?.waiter) {
            this.deps.common.waiter.hide(context);
        }
    }

    showMessage(message, title = "Информация") {
        if (this.deps.common?.showDialog) {
            this.deps.common.showDialog(message, title);
        } else {
            alert(`${title}: ${message}`);
        }
    }

    handleError(operation, error) {
        console.error(`Error in ${operation}:`, error);
        
        const errorMessages = {
            create: messages.COPY_CREATE_ERROR,
            delete: messages.COPY_DELETE_ERROR,
            restore: messages.RESTORE_ERROR,
            load: messages.COPY_LIST_ERROR
        };
        
        const message = errorMessages[operation] || error;
        this.showMessage(message + ": " + error, "Ошибка");
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        this.copyView.destroy();
        this.modalView.destroy();
        
        // Очищаем все события
        this.stateModel.removeAllListeners?.();
        this.copyModel.removeAllListeners?.();
    }
}