package com.fintrack.repo;

import com.fintrack.domain.ContactEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactRepo extends JpaRepository<ContactEntity, UUID> {
  List<ContactEntity> findAllByUser_IdOrderByNameAsc(UUID userId);

  Optional<ContactEntity> findByUser_IdAndNameIgnoreCase(UUID userId, String name);

  boolean existsByUser_IdAndNameIgnoreCase(UUID userId, String name);
}