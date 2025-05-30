const foundTerminals = [];
let connected = '';
let terminalBusy = false

function main() {
    writeLog('INFO', 'Welcome to the PAY.POS local ECR example');
    writeLog('INFO', 'This project shows you how to integrate the local ECR. Start by discovering your terminal locally');

    getSaleLocations();
    fetch('/init').then(() => {
        const eventSource = new EventSource('/sse');
        eventSource.onmessage = ({data}) => {
            const json = JSON.parse(data);
            if (json.disconnected) {
                writeLog('WARNING', 'Terminal disconnected...');
                connected = '';
                terminalBusy = false;
                checkForm();
                return;
            }

            writeLog('DEBUG', data);


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

    if (!data.service.serviceId && !data.service.secret) {
        data.service = undefined;
    }

    fetch('/start-payment', {method: 'POST', body: JSON.stringify(data), headers: getHeaders()});

    writeLog('DEBUG', `Sending START_TRANSACTION message to terminal - ${JSON.stringify({type: 'TRANSACTION_START', ...data})}`)
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

function writeLog(level, message) {
    document.getElementById("logs").innerHTML += `[${new Date().toLocaleString()} ${level}] ${message}\n`;
}

function checkForm() {
    if (!document.querySelector('#terminal-list').value) {
        document.getElementById('btn-connect').disabled = true;
        document.getElementById('btn-ping').disabled = true;
        document.getElementById('btn-transaction-start').disabled = true;
        document.getElementById('btn-transaction-stop').disabled = true;
        document.getElementById('btn-list-history').disabled = true;
        document.getElementById('btn-get-history').disabled = true;
        return;
    }
    const [ipAddress] = document.getElementById('terminal-list').value.split(':');
    const allowConnectAction = document.querySelector('#terminal-list').value !== undefined

    const slCode = document.getElementById('sl-code').value
    const slSecret = document.getElementById('sl-secret').value
    const serviceInjectionValid = (!slCode && !slSecret) || (slCode && slSecret) // Either non is filled in or both

    document.getElementById('btn-connect').disabled = !allowConnectAction && !connected
    document.getElementById('btn-ping').disabled = !connected || connected !== ipAddress
    document.getElementById('btn-transaction-start').disabled = !connected || connected !== ipAddress || parseFloat(document.querySelector('#amount').value) === 0 || !serviceInjectionValid;
    document.getElementById('btn-transaction-stop').disabled = !terminalBusy;

    document.getElementById('btn-list-history').disabled = !connected || connected !== ipAddress
    document.getElementById('btn-get-history').disabled = !connected || connected !== ipAddress || !document.getElementById('history-order-id').value;
}

function getHeaders() {
    return new Headers({
        'X-Terminal-Code': document.getElementById('terminal-list').value.split(':')[1],
        'X-Sale-Location-Code': document.getElementById('sale-location-list').value
    })

}
