window.onload = function () {
    const loanAmount = document.querySelector('.loan-amount')
    const loanSlider = document.getElementById('sum_range')
    const loanTable = document.querySelector('.loan-sheet')
    const rangeSlider = new RangeSlider(loanSlider, loanAmount,  '#00DCCD', '#d3d3d3')
    const logicSwitch = document.querySelectorAll('input[name="calculator"]');

    logicSwitch.forEach((item) => {
        item.addEventListener('change', () => {

            if (window.loanCalculator)
                rangeSlider.deleteListener(window.loanCalculator.calculate, (item.value === "js") ? 'input' : 'change');

            if (item.value === "js") {
                window.loanCalculator = new LoanCalculator(rangeSlider, 6, 12.7, loanTable)
            } else {
                window.loanCalculator = new ApiLoanCalculator(rangeSlider, 6, 12.7, loanTable)
            }

            rangeSlider.onChange(window.loanCalculator.calculate, (item.value === "js") ? 'input' : 'change');
        });
    })

    if (document.querySelector('input[name="calculator"]:checked').value === "js") {
        window.loanCalculator = new LoanCalculator(rangeSlider, 6, 12.7, loanTable)
    } else {
        window.loanCalculator = new ApiLoanCalculator(rangeSlider, 6, 12.7, loanTable)
    }

    rangeSlider.onChange(window.loanCalculator.calculate, 'input')
}
