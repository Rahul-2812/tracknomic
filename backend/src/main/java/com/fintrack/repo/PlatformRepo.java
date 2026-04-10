package com.fintrack.repo;

import com.fintrack.domain.PlatformEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformRepo extends JpaRepository<PlatformEntity, UUID> {
  List<PlatformEntity> findAllByUser_IdOrderByNameAsc(UUID userId);

  Optional<PlatformEntity> findByUser_IdAndNameIgnoreCase(UUID userId, String name);

  boolean existsByUser_IdAndNameIgnoreCase(UUID userId, String name);
}

