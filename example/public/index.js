const foundTerminals = [];
let products = [];
let connected = '';
let terminalBusy = false
let orderStarted = false;

function main() {
    writeLog('INFO', 'Welcome to the PAY.POS local ECR example');
    writeLog('INFO', 'This project shows you how to integrate the local ECR. Start by discovering your terminal locally');

    // getSaleLocations();
    fetch('/init').then(() => {
        const eventSource = new EventSource('/sse');
        eventSource.onmessage = ({data}) => {
            const json = JSON.parse(data);
            if (json.disconnected) {
                writeLog('WARNING', 'Terminal disconnected...');
                connected = '';
                terminalBusy = false;
                orderStarted = false;
                checkForm();
                return;
            }

            if (json.type === 'ERROR') {
                writeLog('ERROR', data);
            } else {
                writeLog('DEBUG', data);
            }


            if (json.type === 'DISCOVER_RESULT' && foundTerminals.findIndex(x => x.ipAddress === json.ipAddress) === -1) {
                foundTerminals.push(json);
                document.getElementById('terminal-list').innerHTML += `<option value="${json.ipAddress}:${json.code}:${json.name}">${json.name} (${json.code})</option>`;
                checkForm();
                return;
            }

            if (json.type === 'TRANSACTION_EVENT' && json.event === 'STARTED') {
                terminalBusy = true;
                checkForm();
                return;
            }

            if (json.type === 'TRANSACTION_EVENT' && json.event === 'COMPLETED' || json.type === 'TRANSACTION_EVENT' && json.event === 'FAILED') {
                terminalBusy = false;
                orderStarted = false;
                checkForm();
                return;
            }
        };

        eventSource.onopen = () => {
            setTimeout(() => discoverTerminals(), 1000)
        }
    });
}

function getSaleLocations() {
    fetch('/saleLocations')
        .then((x) => x.json())
        .then((data) => {
            const select = document.getElementById('sale-location-list');
            for (const item of data.services) {
                select.innerHTML += `<option value="${item.id}">${item.name} (${item.id})</option>`;
            }
        })
}

function discoverTerminals() {
    fetch('/discover').then(() => {
        writeLog('DEBUG', 'Discovering terminals: PAY.POS-WHO.IS')
        // checkForm();
    });
}


function connectToTerminal() {
    if (!document.getElementById('terminal-list').value) {
        // NONE option is selected...
        return;
    }

    const [ipAddress, thCode, terminalName] = document.getElementById('terminal-list').value.split(':');
    fetch('/connect/' + ipAddress).then(() => {
        connected = ipAddress;
        checkForm();
        writeLog('DEBUG', `Connected to: ${terminalName} (${thCode})`)
    });
}

function pingTerminal() {
    fetch('/ping', {method: 'POST', headers: getHeaders()});
    writeLog('DEBUG', `Sending PING message to terminal - {"type": "PING"}`)
}

function startPayment() {
    const data = FormDataJson.toJson("#transaction-form")

    data.transaction.type = 'PAYMENT'
    data.transaction.amount.value = parseFloat(data.transaction.amount.value) * 100;
    if (data.transaction.order?.products?.length > 0) {
        data.transaction.order.products = data.transaction.order?.products.map(x => JSON.parse(decodeURI(x)));
    }

    if (!data.service.serviceId && !data.service.secret) {
        data.service = undefined;
    }

    fetch('/start-payment', {method: 'POST', body: JSON.stringify(data), headers: getHeaders()});

    writeLog('DEBUG', `Sending TRANSACTION_START message to terminal - ${JSON.stringify({type: 'TRANSACTION_START', ...data})}`)
}

function stopPayment() {
    fetch('/stop-payment', {method: 'POST', headers: getHeaders()});
}

function listHistory() {
    fetch('/list-history', {method: 'POST', headers: getHeaders()});
}

function getSpecificHistory() {
    const needle = document.getElementById('history-order-id').value;
    if (!needle) {
        return;
    }

    fetch('/get-history/' + needle, {method: 'POST', headers: getHeaders()});
}

function createUpdateOrder() {
    const data = FormDataJson.toJson("#transaction-form")

    data.transaction.type = 'PAYMENT'
    data.transaction.amount.value = parseFloat(data.transaction.amount.value) * 100;
    if (data.transaction.order?.products?.length > 0) {
        data.transaction.order.products = data.transaction.order?.products.map(x => JSON.parse(decodeURI(x)));
        data.transaction.order.products = data.transaction.order?.products.map(x => ({ ...x, price: { value: parseFloat(x.price?.value ?? 1) * 100, currency: x.price?.currency } }) );
    }

    if (!data.service.serviceId && !data.service.secret) {
        data.service = undefined;
    }

    if (!orderStarted) {
        orderStarted = true;

        fetch('/create-order', {method: 'POST', body: JSON.stringify(data), headers: getHeaders()});
        writeLog('DEBUG', `Sending ORDER_CREATE message to terminal - ${JSON.stringify({type: 'ORDER_CREATE', ...data})}`);
    } else {
        fetch('/update-order', {method: 'POST', body: JSON.stringify(data), headers: getHeaders()});
        writeLog('DEBUG', `Sending ORDER_UPDATE message to terminal - ${JSON.stringify({type: 'ORDER_UPDATE', ...data})}`);
    }

    checkForm();
}

