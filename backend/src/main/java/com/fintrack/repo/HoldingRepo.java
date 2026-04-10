package com.fintrack.repo;

import com.fintrack.domain.HoldingEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HoldingRepo extends JpaRepository<HoldingEntity, UUID> {
  List<HoldingEntity> findAllByUser_IdOrderByCreatedAtDesc(UUID userId);
}

