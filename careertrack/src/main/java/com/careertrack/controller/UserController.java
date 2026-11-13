
package com.careertrack.controller;

import com.careertrack.dto.AuthResponse;
import com.careertrack.entity.User;
import com.careertrack.repository.UserRepository;
import com.careertrack.security.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserRepository repository;
    private final JwtService jwtService;

    private final BCryptPasswordEncoder encoder =
            new BCryptPasswordEncoder();

    public UserController(
            UserRepository repository,
            JwtService jwtService) {
        this.repository = repository;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public User registerUser(@RequestBody User user) {

        if (repository.existsByEmail(user.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email already registered"
            );
        }

        user.setPassword(encoder.encode(user.getPassword()));

        return repository.save(user);
    }

    @PostMapping("/login")
    public AuthResponse loginUser(@RequestBody User user) {

        User existingUser = repository.findByEmail(user.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                ));

        if (!encoder.matches(
                user.getPassword(),
                existingUser.getPassword())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        String token =
                jwtService.generateToken(existingUser.getEmail());

        return new AuthResponse(
                existingUser.getId(),
                existingUser.getFullName(),
                existingUser.getEmail(),
                token
        );
    }

    // Update logged-in user's profile
    @PutMapping("/profile")
    public User updateProfile(
            @RequestBody User updatedUser,
            @AuthenticationPrincipal User currentUser) {

        if (updatedUser.getFullName() == null ||
                updatedUser.getFullName().trim().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Full name cannot be empty"
            );
        }

        currentUser.setFullName(
                updatedUser.getFullName().trim()
        );

        return repository.save(currentUser);
    }
}
