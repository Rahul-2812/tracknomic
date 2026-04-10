package com.fintrack.repo;

import com.fintrack.domain.CategoryEntity;
import com.fintrack.domain.TransactionType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepo extends JpaRepository<CategoryEntity, UUID> {
  List<CategoryEntity> findAllByUser_IdOrderByTypeAscNameAsc(UUID userId);

  boolean existsByUser_IdAndNameIgnoreCaseAndType(UUID userId, String name, TransactionType type);
}

