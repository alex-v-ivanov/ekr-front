export class StatusView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.dot = this.container?.querySelector("#statusDot");
        this.text = this.container?.querySelector("#statusText");
        
        if (!this.container) {
            console.warn(`StatusView: container ${containerId} not found`);
        }
    }

    render(state, operation, isProcessing) {
        if (!this.container) return;

        // Обновляем индикатор
        if (this.dot) {
            this.dot.className = `status-dot ${isProcessing ? 'red' : 'green'}`;
        }

        // Обновляем текст
        if (this.text) {
            this.text.innerText = operation || "";
        }

        // Обновляем класс контейнера
        if (isProcessing) {
            this.container.classList.add("processing");
        } else {
            this.container.classList.remove("processing");
        }
    }

    setProcessing(isProcessing) {
        this.render(null, this.text?.innerText || "", isProcessing);
    }

    showError(message) {
        console.error("Status error:", message);
        // Можно добавить визуальное отображение ошибки
    }
}