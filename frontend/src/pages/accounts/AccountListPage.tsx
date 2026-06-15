import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { accountApi, Account } from '../../api/accountApi';
import { useAuthStore } from '../../store/authStore';

export default function AccountListPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const data = await accountApi.getAll();
      setAccounts(data);
    } catch {
      setError('계좌 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Banking App</h1>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user?.name || '사용자'}님</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>총 자산</p>
          <p style={styles.summaryAmount}>{totalBalance.toLocaleString('ko-KR')}원</p>
          <p style={styles.summaryCount}>계좌 {accounts.length}개</p>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>내 계좌</h2>
            <button style={styles.createBtn} onClick={() => setShowCreateModal(true)}>
              + 계좌 개설
            </button>
          </div>

          {loading && <p style={styles.center}>불러오는 중...</p>}
          {error && <p style={styles.errorText}>{error}</p>}

          {!loading && accounts.length === 0 && (
            <div style={styles.emptyState}>
              <p>등록된 계좌가 없습니다.</p>
              <button style={styles.createBtn} onClick={() => setShowCreateModal(true)}>
                첫 계좌 개설하기
              </button>
            </div>
          )}

          <div style={styles.accountGrid}>
            {accounts.map((account) => (
              <Link key={account.id} to={`/accounts/${account.id}`} style={styles.accountCard}>
                <div style={styles.accountCardTop}>
                  <span style={styles.accountType}>
                    {account.type === 'CHECKING' ? '입출금 계좌' : '저축 계좌'}
                  </span>
                  <span style={styles.accountStatus}>활성</span>
                </div>
                <p style={styles.accountNumber}>{account.accountNumber}</p>
                <p style={styles.accountBalance}>
                  {account.balance.toLocaleString('ko-KR')}원
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadAccounts(); }}
        />
      )}
    </div>
  );
}

function CreateAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState<'CHECKING' | 'SAVINGS'>('CHECKING');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    setLoading(true);
    setError('');
    try {
      await accountApi.create(type);
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || '계좌 개설에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>새 계좌 개설</h3>
        {error && <div style={styles.modalError}>{error}</div>}
        <div style={styles.typeSelector}>
          <button
            style={{ ...styles.typeBtn, ...(type === 'CHECKING' ? styles.typeBtnActive : {}) }}
            onClick={() => setType('CHECKING')}
          >
            <strong>입출금 계좌</strong>
            <small>자유롭게 입출금 가능</small>
          </button>
          <button
            style={{ ...styles.typeBtn, ...(type === 'SAVINGS' ? styles.typeBtnActive : {}) }}
            onClick={() => setType('SAVINGS')}
          >
            <strong>저축 계좌</strong>
            <small>목돈 모으기에 적합</small>
          </button>
        </div>
        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={onClose}>취소</button>
          <button style={styles.confirmBtn} onClick={handleCreate} disabled={loading}>
            {loading ? '개설 중...' : '개설하기'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  logo: { color: '#1a56db', fontSize: '1.5rem', margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userName: { color: '#374151', fontWeight: 600 },
  logoutBtn: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  main: { maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' },
  summaryCard: {
    background: 'linear-gradient(135deg, #1a56db, #3b82f6)',
    color: 'white',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem',
  },
  summaryLabel: { margin: '0 0 0.5rem', opacity: 0.85, fontSize: '0.95rem' },
  summaryAmount: { margin: '0 0 0.25rem', fontSize: '2.5rem', fontWeight: 700 },
  summaryCount: { margin: 0, opacity: 0.75, fontSize: '0.875rem' },
  section: { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  sectionTitle: { margin: 0, fontSize: '1.2rem', color: '#111827' },
  createBtn: {
    padding: '0.5rem 1.25rem',
    background: '#1a56db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  accountGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' },
  accountCard: {
    display: 'block',
    padding: '1.25rem',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'box-shadow 0.2s',
    cursor: 'pointer',
  },
  accountCardTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' },
  accountType: {
    fontSize: '0.8rem',
    background: '#eff6ff',
    color: '#1a56db',
    padding: '0.25rem 0.625rem',
    borderRadius: '999px',
    fontWeight: 600,
  },
  accountStatus: { fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 },
  accountNumber: { color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.75rem' },
  accountBalance: { fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 },
  center: { textAlign: 'center', color: '#6b7280' },
  errorText: { color: '#dc2626', textAlign: 'center' },
  emptyState: { textAlign: 'center', padding: '3rem', color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: 'white', borderRadius: '16px', padding: '2rem',
    width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalTitle: { margin: '0 0 1.25rem', fontSize: '1.2rem', color: '#111827' },
  modalError: { background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
  typeSelector: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' },
  typeBtn: {
    padding: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    background: 'white',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    textAlign: 'left',
  },
  typeBtnActive: { borderColor: '#1a56db', background: '#eff6ff' },
  modalActions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' },
  cancelBtn: { padding: '0.625rem 1.25rem', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#374151' },
  confirmBtn: { padding: '0.625rem 1.25rem', border: 'none', borderRadius: '8px', background: '#1a56db', color: 'white', fontWeight: 600, cursor: 'pointer' },
};
