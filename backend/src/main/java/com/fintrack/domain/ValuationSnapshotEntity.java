package com.fintrack.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "valuation_snapshot")
public class ValuationSnapshotEntity {
  @Id private UUID id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private UserEntity user;

  @Column(name = "snapshot_date", nullable = false)
  private LocalDate snapshotDate;

  @ManyToOne(optional = true)
  @JoinColumn(name = "holding_id", nullable = true)
  private HoldingEntity holding;

  @Column(name = "assets_cents")
  private Long assetsCents;

  @Column(name = "pending_payables_cents")
  private Long pendingPayablesCents;

  @Column(name = "pending_receivables_cents")
  private Long pendingReceivablesCents;

  @Column(name = "net_worth_cents")
  private Long netWorthCents;

  @Column(name = "total_portfolio_value_cents")
  private Long totalPortfolioValueCents;

  @Column(name = "value_cents")
  private Long valueCents;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UserEntity getUser() {
    return user;
  }

  public void setUser(UserEntity user) {
    this.user = user;
  }

  public LocalDate getSnapshotDate() {
    return snapshotDate;
  }

  public void setSnapshotDate(LocalDate snapshotDate) {
    this.snapshotDate = snapshotDate;
  }

  public HoldingEntity getHolding() {
    return holding;
  }

  public void setHolding(HoldingEntity holding) {
    this.holding = holding;
  }

  public Long getAssetsCents() {
    return assetsCents;
  }

  public void setAssetsCents(Long assetsCents) {
    this.assetsCents = assetsCents;
  }

  public Long getPendingPayablesCents() {
    return pendingPayablesCents;
  }

  public void setPendingPayablesCents(Long pendingPayablesCents) {
    this.pendingPayablesCents = pendingPayablesCents;
  }

  public Long getPendingReceivablesCents() {
    return pendingReceivablesCents;
  }

  public void setPendingReceivablesCents(Long pendingReceivablesCents) {
    this.pendingReceivablesCents = pendingReceivablesCents;
  }

  public Long getNetWorthCents() {
    return netWorthCents;
  }

  public void setNetWorthCents(Long netWorthCents) {
    this.netWorthCents = netWorthCents;
  }

  public Long getTotalPortfolioValueCents() {
    return totalPortfolioValueCents;
  }

  public void setTotalPortfolioValueCents(Long totalPortfolioValueCents) {
    this.totalPortfolioValueCents = totalPortfolioValueCents;
  }

  public Long getValueCents() {
    return valueCents;
  }

  public void setValueCents(Long valueCents) {
    this.valueCents = valueCents;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}

