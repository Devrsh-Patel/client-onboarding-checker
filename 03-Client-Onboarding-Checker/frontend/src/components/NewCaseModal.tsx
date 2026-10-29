import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Building2, 
  FolderPlus, 
  UserPlus, 
  Calendar, 
  Layers, 
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ClientAccount, ChecklistTemplate, ServiceType } from '../types';
import { getClients, getTemplates, createClient, createCase } from '../services/api';
import { MOCK_TEMPLATES } from '../services/mockData';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated?: (newCaseId: string) => void;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({ isOpen, onClose, onCaseCreated }) => {
  const navigate = useNavigate();

  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Case Fields
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('web_app');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [targetLaunchDate, setTargetLaunchDate] = useState('');
  const [notes, setNotes] = useState('');

  // Inline "Create New Client" Mode
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedClients, fetchedTemplates] = await Promise.all([
        getClients().catch(() => []),
        getTemplates().catch(() => MOCK_TEMPLATES),
      ]);
      setClients(fetchedClients);
      setTemplates(fetchedTemplates.length > 0 ? fetchedTemplates : MOCK_TEMPLATES);

      if (fetchedClients.length > 0) {
        setSelectedClientId(fetchedClients[0].id);
      }
      if (fetchedTemplates.length > 0) {
        setSelectedTemplateId(fetchedTemplates[0].id);
      }
    } catch (err: any) {
      setError('Could not load clients or templates. Working in demo mode.');
    } finally {
      setIsLoading(false);
    }
  };

  // Adjust recommended template when service type changes
  const handleServiceTypeChange = (st: ServiceType) => {
    setServiceType(st);
    const matched = templates.find((t) => t.service_type === st);
    if (matched) {
      setSelectedTemplateId(matched.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let finalClientId = selectedClientId;

      // Create new client if in creation mode
      if (isCreatingClient) {
        if (!newClientName || !newClientCompany || !newClientEmail) {
          throw new Error('Please fill all required client fields (Contact Name, Company, Email).');
        }
        const createdClient = await createClient({
          name: newClientName,
          company: newClientCompany,
          contact_email: newClientEmail,
          contact_phone: newClientPhone,
        });
        finalClientId = createdClient.id;
      }

      if (!finalClientId) {
        throw new Error('Please select or create a client account.');
      }

      if (!projectName.trim()) {
        throw new Error('Please enter a project name.');
      }

      const newCase = await createCase({
        client_id: finalClientId,
        project_name: projectName,
        service_type: serviceType,
        checklist_template_id: selectedTemplateId || undefined,
        target_launch_date: targetLaunchDate || undefined,
        notes: notes,
      });

      onClose();
      if (onCaseCreated) {
        onCaseCreated(newCase.id);
      } else {
        navigate(`/cases/${newCase.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create onboarding case.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                New Client Onboarding Case
              </h2>
              <p className="text-xs text-slate-500">
                Initialize a structured document intake and gap audit workbench.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Client Selection vs New Client */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Client Account
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingClient(!isCreatingClient)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                {isCreatingClient ? '← Select Existing Client' : '+ Create New Client'}
              </button>
            </div>

            {!isCreatingClient ? (
              <div>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="select-field text-xs"
                  disabled={clients.length === 0}
                >
                  {clients.length === 0 && <option value="">No clients found — create a new one</option>}
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company} — {c.name} ({c.contact_email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Company Name *"
                    value={newClientCompany}
                    onChange={(e) => setNewClientCompany(e.target.value)}
                    className="input-field text-xs"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Primary Contact Name *"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="input-field text-xs"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="Contact Email *"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="input-field text-xs"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Omnichannel Commerce Portal, Internal Ops AI Agent"
              className="input-field text-xs font-medium"
            />
          </div>

          {/* Service Type and Template */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Service Delivery Type
              </label>
              <select
                value={serviceType}
                onChange={(e) => handleServiceTypeChange(e.target.value as ServiceType)}
                className="select-field text-xs"
              >
                <option value="web_app">Web Application / MVP</option>
                <option value="ai_agent">AI Agent / LLM Integration</option>
                <option value="cloud_infrastructure">Cloud Infrastructure & DevOps</option>
                <option value="branding_design">UX/UI & Brand Design</option>
                <option value="custom_software">Custom Enterprise Software</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Checklist Template
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="select-field text-xs"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Launch Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Target Launch / Sprint Kickoff Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={targetLaunchDate}
                onChange={(e) => setTargetLaunchDate(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          {/* Reviewer Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Initial Reviewer Notes & Context
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes regarding scope, priority integrations, or deadlines..."
              className="input-field text-xs"
            />
          </div>

          {/* Submit Actions */}
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
              disabled={isSubmitting || isLoading}
              className="btn-primary text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Case...' : 'Create & Open Case'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

