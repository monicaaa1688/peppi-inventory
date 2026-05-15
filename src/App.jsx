import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, isConfigured } from './lib/supabase'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CFG = {
  现货: { bg: 'bg-mint',     text: 'text-emerald-800' },
  在制: { bg: 'bg-peach',    text: 'text-orange-800'  },
  在途: { bg: 'bg-lavender', text: 'text-indigo-800'  },
}

const STOCK_FIELDS = [
  { key: 'stock_ready',      label: '现货', ...STATUS_CFG['现货'] },
  { key: 'stock_production', label: '在制', ...STATUS_CFG['在制'] },
  { key: 'stock_transit',    label: '在途', ...STATUS_CFG['在途'] },
]

const DEMO_PRODUCTS = [
  { name: '珍珠奶油托特包',   stock_ready: 5,  stock_production: 2, stock_transit: 0, arrival_note: '',              thumbnail_url: '' },
  { name: '草莓牛奶针织开衫', stock_ready: 0,  stock_production: 3, stock_transit: 8, arrival_note: '预计3天内飞奔到仓库', thumbnail_url: '' },
  { name: '奶油芝士侧背包',   stock_ready: 2,  stock_production: 5, stock_transit: 0, arrival_note: '约7天后出炉，香！',  thumbnail_url: '' },
  { name: '薄荷冰激凌凉鞋',   stock_ready: 12, stock_production: 0, stock_transit: 6, arrival_note: '',              thumbnail_url: '' },
]

// ─── FloatParticle ────────────────────────────────────────────────────────────

function FloatParticle({ value, color }) {
  return (
    <span
      className="float-particle"
      style={{ color, right: value > 0 ? '4px' : 'auto', left: value < 0 ? '4px' : 'auto', top: 0 }}
    >
      {value > 0 ? `+${value}` : value}
    </span>
  )
}

// ─── StockRow ─────────────────────────────────────────────────────────────────

