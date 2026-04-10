package com.fintrack.web.dto;

public class SummaryDtos {
  public record SummaryResponse(long incomeCents, long expenseCents, long netCents) {}
}

