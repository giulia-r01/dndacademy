package com.giulia.dndacademy.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AvatarStorageTest {
    Cloudinary cloud = mock(Cloudinary.class);
    Uploader uploader = mock(Uploader.class);
    CloudinaryImageUploadServiceImpl images = new CloudinaryImageUploadServiceImpl(cloud);

    @Test void replaceUsesStablePerUserAssetAndRestrictsFormats() throws Exception {
        when(cloud.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenAnswer(call -> {
            Map options = call.getArgument(1);
            assertEquals("dndacademy/avatars/user-15", options.get("public_id"));
            assertEquals(true, options.get("overwrite"));
            assertEquals(true, options.get("invalidate"));
            assertEquals(java.util.List.of("jpg", "png", "webp"), options.get("allowed_formats"));
            return Map.of("secure_url", "https://example.test/v2/avatar.png");
        });
        assertEquals("https://example.test/v2/avatar.png", images.uploadUserImage(
                new MockMultipartFile("file", "a.png", "image/png", new byte[]{1}), 15L));
    }
    @Test void emptyOversizedAndWrongTypesAreRejectedBeforeContactingStorage() {
        for (MockMultipartFile file : java.util.List.of(
                new MockMultipartFile("file", "a.png", "image/png", new byte[0]),
                new MockMultipartFile("file", "a.png", "image/png", new byte[5 * 1024 * 1024 + 1]),
                new MockMultipartFile("file", "a.svg", "image/svg+xml", new byte[]{1}))) {
            assertThrows(RuntimeException.class, () -> images.uploadUserImage(file, 15L));
        }
        verifyNoInteractions(cloud);
    }
    @Test void removalIsIdempotentAndInvalidatesCachedAsset() throws Exception {
        when(cloud.uploader()).thenReturn(uploader);
        when(uploader.destroy(eq("dndacademy/avatars/user-15"), anyMap()))
                .thenReturn(Map.of("result", "ok"), Map.of("result", "not found"));
        images.deleteUserImage(15L);
        images.deleteUserImage(15L);
        verify(uploader, times(2)).destroy(eq("dndacademy/avatars/user-15"), argThat(options -> Boolean.TRUE.equals(options.get("invalidate"))));
    }
}
