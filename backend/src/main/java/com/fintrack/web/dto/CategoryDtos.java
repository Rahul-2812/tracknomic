package com.fintrack.web.dto;

import com.fintrack.domain.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class CategoryDtos {
  public record CategoryResponse(UUID id, String name, TransactionType type) {}

  public record CreateCategoryRequest(@NotBlank String name, @NotNull TransactionType type) {}
}

