package com.fintrack.web;

import com.fintrack.domain.TransactionType;
import com.fintrack.repo.TransactionRepo;
import com.fintrack.security.JwtPrincipal;
import com.fintrack.web.dto.SummaryDtos.SummaryResponse;
import java.time.LocalDate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class SummaryController {
  private final TransactionRepo transactionRepo;

  public SummaryController(TransactionRepo transactionRepo) {
    this.transactionRepo = transactionRepo;
  }

  @GetMapping("/summary")
  public SummaryResponse summary(
      Authentication auth, @RequestParam LocalDate from, @RequestParam LocalDate to) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    long income = transactionRepo.sumAmountCentsByTypeAndDateRange(p.userId(), TransactionType.INCOME, from, to);
    long expense = transactionRepo.sumAmountCentsByTypeAndDateRange(p.userId(), TransactionType.EXPENSE, from, to);
    return new SummaryResponse(income, expense, income - expense);
  }
}

