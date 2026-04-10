package com.fintrack.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {
  public record RegisterRequest(
      @jakarta.validation.constraints.Email @NotBlank String email,
      @NotBlank @Size(min = 8, max = 100) String password) {}

  public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

  public record AuthResponse(String accessToken) {}
}

