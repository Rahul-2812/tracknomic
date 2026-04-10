package com.fintrack.web;

import com.fintrack.domain.HoldingEntity;
import com.fintrack.domain.PayableEntity;
import com.fintrack.domain.PayablePaymentEntity;
import com.fintrack.domain.ReceivableEntity;
import com.fintrack.domain.ReceivablePaymentEntity;
import com.fintrack.domain.SettlementSupport;
import com.fintrack.domain.ValuationSnapshotEntity;
import com.fintrack.domain.UserEntity;
import com.fintrack.domain.TransactionType;
import com.fintrack.repo.HoldingRepo;
import com.fintrack.repo.PayablePaymentRepo;
import com.fintrack.repo.PayableRepo;
import com.fintrack.repo.ReceivablePaymentRepo;
import com.fintrack.repo.ReceivableRepo;
import com.fintrack.repo.UserRepo;
import com.fintrack.repo.ValuationSnapshotRepo;
import com.fintrack.security.JwtPrincipal;
import com.fintrack.web.dto.WealthDtos.CreateValuationSnapshotRequest;
import com.fintrack.web.dto.WealthDtos.ValuationSnapshotResponse;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/valuation-snapshots")
public class ValuationSnapshotController {
  private final HoldingRepo holdingRepo;
  private final PayableRepo payableRepo;
  private final PayablePaymentRepo payablePaymentRepo;
  private final ReceivableRepo receivableRepo;
  private final ReceivablePaymentRepo receivablePaymentRepo;
  private final ValuationSnapshotRepo valuationSnapshotRepo;
  private final UserRepo userRepo;

  public ValuationSnapshotController(
      HoldingRepo holdingRepo,
      PayableRepo payableRepo,
      PayablePaymentRepo payablePaymentRepo,
      ReceivableRepo receivableRepo,
      ReceivablePaymentRepo receivablePaymentRepo,
      ValuationSnapshotRepo valuationSnapshotRepo,
      UserRepo userRepo) {
    this.holdingRepo = holdingRepo;
    this.payableRepo = payableRepo;
    this.payablePaymentRepo = payablePaymentRepo;
    this.receivableRepo = receivableRepo;
    this.receivablePaymentRepo = receivablePaymentRepo;
    this.valuationSnapshotRepo = valuationSnapshotRepo;
    this.userRepo = userRepo;
  }

  @PostMapping
  @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
  public ValuationSnapshotResponse createOrUpdate(
      Authentication auth, @Valid @RequestBody CreateValuationSnapshotRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    UserEntity user =
        userRepo.findById(p.userId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));

    LocalDate snapshotDate = req.snapshotDate();

    long assetsCents = holdingRepo.findAllByUser_IdOrderByCreatedAtDesc(p.userId()).stream()
        .filter(h -> h.getCategory() != null && h.getCategory().getType() == TransactionType.ASSET)
        .mapToLong(HoldingEntity::getAmountCents)
        .sum();

    Map<UUID, Long> payablePaymentsById =
      payablePaymentRepo.findAllByPayable_User_IdOrderByPaymentDateAscCreatedAtAsc(p.userId()).stream()
        .collect(Collectors.groupingBy(payment -> payment.getPayable().getId(), Collectors.summingLong(PayablePaymentEntity::getAmountCents)));

    List<PayableEntity> payables = payableRepo.findAllByUser_IdOrderByDueDateAsc(p.userId());

    long pendingPayablesCents =
      payables.stream()
        .filter(pi -> !pi.getDueDate().isAfter(snapshotDate))
        .mapToLong(
          pi ->
            SettlementSupport.outstandingCents(
              pi.getAmountCents(),
              SettlementSupport.payableSettledCents(pi, payablePaymentsById.getOrDefault(pi.getId(), 0L))))
        .sum();

    Map<UUID, Long> receivablePaymentsById =
      receivablePaymentRepo.findAllByReceivable_User_IdOrderByPaymentDateAscCreatedAtAsc(p.userId()).stream()
        .collect(
          Collectors.groupingBy(
            payment -> payment.getReceivable().getId(), Collectors.summingLong(ReceivablePaymentEntity::getAmountCents)));

    List<ReceivableEntity> receivables = receivableRepo.findAllByUser_IdOrderByExpectedOnAsc(p.userId());

    long pendingReceivablesCents =
      receivables.stream()
        .filter(ri -> !ri.getExpectedOn().isAfter(snapshotDate))
        .mapToLong(
          ri ->
            SettlementSupport.outstandingCents(
              ri.getAmountCents(),
              SettlementSupport.receivableSettledCents(ri, receivablePaymentsById.getOrDefault(ri.getId(), 0L))))
        .sum();

    long netWorthCents = assetsCents - pendingPayablesCents + pendingReceivablesCents;

    // In this first version, "totalPortfolioValue" is treated as assetsCents (assets only).
    // Later we can evolve this to include liabilities/other components.
    long totalPortfolioValueCents = assetsCents;

    var existing =
        valuationSnapshotRepo.findByUser_IdAndHoldingIsNullAndSnapshotDate(p.userId(), snapshotDate);

    ValuationSnapshotEntity snapshot = existing.orElseGet(() -> {
      ValuationSnapshotEntity s = new ValuationSnapshotEntity();
      s.setId(UUID.randomUUID());
      s.setUser(user);
      s.setSnapshotDate(snapshotDate);
      s.setHolding(null);
      return s;
    });

    snapshot.setAssetsCents(assetsCents);
    snapshot.setPendingPayablesCents(pendingPayablesCents);
    snapshot.setPendingReceivablesCents(pendingReceivablesCents);
    snapshot.setNetWorthCents(netWorthCents);
    snapshot.setTotalPortfolioValueCents(totalPortfolioValueCents);
    snapshot.setCreatedAt(existing.isPresent() ? snapshot.getCreatedAt() : Instant.now());

    valuationSnapshotRepo.save(snapshot);

    return new ValuationSnapshotResponse(
        snapshot.getId(),
        snapshot.getSnapshotDate(),
        snapshot.getAssetsCents(),
        snapshot.getPendingPayablesCents(),
        snapshot.getPendingReceivablesCents(),
        snapshot.getNetWorthCents(),
        snapshot.getTotalPortfolioValueCents(),
        snapshot.getCreatedAt());
  }
}

