package com.fintrack.web;

import com.fintrack.domain.HoldingEntity;
import com.fintrack.domain.PayableEntity;
import com.fintrack.domain.PayablePaymentEntity;
import com.fintrack.domain.ReceivableEntity;
import com.fintrack.domain.ReceivablePaymentEntity;
import com.fintrack.domain.SettlementSupport;
import com.fintrack.domain.TransactionType;
import com.fintrack.domain.ValuationSnapshotEntity;
import com.fintrack.repo.HoldingRepo;
import com.fintrack.repo.PayablePaymentRepo;
import com.fintrack.repo.PayableRepo;
import com.fintrack.repo.ReceivablePaymentRepo;
import com.fintrack.repo.ReceivableRepo;
import com.fintrack.repo.ValuationSnapshotRepo;
import com.fintrack.security.JwtPrincipal;
import com.fintrack.mail.SummaryEmailService;
import com.fintrack.web.dto.WealthDtos.DashboardResponse;
import com.fintrack.web.dto.WealthDtos.CategoryTotal;
import com.fintrack.web.dto.WealthDtos.PerformancePoint;
import com.fintrack.web.dto.WealthDtos.SendDashboardEmailRequest;
import com.fintrack.web.dto.WealthDtos.SendDashboardEmailResponse;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class WealthDashboardController {
  private final HoldingRepo holdingRepo;
  private final PayableRepo payableRepo;
    private final PayablePaymentRepo payablePaymentRepo;
  private final ReceivableRepo receivableRepo;
    private final ReceivablePaymentRepo receivablePaymentRepo;
  private final ValuationSnapshotRepo valuationSnapshotRepo;
  private final SummaryEmailService emailService;
    private final String summaryRecipientEmail;

  public WealthDashboardController(
      HoldingRepo holdingRepo,
      PayableRepo payableRepo,
            PayablePaymentRepo payablePaymentRepo,
      ReceivableRepo receivableRepo,
            ReceivablePaymentRepo receivablePaymentRepo,
      ValuationSnapshotRepo valuationSnapshotRepo,
            SummaryEmailService emailService,
            @Value("${app.mail.summaryRecipient}") String summaryRecipientEmail) {
    this.holdingRepo = holdingRepo;
    this.payableRepo = payableRepo;
        this.payablePaymentRepo = payablePaymentRepo;
    this.receivableRepo = receivableRepo;
        this.receivablePaymentRepo = receivablePaymentRepo;
    this.valuationSnapshotRepo = valuationSnapshotRepo;
    this.emailService = emailService;
        this.summaryRecipientEmail = summaryRecipientEmail;
  }

  @GetMapping("/dashboard")
  public DashboardResponse dashboard(
      Authentication auth,
      @RequestParam LocalDate from,
      @RequestParam LocalDate to) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();

    List<HoldingEntity> holdings = holdingRepo.findAllByUser_IdOrderByCreatedAtDesc(p.userId());
    long assetsCents = holdings.stream().mapToLong(HoldingEntity::getAmountCents).sum();

    var assetsByCategory =
        holdings.stream()
            .filter(h -> h.getCategory() != null && h.getCategory().getType() == TransactionType.ASSET)
            .collect(
                Collectors.groupingBy(
                    h -> h.getCategory().getId(),
                    Collectors.collectingAndThen(
                        Collectors.toList(),
                        list -> {
                          var c = list.get(0).getCategory();
                          long sum = list.stream().mapToLong(HoldingEntity::getAmountCents).sum();
                          return new CategoryTotal(c.getId(), c.getName(), sum);
                        })));

    Map<UUID, Long> payablePaymentsById =
        payablePaymentRepo.findAllByPayable_User_IdOrderByPaymentDateAscCreatedAtAsc(p.userId()).stream()
            .collect(Collectors.groupingBy(payment -> payment.getPayable().getId(), Collectors.summingLong(PayablePaymentEntity::getAmountCents)));

    List<PayableEntity> payables = payableRepo.findAllByUser_IdOrderByDueDateAsc(p.userId());

    long pendingPayablesCents =
        payables.stream()
            .filter(pi -> !pi.getDueDate().isBefore(from) && !pi.getDueDate().isAfter(to))
            .mapToLong(
                pi ->
                    SettlementSupport.outstandingCents(
                        pi.getAmountCents(),
                        SettlementSupport.payableSettledCents(pi, payablePaymentsById.getOrDefault(pi.getId(), 0L))))
            .sum();

    var payablesByCategory =
        payables.stream()
            .filter(pi -> !pi.getDueDate().isBefore(from) && !pi.getDueDate().isAfter(to))
            .filter(
                pi ->
                    SettlementSupport.outstandingCents(
                            pi.getAmountCents(),
                            SettlementSupport.payableSettledCents(pi, payablePaymentsById.getOrDefault(pi.getId(), 0L)))
                        > 0)
            .filter(pi -> pi.getCategory() != null && pi.getCategory().getType() == TransactionType.PAYABLE)
            .collect(
                Collectors.groupingBy(
                    pi -> pi.getCategory().getId(),
                    Collectors.collectingAndThen(
                        Collectors.toList(),
                        list -> {
                          var c = list.get(0).getCategory();
                          long sum =
                              list.stream()
                                  .mapToLong(
                                      pi ->
                                          SettlementSupport.outstandingCents(
                                              pi.getAmountCents(),
                                              SettlementSupport.payableSettledCents(
                                                  pi, payablePaymentsById.getOrDefault(pi.getId(), 0L))))
                                  .sum();
                          return new CategoryTotal(c.getId(), c.getName(), sum);
                        })));

    Map<UUID, Long> receivablePaymentsById =
        receivablePaymentRepo.findAllByReceivable_User_IdOrderByPaymentDateAscCreatedAtAsc(p.userId()).stream()
            .collect(
                Collectors.groupingBy(
                    payment -> payment.getReceivable().getId(), Collectors.summingLong(ReceivablePaymentEntity::getAmountCents)));

    List<ReceivableEntity> receivables = receivableRepo.findAllByUser_IdOrderByExpectedOnAsc(p.userId());

    long pendingReceivablesCents =
        receivables.stream()
            .filter(ri -> !ri.getExpectedOn().isBefore(from) && !ri.getExpectedOn().isAfter(to))
            .mapToLong(
                ri ->
                    SettlementSupport.outstandingCents(
                        ri.getAmountCents(),
                        SettlementSupport.receivableSettledCents(ri, receivablePaymentsById.getOrDefault(ri.getId(), 0L))))
            .sum();

    var receivablesByCategory =
        receivables.stream()
            .filter(ri -> !ri.getExpectedOn().isBefore(from) && !ri.getExpectedOn().isAfter(to))
            .filter(
                ri ->
                    SettlementSupport.outstandingCents(
                            ri.getAmountCents(),
                            SettlementSupport.receivableSettledCents(ri, receivablePaymentsById.getOrDefault(ri.getId(), 0L)))
                        > 0)
            .filter(ri -> ri.getCategory() != null && ri.getCategory().getType() == TransactionType.RECEIVABLE)
            .collect(
                Collectors.groupingBy(
                    ri -> ri.getCategory().getId(),
                    Collectors.collectingAndThen(
                        Collectors.toList(),
                        list -> {
                          var c = list.get(0).getCategory();
                          long sum =
                              list.stream()
                                  .mapToLong(
                                      ri ->
                                          SettlementSupport.outstandingCents(
                                              ri.getAmountCents(),
                                              SettlementSupport.receivableSettledCents(
                                                  ri, receivablePaymentsById.getOrDefault(ri.getId(), 0L))))
                                  .sum();
                          return new CategoryTotal(c.getId(), c.getName(), sum);
                        })));

    long netWorthCents = assetsCents - pendingPayablesCents + pendingReceivablesCents;

    List<PerformancePoint> performance =
        valuationSnapshotRepo
            .findAllByUser_IdAndHoldingIsNullAndSnapshotDateBetweenOrderBySnapshotDateAsc(
                p.userId(), from, to)
            .stream()
            .map(
                s ->
                    new PerformancePoint(
                        s.getSnapshotDate(),
                        s.getTotalPortfolioValueCents() == null ? 0 : s.getTotalPortfolioValueCents()))
            .toList();

    return new DashboardResponse(
        assetsCents,
        pendingPayablesCents,
        pendingReceivablesCents,
        netWorthCents,
        assetsByCategory.values().stream().sorted(Comparator.comparing(CategoryTotal::totalCents).reversed()).toList(),
        payablesByCategory.values().stream().sorted(Comparator.comparing(CategoryTotal::totalCents).reversed()).toList(),
        receivablesByCategory.values().stream().sorted(Comparator.comparing(CategoryTotal::totalCents).reversed()).toList(),
        performance);
  }

  @PostMapping("/dashboard/email-summary")
  public SendDashboardEmailResponse sendDashboardEmail(
      Authentication auth, @RequestBody SendDashboardEmailRequest req) {
    String emailTo = summaryRecipientEmail == null ? null : summaryRecipientEmail.trim().toLowerCase();

    if (emailTo == null || emailTo.isBlank()) {
      throw new IllegalArgumentException("Configure app.mail.summaryRecipient before sending email summaries");
    }
    var dash = dashboard(auth, req.from(), req.to());

    String subject = "Finance summary (" + req.from() + " to " + req.to() + ")";
    String body =
        "Assets: " + dash.assetsCents() + " cents\n"
            + "Pending Payables: " + dash.pendingPayablesCents() + " cents\n"
            + "Pending Receivables: " + dash.pendingReceivablesCents() + " cents\n"
            + "Net Worth: " + dash.netWorthCents() + " cents\n";

    boolean sent = emailService.send(emailTo, subject, body);
    return new SendDashboardEmailResponse(
        sent ? "Email sent to " + emailTo : "SMTP not configured; email content logged for " + emailTo);
  }
}

