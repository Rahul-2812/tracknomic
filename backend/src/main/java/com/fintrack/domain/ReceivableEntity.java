package com.fintrack.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import com.fintrack.domain.PaymentModeEntity;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "receivable")
public class ReceivableEntity {
  @Id private UUID id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private UserEntity user;

  @ManyToOne(optional = false)
  @JoinColumn(name = "category_id", nullable = false)
  private CategoryEntity category;

  @ManyToOne
  @JoinColumn(name = "contact_id")
  private ContactEntity contact;

  @ManyToOne
  @JoinColumn(name = "lent_mode_id")
  private PaymentModeEntity lentMode;

  @Column(name = "counterparty")
  private String counterparty;

  @Column(name = "amount_cents", nullable = false)
  private long amountCents;

  @Column(name = "expected_on", nullable = false)
  private LocalDate expectedOn;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private ReceivableStatus status;

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

  public UserEntity getUser() {
    return user;
  }

  public void setUser(UserEntity user) {
    this.user = user;
  }

  public CategoryEntity getCategory() {
    return category;
  }

  public void setCategory(CategoryEntity category) {
    this.category = category;
  }

  public ContactEntity getContact() {
    return contact;
  }

  public void setContact(ContactEntity contact) {
    this.contact = contact;
  }

  public String getCounterparty() {
    return counterparty;
  }

  public void setCounterparty(String counterparty) {
    this.counterparty = counterparty;
  }

  public long getAmountCents() {
    return amountCents;
  }

  public void setAmountCents(long amountCents) {
    this.amountCents = amountCents;
  }

  public LocalDate getExpectedOn() {
    return expectedOn;
  }

  public void setExpectedOn(LocalDate expectedOn) {
    this.expectedOn = expectedOn;
  }

  public ReceivableStatus getStatus() {
    return status;
  }

  public void setStatus(ReceivableStatus status) {
    this.status = status;
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

  public PaymentModeEntity getLentMode() {
    return lentMode;
  }

  public void setLentMode(PaymentModeEntity lentMode) {
    this.lentMode = lentMode;
  }
}

