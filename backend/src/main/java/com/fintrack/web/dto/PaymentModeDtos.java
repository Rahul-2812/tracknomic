package com.fintrack.web.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;

public class PaymentModeDtos {
  public record PaymentModeResponse(UUID id, String name, Instant createdAt) {}

  public record CreatePaymentModeRequest(@NotBlank String name) {}
}
