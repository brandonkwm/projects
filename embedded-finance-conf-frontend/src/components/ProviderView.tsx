import { useState } from 'react'
import { useConfig } from '../context/ConfigContext'
import type { Category, CategoryId, Config } from '../types'

export default function ProviderView() {
  const { config, setConfig } = useConfig()
  const [expandedCategory, setExpandedCategory] = useState<CategoryId | null>('payments')
  const [newSubLabel, setNewSubLabel] = useState('')
  const [newSubDesc, setNewSubDesc] = useState('')
  const [newSchemeLabel, setNewSchemeLabel] = useState('')
  const [newSchemeGeo, setNewSchemeGeo] = useState('')
  const [newGeoId, setNewGeoId] = useState('')
  const [newGeoLabel, setNewGeoLabel] = useState('')
  const [newFundingId, setNewFundingId] = useState('')
  const [newFundingLabel, setNewFundingLabel] = useState('')

  function updateCategories(updater: (categories: Category[]) => Category[]) {
    setConfig((c) => ({ ...c, categories: updater(c.categories) }))
  }

  function addSubCategory(categoryId: CategoryId) {
    if (!newSubLabel.trim()) return
    const id = newSubLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    updateCategories((cats) =>
      cats.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subCategories: [...cat.subCategories, { id, label: newSubLabel.trim(), description: newSubDesc.trim() || undefined }],
            }
          : cat
      )
    )
    setNewSubLabel('')
    setNewSubDesc('')
  }

  function removeSubCategory(categoryId: CategoryId, subId: string) {
    updateCategories((cats) =>
      cats.map((cat) =>
        cat.id === categoryId ? { ...cat, subCategories: cat.subCategories.filter((s) => s.id !== subId) } : cat
      )
    )
  }

  function addScheme(categoryId: CategoryId, subId: string) {
    if (!newSchemeLabel.trim() || !newSchemeGeo.trim()) return
    const id = newSchemeLabel.toUpperCase().replace(/\s+/g, '')
    updateCategories((cats) =>
      cats.map((cat) => {
        if (cat.id !== categoryId) return cat
        return {
          ...cat,
          subCategories: cat.subCategories.map((sub) => {
            if (sub.id !== subId) return sub
            const schemes = [...(sub.schemes || []), { id, label: newSchemeLabel.trim(), geo: newSchemeGeo.trim() }]
            return { ...sub, schemes }
          }),
        }
      })
    )
    setNewSchemeLabel('')
    setNewSchemeGeo('')
  }

  function removeScheme(categoryId: CategoryId, subId: string, schemeId: string) {
    updateCategories((cats) =>
      cats.map((cat) => {
        if (cat.id !== categoryId) return cat
        return {
          ...cat,
          subCategories: cat.subCategories.map((sub) => {
            if (sub.id !== subId) return sub
            return { ...sub, schemes: (sub.schemes || []).filter((s) => s.id !== schemeId) }
          }),
        }
      })
    )
  }

  function addGeo() {
    if (!newGeoId.trim() || !newGeoLabel.trim()) return
    setConfig((c) => ({ ...c, geos: [...c.geos, { id: newGeoId.trim(), label: newGeoLabel.trim() }] }))
    setNewGeoId('')
    setNewGeoLabel('')
  }

  function removeGeo(id: string) {
    setConfig((c) => ({ ...c, geos: c.geos.filter((g) => g.id !== id) }))
  }

  function addFunding() {
    if (!newFundingId.trim() || !newFundingLabel.trim()) return
    setConfig((c) => ({ ...c, funding: [...c.funding, { id: newFundingId.trim(), label: newFundingLabel.trim() }] }))
    setNewFundingId('')
    setNewFundingLabel('')
  }

  function removeFunding(id: string) {
    setConfig((c) => ({ ...c, funding: c.funding.filter((f) => f.id !== id) }))
  }

  function updatePricing(field: keyof Config['pricing'], value: number) {
    setConfig((c) => ({ ...c, pricing: { ...c.pricing, [field]: value } }))
  }

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <p className="text-sm text-slate-400">
        Configure the options partners see in the configurator. Changes apply immediately in the Partner view.
      </p>

      {/* Categories & sub-categories */}
      <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">Categories & sub-categories</h2>
        {config.categories.map((cat) => (
          <div key={cat.id} className="mb-4 last:mb-0">
            <button
              type="button"
              onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
              className="flex items-center justify-between w-full text-left py-2 text-slate-200 font-medium"
            >
              {cat.label}
              <span className="text-slate-500">{expandedCategory === cat.id ? '▼' : '▶'}</span>
            </button>
            {expandedCategory === cat.id && (
              <div className="pl-2 border-l border-slate-700 space-y-3">
                {cat.subCategories.map((sub) => (
                  <div key={sub.id} className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-medium text-slate-300">{sub.label}</span>
                      {sub.description && <p className="text-[11px] text-slate-500">{sub.description}</p>}
                      {sub.schemes && sub.schemes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sub.schemes.map((sch) => (
                            <span
                              key={sch.id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400"
                            >
                              {sch.label} ({sch.geo})
                              <button
                                type="button"
                                onClick={() => removeScheme(cat.id, sub.id, sch.id)}
                                className="text-red-400 hover:text-red-300"
                                aria-label={`Remove ${sch.label}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSubCategory(cat.id, sub.id)}
                      className="text-[10px] text-slate-500 hover:text-red-400 shrink-0"
                    >
                      Remove sub-category
                    </button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 items-end">
                  <input
                    type="text"
                    placeholder="New sub-category label"
                    value={newSubLabel}
                    onChange={(e) => setNewSubLabel(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 w-40"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newSubDesc}
                    onChange={(e) => setNewSubDesc(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 w-48"
                  />
                  <button
                    type="button"
                    onClick={() => addSubCategory(cat.id)}
                    className="px-2 py-1.5 rounded-lg bg-sky-600 text-slate-900 text-xs font-medium hover:bg-sky-500"
                  >
                    Add sub-category
                  </button>
                </div>
                {cat.subCategories.some((s) => s.id === 'bank_linkage') && (
                  <div className="mt-2 pt-2 border-t border-slate-700">
                    <p className="text-[11px] text-slate-500 mb-1">Add payment scheme (e.g. EDDA, NPP):</p>
                    <div className="flex flex-wrap gap-2 items-end">
                      <input
                        type="text"
                        placeholder="Scheme name"
                        value={newSchemeLabel}
                        onChange={(e) => setNewSchemeLabel(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-24"
                      />
                      <input
                        type="text"
                        placeholder="Geo (e.g. SG, AU)"
                        value={newSchemeGeo}
                        onChange={(e) => setNewSchemeGeo(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-20"
                      />
                      <button
                        type="button"
                        onClick={() => addScheme(cat.id, 'bank_linkage')}
                        className="px-2 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500"
                      >
                        Add scheme
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Geos */}
      <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">Geos</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {config.geos.map((g) => (
            <span
              key={g.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 text-xs text-slate-300"
            >
              {g.label}
              <button type="button" onClick={() => removeGeo(g.id)} className="text-red-400 hover:text-red-300" aria-label={`Remove ${g.label}`}>
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <input
            type="text"
            placeholder="Geo id (e.g. US)"
            value={newGeoId}
            onChange={(e) => setNewGeoId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-20"
          />
          <input
            type="text"
            placeholder="Label"
            value={newGeoLabel}
            onChange={(e) => setNewGeoLabel(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-24"
          />
          <button
            type="button"
            onClick={addGeo}
            className="px-2 py-1.5 rounded-lg bg-sky-600 text-slate-900 text-xs font-medium hover:bg-sky-500"
          >
            Add geo
          </button>
        </div>
      </section>

      {/* Funding */}
      <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">Funding rails</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {config.funding.map((f) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-xs text-slate-300"
            >
              {f.label}
              <button type="button" onClick={() => removeFunding(f.id)} className="text-red-400 hover:text-red-300" aria-label={`Remove ${f.label}`}>
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <input
            type="text"
            placeholder="Id (e.g. ach)"
            value={newFundingId}
            onChange={(e) => setNewFundingId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-24"
          />
          <input
            type="text"
            placeholder="Label"
            value={newFundingLabel}
            onChange={(e) => setNewFundingLabel(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-28"
          />
          <button
            type="button"
            onClick={addFunding}
            className="px-2 py-1.5 rounded-lg bg-sky-600 text-slate-900 text-xs font-medium hover:bg-sky-500"
          >
            Add funding option
          </button>
        </div>
      </section>

      {/* Pricing rules – used by generated spec in Partner view */}
      <section className="bg-slate-950/80 border border-slate-700 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-slate-100 mb-2">Cost estimate rules</h2>
        <p className="text-xs text-slate-500 mb-4">
          Partners see a cost estimate based on their selection. Configure the formula here (no hardcoded values).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Base setup ($)</span>
            <input
              type="number"
              min={0}
              step={500}
              value={config.pricing.baseSetup}
              onChange={(e) => updatePricing('baseSetup', Number(e.target.value) || 0)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Base monthly ($)</span>
            <input
              type="number"
              min={0}
              step={100}
              value={config.pricing.baseMonthly}
              onChange={(e) => updatePricing('baseMonthly', Number(e.target.value) || 0)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Per geo setup ($)</span>
            <input
              type="number"
              min={0}
              step={100}
              value={config.pricing.perGeoSetup}
              onChange={(e) => updatePricing('perGeoSetup', Number(e.target.value) || 0)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Per geo monthly ($)</span>
            <input
              type="number"
              min={0}
              step={50}
              value={config.pricing.perGeoMonthly}
              onChange={(e) => updatePricing('perGeoMonthly', Number(e.target.value) || 0)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Per scheme setup ($)</span>
            <input
              type="number"
              min={0}
              step={100}
              value={config.pricing.perSchemeSetup}
              onChange={(e) => updatePricing('perSchemeSetup', Number(e.target.value) || 0)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Per scheme monthly ($)</span>
            <input
              type="number"
              min={0}
              step={50}
              value={config.pricing.perSchemeMonthly}
              onChange={(e) => updatePricing('perSchemeMonthly', Number(e.target.value) || 0)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">KYC multiplier (none)</span>
            <input
              type="number"
              min={0.5}
              step={0.1}
              value={config.pricing.kycMultiplierNone}
              onChange={(e) => updatePricing('kycMultiplierNone', Number(e.target.value) || 1)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">KYC multiplier (light)</span>
            <input
              type="number"
              min={0.5}
              step={0.1}
              value={config.pricing.kycMultiplierLight}
              onChange={(e) => updatePricing('kycMultiplierLight', Number(e.target.value) || 1)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">KYC multiplier (full)</span>
            <input
              type="number"
              min={0.5}
              step={0.1}
              value={config.pricing.kycMultiplierFull}
              onChange={(e) => updatePricing('kycMultiplierFull', Number(e.target.value) || 1)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
            />
          </label>
        </div>
      </section>
    </div>
  )
}
