export const QUIZ_QUESTIONS = [
  {
    id: 1,
    category: 'Email Phishing',
    question: 'You receive an urgent email from "support@paypal.com" claiming your account is locked and asking you to confirm your 4-digit PIN. What is the biggest red flag?',
    options: [
      'The email was sent during the weekend',
      'Legitimate financial companies never ask for your PIN or password over email',
      'The email used standard English grammar',
      'The email included a company logo'
    ],
    correctIndex: 1,
    explanation: 'Legitimate banks and payment services will NEVER ask for your PIN, password, or CVV via email or chat. Any request for credentials is an immediate phishing indicator.'
  },
  {
    id: 2,
    category: 'URL & Web Safety',
    question: 'Look closely at this web address: "https://apple.com.login-security-id.org/verify". What is the ACTUAL domain you are visiting?',
    options: [
      'apple.com',
      'login-security-id.org',
      'security-id.org',
      'A secure Apple subdomain'
    ],
    correctIndex: 1,
    explanation: 'The actual domain is always the part right before the first single slash (/). Attackers place "apple.com" as a subdomain prefix to trick unsuspecting users.'
  },
  {
    id: 3,
    category: 'Authentication & 2FA',
    question: 'What is Two-Factor Authentication (2FA), and why is it essential?',
    options: [
      'Using two different passwords for the same account',
      'Logging in simultaneously from two computers',
      'A second layer of verification (like an authenticator app code) required in addition to your password',
      'Changing your password twice every month'
    ],
    correctIndex: 2,
    explanation: '2FA ensures that even if an attacker steals your password, they cannot access your account without your secondary physical verification factor (such as an authenticator app OTP).'
  },
  {
    id: 4,
    category: 'Password Hygiene',
    question: 'Which of the following makes a password the most secure against modern brute-force and dictionary attacks?',
    options: [
      'Using your birth year with an exclamation mark (e.g., John1995!)',
      'Replacing letter "E" with "3" in a common word (e.g., P@ssw0rd)',
      'A long passphrase combining 4+ random words with special characters (e.g., Blue#River7!Tiger$Jump)',
      'Using the exact same complex password across all your personal and work accounts'
    ],
    correctIndex: 2,
    explanation: 'Length and entropy beat simple substitutions. Long passphrases are extremely resistant to cracking algorithms, especially when unique per service.'
  },
  {
    id: 5,
    category: 'Web Encryption',
    question: 'What does the padlock icon and "HTTPS" in your browser URL bar signify?',
    options: [
      'The website is 100% verified to never be a scam',
      'Communication between your browser and the website is encrypted and protected from eavesdropping',
      'The website has no viruses or malware',
      'The website is owned by the government'
    ],
    correctIndex: 1,
    explanation: 'HTTPS encrypts the data in transit (like passwords or credit cards), preventing local network eavesdropping. Note that phishing sites can also have HTTPS, so always verify the domain!'
  },
  {
    id: 6,
    category: 'Malicious Attachments',
    question: 'An unexpected email from an unknown supplier contains an attachment named "Invoice_Payment_Overdue.exe". What should you do?',
    options: [
      'Double-click it immediately to see how much money is owed',
      'Rename the file extension to .pdf and open it',
      'Do not open the file, delete the email, or report it to IT/security',
      'Forward it to your colleagues to see if they recognize the supplier'
    ],
    correctIndex: 2,
    explanation: 'Executable files (.exe, .scr, .vbs, .iso) disguised as invoices or receipts are high-risk malware delivery vectors (ransomware/trojans). Never execute unsolicited files.'
  },
  {
    id: 7,
    category: 'Social Engineering',
    question: 'You receive an urgent message from your "CEO" on WhatsApp asking you to discreetly purchase $500 in Apple Gift Cards for a client. What type of attack is this?',
    options: [
      'Ransomware Attack',
      'Distributed Denial of Service (DDoS)',
      'Business Email Compromise (BEC) / CEO Spear Phishing',
      'SQL Injection'
    ],
    correctIndex: 2,
    explanation: 'This is classic Executive Impersonation / CEO Fraud. Attackers exploit authority and urgency to pressure employees into untraceable financial transactions.'
  },
  {
    id: 8,
    category: 'Public Wi-Fi & Privacy',
    question: 'When connecting to an open, password-free public Wi-Fi network at a coffee shop or airport, what is the best defensive practice?',
    options: [
      'Perform all your online banking transactions while on the public network',
      'Use a trusted Virtual Private Network (VPN) and avoid accessing sensitive personal accounts',
      'Turn off your device firewall',
      'Accept all network security certificate warnings that pop up'
    ],
    correctIndex: 1,
    explanation: 'Open public Wi-Fi networks are vulnerable to Man-in-the-Middle (MitM) attacks and packet sniffing. A trusted VPN encrypts all your traffic from local eavesdroppers.'
  },
  {
    id: 9,
    category: 'Email Authentication',
    question: 'What do email security protocols like SPF, DKIM, and DMARC do?',
    options: [
      'They speed up how fast your emails are downloaded',
      'They cryptographically verify the sender server and prevent malicious domain spoofing',
      'They compress image attachments to save storage space',
      'They automatically translate foreign emails into English'
    ],
    correctIndex: 1,
    explanation: 'SPF authorizes sending mail server IPs, DKIM adds tamper-proof cryptographic signatures, and DMARC enforces domain policy—together preventing forged sender addresses.'
  },
  {
    id: 10,
    category: 'SMS & Mobile Security',
    question: 'You get a text message stating "Your package delivery failed. Click this link and enter your card details to pay a $1.50 redelivery fee." What is this attack called?',
    options: [
      'Smishing (SMS Phishing)',
      'Buffer Overflow',
      'Cross-Site Scripting (XSS)',
      'Zero-Day Exploit'
    ],
    correctIndex: 0,
    explanation: 'Smishing is phishing conducted via SMS text messages. Scammers use delivery fee pretexts to harvest payment cards and personal identity credentials.'
  }
];
