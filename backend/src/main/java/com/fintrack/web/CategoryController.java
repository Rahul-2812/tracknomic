package com.fintrack.web;

import com.fintrack.domain.CategoryEntity;
import com.fintrack.repo.CategoryRepo;
import com.fintrack.repo.UserRepo;
import com.fintrack.security.JwtPrincipal;
import com.fintrack.web.dto.CategoryDtos.CategoryResponse;
import com.fintrack.web.dto.CategoryDtos.CreateCategoryRequest;
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
@RequestMapping("/api/categories")
public class CategoryController {
  private final CategoryRepo categoryRepo;
  private final UserRepo userRepo;

  public CategoryController(CategoryRepo categoryRepo, UserRepo userRepo) {
    this.categoryRepo = categoryRepo;
    this.userRepo = userRepo;
  }

  @GetMapping
  public List<CategoryResponse> list(Authentication auth) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    return categoryRepo.findAllByUser_IdOrderByTypeAscNameAsc(p.userId()).stream()
        .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getType()))
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CategoryResponse create(Authentication auth, @Valid @RequestBody CreateCategoryRequest req) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    if (categoryRepo.existsByUser_IdAndNameIgnoreCaseAndType(p.userId(), req.name(), req.type())) {
      throw new IllegalArgumentException("Category already exists");
    }
    var user =
        userRepo.findById(p.userId()).orElseThrow(() -> new IllegalArgumentException("User not found"));
    var c = new CategoryEntity();
    c.setId(UUID.randomUUID());
    c.setUser(user);
    c.setName(req.name().trim());
    c.setType(req.type());
    c.setCreatedAt(Instant.now());
    categoryRepo.save(c);
    return new CategoryResponse(c.getId(), c.getName(), c.getType());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(Authentication auth, @PathVariable UUID id) {
    JwtPrincipal p = (JwtPrincipal) auth.getPrincipal();
    CategoryEntity c =
        categoryRepo
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    if (!c.getUser().getId().equals(p.userId())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found");
    }
    try {
      categoryRepo.delete(c);
    } catch (Exception e) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Category is in use and cannot be deleted");
    }
  }
}

