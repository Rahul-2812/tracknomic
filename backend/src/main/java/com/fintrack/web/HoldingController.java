package com.fintrack.web;

import com.fintrack.domain.HoldingEntity;
import com.fintrack.domain.TransactionType;
import com.fintrack.domain.CategoryEntity;
import com.fintrack.repo.CategoryRepo;
import com.fintrack.repo.HoldingRepo;
import com.fintrack.repo.PlatformRepo;
import com.fintrack.repo.UserRepo;
import com.fintrack.security.JwtPrincipal;
import com.fintrack.web.dto.WealthDtos.CreateHoldingRequest;
import com.fintrack.web.dto.WealthDtos.HoldingResponse;
import com.fintrack.web.dto.WealthDtos.UpdateHoldingRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/holdings")
public class HoldingController {
  private final HoldingRepo holdingRepo;
  private final CategoryRepo categoryRepo;
  private final PlatformRepo platformRepo;
  private final UserRepo userRepo;

  public HoldingController(
      HoldingRepo holdingRepo, CategoryRepo categoryRepo, PlatformRepo platformRepo, UserRepo userRepo) {
    this.holdingRepo = holdingRepo;
    this.categoryRepo = categoryRepo;
    this.platformRepo = platformRepo;
    this.userRepo = userRepo;
  }

  @GetMapping
  public List<HoldingResponse> list(Authentication auth) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    return holdingRepo.findAllByUser_IdOrderByCreatedAtDesc(p.userId()).stream()
        .map(
            h ->
                new HoldingResponse(
                    h.getId(),
                    h.getCategory().getId(),
                    h.getCategory().getName(),
                    h.getName(),
                    h.getPlatform(),
                    h.getAmountCents(),
                    h.getMarketValueCents(),
                    h.getNote(),
                    h.getCreatedAt()))
        .toList();
  }

  @PostMapping
  @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
  public HoldingResponse create(
      Authentication auth, @Valid @RequestBody CreateHoldingRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();

    var user =
        userRepo.findById(p.userId()).orElseThrow(() -> new IllegalArgumentException("User not found"));

    CategoryEntity category =
        categoryRepo
            .findById(req.categoryId())
            .orElseThrow(() -> new IllegalArgumentException("Category not found"));

    if (!category.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category does not belong to user");
    }
    if (category.getType() != TransactionType.ASSET) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category must be of type ASSET");
    }

    if (req.platform() != null && !req.platform().trim().isEmpty()) {
      if (!platformRepo.existsByUser_IdAndNameIgnoreCase(p.userId(), req.platform().trim())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown platform. Add it in Settings first.");
      }
    }

    HoldingEntity h = new HoldingEntity();
    h.setId(UUID.randomUUID());
    h.setUser(user);
    h.setCategory(category);
    h.setName(req.name().trim());
    h.setPlatform(req.platform() == null ? null : req.platform().trim());
    h.setNote(req.note());
    h.setAmountCents(req.amountCents());
    h.setMarketValueCents(req.marketValueCents());
    h.setCreatedAt(Instant.now());

    holdingRepo.save(h);

    return new HoldingResponse(
        h.getId(),
        h.getCategory().getId(),
        h.getCategory().getName(),
        h.getName(),
        h.getPlatform(),
        h.getAmountCents(),
        h.getMarketValueCents(),
        h.getNote(),
        h.getCreatedAt());
  }

  @PutMapping("/{id}")
  public HoldingResponse update(
      Authentication auth, @PathVariable UUID id, @Valid @RequestBody UpdateHoldingRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    HoldingEntity h =
        holdingRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Holding not found"));
    if (!h.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Holding not found");
    }

    CategoryEntity category =
        categoryRepo
            .findById(req.categoryId())
            .orElseThrow(() -> new IllegalArgumentException("Category not found"));
    if (!category.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category does not belong to user");
    }
    if (category.getType() != TransactionType.ASSET) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category must be of type ASSET");
    }

    if (req.platform() != null && !req.platform().trim().isEmpty()) {
      if (!platformRepo.existsByUser_IdAndNameIgnoreCase(p.userId(), req.platform().trim())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown platform. Add it in Settings first.");
      }
    }

    h.setCategory(category);
    h.setName(req.name().trim());
    h.setPlatform(req.platform() == null ? null : req.platform().trim());
    h.setNote(req.note());
    h.setAmountCents(req.amountCents());
    h.setMarketValueCents(req.marketValueCents());

    holdingRepo.save(h);

    return new HoldingResponse(
        h.getId(),
        h.getCategory().getId(),
        h.getCategory().getName(),
        h.getName(),
        h.getPlatform(),
        h.getAmountCents(),
        h.getMarketValueCents(),
        h.getNote(),
        h.getCreatedAt());
  }

  @DeleteMapping("/{id}")
  @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(Authentication auth, @PathVariable UUID id) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    HoldingEntity h =
        holdingRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Holding not found"));
    if (!h.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Holding not found");
    }
    holdingRepo.delete(h);
  }
}

