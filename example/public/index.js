const foundTerminals = [];
let connected = '';

function main() {
    writeLog('INFO', 'Connecting to server...');

    fetch('/init').then(() => {
        const eventSource = new EventSource('/sse');
        eventSource.onmessage = ({ data }) => {
            writeLog('INFO', data);

            const json = JSON.parse(data);
            if (json.type === 'DISCOVER_RESULT' && foundTerminals.findIndex(x => x.ipAddress === json.ipAddress) === -1) {
                foundTerminals.push(json);
                document.getElementById('terminal-list').innerHTML += `<option value="${json.ipAddress}">${json.name} (${json.code})</option>`;
                checkForm();
                return;
            }
        };

        eventSource.onopen = () => {
            setTimeout(() => discoverTerminals(), 1000)
        }
    });
}

function discoverTerminals() {
    fetch('/discover').then(() => {
        writeLog('INFO', 'Discovering terminals: PAY.POS-WHO.IS')
    });
}


function connectToTerminal() {
    const ipAddress = document.getElementById('terminal-list').value;
    fetch('/connect/' + ipAddress).then(() => {
        connected = ipAddress;
        checkForm();
        writeLog('INFO', 'Connected!')
    });
}

function pingTerminal() {
    fetch('/ping', { method: 'POST' });
    writeLog('INFO', `Sending PING message to terminal - {"type": "PING"}`)
}

function startPayment() {
    const data = FormDataJson.toJson("#transaction-form")

    data.amount.value = parseFloat(data.amount.value) * 100;
    fetch('/start-payment', { method: 'POST', body: JSON.stringify(data) });

    writeLog('INFO', `Sending START_TRANSACTION message to terminal - ${JSON.stringify({ type: 'TRANSACTION_START', data })}`)
}

function stopPayment() {}

function writeLog(level, message) {
    document.getElementById("logs").innerHTML += `[${new Date().toISOString()} ${level}] ${message}\n`;
}

function checkForm() {
    const allowConnectAction = document.querySelector('#terminal-list').value !== undefined
    document.getElementById('btn-connect').disabled = !allowConnectAction && !connected
    document.getElementById('btn-ping').disabled = !connected || connected !== document.querySelector('#terminal-list').value
    document.getElementById('btn-transaction-start').disabled = !connected || connected !== document.querySelector('#terminal-list').value || parseFloat(document.querySelector('#amount').value) === 0
}
