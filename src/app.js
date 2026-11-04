let db;

const $ = id => document.getElementById(id);

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', {
  maximumFractionDigits: 2
});

const today = () => new Date().toISOString().slice(0, 10);

const formatDate = date => {
  if (!date) return '';
  const parts = date.split('-');
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : date;
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

async function init() {
  db = await window.ledgerAPI.load();

  $('startDate').value = today();
  $('payDate').value = today();

  $('backupPath').textContent =
    await window.ledgerAPI.backupPath();

  if (db.pin) {
    $('lock').classList.remove('hidden');
  } else {
    $('appArea').classList.remove('hidden');
    renderAll();
  }

  document.querySelectorAll('.tabs button').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.tabs button')
        .forEach(x => x.classList.remove('active'));

      b.classList.add('active');

      document.querySelectorAll('.tab')
        .forEach(x => x.classList.add('hidden'));

      $(b.dataset.tab).classList.remove('hidden');

      renderAll();
    };
  });
}

async function persist() {
  await window.ledgerAPI.save(db);
  renderAll();
}

function unlock() {
  if ($('pinEntry').value === db.pin) {
    $('lock').classList.add('hidden');
    $('appArea').classList.remove('hidden');
    renderAll();
  } else {
    $('pinErr').textContent = 'PIN गलत है';
  }
}

async function setPin() {
  let p = $('newPin').value;

  if (p && !/^\d{4}$/.test(p)) {
    alert('PIN ठीक 4 अंक का होना चाहिए');
    return;
  }

  db.pin = p;

  await persist();

  $('newPin').value = '';

  alert(p ? 'PIN सेट हो गया' : 'ऐप लॉक बंद कर दिया गया');
}

async function addCustomer() {
  let name = $('cName').value.trim();

  if (!name) {
    alert('ग्राहक का नाम लिखें');
    return;
  }

  db.customers.push({
    id: crypto.randomUUID(),
    name,
    phone: $('cPhone').value.trim(),
    address: $('cAddress').value.trim(),
    created: today()
  });

  $('cName').value = '';
  $('cPhone').value = '';
  $('cAddress').value = '';

  await persist();

  alert('ग्राहक सफलतापूर्वक सेव हो गया');
}

function toggleDays() {
  $('customDaysBox').classList.toggle(
    'hidden',
    $('durationMode').value !== 'custom'
  );
}

async function addLoan() {
  let customerId = $('loanCustomer').value;
  let amount = Number($('loanAmount').value);

  let days = $('durationMode').value === 'custom'
    ? Number($('customDays').value)
    : 100;

  let start = $('startDate').value;

  if (!customerId) {
    alert('पहले ग्राहक जोड़ें');
    return;
  }

  if (!(amount > 0) || !(days > 0) || !start) {
    alert('राशि, दिन और तारीख सही भरें');
    return;
  }

  db.loans.push({
    id: crypto.randomUUID(),
    customerId,
    amount,
    days,
    start,
    created: today()
  });

  $('loanAmount').value = '';

  await persist();

  alert(days + ' दिनों का किस्त शेड्यूल बन गया');
}

async function addPayment() {
  let loanId = $('payLoan').value;
  let amount = Number($('payAmount').value);
  let date = $('payDate').value;

  if (!loanId || !(amount > 0) || !date) {
    alert('ऋण, राशि और तारीख भरें');
    return;
  }

  db.payments.push({
    id: crypto.randomUUID(),
    loanId,
    amount,
    date,
    note: $('payNote').value.trim()
  });

  $('payAmount').value = '';
  $('payNote').value = '';

  await persist();

  alert('जमा राशि सेव हो गई');
}

async function editPayment(id) {
  let p = db.payments.find(x => x.id === id);

  if (!p) return;

  let a = prompt('सही जमा राशि दर्ज करें', p.amount);

  if (a === null) return;

  if (!(Number(a) >= 0) || a.trim() === '') {
    alert('राशि सही नहीं');
    return;
  }

  let n = prompt('टिप्पणी / रसीद', p.note || '');

  if (n === null) return;

  p.amount = Number(a);
  p.note = n;

  await persist();

  alert('जमा एंट्री में सुधार सेव हो गया');
}

async function delPayment(id) {
  if (confirm('यह जमा एंट्री हटाएं?')) {
    db.payments = db.payments.filter(p => p.id !== id);
    await persist();
  }
}

