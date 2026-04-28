export default function ViewToggle({ mode, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '.25rem', background: 'var(--gris-200)', borderRadius: 8, padding: 3 }}>
      <button
        title="Vista tarjetas"
        onClick={() => onChange('cards')}
        style={{
          border: 'none', cursor: 'pointer', borderRadius: 6,
          padding: '.35rem .6rem', fontSize: '1rem', lineHeight: 1,
          background: mode === 'cards' ? 'var(--blanco)' : 'transparent',
          boxShadow: mode === 'cards' ? 'var(--sombra-sm)' : 'none',
          color: mode === 'cards' ? 'var(--verde-700)' : 'var(--gris-500)',
          transition: 'all .15s ease',
        }}
      >⊞</button>
      <button
        title="Vista lista"
        onClick={() => onChange('lista')}
        style={{
          border: 'none', cursor: 'pointer', borderRadius: 6,
          padding: '.35rem .6rem', fontSize: '1rem', lineHeight: 1,
          background: mode === 'lista' ? 'var(--blanco)' : 'transparent',
          boxShadow: mode === 'lista' ? 'var(--sombra-sm)' : 'none',
          color: mode === 'lista' ? 'var(--verde-700)' : 'var(--gris-500)',
          transition: 'all .15s ease',
        }}
      >☰</button>
    </div>
  );
}
