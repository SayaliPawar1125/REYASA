package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.entities.AboutUs;
import com.reyasa.reyasa_backend.services.AboutUsService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/about")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AboutUsController {

    private final AboutUsService aboutUsService;

    // Public endpoint: visitors can read the About Us page.
    @GetMapping
    public ResponseEntity<AboutUs> getAboutUs() {
        return ResponseEntity.ok(aboutUsService.getAboutUs());
    }

    // Only administrators can update About Us content.
    @PutMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AboutUs> updateAboutUs(
            @Valid @RequestBody AboutUsRequest request) {

        AboutUs about = new AboutUs();

        about.setTitle(request.title());
        about.setParagraph1(request.paragraph1());
        about.setParagraph2(request.paragraph2());
        about.setParagraph3(request.paragraph3());
        about.setParagraph4(request.paragraph4());
        about.setTagline(request.tagline());
        about.setSignature(request.signature());

        return ResponseEntity.ok(
                aboutUsService.updateAboutUs(about)
        );
    }

    public record AboutUsRequest(
            @NotBlank String title,
            @NotBlank String paragraph1,
            @NotBlank String paragraph2,
            @NotBlank String paragraph3,
            @NotBlank String paragraph4,
            @NotBlank String tagline,
            @NotBlank String signature
    ) {}
}