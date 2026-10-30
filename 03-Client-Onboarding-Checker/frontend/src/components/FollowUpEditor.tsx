import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Save, 
  Sparkles, 
  ShieldAlert,
  Send
} from 'lucide-react';
import { FollowUpMessage } from '../types';

interface FollowUpEditorProps {
  followUp: FollowUpMessage | null;
  onGenerate: () => Promise<void>;
  onSave: (id: string, updates: Partial<FollowUpMessage>) => Promise<void>;
  isGenerating: boolean;
  clientEmail?: string;
}

export const FollowUpEditor: React.FC<FollowUpEditorProps> = ({
  followUp,
  onGenerate,
  onSave,
  isGenerating,
  clientEmail,
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'draft' | 'reviewed' | 'sent'>('draft');
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (followUp) {
      setRecipient(followUp.recipient_name || '');
      setSubject(followUp.subject || '');
      setBody(followUp.body || '');
      setStatus(followUp.status || 'draft');
    }
  }, [followUp]);

  const handleCopy = async () => {
    try {
      const fullText = `To: ${recipient} ${clientEmail ? `<${clientEmail}>` : ''}\nSubject: ${subject}\n\n${body}`;
      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownload = () => {
    const fullText = `# ${subject}\n\n**To:** ${recipient} ${clientEmail ? `<${clientEmail}>` : ''}\n**Date:** ${new Date().toLocaleDateString()}\n\n---\n\n${body}`;
    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `client_followup_${recipient.toLowerCase().replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!followUp) return;
    setIsSaving(true);
    try {
      await onSave(followUp.id, {
        recipient_name: recipient,
        subject,
        body,
        status,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save follow-up:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!followUp) {
    return (
      <div className="scalezix-card p-12 text-center">
        <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-800">
          No Client Follow-Up Draft Generated Yet
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
          Generate an intelligent, polite follow-up email that compiles all missing requirements, unclear specifications, and security advisories into a structured action list for the client.
        </p>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-emerald-100" />
          <span>{isGenerating ? 'Generating Email Draft...' : 'Generate Follow-Up Email'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Action Controls Bar */}
      <div className="scalezix-card p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            Client Communication Composer
          </span>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured email draft ready for client distribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="btn-secondary text-xs flex-1 sm:flex-initial min-h-[38px] sm:min-h-[36px] justify-center"
            title="Re-generate draft based on latest checklist state"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>

          <button
            onClick={handleDownload}
            className="btn-secondary text-xs flex-1 sm:flex-initial min-h-[38px] sm:min-h-[36px] justify-center"
            title="Download formatted markdown file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .md</span>
          </button>

          <button
            onClick={handleCopy}
            className={`btn-primary text-xs flex-1 sm:flex-initial min-h-[38px] sm:min-h-[36px] justify-center ${isCopied ? 'bg-emerald-700' : ''}`}
            title="Copy email to clipboard"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Email</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Form */}
      <div className="scalezix-card p-4 sm:p-6 space-y-4">
        
        {/* Recipient and Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Recipient Name & Email
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Recipient Name"
                className="input-field text-xs flex-1"
              />
              {clientEmail && (
                <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-2 rounded border border-slate-200 whitespace-nowrap text-center sm:text-left truncate max-w-full">
                  {clientEmail}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Draft Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="select-field text-xs min-h-[38px]"
            >
              <option value="draft">Draft (Internal Review)</option>
              <option value="reviewed">Reviewed (Approved to Send)</option>
              <option value="sent">Sent to Client</option>
            </select>
          </div>
        </div>

        {/* Subject Line */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Email Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input-field text-xs font-semibold"
          />
        </div>

        {/* Body Textarea */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Message Content (Markdown / Plain Text)
            </label>
            <span className="text-[11px] text-slate-400">
              Auto-populated from open gaps & security checks
            </span>
          </div>
          <textarea
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input-field font-sans text-xs leading-relaxed"
          />
        </div>

        {/* Save Changes Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {saveSuccess && (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Changes saved successfully!
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-dark text-xs flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[36px]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Draft Updates'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};

