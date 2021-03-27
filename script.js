window.jsPDF = window.jspdf.jsPDF;

const PAGE_WIDTH = 8.5 // inches
const PAGE_HEIGHT = 11; // inches
const PAGE_MARGIN = 0.25; // inches

const COMPANY_NAME = 'Bulldog Mail Service';
const COMPANY_ADDRESS = '310 N Hine Ave\nWaukesha, WI 53188';
const EMPLOYEE_ADDRESS = '123 Main St\nWaukesha, WI 53188';
const DASH_Y_POS = PAGE_HEIGHT * (2.125 / 3);
const CHECK = {
    xPos: PAGE_MARGIN,
    yPos: DASH_Y_POS + PAGE_MARGIN,
    width: PAGE_WIDTH - (PAGE_MARGIN * 2),
    height: PAGE_HEIGHT - (PAGE_MARGIN * 2) - DASH_Y_POS
};
const IMAGE = {
    signature: document.getElementsByTagName('img')[0],
    mascot: document.getElementsByTagName('img')[1],
    logo: document.getElementsByTagName('img')[2]
};

const inchToPoint = (inch) => inch * 72;
const pointToInch = (point) => point / 72;

const moneyToWords = (money) => {
    let [ dollars, cents ] = money.replace('$', '').split('.').map(money => +money);
    const dollarWords = numberToWords.toWords(dollars).toUpperCase();
    const dollarsLabel = dollars === 1 ? 'BUCK' : 'BUCKS';
    const centsLabel = cents === 1 ? 'CENT' : 'CENTS';
    return `${dollarWords} ${dollarsLabel} AND ${cents} ${centsLabel}`;
};

// Initializing Materialize
let datePickerElements = document.querySelectorAll('.datepicker');
let datePickerInstances = M.Datepicker.init(datePickerElements, { autoClose: true, format: 'mm/dd/yyyy' });
let sideNavElements = document.querySelectorAll('.sidenav');
let sideNavInstances = M.Sidenav.init(sideNavElements, { edge: 'right' });
let formElements = {
    payPeriodStart: document.querySelector('#pay-period-start'),
    payPeriodEnd: document.querySelector('#pay-period-end'),
    checkDate: document.querySelector('#check-date'),
    checkNumber: document.querySelector('#check-number'),
    infoFile: document.querySelector('#info-file'),
    infoFileLabel: document.querySelector('#info-file-label')
};

function clearFile() {
    formElements.infoFile.value = '';
    formElements.infoFileLabel.value = '';
    formElements.infoFileLabel.classList.remove('valid');
}

function clearForm() {
    for (let key in formElements) {
        formElements[key].value = '';
        formElements[key].classList.remove('valid');
        formElements[key].classList.remove('invalid');
    }
}

function downloadTemplate() {
    let a = document.createElement('a');
    a.href = "/file/payroll_template.csv";
    a.setAttribute('download', 'payroll_template.csv');
    a.click();
}

function writeError(text) {
    writeSuccess('');
    document.querySelector('#error-text').innerText = text;
}

function writeSuccess(text) {
    document.querySelector('#success-text').innerText = text;
}

function submitForm() {
    writeError('');
    for (let key in formElements) {
        formElements[key].classList.remove('invalid');
    }
    const payPeriodStart = formElements.payPeriodStart;
    if (!payPeriodStart.value) {
        payPeriodStart.classList.add('invalid');
        writeError('Missing Pay Period Start');
        return;
    }
    const payPeriodEnd = formElements.payPeriodEnd;
    if (!payPeriodEnd.value) {
        payPeriodEnd.classList.add('invalid');
        writeError('Missing Pay Period End');
        return;
    }
    const checkDate = formElements.checkDate;
    if (!checkDate.value) {
        checkDate.classList.add('invalid');
        writeError('Missing Check Date');
        return;
    }
    const checkNumber = formElements.checkNumber;
    if (!checkNumber.value) {
        checkNumber.classList.add('invalid');
        writeError('Missing Check Number');
        return;
    }
    const infoFileLabel = formElements.infoFileLabel;
    if (!infoFileLabel.value) {
        infoFileLabel.classList.add('invalid');
        writeError('Missing File Upload');
        return;
    }

    const file = formElements.infoFile.files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (event) => {
        writeSuccess('Input successful. Processing...');
        const fileContent = event.target.result
            .split('\n')
            .slice(1)
            .map(line => line.split(','));
        main(fileContent, payPeriodStart.value, payPeriodEnd.value, checkDate.value, +checkNumber.value);
        clearForm();
    }
}

