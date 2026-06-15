import apiClient from './apiClient';

export interface Account {
  id: number;
  accountNumber: string;
  balance: number;
  type: 'CHECKING' | 'SAVINGS';
  status: 'ACTIVE' | 'CLOSED';
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  description: string | null;
  fromAccountId: number | null;
  toAccountId: number | null;
  createdAt: string;
}

export interface AccountDetail extends Account {
  sentTransactions: Transaction[];
  receivedTransactions: Transaction[];
}

export const accountApi = {
  getAll: () =>
    apiClient.get<Account[]>('/accounts').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<AccountDetail>(`/accounts/${id}`).then((r) => r.data),

  create: (type: 'CHECKING' | 'SAVINGS') =>
    apiClient.post<Account>('/accounts', { type }).then((r) => r.data),

  close: (id: number) =>
    apiClient.delete<Account>(`/accounts/${id}`).then((r) => r.data),

  deposit: (id: number, amount: number) =>
    apiClient.post<Account>(`/accounts/${id}/deposit`, { amount }).then((r) => r.data),

  withdraw: (id: number, amount: number) =>
    apiClient.post<Account>(`/accounts/${id}/withdraw`, { amount }).then((r) => r.data),

  transfer: (id: number, toAccountNumber: string, amount: number, description?: string) =>
    apiClient
      .post<Account>(`/accounts/${id}/transfer`, { toAccountNumber, amount, description })
      .then((r) => r.data),
};
