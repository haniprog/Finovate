require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');

const app = express();
const port = Number(process.env.PORT) || 3000;
const rootDir = __dirname;
const usersFile = path.join(rootDir, 'data', 'auth-users.json');
const resetTokensFile = path.join(rootDir, 'data', 'password-reset-tokens.json');
const signupVerificationsFile = path.join(rootDir, 'data', 'signup-verifications.json');
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const SIGNUP_CODE_TTL_MS = 15 * 60 * 1000;

const apiKey = process.env.SECRET_API_KEY;

function appBaseUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const host = req.get('host') || `localhost:${port}`;
  const normalizedHost = host.startsWith('127.0.0.1')
    ? host.replace('127.0.0.1', 'localhost')
    : host;
  return `${req.protocol}://${normalizedHost}`;
}

app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function loadUsers() {
  try {
    if (!fs.existsSync(usersFile)) return {};
    const raw = fs.readFileSync(usersFile, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  fs.mkdirSync(path.dirname(usersFile), { recursive: true });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

function findUser(users, identifier) {
  const key = String(identifier || '').trim().toLowerCase();
  if (!key) return null;
  return (
    Object.values(users).find(
      (u) =>
        String(u.username || '').toLowerCase() === key ||
        String(u.email || '').toLowerCase() === key
    ) || null
  );
}

function signupConflictMessage(users, username, email) {
  const u = String(username || '').trim().toLowerCase();
  const e = String(email || '').trim().toLowerCase();
  const byUsername = Object.values(users).find(
    (user) => String(user.username || '').toLowerCase() === u
  );
  const byEmail = Object.values(users).find(
    (user) => String(user.email || '').toLowerCase() === e
  );
  if (byUsername) {
    return 'This username is already taken. Please choose another username and try again.';
  }
  if (byEmail) {
    return 'An account with this email already exists. Please log in or use a different email.';
  }
  return null;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    status: user.status,
    created_at: user.created_at,
    two_factor_enabled: Boolean(user.two_factor_enabled),
  };
}

function hashSignupCode(code) {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
}

function loadSignupVerifications() {
  try {
    if (!fs.existsSync(signupVerificationsFile)) return {};
    const parsed = JSON.parse(fs.readFileSync(signupVerificationsFile, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveSignupVerifications(entries) {
  fs.mkdirSync(path.dirname(signupVerificationsFile), { recursive: true });
  fs.writeFileSync(signupVerificationsFile, JSON.stringify(entries, null, 2), 'utf8');
}

function pruneSignupVerifications(entries) {
  const now = Date.now();
  const next = {};
  Object.entries(entries).forEach(([key, entry]) => {
    if (entry && Number(entry.expiresAt) > now) next[key] = entry;
  });
  return next;
}

function generateSignupCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const resendApiKey = process.env.RESEND_API_KEY;
const resendTestFrom = 'Finovate <onboarding@resend.dev>';
const gmailUser = String(process.env.GMAIL_USER || '').trim();
const gmailAppPassword = String(process.env.GMAIL_APP_PASSWORD || '')
  .trim()
  .replace(/\s/g, '');

let gmailTransport = null;

function getGmailTransport() {
  if (!gmailUser || !gmailAppPassword) return null;
  if (!gmailTransport) {
    gmailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailAppPassword },
    });
  }
  return gmailTransport;
}

function gmailFromAddress() {
  const name = process.env.GMAIL_FROM_NAME || 'Finovate';
  return `${name} <${gmailUser}>`;
}

function configuredResendFromList() {
  const custom = String(process.env.RESEND_FROM_EMAIL || '').trim();
  const list = [];
  if (custom && !/gmail\.com/i.test(custom)) list.push(custom);
  if (!list.includes(resendTestFrom)) list.push(resendTestFrom);
  return list;
}

function resendErrorMessage(err) {
  const detail = err?.response?.data;
  return detail?.message || detail?.error || err?.message || 'Unknown error';
}

function isResendRecipientRestriction(err) {
  const msg = resendErrorMessage(err).toLowerCase();
  return msg.includes('only send testing emails') || msg.includes('your own email address');
}

function isResendFromRestriction(err) {
  const msg = resendErrorMessage(err).toLowerCase();
  return msg.includes('domain is not verified') || msg.includes('verify your domain');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildActionEmailHtml({ message, actionUrl, actionLabel }) {
  const url = String(actionUrl || '').trim();
  const label = escapeHtml(actionLabel || 'Continue');
  const bodyHtml = escapeHtml(message).replace(/\n/g, '<br>');
  const button = url
    ? `<p style="margin:28px 0;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#22c55e;color:#052e16;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px;">${label}</a></p><p style="font-size:13px;color:#6b7280;word-break:break-all;">Or copy this link:<br><a href="${escapeHtml(url)}" style="color:#16a34a;">${escapeHtml(url)}</a></p>`
    : '';
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center"><table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 8px 24px rgba(0,0,0,0.08);"><tr><td><p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#16a34a;letter-spacing:0.04em;text-transform:uppercase;">Finovate</p><div style="font-size:16px;line-height:1.6;color:#111827;">${bodyHtml}</div>${button}<p style="margin-top:28px;font-size:13px;color:#6b7280;">— The Finovate Team</p></td></tr></table></td></tr></table></body></html>`;
}

async function resendSendEmail({ from, to, subject, text, html }) {
  const payload = {
    from,
    to: [to],
    subject: String(subject || '').trim() || 'Finovate',
    text: String(text || ''),
  };
  if (html) payload.html = html;
  await axios.post('https://api.resend.com/emails', payload, {
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
}

async function gmailSendEmail({ to, subject, text, html }) {
  const transport = getGmailTransport();
  if (!transport) return { ok: false, error: 'Gmail is not configured' };
  try {
    await transport.sendMail({
      from: gmailFromAddress(),
      to,
      subject: String(subject || '').trim() || 'Finovate',
      text: String(text || ''),
      html: html || undefined,
    });
    console.log(`Email sent to ${to} via Gmail (${gmailUser})`);
    return { ok: true, provider: 'gmail' };
  } catch (err) {
    console.warn(`Gmail could not send to ${to}:`, err.message);
    return { ok: false, error: err.message };
  }
}

async function sendMail({ to, subject, message, html, actionUrl, actionLabel }) {
  const email = String(to || '').trim().toLowerCase();
  if (!email) return { ok: false, error: 'Missing recipient' };

  const subj = String(subject || '').trim() || 'Finovate';
  const text = String(message || '');
  const htmlBody =
    html || (actionUrl ? buildActionEmailHtml({ message: text, actionUrl, actionLabel }) : null);

  let lastErr = null;

  if (resendApiKey) {
    for (const from of configuredResendFromList()) {
      try {
        await resendSendEmail({ from, to: email, subject: subj, text, html: htmlBody });
        console.log(`Email sent to ${email} via Resend (from ${from})`);
        return { ok: true, to: email, provider: 'resend' };
      } catch (err) {
        lastErr = err;
        if (isResendFromRestriction(err)) continue;
        break;
      }
    }
  }

  const gmailResult = await gmailSendEmail({
    to: email,
    subject: subj,
    text,
    html: htmlBody,
  });
  if (gmailResult.ok) {
    return { ok: true, to: email, provider: 'gmail' };
  }

  const resendMsg = lastErr ? resendErrorMessage(lastErr) : 'Resend is not configured';
  const gmailMsg = gmailResult.error || 'Gmail is not configured';
  const needsDomain =
    lastErr && (isResendRecipientRestriction(lastErr) || isResendFromRestriction(lastErr));

  let error =
    'Email could not be delivered. ';
  if (needsDomain && !getGmailTransport()) {
    error +=
      'Verify a domain at https://resend.com/domains (then set RESEND_FROM_EMAIL), or add GMAIL_USER and GMAIL_APP_PASSWORD in .env to send to any address.';
  } else if (!resendApiKey && !getGmailTransport()) {
    error += 'Set RESEND_API_KEY or Gmail SMTP credentials in .env.';
  } else {
    error += `Resend: ${resendMsg}. Gmail: ${gmailMsg}.`;
  }

  console.warn(`Email could not be sent to ${email}:`, error);
  return { ok: false, error, needsDomain: Boolean(needsDomain && !getGmailTransport()) };
}

async function sendWelcomeEmailServer({ to, fullName, username }) {
  const user = String(username || '').trim();
  const name = String(fullName || user || 'there').trim();
  const base = process.env.APP_URL || `http://localhost:${port}`;
  const subject = 'Welcome to Finovate — you have been signed up';
  const message =
    `Hi ${name},\n\n` +
    `You have been automatically signed up for Finovate.\n\n` +
    `Your username: @${user}\n` +
    `Email: ${to}\n\n` +
    `Log in anytime at ${base}/auth.html\n\n` +
    `— The Finovate Team`;
  const result = await sendMail({
    to,
    subject,
    message,
    actionUrl: `${base}/auth.html`,
    actionLabel: 'Log in to Finovate',
  });
  if (result.ok) console.log(`Welcome email sent to ${to}`);
  return result.ok;
}

function loadResetTokens() {
  try {
    if (!fs.existsSync(resetTokensFile)) return {};
    const parsed = JSON.parse(fs.readFileSync(resetTokensFile, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveResetTokens(tokens) {
  fs.mkdirSync(path.dirname(resetTokensFile), { recursive: true });
  fs.writeFileSync(resetTokensFile, JSON.stringify(tokens, null, 2), 'utf8');
}

function pruneResetTokens(tokens) {
  const now = Date.now();
  const next = {};
  Object.entries(tokens).forEach(([token, entry]) => {
    if (entry && Number(entry.expiresAt) > now) next[token] = entry;
  });
  return next;
}

function createResetToken(email) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokens = pruneResetTokens(loadResetTokens());
  tokens[token] = {
    email: String(email).trim().toLowerCase(),
    expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
  };
  saveResetTokens(tokens);
  return token;
}

function consumeResetToken(token) {
  const trimmed = String(token || '').trim();
  if (!trimmed) return null;
  const tokens = pruneResetTokens(loadResetTokens());
  const entry = tokens[trimmed];
  if (!entry || Number(entry.expiresAt) <= Date.now()) {
    saveResetTokens(tokens);
    return null;
  }
  delete tokens[trimmed];
  saveResetTokens(tokens);
  return entry.email;
}

async function sendPasswordResetEmail({ to, resetUrl, fullName }) {
  const name = String(fullName || 'there').trim();
  const subject = 'Reset your Finovate password';
  const message =
    `Hi ${name},\n\n` +
    `We received a request to reset your Finovate password.\n\n` +
    `Open this link to choose a new password (valid for 1 hour):\n${resetUrl}\n\n` +
    `If you did not request this, you can ignore this email.\n\n` +
    `— The Finovate Team`;
  const result = await sendMail({
    to,
    subject,
    message,
    actionUrl: resetUrl,
    actionLabel: 'Reset password',
  });
  if (result.ok) console.log(`Password reset email sent to ${to}`);
  return result;
}

// Auth API (works without PHP/MySQL — same path the frontend calls)
app.post('/php/api/users.php', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const body = req.body || {};
  const action = body.action;

  if (action === 'register') {
    const username = String(body.username || '').trim();
    const email = String(body.email || '').trim();
    const password = String(body.password || '');
    const fullName = String(body.full_name || '').trim();

    if (!username || !email || !password || !fullName) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const users = loadUsers();
    const registerConflict = signupConflictMessage(users, username, email);
    if (registerConflict) {
      res.status(400).json({ success: false, message: registerConflict });
      return;
    }

    const user = {
      id: Date.now(),
      username,
      email,
      password: hashPassword(password),
      full_name: fullName,
      status: 'active',
      two_factor_enabled: true,
      created_at: new Date().toISOString(),
    };
    users[username] = user;
    saveUsers(users);

    sendWelcomeEmailServer({ to: email, fullName, username }).catch(() => {});

    res.json({
      success: true,
      message: 'User registered successfully',
      user_id: user.id,
      user: publicUser(user),
    });
    return;
  }

  if (action === 'login') {
    const identifier = String(body.username || '').trim();
    const password = String(body.password || '');
    const users = loadUsers();
    const user = findUser(users, identifier);

    if (!user || user.password !== hashPassword(password)) {
      res.status(400).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (user.status !== 'active') {
      res.status(400).json({ success: false, message: 'User account is not active' });
      return;
    }

    res.json({
      success: true,
      message: 'Authentication successful',
      user: publicUser(user),
    });
    return;
  }

  res.status(400).json({ success: false, message: 'Invalid action' });
});

app.post('/api/email/send', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const { to, subject, message } = req.body || {};
  const result = await sendMail({ to, subject, message });
  res.json({
    success: result.ok,
    message: result.ok ? 'Email sent' : result.error || 'Could not send email',
  });
});

app.post('/api/email/password-reset', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const { to, resetUrl, fullName } = req.body || {};
  const email = String(to || '').trim();
  const link = String(resetUrl || '').trim();
  if (!email || !link) {
    res.status(400).json({ success: false, message: 'Email and reset link are required.' });
    return;
  }
  const result = await sendPasswordResetEmail({ to: email, resetUrl: link, fullName });
  res.json({
    success: result.ok,
    message: result.ok ? 'Password reset email sent' : result.error || 'Could not send email right now',
  });
});

app.post('/api/email/welcome', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const { to, fullName, username } = req.body || {};
  const sent = await sendWelcomeEmailServer({ to, fullName, username });
  res.json({
    success: sent,
    message: sent
      ? 'Welcome email sent'
      : 'Account created; email could not be delivered right now',
  });
});

app.post('/api/auth/signup/send-code', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const username = String(req.body?.username || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const fullName = String(req.body?.full_name || '').trim();

  if (!username || !email || !password || !fullName) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }

  if (password.length < 10 || password.length > 64) {
    res.status(400).json({ success: false, message: 'Password must be 10 to 64 characters.' });
    return;
  }

  const users = loadUsers();
  const sendConflict = signupConflictMessage(users, username, email);
  if (sendConflict) {
    res.status(400).json({ success: false, message: sendConflict });
    return;
  }

  const code = generateSignupCode();
  const verifications = pruneSignupVerifications(loadSignupVerifications());
  verifications[email] = {
    codeHash: hashSignupCode(code),
    expiresAt: Date.now() + SIGNUP_CODE_TTL_MS,
    username,
    email,
    passwordHash: hashPassword(password),
    full_name: fullName,
  };
  saveSignupVerifications(verifications);

  const base = appBaseUrl(req);
  const subject = 'Your Finovate verification code';
  const message =
    `Hi ${fullName},\n\n` +
    `Your two-factor verification code for Finovate sign-up is:\n\n` +
    `${code}\n\n` +
    `Enter this code on the sign-up page, or open:\n${base}/auth.html\n\n` +
    `This code expires in 15 minutes. If you did not sign up, ignore this email.\n\n` +
    `— The Finovate Team`;
  const mailResult = await sendMail({
    to: email,
    subject,
    message,
    actionUrl: `${base}/auth.html`,
    actionLabel: 'Continue sign up',
  });

  res.json({
    success: true,
    email,
    emailSent: mailResult.ok,
    message: mailResult.ok
      ? 'Verification code sent to your email. If you do not receive it, click “Show verification code” on the next step.'
      : mailResult.error || 'Email could not be sent. Use the code shown on this page.',
    verificationCode: code,
  });
});

app.post('/api/auth/signup/check', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const username = String(req.body?.username || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!username || !email) {
    res.status(400).json({ success: false, message: 'Username and email are required.' });
    return;
  }
  const users = loadUsers();
  const conflict = signupConflictMessage(users, username, email);
  if (conflict) {
    res.status(400).json({ success: false, message: conflict });
    return;
  }
  res.json({ success: true });
});

app.post('/api/auth/signup/verify', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();

  if (!email || !code) {
    res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    return;
  }

  const verifications = pruneSignupVerifications(loadSignupVerifications());
  const pending = verifications[email];
  if (!pending || pending.codeHash !== hashSignupCode(code)) {
    res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    return;
  }

  const users = loadUsers();
  const verifyConflict = signupConflictMessage(users, pending.username, pending.email);
  if (verifyConflict) {
    delete verifications[email];
    saveSignupVerifications(verifications);
    res.status(400).json({ success: false, message: verifyConflict });
    return;
  }

  const user = {
    id: Date.now(),
    username: pending.username,
    email: pending.email,
    password: pending.passwordHash,
    full_name: pending.full_name,
    status: 'active',
    two_factor_enabled: true,
    created_at: new Date().toISOString(),
  };
  users[user.username] = user;
  saveUsers(users);

  delete verifications[email];
  saveSignupVerifications(verifications);

  sendWelcomeEmailServer({
    to: user.email,
    fullName: user.full_name,
    username: user.username,
  }).catch(() => {});

  res.json({
    success: true,
    message: 'Account created successfully',
    user_id: user.id,
    user: publicUser(user),
  });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const identifier = String(req.body?.identifier || req.body?.email || '').trim();
  if (!identifier) {
    res.status(400).json({ success: false, message: 'Please enter your email or username.' });
    return;
  }

  const users = loadUsers();
  const user = findUser(users, identifier);
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'No account found with that email or username.',
    });
    return;
  }

  const base = appBaseUrl(req);
  const token = createResetToken(user.email);
  const resetUrl = `${base}/reset-password.html?token=${encodeURIComponent(token)}`;
  const mailResult = await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
    fullName: user.full_name || user.username,
  });

  if (!mailResult.ok) {
    res.json({
      success: true,
      email: user.email,
      emailSent: false,
      resetUrl,
      message:
        'Your account was found but the email could not be delivered. Use the reset link shown on the page.',
    });
    return;
  }

  res.json({
    success: true,
    email: user.email,
    emailSent: true,
    message: 'Password reset email sent',
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const token = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '');

  if (!token || !password) {
    res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
    return;
  }

  if (password.length < 10 || password.length > 64) {
    res.status(400).json({ success: false, message: 'Password must be 10 to 64 characters.' });
    return;
  }

  const email = consumeResetToken(token);
  if (!email) {
    res.status(400).json({
      success: false,
      message: 'This reset link is invalid or has expired. Please request a new one.',
    });
    return;
  }

  const users = loadUsers();
  const user = findUser(users, email);
  if (!user) {
    res.status(404).json({ success: false, message: 'Account not found.' });
    return;
  }

  user.password = hashPassword(password);
  users[user.username] = user;
  saveUsers(users);

  res.json({
    success: true,
    message: 'Password updated successfully',
    email: user.email,
  });
});

