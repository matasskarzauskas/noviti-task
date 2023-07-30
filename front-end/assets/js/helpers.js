const API_URL = 'http://127.0.0.1:8080/api/';

window.RangeSlider = class RangeSlider {
    constructor(slider, valueOutputEl, usedRangeColor, backgroundColor, locale, currency, minimumFractionDigits = 0) {
        this.slider = slider;
        this.usedRangeColor = usedRangeColor;
        this.backgroundColor = backgroundColor;
        this.valueOutputEl = valueOutputEl
        this.priceFormatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits
        });
        this.init();
    }

    init() {
        this.valueOutputEl.innerHTML = this.priceFormatter.format(this.slider.value)
        this.slider.style.background = this.getBackground();

        this.slider.addEventListener('input', (e) => {
            this.valueOutputEl.innerHTML = this.priceFormatter.format(e.target.value)
            this.slider.style.background = this.getBackground();
        });
    }

    getBackground() {
        let percentage = (this.slider.value - this.slider.min) / (this.slider.max - this.slider.min) * 100;
        return 'linear-gradient(to right, ' + this.usedRangeColor + ' 0%, ' + this.usedRangeColor + ' ' + percentage + '%, ' +
            this.backgroundColor + ' ' + percentage + '%, ' + this.backgroundColor + ' 100%)';
    }

    getValue() {
        return this.slider.value
    }

    onChange = (callback, event) => {
        this.slider.addEventListener(event, callback);
    }

    deleteListener = (callback) => {
        this.slider.removeEventListener('input', callback);
        this.slider.removeEventListener('change', callback);
    }
}

window.LoanCalculator = class LoanCalculator {
    constructor(loanRangeSlider, loanTerm, interestRate, loanTable, locale, currency, minimumFractionDigits) {
        this.loanRangeSlider = loanRangeSlider;
        this.loanTerm = loanTerm;
        this.interestRate = interestRate;
        this.loanTable = loanTable;
        this.exportData = null
        this.priceFormatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits,
        });
        this.init();
    }

    init = () => {
        this.calculate()
    }

    calculate = () => {
        this.exportData = [];
        this.loanAmount = Number(this.loanRangeSlider.getValue());

        let monthlyInterestRate = this.interestRate / 100 / 12;
        let numberOfPayments = this.loanTerm;
        let compoundedInterestRate = Math.pow(1 + monthlyInterestRate, numberOfPayments);
        let interestMultiplier = (monthlyInterestRate * compoundedInterestRate) / (compoundedInterestRate - 1);
        let monthlyPayment = this.loanAmount * interestMultiplier;
        monthlyPayment = Number(monthlyPayment.toFixed(2));
        let totalInterest = monthlyPayment * numberOfPayments - this.loanAmount;
        let totalPayment = monthlyPayment * numberOfPayments;
        let totalPrincipal = this.loanAmount;
        let balance = this.loanAmount;

        let headers = [
            'No.',
            'Remaining credit amount',
            'Principal part',
            'Interest',
            'Total payment'
        ];

        const tableGenerator = new TableGenerator(this.loanTable, headers)
        this.exportData.push(headers);

        for (let i = 0; i < numberOfPayments; i++) {
            let interest = balance * monthlyInterestRate;
            let principal = monthlyPayment - interest;

            if (i === this.loanTerm - 1) {
                let roundingError = balance - principal;
                principal += roundingError;
                monthlyPayment += roundingError;
                totalInterest += roundingError;
                totalPayment += roundingError;

                balance = Math.abs(balance - principal)
            } else {
                balance = balance - principal;
            }

            tableGenerator.addRow([i + 1, balance.toFixed(2), principal.toFixed(2), interest.toFixed(2), monthlyPayment.toFixed(2)])
            this.exportData.push([i + 1, balance.toFixed(2), principal.toFixed(2), interest.toFixed(2), monthlyPayment.toFixed(2)])
        }

        tableGenerator.addRow(['', 'Iš viso:', this.priceFormatter.format(totalPrincipal), this.priceFormatter.format(totalInterest), this.priceFormatter.format(totalPayment)])
        this.exportData.push(['', 'Iš viso:', this.priceFormatter.format(totalPrincipal), this.priceFormatter.format(totalInterest), this.priceFormatter.format(totalPayment)])
        this.loanTable.innerHTML = tableGenerator.getTable();
    }
}

