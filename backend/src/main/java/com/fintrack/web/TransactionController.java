package com.fintrack.web;

import com.fintrack.domain.TransactionEntity;
import com.fintrack.repo.CategoryRepo;
import com.fintrack.repo.TransactionRepo;
import com.fintrack.repo.UserRepo;
import com.fintrack.security.JwtPrincipal;
import com.fintrack.web.dto.TransactionDtos.CreateTransactionRequest;
import com.fintrack.web.dto.TransactionDtos.TransactionResponse;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
  private final TransactionRepo transactionRepo;
  private final CategoryRepo categoryRepo;
  private final UserRepo userRepo;

  public TransactionController(
      TransactionRepo transactionRepo, CategoryRepo categoryRepo, UserRepo userRepo) {
    this.transactionRepo = transactionRepo;
    this.categoryRepo = categoryRepo;
    this.userRepo = userRepo;
  }

  @GetMapping
  public List<TransactionResponse> list(
      Authentication auth,
      @RequestParam LocalDate from,
      @RequestParam LocalDate to) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    return transactionRepo
        .findAllByUser_IdAndOccurredOnBetweenOrderByOccurredOnDescCreatedAtDesc(p.userId(), from, to)
        .stream()
        .map(
            t ->
                new TransactionResponse(
                    t.getId(),
                    t.getType(),
                    t.getAmountCents(),
                    t.getOccurredOn(),
                    t.getNote(),
                    t.getCategory() == null ? null : t.getCategory().getId(),
                    t.getCategory() == null ? null : t.getCategory().getName()))
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public TransactionResponse create(
      Authentication auth, @Valid @RequestBody CreateTransactionRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    var user =
        userRepo.findById(p.userId()).orElseThrow(() -> new IllegalArgumentException("User not found"));

    var t = new TransactionEntity();
    t.setId(UUID.randomUUID());
    t.setUser(user);
    t.setType(req.type());
    t.setAmountCents(req.amountCents());
    t.setOccurredOn(req.occurredOn());
    t.setNote(req.note());
    t.setCreatedAt(Instant.now());

    if (req.categoryId() != null) {
      var category =
          categoryRepo
              .findById(req.categoryId())
              .orElseThrow(() -> new IllegalArgumentException("Category not found"));
      if (!category.getUser().getId().equals(p.userId())) {
        throw new IllegalArgumentException("Category does not belong to user");
      }
      t.setCategory(category);
    }

    transactionRepo.save(t);
    return new TransactionResponse(
        t.getId(),
        t.getType(),
        t.getAmountCents(),
        t.getOccurredOn(),
        t.getNote(),
        t.getCategory() == null ? null : t.getCategory().getId(),
        t.getCategory() == null ? null : t.getCategory().getName());
  }
}

