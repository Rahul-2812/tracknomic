package com.fintrack.web;

import com.fintrack.domain.UserEntity;
import com.fintrack.repo.UserRepo;
import com.fintrack.security.JwtService;
import com.fintrack.web.dto.AuthDtos.AuthResponse;
import com.fintrack.web.dto.AuthDtos.LoginRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final UserRepo userRepo;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final String adminEmail;
  private final String adminUsername;

  public AuthController(
      UserRepo userRepo,
      PasswordEncoder passwordEncoder,
      JwtService jwtService,
      @Value("${app.admin.email}") String adminEmail,
      @Value("${app.admin.username:admin}") String adminUsername) {
    this.userRepo = userRepo;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.adminEmail = adminEmail.trim().toLowerCase();
    this.adminUsername = adminUsername.trim().toLowerCase();
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest req) {
    if (!adminUsername.equals(req.username().trim().toLowerCase())) {
      throw new IllegalArgumentException("Invalid credentials");
    }
    UserEntity u =
        userRepo
            .findByEmailIgnoreCase(adminEmail)
            .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
    if (!passwordEncoder.matches(req.password(), u.getPasswordHash())) {
      throw new IllegalArgumentException("Invalid credentials");
    }
    return new AuthResponse(jwtService.mintAccessToken(u.getId(), u.getEmail()));
  }
}

