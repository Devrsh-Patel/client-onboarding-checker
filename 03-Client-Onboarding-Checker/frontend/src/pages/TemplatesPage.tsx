import React, { useState, useEffect } from 'react';
import { Layers, FileCode2, Bot, Cloud, CheckCircle, Shield, FileText } from 'lucide-react';
import { ChecklistTemplate, ServiceType } from '../types';
import { getTemplates } from '../services/api';
import { MOCK_TEMPLATES } from '../services/mockData';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>(MOCK_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate>(MOCK_TEMPLATES[0]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const fetched = await getTemplates();
      if (fetched.length > 0) {
        setTemplates(fetched);
        setSelectedTemplate(fetched[0]);
      }
    } catch (err) {
      console.warn('Using mock templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case 'web_app':
        return <FileCode2 className="w-5 h-5 text-emerald-600" />;
      case 'ai_agent':
        return <Bot className="w-5 h-5 text-sky-600" />;
      case 'cloud_infrastructure':
        return <Cloud className="w-5 h-5 text-indigo-600" />;
      default:
        return <Layers className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="scalezix-card p-5 sm:p-6 md:p-8 bg-slate-900 text-white mb-6 sm:mb-8 border-slate-800">
        <div className="max-w-3xl">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
            Standard Operating Procedures
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-2">
            Onboarding Checklist Blueprints
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Pre-configured technical requirement templates developed for high-velocity software delivery, AI agent orchestration, and enterprise cloud migrations.
          </p>
        </div>
      </div>

      {/* Main Grid: Template Selector + Items Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Column: Template Cards */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Available Blueprints ({templates.length})
          </h3>

          {templates.map((tpl) => {
            const isSelected = selectedTemplate?.id === tpl.id;

            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className={`scalezix-card p-4 sm:p-5 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50/20 shadow-md ring-1 ring-emerald-500' 
                    : 'hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0">
                    {getServiceIcon(tpl.service_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 break-words">
                        {tpl.name}
                      </h4>
                      {tpl.is_default && (
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded whitespace-nowrap">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="font-semibold text-emerald-700">
                        {tpl.items?.length || tpl.items_count || 5} requirements
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-500 uppercase text-[11px]">
                        {tpl.service_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Template Items Breakdown */}
        <div className="lg:col-span-2">
          {selectedTemplate && (
            <div className="scalezix-card p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 break-words">
                    {selectedTemplate.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedTemplate.description}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded w-fit whitespace-nowrap">
                  {selectedTemplate.service_type_display || selectedTemplate.service_type}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 sm:space-y-4">
                {selectedTemplate.items && selectedTemplate.items.length > 0 ? (
                  selectedTemplate.items.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs font-bold text-slate-400 flex-shrink-0">
                            #{item.order || idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 break-words">
                            {item.title}
                          </h4>
                        </div>
                        {item.is_required ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded uppercase whitespace-nowrap">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase whitespace-nowrap">
                            Optional
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">
                        {item.description}
                      </p>

                      <div className="mt-3 p-2 bg-white rounded border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                        <span className="font-bold text-slate-700 whitespace-nowrap">
                          Acceptable Evidence:
                        </span>
                        <span className="text-slate-600 break-words">
                          {item.acceptable_evidence}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No items found for this template.
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};

