type TransactionExceptionType =
  | 'INVALID_AMOUNT'
  | 'ACCOUNT_NOT_FOUND'
  | 'INVALID_ACCOUNT_TYPE'
  | 'INSUFFICIENT_BALANCE'
  | 'SAME_ACCOUNT_TRANSFER'
  | 'INSUFFICIENT_FUNDS'
  | 'PENDING_TRANSACTION';

export class TransactionException extends Error {
  constructor(type: TransactionExceptionType, message: string, cause?: string) {
    super(message);
    this.name = type;
    this.cause = cause;
  }
}
