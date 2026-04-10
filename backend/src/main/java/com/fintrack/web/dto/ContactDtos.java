package com.fintrack.web.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;

public class ContactDtos {
  public record ContactResponse(UUID id, String name, Instant createdAt) {}

  public record CreateContactRequest(@NotBlank String name) {}
}