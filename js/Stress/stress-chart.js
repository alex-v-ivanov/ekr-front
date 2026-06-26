/**
 * График подбора распределения (ECharts) в модальном окне.
 */
export class StressChart {
    constructor(stress) {
        this.stress = stress;
        this.canvas = null;
        this.usedColors = [];
        this.width = null;
        this.height = null;
        this.indicatorType = null;
        this.fullIcon = 'path://M27 6V12C27 12.2652 26.8946 12.5196 26.7071 12.7071C26.5196 12.8946 26.2652 13 26 13C25.7348 13 25.4804 12.8946 25.2929 12.7071C25.1054 12.5196 25 12.2652 25 12V8.41375L18.7075 14.7075C18.5199 14.8951 18.2654 15.0006 18 15.0006C17.7346 15.0006 17.4801 14.8951 17.2925 14.7075C17.1049 14.5199 16.9994 14.2654 16.9994 14C16.9994 13.7346 17.1049 13.4801 17.2925 13.2925L23.5863 7H20C19.7348 7 19.4804 6.89464 19.2929 6.70711C19.1054 6.51957 19 6.26522 19 6C19 5.73478 19.1054 5.48043 19.2929 5.29289C19.4804 5.10536 19.7348 5 20 5H26C26.2652 5 26.5196 5.10536 26.7071 5.29289C26.8946 5.48043 27 5.73478 27 6ZM13.2925 17.2925L7 23.5863V20C7 19.7348 6.89464 19.4804 6.70711 19.2929C6.51957 19.1054 6.26522 19 6 19C5.73478 19 5.48043 19.1054 5.29289 19.2929C5.10536 19.4804 5 19.7348 5 20V26C5 26.2652 5.10536 26.5196 5.29289 26.7071C5.48043 26.8946 5.73478 27 6 27H12C12.2652 27 12.5196 26.8946 12.7071 26.7071C12.8946 26.5196 13 26.2652 13 26C13 25.7348 12.8946 25.4804 12.7071 25.2929C12.5196 25.1054 12.2652 25 12 25H8.41375L14.7075 18.7075C14.8951 18.5199 15.0006 18.2654 15.0006 18C15.0006 17.7346 14.8951 17.4801 14.7075 17.2925C14.5199 17.1049 14.2654 16.9994 14 16.9994C13.7346 16.9994 13.4801 17.1049 13.2925 17.2925Z ';
        this.exitFullIcon = 'path://M26.7074 6.70751L20.4137 13H23.9999C24.2652 13 24.5195 13.1054 24.7071 13.2929C24.8946 13.4804 24.9999 13.7348 24.9999 14C24.9999 14.2652 24.8946 14.5196 24.7071 14.7071C24.5195 14.8946 24.2652 15 23.9999 15H17.9999C17.7347 15 17.4804 14.8946 17.2928 14.7071C17.1053 14.5196 16.9999 14.2652 16.9999 14V8.00001C16.9999 7.73479 17.1053 7.48044 17.2928 7.2929C17.4804 7.10536 17.7347 7.00001 17.9999 7.00001C18.2652 7.00001 18.5195 7.10536 18.7071 7.2929C18.8946 7.48044 18.9999 7.73479 18.9999 8.00001V11.5863L25.2924 5.29251C25.4801 5.10487 25.7346 4.99945 25.9999 4.99945C26.2653 4.99945 26.5198 5.10487 26.7074 5.29251C26.8951 5.48015 27.0005 5.73464 27.0005 6.00001C27.0005 6.26537 26.8951 6.51987 26.7074 6.70751ZM13.9999 17H7.99995C7.73473 17 7.48038 17.1054 7.29284 17.2929C7.1053 17.4804 6.99995 17.7348 6.99995 18C6.99995 18.2652 7.1053 18.5196 7.29284 18.7071C7.48038 18.8947 7.73473 19 7.99995 19H11.5862L5.29245 25.2925C5.10481 25.4801 4.99939 25.7346 4.99939 26C4.99939 26.2654 5.1048 26.5199 5.29245 26.7075C5.48009 26.8951 5.73458 27.0006 5.99995 27.0006C6.26531 27.0006 6.5198 26.8951 6.70745 26.7075L12.9999 20.4138V24C12.9999 24.2652 13.1053 24.5196 13.2928 24.7071C13.4804 24.8947 13.7347 25 13.9999 25C14.2652 25 14.5195 24.8947 14.7071 24.7071C14.8946 24.5196 14.9999 24.2652 14.9999 24V18C14.9999 17.7348 14.8946 17.4804 14.7071 17.2929C14.5195 17.1054 14.2652 17 13.9999 17Z';
        this.restore = 'path://M1.90321 7.29677C1.90321 10.341 4.11041 12.4147 6.58893 12.8439C6.87255 12.893 7.06266 13.1627 7.01355 13.4464C6.96444 13.73 6.69471 13.9201 6.41109 13.871C3.49942 13.3668 0.86084 10.9127 0.86084 7.29677C0.860839 5.76009 1.55996 4.55245 2.37639 3.63377C2.96124 2.97568 3.63034 2.44135 4.16846 2.03202L2.53205 2.03202C2.25591 2.03202 2.03205 1.80816 2.03205 1.53202C2.03205 1.25588 2.25591 1.03202 2.53205 1.03202L5.53205 1.03202C5.80819 1.03202 6.03205 1.25588 6.03205 1.53202L6.03205 4.53202C6.03205 4.80816 5.80819 5.03202 5.53205 5.03202C5.25591 5.03202 5.03205 4.80816 5.03205 4.53202L5.03205 2.68645L5.03054 2.68759L5.03045 2.68766L5.03044 2.68767L5.03043 2.68767C4.45896 3.11868 3.76059 3.64538 3.15554 4.3262C2.44102 5.13021 1.90321 6.10154 1.90321 7.29677ZM13.0109 7.70321C13.0109 4.69115 10.8505 2.6296 8.40384 2.17029C8.12093 2.11718 7.93465 1.84479 7.98776 1.56188C8.04087 1.27898 8.31326 1.0927 8.59616 1.14581C11.4704 1.68541 14.0532 4.12605 14.0532 7.70321C14.0532 9.23988 13.3541 10.4475 12.5377 11.3662C11.9528 12.0243 11.2837 12.5586 10.7456 12.968L12.3821 12.968C12.6582 12.968 12.8821 13.1918 12.8821 13.468C12.8821 13.7441 12.6582 13.968 12.3821 13.968L9.38205 13.968C9.10591 13.968 8.88205 13.7441 8.88205 13.468L8.88205 10.468C8.88205 10.1918 9.10591 9.96796 9.38205 9.96796C9.65819 9.96796 9.88205 10.1918 9.88205 10.468L9.88205 12.3135L9.88362 12.3123C10.4551 11.8813 11.1535 11.3546 11.7585 10.6738C12.4731 9.86976 13.0109 8.89844 13.0109 7.70321Z';
    }

