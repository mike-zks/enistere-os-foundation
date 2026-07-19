package com.enistere.core.modules.auth;

import com.enistere.core.modules.auth.dto.LoginRequestDto;
import com.enistere.core.modules.auth.dto.LoginResponseDto;
import com.enistere.core.modules.auth.dto.LogoutRequestDto;
import com.enistere.core.modules.auth.dto.MeResponseDto;
import com.enistere.core.modules.auth.dto.RefreshRequestDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody @Valid LoginRequestDto request) {
        return ResponseEntity.ok(authService.login(
            request.email(), request.password()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponseDto> me(Authentication auth) {
        return ResponseEntity.ok(authService.me(auth.getName()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) LogoutRequestDto request) {
        String refreshToken = request != null ? request.refreshToken() : null;
        authService.logout(refreshToken);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponseDto> refresh(@RequestBody @Valid RefreshRequestDto request) {
        return ResponseEntity.ok(authService.refresh(
            request.refreshToken()
        ));
    }
}
