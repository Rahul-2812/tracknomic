package com.fintrack.repo;

import com.fintrack.domain.ReceivableEntity;
import com.fintrack.domain.ReceivableStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReceivableRepo extends JpaRepository<ReceivableEntity, UUID> {
  List<ReceivableEntity> findAllByUser_IdOrderByExpectedOnAsc(UUID userId);

  List<ReceivableEntity> findAllByUser_IdAndStatusOrderByExpectedOnAsc(
      UUID userId, ReceivableStatus status);

  @Query(
      """
      select coalesce(sum(r.amountCents), 0)
      from ReceivableEntity r
      where r.user.id = :userId
        and r.status = :status
        and r.expectedOn between :from and :to
      """)
  long sumAmountCentsByUser_IdAndStatusAndExpectedOnBetween(
      @Param("userId") UUID userId,
      @Param("status") ReceivableStatus status,
      @Param("from") LocalDate from,
      @Param("to") LocalDate to);
}