app.post('/api/auth/update-account', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const identifier = String(req.body?.identifier || req.body?.email || req.body?.username || '').trim();
  const fullName = String(req.body?.full_name || req.body?.fullName || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const twoFaRaw = req.body?.two_factor_enabled ?? req.body?.twoFa;

  if (!identifier) {
    res.status(400).json({ success: false, message: 'Account identifier is required.' });
    return;
  }

  const users = loadUsers();
  const user = findUser(users, identifier);
  if (!user) {
    res.status(404).json({ success: false, message: 'Account not found.' });
    return;
  }

  if (fullName) user.full_name = fullName;

  if (email) {
    const taken = Object.values(users).find(
      (u) =>
        u &&
        u !== user &&
        (String(u.email || '').toLowerCase() === email ||
          String(u.username || '').toLowerCase() === email)
    );
    if (taken) {
      res.status(400).json({ success: false, message: 'That email is already in use.' });
      return;
    }
    user.email = email;
  }

  if (twoFaRaw !== undefined && twoFaRaw !== null && twoFaRaw !== '') {
    const enabled =
      twoFaRaw === true ||
      twoFaRaw === 'enabled' ||
      twoFaRaw === 1 ||
      twoFaRaw === '1';
    user.two_factor_enabled = enabled;
  }

  users[user.username] = user;
  saveUsers(users);

  res.json({
    success: true,
    message: 'Account updated successfully',
    user: publicUser(user),
  });
});

