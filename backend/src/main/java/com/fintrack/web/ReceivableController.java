package com.fintrack.web;

import com.fintrack.domain.CategoryEntity;
import com.fintrack.domain.ContactEntity;
import com.fintrack.domain.PaymentModeEntity;
import com.fintrack.domain.ReceivableEntity;
import com.fintrack.domain.ReceivablePaymentEntity;
import com.fintrack.domain.ReceivableStatus;
import com.fintrack.domain.SettlementSupport;
import com.fintrack.domain.TransactionType;
import com.fintrack.repo.CategoryRepo;
import com.fintrack.repo.ContactRepo;
import com.fintrack.repo.PaymentModeRepo;
import com.fintrack.repo.ReceivableRepo;
import com.fintrack.repo.ReceivablePaymentRepo;
import com.fintrack.repo.UserRepo;
import com.fintrack.security.JwtPrincipal;
import com.fintrack.web.dto.WealthDtos.CreateReceivableRequest;
import com.fintrack.web.dto.WealthDtos.CreateSettlementRequest;
import com.fintrack.web.dto.WealthDtos.ReceivableResponse;
import com.fintrack.web.dto.WealthDtos.SettlementResponse;
import com.fintrack.web.dto.WealthDtos.UpdateReceivableRequest;
import com.fintrack.web.dto.WealthDtos.UpdateReceivableStatusRequest;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
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
@RequestMapping("/api/receivables")
public class ReceivableController {
  private final ReceivableRepo receivableRepo;
  private final ReceivablePaymentRepo receivablePaymentRepo;
  private final PaymentModeRepo paymentModeRepo;
  private final CategoryRepo categoryRepo;
  private final ContactRepo contactRepo;
  private final UserRepo userRepo;

  public ReceivableController(
      ReceivableRepo receivableRepo,
      ReceivablePaymentRepo receivablePaymentRepo,
      PaymentModeRepo paymentModeRepo,
      CategoryRepo categoryRepo,
      ContactRepo contactRepo,
      UserRepo userRepo) {
    this.receivableRepo = receivableRepo;
    this.receivablePaymentRepo = receivablePaymentRepo;
    this.paymentModeRepo = paymentModeRepo;
    this.categoryRepo = categoryRepo;
    this.contactRepo = contactRepo;
    this.userRepo = userRepo;
  }

  @GetMapping
  public List<ReceivableResponse> list(Authentication auth) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    Map<UUID, List<ReceivablePaymentEntity>> paymentsByReceivableId =
        receivablePaymentRepo.findAllByReceivable_User_IdOrderByPaymentDateAscCreatedAtAsc(p.userId()).stream()
            .collect(Collectors.groupingBy(payment -> payment.getReceivable().getId()));

