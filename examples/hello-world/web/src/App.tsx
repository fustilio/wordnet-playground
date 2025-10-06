import { useState } from 'react';
import { useWordNetContext } from 'wn-react';

export default function App() {
  const { querySynsets, loading, error } = useWordNetContext();
  const [results, setResults] = useState<any[]>([]);

  const search = async () => {
    const synsets = await querySynsets('computer');
    setResults(synsets);
  };

  if (loading) return <div>Loading WordNet...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>WordNet Hello World</h1>
      <button onClick={search} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Search "computer"
      </button>
      <div style={{ marginTop: '20px' }}>
        {results.map((s, i) => (
          <div key={i} style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5' }}>
            <strong>{s.id}</strong> ({s.pos})<br />
            {s.definitions?.[0]?.text || 'No definition'}
          </div>
        ))}
      </div>
    </div>
  );
}