// Main
function main(inputData, payPeriodStart, payPeriodEnd, checkDate, checkNumber) {
    const doc = new jsPDF({
        unit: 'in',
        format: 'letter'
    });
    generatePdf(doc, inputData, payPeriodStart, payPeriodEnd, checkDate, checkNumber);
    doc.save();
}

function generatePdf(doc, inputData, payPeriodStart, payPeriodEnd, checkDate, checkNumber) {
    for (let i = 0; i < inputData.length; i++) {
        const [ firstName, lastName, hours, rate ] = inputData[i];
        const employeeName = `${firstName} ${lastName}`;
        const payAmount = generatePayData(doc, payPeriodStart, payPeriodEnd, employeeName, +hours, +rate);
        generateCheck(doc, checkNumber + i, checkDate, payAmount, employeeName);
        if (i !== inputData.length - 1) {
            doc.addPage();
        }
    }
}

function generatePayData(doc, payPeriodStart, payPeriodEnd, employeeName, hours, rate) {
    // Logo
    doc.addImage(IMAGE.logo, PAGE_MARGIN, PAGE_MARGIN, 0.75, 0.75);
    // Vertical Line
    doc.setDrawColor('#CCCCCC');
    doc.setLineWidth(0.0125);
    doc.line(
        PAGE_MARGIN * 2 + 0.75,
        PAGE_MARGIN + 0.05,
        PAGE_MARGIN * 2 + 0.75,
        PAGE_MARGIN + 0.70
    );
    // Employer Information
    doc.setFont(doc.getFont().fontName, 'bold');
    const companyNameHeight = pointToInch(doc.getFontSize());
    doc.text(
        COMPANY_NAME,
        PAGE_MARGIN * 3 + 0.75,
        PAGE_MARGIN + companyNameHeight
    );
    doc.setFont(doc.getFont().fontName, 'normal');
    doc.setFontSize(doc.getFontSize() * (2 / 3));
    const companyAddressHeight = pointToInch(doc.getFontSize());
    doc.text(
        COMPANY_ADDRESS,
        PAGE_MARGIN * 3 + 0.75,
        PAGE_MARGIN + companyNameHeight + companyAddressHeight * 1.5
    );
    doc.setFontSize(doc.getFontSize() / (2 / 3));
    // Document Information
    doc.setFont(doc.getFont().fontName, 'bold');
    const documentTitleHeight = pointToInch(doc.getFontSize());
    doc.text(
        'Earnings Statement',
        PAGE_WIDTH - PAGE_MARGIN,
        PAGE_MARGIN + documentTitleHeight,
        { align: 'right' }
    );
    doc.setFont(doc.getFont().fontName, 'normal');
    doc.setFontSize(doc.getFontSize() * (2 / 3));
    const payPeriodInfoHeight = pointToInch(doc.getFontSize());
    doc.text(
        `Pay Period Start: ${payPeriodStart}\nPay Period End: ${payPeriodEnd}`,
        PAGE_WIDTH - PAGE_MARGIN,
        PAGE_MARGIN + documentTitleHeight + payPeriodInfoHeight * 1.5,
        { align: 'right' }
    );
    doc.setFontSize(doc.getFontSize() / (2 / 3));
    // Employee Information
    doc.setFillColor('#EEEEEE');
    doc.rect(
        PAGE_MARGIN,
        PAGE_MARGIN * 2 + 0.75,
        PAGE_WIDTH - PAGE_MARGIN * 2,
        1,
        'F'
    );
    doc.setLineHeightFactor(doc.getLineHeightFactor() * 1.25);
    doc.setFontSize(doc.getFontSize() * (2 / 3));
    doc.setFont(doc.getFont().fontName, 'bold');
    const employeeInfoHeight = pointToInch(doc.getFontSize());
    doc.text(
        `${employeeName}\n${EMPLOYEE_ADDRESS}`,
        PAGE_WIDTH - PAGE_MARGIN * 2,
        PAGE_MARGIN * 3 + 0.75 + (employeeInfoHeight * (1 / 2)),
        { align: 'right' }
    );
    doc.text(
        `SSN: XXX-XX-5555\nTaxable Status: Single\nExemptions: 0`,
        PAGE_MARGIN * 2,
        PAGE_MARGIN * 3 + 0.75 + (employeeInfoHeight * (1 / 2))
    );
    doc.setFont(doc.getFont().fontName, 'normal');
    doc.setFontSize(doc.getFontSize() / (2 / 3));
    doc.setLineHeightFactor(doc.getLineHeightFactor() / 1.25);
    // Earnings Information
    let yOffset = PAGE_MARGIN;
    doc.setDrawColor('#AAAAAA');
    doc.line(
        PAGE_MARGIN,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1,
        PAGE_WIDTH - PAGE_MARGIN,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1
    );
    doc.setFont(doc.getFont().fontName, 'bold');
    doc.setFontSize(doc.getFontSize() * (2 / 3));
    doc.text(
        'Earnings',
        PAGE_MARGIN * 3,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.25
    );
    doc.text(
        'Rate',
        PAGE_WIDTH - PAGE_MARGIN * 3 * 6,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.25,
        { align: 'right' }
    );
    doc.text(
        'Hours',
        PAGE_WIDTH - PAGE_MARGIN * 3 * 3.5,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.25,
        { align: 'right' }
    );
    doc.text(
        'This Period',
        PAGE_WIDTH - PAGE_MARGIN * 3,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.25,
        { align: 'right' }
    );
    doc.setFont(doc.getFont().fontName, 'normal');
    doc.line(
        PAGE_MARGIN,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40,
        PAGE_WIDTH - PAGE_MARGIN,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40
    );
    const earningsInfo = [
        [  'Regular',       `${rate}.00`, `${hours}.00`, `${hours * rate}.00` ],
        [ 'Overtime', `${rate * 1.5}.00`,        '0.00',               '0.00' ]
    ];
    for (let i = 0; i < earningsInfo.length; i++) {
        const info = earningsInfo[i];
        doc.text(
            info[0],
            PAGE_MARGIN * 3,
            yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40 + 0.45 + (0.2 * i)
        );
        doc.text(
            info[1],
            PAGE_WIDTH - PAGE_MARGIN * 3 * 6,
            yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40 + 0.45 + (0.2 * i),
            { align: 'right' }
        );
        doc.text(
            info[2],
            PAGE_WIDTH - PAGE_MARGIN * 3 * 3.5,
            yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40 + 0.45 + (0.2 * i),
            { align: 'right' }
        );
        doc.text(
            info[3],
            PAGE_WIDTH - PAGE_MARGIN * 3,
            yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40 + 0.45 + (0.2 * i),
            { align: 'right' }
        );
    }
    doc.setFont(doc.getFont().fontName, 'bold');
    doc.setFillColor('#EEEEEE');
    doc.rect(
        PAGE_MARGIN, yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40 + 0.45 + (0.2 * earningsInfo.length) + 0.05,
        PAGE_WIDTH - PAGE_MARGIN * 2, 0.4, 'F'
    );
    doc.text(
        'Gross Pay',
        PAGE_MARGIN * 3,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40 + 0.45 + (0.2 * earningsInfo.length) + 0.3
    );
    doc.text(
        `$${hours * rate}.00`,
        PAGE_WIDTH - PAGE_MARGIN * 3,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40 + 0.45 + (0.2 * earningsInfo.length) + 0.3,
        { align: 'right' }
    );
    doc.setFont(doc.getFont().fontName, 'normal');
    doc.setFontSize(doc.getFontSize() / (2 / 3));
    // Deductions Information
    yOffset = 2.5;
    doc.setDrawColor('#AAAAAA');
    doc.line(
        PAGE_MARGIN,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1,
        PAGE_WIDTH - PAGE_MARGIN,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1
    );
    doc.setFont(doc.getFont().fontName, 'bold');
    doc.setFontSize(doc.getFontSize() * (2 / 3));
    doc.text(
        'Deductions',
        PAGE_MARGIN * 3,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.25
    );
    doc.text(
        'Rate',
        PAGE_WIDTH - PAGE_MARGIN * 3 * 3.5,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.25,
        { align: 'right' }
    );
    doc.text(
        'This Period',
        PAGE_WIDTH - PAGE_MARGIN * 3,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.25,
        { align: 'right' }
    );
    doc.setFont(doc.getFont().fontName, 'normal');
    doc.line(
        PAGE_MARGIN,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40,
        PAGE_WIDTH - PAGE_MARGIN,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40
    );
    const payAmount = hours * rate;
    const federalIncomeTax = (Math.round(payAmount * 0.1 * 100) / 100).toFixed(2);
    const socialSecurityTax = (Math.round(payAmount * 0.02 * 100) / 100).toFixed(2);
    const medicareTax = (Math.round(payAmount * 0.02 * 100) / 100).toFixed(2);
    const stateIncomeTax = (Math.round(payAmount * 0.05 * 100) / 100).toFixed(2);
    const localTax = (Math.round(payAmount * 0.01 * 100) / 100).toFixed(2);
    const deductionsInfo = [
        [  'Federal Income Tax', `10%`,  `- ${federalIncomeTax}` ],
        [ 'Social Security Tax',  `2%`, `- ${socialSecurityTax}` ],
        [        'Medicare Tax',  `2%`,       `- ${medicareTax}` ],
        [    'State Income Tax',  `5%`,    `- ${stateIncomeTax}` ],
        [           'Local Tax',  `1%`,          `- ${localTax}` ]
    ];
    for (let i = 0; i < deductionsInfo.length; i++) {
        const info = deductionsInfo[i];
        doc.text(
            info[0],
            PAGE_MARGIN * 3,
            yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40 + 0.45 + (0.2 * i)
        );
        doc.text(
            info[1],
            PAGE_WIDTH - PAGE_MARGIN * 3 * 3.5,
            yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40 + 0.45 + (0.2 * i),
            { align: 'right' }
        );
        doc.text(
            info[2],
            PAGE_WIDTH - PAGE_MARGIN * 3,
            yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40 + 0.45 + (0.2 * i),
            { align: 'right' }
        );
    }
    doc.setFont(doc.getFont().fontName, 'bold');
    doc.setFillColor('#EEEEEE');
    doc.rect(
        PAGE_MARGIN, yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40 + 0.45 + (0.2 * deductionsInfo.length) + 0.05,
        PAGE_WIDTH - PAGE_MARGIN * 2, 0.4, 'F'
    );
    doc.text(
        'Net Pay',
        PAGE_MARGIN * 3,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40 + 0.45 + (0.2 * deductionsInfo.length) + 0.3
    );
    const netPay = Math.ceil(payAmount
        - (+federalIncomeTax)
        - (+socialSecurityTax)
        - (+medicareTax)
        - (+stateIncomeTax)
        - (+localTax));
    doc.text(
        `$${netPay}.00`,
        PAGE_WIDTH - PAGE_MARGIN * 3,
        yOffset + PAGE_MARGIN * 3 + 0.75 + 1 + 0.40 + 0.45 + (0.2 * deductionsInfo.length) + 0.3,
        { align: 'right' }
    );
    doc.setFont(doc.getFont().fontName, 'normal');
    doc.setFontSize(doc.getFontSize() / (2 / 3));
    return `$${netPay}.00`;
}

