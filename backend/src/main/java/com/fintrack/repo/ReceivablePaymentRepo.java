package com.fintrack.repo;

import com.fintrack.domain.ReceivablePaymentEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReceivablePaymentRepo extends JpaRepository<ReceivablePaymentEntity, UUID> {
  List<ReceivablePaymentEntity> findAllByReceivable_User_IdOrderByPaymentDateAscCreatedAtAsc(UUID userId);

  List<ReceivablePaymentEntity> findAllByReceivable_IdOrderByPaymentDateAscCreatedAtAsc(UUID receivableId);

  void deleteByReceivable_Id(UUID receivableId);
}