    init() {
        const padding = 70;
        const width = $('.page__stress').width() / 2 - padding;
        this.canvas = echarts.init(document.getElementById('SelectDistributionChart'), null, {
            width: width + 'px',
            height: '500px',
            renderer: 'canvas',
            useDirtyRect: false,
            locale: "RU"
        });
        this.width = this.canvas.getWidth();
        this.height = this.canvas.getHeight();

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                setTimeout(() => {
                    this.canvas.setOption({ backgroundColor: '' });
                    this.canvas.resize({ width: this.width + 'px', height: this.height + 'px' });
                }, 100);
            }
        });

        const self = this;
        const option = {
            title: { text: 'График', left: 'center' },
            tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
            legend: { data: [], orient: 'horizontal', bottom: 0, left: 'center', selected: {} },
            grid: { left: '5%', right: '5%', bottom: '15%', containLabel: true },
            xAxis: { type: 'value', boundaryGap: true, data: [], name: "Значения", nameLocation: 'center', nameGap: 40, axisLabel: { rotate: 45 } },
            yAxis: [{ type: 'value', name: 'Плотность' }],
            dataZoom: [
                { type: 'slider', show: true, realtime: true, height: 20, bottom: 40, filterMode: 'filter' },
                { type: 'inside', realtime: true, xAxisIndex: 0, minSpan: 1 }
            ],
            series: [],
            toolbox: {
                feature: {
                    myRestore: {
                        show: true,
                        title: 'Отобразить все',
                        icon: self.restore,
                        onclick: function () {
                            $('#SelectDistributionGrid [distribution] input[type="checkbox"]:not(:checked)').each(function () {
                                $(this).prop('checked', true);
                                this.dispatchEvent(new Event('change', { bubbles: true }));
                            });
                        }
                    },
                    dataView: {
                        show: true,
                        readOnly: true,
                        title: 'Просмотр данных',
                        buttonColor: '#1e90ff',
                        lang: ['Просмотр данных', 'Закрыть', 'Обновить'],
                        optionToContent: function (opt) {
                            const axisData = opt.xAxis[0].data;
                            const series = opt.series;
                            let tableHead = `<th></th>`;
                            let tableBody = ``;
                            series.forEach(item => { tableHead += `<th class="font-mono font-semibold text-black text-base" style="width: 200px;overflow: hidden;overflow-wrap: anywhere;">${item.name}</th>`; });
                            axisData.forEach((date, index) => {
                                tableBody += `<tr><td>${date}</td>`;
                                series.forEach(item => { tableBody += `<td><p class="font-mono font-normal text-black text-base text-center" style="width: 200px;overflow: hidden;overflow-wrap: anywhere;">${item.data[index] !== null ? item.data[index] : '-'}</p></td>`; });
                                tableBody += `</tr>`;
                            });
                            return `<table style="width:max-content;"><thead><tr>${tableHead}</tr></thead><tbody>${tableBody}</tbody></table>`;
                        }
                    },
                    myfullscreen: {
                        show: true,
                        title: 'Полный экран',
                        icon: self.fullIcon,
                        onclick: function (e) {
                            const container = self.canvas.getDom();
                            if (!document.fullscreenElement) {
                                container.requestFullscreen().then(() => {
                                    e.option.toolbox[0].feature.myfullscreen.title = 'Выйти из полного экрана';
                                    e.option.toolbox[0].feature.myfullscreen.icon = self.exitFullIcon;
                                    self.canvas.setOption({ backgroundColor: '#ffffff' });
                                    self.canvas.resize({ width: window.screen.width + 'px', height: window.screen.height + 'px' });
                                });
                            } else {
                                document.exitFullscreen().then(() => {
                                    setTimeout(() => {
                                        const padding = 70;
                                        const w = $('.page__stress').width() / 2 - padding;
                                        e.option.toolbox[0].feature.myfullscreen.title = 'Полный экран';
                                        e.option.toolbox[0].feature.myfullscreen.icon = self.fullIcon;
                                        self.canvas.setOption({ backgroundColor: '' });
                                        self.canvas.resize({ width: w + 'px', height: '500px' });
                                        self.canvas.getDom().offsetHeight;
                                    }, 100);
                                });
                            }
                        }
                    }
                }
            },
        };
        this.canvas.setOption(option);
        window.addEventListener('resize', () => this.canvas.resize());
    }

    formatDateToMonthYear(dateStr) {
        const [month, year] = dateStr.split('.');
        const monthNames = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
        return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
    }

    loadingData(indicatorType) {
        const padding = 70;
        const width = $('.page__stress').width() / 2 - padding;
        this.indicatorType = indicatorType;
        const option = this.canvas.getOption();
        const $input = $('.ListRow[isactive="true"]');
        const rowId = $input.attr('row-id');
        const inputData = this.stress.inputDataRows.find(item => item.number === Number(rowId));
        const dist = this.stress.InputSelectDistribution.distributionObj;

        if (dist.results.length > 0) {
            if (this.indicatorType === 1) {
                const xData = dist.bin_centers || [];
                const yData = dist.bin_heights || [];
                option.xAxis[0].data = xData;
                option.yAxis[0].data = yData;
                option.xAxis[0].type = 'value';
                const name = 'Факт';
                if (!option.series.find(item => item.name === name)) {
                    option.series.push({
                        barWidth: '100%',
                        name,
                        data: xData.map((item, index) => [item, yData[index]]),
                        type: 'bar',
                        itemStyle: { borderColor: '#234dcf', borderWidth: 1.5 }
                    });
                }
                option.xAxis[0].name = "Значения";
                option.yAxis = [{ type: 'value', name: "Плотность" }];
                option.legend[0].data.push(name);
            } else if (this.indicatorType === 2) {
                const xData = dist.bin_centers;
                option.xAxis[0].data = xData;
                option.xAxis[0].min = undefined;
                option.xAxis[0].max = undefined;
                option.xAxis[0].type = 'category';
                let name = 'Исторические данные';
                let nameYAxis = 'Исторические данные';
                if (inputData && inputData.ExcelType === 1 && inputData.ExcelGUID !== "") {
                    name = 'Факт';
                    nameYAxis = "Значения";
                }
                if (!option.series.find(item => item.name === name)) {
                    option.series.push({ name, data: dist.bin_heights, type: 'line' });
                }
                option.yAxis = [{ type: 'value', name: nameYAxis }];
                option.legend[0].data.push(name);
                option.xAxis[0].name = "Периоды";
            }
        } else {
            option.legend[0].data = [];
            option.series = [];
            option.xAxis[0].data = [];
        }
        this.canvas.setOption(option, true);
        this.width = width;
        this.height = "500px";
        this.canvas.resize({ width: width + 'px', height: '500px' });
    }

    addSeries(distType, values, xAxis) {
        const option = this.canvas.getOption();
        const color = this.getRandomColor(this.usedColors);
        const newSeries = {
            name: distType,
            type: 'line',
            data: values.points,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: { width: 2, color },
            lineStyle: { width: 2, color }
        };
        if (this.indicatorType === 2) {
            const xAxisData = values.points.map(item => item[0]);
            option.xAxis[0].data = option.xAxis[0].data !== undefined ? option.xAxis[0].data.concat(xAxisData.filter(item => !option.xAxis[0].data.includes(item))) : xAxisData;
        }
        this.usedColors.push(color);
        option.series.push(newSeries);
        if (option.legend && option.legend.length > 0) option.legend[0].data.push(distType);
        this.canvas.setOption(option, true);
        return color;
    }

    removeSeries(distType) {
        const option = this.canvas.getOption();
        const seriesIndex = option.series.findIndex(s => s.name === distType);
        if (seriesIndex !== -1) {
            const colorToRemove = option.series[seriesIndex].itemStyle.color;
            this.usedColors = this.usedColors.filter(c => c !== colorToRemove);
            option.series.splice(seriesIndex, 1);
            if (option.legend && option.legend.length > 0) {
                const legendIndex = option.legend[0].data.indexOf(distType);
                if (legendIndex !== -1) option.legend[0].data.splice(legendIndex, 1);
            }
            this.canvas.setOption(option, true);
        }
    }

    getRandomColor(existingColors = []) {
        const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        if (existingColors.length >= 16777213) throw new Error("Все возможные цвета уже использованы");
        let color;
        do {
            const r = getRandomInt(1, 254);
            const g = getRandomInt(1, 254);
            const b = getRandomInt(1, 254);
            color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        } while (color === '#000000' || color === '#ffffff' || existingColors.includes(color));
        return color;
    }

    clear() {
        const option = this.canvas.getOption();
        option.legend[0].data = [];
        option.series = [];
        option.xAxis[0].data = [];
        this.canvas.setOption(option, true);
        this.canvas.resize({ width: this.width + 'px', height: this.height + 'px' });
    }
}