function StockRow({ label, value, fieldKey, bg, text, mode, onUpdate, productId }) {
  const [anim, setAnim] = useState(false)
  const [particles, setParticles] = useState([])
  const particleId = useRef(0)

  const fireParticle = (delta) => {
    const id = ++particleId.current
    setParticles(p => [...p, { id, delta }])
    setTimeout(() => setParticles(p => p.filter(x => x.id !== id)), 650)
  }

  const handle = (delta) => {
    const next = Math.max(0, value + delta)
    setAnim(true)
    setTimeout(() => setAnim(false), 360)
    fireParticle(delta)
    onUpdate(productId, fieldKey, next)
  }

  return (
    <div className="relative flex items-center gap-1">
      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${bg} ${text} w-8 text-center flex-shrink-0 select-none`}>
        {label}
      </span>

      {mode === 'admin' ? (
        <>
          <button
            onClick={() => handle(-1)}
            disabled={value === 0}
            className="w-7 h-7 rounded-full bg-sakura-light text-warm-brown font-black text-sm flex items-center justify-center btn-gummy disabled:opacity-30 active:bg-sakura transition-colors flex-shrink-0"
          >−</button>
          <span className={`flex-1 text-center font-black text-sm tabular-nums text-warm-brown ${anim ? 'animate-numberBounce' : ''}`}>
            {value}
          </span>
          <button
            onClick={() => handle(1)}
            className="w-7 h-7 rounded-full bg-mint-light text-warm-brown font-black text-sm flex items-center justify-center btn-gummy active:bg-mint transition-colors flex-shrink-0"
          >+</button>
          {particles.map(p => (
            <FloatParticle key={p.id} value={p.delta} color={p.delta > 0 ? '#047857' : '#e11d48'} />
          ))}
        </>
      ) : (
        <span className="text-sm font-black text-warm-brown tabular-nums ml-1">
          {value}<span className="text-xs font-bold text-warm-gray ml-0.5">件</span>
        </span>
      )}
    </div>
  )
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

function ProductCard({ product, mode, onUpdateStock, onCopy, onDelete, copied }) {
  const fallback = product.name?.slice(0, 1) ?? '?'

  const buildCopyText = () => {
    const stockLines = STOCK_FIELDS
      .filter(f => (product[f.key] ?? 0) > 0)
      .map(f => `${f.label}：${product[f.key]}件`)

    return [
      'Peppi 款式播报', '',
      `款式：${product.name}`,
      ...stockLines,
      product.arrival_note || null, '',
      '来自 Peppi 小团队的温柔告知',
    ].filter(l => l !== null).join('\n')
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden relative flex flex-col">

      {/* Delete */}
      {mode === 'admin' && (
        <button
          onClick={() => onDelete(product.id)}
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/10 text-warm-brown active:bg-sakura active:text-white flex items-center justify-center text-xs font-black transition-all z-10"
        >×</button>
      )}

      {/* Thumbnail */}
      <div className="w-full aspect-square bg-butter-100 flex items-center justify-center overflow-hidden">
        {product.thumbnail_url ? (
          <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-contain" />
        ) : (
          <span className="text-2xl font-black text-warm-gray/30">{fallback}</span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1.5 flex-1">

        <h3 className="font-extrabold text-warm-brown text-xs leading-tight line-clamp-2 pr-5">
          {product.name}
        </h3>

        {/* Three stock rows */}
        <div className="flex flex-col gap-1 mt-0.5">
          {STOCK_FIELDS.map(f => (
            <StockRow
              key={f.key}
              label={f.label}
              value={product[f.key] ?? 0}
              fieldKey={f.key}
              bg={f.bg}
              text={f.text}
              mode={mode}
              onUpdate={onUpdateStock}
              productId={product.id}
            />
          ))}
        </div>

        {/* Arrival note */}
        {product.arrival_note && (
          <p className="text-[10px] text-warm-gray font-semibold bg-butter-100 rounded-xl px-2 py-1 leading-tight line-clamp-1">
            {product.arrival_note}
          </p>
        )}

        {/* Copy button */}
        {mode === 'share' && (
          <button
            onClick={() => onCopy(product, buildCopyText())}
            className={[
              'w-full py-2 rounded-xl font-extrabold text-xs transition-all duration-200 mt-auto',
              copied ? 'bg-mint text-emerald-800 scale-95' : 'bg-sunshine text-warm-brown btn-gummy active:bg-sunshine-dark',
            ].join(' ')}
          >
            {copied ? '已复制！' : '复制文案'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── AddProductModal ──────────────────────────────────────────────────────────

function AddProductModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    stock_ready: 0,
    stock_production: 0,
    stock_transit: 0,
    arrival_note: '',
  })
  const [loading,      setLoading]      = useState(false)
  const [imageFile,    setImageFile]    = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading,    setUploading]    = useState(false)
  const [uploadError,  setUploadError]  = useState(null)
  const cameraInputRef  = useRef(null)
  const galleryInputRef = useRef(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setUploadError(null)
  }

  const clearImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setUploadError(null)
    if (cameraInputRef.current)  cameraInputRef.current.value  = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const uploadImage = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('peppi-images')
      .upload(fileName, file, { contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from('peppi-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    let thumbnail_url = ''
    if (imageFile) {
      setUploading(true)
      try {
        thumbnail_url = await uploadImage(imageFile)
      } catch (err) {
        setUploadError('图片上传失败：' + err.message)
        setLoading(false)
        setUploading(false)
        return
      }
      setUploading(false)
    }
    await onAdd({
      name: form.name.trim(),
      thumbnail_url,
      stock_ready:      Math.max(0, parseInt(form.stock_ready)      || 0),
      stock_production: Math.max(0, parseInt(form.stock_production) || 0),
      stock_transit:    Math.max(0, parseInt(form.stock_transit)    || 0),
      arrival_note: form.arrival_note,
    })
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(92,74,58,0.25)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-t-4xl sm:rounded-4xl shadow-soft-lg w-full max-w-md overflow-y-auto"
        style={{
          maxHeight: '92dvh',
          padding: '24px 20px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-warm-brown">添加新款式</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-butter-100 text-warm-gray font-black active:bg-butter-200 transition-colors flex items-center justify-center text-lg"
          >×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="input-peppi"
            placeholder="款式名称 *"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            required
          />

          {/* Hidden file inputs */}
          <input ref={cameraInputRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {imagePreview ? (
            <div className="relative w-full rounded-2xl overflow-hidden bg-butter-100" style={{ aspectRatio: '4/3' }}>
              <img src={imagePreview} alt="预览" className="w-full h-full object-contain" />
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <span className="text-warm-brown font-extrabold text-sm">上传中...</span>
                </div>
              )}
              {!uploading && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-9 h-9 rounded-full bg-warm-brown/70 text-white font-black flex items-center justify-center active:bg-warm-brown transition-colors"
                >×</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-5 rounded-3xl border-2 border-dashed border-sakura/50 bg-gradient-to-br from-sakura-light/50 to-lavender/20 active:from-sakura-light/80 transition-all flex flex-col items-center gap-1"
              >
                <span className="text-warm-brown font-extrabold text-sm">拍照</span>
                <span className="text-warm-gray text-xs font-semibold">调用相机</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="py-5 rounded-3xl border-2 border-dashed border-mint/60 bg-gradient-to-br from-mint-light/50 to-lavender/20 active:from-mint-light/80 transition-all flex flex-col items-center gap-1"
              >
                <span className="text-warm-brown font-extrabold text-sm">从相册选择</span>
                <span className="text-warm-gray text-xs font-semibold">手机相册 / 文件</span>
              </button>
            </div>
          )}

          {uploadError && (
            <p className="text-red-600 text-xs font-semibold bg-red-50 rounded-2xl px-3 py-2">{uploadError}</p>
          )}

          {/* Three stock inputs */}
          <div className="flex flex-col gap-2">
            <span className="text-warm-brown font-bold text-sm">库存数量</span>
            {STOCK_FIELDS.map(f => (
              <div key={f.key} className="flex items-center gap-2">
                <span className={`text-xs font-black px-2 py-1 rounded-full ${f.bg} ${f.text} w-10 text-center flex-shrink-0`}>
                  {f.label}
                </span>
                <button
                  type="button"
                  onClick={() => set(f.key, Math.max(0, (parseInt(form[f.key]) || 0) - 1))}
                  className="w-10 h-10 rounded-full bg-sakura-light text-warm-brown font-black flex items-center justify-center btn-gummy active:bg-sakura transition-colors text-lg flex-shrink-0"
                >−</button>
                <input
                  type="number" min="0"
                  style={{ fontSize: '16px' }}
                  className="flex-1 border-2 border-butter-200 rounded-2xl px-2 py-2 text-warm-brown text-center font-black focus:outline-none focus:border-sakura transition-colors"
                  value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => set(f.key, (parseInt(form[f.key]) || 0) + 1)}
                  className="w-10 h-10 rounded-full bg-mint-light text-warm-brown font-black flex items-center justify-center btn-gummy active:bg-mint transition-colors text-lg flex-shrink-0"
                >+</button>
                <span className="text-warm-gray text-sm font-semibold w-4">件</span>
              </div>
            ))}
          </div>

          <input
            className="input-peppi"
            placeholder="到货预计文案（可留空）"
            value={form.arrival_note}
            onChange={e => set('arrival_note', e.target.value)}
          />

          <div className="flex gap-3 mt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-4 rounded-2xl border-2 border-butter-200 text-warm-gray font-bold active:bg-butter-100 transition-colors">
              取消
            </button>
            <button type="submit" disabled={loading || !form.name.trim()}
              className="flex-1 py-4 rounded-2xl bg-sakura text-white font-black btn-gummy active:bg-sakura-dark transition-colors disabled:opacity-50">
              {uploading ? '上传中...' : loading ? '添加中...' : '添加款式'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── SetupScreen ──────────────────────────────────────────────────────────────

function SetupScreen() {
  return (
    <div className="min-h-dvh bg-butter-100 flex items-center justify-center p-6 font-nunito">
      <div className="bg-white rounded-4xl shadow-soft-lg p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-warm-brown">Peppi 库存管理</h1>
          <p className="text-warm-gray text-sm font-semibold mt-1">还差一步就能用啦～</p>
        </div>
        <div className="bg-butter-100 rounded-3xl p-5 text-sm font-semibold text-warm-brown space-y-3">
          <p className="font-black text-base">配置 Supabase</p>
          <ol className="space-y-2 list-none">
            <li>① 前往 <span className="bg-white px-2 py-0.5 rounded-lg">supabase.com</span> 创建项目</li>
            <li>② 执行 <span className="bg-white px-2 py-0.5 rounded-lg">supabase/schema.sql</span> 建表</li>
            <li>③ 在项目根目录创建 <span className="bg-white px-2 py-0.5 rounded-lg">.env</span> 文件：</li>
          </ol>
          <pre className="bg-warm-brown text-butter-100 rounded-2xl p-4 text-xs overflow-auto leading-relaxed">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
          </pre>
          <li className="list-none">④ 重启开发服务器：<span className="bg-white px-2 py-0.5 rounded-lg">npm run dev</span></li>
        </div>
      </div>
    </div>
  )
}

// ─── BottomNav ────────────────────────────────────────────────────────────────

function BottomNav({ mode, setMode, onAdd }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-butter-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-end justify-around px-8 pt-2 pb-3 max-w-lg mx-auto">

        <button
          onClick={() => setMode('admin')}
          className="flex flex-col items-center gap-1 min-w-[72px] py-1 transition-colors"
        >
          <div className={`h-1 w-8 rounded-full transition-all duration-200 ${mode === 'admin' ? 'bg-warm-brown' : 'bg-transparent'}`} />
          <span className={`text-xs font-extrabold tracking-wide ${mode === 'admin' ? 'text-warm-brown' : 'text-warm-gray'}`}>
            库存
          </span>
        </button>

        <button
          onClick={onAdd}
          className="relative -translate-y-5 w-16 h-16 rounded-full bg-sakura text-white font-black text-3xl flex items-center justify-center btn-gummy active:bg-sakura-dark transition-colors"
        >
          ＋
        </button>

        <button
          onClick={() => setMode('share')}
          className="flex flex-col items-center gap-1 min-w-[72px] py-1 transition-colors"
        >
          <div className={`h-1 w-8 rounded-full transition-all duration-200 ${mode === 'share' ? 'bg-sakura-dark' : 'bg-transparent'}`} />
          <span className={`text-xs font-extrabold tracking-wide ${mode === 'share' ? 'text-sakura-dark' : 'text-warm-gray'}`}>
            分享
          </span>
        </button>

      </div>
    </nav>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [mode,     setMode]     = useState('admin')
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [showAdd,  setShowAdd]  = useState(false)
  const [toastMsg, setToastMsg] = useState(null)

  const fetchProducts = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from('products').select('*').order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setProducts(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!supabase) return
    fetchProducts()
    const channel = supabase
      .channel('peppi-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' },
        ({ eventType, new: nw, old: ol }) => {
          if (eventType === 'INSERT')       setProducts(p => [...p, nw])
          else if (eventType === 'UPDATE')  setProducts(p => p.map(x => x.id === nw.id ? nw : x))
          else if (eventType === 'DELETE')  setProducts(p => p.filter(x => x.id !== ol.id))
        })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchProducts])

  if (!isConfigured) return <SetupScreen />

  const toast = (msg, duration = 2200) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), duration)
  }

  const updateStockField = async (id, field, value) => {
    setProducts(p => p.map(x => x.id === id ? { ...x, [field]: value } : x))
    await supabase.from('products').update({ [field]: value }).eq('id', id)
  }

  const addProduct = async (product) => {
    const { error } = await supabase.from('products').insert([product])
    if (error) { toast('添加失败：' + error.message); return }
    setShowAdd(false)
    toast('新款式已添加！')
    fetchProducts()
  }

  const deleteProduct = async (id) => {
    if (!window.confirm('确定要删除这个款式吗？')) return
    setProducts(p => p.filter(x => x.id !== id))
    await supabase.from('products').delete().eq('id', id)
    toast('已删除')
  }

  const handleCopy = (product, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(product.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast('文案已复制，去发给客人吧～')
  }

  const loadDemo = async () => {
    const { error } = await supabase.from('products').insert(DEMO_PRODUCTS)
    if (error) toast(error.message)
    else toast('示例数据已加载！')
  }

  const copyAll = () => {
    const lines = products.map(p => {
      const stocks = STOCK_FIELDS
        .filter(f => (p[f.key] ?? 0) > 0)
        .map(f => `${f.label}${p[f.key]}件`)
        .join(' / ')
      return `${p.name} · ${stocks || '暂无库存'}${p.arrival_note ? ' · ' + p.arrival_note : ''}`
    })
    navigator.clipboard.writeText(['Peppi 今日库存播报', '', ...lines, '', 'Peppi 小团队'].join('\n'))
    toast('全部款式文案已复制！')
  }

  return (
    <div className="min-h-dvh bg-butter-100 font-nunito">

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-butter-200"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-4 py-3 flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-xl font-black text-warm-brown tracking-tight">Peppi</h1>
            <p className="text-[11px] text-warm-gray font-semibold -mt-0.5">a super cool lifestyle store</p>
          </div>
          <span className="text-xs font-extrabold text-warm-brown bg-butter-100 px-3 py-1.5 rounded-full">
            {products.length} 款
          </span>
        </div>
      </header>

      {/* ── Share banner ── */}
      {mode === 'share' && (
        <div className="bg-sakura-light border-b border-sakura/30 px-4 py-2.5">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-pink-800">分享模式 · 点击「复制文案」发给客人</p>
            <button
              onClick={copyAll}
              className="text-xs font-bold px-4 py-2 bg-white text-pink-800 rounded-xl border border-sakura/40 active:bg-sakura-light transition-colors flex-shrink-0"
            >
              复制全部
            </button>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="px-2 pt-3 pb-32 max-w-2xl mx-auto">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-warm-gray font-bold">正在加载 Peppi 宝贝们...</p>
          </div>

        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="text-center">
              <p className="text-warm-brown font-black text-xl">还没有款式哦</p>
              <p className="text-warm-gray text-sm font-semibold mt-1">点下方 + 添加第一个宝贝～</p>
            </div>
            {mode === 'admin' && (
              <button
                onClick={loadDemo}
                className="px-6 py-3 bg-butter-200 text-warm-brown rounded-2xl font-bold active:bg-butter-300 transition-colors"
              >
                加载示例数据
              </button>
            )}
          </div>

        ) : (
          <div className="grid grid-cols-2 gap-2">
            {products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                mode={mode}
                onUpdateStock={updateStockField}
                onCopy={handleCopy}
                onDelete={deleteProduct}
                copied={copiedId === p.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Bottom Nav ── */}
      <BottomNav mode={mode} setMode={setMode} onAdd={() => setShowAdd(true)} />

      {/* ── Add Modal ── */}
      {showAdd && (
        <AddProductModal onClose={() => setShowAdd(false)} onAdd={addProduct} />
      )}

      {/* ── Toast ── */}
      {toastMsg && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50
                        bg-warm-brown text-butter-100 px-5 py-3 rounded-2xl
                        shadow-soft-lg font-bold text-sm whitespace-nowrap animate-pop">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
