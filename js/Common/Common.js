var preOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url) {
    var args = Array.prototype.slice.call(arguments, 0);
    if (url.match(/\.less$/)) {
        url += `?time=${Date.now()}`;
        args[1] = url;
    }
    return preOpen.apply(this, args);
};

function getCurrentPath() {
    return typeof window !== "undefined" && window.top && window.top.document && window.top.document.location
        ? window.top.document.location.pathname.split("/Reports")[0]
        : "";
}

/**
 * Чтение параметров из URL (moniker, urlbi и др.).
 */
export function getJsonFromUrl() {
    var url = decodeURIComponent(location.search || "");
    var query = url.substr(1);
    var result = {};
    if (query) {
        query.split("&").forEach(function (part) {
            var item = part.split("=");
            if (item[0]) result[item[0]] = decodeURIComponent(item[1] || "");
        });
    }
    return result;
}

/**
 * Единая конфигурация приложения. Инициализация ClientServiceUrl, Moniker и urlPars из URL.
 */
export function Config() {
    this.urlPars = null;
    this.Moniker = null;
    this.ClientServiceUrl = null;
}

Config.prototype.Initialize = function () {
    this.urlPars = getJsonFromUrl();

    console.log('URL PARS: ' + JSON.stringify(this.urlPars))

    if (this.urlPars && this.urlPars.moniker) this.Moniker = this.urlPars.moniker;
    if (this.urlPars && this.urlPars.urlbi) this.ClientServiceUrl = this.urlPars.urlbi;
    return this;
};

/**
 * Общий набор утилит и компонентов. Зависимости передаются через конструктор (config с currentPath).
 */
export function CommonClass(config) {
    var self = this;
    var currentPath = (config && config.currentPath) || getCurrentPath();
    this.config = config || {};
    this.StatusId = null;
    this.urlPars = null;
    this.metabase = null;
    this.Path = {
        ImgPP: currentPath + "/assets/platform_modules/build/img/"
    };
    this.waiter = {
        waiters: [],
        show: function (id) {
            if (id == undefined)
                id = "waiter";
            if (self.waiter.waiters.indexOf(id) == -1) {
                self.waiter.waiters.push(id);
                $('.waiter').removeClass("Hidden");
                debugLog("waiters : ", self.waiter.waiters.join(", "));
            }
        },
        hide: function (id) {
            if (id == undefined)
                id = "waiter";
            if (self.waiter.waiters.indexOf(id) != -1) {
                self.waiter.waiters.splice(self.waiter.waiters.indexOf(id), 1);
                debugLog("waiters : ", self.waiter.waiters.join(", "));
            }
            if (self.waiter.waiters.length == 0)
                $('.waiter').addClass("Hidden");
        },
        hideAll: function () {
            self.waiter.waiters = [];
            $('.waiter').addClass("Hidden");
        }
    };
    this.Confirm = null;
    this.Exclamation = null;
    this.Error = null;
    this.Information = null;
    this.Custom = null;
}

CommonClass.prototype.Clone = function (obj) {
    if (obj == null || typeof (obj) != 'object')
        return obj;
    var temp = new obj.constructor();
    for (var key in obj)
        temp[key] = this.Clone(obj[key]);
    return temp;
};

CommonClass.prototype.docReady = function () {
    debugLog("docReady");
    this.Confirm = this.CreateConfirm();
    this.Exclamation = this.CreateExclamation();
    this.Error = this.CreateError();
    this.Information = this.CreateInformation();
    this.Custom = this.CreateCustom();
};

CommonClass.prototype.CreateConfirm = function () {
    var component = new PP.Ui.ConfirmDialog({
        ImagePath: this.Path.ImgPP
    });
    component.Closed.add(
        function () {
            this.getYesButton().Click.clear();
        }
    );
    return component;
};

CommonClass.prototype.CreateExclamation = function () {
    var component = new PP.Ui.Message({
        ImagePath: this.Path.ImgPP,
        Type: PP.Ui.MessageType.Exclamation
    });
    return component;
};

CommonClass.prototype.CreateError = function () {
    var component = new PP.Ui.Message({
        ImagePath: this.Path.ImgPP,
        Type: PP.Ui.MessageType.Error
    });
    return component;
};

