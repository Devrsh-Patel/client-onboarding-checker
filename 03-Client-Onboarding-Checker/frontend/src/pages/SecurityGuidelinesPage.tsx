import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Key, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Terminal,
  Copy,
  Check
} from 'lucide-react';

const CREDENTIAL_RULES = [
  {
    name: 'AWS Access Key IDs',
    pattern: 'AKIA[0-9A-Z]{16}',
    risk: 'Grants programmatic access to AWS cloud resources and billing.',
    redaction: '[REDACTED_AWS_KEY]',
    remedy: 'Use IAM Role ARN cross-account delegation or AWS Identity Center instead of static root/admin keys.',
  },
  {
    name: 'Stripe Secret API Keys',
    pattern: 'sk_live_... / sk_test_...',
    risk: 'Direct access to customer payment methods, charges, and payouts.',
    redaction: '[REDACTED_STRIPE_KEY]',
    remedy: 'Create restricted API keys with read-only or scoped webhook permissions; share via 1Password vault.',
  },
  {
    name: 'GitHub Personal Access Tokens',
    pattern: 'ghp_... / gho_... / ghu_...',
    risk: 'Unrestricted repository read/write access and CI/CD secret extraction.',
    redaction: '[REDACTED_GITHUB_TOKEN]',
    remedy: 'Invite the Scalezix GitHub Organization or use fine-grained repository tokens.',
  },
  {
    name: 'OpenAI / Anthropic Secret Keys',
    pattern: 'sk-...',
    risk: 'Direct model invocation and token consumption billed to client.',
    redaction: '[REDACTED_OPENAI_KEY]',
    remedy: 'Create scoped project API keys with monthly spend limits ($100 budget cap).',
  },
  {
    name: 'RSA / SSH Private Keys',
    pattern: '-----BEGIN [RSA] PRIVATE KEY-----',
    risk: 'Full root shell access to staging/production virtual machines.',
    redaction: '[REDACTED_PRIVATE_KEY]',
    remedy: 'Never transmit private keys. Provide Scalezix with your public SSH key, or use AWS SSM Session Manager.',
  },
];

export const SecurityGuidelinesPage: React.FC = () => {
  const [playgroundInput, setPlaygroundInput] = useState(
    'Initial note: client submitted sk_test_51Abc1234567890defXYZ and AWS key AKIAIOSFODNN7EXAMPLE for review.'
  );
  const [isCopied, setIsCopied] = useState(false);

  // Live sanitization
  const sanitizeText = (text: string) => {
    let result = text;
    result = result.replace(/AKIA[0-9A-Z]{16}/g, '[REDACTED_AWS_KEY]');
    result = result.replace(/sk_(live|test)_[0-9a-zA-Z]{24,}/g, '[REDACTED_STRIPE_KEY]');
    result = result.replace(/gh[pousr]_[A-Za-z0-9_]{36,}/g, '[REDACTED_GITHUB_TOKEN]');
    result = result.replace(/sk-[a-zA-Z0-9_-]{32,}/g, '[REDACTED_OPENAI_KEY]');
    result = result.replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]');
    result = result.replace(/(?:password|passwd|pwd)\s*[:=]\s*["']?([^\s"';\n]{6,})["']?/gi, 'password: [REDACTED_PASSWORD]');
    return result;
  };

  const redactedOutput = sanitizeText(playgroundInput);
  const hasSecrets = redactedOutput !== playgroundInput;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="scalezix-card p-6 md:p-8 bg-slate-900 text-white mb-8 border-slate-800">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
            <ShieldAlert className="w-3.5 h-3.5" />
            Security & Zero-Exposure Vault Policy
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-2">
            Credential Safeguards & Detection Protocol
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Scalezix strictly enforces a zero-raw-credentials policy. Raw secrets must never be stored in onboarding notes, CSV exports, or shared via unencrypted channels.
          </p>
        </div>
      </div>

      {/* Interactive Scanner Playground */}
      <div className="scalezix-card p-6 mb-8 border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-600" />
              Live Credential Redaction Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Test how the Scalezix automated gap analyzer sanitizes unencrypted notes and masks secret values.
            </p>
          </div>
          {hasSecrets ? (
            <span className="status-badge status-badge-missing">
              <AlertTriangle className="w-3 h-3" /> Credentials Detected & Redacted
            </span>
          ) : (
            <span className="status-badge status-badge-received">
              <CheckCircle className="w-3 h-3" /> Sanitized / No Secrets Detected
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Raw Input (Reviewer Notes / Intake text)
            </label>
            <textarea
              rows={5}
              value={playgroundInput}
              onChange={(e) => setPlaygroundInput(e.target.value)}
              className="input-field font-mono text-xs"
              placeholder="Paste sample text containing keys or tokens..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Sanitized Output (Safe for Storage & Export)
            </label>
            <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 h-[118px] overflow-y-auto leading-relaxed select-all">
              {redactedOutput}
            </div>
          </div>
        </div>
      </div>

      {/* Rules & Patterns Grid */}
      <div className="scalezix-card p-6 mb-8">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          Recognized Secret Signatures & Protocols
        </h3>

        <div className="divide-y divide-slate-100">
          {CREDENTIAL_RULES.map((rule, idx) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{rule.name}</span>
                    <code className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {rule.pattern}
                    </code>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    <strong>Exposure Risk:</strong> {rule.risk}
                  </p>
                  <p className="text-xs text-emerald-800 mt-1">
                    <strong>Recommended Protocol:</strong> {rule.remedy}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="secret-badge text-[11px] bg-red-950 text-red-200 px-2.5 py-1 rounded font-mono border border-red-800">
                    {rule.redaction}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Password Manager Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="scalezix-card p-6 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              1P
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              1Password Item Sharing
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Clients can generate a secure, expiring 1Password link for API keys or database connection strings. Links automatically expire after 1 viewing or 7 days.
          </p>
          <a
            href="https://1password.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
          >
            <span>Learn about 1Password Secure Sharing</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="scalezix-card p-6 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              BW
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Bitwarden Send
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            End-to-end encrypted transmission of environment variables, passwords, or SSL certificates with password protection and strict deletion schedules.
          </p>
          <a
            href="https://bitwarden.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
          >
            <span>Explore Bitwarden Send Documentation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>

    </div>
  );
};

