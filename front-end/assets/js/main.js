window.onload = function () {
    const loanAmount = document.querySelector('.loan-amount')
    const loanSlider = document.getElementById('sum_range')
    const loanTable = document.querySelector('.loan-sheet')
    const rangeSlider = new RangeSlider(loanSlider, loanAmount,  '#00DCCD', '#d3d3d3')
    const loanCalculator = new LoanCalculator(rangeSlider, 6, 12.7, loanTable)

    rangeSlider.onChange(loanCalculator.calculate)
}