window.ApiLoanCalculator = class ApiLoanCalculator {
    constructor(loanRangeSlider, loanTerm, interestRate, loanTable, locale, currency, minimumFractionDigits) {
        this.loanRangeSlider = loanRangeSlider;
        this.loanTerm = loanTerm;
        this.interestRate = interestRate;
        this.loanTable = loanTable;
        this.timeout = null;
        this.controller = null;
        this.exportData = null
        this.priceFormatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits
        });
        this.calculate()
    }

    calculate = () => {
        clearTimeout(this.timeout);

        if (this.controller) {
            this.controller.abort();
        }

        this.controller = new AbortController();

        this.timeout = setTimeout(() => {
            this.callApi();
        }, 100);
    }

    callApi = () => {
        this.loanAmount = Number(this.loanRangeSlider.getValue()).toFixed(2);
        this.loanTable.classList.add('loading');

        fetch(API_URL + 'loan/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: this.loanAmount,
                duration: this.loanTerm,
                interestRate: this.interestRate
            }),
            signal: this.controller.signal
        }).then(response => {
            return response.json();
        }).then(data => {
            let loanData = data.message

            if (loanData.length === 0) {
                this.loanTable.innerHTML = 'No data'
            }

            this.processData(loanData);
            this.loanTable.classList.remove('loading');
        }).catch(error => {
            this.loanTable.classList.remove('loading');
        });
    }

    processData = (loanData) => {
        this.exportData = [];
        let headers = [
            'No.',
            'Remaining credit amount',
            'Principal part',
            'Interest',
            'Total payment'
        ];
        const tableGenerator = new TableGenerator(this.loanTable, headers)

        this.exportData.push(headers);

        let monthlyEntries = Object.values(loanData.monthlyEntries)


        for (let i = 0; i < monthlyEntries.length; i++) {
            tableGenerator.addRow(Object.values(monthlyEntries[i]))
            this.exportData.push(Object.values(monthlyEntries[i]))
        }

        let totals = Object.values(loanData.totals)
        totals.unshift('Iš viso:')
        totals.unshift('')

        for (let i = 0; i < totals.length; i++) {
            if (typeof totals[i] === 'number')
                totals[i] = this.priceFormatter.format(totals[i])
        }

        tableGenerator.addRow(totals)
        this.exportData.push(totals)
        this.loanTable.innerHTML = tableGenerator.getTable();
    }
}

window.Exporter = class Exporter {
    constructor(data, filename, endpoint, method = 'POST') {
        this.data = data;
        this.filename = filename;
        this.endpoint = endpoint;
        this.method = method;
    }

    export() {
        fetch(API_URL + 'loan/' + this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rows: this.data,
                filename: this.filename
            })
        }).then(response => {
            return response.blob();
        }).then(response => {
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', this.filename);
            document.body.appendChild(link);
            link.click();
        }).catch(error => {
            console.log(error)
        });
    }
}


window.TableGenerator = class TableGenerator {
    constructor(table, headers, ) {
        this.table = table;
        this.headers = headers;
        this.init();
    }

    init = () => {
        let tableHTML = '<table><thead><tr>';

        for (let i = 0; i < this.headers.length; i++) {
            tableHTML += '<th scope="col">' + this.headers[i] + '</th>';
        }

        tableHTML += '</tr></thead><tbody>';
        this.table = tableHTML;
    }

    addRow = (data) => {
        this.table += '<tr>';

        for (let i = 0; i < data.length; i++) {
            this.table += '<td>' + data[i] + '</td>';
        }

        this.table += '</tr>';
    }

    getTable = () => {
        this.table += '</tbody></table>';

        return this.table;
    }
}
