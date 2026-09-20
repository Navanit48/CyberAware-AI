/* ── CyberAware AI Password Analysis Engine ───────────────────────────── */

export function analyzePassword(password) {
  if (!password) {
    return {
      score: 0,
      label: 'Empty',
      color: 'text-subtext-muted',
      bgBar: 'bg-border-subtle',
      entropyBits: 0,
      crackTime: 'Instant',
      checks: {
        length: false,
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
      },
      suggestions: ['Enter a password to evaluate its cryptographic strength.']
    };
  }

  const length = password.length;
  let poolSize = 0;

  const checks = {
    length: length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[^A-Za-z0-9]/.test(password),
  };

  if (checks.lowercase) poolSize += 26;
  if (checks.uppercase) poolSize += 26;
  if (checks.numbers) poolSize += 10;
  if (checks.symbols) poolSize += 33;

  const entropyBits = Math.round(length * (Math.log2(poolSize || 1)));

  // Crack time estimation assuming 10 billion guesses/sec
  const combinations = Math.pow(poolSize || 1, length);
  const seconds = combinations / 1e10;
  const crackTime = formatCrackTime(seconds);

  let score = 0;
  if (checks.length) score += 30;
  if (length >= 16) score += 10;
  if (checks.uppercase) score += 15;
  if (checks.lowercase) score += 15;
  if (checks.numbers) score += 15;
  if (checks.symbols) score += 15;
  score = Math.min(100, score);

  let label = 'Very Weak';
  let color = 'text-red-400';
  let bgBar = 'bg-red-500';

  if (score >= 80) {
    label = 'Very Strong';
    color = 'text-emerald-accent';
    bgBar = 'bg-emerald-accent';
  } else if (score >= 60) {
    label = 'Strong';
    color = 'text-emerald-400';
    bgBar = 'bg-emerald-400';
  } else if (score >= 40) {
    label = 'Moderate';
    color = 'text-amber-400';
    bgBar = 'bg-amber-400';
  } else if (score >= 20) {
    label = 'Weak';
    color = 'text-orange-400';
    bgBar = 'bg-orange-400';
  }

  const suggestions = [];
  if (length < 12) suggestions.push('Increase length to at least 12–16 characters.');
  if (!checks.uppercase) suggestions.push('Add uppercase characters (A–Z).');
  if (!checks.lowercase) suggestions.push('Add lowercase characters (a–z).');
  if (!checks.numbers) suggestions.push('Add numbers (0–9).');
  if (!checks.symbols) suggestions.push('Add special symbols (!@#$%^&*).');
  if (suggestions.length === 0) {
    suggestions.push('Excellent password strength! Store it securely in a password manager.');
  }

  return {
    score,
    label,
    color,
    bgBar,
    entropyBits,
    crackTime,
    checks,
    suggestions
  };
}

function formatCrackTime(seconds) {
  if (seconds < 1) return 'Instantaneous';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} hours`;
  const days = hours / 24;
  if (days < 365) return `${Math.round(days)} days`;
  const years = days / 365;
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1e6) return `${(years / 1000).toFixed(1)}k years`;
  if (years < 1e9) return `${(years / 1e6).toFixed(1)} million years`;
  return `${(years / 1e9).toFixed(1)} billion years`;
}

export function generateSecurePassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let result = '';
  const cryptoObj = window.crypto || window.msCrypto;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const randomValues = new Uint32Array(length);
    cryptoObj.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}
