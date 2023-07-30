window.onload = function () {
    const locale = 'lt-LT'
    const currency = 'EUR'
    const loanAmount = document.querySelector('.loan-amount')
    const loanSlider = document.getElementById('sum_range')
    const loanTable = document.querySelector('.loan-sheet')
    const rangeSlider = new RangeSlider(loanSlider, loanAmount,  '#00DCCD', '#d3d3d3', locale, currency, 0)
    const logicSwitch = document.querySelectorAll('input[name="calculator"]');

    logicSwitch.forEach((item) => {
        item.addEventListener('change', () => {

            if (window.loanCalculator)
                rangeSlider.deleteListener(window.loanCalculator.calculate, (item.value === "js") ? 'input' : 'change');

            if (item.value === "js") {
                window.loanCalculator = new LoanCalculator(rangeSlider, 6, 12.7, loanTable, locale, currency, 2)
            } else {
                window.loanCalculator = new ApiLoanCalculator(rangeSlider, 6, 12.7, loanTable, locale, currency, 2)
            }

            rangeSlider.onChange(window.loanCalculator.calculate, (item.value === "js") ? 'input' : 'change');
        });
    })

    if (document.querySelector('input[name="calculator"]:checked').value === "js") {
        window.loanCalculator = new LoanCalculator(rangeSlider, 6, 12.7, loanTable, locale, currency, 2)
    } else {
        window.loanCalculator = new ApiLoanCalculator(rangeSlider, 6, 12.7, loanTable, locale, currency, 2)
    }

    rangeSlider.onChange(window.loanCalculator.calculate, 'input')
}

const saveToFile = () => {
    let exporter = new Exporter(window.loanCalculator.exportData, 'loan-sheet.csv', 'export')
    exporter.export()
}

const getHistory = () => {
    let exporter = new Exporter(window.loanCalculator.exportData, 'loan-history.csv', 'history', 'GET')
    exporter.export()
}
