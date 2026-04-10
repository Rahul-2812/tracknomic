package com.fintrack.domain;

public final class SettlementSupport {
  private SettlementSupport() {}

  public static long payableSettledCents(PayableEntity entity, long paymentCents) {
    return settledCents(entity.getAmountCents(), entity.getStatus() == null ? null : entity.getStatus().name(), paymentCents);
  }

  public static long receivableSettledCents(ReceivableEntity entity, long paymentCents) {
    return settledCents(entity.getAmountCents(), entity.getStatus() == null ? null : entity.getStatus().name(), paymentCents);
  }

  public static long outstandingCents(long totalCents, long settledCents) {
    return Math.max(0, totalCents - Math.max(0, Math.min(totalCents, settledCents)));
  }

  public static PayableStatus payableStatus(long totalCents, long settledCents) {
    if (settledCents <= 0) {
      return PayableStatus.PENDING;
    }
    if (settledCents >= totalCents) {
      return PayableStatus.PAID;
    }
    return PayableStatus.PARTIAL;
  }

  public static ReceivableStatus receivableStatus(long totalCents, long settledCents) {
    if (settledCents <= 0) {
      return ReceivableStatus.PENDING;
    }
    if (settledCents >= totalCents) {
      return ReceivableStatus.PAID;
    }
    return ReceivableStatus.PARTIAL;
  }

  private static long settledCents(long totalCents, String storedStatus, long paymentCents) {
    long normalizedPayments = Math.max(0, Math.min(totalCents, paymentCents));
    if (normalizedPayments > 0) {
      return normalizedPayments;
    }
    if ("PAID".equals(storedStatus) || "RECEIVED".equals(storedStatus)) {
      return totalCents;
    }
    return 0;
  }
}
