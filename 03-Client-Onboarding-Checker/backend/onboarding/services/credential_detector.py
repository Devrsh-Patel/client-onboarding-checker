"""
Credential & Sensitive Data Detector
Identifies potentially insecure credential sharing (API keys, passwords, private keys, tokens)
without logging, echoing, or storing the actual sensitive secret values.
"""

import re
from typing import Dict, List, Any, Tuple

# Patterns identifying specific known credential formats and generic secret declarations
CREDENTIAL_PATTERNS: List[Tuple[str, str, re.Pattern, str]] = [
    (
        'AWS Access Key ID',
        'Cloud Infrastructure Credentials',
        re.compile(r'\b(AKIA[0-9A-Z]{16})\b'),
        '[REDACTED_AWS_ACCESS_KEY]'
    ),
    (
        'AWS Secret Access Key',
        'Cloud Infrastructure Credentials',
        re.compile(r'(?i)(?:aws_secret_access_key|aws_secret_key)\s*[:=]\s*["\']?([A-Za-z0-9/+=]{40})["\']?'),
        '[REDACTED_AWS_SECRET_KEY]'
    ),
    (
        'Stripe Secret / Restricted Key',
        'Payment Gateway Credentials',
        re.compile(r'\b((?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,})\b'),
        '[REDACTED_STRIPE_KEY]'
    ),
    (
        'OpenAI / LLM API Key',
        'AI Provider API Credentials',
        re.compile(r'\b(sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,})\b'),
        '[REDACTED_OPENAI_KEY]'
    ),
    (
        'GitHub Personal Access Token',
        'Code Repository Credentials',
        re.compile(r'\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b'),
        '[REDACTED_GITHUB_TOKEN]'
    ),
    (
        'Slack Bot / User Token',
        'Communications Integration Credentials',
        re.compile(r'\b(xox[baprs]-[0-9]{10,13}-[0-9a-zA-Z-]+)\b'),
        '[REDACTED_SLACK_TOKEN]'
    ),
    (
        'RSA / SSH Private Key',
        'Cryptographic Key Pair',
        re.compile(r'-----BEGIN (?:RSA |OPENSSH |EC |PGP |DSA )?PRIVATE KEY-----[^-]+-----END (?:RSA |OPENSSH |EC |PGP |DSA )?PRIVATE KEY-----', re.DOTALL),
        '[REDACTED_PRIVATE_KEY]'
    ),
    (
        'Database Connection URI with Password',
        'Database Connection Credentials',
        re.compile(r'(?i)(?:postgres|postgresql|mysql|mongodb(?:\+srv)?):\/\/[^:\s]+:([^@\s]+)@[^\s]+'),
        '[REDACTED_DB_CONNECTION_STRING]'
    ),
    (
        'Exposed Password / Secret String',
        'Authentication Passwords',
        re.compile(r'(?i)(?:password|passwd|client_secret|api_secret)\s*[:=]\s*["\']?([^\s"\',;]{4,})["\']?'),
        '[REDACTED_PASSWORD]'
    ),
    (
        'Bearer Authorization Token / JWT',
        'Session / API Bearer Token',
        re.compile(r'\bBearer\s+(ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b'),
        'Bearer [REDACTED_JWT_TOKEN]'
    ),
]


def scan_for_credentials(text: str) -> Dict[str, Any]:
    """
    Scans input text for sensitive credentials.
    Returns detection metadata and safe redacted text.
    NEVER returns or stores the actual secret value.
    """
    if not text or not isinstance(text, str):
        return {
            'has_secrets': False,
            'detections': [],
            'match_count': 0,
            'redacted_text': text or '',
            'advisory': None,
        }

    detections = []
    redacted_text = text

    for label, category, pattern, placeholder in CREDENTIAL_PATTERNS:
        matches = list(pattern.finditer(text))
        if matches:
            detections.append({
                'type': label,
                'category': category,
                'count': len(matches),
                'severity': 'high',
                'recommendation': (
                    f"Possible {label.lower()} detected in onboarding submission. "
                    "Secrets must never be shared in plaintext notes or unencrypted files. "
                    "Remove the secret from this case and use an approved secret manager."
                )
            })
            # Perform safe redaction
            redacted_text = pattern.sub(placeholder, redacted_text)

    has_secrets = len(detections) > 0
    advisory = (
        "Possible sensitive information detected — review required. "
        "Automated detection flagged credentials. Please verify and advise the client "
        "to rotate any exposed credentials and share future credentials via an encrypted secret manager."
        if has_secrets else None
    )

    return {
        'has_secrets': has_secrets,
        'detections': detections,
        'match_count': sum(d['count'] for d in detections),
        'redacted_text': redacted_text,
        'advisory': advisory,
    }


def sanitize_submission_notes(notes: str) -> Tuple[str, bool, List[Dict[str, Any]]]:
    """
    Convenience helper for checking submission reviewer notes or client messages.
    Returns (safe_redacted_notes, has_secrets, detections)
    """
    result = scan_for_credentials(notes)
    return result['redacted_text'], result['has_secrets'], result['detections']

