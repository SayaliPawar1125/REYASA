
package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.entities.HomePageVideo;
import com.reyasa.reyasa_backend.repositories.HomePageVideoRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class HomePageVideoService {

    private final HomePageVideoRepository repository;

    @Value("${reyasa.upload-dir:uploads}")
    private String uploadDirectory;

    public HomePageVideoService(HomePageVideoRepository repository) {
        this.repository = repository;
    }

    public List<HomePageVideo> getActiveVideos() {
        return repository.findByActiveTrueOrderByDisplayOrderAsc();
    }

    public List<HomePageVideo> getAllVideos() {
        return repository.findAllByOrderByDisplayOrderAsc();
    }

    public HomePageVideo getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Homepage video not found"
                ));
    }

    // Existing JSON create method.
    // Only one homepage video record is allowed.
    public HomePageVideo create(HomePageVideo video) {
        if (repository.count() > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only one homepage video is allowed. Edit or delete the existing video."
            );
        }

        video.setId(null);

        if (video.getDisplayOrder() == null) {
            video.setDisplayOrder(0);
        }

        return repository.save(video);
    }

    // Upload a new video and optional poster image.
    public HomePageVideo uploadVideo(
            String title,
            String description,
            Integer displayOrder,
            Boolean active,
            MultipartFile videoFile,
            MultipartFile posterFile) {

        if (repository.count() > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only one homepage video is allowed. Edit or delete the existing video first."
            );
        }

        validateTitle(title);
        validateVideoFile(videoFile);

        String savedVideoUrl = saveUploadedFile(videoFile, "videos");
        String savedPosterUrl = null;

        try {
            if (posterFile != null && !posterFile.isEmpty()) {
                savedPosterUrl = saveUploadedFile(posterFile, "posters");
            }

            HomePageVideo video = new HomePageVideo();
            video.setTitle(title.trim());
            video.setDescription(description);
            video.setVideoUrl(savedVideoUrl);
            video.setPosterImageUrl(savedPosterUrl);
            video.setDisplayOrder(displayOrder != null ? displayOrder : 0);
            video.setActive(active == null || active);

            return repository.save(video);

        } catch (RuntimeException exception) {
            deleteUploadedFile(savedVideoUrl, "videos");
            deleteUploadedFile(savedPosterUrl, "posters");
            throw exception;
        }
    }

    // Edit the existing record. Existing files are preserved
    // if replacement files are not selected.
    public HomePageVideo replaceVideo(
            Long id,
            String title,
            String description,
            Integer displayOrder,
            Boolean active,
            MultipartFile videoFile,
            MultipartFile posterFile) {

        HomePageVideo existing = getById(id);
        validateTitle(title);

        String oldVideoUrl = existing.getVideoUrl();
        String oldPosterUrl = existing.getPosterImageUrl();

        String newVideoUrl = oldVideoUrl;
        String newPosterUrl = oldPosterUrl;

        if (videoFile != null && !videoFile.isEmpty()) {
            validateVideoFile(videoFile);
            newVideoUrl = saveUploadedFile(videoFile, "videos");
        }

        if (posterFile != null && !posterFile.isEmpty()) {
            newPosterUrl = saveUploadedFile(posterFile, "posters");
        }

        existing.setTitle(title.trim());
        existing.setDescription(description);
        existing.setVideoUrl(newVideoUrl);
        existing.setPosterImageUrl(newPosterUrl);
        existing.setDisplayOrder(displayOrder != null ? displayOrder : 0);

        if (active != null) {
            existing.setActive(active);
        }

        try {
            HomePageVideo saved = repository.save(existing);

            if (!oldVideoUrl.equals(newVideoUrl)) {
                deleteUploadedFile(oldVideoUrl, "videos");
            }

            if (oldPosterUrl != null
                    && !oldPosterUrl.equals(newPosterUrl)) {
                deleteUploadedFile(oldPosterUrl, "posters");
            }

            return saved;

        } catch (RuntimeException exception) {
            if (!oldVideoUrl.equals(newVideoUrl)) {
                deleteUploadedFile(newVideoUrl, "videos");
            }

            if (newPosterUrl != null
                    && !newPosterUrl.equals(oldPosterUrl)) {
                deleteUploadedFile(newPosterUrl, "posters");
            }

            throw exception;
        }
    }

    // Existing JSON update method.
    public HomePageVideo update(Long id, HomePageVideo request) {
        HomePageVideo existing = getById(id);

        existing.setTitle(request.getTitle());
        existing.setVideoUrl(request.getVideoUrl());
        existing.setPosterImageUrl(request.getPosterImageUrl());
        existing.setDescription(request.getDescription());
        existing.setDisplayOrder(request.getDisplayOrder());
        existing.setActive(request.isActive());

        return repository.save(existing);
    }

    public HomePageVideo updateStatus(Long id, boolean active) {
        HomePageVideo video = getById(id);
        video.setActive(active);
        return repository.save(video);
    }

    public void delete(Long id) {
        HomePageVideo video = getById(id);

        repository.delete(video);

        deleteUploadedFile(video.getVideoUrl(), "videos");
        deleteUploadedFile(video.getPosterImageUrl(), "posters");
    }

    private void validateTitle(String title) {
        if (!StringUtils.hasText(title)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Video title is required"
            );
        }

        if (title.trim().length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Video title is too long"
            );
        }
    }

    private void validateVideoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select a video file"
            );
        }

        String contentType = file.getContentType();

        if (contentType == null || !contentType.startsWith("video/")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please upload a valid video file"
            );
        }
    }

    private String saveUploadedFile(
            MultipartFile file,
            String folder) {

        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            String originalFilename =
                    StringUtils.cleanPath(
                            file.getOriginalFilename() == null
                                    ? "file"
                                    : file.getOriginalFilename()
                    );

            String extension = "";

            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex >= 0) {
                extension = originalFilename.substring(dotIndex);

                if (!extension.matches("\\.[a-zA-Z0-9]{1,10}")) {
                    extension = "";
                }
            }

            String filename = UUID.randomUUID() + extension;

            Path directory = Paths.get(uploadDirectory)
                    .toAbsolutePath()
                    .normalize()
                    .resolve(folder)
                    .normalize();

            Files.createDirectories(directory);

            Path destination = directory.resolve(filename).normalize();

            if (!destination.startsWith(directory)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid upload filename"
                );
            }

            file.transferTo(destination);

            return "/uploads/" + folder + "/" + filename;

        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not save uploaded file",
                    exception
            );
        }
    }

    private void deleteUploadedFile(String fileUrl, String folder) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        String expectedPrefix = "/uploads/" + folder + "/";

        // Only delete files managed by this upload service.
        if (!fileUrl.startsWith(expectedPrefix)) {
            return;
        }

        String filename = fileUrl.substring(expectedPrefix.length());

        if (filename.isBlank() || filename.contains("/")
                || filename.contains("\\") || filename.contains("..")) {
            return;
        }

        try {
            Path directory = Paths.get(uploadDirectory)
                    .toAbsolutePath()
                    .normalize()
                    .resolve(folder)
                    .normalize();

            Path file = directory.resolve(filename).normalize();

            if (file.startsWith(directory)) {
                Files.deleteIfExists(file);
            }
        } catch (IOException exception) {
            // The database operation should not fail just because
            // an old uploaded file could not be deleted.
        }
    }
}
