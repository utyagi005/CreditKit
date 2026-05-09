import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';

export function MemoPage() {
  const { id } = useParams();
  const [md, setMd] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [rec, setRec] = useState<'approve' | 'hold' | 'pass'>('hold');
  const [err, setErr] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    api
      .memoPreview({ opportunityId: id, analystNotes: notes, recommendation: rec })
      .then((r) => setMd(r.markdown))
      .catch((e: Error) => setErr(e.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, [id]);

  if (!id) return <p className="text-warn">Missing opportunity id</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="font-display text-2xl font-semibold text-white">Investment memo preview</h1>
        <Link to={`/opportunities/${id}`} className="text-sm text-accent hover:underline">
          Back to analysis
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <label className="md:col-span-2 block text-sm">
          <span className="text-ink-500">Analyst notes</span>
          <textarea
            className="mt-1 w-full rounded-md bg-ink-900 border border-ink-700 p-3 text-mist min-h-[100px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-500">Recommendation</span>
          <select
            className="mt-1 w-full rounded-md bg-ink-900 border border-ink-700 p-3 text-mist"
            value={rec}
            onChange={(e) => setRec(e.target.value as typeof rec)}
          >
            <option value="approve">Approve</option>
            <option value="hold">Hold</option>
            <option value="pass">Pass</option>
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={load}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
      >
        Regenerate memo
      </button>

      {err && <p className="text-warn text-sm">{err}</p>}

      {md && (
        <article className="rounded-xl border border-ink-700 bg-ink-900 p-6 max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm text-mist bg-transparent p-0 m-0">{md}</pre>
        </article>
      )}
    </div>
  );
}
