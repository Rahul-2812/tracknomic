package com.fintrack.security;

import com.fintrack.domain.UserEntity;
import com.fintrack.repo.UserRepo;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminUserBootstrap implements CommandLineRunner {
  private final UserRepo userRepo;
  private final PasswordEncoder passwordEncoder;
  private final String adminEmail;
  private final String adminPassword;

  public AdminUserBootstrap(
      UserRepo userRepo,
      PasswordEncoder passwordEncoder,
      @Value("${app.admin.email}") String adminEmail,
      @Value("${app.admin.password}") String adminPassword) {
    this.userRepo = userRepo;
    this.passwordEncoder = passwordEncoder;
    this.adminEmail = adminEmail.trim().toLowerCase();
    this.adminPassword = adminPassword;
  }

  @Override
  public void run(String... args) {
    userRepo
        .findByEmailIgnoreCase(adminEmail)
        .orElseGet(
            () -> {
              var u = new UserEntity();
              u.setId(UUID.randomUUID());
              u.setEmail(adminEmail);
              u.setPasswordHash(passwordEncoder.encode(adminPassword));
              u.setCreatedAt(Instant.now());
              return userRepo.save(u);
            });
  }
}

