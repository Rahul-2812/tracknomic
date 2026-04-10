package com.fintrack.repo;

import com.fintrack.domain.UserSettingsEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSettingsRepo extends JpaRepository<UserSettingsEntity, UUID> {}

