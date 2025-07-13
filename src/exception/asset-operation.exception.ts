type AssetOperationExceptionType =
  | 'ASSET_NOT_FOUND'
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_ACCOUNT_TYPE'
  | 'INVESTMENT_ACCOUNT_NOT_FOUND'
  | 'INSUFFICIENT_ASSET_QUANTITY'
  | 'INVALID_QUANTITY'
  | 'PENDING_TRANSACTION';

export class AssetOperationException extends Error {
  constructor(
    type: AssetOperationExceptionType,
    message: string,
    cause?: string,
  ) {
    super(message);
    this.name = type;
    this.cause = cause;
  }
}
