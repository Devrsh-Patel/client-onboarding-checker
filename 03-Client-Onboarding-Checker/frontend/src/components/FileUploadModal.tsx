import React, { useState, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle,
  Lock
} from 'lucide-react';
import { SubmissionItem, SubmissionStatus } from '../types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionItem | null;
  onSave: (id: string, updates: Partial<SubmissionItem>) => Promise<void>;
}

// Client-side regex patterns matching backend credential_detector.py
const CREDENTIAL_PATTERNS = [
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g, redaction: '[REDACTED_AWS_KEY]' },
  { name: 'Stripe Secret Key', regex: /sk_(live|test)_[0-9a-zA-Z]{24,}/g, redaction: '[REDACTED_STRIPE_KEY]' },
  { name: 'GitHub Personal Token', regex: /gh[pousr]_[A-Za-z0-9_]{36,}/g, redaction: '[REDACTED_GITHUB_TOKEN]' },
  { name: 'OpenAI Secret Key', regex: /sk-[a-zA-Z0-9_-]{32,}/g, redaction: '[REDACTED_OPENAI_KEY]' },
  { name: 'Private Key Block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g, redaction: '[REDACTED_PRIVATE_KEY]' },
  { name: 'Password in Text', regex: /(?:password|passwd|pwd)\s*[:=]\s*["']?([^\s"';\n]{6,})["']?/gi, redaction: 'password: [REDACTED_PASSWORD]' },
];

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  submission,
  onSave,
}) => {
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [status, setStatus] = useState<SubmissionStatus>('missing');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedSecrets, setDetectedSecrets] = useState<string[]>([]);

  useEffect(() => {
    if (submission) {
      setFileName(submission.file_name || '');
      setFileType(submission.file_type || '');
      setStatus(submission.received_status);
      setReviewerNotes(submission.reviewer_notes || '');
      checkSecrets(submission.reviewer_notes || '');
    }
  }, [submission]);

  const checkSecrets = (text: string) => {
    const found: string[] = [];
    CREDENTIAL_PATTERNS.forEach((p) => {
      if (p.regex.test(text)) {
        found.push(p.name);
      }
    });
    setDetectedSecrets(found);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReviewerNotes(val);
    checkSecrets(val);
  };

  const handleRedactNotes = () => {
    let sanitized = reviewerNotes;
    CREDENTIAL_PATTERNS.forEach((p) => {
      sanitized = sanitized.replace(p.regex, p.redaction);
    });
    setReviewerNotes(sanitized);
    checkSecrets(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;

    setIsSubmitting(true);
    try {
      await onSave(submission.id, {
        file_name: fileName,
        file_type: fileType,
        received_status: status,
        reviewer_notes: reviewerNotes,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update submission:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !submission) return null;

  const itemTitle = submission.checklist_item_detail?.title || 'Checklist Requirement';
  const acceptableEvidence = submission.checklist_item_detail?.acceptable_evidence || 'Standard documentation';

  return (
    <div className="modal-backdrop">
      <div className="modal-content animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Update Evidence & Verification
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {itemTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Acceptable Evidence Guideline Banner */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-emerald-900">
            <span className="font-bold flex items-center gap-1.5 text-emerald-800 mb-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Acceptable Evidence Guidelines:
            </span>
            <p className="text-emerald-800 leading-relaxed">
              {acceptableEvidence}
            </p>
          </div>

          {/* Submission Status Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Evidence Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SubmissionStatus)}
              className="select-field"
            >
              <option value="received">Received (Complete & Verified)</option>
              <option value="missing">Missing (Not Yet Provided)</option>
              <option value="incomplete">Incomplete (Partial Evidence / Needs More Details)</option>
              <option value="needs_review">Needs Review (Awaiting Tech Review)</option>
              <option value="awaiting_clarification">Awaiting Client Clarification</option>
              <option value="not_applicable">Not Applicable (Exempt for this project)</option>
            </select>
          </div>

          {/* File Name / Identifier */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Document Name / Reference Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g., aws_staging_role_arn.txt, figma_specs_v2.pdf"
                className="input-field pl-9"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Enter the artifact name, file reference, or Cloud link identifier.
            </p>
          </div>

          {/* Reviewer Notes & Credential Realtime Detection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Reviewer Notes & Verification Log
              </label>
              <span className="text-[11px] text-slate-400">
                Auto-scanned for raw credentials
              </span>
            </div>
            <textarea
              rows={4}
              value={reviewerNotes}
              onChange={handleNotesChange}
              placeholder="Record technical notes, verification checks, or instructions for the client..."
              className={`input-field font-sans text-xs ${
                detectedSecrets.length > 0 ? 'border-red-300 focus:border-red-500' : ''
              }`}
            />
          </div>

          {/* Sensitive Credential Alert Warning (if secret detected in input) */}
          {detectedSecrets.length > 0 && (
            <div className="p-3.5 bg-red-50 border border-red-300 rounded-lg text-xs animate-in slide-in-from-top-1">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-red-900 block">
                    Security Warning: Potential Secret Detected!
                  </span>
                  <p className="text-red-700">
                    Patterns detected: <strong>{detectedSecrets.join(', ')}</strong>. Raw secrets must never be saved in unencrypted notes.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRedactNotes}
                      className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded font-medium text-[11px] inline-flex items-center gap-1 transition-colors"
                    >
                      <Lock className="w-3 h-3" />
                      Auto-Redact Secrets Now
                    </button>
                    <span className="text-[11px] text-red-600 italic">
                      Client should send via 1Password / Bitwarden link.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Evidence & Update Status'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

