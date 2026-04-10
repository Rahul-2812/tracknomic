package com.fintrack.repo;

import com.fintrack.domain.TransactionEntity;
import com.fintrack.domain.TransactionType;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransactionRepo extends JpaRepository<TransactionEntity, UUID> {
  List<TransactionEntity> findAllByUser_IdAndOccurredOnBetweenOrderByOccurredOnDescCreatedAtDesc(
      UUID userId, LocalDate from, LocalDate to);

  @Query(
      """
      select coalesce(sum(t.amountCents), 0)
      from TransactionEntity t
      where t.user.id = :userId
        and t.type = :type
        and t.occurredOn between :from and :to
      """)
  long sumAmountCentsByTypeAndDateRange(
      @Param("userId") UUID userId,
      @Param("type") TransactionType type,
      @Param("from") LocalDate from,
      @Param("to") LocalDate to);
}