    return receivableRepo.findAllByUser_IdOrderByExpectedOnAsc(p.userId()).stream()
        .map(ri -> toResponse(ri, paymentsByReceivableId.getOrDefault(ri.getId(), List.of())))
        .toList();
  }

  @PostMapping
  @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
  public ReceivableResponse create(
      Authentication auth, @Valid @RequestBody CreateReceivableRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    var user =
        userRepo.findById(p.userId()).orElseThrow(() -> new IllegalArgumentException("User not found"));

    CategoryEntity category =
        categoryRepo.findById(req.categoryId()).orElseThrow(() -> new IllegalArgumentException("Category not found"));

    if (!category.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category does not belong to user");
    }
    if (category.getType() != TransactionType.RECEIVABLE) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category must be of type RECEIVABLE");
    }

    ContactEntity contact = null;
    if (req.contactId() != null) {
      contact = contactRepo.findById(req.contactId())
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact not found"));
      if (!contact.getUser().getId().equals(p.userId())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact does not belong to user");
      }
    }

    PaymentModeEntity lentMode = null;
    if (req.lentModeId() != null) {
      lentMode = paymentModeRepo.findById(req.lentModeId())
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment mode not found"));
      if (!lentMode.getUser().getId().equals(p.userId())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment mode does not belong to user");
      }
    }

    ReceivableEntity entity = new ReceivableEntity();
    entity.setId(UUID.randomUUID());
    entity.setUser(user);
    entity.setCategory(category);
    entity.setContact(contact);
    entity.setCounterparty(contact != null ? contact.getName() : null);
    entity.setAmountCents(req.amountCents());
    entity.setExpectedOn(req.expectedOn());
    entity.setStatus(ReceivableStatus.PENDING);
    entity.setNote(req.note());
    entity.setLentMode(lentMode);
    entity.setCreatedAt(Instant.now());

    receivableRepo.save(entity);

    return toResponse(entity, List.of());
  }

  @PostMapping("/{id}/payments")
  @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
  public ReceivableResponse recordCollection(
      Authentication auth,
      @PathVariable("id") UUID id,
      @Valid @RequestBody CreateSettlementRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    ReceivableEntity entity =
        receivableRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receivable not found"));

    if (!entity.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receivable does not belong to user");
    }

    PaymentModeEntity paymentMode =
        paymentModeRepo
            .findById(req.paymentModeId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment mode not found"));
    if (!paymentMode.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment mode does not belong to user");
    }

    List<ReceivablePaymentEntity> existingPayments =
        receivablePaymentRepo.findAllByReceivable_IdOrderByPaymentDateAscCreatedAtAsc(id);
    long alreadyReceivedCents =
        SettlementSupport.receivableSettledCents(
            entity, existingPayments.stream().mapToLong(ReceivablePaymentEntity::getAmountCents).sum());
    long outstandingCents = SettlementSupport.outstandingCents(entity.getAmountCents(), alreadyReceivedCents);
    if (req.amountCents() > outstandingCents) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment exceeds outstanding balance");
    }

    ReceivablePaymentEntity payment = new ReceivablePaymentEntity();
    payment.setId(UUID.randomUUID());
    payment.setReceivable(entity);
    payment.setPaymentMode(paymentMode);
    payment.setAmountCents(req.amountCents());
    payment.setPaymentDate(req.paymentDate());
    payment.setNote(req.note());
    payment.setCreatedAt(Instant.now());
    receivablePaymentRepo.save(payment);

    long updatedReceivedCents = alreadyReceivedCents + payment.getAmountCents();
    entity.setStatus(SettlementSupport.receivableStatus(entity.getAmountCents(), updatedReceivedCents));
    receivableRepo.save(entity);

    return toResponse(entity, receivablePaymentRepo.findAllByReceivable_IdOrderByPaymentDateAscCreatedAtAsc(id));
  }

  @PostMapping("/{id}/status")
  public ReceivableResponse updateStatus(
      Authentication auth,
      @PathVariable("id") UUID id,
      @Valid @RequestBody UpdateReceivableStatusRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    ReceivableEntity entity =
        receivableRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receivable not found"));

    if (!entity.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receivable does not belong to user");
    }

    throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST, "Manual status updates are no longer supported. Record a collection instead.");
    }

  @PutMapping("/{id}")
  public ReceivableResponse update(
      Authentication auth,
      @PathVariable("id") UUID id,
      @Valid @RequestBody UpdateReceivableRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    ReceivableEntity entity =
        receivableRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receivable not found"));
    if (!entity.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Receivable does not belong to user");
    }

    CategoryEntity category =
        categoryRepo
            .findById(req.categoryId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
    if (!category.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category does not belong to user");
    }
    if (category.getType() != TransactionType.RECEIVABLE) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category must be of type RECEIVABLE");
    }

    ContactEntity contact = null;
    if (req.contactId() != null) {
      contact = contactRepo.findById(req.contactId())
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact not found"));
      if (!contact.getUser().getId().equals(p.userId())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact does not belong to user");
      }
    }

    PaymentModeEntity lentMode = null;
    if (req.lentModeId() != null) {
      lentMode = paymentModeRepo.findById(req.lentModeId())
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment mode not found"));
      if (!lentMode.getUser().getId().equals(p.userId())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment mode does not belong to user");
      }
    }

    entity.setCategory(category);
    entity.setContact(contact);
    entity.setCounterparty(contact != null ? contact.getName() : null);
    entity.setAmountCents(req.amountCents());
    entity.setExpectedOn(req.expectedOn());
    entity.setNote(req.note());
    entity.setLentMode(lentMode);
    receivableRepo.save(entity);

    List<ReceivablePaymentEntity> payments =
        receivablePaymentRepo.findAllByReceivable_IdOrderByPaymentDateAscCreatedAtAsc(id);
    return toResponse(entity, payments);
  }

  @Transactional
  @DeleteMapping("/{id}")
  @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(Authentication auth, @PathVariable("id") UUID id) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    ReceivableEntity entity =
        receivableRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receivable not found"));
    if (!entity.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Receivable does not belong to user");
    }
    receivablePaymentRepo.deleteByReceivable_Id(id);
    receivableRepo.delete(entity);
  }

    private ReceivableResponse toResponse(ReceivableEntity entity, List<ReceivablePaymentEntity> payments) {
    long rawReceivedCents = payments.stream().mapToLong(ReceivablePaymentEntity::getAmountCents).sum();
    long receivedCents = SettlementSupport.receivableSettledCents(entity, rawReceivedCents);
    long outstandingCents = SettlementSupport.outstandingCents(entity.getAmountCents(), receivedCents);
    ReceivableStatus status = SettlementSupport.receivableStatus(entity.getAmountCents(), receivedCents);

    List<SettlementResponse> paymentResponses =
      payments.stream()
        .map(
          payment ->
            new SettlementResponse(
              payment.getId(),
              payment.getAmountCents(),
              payment.getPaymentDate(),
              payment.getPaymentMode().getId(),
              payment.getPaymentMode().getName(),
              payment.getNote(),
              payment.getCreatedAt()))
        .toList();

    return new ReceivableResponse(
      entity.getId(),
      entity.getCategory().getId(),
      entity.getCategory().getName(),
      entity.getContact() == null ? null : entity.getContact().getId(),
      entity.getContact() == null ? entity.getCounterparty() : entity.getContact().getName(),
      entity.getAmountCents(),
      receivedCents,
      outstandingCents,
      entity.getLentMode() == null ? null : entity.getLentMode().getId(),
      entity.getLentMode() == null ? null : entity.getLentMode().getName(),
      entity.getExpectedOn(),
      status.name(),
      entity.getNote(),
      entity.getCreatedAt(),
      paymentResponses);
  }
}

