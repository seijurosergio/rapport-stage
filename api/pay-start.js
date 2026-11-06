// GET  : indique si le paiement est activé et son prix.
// POST : crée une transaction FedaPay et renvoie l'adresse de la page de paiement.

const pay = require('./_pay.js');

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    return pay.send(res, 200, { enabled: pay.enabled(), price: pay.price() });
  }
  if (req.method !== 'POST') {
    return pay.send(res, 405, { status: 'error', message: 'Méthode non autorisée.' });
  }
  if (!pay.enabled()) {
    return pay.send(res, 503, { status: 'unavailable', message: "Le paiement n'est pas encore activé sur ce site." });
  }
  if (pay.limited('start:' + pay.clientIp(req), 12)) {
    return pay.send(res, 429, { status: 'error', message: 'Trop de tentatives. Réessaie dans une heure.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') {
    return pay.send(res, 400, { status: 'error', message: 'Demande illisible.' });
  }

  const email = String(body.email || '').trim().slice(0, 120);
  if (!EMAIL.test(email)) {
    return pay.send(res, 400, { status: 'error', message: 'Adresse e-mail invalide.' });
  }
  const parts = String(body.nom || '').trim().replace(/\s+/g, ' ').slice(0, 80).split(' ').filter(Boolean);
  const lastname = parts[0] || 'Etudiant';
  const firstname = parts.slice(1).join(' ') || lastname;

  const host = req.headers && (req.headers['x-forwarded-host'] || req.headers.host);
  const site = (process.env.SITE_URL || (host ? 'https://' + host : '')).replace(/\/+$/, '');
  const n = pay.nonce();

  try {
    const created = await pay.fedapay('POST', '/transactions', {
      description: 'Rapport de stage ' + n,
      amount: pay.price(),
      currency: { iso: 'XOF' },
      callback_url: site ? site + '/' : undefined,
      customer: { firstname: firstname, lastname: lastname, email: email }
    });
    const tx = pay.unwrap(created.data);
    if (!created.ok || !tx || !tx.id) {
      return pay.send(res, 502, { status: 'error', message: "Le service de paiement a refusé la demande. Réessaie dans un moment." });
    }
    const tok = await pay.fedapay('POST', '/transactions/' + encodeURIComponent(tx.id) + '/token');
    if (!tok.ok || !tok.data || typeof tok.data.url !== 'string' || !/^https:\/\//.test(tok.data.url)) {
      return pay.send(res, 502, { status: 'error', message: "Impossible d'ouvrir la page de paiement. Réessaie dans un moment." });
    }
    return pay.send(res, 200, { status: 'ok', id: tx.id, nonce: n, url: tok.data.url, price: pay.price() });
  } catch (e) {
    return pay.send(res, 502, { status: 'error', message: 'Impossible de joindre le service de paiement. Réessaie dans un moment.' });
  }
};
