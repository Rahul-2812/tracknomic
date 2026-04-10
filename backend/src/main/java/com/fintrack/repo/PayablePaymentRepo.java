package com.fintrack.repo;

import com.fintrack.domain.PayablePaymentEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayablePaymentRepo extends JpaRepository<PayablePaymentEntity, UUID> {
  List<PayablePaymentEntity> findAllByPayable_User_IdOrderByPaymentDateAscCreatedAtAsc(UUID userId);

  List<PayablePaymentEntity> findAllByPayable_IdOrderByPaymentDateAscCreatedAtAsc(UUID payableId);

  void deleteByPayable_Id(UUID payableId);
}