function customer(id) {
  return db.customers.find(c => c.id === id);
}

function paidFor(id) {
  return db.payments
    .filter(p => p.loanId === id)
    .reduce((s, p) => s + Number(p.amount || 0), 0);
}

function customerBalance(id) {
  return db.loans
    .filter(l => l.customerId === id)
    .reduce((sum, l) => {
      return sum + Math.max(0, l.amount - paidFor(l.id));
    }, 0);
}

function customerStatus(id) {
  let loans = db.loans.filter(l => l.customerId === id);

  if (!loans.length) return 'सक्रिय';

  return customerBalance(id) > 0 ? 'सक्रिय' : 'बंद';
}

function renderAll() {
  if (!db) return;

  $('sCustomers').textContent = db.customers.length;

  $('sLoans').textContent = money(
    db.loans.reduce((s, l) => s + Number(l.amount || 0), 0)
  );

  $('sPaid').textContent = money(
    db.payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  );

  $('loanCustomer').innerHTML = db.customers.map(c =>
    `<option value="${esc(c.id)}">${esc(c.name)}</option>`
  ).join('');

  $('reportCustomer').innerHTML =
    '<option value="">ग्राहक चुनें</option>' +
    db.customers.map(c =>
      `<option value="${esc(c.id)}">${esc(c.name)}</option>`
    ).join('');

  $('payLoan').innerHTML = db.loans.map(l =>
    `<option value="${esc(l.id)}">
      ${esc(customer(l.customerId)?.name || 'ग्राहक')}
      — ${money(l.amount)} (${l.days} दिन)
    </option>`
  ).join('');

  $('customerList').innerHTML = db.customers.length
    ? `<table>
        <tr>
          <th>नाम</th>
          <th>मोबाइल</th>
          <th>पता</th>
        </tr>
        ${db.customers.map(c => `
          <tr>
            <td>${esc(c.name)}</td>
            <td>${esc(c.phone)}</td>
            <td>${esc(c.address)}</td>
          </tr>
        `).join('')}
      </table>`
    : 'अभी कोई ग्राहक नहीं';

  $('loanList').innerHTML = db.loans.length
    ? `<table>
        <tr>
          <th>ग्राहक</th>
          <th>राशि</th>
          <th>अवधि</th>
          <th>प्रतिदिन किस्त</th>
          <th>जमा</th>
          <th>बाकी</th>
        </tr>
        ${db.loans.map(l => {
          let paid = paidFor(l.id);

          return `
            <tr>
              <td>${esc(customer(l.customerId)?.name || '')}</td>
              <td>${money(l.amount)}</td>
              <td>${l.days} दिन</td>
              <td>${money(l.amount / l.days)}</td>
              <td>${money(paid)}</td>
              <td>${money(Math.max(0, l.amount - paid))}</td>
            </tr>
          `;
        }).join('')}
      </table>`
    : 'अभी कोई ऋण नहीं';

  $('paymentList').innerHTML = db.payments.length
    ? `<table>
        <tr>
          <th>तारीख</th>
          <th>ग्राहक</th>
          <th>जमा राशि</th>
          <th>टिप्पणी / रसीद</th>
          <th>कार्रवाई</th>
        </tr>
        ${db.payments.slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(p => {
            let l = db.loans.find(x => x.id === p.loanId);

            return `
              <tr>
                <td>${formatDate(esc(p.date))}</td>
                <td>${esc(customer(l?.customerId)?.name || '')}</td>
                <td>${money(p.amount)}</td>
                <td>${esc(p.note)}</td>
                <td>
                  <button class="btn"
                    onclick="editPayment('${esc(p.id)}')">
                    संपादन
                  </button>
                  <button class="btn danger"
                    onclick="delPayment('${esc(p.id)}')">
                    हटाएं
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
      </table>`
    : 'कोई जमा एंट्री नहीं';

  if ($('reportCustomer').value) {
    renderReport();
  }
}

function renderReport() {
  let id = $('reportCustomer').value;
  let c = customer(id);

  if (!c) {
    $('reportBody').innerHTML = '';
    return;
  }

  let loans = db.loans.filter(l => l.customerId === id);

  let totalLoan = loans.reduce(
    (sum, l) => sum + Number(l.amount || 0), 0
  );

  let totalPaid = loans.reduce(
    (sum, l) => sum + paidFor(l.id), 0
  );

  let totalBalance = loans.reduce(
    (sum, l) => sum + Math.max(0, l.amount - paidFor(l.id)), 0
  );

  let status = customerStatus(id);

  let loanRows = loans.map(l => {
    let paid = paidFor(l.id);
    let balance = Math.max(0, l.amount - paid);

    return `
      <tr>
        <td>${esc(c.name)}</td>
        <td>${formatDate(esc(l.start))}</td>
        <td>${money(l.amount)}</td>
        <td>${money(l.amount)}</td>
        <td>${money(paid)}</td>
        <td>${money(balance)}</td>
      </tr>
    `;
  }).join('');

  let payments = db.payments
    .filter(p => loans.some(l => l.id === p.loanId))
    .sort((a, b) => a.date.localeCompare(b.date));

  let paymentRows = payments.map(p => `
    <tr>
      <td>${formatDate(esc(p.date))}</td>
      <td>${money(p.amount)}</td>
      <td>${esc(p.note || '')}</td>
    </tr>
  `).join('');

  $('reportBody').innerHTML = `
    <div class="report-heading">
      <h1>माँ मनोकामना स्मॉल फाइनेंस</h1>
      <h3>आपकी ज़रूरत — हमारा भरोसा!</h3>
    </div>

    <hr>

    <h2>ग्राहक रिपोर्ट</h2>

    <table>
      <thead>
        <tr>
          <th>नाम</th>
          <th>मोबाइल</th>
          <th>पता</th>
          <th>स्थिति</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${esc(c.name)}</td>
          <td>${esc(c.phone)}</td>
          <td>${esc(c.address)}</td>
          <td>${status}</td>
        </tr>
      </tbody>
    </table>

    <h2>उधार रिपोर्ट</h2>

    <table>
      <thead>
        <tr>
          <th>ग्राहक</th>
          <th>तारीख</th>
          <th>मूल राशि</th>
          <th>कुल देय</th>
          <th>जमा</th>
          <th>बकाया</th>
        </tr>
      </thead>
      <tbody>
        ${loanRows || `
          <tr><td colspan="6">कोई ऋण दर्ज नहीं है</td></tr>
        `}
      </tbody>
      <tfoot>
        <tr>
          <th colspan="2">कुल</th>
          <th>${money(totalLoan)}</th>
          <th>${money(totalLoan)}</th>
          <th>${money(totalPaid)}</th>
          <th>${money(totalBalance)}</th>
        </tr>
      </tfoot>
    </table>

    <h2>जमा रिपोर्ट</h2>

    <table>
      <thead>
        <tr>
          <th>तारीख</th>
          <th>जमा राशि</th>
          <th>टिप्पणी</th>
        </tr>
      </thead>
      <tbody>
        ${paymentRows || `
          <tr><td colspan="3">कोई जमा एंट्री नहीं</td></tr>
        `}
      </tbody>
    </table>

    <div class="report-thanks">
      <p>
        🙏 धन्यवाद! आप समय पर भुगतान करें और अपनी आर्थिक स्थिति मजबूत बनाएं। 🙏
      </p>

      <div class="report-sign">
        <span>रिपोर्ट तैयार करने की तिथि: ${formatDate(today())}</span>
        <span>✒ Lalit Kumar<br>प्रबंधक के हस्ताक्षर</span>
      </div>
    </div>

    <div class="report-footer">
      <h3>माँ मनोकामना स्मॉल फाइनेंस</h3>
      <p>सदा आपके साथ...</p>
    </div>
  `;
}

async function manualBackup() {
  let p = await window.ledgerAPI.backup();

  if (p) {
    alert('बैकअप बन गया:\n' + p);
  } else {
    alert('बैकअप नहीं बन पाया।');
  }
}

async function restoreBackup() {
  if (!confirm(
    'Restore करने पर वर्तमान डेटा चुने गए बैकअप से बदल जाएगा। पहले वर्तमान बैकअप भी बनेगा। जारी रखें?'
  )) return;

  await window.ledgerAPI.backup();

  try {
    let ok = await window.ledgerAPI.restore();

    if (ok) {
      db = await window.ledgerAPI.load();
      renderAll();
      alert('बैकअप सफलतापूर्वक वापस आ गया');
    }
  } catch (e) {
    alert('बैकअप नहीं खुला: ' + e.message);
  }
}

init();
