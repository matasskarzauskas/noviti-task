window.RangeSlider = class RangeSlider {
    constructor(slider, valueOutputEl, usedRangeColor, backgroundColor, minimumFractionDigits = 0, locale = 'lt-LT', currency = 'EUR') {
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

    onChange(callback) {
        this.slider.addEventListener('input', (e) => {
            callback(e.target.value)
        });
    }
}

window.LoanCalculator = class LoanCalculator {
    constructor(loanRangeSlider, loanTerm, interestRate, loanTable) {
        this.loanRangeSlider = loanRangeSlider;
        this.loanTerm = loanTerm;
        this.interestRate = interestRate;
        this.loanTable = loanTable;
        this.init();
    }

    init = () => {
        this.calculate()
    }

    calculate = () => {
        this.loanTable.innerHTML = '';
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
        let tableData = [];

        const tableGenerator = new TableGenerator(this.loanTable, [
            'No.',
            'Remaining credit amount',
            'Principal part',
            'Interest',
            'Total payment'
        ])

        for (let i = 0; i < numberOfPayments; i++) {
            let interest = balance * monthlyInterestRate;
            let principal = monthlyPayment - interest;

            if (i === this.loanTerm - 1) {
                let roundingError = balance - principal;
                roundingError = Number(roundingError.toFixed(2));
                principal += roundingError;
                monthlyPayment += roundingError;
                totalInterest += roundingError;
                totalPayment += roundingError;

                balance = Math.abs(balance - principal)
            } else {
                balance = balance - principal;
            }

            tableGenerator.addRow([i + 1, balance.toFixed(2), principal.toFixed(2), interest.toFixed(2), monthlyPayment.toFixed(2)])
            tableData.push([i + 1, balance.toFixed(2), principal.toFixed(2), interest.toFixed(2), monthlyPayment.toFixed(2)])
        }

        tableGenerator.addRow(['', 'Iš viso:', totalPrincipal.toFixed(2) + ' €', totalInterest.toFixed(2) + ' €', totalPayment.toFixed(2) + ' €'])
        tableData.push(['', 'Iš viso:', totalPrincipal.toFixed(2) + ' €', totalInterest.toFixed(2) + ' €', totalPayment.toFixed(2) + ' €'])
        this.loanTable.innerHTML = tableGenerator.getTable();

        return tableData
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
