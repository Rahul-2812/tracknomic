package com.fintrack.web.dto;

import com.fintrack.domain.TransactionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class WealthDtos {
  public record CategoryTotal(UUID categoryId, String categoryName, long totalCents) {}

  public record PerformancePoint(LocalDate date, long totalPortfolioValueCents) {}

  public record DashboardResponse(
      long assetsCents,
      long pendingPayablesCents,
      long pendingReceivablesCents,
      long netWorthCents,
      List<CategoryTotal> assetsByCategory,
      List<CategoryTotal> payablesByCategory,
      List<CategoryTotal> receivablesByCategory,
      List<PerformancePoint> performance) {}

  public record CreateHoldingRequest(
      @NotNull UUID categoryId,
      @NotNull String name,
      String platform,
      @Min(1) long amountCents,
      Long marketValueCents,
      String note) {}

  public record HoldingResponse(
      UUID id,
      UUID categoryId,
      String categoryName,
      String name,
      String platform,
      long amountCents,
      Long marketValueCents,
      String note,
      Instant createdAt) {}

  public record UpdateHoldingRequest(
      @NotNull UUID categoryId,
      @NotNull String name,
      String platform,
      @Min(1) long amountCents,
      Long marketValueCents,
      String note) {}

  public record CreatePayableRequest(
      @NotNull UUID categoryId,
      @NotNull UUID contactId,
      @Min(1) long amountCents,
      @NotNull LocalDate dueDate,
      String note) {}

  public record CreateSettlementRequest(
      @Min(1) long amountCents, @NotNull LocalDate paymentDate, @NotNull UUID paymentModeId, String note) {}

  public record UpdatePayableRequest(
      @NotNull UUID categoryId,
      @NotNull UUID contactId,
      @Min(1) long amountCents,
      @NotNull LocalDate dueDate,
      String note) {}

  public record UpdatePayableStatusRequest(@NotNull String status) {}

  public record SettlementResponse(
      UUID id,
      long amountCents,
      LocalDate paymentDate,
      UUID paymentModeId,
      String paymentModeName,
      String note,
      Instant createdAt) {}

  public record PayableResponse(
      UUID id,
      UUID categoryId,
      String categoryName,
      UUID contactId,
      String contactName,
      long amountCents,
      long paidCents,
      long outstandingCents,
      LocalDate dueDate,
      String status,
      String note,
      Instant createdAt,
      List<SettlementResponse> payments) {}

  public record CreateReceivableRequest(
      @NotNull UUID categoryId,
      UUID contactId,
      @Min(1) long amountCents,
      @NotNull LocalDate expectedOn,
      UUID lentModeId,
      String note) {}

  public record UpdateReceivableRequest(
      @NotNull UUID categoryId,
      UUID contactId,
      @Min(1) long amountCents,
      @NotNull LocalDate expectedOn,
      UUID lentModeId,
      String note) {}

  public record UpdateReceivableStatusRequest(@NotNull String status) {}

  public record ReceivableResponse(
      UUID id,
      UUID categoryId,
      String categoryName,
      UUID contactId,
      String contactName,
      long amountCents,
      long receivedCents,
      long outstandingCents,
      UUID lentModeId,
      String lentModeName,
      LocalDate expectedOn,
      String status,
      String note,
      Instant createdAt,
      List<SettlementResponse> payments) {}

  public record CreateValuationSnapshotRequest(@NotNull LocalDate snapshotDate) {}

  public record ValuationSnapshotResponse(
      UUID id,
      LocalDate snapshotDate,
      Long assetsCents,
      Long pendingPayablesCents,
      Long pendingReceivablesCents,
      Long netWorthCents,
      Long totalPortfolioValueCents,
      Instant createdAt) {}

  public record SendDashboardEmailRequest(
      @NotNull LocalDate from, @NotNull LocalDate to, String emailTo) {}

  public record SendDashboardEmailResponse(String message) {}
}

