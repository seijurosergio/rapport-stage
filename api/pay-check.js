// GET ?id=...&nonce=... : vérifie auprès de FedaPay que la transaction est bien payée.

const pay = require('./_pay.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return pay.send(res, 405, { status: 'error', message: 'Méthode non autorisée.' });
  }
  if (!pay.enabled()) {
    return pay.send(res, 503, { status: 'unavailable', message: "Le paiement n'est pas encore activé sur ce site." });
  }
  if (pay.limited('check:' + pay.clientIp(req), 120)) {
    return pay.send(res, 429, { status: 'error', message: 'Trop de vérifications. Réessaie plus tard.' });
  }

  const q = req.query || {};
  const id = String(q.id || '');
  const nonce = String(q.nonce || '');
  if (!/^\d{1,12}$/.test(id) || !/^[0-9a-f]{12}$/.test(nonce)) {
    return pay.send(res, 400, { status: 'error', message: 'Référence de paiement invalide.' });
  }

  try {
    const r = await pay.fedapay('GET', '/transactions/' + id);
    const tx = pay.unwrap(r.data);
    if (!r.ok || !tx) {
      return pay.send(res, 200, { status: 'unknown', paid: false, message: 'Paiement introuvable.' });
    }
    // Le code secret (nonce) empêche d'utiliser le paiement de quelqu'un d'autre en devinant un numéro.
    const desc = String(tx.description || '');
    if (desc.slice(-12) !== nonce) {
      return pay.send(res, 200, { status: 'unknown', paid: false, message: 'Paiement introuvable.' });
    }
    const amount = Number(tx.amount);
    const status = String(tx.status || 'unknown');
    const paid = status === 'approved' && Number.isFinite(amount) && amount >= pay.price();
    return pay.send(res, 200, { status: status, paid: paid });
  } catch (e) {
    return pay.send(res, 502, { status: 'error', paid: false, message: 'Impossible de vérifier le paiement. Réessaie dans un moment.' });
  }
};