app.post('/api/auth/change-password', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const identifier = String(req.body?.identifier || req.body?.email || req.body?.username || '').trim();
  const currentPassword = String(req.body?.currentPassword || '').trim();
  const newPassword = String(req.body?.newPassword || '').trim();

  if (!identifier || !currentPassword || !newPassword) {
    res.status(400).json({
      success: false,
      message: 'Identifier, current password, and new password are required.',
    });
    return;
  }

  if (newPassword.length < 10 || newPassword.length > 64) {
    res.status(400).json({ success: false, message: 'Password must be 10 to 64 characters.' });
    return;
  }

  const users = loadUsers();
  const user = findUser(users, identifier);
  if (!user || user.password !== hashPassword(currentPassword)) {
    res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    return;
  }

  user.password = hashPassword(newPassword);
  users[user.username] = user;
  saveUsers(users);

  res.json({
    success: true,
    message: 'Password changed successfully',
    email: user.email,
    user: publicUser(user),
  });
});

app.get('/api/auth/verify-reset-token', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const token = String(req.query?.token || '').trim();
  const tokens = pruneResetTokens(loadResetTokens());
  const entry = tokens[token];
  const valid = Boolean(entry && Number(entry.expiresAt) > Date.now());
  res.json({ success: valid });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'finovate', port: Number(process.env.ACTIVE_PORT) || port });
});

