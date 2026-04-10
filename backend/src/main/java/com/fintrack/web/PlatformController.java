package com.fintrack.web;

import com.fintrack.domain.PlatformEntity;
import com.fintrack.repo.PlatformRepo;
import com.fintrack.repo.UserRepo;
import com.fintrack.security.JwtPrincipal;
import com.fintrack.web.dto.PlatformDtos.CreatePlatformRequest;
import com.fintrack.web.dto.PlatformDtos.PlatformResponse;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/platforms")
public class PlatformController {
  private final PlatformRepo platformRepo;
  private final UserRepo userRepo;

  public PlatformController(PlatformRepo platformRepo, UserRepo userRepo) {
    this.platformRepo = platformRepo;
    this.userRepo = userRepo;
  }

  @GetMapping
  public List<PlatformResponse> list(Authentication auth) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    return platformRepo.findAllByUser_IdOrderByNameAsc(p.userId()).stream()
        .map(pl -> new PlatformResponse(pl.getId(), pl.getName(), pl.getCreatedAt()))
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public PlatformResponse create(Authentication auth, @Valid @RequestBody CreatePlatformRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    String name = req.name().trim();
    if (name.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Platform name is required");
    }
    if (platformRepo.existsByUser_IdAndNameIgnoreCase(p.userId(), name)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Platform already exists");
    }
    var user = userRepo.findById(p.userId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));

    PlatformEntity pl = new PlatformEntity();
    pl.setId(UUID.randomUUID());
    pl.setUser(user);
    pl.setName(name);
    pl.setCreatedAt(Instant.now());
    platformRepo.save(pl);
    return new PlatformResponse(pl.getId(), pl.getName(), pl.getCreatedAt());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(Authentication auth, @PathVariable UUID id) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    PlatformEntity pl =
        platformRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform not found"));
    if (!pl.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform not found");
    }
    platformRepo.delete(pl);
  }
}

