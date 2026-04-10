package com.fintrack.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
public class UserSettingsEntity {
  @Id private UUID userId;

  @Column(name = "summary_recipient_email", nullable = false)
  private String summaryRecipientEmail;

  @Column(name = "assets_categories_enabled", nullable = false)
  private boolean assetsCategoriesEnabled;

  @Column(name = "payables_categories_enabled", nullable = false)
  private boolean payablesCategoriesEnabled;

  @Column(name = "receivables_categories_enabled", nullable = false)
  private boolean receivablesCategoriesEnabled;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getSummaryRecipientEmail() {
    return summaryRecipientEmail;
  }

  public void setSummaryRecipientEmail(String summaryRecipientEmail) {
    this.summaryRecipientEmail = summaryRecipientEmail;
  }

  public boolean isAssetsCategoriesEnabled() {
    return assetsCategoriesEnabled;
  }

  public void setAssetsCategoriesEnabled(boolean assetsCategoriesEnabled) {
    this.assetsCategoriesEnabled = assetsCategoriesEnabled;
  }

  public boolean isPayablesCategoriesEnabled() {
    return payablesCategoriesEnabled;
  }

  public void setPayablesCategoriesEnabled(boolean payablesCategoriesEnabled) {
    this.payablesCategoriesEnabled = payablesCategoriesEnabled;
  }

  public boolean isReceivablesCategoriesEnabled() {
    return receivablesCategoriesEnabled;
  }

  public void setReceivablesCategoriesEnabled(boolean receivablesCategoriesEnabled) {
    this.receivablesCategoriesEnabled = receivablesCategoriesEnabled;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}

