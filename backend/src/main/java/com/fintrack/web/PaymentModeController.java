package com.fintrack.web;

import com.fintrack.domain.PaymentModeEntity;
import com.fintrack.repo.PaymentModeRepo;
import com.fintrack.repo.UserRepo;
import com.fintrack.security.JwtPrincipal;
import com.fintrack.web.dto.PaymentModeDtos.CreatePaymentModeRequest;
import com.fintrack.web.dto.PaymentModeDtos.PaymentModeResponse;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payment-modes")
public class PaymentModeController {
  private final PaymentModeRepo paymentModeRepo;
  private final UserRepo userRepo;

  public PaymentModeController(PaymentModeRepo paymentModeRepo, UserRepo userRepo) {
    this.paymentModeRepo = paymentModeRepo;
    this.userRepo = userRepo;
  }

  @GetMapping
  public List<PaymentModeResponse> list(Authentication auth) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    return paymentModeRepo.findAllByUser_IdOrderByNameAsc(p.userId()).stream()
        .map(mode -> new PaymentModeResponse(mode.getId(), mode.getName(), mode.getCreatedAt()))
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public PaymentModeResponse create(Authentication auth, @Valid @RequestBody CreatePaymentModeRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    String name = req.name().trim();
    if (name.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment mode name is required");
    }
    if (paymentModeRepo.existsByUser_IdAndNameIgnoreCase(p.userId(), name)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment mode already exists");
    }

    var user =
        userRepo.findById(p.userId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));

    PaymentModeEntity mode = new PaymentModeEntity();
    mode.setId(UUID.randomUUID());
    mode.setUser(user);
    mode.setName(name);
    mode.setCreatedAt(Instant.now());
    paymentModeRepo.save(mode);

    return new PaymentModeResponse(mode.getId(), mode.getName(), mode.getCreatedAt());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(Authentication auth, @PathVariable UUID id) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    PaymentModeEntity mode =
        paymentModeRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment mode not found"));
    if (!mode.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment mode not found");
    }
    try {
      paymentModeRepo.delete(mode);
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment mode is in use and cannot be deleted");
    }
  }
}
