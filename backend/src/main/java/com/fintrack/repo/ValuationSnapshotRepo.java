package com.fintrack.repo;

import com.fintrack.domain.ValuationSnapshotEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ValuationSnapshotRepo extends JpaRepository<ValuationSnapshotEntity, UUID> {
  List<ValuationSnapshotEntity>
      findAllByUser_IdAndHoldingIsNullAndSnapshotDateBetweenOrderBySnapshotDateAsc(
          UUID userId, LocalDate from, LocalDate to);

  Optional<ValuationSnapshotEntity>
      findByUser_IdAndHoldingIsNullAndSnapshotDate(UUID userId, LocalDate snapshotDate);
}

