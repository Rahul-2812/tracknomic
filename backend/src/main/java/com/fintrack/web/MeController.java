package com.fintrack.web;

import com.fintrack.security.JwtPrincipal;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class MeController {
  @GetMapping("/me")
  public Map<String, Object> me(Authentication authentication) {
    JwtPrincipal p = (JwtPrincipal) authentication.getPrincipal();
    return Map.of("userId", p.userId(), "email", p.email());
  }
}

