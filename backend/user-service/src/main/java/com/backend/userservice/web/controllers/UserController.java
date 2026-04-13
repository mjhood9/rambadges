package com.backend.userservice.web.controllers;

import com.backend.userservice.dao.dtos.SignUpRequest;
import com.backend.userservice.dao.entities.Users;
import com.backend.userservice.dao.repositories.UserRepository;
import com.backend.userservice.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Users>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Users> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/with-entite")
    public ResponseEntity<List<Users>> getUsersWithEntite() {
        List<Users> users = userService.getUsersWithEntite();
        return ResponseEntity.ok(users);
    }

    // ✅ UPDATE USER
    @PutMapping("/{id}")
    public ResponseEntity<Users> updateUser(
            @PathVariable Long id,
            @RequestBody SignUpRequest request
    ) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    // ✅ DELETE USER
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully");
    }
}
