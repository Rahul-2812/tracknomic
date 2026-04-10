package com.fintrack.web;

import com.fintrack.domain.ContactEntity;
import com.fintrack.repo.ContactRepo;
import com.fintrack.repo.UserRepo;
import com.fintrack.security.JwtPrincipal;
import com.fintrack.web.dto.ContactDtos.ContactResponse;
import com.fintrack.web.dto.ContactDtos.CreateContactRequest;
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
@RequestMapping("/api/contacts")
public class ContactController {
  private final ContactRepo contactRepo;
  private final UserRepo userRepo;

  public ContactController(ContactRepo contactRepo, UserRepo userRepo) {
    this.contactRepo = contactRepo;
    this.userRepo = userRepo;
  }

  @GetMapping
  public List<ContactResponse> list(Authentication auth) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    return contactRepo.findAllByUser_IdOrderByNameAsc(p.userId()).stream()
        .map(contact -> new ContactResponse(contact.getId(), contact.getName(), contact.getCreatedAt()))
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ContactResponse create(Authentication auth, @Valid @RequestBody CreateContactRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    String name = req.name().trim();
    if (name.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact name is required");
    }
    if (contactRepo.existsByUser_IdAndNameIgnoreCase(p.userId(), name)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact already exists");
    }

    var user =
        userRepo.findById(p.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));

    ContactEntity contact = new ContactEntity();
    contact.setId(UUID.randomUUID());
    contact.setUser(user);
    contact.setName(name);
    contact.setCreatedAt(Instant.now());
    contactRepo.save(contact);

    return new ContactResponse(contact.getId(), contact.getName(), contact.getCreatedAt());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(Authentication auth, @PathVariable UUID id) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    ContactEntity contact =
        contactRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));
    if (!contact.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found");
    }
    try {
      contactRepo.delete(contact);
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Contact is in use and cannot be deleted");
    }
  }
}