package com.fintrack.web.dto;

import com.fintrack.domain.TransactionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public class TransactionDtos {
  public record TransactionResponse(
      UUID id,
      TransactionType type,
      long amountCents,
      LocalDate occurredOn,
      String note,
      UUID categoryId,
      String categoryName) {}

  public record CreateTransactionRequest(
      @NotNull TransactionType type,
      @Min(1) long amountCents,
      @NotNull LocalDate occurredOn,
      String note,
      UUID categoryId) {}
}

