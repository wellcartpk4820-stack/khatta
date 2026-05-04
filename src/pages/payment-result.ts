// src/pages/payment-result.ts

function esc(s: string | undefined): string {
  if (!s) return ''
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

export function paymentResultPage(d: {
  success:       boolean
  errCode?:      string
  errMsg?:       string
  transactionId?: string
  basketId?:     string
  paymentName?:  string
  issuerName?:   string
  amount?:       string
  currency?:     string
}): string {
  const { success } = d
  const title   = success ? '✅ Payment Successful' : '❌ Payment Failed'
  const sub     = success
    ? 'Your payment has been received and recorded. Thank you!'
    : 'The transaction could not be completed. No funds were deducted.'
  const accent  = success ? '#22c55e' : '#ef4444'
  const accentBg = success ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)'
  const accentBorder = success ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'

  const rows: [string, string][] = [
    ['Transaction ID',  d.transactionId || '—'],
    ['Basket / Order',  d.basketId       || '—'],
    ['Payment Method',  d.paymentName    || '—'],
    ['Issuer',          d.issuerName     || '—'],
    ['Amount',          d.amount ? `${esc(d.currency)} ${esc(d.amount)}` : '—'],
    ['Status Code',     d.errCode ? `${esc(d.errCode)} — ${esc(d.errMsg)}` : '—'],
  ]

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — KhataBook</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#050b18;color:#dde3f0;font-family:'Nunito Sans',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
    .card{background:#0d1627;border:1px solid;border-radius:16px;width:100%;max-width:440px;overflow:hidden;}
    .hdr{padding:36px 32px;text-align:center;}
    .icon{font-size:52px;margin-bottom:12px;}
    h1{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:700;margin-bottom:6px;}
    .sub{color:#7a92b5;font-size:14px;line-height:1.6;}
    .body{padding:24px 32px;}
    .rows{border-radius:10px;padding:20px;margin-bottom:20px;}
    .row{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05);}
    .row:last-child{border:none;}
    .row-lbl{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#455a77;flex-shrink:0;}
    .row-val{font-family:'Courier New',monospace;font-size:13px;color:#dde3f0;text-align:right;word-break:break-all;}
    .btns{display:flex;flex-direction:column;gap:10px;}
    .btn{display:block;text-align:center;padding:13px;border-radius:10px;font-weight:800;font-size:14px;text-decoration:none;cursor:pointer;border:none;}
    .btn-gold{background:linear-gradient(135deg,#c9a84c,#8a6520);color:#050b18;}
    .btn-outline{background:transparent;border:1px solid rgba(201,168,76,.4);color:#c9a84c;}
    .ftr{padding:16px 32px;text-align:center;background:#050b18;border-top:1px solid #1e3a5f;}
    .ftr a{color:#455a77;font-size:12px;text-decoration:none;}
    .ftr a:hover{color:#7a92b5;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    .card{animation:fadeUp .4s ease}
  </style>
</head>
<body>
<div class="card" style="border-color:${accentBorder};">
  <div class="hdr" style="background:${accentBg};border-bottom:1px solid ${accentBorder};">
    <div class="icon">${success ? '✅' : '❌'}</div>
    <h1 style="color:${accent};">${success ? 'Payment Received' : 'Payment Failed'}</h1>
    <p class="sub">${sub}</p>
  </div>
  <div class="body">
    <div class="rows" style="background:${accentBg};border:1px solid ${accentBorder};">
      ${rows.map(([l, v]) => `<div class="row"><span class="row-lbl">${l}</span><span class="row-val">${v}</span></div>`).join('')}
    </div>
    <div class="btns">
      ${success
        ? `<a href="/" class="btn btn-gold">← Back to Lookup</a>
           <a href="javascript:window.print()" class="btn btn-outline">🖨 Print Receipt</a>`
        : `<a href="/" class="btn btn-gold">← Try Again</a>
           <a href="/" class="btn btn-outline">Back to Lookup</a>`
      }
    </div>
  </div>
  <div class="ftr"><a href="/">KhataBook — Personal Ledger System</a></div>
</div>
</body>
</html>`
}
