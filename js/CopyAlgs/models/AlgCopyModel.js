import { apiStatuses } from "../constants.js";

export const CopyStatus = {
    PROCESSING: { id: 1, text: "В процессе" },
    READY: { id: 2, text: "Готово" },
    ERROR: { id: 3, text: "Ошибка" }
};

export class AlgCopyModel extends EventTarget {
    constructor(apiService) {
        super();
        this.apiService = apiService;
        this._copies = [];
        this._isLoading = false;
    }

    get copies() { return [...this._copies]; }
    get isLoading() { return this._isLoading; }
    get isEmpty() { return this._copies.length === 0; }

    async loadCopies() {
        this._setLoading(true);
        
        try {
            const response = await this.apiService.getAlgCopiesList();
            
            if (response.status === apiStatuses.OK) {
                this._copies = JSON.parse(response.message);
                this._sortCopiesByDate();
                this._dispatchChangeEvent();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this._dispatchErrorEvent('load', error);
            throw error;
        } finally {
            this._setLoading(false);
        }
    }

    async createCopy(comment) {
        this._validateComment(comment);
        
        try {
            const response = await this.apiService.createAlgCopy(comment);
            
            if (response.status === apiStatuses.OK) {
                await this.loadCopies(); // Перезагружаем список
                this._dispatchEvent('copyCreated', { comment });
                return true;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this._dispatchErrorEvent('create', error);
            throw error;
        }
    }

    async deleteCopy(id) {
        try {
            const response = await this.apiService.deleteAlgFolder(id);
            
            if (response.status === apiStatuses.OK) {
                await this.loadCopies();
                this._dispatchEvent('copyDeleted', { id });
                return true;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this._dispatchErrorEvent('delete', error);
            throw error;
        }
    }

    async restoreCopy(id) {
        try {
            const response = await this.apiService.restoreAlgFolder(id);
            
            if (response.status === apiStatuses.OK) {
                this._dispatchEvent('copyRestored', { id });
                return true;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this._dispatchErrorEvent('restore', error);
            throw error;
        }
    }

    // Приватные методы
    _sortCopiesByDate() {
        this._copies.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
    }

    _validateComment(comment) {
        if (!comment || comment.trim() === "") {
            throw new Error("Комментарий обязателен!");
        }
    }

    _setLoading(isLoading) {
        this._isLoading = isLoading;
        this._dispatchEvent('loadingChanged', { isLoading });
    }

    _dispatchChangeEvent() {
        this.dispatchEvent(new CustomEvent('copiesChanged', {
            detail: { copies: this._copies }
        }));
    }

    _dispatchEvent(type, detail) {
        this.dispatchEvent(new CustomEvent(type, { detail }));
    }

    _dispatchErrorEvent(operation, error) {
        this.dispatchEvent(new CustomEvent('error', {
            detail: { operation, error: error.message }
        }));
    }
}