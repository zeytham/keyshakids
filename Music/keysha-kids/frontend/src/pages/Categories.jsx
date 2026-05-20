import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Tag } from 'lucide-react'

const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay">
    <div className="modal-box" style={{ maxWidth: '440px' }}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
)

export default function Categories() {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState({})
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '' })
  const [selectedCategory, setSelectedCategory] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data,
  })

  const createCategory = useMutation({
    mutationFn: (data) => api.post('/categories', data),
    onSuccess: () => { queryClient.invalidateQueries(['categories']); toast.success('Category imeongezwa!'); setModal(null); setForm({ name: '' }) },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const updateCategory = useMutation({
    mutationFn: ({ id, data }) => api.put(`/categories/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['categories']); toast.success('Category imebadilishwa!'); setModal(null); setForm({ name: '' }) },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const deleteCategory = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['categories']); toast.success('Category imefutwa!') },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const createSubCategory = useMutation({
    mutationFn: ({ categoryId, data }) => api.post(`/categories/${categoryId}/subcategories`, data),
    onSuccess: () => { queryClient.invalidateQueries(['categories']); toast.success('Subcategory imeongezwa!'); setModal(null); setForm({ name: '' }) },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const deleteSubCategory = useMutation({
    mutationFn: ({ categoryId, subId }) => api.delete(`/categories/${categoryId}/subcategories/${subId}`),
    onSuccess: () => { queryClient.invalidateQueries(['categories']); toast.success('Subcategory imefutwa!') },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Weka jina!')
    if (modal === 'add-category') createCategory.mutate({ name: form.name })
    else if (modal === 'edit-category') updateCategory.mutate({ id: selectedCategory.id, data: { name: form.name } })
    else if (modal === 'add-subcategory') createSubCategory.mutate({ categoryId: selectedCategory.id, data: { name: form.name } })
  }

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Categories</div>
          <div className="page-sub">Simamia categories na subcategories za bidhaa</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setModal('add-category'); setForm({ name: '' }) }}>
          <Plus size={15} /> Category Mpya
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ padding: '14px' }}>
              <div className="skeleton" style={{ height: '14px', width: '40%' }} />
            </div>
          ))}
        </div>
      ) : data?.length === 0 ? (
        <div className="card empty-state">
          <Tag size={40} />
          <p>Hakuna categories — ongeza ya kwanza!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data?.map((category) => (
            <div key={category.id} className="card" style={{ overflow: 'hidden' }}>

              {/* Category Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                <button onClick={() => toggleExpand(category.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  {expanded[category.id]
                    ? <ChevronDown size={16} style={{ color: 'var(--pink)', flexShrink: 0 }} />
                    : <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  }
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'var(--pink-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Tag size={14} style={{ color: 'var(--pink)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {category.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {category.subCategories?.length || 0} subcategories • {category._count?.products || 0} bidhaa
                    </div>
                  </div>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => { setSelectedCategory(category); setModal('add-subcategory'); setForm({ name: '' }) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: 'none', background: 'var(--purple-light)', color: 'var(--purple)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={11} /> Sub
                  </button>
                  <button
                    onClick={() => { setSelectedCategory(category); setModal('edit-category'); setForm({ name: category.name }) }}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#E3F2FD', color: '#1565C0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Futa "${category.name}"?`)) deleteCategory.mutate(category.id) }}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#FFEBEE', color: '#C62828', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Subcategories */}
              {expanded[category.id] && (
                <div style={{ borderTop: '1px solid var(--border-light)', padding: '8px 16px 10px' }}>
                  {category.subCategories?.length === 0 ? (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '8px 0 4px 42px' }}>
                      Hakuna subcategories — ongeza moja!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '4px' }}>
                      {category.subCategories.map((sub) => (
                        <div key={sub.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '6px 8px 6px 42px', borderRadius: '6px',
                          transition: 'background 0.15s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--pink)', flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{sub.name}</span>
                          </div>
                          <button
                            onClick={() => { if (window.confirm(`Futa "${sub.name}"?`)) deleteSubCategory.mutate({ categoryId: category.id, subId: sub.id }) }}
                            style={{ width: '22px', height: '22px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#C62828', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FFEBEE'; e.currentTarget.style.opacity = '1' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.6' }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal
          title={
            modal === 'add-category' ? 'Ongeza Category Mpya' :
            modal === 'edit-category' ? `Badilisha: ${selectedCategory?.name}` :
            `Ongeza Subcategory — ${selectedCategory?.name}`
          }
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Jina</label>
              <input className="input" type="text" value={form.name}
                onChange={e => setForm({ name: e.target.value })}
                placeholder={modal === 'add-subcategory' ? 'Mfano: Dress, Shati, Sandali...' : 'Mfano: Nguo, Viatu, Mikobo...'}
                autoFocus />
            </div>
            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              Hifadhi
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}