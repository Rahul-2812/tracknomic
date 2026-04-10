package com.fintrack.web;

import com.fintrack.domain.UserEntity;
import com.fintrack.domain.UserSettingsEntity;
import com.fintrack.repo.UserRepo;
import com.fintrack.repo.UserSettingsRepo;
import com.fintrack.security.JwtPrincipal;
import com.fintrack.web.dto.SettingsDtos.SettingsResponse;
import com.fintrack.web.dto.SettingsDtos.UpdateSettingsRequest;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
  private final UserSettingsRepo userSettingsRepo;
  private final UserRepo userRepo;
  private final String adminEmail;

  public SettingsController(
      UserSettingsRepo userSettingsRepo,
      UserRepo userRepo,
      @Value("${app.admin.email}") String adminEmail) {
    this.userSettingsRepo = userSettingsRepo;
    this.userRepo = userRepo;
    this.adminEmail = adminEmail;
  }

  @GetMapping
  public SettingsResponse get(Authentication auth) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    var settings =
        userSettingsRepo.findById(p.userId()).orElseGet(() -> createDefault(p.userId()));

    return toResponse(settings);
  }

  @PostMapping
  @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
  public SettingsResponse update(
      Authentication auth, @Valid @RequestBody UpdateSettingsRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();

    // Ensure user exists (defensive, should always be true with JWT).
    UserEntity user =
        userRepo
            .findById(p.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));

    UserSettingsEntity settings =
        userSettingsRepo.findById(user.getId()).orElseGet(() -> createDefault(user.getId()));

    settings.setSummaryRecipientEmail(req.summaryRecipientEmail().trim().toLowerCase());
    settings.setAssetsCategoriesEnabled(req.assetsCategoriesEnabled());
    settings.setPayablesCategoriesEnabled(req.payablesCategoriesEnabled());
    settings.setReceivablesCategoriesEnabled(req.receivablesCategoriesEnabled());

    settings = userSettingsRepo.save(settings);
    return toResponse(settings);
  }

  private UserSettingsEntity createDefault(UUID userId) {
    var s = new UserSettingsEntity();
    s.setUserId(userId);
    s.setSummaryRecipientEmail(adminEmail.trim().toLowerCase());
    s.setAssetsCategoriesEnabled(true);
    s.setPayablesCategoriesEnabled(true);
    s.setReceivablesCategoriesEnabled(true);
    s.setCreatedAt(Instant.now());
    return userSettingsRepo.save(s);
  }

  private SettingsResponse toResponse(UserSettingsEntity s) {
    return new SettingsResponse(
        s.getUserId(),
        s.getSummaryRecipientEmail(),
        s.isAssetsCategoriesEnabled(),
        s.isPayablesCategoriesEnabled(),
        s.isReceivablesCategoriesEnabled(),
        s.getCreatedAt());
  }
}

