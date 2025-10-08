// test-smtp.js
const nodemailer = require('nodemailer');

async function trySmtp(cfg) {
  const t = nodemailer.createTransport(cfg);
  try {
    await t.verify();
    console.log('✅ SMTP verify succeeded:', cfg.host, cfg.port, 'secure=', cfg.secure);
    const info = await t.sendMail({
      from: cfg.fromEmail,
      to: cfg.testTo,
      subject: 'SMTP test',
      text: 'Hello from test-smtp.js'
    });
    console.log('✅ Sent:', info.messageId || info.response);
  } catch (err) {
    console.error('❌ SMTP failed:', err && err.message ? err.message : err);
  } finally {
    if (t && t.close) t.close();
  }
}

const cfg = {
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: 'tegatega@zohomail.com',
    pass: 'vV4NwbR2T5Ue',
  },
  fromEmail: 'tegatega@zohomail.com',
  testTo: 'tegaokorare91@gmail.com'
};

trySmtp(cfg);