package com.fintrack.web;

import com.fintrack.domain.CategoryEntity;
import com.fintrack.domain.ContactEntity;
import com.fintrack.domain.PaymentModeEntity;
import com.fintrack.domain.PayableEntity;
import com.fintrack.domain.PayablePaymentEntity;
import com.fintrack.domain.PayableStatus;
import com.fintrack.domain.SettlementSupport;
import com.fintrack.domain.TransactionType;
import com.fintrack.repo.CategoryRepo;
import com.fintrack.repo.ContactRepo;
import com.fintrack.repo.PayablePaymentRepo;
import com.fintrack.repo.PayableRepo;
import com.fintrack.repo.PaymentModeRepo;
import com.fintrack.repo.UserRepo;
import com.fintrack.security.JwtPrincipal;
import com.fintrack.web.dto.WealthDtos.CreatePayableRequest;
import com.fintrack.web.dto.WealthDtos.CreateSettlementRequest;
import com.fintrack.web.dto.WealthDtos.PayableResponse;
import com.fintrack.web.dto.WealthDtos.SettlementResponse;
import com.fintrack.web.dto.WealthDtos.UpdatePayableRequest;
import com.fintrack.web.dto.WealthDtos.UpdatePayableStatusRequest;
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
@RequestMapping("/api/payables")
public class PayableController {
  private final PayableRepo payableRepo;
  private final PayablePaymentRepo payablePaymentRepo;
  private final PaymentModeRepo paymentModeRepo;
  private final CategoryRepo categoryRepo;
  private final ContactRepo contactRepo;
  private final UserRepo userRepo;

  public PayableController(
      PayableRepo payableRepo,
      PayablePaymentRepo payablePaymentRepo,
      PaymentModeRepo paymentModeRepo,
      CategoryRepo categoryRepo,
      ContactRepo contactRepo,
      UserRepo userRepo) {
    this.payableRepo = payableRepo;
    this.payablePaymentRepo = payablePaymentRepo;
    this.paymentModeRepo = paymentModeRepo;
    this.categoryRepo = categoryRepo;
    this.contactRepo = contactRepo;
    this.userRepo = userRepo;
  }

  @GetMapping
  public List<PayableResponse> list(Authentication auth) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    Map<UUID, List<PayablePaymentEntity>> paymentsByPayableId =
        payablePaymentRepo.findAllByPayable_User_IdOrderByPaymentDateAscCreatedAtAsc(p.userId()).stream()
            .collect(Collectors.groupingBy(payment -> payment.getPayable().getId()));