CommonClass.prototype.CreateInformation = function () {
    var component = new PP.Ui.Message({
        ImagePath: this.Path.ImgPP,
        Type: PP.Ui.MessageType.Information
    });
    component.setHeight(175);
    return component;
};

CommonClass.prototype.CreateCustom = function () {
    var component = new PP.Ui.Message({
        ImagePath: this.Path.ImgPP,
        Type: PP.Ui.MessageType.Custom
    });
    return component;
};

CommonClass.prototype.getAttrValue = function (attr, idx, dv) {
    return dv ? attr.ea.it[idx]["@dv"].slice(1).replace('(', '').replace(')', '') : attr.ea.it[idx]["@v"];
};

CommonClass.prototype.dateFromStr = function (str) {
    if (str.indexOf(".") > -1) {
        var dt = str.split('.');
        return new Date(dt[2], parseInt(dt[0], 10) - 1, parseInt(dt[1], 10));
    } else if (str.indexOf("-") > -1) {
        var dt = str.split('T')[0].split('-');
        return new Date(dt[0], parseInt(dt[1], 10) - 1, dt[2]);
    }
};

CommonClass.prototype.dateToStr = function (date) {
    return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
};

CommonClass.prototype.getPeriodName = function (period) {
    if (period == "5")
        return "День";
    else if (period == "4")
        return "Месяц";
    else if (period == "3")
        return "Квартал";
    else if (period == "2")
        return "Полугодие";
    else if (period == "1")
        return "Год";
};

CommonClass.prototype.SortTable = function (th) {
    var table = th.closest('table');
    var tbody = table.querySelector('tbody');
    Array.from(tbody.querySelectorAll('tr'))
        .sort(comparer(Array.from(th.parentNode.children).indexOf(th), th.asc = !th.asc))
        .forEach(function (tr) { tbody.appendChild(tr); });

    $(th).addClass(th.asc ? "asc" : "desc");
    $(th).removeClass(th.asc ? "desc" : "asc");
};

var getCellValue = function (tr, idx) { return tr.children[idx].innerText || tr.children[idx].textContent; };

var comparer = function (idx, asc) {
    return function (a, b) {
        var v1 = getCellValue(a, idx);
        var v2 = getCellValue(b, idx);

        var isX1 = v1 === 'x';
        var isX2 = v2 === 'x';

        if (isX1 && !isX2) return 1;
        if (!isX1 && isX2) return -1;
        if (isX1 && isX2) return 0;

        var num1 = parseFloat(v1);
        var num2 = parseFloat(v2);

        if (!isNaN(num1) && !isNaN(num2)) {
            return asc ? num1 - num2 : num2 - num1;
        }

        return asc ? v1.toString().localeCompare(v2) : v2.toString().localeCompare(v1);
    };
};

CommonClass.prototype.showDialog = function (mes, type, func) {
    this.waiter.hideAll();

    if (mes != null && mes != 'undefined' && mes != '') {
        var dialog = null;

        switch (type) {
            case "Exclamation":
                dialog = this.Exclamation;
                break;
            case "Error":
                dialog = this.Error;
                break;
            case "Custom":
                dialog = this.Custom;
                break;
            default:
                dialog = this.Information;
                break;
        }

        if (!mes)
            mes = "";
        mes += "";
        while (mes.indexOf("\n") + 1)
            mes = mes.replace("\n", "<br/>");

        dialog.setContent(mes);
        dialog.show();
        if (func)
            dialog.OkButtonClicked.add(function () {
                func();
            });
        dialog.Closed.add(function () {
            dialog.OkButtonClicked.clearAll();
        });
    }
};

CommonClass.prototype.checkStatusPP = function () {
    if (this.metabase)
        this.metabase.GetStatus();
};

Date.prototype.toJSON = function () {
    var dt = this.getFullYear() + '-' + (this.getMonth() + 1).toString().padStart(2, '0') + '-' + this.getDate().toString().padStart(2, '0') + 'T00:00:00Z';
    return dt;
};

Date.prototype.toShortDate = function () {
    var dt = this.getDate().toString().padStart(2, '0') + '.' + (this.getMonth() + 1).toString().padStart(2, '0') + '.' + this.getFullYear();
    return dt;
};

