import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [challenger, setChallenger] = useState('');
  const [opponent, setOpponent] = useState('');
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState('');

  // Protect page
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) return;
    if (session.user?.email !== 'raghavkshyp@gmail.com') {
      router.replace('/');
    }
  }, [session, status, router]);

  // Fetch players
  useEffect(() => {
    fetch('/api/user/list')
      .then(r => r.json())
      .then(data => setPlayers(data.users || []));
  }, []);

  // Fetch matches
  const fetchMatches = () => {
    fetch('/api/admin/matches').then(r => r.json()).then(setMatches);
  };
  useEffect(() => { fetchMatches(); }, []);

  // Send challenge
  const sendChallenge = async () => {
    setLoading(true);
    const res = await fetch('/api/match/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenger, opponent })
    });
    setLoading(false);
    setLog('Challenge sent!');
    fetchMatches();
  };

  // Match actions
  const matchAction = async (matchId: string, action: string, extra: any = {}) => {
    setLoading(true);
    let url = '';
    let body = { matchId, ...extra };
    if (action === 'accept') url = '/api/match/accept';
    if (action === 'submitScore') url = '/api/match/submit-score';
    if (action === 'verify') url = '/api/match/verify';
    if (action === 'dispute') url = '/api/match/dispute';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    setLoading(false);
    setLog(`${action} complete!`);
    fetchMatches();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Match Dashboard</h1>
      <div className="mb-6 p-4 bg-zinc-800 rounded">
        <h2 className="font-semibold mb-2">Send Challenge</h2>
        <div className="flex gap-2 mb-2">
          <select className="bg-zinc-900 text-white p-2 rounded" value={challenger} onChange={e => setChallenger(e.target.value)}>
            <option value="">Challenger</option>
            {players.map(p => <option key={p.email} value={p.email}>{p.username || p.email}</option>)}
          </select>
          <select className="bg-zinc-900 text-white p-2 rounded" value={opponent} onChange={e => setOpponent(e.target.value)}>
            <option value="">Opponent</option>
            {players.map(p => <option key={p.email} value={p.email}>{p.username || p.email}</option>)}
          </select>
          <button className="bg-primary text-white px-4 py-2 rounded" onClick={sendChallenge} disabled={loading || !challenger || !opponent || challenger === opponent}>Send Challenge</button>
        </div>
        {log && <div className="text-green-400 text-sm mt-2">{log}</div>}
      </div>
      <div className="bg-zinc-800 rounded p-4">
        <h2 className="font-semibold mb-2">Matches</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-400">
              <th>Challenger</th>
              <th>Opponent</th>
              <th>Status</th>
              <th>Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m: any) => (
              <tr key={m._id} className="border-b border-zinc-700">
                <td>{m.challenger?.username || m.challenger}</td>
                <td>{m.opponent?.username || m.opponent}</td>
                <td>{m.status}</td>
                <td>{m.score ? `${m.score.challenger} - ${m.score.opponent}` : '-'}</td>
                <td className="flex gap-1">
                  <button className="bg-blue-700 text-white px-2 py-1 rounded" onClick={() => matchAction(m._id, 'accept')} disabled={loading || m.status !== 'pending'}>Accept</button>
                  <button className="bg-yellow-700 text-white px-2 py-1 rounded" onClick={() => matchAction(m._id, 'submitScore', { score: { challenger: 21, opponent: 15 } })} disabled={loading || m.status !== 'pending'}>Submit Score</button>
                  <button className="bg-green-700 text-white px-2 py-1 rounded" onClick={() => matchAction(m._id, 'verify')} disabled={loading || m.status !== 'pending'}>Verify</button>
                  <button className="bg-red-700 text-white px-2 py-1 rounded" onClick={() => matchAction(m._id, 'dispute')} disabled={loading || m.status !== 'pending'}>Dispute</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 