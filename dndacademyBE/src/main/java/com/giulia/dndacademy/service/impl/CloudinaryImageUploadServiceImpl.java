package com.giulia.dndacademy.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.giulia.dndacademy.service.ImageUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryImageUploadServiceImpl implements ImageUploadService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final Cloudinary cloudinary;

    @Override
    public String uploadCharacterImage(MultipartFile file) {
        return uploadImage(file, "dndacademy/characters");
    }

    @Override
    public String uploadNpcImage(MultipartFile file) {
        return uploadImage(file, "dndacademy/npcs");
    }

    @Override
    public String uploadUserImage(MultipartFile file, Long userId) {
        validateFile(file);
        try {
            Map result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "public_id", "dndacademy/avatars/user-" + userId,
                    "overwrite", true, "invalidate", true, "resource_type", "image",
                    "allowed_formats", List.of("jpg", "png", "webp")));
            String url = (String) result.get("secure_url");
            if (url == null || !url.startsWith("https://")) throw new IOException("URL immagine non valido");
            return url;
        } catch (IOException ex) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY, "Caricamento immagine non riuscito", ex);
        }
    }

    @Override
    public void deleteUserImage(Long userId) {
        try {
            Map result = cloudinary.uploader().destroy("dndacademy/avatars/user-" + userId,
                    ObjectUtils.asMap("invalidate", true, "resource_type", "image"));
            if (!List.of("ok", "not found").contains(result.get("result"))) throw new IOException("Rimozione non riuscita");
        } catch (IOException ex) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY, "Rimozione immagine non riuscita", ex);
        }
    }

    private String uploadImage(MultipartFile file, String folder) {
        validateFile(file);

        try {
            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "image"
                    )
            );

            String secureUrl = (String) uploadResult.get("secure_url");

            if (secureUrl == null || secureUrl.isBlank()) {
                throw new RuntimeException("Errore durante il recupero dell'URL sicuro dell'immagine");
            }

            return forceHttps(secureUrl);
        } catch (IOException e) {
            throw new RuntimeException("Errore durante l'upload dell'immagine");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Il file immagine è obbligatorio");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("L'immagine non può superare 5 MB");
        }

        String contentType = file.getContentType();

        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new RuntimeException("Formato immagine non valido. Usa JPG, PNG o WEBP");
        }
    }

    private String forceHttps(String url) {
        return url == null ? null : url.replace("http://", "https://");
    }
}
