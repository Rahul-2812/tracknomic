package com.fintrack.domain;

import java.util.Objects;

public record Money(long cents) {
  public Money {
    if (cents <= 0) {
      throw new IllegalArgumentException("cents must be > 0");
    }
  }

  public static Money ofCents(long cents) {
    return new Money(cents);
  }

  @Override
  public String toString() {
    return Objects.toString(cents);
  }
}

