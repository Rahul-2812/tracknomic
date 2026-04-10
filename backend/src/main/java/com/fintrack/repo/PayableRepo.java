package com.fintrack.repo;

import com.fintrack.domain.PayableEntity;
import com.fintrack.domain.PayableStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PayableRepo extends JpaRepository<PayableEntity, UUID> {
  List<PayableEntity> findAllByUser_IdOrderByDueDateAsc(UUID userId);

  List<PayableEntity> findAllByUser_IdAndStatusOrderByDueDateAsc(
      UUID userId, PayableStatus status);

  @Query(
      """
      select coalesce(sum(p.amountCents), 0)
      from PayableEntity p
      where p.user.id = :userId
        and p.status = :status
        and p.dueDate between :from and :to
      """)
  long sumAmountCentsByUser_IdAndStatusAndDueDateBetween(
      @Param("userId") UUID userId,
      @Param("status") PayableStatus status,
      @Param("from") LocalDate from,
      @Param("to") LocalDate to);
}

