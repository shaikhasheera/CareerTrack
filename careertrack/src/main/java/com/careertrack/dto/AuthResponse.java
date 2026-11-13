
package com.careertrack.dto;

public record AuthResponse(
        Integer id,
        String fullName,
        String email,
        String token
) {
}