app.get('/api/endpoint', async (req, res) => {
  if (!apiKey) {
    res.status(500).json({ error: 'SECRET_API_KEY is not set in .env' });
    return;
  }
  try {
    const response = await axios.get('https://example.com/api', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error in API call');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.get('/auth', (req, res) => {
  res.sendFile(path.join(rootDir, 'auth.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(rootDir, 'dashboard', 'profile.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(rootDir, 'dashboard', 'dashboard.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(rootDir, 'reset-password.html'));
});

app.use(
  express.static(rootDir, {
    setHeaders(res, filePath) {
      if (/\.(html|js|css)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'no-store');
      }
    },
  })
);

function startServer(currentPort, attempts = 0) {
  const server = app.listen(currentPort, () => {
    process.env.ACTIVE_PORT = String(currentPort);
    try {
      fs.writeFileSync(
        path.join(rootDir, 'data', 'server-port.txt'),
        String(currentPort),
        'utf8'
      );
    } catch (_) {}
    const base = `http://localhost:${currentPort}`;
    console.log('');
    console.log('============================================================');
    console.log('  Finovate is running');
    console.log('============================================================');
    console.log(`  Home:       ${base}/`);
    console.log(`  Sign in:    ${base}/auth.html`);
    console.log(`  Dashboard:  ${base}/dashboard/dashboard.html`);
    console.log('');
    console.log('  Auth API:   Node (no PHP/MySQL required for login)');
    if (resendApiKey) {
      console.log(`  Email:      Resend (${configuredResendFromList().join(', ')})`);
    }
    if (getGmailTransport()) {
      console.log(`  Email:      Gmail fallback → ${gmailUser} (any recipient)`);
    } else if (!resendApiKey) {
      console.log('  Email:      Not configured — set RESEND_API_KEY or Gmail in .env');
    } else {
      console.log(
        '  Email tip:  Add GMAIL_USER + GMAIL_APP_PASSWORD in .env to email all users, or verify a domain in Resend'
      );
    }
    console.log('============================================================');
    console.log('');
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && attempts < 5) {
      const nextPort = currentPort + 1;
      console.warn(`Port ${currentPort} is in use. Trying port ${nextPort}...`);
      startServer(nextPort, attempts + 1);
    } else {
      console.error(error);
      process.exit(1);
    }
  });
}

startServer(port);
