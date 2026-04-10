package com.fintrack.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "payable_payment")
public class PayablePaymentEntity {
  @Id
  private UUID id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "payable_id", nullable = false)
  private PayableEntity payable;

  @ManyToOne(optional = false)
  @JoinColumn(name = "payment_mode_id", nullable = false)
  private PaymentModeEntity paymentMode;

  @Column(name = "amount_cents", nullable = false)
  private long amountCents;

  @Column(name = "payment_date", nullable = false)
  private LocalDate paymentDate;

  @Column(name = "note")
  private String note;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public PayableEntity getPayable() {
    return payable;
  }

  public void setPayable(PayableEntity payable) {
    this.payable = payable;
  }

  public PaymentModeEntity getPaymentMode() {
    return paymentMode;
  }

  public void setPaymentMode(PaymentModeEntity paymentMode) {
    this.paymentMode = paymentMode;
  }

  public long getAmountCents() {
    return amountCents;
  }

  public void setAmountCents(long amountCents) {
    this.amountCents = amountCents;
  }

  public LocalDate getPaymentDate() {
    return paymentDate;
  }

  public void setPaymentDate(LocalDate paymentDate) {
    this.paymentDate = paymentDate;
  }

  public String getNote() {
    return note;
  }

  public void setNote(String note) {
    this.note = note;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