    return payableRepo.findAllByUser_IdOrderByDueDateAsc(p.userId()).stream()
        .map(pi -> toResponse(pi, paymentsByPayableId.getOrDefault(pi.getId(), List.of())))
        .toList();
  }

  @PostMapping
  @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
  public PayableResponse create(Authentication auth, @Valid @RequestBody CreatePayableRequest req) {
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
    if (category.getType() != TransactionType.PAYABLE) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category must be of type PAYABLE");
    }

    ContactEntity contact =
        contactRepo
            .findById(req.contactId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact not found"));
    if (!contact.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact does not belong to user");
    }

    PayableEntity entity = new PayableEntity();
    entity.setId(UUID.randomUUID());
    entity.setUser(user);
    entity.setCategory(category);
    entity.setContact(contact);
    entity.setCounterparty(contact.getName());
    entity.setAmountCents(req.amountCents());
    entity.setDueDate(req.dueDate());
    entity.setStatus(PayableStatus.PENDING);
    entity.setNote(req.note());
    entity.setCreatedAt(Instant.now());

    payableRepo.save(entity);

    return toResponse(entity, List.of());
  }

  @PostMapping("/{id}/payments")
  @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
  public PayableResponse recordPayment(
      Authentication auth,
      @PathVariable("id") UUID id,
      @Valid @RequestBody CreateSettlementRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    PayableEntity entity =
        payableRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payable not found"));

    if (!entity.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payable does not belong to user");
    }

    PaymentModeEntity paymentMode =
        paymentModeRepo
            .findById(req.paymentModeId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment mode not found"));
    if (!paymentMode.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment mode does not belong to user");
    }

    List<PayablePaymentEntity> existingPayments = payablePaymentRepo.findAllByPayable_IdOrderByPaymentDateAscCreatedAtAsc(id);
    long alreadyPaidCents =
        SettlementSupport.payableSettledCents(
            entity, existingPayments.stream().mapToLong(PayablePaymentEntity::getAmountCents).sum());
    long outstandingCents = SettlementSupport.outstandingCents(entity.getAmountCents(), alreadyPaidCents);
    if (req.amountCents() > outstandingCents) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment exceeds outstanding balance");
    }

    PayablePaymentEntity payment = new PayablePaymentEntity();
    payment.setId(UUID.randomUUID());
    payment.setPayable(entity);
    payment.setPaymentMode(paymentMode);
    payment.setAmountCents(req.amountCents());
    payment.setPaymentDate(req.paymentDate());
    payment.setNote(req.note());
    payment.setCreatedAt(Instant.now());
    payablePaymentRepo.save(payment);

    long updatedPaidCents = alreadyPaidCents + payment.getAmountCents();
    entity.setStatus(SettlementSupport.payableStatus(entity.getAmountCents(), updatedPaidCents));
    payableRepo.save(entity);

    return toResponse(entity, payablePaymentRepo.findAllByPayable_IdOrderByPaymentDateAscCreatedAtAsc(id));
  }

  @PostMapping("/{id}/status")
  public PayableResponse updateStatus(
      Authentication auth,
      @PathVariable("id") UUID id,
      @Valid @RequestBody UpdatePayableStatusRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    PayableEntity entity =
        payableRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payable not found"));

    if (!entity.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payable does not belong to user");
    }

    throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST, "Manual status updates are no longer supported. Record a payment instead.");
    }

  @PutMapping("/{id}")
  public PayableResponse update(
      Authentication auth,
      @PathVariable("id") UUID id,
      @Valid @RequestBody UpdatePayableRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    PayableEntity entity =
        payableRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payable not found"));
    if (!entity.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Payable does not belong to user");
    }

    CategoryEntity category =
        categoryRepo
            .findById(req.categoryId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
    if (!category.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category does not belong to user");
    }
    if (category.getType() != TransactionType.PAYABLE) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category must be of type PAYABLE");
    }

    ContactEntity contact =
        contactRepo
            .findById(req.contactId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact not found"));
    if (!contact.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact does not belong to user");
    }

    entity.setCategory(category);
    entity.setContact(contact);
    entity.setCounterparty(contact.getName());
    entity.setAmountCents(req.amountCents());
    entity.setDueDate(req.dueDate());
    entity.setNote(req.note());
    payableRepo.save(entity);

    List<PayablePaymentEntity> payments =
        payablePaymentRepo.findAllByPayable_IdOrderByPaymentDateAscCreatedAtAsc(id);
    return toResponse(entity, payments);
  }

  @Transactional
  @DeleteMapping("/{id}")
  @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(Authentication auth, @PathVariable("id") UUID id) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    PayableEntity entity =
        payableRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payable not found"));
    if (!entity.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Payable does not belong to user");
    }
    payablePaymentRepo.deleteByPayable_Id(id);
    payableRepo.delete(entity);
  }

    private PayableResponse toResponse(PayableEntity entity, List<PayablePaymentEntity> payments) {
    long rawPaidCents = payments.stream().mapToLong(PayablePaymentEntity::getAmountCents).sum();
    long paidCents = SettlementSupport.payableSettledCents(entity, rawPaidCents);
    long outstandingCents = SettlementSupport.outstandingCents(entity.getAmountCents(), paidCents);
    PayableStatus status = SettlementSupport.payableStatus(entity.getAmountCents(), paidCents);

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

    return new PayableResponse(
      entity.getId(),
      entity.getCategory().getId(),
      entity.getCategory().getName(),
      entity.getContact() == null ? null : entity.getContact().getId(),
      entity.getContact() == null ? entity.getCounterparty() : entity.getContact().getName(),
      entity.getAmountCents(),
      paidCents,
      outstandingCents,
      entity.getDueDate(),
      status.name(),
      entity.getNote(),
      entity.getCreatedAt(),
      paymentResponses);
  }
}