function stopOrder() {
    orderStarted = false;

    fetch('/stop-order', {method: 'POST', headers: getHeaders()});
    writeLog('DEBUG', `Sending ORDER_STOP message to terminal - ${JSON.stringify({type: 'ORDER_STOP'})}`);
}

function startOrder() {
    terminalBusy = true;
    orderStarted = false;

    fetch('/start-order', {method: 'POST', headers: getHeaders()});
    writeLog('DEBUG', `Sending ORDER_START message to terminal - ${JSON.stringify({type: 'ORDER_START'})}`);
}

function writeLog(level, message) {
    document.getElementById("logs").innerHTML += `[${new Date().toLocaleString()} ${level}] <span style="color: ${getColor(level)}">${message}</span>\n`;
}

function getColor(level) {
    switch (level) {
        case 'DEBUG':
            return '#000';
        case 'INFO':
            return '#585FFF';
        case 'WARNING':
            return '#8b5000';
        case 'ERROR':
            return '#bc004b';
        default:
            return '#000';
    }
}

function checkForm() {
    if (!document.querySelector('#terminal-list').value) {
        document.getElementById('btn-connect').disabled = true;
        document.getElementById('btn-ping').disabled = true;
        document.getElementById('btn-transaction-start').disabled = true;
        document.getElementById('btn-transaction-stop').disabled = true;
        document.getElementById('btn-list-history').disabled = true;
        document.getElementById('btn-get-history').disabled = true;
        document.getElementById('btn-order-start').disabled = true;
        document.getElementById('btn-order-create').disabled = true;
        document.getElementById('btn-order-stop').disabled = true;
        return;
    }
    const [ipAddress] = document.querySelector('#terminal-list').value.split(':');
    const allowConnectAction = document.querySelector('#terminal-list').value !== undefined;

    const slCode = document.getElementById('sl-code').value;
    const slSecret = document.getElementById('sl-secret').value;
    const serviceInjectionValid = (!slCode && !slSecret) || (slCode && slSecret); // Either non is filled in or both

    document.getElementById('btn-connect').disabled = !allowConnectAction && !connected;
    document.getElementById('btn-ping').disabled = !connected || connected !== ipAddress;
    document.getElementById('btn-transaction-start').disabled = !connected || connected !== ipAddress || parseFloat(document.querySelector('#amount').value) === 0 || !serviceInjectionValid || terminalBusy;
    document.getElementById('btn-transaction-stop').disabled = connected !== ipAddress || !terminalBusy;

    document.getElementById('btn-list-history').disabled = !connected || connected !== ipAddress;
    document.getElementById('btn-get-history').disabled = !connected || connected !== ipAddress || !document.getElementById('history-order-id').value;

    document.getElementById('btn-order-create').disabled = !connected || connected !== ipAddress || parseFloat(document.querySelector('#amount').value) === 0 || !serviceInjectionValid || terminalBusy;
    document.getElementById('btn-order-stop').disabled = connected !== ipAddress || !orderStarted || terminalBusy;
    document.getElementById('btn-order-start').disabled = connected !== ipAddress || !orderStarted || terminalBusy;
}

function getHeaders() {
    return new Headers({
        'X-Terminal-Code': document.getElementById('terminal-list').value.split(':')[1],
        'X-Sale-Location-Code': document.getElementById('sale-location-list').value
    })
}

function showProductModal(e) {
    e.preventDefault();

    document.getElementById('product-create-overlay').classList.add('active')
    document.getElementById('product-create-modal').showModal();
}

function addProduct(onlyClose) {
    if (onlyClose) {
        document.getElementById('product-create-overlay').classList.remove('active')
        document.getElementById('product-create-modal').close();
        return;
    }

    const jsonForm = FormDataJson.toJson('#product-form');
    products.push(jsonForm);

    const html = `<label class="checkbox">
                        <input type="checkbox" name="transaction[order][products][]" value="${encodeURI(JSON.stringify(jsonForm))}">
                        <span>${jsonForm.quantity}x ${jsonForm.description} (${jsonForm.price?.value ?? 1})</span>
                    </label>`;
    document.getElementById('product-list').innerHTML += html;
    document.getElementById('product-create-overlay').classList.remove('active')
    document.getElementById('product-create-modal').close();
}

function switchTab(pageName) {
    for (const page of document.getElementsByClassName("page")) {
        page.classList.remove('active');
    }

    for (const tab of document.querySelectorAll('.tabs>a')) {
        tab.classList.remove('active');
    }

    document.getElementById(pageName + '-page').classList.add('active');
    document.getElementById(pageName + '-tab').classList.add('active');
}
