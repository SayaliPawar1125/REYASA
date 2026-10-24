
package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.entities.HomePageVideo;
import com.reyasa.reyasa_backend.services.HomePageVideoService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
public class HomePageVideoController {

    private final HomePageVideoService service;

    public HomePageVideoController(HomePageVideoService service) {
        this.service = service;
    }

    // Public: return active videos only.
    @GetMapping("/api/videos")
    public List<HomePageVideo> getActiveVideos() {
        return service.getActiveVideos();
    }

    // Admin: return all videos.
    @GetMapping("/api/admin/videos")
    @PreAuthorize("hasRole('ADMIN')")
    public List<HomePageVideo> getAllVideos() {
        return service.getAllVideos();
    }

    @GetMapping("/api/admin/videos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public HomePageVideo getById(@PathVariable Long id) {
        return service.getById(id);
    }

    // Existing JSON create endpoint.
    @PostMapping("/api/admin/videos")
    @PreAuthorize("hasRole('ADMIN')")
    public HomePageVideo create(
            @Valid @RequestBody HomePageVideo video) {
        return service.create(video);
    }

    // Upload a new video from the admin's computer.
    @PostMapping(
            value = "/api/admin/videos/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HomePageVideo> uploadVideo(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false)
            String description,
            @RequestParam(value = "displayOrder", defaultValue = "0")
            Integer displayOrder,
            @RequestParam(value = "active", defaultValue = "true")
            Boolean active,
            @RequestParam("videoFile") MultipartFile videoFile,
            @RequestParam(value = "posterFile", required = false)
            MultipartFile posterFile) {

        HomePageVideo savedVideo = service.uploadVideo(
                title,
                description,
                displayOrder,
                active,
                videoFile,
                posterFile
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedVideo);
    }

    // Replace or edit an existing homepage video.
    @PutMapping(
            value = "/api/admin/videos/{id}/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('ADMIN')")
    public HomePageVideo replaceVideo(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false)
            String description,
            @RequestParam(value = "displayOrder", defaultValue = "0")
            Integer displayOrder,
            @RequestParam(value = "active", defaultValue = "true")
            Boolean active,
            @RequestParam(value = "videoFile", required = false)
            MultipartFile videoFile,
            @RequestParam(value = "posterFile", required = false)
            MultipartFile posterFile) {

        return service.replaceVideo(
                id,
                title,
                description,
                displayOrder,
                active,
                videoFile,
                posterFile
        );
    }

    // Existing JSON update endpoint.
    @PutMapping("/api/admin/videos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public HomePageVideo update(
            @PathVariable Long id,
            @Valid @RequestBody HomePageVideo video) {
        return service.update(id, video);
    }

    @PatchMapping("/api/admin/videos/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public HomePageVideo updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request) {

        Boolean active = request.get("active");

        if (active == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The active field is required"
            );
        }

        return service.updateStatus(id, active);
    }

    @DeleteMapping("/api/admin/videos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> delete(@PathVariable Long id) {
        service.delete(id);
        return Map.of(
                "message",
                "Homepage video deleted successfully"
        );
    }
}
