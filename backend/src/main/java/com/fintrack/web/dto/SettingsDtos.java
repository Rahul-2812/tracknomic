package com.fintrack.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public class SettingsDtos {
  public record SettingsResponse(
      java.util.UUID userId,
      @Email String summaryRecipientEmail,
      boolean assetsCategoriesEnabled,
      boolean payablesCategoriesEnabled,
      boolean receivablesCategoriesEnabled,
      Instant createdAt) {}

  public record UpdateSettingsRequest(
      @NotNull @Email String summaryRecipientEmail,
      boolean assetsCategoriesEnabled,
      boolean payablesCategoriesEnabled,
      boolean receivablesCategoriesEnabled) {}
}