function generateCheck(doc, checkNumber, checkDate, checkAmount, employeeName) {
    // Dash
    doc.setDrawColor('#CCCCCC');
    doc.setLineWidth(0.025);
    doc.setLineDashPattern([ 0.05 ]);
    doc.line(PAGE_MARGIN, DASH_Y_POS, PAGE_WIDTH - PAGE_MARGIN, DASH_Y_POS);
    // Border and Fill
    doc.setFillColor('#DDDDDD');
    doc.setDrawColor('#888888');
    doc.setLineWidth(0.0125);
    doc.setLineDashPattern();
    doc.rect(CHECK.xPos, CHECK.yPos, CHECK.width, CHECK.height, 'DF');
    // Logo
    doc.addImage(
        IMAGE.mascot,
        CHECK.xPos + PAGE_MARGIN * (1 / 2),
        CHECK.yPos + PAGE_MARGIN * (1 / 2),
        0.75, 0.75
    );
    // Employer Information
    doc.setFont(doc.getFont().fontName, 'bold');
    const companyNameHeight = pointToInch(doc.getFontSize());
    doc.text(
        COMPANY_NAME,
        CHECK.xPos + PAGE_MARGIN * 4,
        CHECK.yPos + companyNameHeight + PAGE_MARGIN * (1 / 2)
    );
    doc.setFont(doc.getFont().fontName, 'normal');
    doc.setFontSize(doc.getFontSize() * (3 / 4));
    const companyAddressHeight = pointToInch(doc.getFontSize());
    doc.text(
        COMPANY_ADDRESS,
        CHECK.xPos + PAGE_MARGIN * 4,
        CHECK.yPos
            + (PAGE_MARGIN * (1 / 2))
            + (companyNameHeight * doc.getLineHeightFactor())
            + (companyAddressHeight * doc.getLineHeightFactor())
    );
    doc.setFontSize(doc.getFontSize() / (3 / 4));
    // Check Number and Pay Date
    doc.setFontSize(doc.getFontSize() * (3 / 4));
    const checkNumberAndPayDateHeight = pointToInch(doc.getFontSize());
    doc.text(
        `Check Number: ${checkNumber}\nPay Date: ${checkDate}`,
        PAGE_WIDTH - PAGE_MARGIN * 2,
        CHECK.yPos + checkNumberAndPayDateHeight + PAGE_MARGIN,
        { align: 'right' }
    );
    doc.setFontSize(doc.getFontSize() / (3 / 4));
    // Amount Words
    doc.setFontSize(doc.getFontSize() * (15 / 16) * (3 / 4));
    const checkAmountWordsHeight = pointToInch(doc.getFontSize());
    doc.text(
        `*****  ${moneyToWords(checkAmount)}  *****`,
        CHECK.xPos + PAGE_MARGIN * 2,
        CHECK.yPos + checkAmountWordsHeight + (CHECK.height * (5 / 12))
    );
    doc.setFontSize(doc.getFontSize() / (15 / 16) / (3 / 4));
    // Amount Numbers Border
    doc.setFillColor('#EEEEEE');
    doc.setFontSize(doc.getFontSize() * (3 / 4));
    const checkAmountNumbersHeight = pointToInch(doc.getFontSize());
    const amountNumbersYPos = CHECK.yPos + checkAmountNumbersHeight + (CHECK.height * (5 / 12));
    const amountBoxWidth = 1.5;
    const amountBoxHeight = (checkAmountNumbersHeight + (checkAmountNumbersHeight - checkAmountNumbersHeight * doc.getLineHeightFactor())) * 2;
    const amountBoxXPos = PAGE_WIDTH - amountBoxWidth - PAGE_MARGIN * 3;
    const amountBoxYPos = amountNumbersYPos - (amountBoxHeight * (3 / 4));
    doc.rect(amountBoxXPos, amountBoxYPos, amountBoxWidth, amountBoxHeight, 'DF');
    doc.setFontSize(doc.getFontSize() / (3 / 4));
    // Pay This Amount Label
    doc.setFontSize(doc.getFontSize() * (3 / 8));
    doc.setFont(doc.getFont().fontName, 'italic');
    const payThisAmountHeight = pointToInch(doc.getFontSize());
    doc.text('Pay This Amount', amountBoxXPos, amountBoxYPos - (payThisAmountHeight * (1 / 2)));
    doc.setFont(doc.getFont().fontName, 'normal');
    doc.setFontSize(doc.getFontSize() / (3 / 8));
    // Amount Numbers
    doc.setFontSize(doc.getFontSize() * (3 / 4));
    doc.text(
        checkAmount,
        PAGE_WIDTH - (PAGE_MARGIN * 5),
        amountNumbersYPos,
        { align: 'right' }
    );
    doc.setFontSize(doc.getFontSize() / (3 / 4));
    // Pay To The Order Of
    doc.setFontSize(doc.getFontSize() * (3 / 8));
    doc.setFont(doc.getFont().fontName, 'italic');
    const payToTheOrderOfHeight = pointToInch(doc.getFontSize());
    doc.text(
        'Pay To The\nOrder Of',
        CHECK.xPos + PAGE_MARGIN,
        CHECK.yPos + payToTheOrderOfHeight + (CHECK.height * (5 / 8))
    );
    doc.setFont(doc.getFont().fontName, 'normal');
    doc.setFontSize(doc.getFontSize() / (3 / 8));
    // Employee Information
    doc.setFontSize(doc.getFontSize() * (3 / 4));
    const employeeInformationHeight = pointToInch(doc.getFontSize());
    doc.text(
        `${employeeName}\n${EMPLOYEE_ADDRESS}`,
        CHECK.xPos + PAGE_MARGIN * 4,
        CHECK.yPos + employeeInformationHeight + (CHECK.height * (5 / 8))
    );
    doc.setFontSize(doc.getFontSize() / (3 / 4));
    // Signature Line
    doc.line(
        PAGE_WIDTH - PAGE_MARGIN * 3 - 2.5,
        PAGE_HEIGHT - PAGE_MARGIN * 3,
        PAGE_WIDTH - PAGE_MARGIN * 3,
        PAGE_HEIGHT - PAGE_MARGIN * 3,
    );
    // Signature
    doc.addImage(
        IMAGE.signature,
        'PNG',
        PAGE_WIDTH - PAGE_MARGIN * 3 - 2.25,
        PAGE_HEIGHT - PAGE_MARGIN * 3 - 0.5,
        2,
        0.65
    );
}