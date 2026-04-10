package com.fintrack.repo;

import com.fintrack.domain.PaymentModeEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentModeRepo extends JpaRepository<PaymentModeEntity, UUID> {
  List<PaymentModeEntity> findAllByUser_IdOrderByNameAsc(UUID userId);

  Optional<PaymentModeEntity> findByUser_IdAndNameIgnoreCase(UUID userId, String name);

  boolean existsByUser_IdAndNameIgnoreCase(UUID userId, String name);
}
