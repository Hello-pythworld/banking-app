import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountApi, AccountDetail, Transaction } from '../../api/accountApi';

type ModalType = 'deposit' | 'withdraw' | 'transfer' | null;

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalType>(null);

  useEffect(() => {
    loadAccount();
  }, [id]);

  async function loadAccount() {
    try {
      const data = await accountApi.getById(Number(id));
      setAccount(data);
    } catch {
      setError('계좌 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  async function handleClose() {
    if (!account) return;
    if (!confirm('계좌를 해지하시겠습니까? 잔액이 0원이어야 합니다.')) return;
    try {
      await accountApi.close(account.id);
      navigate('/accounts');
    } catch (err: any) {
      alert(err.response?.data?.message || '계좌 해지에 실패했습니다');
    }
  }

  const allTransactions: (Transaction & { direction: 'in' | 'out' })[] = account
    ? [
        ...account.sentTransactions.map((t) => ({ ...t, direction: 'out' as const })),
        ...account.receivedTransactions.map((t) => ({ ...t, direction: 'in' as const })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  if (loading) return <div style={styles.center}>불러오는 중...</div>;
  if (error || !account) return <div style={styles.center}>{error || '계좌를 찾을 수 없습니다'}</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/accounts')}>
          ← 내 계좌
        </button>
        <h1 style={styles.logo}>Banking App</h1>
      </header>

      <main style={styles.main}>
        <div style={styles.accountCard}>
          <div style={styles.accountCardTop}>
            <div>
              <p style={styles.accountTypeLabel}>
                {account.type === 'CHECKING' ? '입출금 계좌' : '저축 계좌'}
              </p>
              <p style={styles.accountNumber}>{account.accountNumber}</p>
            </div>
            <button style={styles.closeBtn} onClick={handleClose}>계좌 해지</button>
          </div>
          <p style={styles.balanceLabel}>잔액</p>
          <p style={styles.balance}>{account.balance.toLocaleString('ko-KR')}원</p>

          <div style={styles.actions}>
            <button style={styles.actionBtn} onClick={() => setModal('deposit')}>입금</button>
            <button style={styles.actionBtn} onClick={() => setModal('withdraw')}>출금</button>
            <button style={{ ...styles.actionBtn, ...styles.transferBtn }} onClick={() => setModal('transfer')}>이체</button>
          </div>
        </div>

        <div style={styles.transactionSection}>
          <h2 style={styles.sectionTitle}>거래 내역</h2>
          {allTransactions.length === 0 ? (
            <p style={styles.empty}>거래 내역이 없습니다</p>
          ) : (
            <ul style={styles.txList}>
              {allTransactions.map((tx) => (
                <li key={`${tx.direction}-${tx.id}`} style={styles.txItem}>
                  <div>
                    <span style={styles.txType}>
                      {tx.type === 'DEPOSIT' ? '입금' : tx.type === 'WITHDRAWAL' ? '출금' : '이체'}
                    </span>
                    <span style={styles.txDesc}>{tx.description}</span>
                    <span style={styles.txDate}>
                      {new Date(tx.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <span style={{ ...styles.txAmount, color: tx.direction === 'in' ? '#16a34a' : '#dc2626' }}>
                    {tx.direction === 'in' ? '+' : '-'}{tx.amount.toLocaleString('ko-KR')}원
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {modal && (
        <TransactionModal
          type={modal}
          accountId={account.id}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); loadAccount(); }}
        />
      )}
    </div>
  );
}

function TransactionModal({
  type, accountId, onClose, onDone
}: {
  type: ModalType;
  accountId: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const titles: Record<NonNullable<ModalType>, string> = {
    deposit: '입금', withdraw: '출금', transfer: '이체'
  };

  async function handleSubmit() {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) { setError('금액을 올바르게 입력해주세요'); return; }
    setLoading(true);
    setError('');
    try {
      if (type === 'deposit') await accountApi.deposit(accountId, numAmount);
      else if (type === 'withdraw') await accountApi.withdraw(accountId, numAmount);
      else if (type === 'transfer') {
        if (!toAccount) { setError('이체할 계좌번호를 입력해주세요'); setLoading(false); return; }
        await accountApi.transfer(accountId, toAccount, numAmount, description);
      }
      onDone();
    } catch (err: any) {
      setError(err.response?.data?.message || '처리에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>{titles[type!]}</h3>
        {error && <div style={styles.modalError}>{error}</div>}

        {type === 'transfer' && (
          <>
            <label style={styles.modalLabel}>받는 계좌번호</label>
            <input
              style={styles.modalInput}
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              placeholder="0000-0000-0000"
            />
          </>
        )}

        <label style={styles.modalLabel}>금액 (원)</label>
        <input
          style={styles.modalInput}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          min={1}
        />

        {type === 'transfer' && (
          <>
            <label style={styles.modalLabel}>메모 (선택)</label>
            <input
              style={styles.modalInput}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이체 메모"
            />
          </>
        )}

        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={onClose}>취소</button>
          <button style={styles.confirmBtn} onClick={handleSubmit} disabled={loading}>
            {loading ? '처리 중...' : titles[type!]}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#f0f4f8', fontFamily: 'sans-serif' },
  header: {
    background: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  logo: { color: '#1a56db', fontSize: '1.5rem', margin: 0 },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#1a56db', fontWeight: 600, fontSize: '0.95rem' },
  main: { maxWidth: '760px', margin: '0 auto', padding: '2rem 1rem' },
  accountCard: {
    background: 'linear-gradient(135deg, #1a56db, #3b82f6)',
    color: 'white',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '1.5rem',
  },
  accountCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  accountTypeLabel: { margin: '0 0 0.25rem', opacity: 0.85, fontSize: '0.9rem' },
  accountNumber: { margin: 0, fontSize: '1.1rem', letterSpacing: '0.05em' },
  closeBtn: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.375rem 0.875rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' },
  balanceLabel: { margin: '0 0 0.25rem', opacity: 0.85, fontSize: '0.9rem' },
  balance: { margin: '0 0 1.5rem', fontSize: '2.5rem', fontWeight: 700 },
  actions: { display: 'flex', gap: '0.75rem' },
  actionBtn: { flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' },
  transferBtn: { background: 'white', color: '#1a56db' },
  transactionSection: { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitle: { margin: '0 0 1rem', fontSize: '1.1rem', color: '#111827' },
  empty: { color: '#6b7280', textAlign: 'center', padding: '2rem 0' },
  txList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  txItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', border: '1px solid #f3f4f6', borderRadius: '10px' },
  txType: { fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginRight: '0.5rem' },
  txDesc: { color: '#6b7280', fontSize: '0.875rem', marginRight: '0.5rem' },
  txDate: { color: '#9ca3af', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' },
  txAmount: { fontWeight: 700, fontSize: '1rem' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '1rem', color: '#6b7280' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle: { margin: '0 0 1.25rem', fontSize: '1.2rem', color: '#111827' },
  modalError: { background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
  modalLabel: { fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.375rem' },
  modalInput: { width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', marginBottom: '1rem', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' },
  cancelBtn: { padding: '0.625rem 1.25rem', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#374151' },
  confirmBtn: { padding: '0.625rem 1.25rem', border: 'none', borderRadius: '8px', background: '#1a56db', color: 'white', fontWeight: 600, cursor: 'pointer' },
};
