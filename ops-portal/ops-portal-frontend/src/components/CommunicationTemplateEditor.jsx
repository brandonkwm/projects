import React, { useState } from 'react';
import { slugFromName } from '../lib/communicationTemplateStorage';

const channels = ['email', 'slack'];

export default function CommunicationTemplateEditor({ initialTemplate, onSave, onBack }) {
  const [name, setName] = useState(initialTemplate?.name || '');
  const [channel, setChannel] = useState(initialTemplate?.channel || 'email');
  const [description, setDescription] = useState(initialTemplate?.description || '');
  const [emailSubject, setEmailSubject] = useState(initialTemplate?.email?.subject || '');
  const [emailBody, setEmailBody] = useState(initialTemplate?.email?.body || '');
  const [emailFooter, setEmailFooter] = useState(initialTemplate?.email?.footer || '');
  const [slackMessage, setSlackMessage] = useState(initialTemplate?.slack?.message || '');
  const [variables, setVariables] = useState(
    Array.isArray(initialTemplate?.variables) && initialTemplate.variables.length
      ? initialTemplate.variables
      : [
          { key: '{{case.id}}', description: 'Unique case identifier' },
          { key: '{{payload.txnId}}', description: 'Transaction ID from workflow payload' },
        ]
  );

  const templateId = initialTemplate?.id || slugFromName(name || 'template');

  const handleSave = () => {
    const payload = {
      id: templateId,
      name: name.trim() || 'Untitled template',
      description: description.trim() || undefined,
      channel,
      email:
        channel === 'email'
          ? {
              subject: emailSubject,
              body: emailBody,
              footer: emailFooter || undefined,
            }
          : undefined,
      slack:
        channel === 'slack'
          ? {
              message: slackMessage,
            }
          : undefined,
      variables: variables
        .map((v) => ({
          key: v.key.trim(),
          description: v.description?.trim() || '',
        }))
        .filter((v) => v.key),
    };
    onSave?.(payload);
  };

  const handleAddVariable = () => {
    setVariables((prev) => [...prev, { key: '', description: '' }]);
  };

  const handleVariableChange = (index, patch) => {
    setVariables((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleRemoveVariable = (index) => {
    setVariables((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24, display: 'flex', gap: 16 }}>
      <div style={{ flex: 2, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                style={{
                  padding: '6px 10px',
                  fontSize: 13,
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  background: '#f9fafb',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
            )}
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {initialTemplate ? 'Edit communication template' : 'New communication template'}
              </h1>
              <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>ID: {templateId}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              background: '#7c3aed',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Save template
          </button>
        </div>

        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 16,
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            marginBottom: 16,
          }}
        >
          <label style={{ fontSize: 12, fontWeight: 500 }}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              marginBottom: 8,
              padding: '8px 10px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #d1d5db',
            }}
          />
          <label style={{ fontSize: 12, fontWeight: 500 }}>Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              padding: '8px 10px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #d1d5db',
              resize: 'vertical',
            }}
          />

          <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
            <label style={{ fontSize: 12, fontWeight: 500 }}>Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              style={{
                fontSize: 13,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
              }}
            >
              {channels.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 16,
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {channel === 'email' ? (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Email content</h2>
              <input
                type="text"
                placeholder="Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: 13,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  marginBottom: 8,
                }}
              />
              <textarea
                rows={6}
                placeholder="Body (use {{variables}} to inject data)"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: 13,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  marginBottom: 8,
                  resize: 'vertical',
                }}
              />
              <input
                type="text"
                placeholder="Footer (optional)"
                value={emailFooter}
                onChange={(e) => setEmailFooter(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: 13,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                }}
              />
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Slack message</h2>
              <textarea
                rows={8}
                placeholder="Message text (use {{variables}} to inject data)"
                value={slackMessage}
                onChange={(e) => setSlackMessage(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: 13,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  resize: 'vertical',
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Variables helper panel */}
      <aside
        style={{
          flex: 1,
          minWidth: 260,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 14,
          background: '#f9fafb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          alignSelf: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Available variables</h2>
          <button
            type="button"
            onClick={handleAddVariable}
            style={{
              padding: '4px 8px',
              fontSize: 11,
              borderRadius: 999,
              border: '1px solid #d1d5db',
              background: '#ffffff',
              cursor: 'pointer',
            }}
          >
            + Add
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 8px' }}>
          Edit this list as your flows grow. Click a variable to copy it into your template.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflow: 'auto' }}>
          {variables.map((v, index) => (
            <div
              key={index}
              style={{
                padding: 6,
                borderRadius: 6,
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  placeholder="{{variable}}"
                  value={v.key}
                  onChange={(e) => handleVariableChange(index, { key: e.target.value })}
                  style={{
                    flex: 1,
                    fontSize: 11,
                    padding: '4px 6px',
                    borderRadius: 4,
                    border: '1px solid #d1d5db',
                  }}
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(v.key)}
                  style={{
                    padding: '4px 6px',
                    fontSize: 11,
                    borderRadius: 4,
                    border: '1px solid #d1d5db',
                    background: '#f9fafb',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Copy
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="Description"
                value={v.description || ''}
                onChange={(e) => handleVariableChange(index, { description: e.target.value })}
                style={{
                  fontSize: 11,
                  padding: '4px 6px',
                  borderRadius: 4,
                  border: '1px solid #e5e7eb',
                  resize: 'vertical',
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveVariable(index)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#ef4444',
                  fontSize: 11,
                  cursor: 'pointer',
                  alignSelf: 'flex-end',
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

