package com.fintrack.web.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;

public class PlatformDtos {
  public record PlatformResponse(UUID id, String name, Instant createdAt) {}

  public record CreatePlatformRequest(@NotBlank String name) {}
}

