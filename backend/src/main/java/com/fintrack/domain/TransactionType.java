package com.fintrack.domain;

public enum TransactionType {
  INCOME,
  EXPENSE,
  // Used as category "kind" in the wealth tracker UI.
  ASSET,
  PAYABLE,
  RECEIVABLE
}

